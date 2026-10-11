'use strict';

/**
 * db.js – MongoDB Connection (Mongoose)
 *
 * Connects to the database specified by MONGO_URI.
 *
 * Security considerations:
 *  - strictQuery is enabled so query filters on fields that are not in a
 *    schema are dropped instead of being passed through to MongoDB.
 *  - Connection errors are logged server-side only; the URI (which may
 *    contain credentials) is never logged.
 */

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

mongoose.set('strictQuery', true);

async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is not set. Add it to your .env file.');
  }
  await mongoose.connect(uri);
  logger.info(`MongoDB connected (database: ${mongoose.connection.name})`);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
