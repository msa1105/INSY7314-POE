'use strict';

/**
 * transactionController.js – Job Request, Transaction & Income Controller
 *
 * Clients send job requests; freelancers accept (simulated payment) or decline.
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
 * Client sends a job request for a gig: work details + the amount they are
 * willing to pay. The request starts as `pending` until the freelancer responds.
 * Body: { gigId, details, amount }
 * Access: client only
 */
async function createTransaction(req, res, next) {
  try {
    const { gigId, details, amount } = req.body;

    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });

    // The freelancer and gig title always come from the stored gig, never
    // from the request body, so a client cannot redirect a request elsewhere.
    const tx = await Transaction.create({
      gig:        gig._id,
      client:     req.user.id,
      freelancer: gig.freelancer,
      gigTitle:   gig.title,
      details,
      amount:     parseFloat(amount),
      status:     'pending',
    });

    logger.info(
      `Job request sent: tx=${tx.id} | gig=${gig.id} | client=${req.user.id} | freelancer=${gig.freelancer} | offer=R${tx.amount}`
    );

    return res.status(201).json({
      message: 'Request sent. The freelancer will accept or decline it.',
      transaction: tx,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/transactions/:id
 * The freelancer who received a pending request accepts or declines it.
 * Accepting counts as the simulated payment.
 * Body: { status: 'accepted' | 'declined' }
 * Access: freelancer (owner of the request only)
 */
async function respondToTransaction(req, res, next) {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Request not found.' });
    if (tx.freelancer.toString() !== req.user.id) {
      logger.warn(`Forbidden: user ${req.user.id} attempted to respond to request ${tx.id}`);
      return res.status(403).json({ error: 'You may only respond to requests sent to you.' });
    }

    // Conditional update so a request can only ever be answered once,
    // even if two responses arrive at the same time.
    const updated = await Transaction.findOneAndUpdate(
      { _id: tx._id, status: 'pending' },
      { status: req.body.status, respondedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ error: `This request has already been ${tx.status}.` });
    }

    logger.info(`Job request ${updated.status}: tx=${updated.id} by freelancer ${req.user.id}`);
    return res.status(200).json({
      message: updated.status === 'accepted'
        ? 'Request accepted. Payment simulated successfully.'
        : 'Request declined.',
      transaction: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/mine
 * Clients: requests they sent. Freelancers: requests received for their gigs.
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
 * Returns income (accepted requests) and estimated tax for the freelancer.
 * Access: freelancer only
 */
async function getIncomeSummary(req, res, next) {
  try {
    const txs = await Transaction.find({ freelancer: req.user.id, status: 'accepted' })
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

module.exports = { createTransaction, respondToTransaction, getMyTransactions, getIncomeSummary, getAllTransactions };
