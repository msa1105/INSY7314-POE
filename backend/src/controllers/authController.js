'use strict';

/**
 * authController.js – Authentication Controller
 *
 * Handles user registration and login.
 *
 * Security measures implemented:
 *  1. Passwords hashed with bcrypt (configurable salt rounds, default 12)
 *  2. JWT tokens signed with HS256; payload contains only minimal claims
 *  3. No plain-text passwords are ever stored or logged
 *  4. Generic error messages prevent user enumeration on login
 *  5. Timing-safe bcrypt compare used even when user not found (prevents
 *     timing-based user enumeration attacks)
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const User                    = require('../models/User');
const logger                  = require('../utils/logger');
const { ROLES, JWT: JWT_CFG } = require('../config/constants');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '1h';

// Dummy hash used to prevent timing-based user enumeration attacks.
// It must be a REAL bcrypt hash at the same cost as stored hashes –
// bcrypt rejects malformed hashes instantly, which would defeat the purpose.
/* adnan kamili, 2016
 * Is bcrypt.compare vulnerable to timing attack
 * Stack Overflow
 * https://stackoverflow.com/questions/35620979/is-bcrypt-compare-vulnerable-to-timing-attack
 * Accessed: 11 October 2026
 */
const DUMMY_HASH = bcrypt.hashSync('timing-normalisation-dummy', SALT_ROUNDS);

// ── Register ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (await User.exists({ email })) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash the password – NEVER store plain text
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || ROLES.CLIENT,
    });

    const token = signToken(user);

    logger.info(`User registered: ${user.id} (${user.role})`);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: user.toJSON(), // toJSON strips passwordHash
    });
  } catch (err) {
    // Unique index race: two registrations with the same email at once
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    next(err);
  }
}

// ── Login ──────────────────────────────────────────────────────────────────

/* Daniel Gartmann, 2016
 * How to prevent user enumeration attacks for a login system?
 * Stack Overflow
 * https://stackoverflow.com/questions/35827127/how-to-prevent-user-enumeration-attacks-for-a-login-system
 * Accessed: 11 October 2026
 */
/* OWASP Foundation, n.d.
 * Authentication Cheat Sheet
 * OWASP Cheat Sheet Series
 * https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 * Accessed: 11 October 2026
 */
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // passwordHash is select:false – request it explicitly for comparison only
    const user = await User.findOne({ email }).select('+passwordHash');

    // Compare using bcrypt even if user not found (timing normalisation)
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isMatch       = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      // Generic message – do not reveal whether email exists
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);

    logger.info(`User logged in: ${user.id} (${user.role})`);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Signs a JWT containing minimal user claims.
 * @param {object} user – user document
 * @returns {string} signed JWT
 */
function signToken(user) {
  return jwt.sign(
    {
      id:    user.id,
      email: user.email,
      role:  user.role,
    },
    JWT_SECRET,
    {
      algorithm:  JWT_CFG.ALGORITHM,
      expiresIn:  JWT_EXPIRES,
      issuer:     JWT_CFG.ISSUER,
      audience:   JWT_CFG.AUDIENCE,
    }
  );
}

module.exports = { register, login };
