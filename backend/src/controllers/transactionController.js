'use strict';

/**
 * transactionController.js – Booking, Transaction & Income Controller
 *
 * Simulates payment processing and records transactions from bookings.
 * Provides booking history for clients and freelancers, and income
 * tracking for freelancers.
 *
 * Routes are protected by JWT + RBAC (enforced at router level). Every
 * query here is scoped to the authenticated user's id, so users only ever
 * see transactions they are a party to (admins use getAllTransactions).
 */

const Transaction = require('../models/Transaction');
const Gig         = require('../models/Gig');
const { ROLES }   = require('../config/constants');
const logger      = require('../utils/logger');

const PARTY_FIELDS = 'name email';

/**
 * POST /api/transactions
 * Client books a gig → simulated payment → transaction record created.
 * Body: { gigId }
 * Access: client only
 */
async function createTransaction(req, res, next) {
  try {
    const { gigId } = req.body;

    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });

    // Simulated payment – auto-completes. The amount comes from the stored
    // gig, never from the request body, so clients cannot set their own price.
    const tx = await Transaction.create({
      gig:        gig._id,
      client:     req.user.id,
      freelancer: gig.freelancer,
      gigTitle:   gig.title,
      amount:     gig.price,
      status:     'completed',
    });

    logger.info(
      `Booking created: tx=${tx.id} | gig=${gig.id} | client=${req.user.id} | freelancer=${gig.freelancer} | amount=R${gig.price}`
    );

    return res.status(201).json({
      message: 'Booking confirmed. Payment simulated successfully.',
      transaction: tx,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/mine
 * Clients: bookings they made. Freelancers: bookings received for their gigs.
 * Access: client, freelancer
 */
async function getMyTransactions(req, res, next) {
  try {
    const filter = req.user.role === ROLES.FREELANCER
      ? { freelancer: req.user.id }
      : { client: req.user.id };

    const txs = await Transaction.find(filter)
      .populate('client', PARTY_FIELDS)
      .populate('freelancer', PARTY_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: txs.length, transactions: txs });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/income
 * Returns income summary and estimated tax for the authenticated freelancer.
 * Access: freelancer only
 */
async function getIncomeSummary(req, res, next) {
  try {
    const txs = await Transaction.find({ freelancer: req.user.id, status: 'completed' })
      .populate('client', PARTY_FIELDS)
      .sort({ createdAt: -1 });

    const total    = txs.reduce((sum, t) => sum + t.amount, 0);
    const TAX_RATE = 0.25; // 25% placeholder – detailed tax estimation is part of the final POE

    logger.debug(`Income summary fetched for freelancer: ${req.user.id}`);
    return res.status(200).json({
      totalIncome:  parseFloat(total.toFixed(2)),
      estimatedTax: parseFloat((total * TAX_RATE).toFixed(2)),
      taxRate:      `${TAX_RATE * 100}%`,
      bookings:     txs.length,
      transactions: txs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions
 * Admin: view all transactions.
 * Access: admin only
 */
async function getAllTransactions(req, res, next) {
  try {
    const txs = await Transaction.find()
      .populate('client', PARTY_FIELDS)
      .populate('freelancer', PARTY_FIELDS)
      .sort({ createdAt: -1 });
    return res.status(200).json({ count: txs.length, transactions: txs });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTransaction, getMyTransactions, getIncomeSummary, getAllTransactions };
