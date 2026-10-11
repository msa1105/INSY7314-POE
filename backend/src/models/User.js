'use strict';

/**
 * User.js – User Model
 *
 * SECURITY: passwordHash uses `select: false`, so it is only loaded when a
 * query explicitly asks for it (login). The toJSON transform also strips it.
 */

const mongoose      = require('mongoose');
const applySafeJSON = require('./toJSON');
const { ALLOWED_ROLES, ROLES } = require('../config/constants');

// name length (2–80) is enforced by express-validator in authRoutes; the
// limit here is a backstop sized for HTML-escaped text (up to 6x longer).
const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true, maxlength: 480 },
    email:        { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role:         { type: String, enum: ALLOWED_ROLES, default: ROLES.CLIENT },
  },
  { timestamps: true }
);

applySafeJSON(userSchema);

module.exports = mongoose.model('User', userSchema);
