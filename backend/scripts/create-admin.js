'use strict';

/**
 * create-admin.js – Creates (or promotes) the platform admin account
 *
 * Admins cannot self-register through the API (registration only accepts
 * "client" or "freelancer"), so the admin account is provisioned here by
 * someone with server access.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@hustlehub.test ADMIN_PASSWORD='Str0ng!Pass' npm run create-admin
 * or set ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../src/config/db');
const User      = require('../src/models/User');
const { ROLES } = require('../src/config/constants');

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\W_]).{8,128}$/;

async function main() {
  const name     = process.env.ADMIN_NAME || 'Platform Admin';
  const email    = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !PASSWORD_RULES.test(password)) {
    throw new Error(
      'Set ADMIN_EMAIL and a strong ADMIN_PASSWORD (8+ chars, upper, lower, number, special).'
    );
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12);
  await User.findOneAndUpdate(
    { email },
    { name, email, passwordHash, role: ROLES.ADMIN },
    { upsert: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin account ready: ${email}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
