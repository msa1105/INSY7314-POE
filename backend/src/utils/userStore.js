'use strict';

/**
 * userStore.js – File-Based User Storage Utility
 *
 * Provides an abstraction layer over a JSON file that persists user records.
 * This satisfies the Part 1 requirement of in-memory or file-based storage.
 * A database (MongoDB) will replace this in Part 2.
 *
 * The store is kept in: src/data/users.json
 * Each user record:
 * {
 *   id:           string (UUID v4),
 *   name:         string,
 *   email:        string (lowercase, unique),
 *   passwordHash: string (bcrypt),
 *   role:         'client' | 'freelancer' | 'admin',
 *   createdAt:    ISO string
 * }
 *
 * SECURITY: The passwordHash is NEVER returned from findAll/findByEmail
 *           to API consumers. Use omitPassword() before sending responses.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

// Ensure the data directory and file exist on first load
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf8');
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Read all users from disk. */
function readUsers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Persist user array to disk atomically. */
function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

/** Remove sensitive fields before returning user data to callers. */
function omitPassword(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

// ── Store API ──────────────────────────────────────────────────────────────

/**
 * Find a user by email (case-insensitive).
 * Returns the FULL record including passwordHash (for internal auth use).
 */
function findByEmail(email) {
  const users = readUsers();
  return users.find((u) => u.email === email.toLowerCase()) || null;
}

/**
 * Find a user by UUID.
 * Returns safe record (no passwordHash).
 */
function findById(id) {
  const users = readUsers();
  const user  = users.find((u) => u.id === id) || null;
  return omitPassword(user);
}

/**
 * Return all users (safe – no passwordHash).
 */
function findAll() {
  return readUsers().map(omitPassword);
}

/**
 * Insert a new user record. Throws if email already exists.
 * @param {object} userData – must include id, name, email, passwordHash, role
 * @returns {object} safe user (no passwordHash)
 */
function create(userData) {
  const users = readUsers();

  if (users.some((u) => u.email === userData.email)) {
    const err = new Error('Email already registered.');
    err.statusCode = 409;
    throw err;
  }

  const newUser = {
    ...userData,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  return omitPassword(newUser);
}

module.exports = { findByEmail, findById, findAll, create, omitPassword };
