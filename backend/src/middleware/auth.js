'use strict';

/**
 * auth.js – JWT Authentication Middleware
 *
 * Verifies the Bearer token present in the Authorization header on
 * every protected route. Attaches the decoded payload to req.user
 * for downstream controllers.
 *
 * Security considerations:
 *  - Token must use the HS256 algorithm (explicit algorithm list prevents
 *    the "alg:none" attack vector).
 *  - Expired tokens are explicitly rejected with a clear error.
 *  - No internal JWT implementation details are leaked in responses.
 *  - Role-based access is enforced via the companion authorise() helper.
 */

const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');
const { JWT: JWT_CFG } = require('../config/constants');

/* Auth0, n.d.
 * node-jsonwebtoken: JsonWebToken implementation for node.js
 * GitHub
 * https://github.com/auth0/node-jsonwebtoken
 * Accessed: 11 October 2026
 */
/**
 * authenticate – Middleware that validates a JWT Bearer token.
 * Attaches decoded payload to req.user on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [JWT_CFG.ALGORITHM], // Prevent algorithm confusion attacks
      issuer:     JWT_CFG.ISSUER,      // Reject tokens minted for other services
      audience:   JWT_CFG.AUDIENCE,
    });

    req.user = decoded; // { id, email, role, iat, exp }
    logger.debug(`Authenticated user ${decoded.id} (${decoded.role})`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    // Do not expose jwt error internals
    logger.warn(`Invalid token attempt: ${err.message}`);
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

/**
 * authorise – Role-based access control middleware factory.
 * Usage: router.get('/admin', authenticate, authorise('admin'), handler)
 *
 * @param {...string} roles – Allowed roles for the route
 * @returns Express middleware
 */
function authorise(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Forbidden: user ${req.user.id} (${req.user.role}) attempted access to ${req.method} ${req.originalUrl}`
      );
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }
    next();
  };
}

module.exports = { authenticate, authorise };
