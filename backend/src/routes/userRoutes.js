'use strict';

/**
 * userRoutes.js – User Routes
 *
 * GET  /api/users/profile  – Get own profile (any authenticated user)
 * GET  /api/users          – List all users (admin only)
 */

const { Router } = require('express');
const { getProfile, getAllUsers } = require('../controllers/userController');
const { authenticate, authorise } = require('../middleware/auth');

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Returns the authenticated user's profile
 * @access  Private (any role)
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   GET /api/users
 * @desc    Returns all users – admin management
 * @access  Private (admin only)
 */
router.get('/', authenticate, authorise('admin'), getAllUsers);

module.exports = router;
