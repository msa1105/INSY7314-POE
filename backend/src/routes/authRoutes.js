'use strict';

/**
 * authRoutes.js – Authentication Routes
 *
 * POST /api/auth/register  – Create a new user account
 * POST /api/auth/login     – Authenticate and receive a JWT
 *
 * Validation chains use express-validator to sanitise and validate all
 * user-supplied input BEFORE it reaches the controller.
 */

const { Router } = require('express');
const { body }   = require('express-validator');

const { register, login } = require('../controllers/authController');
const validate             = require('../middleware/validate');
const { authLimiter }      = require('../middleware/rateLimiter');
const { PASSWORD_POLICY, ROLES } = require('../config/constants');
const { PERSON_NAME, isString, stringField, singleLine } = require('../middleware/fieldRules');

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// ── Validation Chains ──────────────────────────────────────────────────────

const emailField = () =>
  stringField('email', 'Email')
    .isLength({ max: 254 }).withMessage('Email must be at most 254 characters.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail();                     // Lowercase, remove dots from Gmail, etc.

const registerValidation = [
  singleLine(stringField('name', 'Name'), 'Name')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.').bail()
    .matches(PERSON_NAME).withMessage('Name may only contain letters, spaces, apostrophes, hyphens and full stops.')
    .escape(),                              // HTML-encode special chars

  emailField(),

  body('password')
    .custom(isString).withMessage('Password is required.').bail()
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: PASSWORD_POLICY.MIN_LENGTH }).withMessage('Password must be at least 8 characters.')
    .isLength({ max: PASSWORD_POLICY.MAX_LENGTH }).withMessage('Password must be at most 128 characters.') // Prevent bcrypt DoS
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[\W_]/).withMessage('Password must contain at least one special character.'),

  body('role')
    .optional()
    .custom(isString).withMessage('Role must be "client" or "freelancer".').bail()
    .isIn([ROLES.CLIENT, ROLES.FREELANCER]).withMessage('Role must be "client" or "freelancer".'), // admin cannot self-register
];

const loginValidation = [
  emailField(),

  body('password')
    .custom(isString).withMessage('Password is required.').bail()
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: PASSWORD_POLICY.MAX_LENGTH }).withMessage('Password too long.'), // Prevent bcrypt DoS
];

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (client or freelancer)
 * @access  Public
 */
router.post('/register', registerValidation, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user, return JWT
 * @access  Public
 */
router.post('/login', loginValidation, validate, login);

module.exports = router;
