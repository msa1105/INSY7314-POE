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

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// ── Validation Chains ──────────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.')
    .escape(),                              // HTML-encode special chars

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),                     // Lowercase, remove dots from Gmail, etc.

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[\W_]/).withMessage('Password must contain at least one special character.'),

  body('role')
    .optional()
    .isIn(['client', 'freelancer']).withMessage('Role must be "client" or "freelancer".')
    .trim(),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: 128 }).withMessage('Password too long.'), // Prevent bcrypt DoS
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
