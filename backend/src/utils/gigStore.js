'use strict';

/**
 * gigStore.js – File-Based Gig Storage Utility (Part 1 scaffold)
 *
 * Stores freelancer gig listings. Full CRUD will be extended in Part 2.
 * Each gig record:
 * {
 *   id:           string (UUID),
 *   freelancerId: string (user UUID),
 *   title:        string,
 *   description:  string,
 *   price:        number,
 *   category:     string,
 *   createdAt:    ISO string,
 *   updatedAt:    ISO string
 * }
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'gigs.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

function readGigs()       { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeGigs(gigs)  { fs.writeFileSync(DATA_FILE, JSON.stringify(gigs, null, 2), 'utf8'); }

function findAll()        { return readGigs(); }
function findById(id)     { return readGigs().find((g) => g.id === id) || null; }
function findByFreelancer(fId) { return readGigs().filter((g) => g.freelancerId === fId); }

function create(gigData) {
  const gigs = readGigs();
  const gig  = { ...gigData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  gigs.push(gig);
  writeGigs(gigs);
  return gig;
}

function update(id, updates) {
  const gigs = readGigs();
  const idx  = gigs.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  gigs[idx] = { ...gigs[idx], ...updates, updatedAt: new Date().toISOString() };
  writeGigs(gigs);
  return gigs[idx];
}

function remove(id) {
  const gigs    = readGigs();
  const filtered = gigs.filter((g) => g.id !== id);
  if (filtered.length === gigs.length) return false;
  writeGigs(filtered);
  return true;
}

module.exports = { findAll, findById, findByFreelancer, create, update, remove };
