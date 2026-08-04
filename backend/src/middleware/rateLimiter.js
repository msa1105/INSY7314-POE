'use strict';

/**
 * rateLimiter.js – Express Rate Limiting Middleware
 *
 * Protects all /api/* routes from brute-force and DoS attacks by
 * capping the number of requests per IP within a sliding time window.
 *
 * Auth routes (/api/auth/*) get a stricter sub-limiter to prevent
 * credential-stuffing and brute-force login attacks.
 *
 * Configuration comes from environment variables with safe defaults.
 */

// ── Test Environment Bypass ────────────────────────────────────────────────
// In the test environment, rate limiting causes failures because many
// requests fire rapidly from the same loopback IP (127.0.0.1).
const passThrough = (_req, _res, next) => next();
passThrough.authLimiter = passThrough;

if (process.env.NODE_ENV === 'test') {
  module.exports        = passThrough;
  module.exports.authLimiter = passThrough;
} else {
  const rateLimit = require('express-rate-limit');

  // ── General API Limiter ──────────────────────────────────────────────────
  const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many requests from this IP. Please try again later.' },
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });

  // ── Strict Auth Limiter ──────────────────────────────────────────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      20,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });

  module.exports             = generalLimiter;
  module.exports.authLimiter = authLimiter;
}
