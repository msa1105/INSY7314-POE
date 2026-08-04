'use strict';

/**
 * gigRoutes.js – Gig Listing Routes
 *
 * GET    /api/gigs        – List all gigs          (authenticated)
 * GET    /api/gigs/:id    – Get single gig          (authenticated)
 * POST   /api/gigs        – Create gig              (freelancer only)
 * PUT    /api/gigs/:id    – Update gig              (freelancer owner)
 * DELETE /api/gigs/:id    – Delete gig              (freelancer owner or admin)
 */

const { Router } = require('express');
const { body, param } = require('express-validator');

const {
  listGigs, getGig, createGig, updateGig, deleteGig,
} = require('../controllers/gigController');
const { authenticate, authorise } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

// ── Validation ─────────────────────────────────────────────────────────────

const gigCreateValidation = [
  body('title')
    .trim().notEmpty().withMessage('Title is required.')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters.')
    .escape(),
  body('description')
    .trim().notEmpty().withMessage('Description is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters.')
    .escape(),
  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 1 }).withMessage('Price must be a positive number.'),
  body('category')
    .trim().notEmpty().withMessage('Category is required.')
    .isLength({ max: 50 }).withMessage('Category must be under 50 characters.')
    .escape(),
];

const idParamValidation = [
  param('id').isUUID(4).withMessage('Invalid gig ID.'),
];

// ── Routes ─────────────────────────────────────────────────────────────────

router.get('/',    authenticate, listGigs);
router.get('/:id', authenticate, idParamValidation, validate, getGig);

router.post(
  '/',
  authenticate,
  authorise('freelancer'),
  gigCreateValidation,
  validate,
  createGig
);

router.put(
  '/:id',
  authenticate,
  authorise('freelancer'),
  idParamValidation,
  validate,
  updateGig
);

router.delete(
  '/:id',
  authenticate,
  authorise('freelancer', 'admin'),
  idParamValidation,
  validate,
  deleteGig
);

module.exports = router;
