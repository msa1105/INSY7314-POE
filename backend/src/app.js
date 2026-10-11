'use strict';

/**
 * app.js – Express Application Configuration
 *
 * Configures middleware stack in security-first order:
 *  1. Helmet   – sets secure HTTP headers
 *  2. CORS     – restricts allowed origins
 *  3. Morgan   – HTTP request logging
 *  4. Rate Limiter – brute-force protection
 *  5. Body Parser  – JSON parsing with size limit
 *  6. Routes
 *  7. 404 Handler
 *  8. Global Error Handler (no internal details leaked)
 */

// Load environment variables first (before any module that reads process.env)
require('dotenv').config();

const express      = require('express');

const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');

const rateLimiter  = require('./middleware/rateLimiter');
const authRoutes   = require('./routes/authRoutes');
const userRoutes   = require('./routes/userRoutes');
const gigRoutes    = require('./routes/gigRoutes');
const txRoutes     = require('./routes/transactionRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger       = require('./utils/logger');

const app = express();

// ── Security Headers (Helmet) ──────────────────────────────────────────────
// Helmet sets various HTTP headers to protect against well-known web
// vulnerabilities (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'"],
      imgSrc:     ["'self'", 'data:'],
    },
  },
  hsts: {
    maxAge:            31536000, // 1 year in seconds
    includeSubDomains: true,
    preload:           true,
  },
}));

// ── CORS ───────────────────────────────────────────────────────────────────
// Only allow requests from the configured frontend origin.
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'https://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (Postman, curl) in development
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── HTTP Request Logging ───────────────────────────────────────────────────
// Morgan logs requests; use 'combined' format for production audit trails.
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Rate Limiting ──────────────────────────────────────────────────────────
app.use('/api', rateLimiter);

// ── Body Parsing ───────────────────────────────────────────────────────────
// Limit request body size to prevent large payload attacks.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Root Endpoint ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    status:  'ok',
    service: 'HustleHub+ API',
    message: 'HustleHub+ Secure Backend API is running.',
    version: '1.0.0',
    endpoints: {
      health:       'GET  /api/health',
      register:     'POST /api/auth/register',
      login:        'POST /api/auth/login',
      profile:      'GET  /api/users/profile',
      gigs:         'GET  /api/gigs',
      createGig:    'POST /api/gigs',
      transactions: 'POST /api/transactions',
      income:       'GET  /api/transactions/income'
    }
  });
});

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status:  'ok',
    service: 'HustleHub+ API',
    version: '1.0.0',
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/gigs',         gigRoutes);
app.use('/api/transactions', txRoutes);

// ── 404 – Unknown Routes ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
