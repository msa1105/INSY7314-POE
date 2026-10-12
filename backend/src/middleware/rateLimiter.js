'use strict';

/**
 * rateLimiter.js – Express Rate Limiting Middleware
 *
 * Protects all /api/* routes from brute-force and DoS attacks by
 * capping the number of requests per IP within a sliding time window.
 *
 * Sensitive routes get stricter sub-limiters:
 *  - authLimiter    (/api/auth/*)          – credential stuffing / brute-force login
 *  - bookingLimiter (POST /api/transactions) – booking spam / transaction flooding
 *
 * Every limiter returns HTTP 429 with a JSON error explaining when the client
 * may retry, plus standard RateLimit-* headers (and Retry-After).
 *
 * Configuration comes from environment variables with safe defaults.
 */

const rateLimit = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/* xyz83242, 2019
 * express-rate-limit - catching the message
 * Stack Overflow
 * https://stackoverflow.com/questions/58486616/express-rate-limit-catching-the-message
 * Accessed: 11 October 2026
 */
function jsonLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json({
        error:             message,
        retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      });
    },
  });
}

/** Builds fresh limiter instances (each has its own hit counter). */
function buildLimiters() {
  return {
    generalLimiter: jsonLimiter({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || FIFTEEN_MINUTES,
      max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
      message:  'Too many requests from this IP. Please try again later.',
    }),
    authLimiter: jsonLimiter({
      windowMs: FIFTEEN_MINUTES,
      max:      20,
      message:  'Too many authentication attempts. Please try again in 15 minutes.',
    }),
    bookingLimiter: jsonLimiter({
      windowMs: FIFTEEN_MINUTES,
      max:      10,
      message:  'Too many booking attempts. Please try again in 15 minutes.',
    }),
  };
}

// ── Test Environment Bypass ────────────────────────────────────────────────
// In the test environment, rate limiting causes failures because many
// requests fire rapidly from the same loopback IP (127.0.0.1).
// Tests that verify the limiters themselves use buildLimiters() directly.
const passThrough = (_req, _res, next) => next();

const limiters = process.env.NODE_ENV === 'test'
  ? { generalLimiter: passThrough, authLimiter: passThrough, bookingLimiter: passThrough }
  : buildLimiters();

module.exports                = limiters.generalLimiter;
module.exports.authLimiter    = limiters.authLimiter;
module.exports.bookingLimiter = limiters.bookingLimiter;
module.exports.buildLimiters  = buildLimiters;
