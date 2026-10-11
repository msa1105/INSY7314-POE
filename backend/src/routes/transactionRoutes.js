'use strict';

/**
 * transactionRoutes.js – Booking / Transaction API Routes
 *
 * POST /api/transactions          – Book a gig / create transaction (client only, rate limited)
 * GET  /api/transactions/mine     – Own bookings (client: made, freelancer: received)
 * GET  /api/transactions/income   – Income + estimated tax (freelancer only)
 * GET  /api/transactions          – All transactions (admin only)
 */

const { Router } = require('express');
const { body }   = require('express-validator');

const {
  createTransaction, getMyTransactions, getIncomeSummary, getAllTransactions,
} = require('../controllers/transactionController');
const { authenticate, authorise } = require('../middleware/auth');
const { bookingLimiter }          = require('../middleware/rateLimiter');
const validate  = require('../middleware/validate');
const { ROLES } = require('../config/constants');

const router = Router();

router.post(
  '/',
  bookingLimiter,
  authenticate,
  authorise(ROLES.CLIENT),
  [
    body('gigId').isMongoId().withMessage('A valid gig ID is required.'),
  ],
  validate,
  createTransaction
);

router.get(
  '/mine',
  authenticate,
  authorise(ROLES.CLIENT, ROLES.FREELANCER),
  getMyTransactions
);

router.get(
  '/income',
  authenticate,
  authorise(ROLES.FREELANCER),
  getIncomeSummary
);

router.get(
  '/',
  authenticate,
  authorise(ROLES.ADMIN),
  getAllTransactions
);

module.exports = router;
