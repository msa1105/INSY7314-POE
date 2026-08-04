'use strict';

/**
 * gigController.js – Gig Management Controller
 *
 * Handles CRUD for freelancer gig listings.
 * Create/Update/Delete restricted to freelancers (enforced at router level).
 * Browse open to authenticated users.
 */

const { v4: uuidv4 } = require('uuid');
const gigStore = require('../utils/gigStore');
const logger   = require('../utils/logger');

/** GET /api/gigs – List all gigs (any authenticated user) */
function listGigs(req, res, next) {
  try {
    const gigs = gigStore.findAll();
    return res.status(200).json({ count: gigs.length, gigs });
  } catch (err) { next(err); }
}

/** GET /api/gigs/:id – Get single gig */
function getGig(req, res, next) {
  try {
    const gig = gigStore.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });
    return res.status(200).json({ gig });
  } catch (err) { next(err); }
}

/** POST /api/gigs – Create gig (freelancers only) */
function createGig(req, res, next) {
  try {
    const { title, description, price, category } = req.body;
    const gig = gigStore.create({
      id:           uuidv4(),
      freelancerId: req.user.id,
      title:        title.trim(),
      description:  description.trim(),
      price:        parseFloat(price),
      category:     category.trim(),
    });
    logger.info(`Gig created: ${gig.id} by freelancer ${req.user.id}`);
    return res.status(201).json({ message: 'Gig created.', gig });
  } catch (err) { next(err); }
}

/** PUT /api/gigs/:id – Update gig (owner freelancer only) */
function updateGig(req, res, next) {
  try {
    const existing = gigStore.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Gig not found.' });
    if (existing.freelancerId !== req.user.id) {
      return res.status(403).json({ error: 'You may only edit your own gigs.' });
    }
    const { title, description, price, category } = req.body;
    const updated = gigStore.update(req.params.id, {
      ...(title       && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(price       && { price: parseFloat(price) }),
      ...(category    && { category: category.trim() }),
    });
    logger.info(`Gig updated: ${req.params.id}`);
    return res.status(200).json({ message: 'Gig updated.', gig: updated });
  } catch (err) { next(err); }
}

/** DELETE /api/gigs/:id – Delete gig (owner freelancer or admin) */
function deleteGig(req, res, next) {
  try {
    const existing = gigStore.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Gig not found.' });
    if (existing.freelancerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this gig.' });
    }
    gigStore.remove(req.params.id);
    logger.info(`Gig deleted: ${req.params.id} by ${req.user.id}`);
    return res.status(200).json({ message: 'Gig deleted.' });
  } catch (err) { next(err); }
}

module.exports = { listGigs, getGig, createGig, updateGig, deleteGig };
