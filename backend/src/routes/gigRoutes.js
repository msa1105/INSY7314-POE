'use strict';

/**
 * gigRoutes.js – Gig Listing Routes
 *
 * GET    /api/gigs        – List all gigs          (authenticated)
 * GET    /api/gigs/mine   – List own gigs          (freelancer only)
 * GET    /api/gigs/:id    – Get single gig          (authenticated)
 * POST   /api/gigs        – Create gig              (freelancer only)
 * PUT    /api/gigs/:id    – Update gig              (freelancer owner)
 * DELETE /api/gigs/:id    – Delete gig              (freelancer owner or admin)
 */

const { Router } = require('express');
const { body, param } = require('express-validator');

const {
  listGigs, listMyGigs, getGig, createGig, updateGig, deleteGig,
} = require('../controllers/gigController');
const { authenticate, authorise } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');

const router = Router();

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Builds the gig field rules. On create every field is required; on update
 * each field is optional but, when present, must pass the same rules.
 */
function gigFieldValidation({ optional }) {
  const field = (name) => (optional ? body(name).optional() : body(name));
  return [
    field('title')
      .isString().withMessage('Title must be text.')
      .trim().notEmpty().withMessage('Title is required.')
      .isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters.')
      .escape(),
    field('description')
      .isString().withMessage('Description must be text.')
      .trim().notEmpty().withMessage('Description is required.')
      .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters.')
      .escape(),
    field('price')
      .notEmpty().withMessage('Price is required.')
      .isFloat({ min: 1, max: 1000000 }).withMessage('Price must be a number between 1 and 1 000 000.'),
    field('category')
      .isString().withMessage('Category must be text.')
      .trim().notEmpty().withMessage('Category is required.')
      .isLength({ max: 50 }).withMessage('Category must be under 50 characters.')
      .escape(),
  ];
}

const idParamValidation = [
  param('id').isMongoId().withMessage('Invalid gig ID.'),
];

// ── Routes ─────────────────────────────────────────────────────────────────

router.get('/', authenticate, listGigs);

// Must be declared before '/:id' so "mine" is not treated as an id
router.get('/mine', authenticate, authorise(ROLES.FREELANCER), listMyGigs);

router.get('/:id', authenticate, idParamValidation, validate, getGig);

router.post(
  '/',
  authenticate,
  authorise(ROLES.FREELANCER),
  gigFieldValidation({ optional: false }),
  validate,
  createGig
);

router.put(
  '/:id',
  authenticate,
  authorise(ROLES.FREELANCER),
  idParamValidation,
  gigFieldValidation({ optional: true }),
  validate,
  updateGig
);

router.delete(
  '/:id',
  authenticate,
  authorise(ROLES.FREELANCER, ROLES.ADMIN),
  idParamValidation,
  validate,
  deleteGig
);

module.exports = router;
