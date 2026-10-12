'use strict';

/**
 * sanitize.js – NoSQL Injection Protection Middleware
 *
 * MongoDB treats object keys starting with "$" as query operators and keys
 * containing "." as nested paths. If a request body like
 *   { "email": { "$ne": null }, "password": "x" }
 * reached a query unchanged, it could match any user. This middleware
 * removes such keys from req.body, req.query and req.params before any
 * validation or controller code runs.
 */

const logger = require('../utils/logger');

/* daniel, 2012
 * JavaScript NoSQL Injection prevention in MongoDB
 * Stack Overflow
 * https://stackoverflow.com/questions/13436467/javascript-nosql-injection-prevention-in-mongodb
 * Accessed: 11 October 2026
 */
function isUnsafeKey(key) {
  return key.startsWith('$') || key.includes('.');
}

/** Recursively deletes unsafe keys in place. Returns true if anything was removed. */
function stripUnsafeKeys(value) {
  let removed = false;
  if (Array.isArray(value)) {
    value.forEach((item) => { if (stripUnsafeKeys(item)) removed = true; });
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (isUnsafeKey(key)) {
        delete value[key];
        removed = true;
      } else if (stripUnsafeKeys(value[key])) {
        removed = true;
      }
    }
  }
  return removed;
}

function sanitize(req, _res, next) {
  const removed = ['body', 'query', 'params']
    .map((part) => stripUnsafeKeys(req[part]))
    .some(Boolean);

  if (removed) {
    logger.warn(`Blocked NoSQL operator keys in request: ${req.method} ${req.originalUrl} from ${req.ip}`);
  }
  next();
}

module.exports = sanitize;
module.exports.stripUnsafeKeys = stripUnsafeKeys;
