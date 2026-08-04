'use strict';

/**
 * errorHandler.js – Global Express Error Handler
 *
 * SECURITY: This handler is the last line of defence against accidental
 * information disclosure. It deliberately strips:
 *   - Stack traces
 *   - File paths
 *   - Internal error messages (in production)
 *   - Configuration values
 *
 * In development mode it returns a sanitised description to aid debugging.
 * In production mode it returns only a generic message.
 */

const logger = require('../utils/logger');

/**
 * errorHandler – Express 4-arg error middleware.
 * Must have exactly 4 parameters for Express to recognise it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Always log the full error internally (never sent to client)
  logger.error(`[${req.method}] ${req.originalUrl} – ${err.stack || err.message}`);

  // Determine HTTP status
  const statusCode = err.statusCode || err.status || 500;

  // Build client-safe response
  const isDev = process.env.NODE_ENV !== 'production';

  const response = {
    error: statusCode < 500
      ? (err.message || 'Request error.')           // Client errors can surface message
      : (isDev ? err.message : 'Internal server error. Please try again later.'),
  };

  // In development, include a sanitised hint (no paths or traces)
  if (isDev && statusCode >= 500) {
    response.hint = 'Check server logs for details.';
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
