'use strict';

/**
 * logger.js – Structured Application Logger
 *
 * Provides timestamped, levelled logging to both the console and
 * a persistent log file. Uses ONLY Node.js built-ins (no winston)
 * to keep dependencies minimal for Part 1.
 *
 * Log levels: error > warn > info > http > debug
 */

const fs   = require('fs');
const path = require('path');

// ── Log Directory ──────────────────────────────────────────────────────────
const LOG_DIR  = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const COLOURS = {
  error: '\x1b[31m', // red
  warn:  '\x1b[33m', // yellow
  info:  '\x1b[36m', // cyan
  http:  '\x1b[35m', // magenta
  debug: '\x1b[37m', // white
  reset: '\x1b[0m',
};

const currentLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Core log function.
 * @param {'error'|'warn'|'info'|'http'|'debug'} level
 * @param {string} message
 */
function log(level, message) {
  if (LEVELS[level] > LEVELS[currentLevel]) return;

  const timestamp = new Date().toISOString();
  const plain     = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}`;
  const coloured  = `${COLOURS[level]}${plain}${COLOURS.reset}`;

  // Console output (coloured)
  if (level === 'error') {
    console.error(coloured);
  } else {
    console.log(coloured);
  }

  // File output (plain text, append)
  fs.appendFileSync(LOG_FILE, plain + '\n', 'utf8');
}

const logger = {
  error: (msg) => log('error', msg),
  warn:  (msg) => log('warn',  msg),
  info:  (msg) => log('info',  msg),
  http:  (msg) => log('http',  msg),
  debug: (msg) => log('debug', msg),
};

module.exports = logger;
