'use strict';

/**
 * server.js – HTTPS Entry Point for HustleHub+ Backend
 *
 * Loads SSL certificates and starts the Express app over HTTPS.
 * HTTP traffic is explicitly NOT served to enforce secure transport.
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Load environment variables before importing app
require('dotenv').config();

const app           = require('./src/app');
const logger        = require('./src/utils/logger');
const { connectDB } = require('./src/config/db');

const PORT         = process.env.PORT || 5000;
const SSL_KEY_PATH  = process.env.SSL_KEY_PATH  || './ssl/server.key';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || './ssl/server.cert';

// ── SSL Certificate Loading ────────────────────────────────────────────────
let sslOptions;
try {
  sslOptions = {
    key:  fs.readFileSync(path.resolve(__dirname, SSL_KEY_PATH)),
    cert: fs.readFileSync(path.resolve(__dirname, SSL_CERT_PATH)),
  };
} catch (err) {
  logger.error('SSL certificate files not found. Run: node generate-certs.js');
  logger.error(err.message);
  process.exit(1);
}

// ── Start HTTPS Server ─────────────────────────────────────────────────────
const server = https.createServer(sslOptions, app);

// Connect to MongoDB first – the API never accepts requests without a database
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`HustleHub+ API running on https://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });

// ── Graceful Shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received – shutting down gracefully.');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});
