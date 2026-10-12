'use strict';

/**
 * helpers.js – Shared test setup
 *
 * Each test file gets its own throwaway in-memory MongoDB, and every
 * collection is emptied after each test so tests stay isolated.
 */

const request  = require('supertest');
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app  = require('../src/app');
const User = require('../src/models/User');

const PASSWORD = 'TestPass1!';

function useTestDatabase() {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
}

let counter = 0;

/** Registers a client or freelancer through the API and returns { token, user }. */
async function registerAndLogin(role) {
  counter += 1;
  const res = await request(app).post('/api/auth/register').send({
    name:     `Test ${role} ${counter}`,
    email:    `${role}${counter}@hustlehub.test`,
    password: PASSWORD,
    role,
  });
  return { token: res.body.token, user: res.body.user };
}

/** Admins cannot self-register, so create one directly and log in via the API. */
async function createAdminAndLogin() {
  counter += 1;
  const email = `admin${counter}@hustlehub.test`;
  await User.create({
    name: 'Test Admin', email, role: 'admin', passwordHash: await bcrypt.hash(PASSWORD, 4),
  });
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return { token: res.body.token, user: res.body.user };
}

const VALID_GIG = {
  title:       'Logo Design Service',
  description: 'Professional logo design with three revisions included.',
  price:       1000,
  category:    'Design',
};

function createGig(token, gig = VALID_GIG) {
  return request(app).post('/api/gigs').set('Authorization', `Bearer ${token}`).send(gig);
}

const VALID_REQUEST = {
  details: 'Need a logo for my bakery, warm colours, delivered within a week.',
  amount:  800,
};

/** Client sends a job request for a gig (details + offered amount). */
function sendRequest(token, gigId, overrides = {}) {
  return request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
    .send({ gigId, ...VALID_REQUEST, ...overrides });
}

/** Freelancer accepts or declines a request. */
function respond(token, txId, status) {
  return request(app).patch(`/api/transactions/${txId}`).set('Authorization', `Bearer ${token}`).send({ status });
}

module.exports = {
  app, useTestDatabase, registerAndLogin, createAdminAndLogin, createGig, sendRequest, respond, VALID_GIG, VALID_REQUEST, PASSWORD,
};
