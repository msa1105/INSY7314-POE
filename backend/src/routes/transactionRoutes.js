'use strict';

/**
 * transactionRoutes.js – Transaction API Routes
 *
 * POST /api/transactions          – Book a gig / create transaction (client only)
 * GET  /api/transactions/income   – Income + estimated tax (freelancer only)
 * GET  /api/transactions          – All transactions (admin only)
 */

const { Router } = require('express');
const { body }   = require('express-validator');

const {
  createTransaction, getIncomeSummary, getAllTransactions,
} = require('../controllers/transactionController');
const { authenticate, authorise } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

router.post(
  '/',
  authenticate,
  authorise('client'),
  [
    body('gigId').isUUID(4).withMessage('A valid gig ID is required.'),
  ],
  validate,
  createTransaction
);

router.get(
  '/income',
  authenticate,
  authorise('freelancer'),
  getIncomeSummary
);

router.get(
  '/',
  authenticate,
  authorise('admin'),
  getAllTransactions
);

module.exports = router;
