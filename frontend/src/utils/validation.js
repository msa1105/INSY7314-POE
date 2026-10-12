/**
 * validation.js – Client-side input checks.
 *
 * These mirror the backend's express-validator rules so users get instant
 * feedback. They are a usability aid only: the server re-validates and
 * sanitises everything, so bypassing these checks gains an attacker nothing.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Same allow-lists as backend/src/middleware/fieldRules.js
const PERSON_NAME = /^\p{L}[\p{L}\p{M} '’.-]*$/u
const TITLE_CHARS = /^[\p{L}\p{N}\p{M} .,'’&()/+:!?#-]+$/u
const HAS_LETTER = /\p{L}/u
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_EXCEPT_NL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
const MONEY = /^\d{1,7}(\.\d{1,2})?$/

/** Fixed list – must match GIG_CATEGORIES in backend/src/middleware/fieldRules.js. */
export const GIG_CATEGORIES = [
  'Design', 'Writing', 'Development', 'Marketing', 'Finance',
  'Admin Support', 'Video & Animation', 'Photography', 'Tutoring', 'Other',
]

/** Returns an error message for a money field, or undefined if valid. */
function checkMoney(value, label) {
  const v = String(value ?? '').trim()
  if (!v) return `${label} is required.`
  if (!MONEY.test(v)) return `${label} must be a plain amount with at most 2 decimal places.`
  if (Number(v) < 1 || Number(v) > 1000000) return `${label} must be between 1 and 1 000 000.`
  return undefined
}

export function validateRegister({ name, email, password, confirmPassword, role }) {
  const errors = {}
  const trimmedName = name.trim()
  if (!trimmedName) errors.name = 'Name is required.'
  else if (trimmedName.length < 2 || trimmedName.length > 80) errors.name = 'Name must be between 2 and 80 characters.'
  else if (!PERSON_NAME.test(trimmedName)) errors.name = 'Name may only contain letters, spaces, apostrophes, hyphens and full stops.'

  if (!email.trim()) errors.email = 'Email is required.'
  else if (email.trim().length > 254) errors.email = 'Email must be at most 254 characters.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'A valid email address is required.'

  const passwordError = checkPassword(password)
  if (passwordError) errors.password = passwordError
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.'

  if (!['client', 'freelancer'].includes(role)) errors.role = 'Choose client or freelancer.'
  return errors
}

export function checkPassword(password) {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 128) return 'Password must be at most 128 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  if (!/[\W_]/.test(password)) return 'Password must contain at least one special character.'
  return null
}

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'A valid email address is required.'
  if (!password) errors.password = 'Password is required.'
  return errors
}

export function validateRequest({ details, amount }) {
  const errors = {}
  const d = details.trim()
  if (!d) errors.details = 'Work details are required.'
  else if (d.length < 10 || d.length > 2000) errors.details = 'Work details must be 10–2000 characters.'
  else if (CONTROL_CHARS_EXCEPT_NL.test(d)) errors.details = 'Work details contain characters that are not allowed.'

  const amountError = checkMoney(amount, 'Amount')
  if (amountError) errors.amount = amountError
  return errors
}

export function validateGig({ title, description, price, category }) {
  const errors = {}
  const t = title.trim()
  if (!t) errors.title = 'Title is required.'
  else if (t.length < 5 || t.length > 100) errors.title = 'Title must be 5–100 characters.'
  else if (CONTROL_CHARS.test(t) || !TITLE_CHARS.test(t)) errors.title = 'Title may only contain letters, numbers, spaces and basic punctuation.'
  else if (!HAS_LETTER.test(t)) errors.title = 'Title must contain at least one letter.'

  const d = description.trim()
  if (!d) errors.description = 'Description is required.'
  else if (d.length < 10 || d.length > 2000) errors.description = 'Description must be 10–2000 characters.'
  else if (CONTROL_CHARS_EXCEPT_NL.test(d)) errors.description = 'Description contains characters that are not allowed.'

  const priceError = checkMoney(price, 'Price')
  if (priceError) errors.price = priceError

  if (!category) errors.category = 'Category is required.'
  else if (!GIG_CATEGORIES.includes(category)) errors.category = 'Choose a category from the list.'
  return errors
}
