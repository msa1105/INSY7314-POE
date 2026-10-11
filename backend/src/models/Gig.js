'use strict';

/**
 * Gig.js – Gig (service listing) Model
 *
 * Each gig belongs to exactly one freelancer. Ownership is checked in the
 * controller against `freelancer` before any update or delete.
 */

const mongoose      = require('mongoose');
const applySafeJSON = require('./toJSON');

// Length rules for user input are enforced by express-validator in gigRoutes.
// The limits here are a backstop sized for HTML-escaped text (up to 6x longer).
const gigSchema = new mongoose.Schema(
  {
    freelancer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:       { type: String, required: true, trim: true, maxlength: 600 },
    description: { type: String, required: true, trim: true, maxlength: 12000 },
    price:       { type: Number, required: true, min: 1 },
    category:    { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

applySafeJSON(gigSchema);

module.exports = mongoose.model('Gig', gigSchema);
