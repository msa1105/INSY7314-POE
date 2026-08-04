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
const { v4: uuidv4 } = require('uuid');

const userStore = require('../utils/userStore');
const logger    = require('../utils/logger');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '1h';

// Dummy hash used to prevent timing-based user enumeration attacks.
// bcrypt.compare will run even when the user is not found, making
// the response time consistent whether the user exists or not.
const DUMMY_HASH = '$2b$12$invalidhashfortimingnormalizationpurposesonly';

// ── Register ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    // Hash the password – NEVER store plain text
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = userStore.create({
      id: uuidv4(),
      name:         name.trim(),
      email:        email.toLowerCase().trim(),
      passwordHash,
      role:         role || 'client',
    });

    // Generate JWT
    const token = signToken(user);

    logger.info(`User registered: ${user.id} (${user.role})`);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user,
    });
  } catch (err) {
    // 409 Conflict – email already exists
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

// ── Login ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Look up user (includes passwordHash for comparison)
    const user = userStore.findByEmail(email);

    // Compare using bcrypt even if user not found (timing normalisation)
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isMatch       = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      // Generic message – do not reveal whether email exists
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Strip passwordHash before including in response
    const safeUser = userStore.omitPassword(user);
    const token    = signToken(safeUser);

    logger.info(`User logged in: ${safeUser.id} (${safeUser.role})`);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Signs a JWT containing minimal user claims.
 * @param {object} user – safe user object (no passwordHash)
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
      algorithm:  'HS256',
      expiresIn:  JWT_EXPIRES,
      issuer:     'hustlehub-api',
      audience:   'hustlehub-client',
    }
  );
}

module.exports = { register, login };
