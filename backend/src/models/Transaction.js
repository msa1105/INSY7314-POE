'use strict';

/**
 * Transaction.js – Job Request / Transaction Model
 *
 * A client sends a job request for a gig: the work details and the amount
 * they are willing to pay. It starts as `pending`; the freelancer who owns
 * the gig then accepts or declines it. Accepting counts as the (SIMULATED)
 * payment – no real payment gateway is involved.
 *
 * gigTitle is copied at request time so the record stays accurate even if
 * the gig is later edited or deleted.
 */

const mongoose      = require('mongoose');
const applySafeJSON = require('./toJSON');

const TX_STATUSES = ['pending', 'accepted', 'declined'];

// details length (10–2000) is enforced by express-validator in transactionRoutes;
// the limit here is a backstop sized for HTML-escaped text (up to 6x longer).
const transactionSchema = new mongoose.Schema(
  {
    gig:        { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    client:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gigTitle:   { type: String, required: true },
    details:    { type: String, required: true, trim: true, maxlength: 12000 },
    amount:     { type: Number, required: true, min: 1 },
    status:     { type: String, enum: TX_STATUSES, default: 'pending' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

applySafeJSON(transactionSchema);

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.TX_STATUSES = TX_STATUSES;
