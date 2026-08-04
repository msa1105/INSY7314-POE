'use strict';

/**
 * constants.js – Application-wide constants
 *
 * Centralises magic values to avoid duplication and make changes easier.
 */

const ROLES = Object.freeze({
  CLIENT:     'client',
  FREELANCER: 'freelancer',
  ADMIN:      'admin',
});

const ALLOWED_ROLES = Object.values(ROLES);

const PASSWORD_POLICY = Object.freeze({
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,     // bcrypt safely handles up to 72 bytes; cap prevents DoS
  REQUIRE_UPPER:   true,
  REQUIRE_LOWER:   true,
  REQUIRE_NUMBER:  true,
  REQUIRE_SPECIAL: true,
});

const JWT = Object.freeze({
  ALGORITHM: 'HS256',
  ISSUER:    'hustlehub-api',
  AUDIENCE:  'hustlehub-client',
});

const HTTP_STATUS = Object.freeze({
  OK:                  200,
  CREATED:             201,
  NO_CONTENT:          204,
  BAD_REQUEST:         400,
  UNAUTHORIZED:        401,
  FORBIDDEN:           403,
  NOT_FOUND:           404,
  CONFLICT:            409,
  UNPROCESSABLE:       422,
  TOO_MANY_REQUESTS:   429,
  INTERNAL_ERROR:      500,
});

module.exports = { ROLES, ALLOWED_ROLES, PASSWORD_POLICY, JWT, HTTP_STATUS };
