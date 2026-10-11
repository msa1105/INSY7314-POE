'use strict';

/**
 * local-db.js – Local MongoDB for development (no install or Docker needed)
 *
 * Starts a real mongod binary (downloaded once by mongodb-memory-server) on
 * mongodb://127.0.0.1:27017 with data stored in backend/.mongo-data, so
 * users, gigs and bookings survive restarts.
 *
 * Run in its own terminal: npm run db:local
 */

const fs   = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const DB_PATH = path.join(__dirname, '..', '.mongo-data');
const PORT    = parseInt(process.env.LOCAL_DB_PORT, 10) || 27017;

async function main() {
  fs.mkdirSync(DB_PATH, { recursive: true });

  const mongod = await MongoMemoryServer.create({
    instance: { port: PORT, dbPath: DB_PATH, storageEngine: 'wiredTiger' },
  });

  console.log(`Local MongoDB running at ${mongod.getUri()}`);
  console.log('Set MONGO_URI=mongodb://127.0.0.1:27017/hustlehub in backend/.env');
  console.log('Press Ctrl+C to stop.');

  const stop = async () => {
    await mongod.stop({ doCleanup: false }); // keep data on disk
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  console.error(`Could not start local MongoDB: ${err.message}`);
  process.exit(1);
});
