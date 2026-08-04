'use strict';

/**
 * transactionController.js – Transaction & Income Controller
 *
 * Simulates payment processing and records transactions from bookings.
 * Provides income tracking and estimated tax calculation for Freelancers.
 *
 * Routes are protected by JWT + RBAC (enforced at router level).
 */

const { v4: uuidv4 } = require('uuid');
const txStore  = require('../utils/transactionStore');
const gigStore = require('../utils/gigStore');
const logger   = require('../utils/logger');

/**
 * POST /api/transactions
 * Client books a gig → simulated payment → transaction record created.
 * Body: { gigId }
 * Access: client only
 */
async function createTransaction(req, res, next) {
  try {
    const { gigId } = req.body;

    const gig = gigStore.findById(gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });

    // Simulate a successful payment
    const tx = txStore.create({
      id:           uuidv4(),
      gigId,
      clientId:     req.user.id,
      freelancerId: gig.freelancerId,
      amount:       gig.price,
      status:       'completed', // simulated – auto-complete
    });

    logger.info(`Transaction created: ${tx.id} | gig=${gigId} | amount=R${gig.price}`);

    return res.status(201).json({
      message: 'Booking confirmed. Payment simulated successfully.',
      transaction: tx,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/income
 * Returns income summary and estimated tax for the authenticated freelancer.
 * Access: freelancer only
 */
function getIncomeSummary(req, res, next) {
  try {
    const summary = txStore.getFreelancerIncomeSummary(req.user.id);
    logger.debug(`Income summary fetched for freelancer: ${req.user.id}`);
    return res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions
 * Admin: view all transactions.
 * Access: admin only
 */
function getAllTransactions(req, res, next) {
  try {
    const txs = txStore.findAll();
    return res.status(200).json({ count: txs.length, transactions: txs });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTransaction, getIncomeSummary, getAllTransactions };
