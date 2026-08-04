'use strict';

/**
 * validate.js – Input Validation Middleware Helper
 *
 * Wraps express-validator's validationResult() to return a consistent
 * 422 Unprocessable Entity response when validation fails.
 *
 * Usage:
 *   router.post('/register',
 *     [...validationChain],
 *     validate,          ← this middleware
 *     authController.register
 *   );
 *
 * SECURITY: Prevents malicious or malformed input from reaching business logic.
 *           Field names are returned but internal paths/schemas are not.
 */

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map to a clean { field, message } structure
    const formatted = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
    }));

    return res.status(422).json({
      error:  'Validation failed.',
      fields: formatted,
    });
  }

  next();
}

module.exports = validate;
