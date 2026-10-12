'use strict';

/**
 * fieldRules.js – Shared express-validator rules for user input
 *
 * Every route builds its validation chain from these helpers so the same
 * field is checked the same way everywhere:
 *  - Type is enforced first (a string must be a string, never an array or
 *    object), so `{ "price": [1, 2] }` or `{ "password": ["x"] }` is rejected
 *    with 422 instead of reaching the controller or bcrypt.
 *  - Control characters are rejected (NUL, BEL, backspace...). Free-text fields
 *    may contain line breaks and tabs, single-line fields may not.
 *  - Names and titles use a character allow-list (letters, digits and common
 *    punctuation); money is a plain decimal with at most 2 decimal places.
 */

const { body } = require('express-validator');

const GIG_CATEGORIES = Object.freeze([
  'Design', 'Writing', 'Development', 'Marketing', 'Finance',
  'Admin Support', 'Video & Animation', 'Photography', 'Tutoring', 'Other',
]);

const MONEY_MIN = 1;
const MONEY_MAX = 1000000;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS           = /[\u0000-\u001F\u007F]/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_EXCEPT_NL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const PERSON_NAME = /^\p{L}[\p{L}\p{M} '’.-]*$/u;               // e.g. Thandi Mokoena, O'Brien, Jean-Luc
const TITLE_CHARS = /^[\p{L}\p{N}\p{M} .,'’&()/+:!?#-]+$/u;
const HAS_LETTER  = /\p{L}/u;
const MONEY       = /^\d{1,7}(\.\d{1,2})?$/;

const isString = (value) => typeof value === 'string';

/** Required string field of the right type. Optional fields skip when absent. */
function stringField(name, label, { optional = false } = {}) {
  const chain = optional ? body(name).optional() : body(name);
  return chain
    .custom(isString).withMessage(`${label} must be text.`).bail()
    .trim()
    .notEmpty().withMessage(`${label} is required.`).bail();
}

/** Single-line text: no control characters at all. */
const singleLine = (chain, label) =>
  chain.not().matches(CONTROL_CHARS).withMessage(`${label} contains characters that are not allowed.`).bail();

/** Multi-line text: line breaks and tabs allowed, other control characters not. */
const multiLine = (chain, label) =>
  chain.not().matches(CONTROL_CHARS_EXCEPT_NL).withMessage(`${label} contains characters that are not allowed.`).bail();

/** Money amount: a number (or numeric string) between 1 and 1 000 000 with at most 2 decimals. */
function moneyField(name, label, { optional = false } = {}) {
  const chain = optional ? body(name).optional() : body(name);
  return chain
    .custom((v) => (typeof v === 'number' && Number.isFinite(v)) || (isString(v) && v.trim() !== ''))
    .withMessage(`${label} is required.`).bail()
    .custom((v) => MONEY.test(String(v).trim()))
    .withMessage(`${label} must be a plain amount with at most 2 decimal places.`).bail()
    .custom((v) => Number(v) >= MONEY_MIN && Number(v) <= MONEY_MAX)
    .withMessage(`${label} must be between ${MONEY_MIN} and 1 000 000.`);
}

module.exports = {
  GIG_CATEGORIES, PERSON_NAME, TITLE_CHARS, HAS_LETTER,
  isString, stringField, singleLine, multiLine, moneyField,
};
