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
const {
  GIG_CATEGORIES, TITLE_CHARS, HAS_LETTER, isString, stringField, singleLine, multiLine, moneyField,
} = require('../middleware/fieldRules');

const router = Router();

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Builds the gig field rules. On create every field is required; on update
 * each field is optional but, when present, must pass the same rules.
 */
function gigFieldValidation({ optional }) {
  return [
    singleLine(stringField('title', 'Title', { optional }), 'Title')
      .isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters.').bail()
      .matches(TITLE_CHARS).withMessage('Title may only contain letters, numbers, spaces and basic punctuation.').bail()
      .matches(HAS_LETTER).withMessage('Title must contain at least one letter.')
      .escape(),
    multiLine(stringField('description', 'Description', { optional }), 'Description')
      .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters.')
      .escape(),
    moneyField('price', 'Price', { optional }),
    (optional ? body('category').optional() : body('category'))
      .custom(isString).withMessage('Category is required.').bail()
      .isIn(GIG_CATEGORIES).withMessage('Choose a category from the list.'),
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
