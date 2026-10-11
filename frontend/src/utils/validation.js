/**
 * validation.js – Client-side input checks.
 *
 * These mirror the backend's express-validator rules so users get instant
 * feedback. They are a usability aid only: the server re-validates and
 * sanitises everything, so bypassing these checks gains an attacker nothing.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegister({ name, email, password, confirmPassword, role }) {
  const errors = {}
  const trimmedName = name.trim()
  if (!trimmedName) errors.name = 'Name is required.'
  else if (trimmedName.length < 2 || trimmedName.length > 80) errors.name = 'Name must be between 2 and 80 characters.'

  if (!email.trim()) errors.email = 'Email is required.'
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

export function validateGig({ title, description, price, category }) {
  const errors = {}
  const t = title.trim()
  if (!t) errors.title = 'Title is required.'
  else if (t.length < 5 || t.length > 100) errors.title = 'Title must be 5–100 characters.'

  const d = description.trim()
  if (!d) errors.description = 'Description is required.'
  else if (d.length < 10 || d.length > 2000) errors.description = 'Description must be 10–2000 characters.'

  const p = Number(price)
  if (price === '' || price === null) errors.price = 'Price is required.'
  else if (!Number.isFinite(p) || p < 1 || p > 1000000) errors.price = 'Price must be a number between 1 and 1 000 000.'

  const c = category.trim()
  if (!c) errors.category = 'Category is required.'
  else if (c.length > 50) errors.category = 'Category must be under 50 characters.'
  return errors
}
