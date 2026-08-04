'use strict';

/**
 * transactionStore.js – File-Based Transaction Storage Utility
 *
 * Records financial transactions generated from bookings.
 * Payments are SIMULATED (no real payment gateway in this version).
 *
 * Each transaction record:
 * {
 *   id:           string (UUID),
 *   bookingId:    string (UUID),
 *   clientId:     string (user UUID),
 *   freelancerId: string (user UUID),
 *   gigId:        string (gig UUID),
 *   amount:       number (ZAR),
 *   status:       'pending' | 'completed' | 'refunded',
 *   createdAt:    ISO string,
 *   updatedAt:    ISO string
 * }
 *
 * NOTE: This store will be replaced by a MongoDB model in Part 2.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'transactions.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

const VALID_STATUSES = ['pending', 'completed', 'refunded'];

function readTx()      { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeTx(txs)  { fs.writeFileSync(DATA_FILE, JSON.stringify(txs, null, 2), 'utf8'); }

/** Return all transactions (admin view). */
function findAll()                    { return readTx(); }

/** Return all transactions for a specific freelancer (income tracking). */
function findByFreelancer(freelancerId) {
  return readTx().filter((t) => t.freelancerId === freelancerId);
}

/** Return all transactions for a specific client. */
function findByClient(clientId) {
  return readTx().filter((t) => t.clientId === clientId);
}

/** Create a new transaction record. */
function create(txData) {
  const txs = readTx();
  const tx  = {
    ...txData,
    status:    txData.status    || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  txs.push(tx);
  writeTx(txs);
  return tx;
}

/** Update transaction status (e.g. pending → completed). */
function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const txs = readTx();
  const idx = txs.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  txs[idx] = { ...txs[idx], status, updatedAt: new Date().toISOString() };
  writeTx(txs);
  return txs[idx];
}

/**
 * Calculate total income for a freelancer from completed transactions.
 * Also returns an estimated tax figure (25% flat rate placeholder).
 * @param {string} freelancerId
 * @returns {{ totalIncome: number, estimatedTax: number, transactions: object[] }}
 */
function getFreelancerIncomeSummary(freelancerId) {
  const txs      = findByFreelancer(freelancerId).filter((t) => t.status === 'completed');
  const total    = txs.reduce((sum, t) => sum + t.amount, 0);
  const TAX_RATE = 0.25; // 25% placeholder – to be replaced with SARS brackets in Part 2
  return {
    totalIncome:  parseFloat(total.toFixed(2)),
    estimatedTax: parseFloat((total * TAX_RATE).toFixed(2)),
    taxRate:      `${TAX_RATE * 100}%`,
    transactions: txs,
  };
}

module.exports = {
  findAll, findByFreelancer, findByClient,
  create, updateStatus, getFreelancerIncomeSummary,
};
