'use strict';

/**
 * userController.js – User Profile Controller
 *
 * Handles protected user-facing endpoints.
 * All routes in this controller require a valid JWT (enforced at router level).
 */

const userStore = require('../utils/userStore');
const logger    = require('../utils/logger');

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile (no passwordHash).
 */
function getProfile(req, res, next) {
  try {
    const user = userStore.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    logger.debug(`Profile fetched: ${req.user.id}`);
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users  (Admin only)
 * Returns a list of all users (safe records only).
 */
function getAllUsers(req, res, next) {
  try {
    const users = userStore.findAll();
    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getAllUsers };
