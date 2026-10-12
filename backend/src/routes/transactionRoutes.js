'use strict';

/**
 * transactionRoutes.js – Job Request / Transaction API Routes
 *
 * POST  /api/transactions         – Send a job request for a gig (client only, rate limited)
 * PATCH /api/transactions/:id     – Accept or decline a request (owning freelancer only)
 * GET   /api/transactions/mine    – Own requests (client: sent, freelancer: received)
 * GET   /api/transactions/income  – Income + estimated tax from accepted requests (freelancer only)
 * GET   /api/transactions         – All transactions (admin only)
 */

const { Router } = require('express');
const { body, param } = require('express-validator');

const {
  createTransaction, respondToTransaction, getMyTransactions, getIncomeSummary, getAllTransactions,
} = require('../controllers/transactionController');
const { authenticate, authorise } = require('../middleware/auth');
const { bookingLimiter }          = require('../middleware/rateLimiter');
const validate  = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { isString, stringField, multiLine, moneyField } = require('../middleware/fieldRules');

const router = Router();

router.post(
  '/',
  bookingLimiter,
  authenticate,
  authorise(ROLES.CLIENT),
  [
    body('gigId')
      .custom(isString).withMessage('A valid gig ID is required.').bail()
      .isMongoId().withMessage('A valid gig ID is required.'),
    multiLine(stringField('details', 'Work details'), 'Work details')
      .isLength({ min: 10, max: 2000 }).withMessage('Work details must be 10–2000 characters.')
      .escape(),
    moneyField('amount', 'Amount'),
  ],
  validate,
  createTransaction
);

router.patch(
  '/:id',
  authenticate,
  authorise(ROLES.FREELANCER),
  [
    param('id').isMongoId().withMessage('Invalid request ID.'),
    body('status')
      .custom(isString).withMessage('Status must be "accepted" or "declined".').bail()
      .isIn(['accepted', 'declined']).withMessage('Status must be "accepted" or "declined".'),
  ],
  validate,
  respondToTransaction
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
