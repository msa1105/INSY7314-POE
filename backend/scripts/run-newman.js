'use strict';

/**
 * run-newman.js – Runs the Postman collection against the running API.
 *
 * The admin password is read from backend/.env (ADMIN_PASSWORD) and passed
 * to Newman with --env-var, so it never has to be stored in the committed
 * Postman environment file.
 *
 * Reports are written to postman/newman-results/ (CLI output + JUnit XML).
 *
 * Usage (API must be running): npm run test:api
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT    = path.join(__dirname, '..', '..');
const RESULTS = path.join(ROOT, 'postman', 'newman-results');

if (!process.env.ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is not set in backend/.env – run `npm run create-admin` first.');
  process.exit(1);
}

const args = [
  '--yes', 'newman@6', 'run', path.join(ROOT, 'hustlehub_api.postman_collection.json'),
  '-e', path.join(ROOT, 'postman', 'hustlehub-local.postman_environment.json'),
  '--env-var', `adminEmail=${process.env.ADMIN_EMAIL || 'admin@hustlehub.test'}`,
  '--env-var', `adminPassword=${process.env.ADMIN_PASSWORD}`,
  '--insecure', // local self-signed certificate
  '--color', 'off',
  // CLI + JUnit only: the JSON reporter would save request bodies (including
  // the admin password) and issued tokens into the evidence folder.
  '--reporters', 'cli,junit',
  '--reporter-junit-export', path.join(RESULTS, 'newman-report.xml'),
];

fs.mkdirSync(RESULTS, { recursive: true });
const result = spawnSync('npx', args, {
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 10 * 1024 * 1024,
});

const output = `${result.stdout || ''}${result.stderr || ''}`;
process.stdout.write(output);
fs.writeFileSync(path.join(RESULTS, 'newman-cli-output.txt'), output);
process.exit(result.status ?? 1);
