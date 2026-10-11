'use strict';

/**
 * Transaction.js – Booking / Transaction Model
 *
 * Every booking creates one transaction linked to the client who booked,
 * the freelancer who owns the gig and the gig itself. Payments are
 * SIMULATED – no real payment gateway is involved.
 *
 * gigTitle and amount are copied at booking time so the record stays
 * accurate even if the gig is later edited or deleted.
 */

const mongoose      = require('mongoose');
const applySafeJSON = require('./toJSON');

const TX_STATUSES = ['pending', 'completed', 'refunded'];

const transactionSchema = new mongoose.Schema(
  {
    gig:        { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    client:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gigTitle:   { type: String, required: true },
    amount:     { type: Number, required: true, min: 0 },
    status:     { type: String, enum: TX_STATUSES, default: 'pending' },
  },
  { timestamps: true }
);

applySafeJSON(transactionSchema);

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.TX_STATUSES = TX_STATUSES;
