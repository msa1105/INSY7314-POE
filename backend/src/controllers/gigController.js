'use strict';

/**
 * gigController.js – Gig Management Controller
 *
 * Handles CRUD for freelancer gig listings.
 * Create/Update restricted to freelancers, Delete to freelancers and admins
 * (enforced at router level). Ownership is enforced here: a freelancer may
 * only modify or delete gigs they created.
 * Browse open to authenticated users.
 */

const Gig    = require('../models/Gig');
const logger = require('../utils/logger');

// Only expose the freelancer's public fields when populating
const FREELANCER_FIELDS = 'name';

/** GET /api/gigs – List all gigs (any authenticated user) */
async function listGigs(req, res, next) {
  try {
    const gigs = await Gig.find()
      .populate('freelancer', FREELANCER_FIELDS)
      .sort({ createdAt: -1 });
    return res.status(200).json({ count: gigs.length, gigs });
  } catch (err) { next(err); }
}

/** GET /api/gigs/mine – List the authenticated freelancer's own gigs */
async function listMyGigs(req, res, next) {
  try {
    const gigs = await Gig.find({ freelancer: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ count: gigs.length, gigs });
  } catch (err) { next(err); }
}

/** GET /api/gigs/:id – Get single gig */
async function getGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id).populate('freelancer', FREELANCER_FIELDS);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });
    return res.status(200).json({ gig });
  } catch (err) { next(err); }
}

/** POST /api/gigs – Create gig (freelancers only) */
async function createGig(req, res, next) {
  try {
    const { title, description, price, category } = req.body;
    const gig = await Gig.create({
      freelancer: req.user.id,
      title,
      description,
      price: parseFloat(price),
      category,
    });
    logger.info(`Gig created: ${gig.id} by freelancer ${req.user.id}`);
    return res.status(201).json({ message: 'Gig created.', gig });
  } catch (err) { next(err); }
}

/** PUT /api/gigs/:id – Update gig (owner freelancer only) */
async function updateGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });
    if (gig.freelancer.toString() !== req.user.id) {
      logger.warn(`Forbidden: user ${req.user.id} attempted to edit gig ${gig.id}`);
      return res.status(403).json({ error: 'You may only edit your own gigs.' });
    }

    // Only whitelisted fields can change – ownership can never be reassigned
    const { title, description, price, category } = req.body;
    if (title !== undefined)       gig.title       = title;
    if (description !== undefined) gig.description = description;
    if (price !== undefined)       gig.price       = parseFloat(price);
    if (category !== undefined)    gig.category    = category;

    await gig.save();
    logger.info(`Gig updated: ${gig.id} by freelancer ${req.user.id}`);
    return res.status(200).json({ message: 'Gig updated.', gig });
  } catch (err) { next(err); }
}

/** DELETE /api/gigs/:id – Delete gig (owner freelancer or admin) */
async function deleteGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found.' });
    if (gig.freelancer.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Forbidden: user ${req.user.id} attempted to delete gig ${gig.id}`);
      return res.status(403).json({ error: 'You do not have permission to delete this gig.' });
    }
    await gig.deleteOne();
    logger.info(`Gig deleted: ${req.params.id} by ${req.user.id}`);
    return res.status(200).json({ message: 'Gig deleted.' });
  } catch (err) { next(err); }
}

module.exports = { listGigs, listMyGigs, getGig, createGig, updateGig, deleteGig };
