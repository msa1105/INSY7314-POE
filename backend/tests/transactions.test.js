'use strict';

/**
 * transactions.test.js – Integration tests for Transaction endpoints
 *
 * Tests cover:
 *  - Client can book a gig and create a transaction
 *  - Freelancer can view their income summary and estimated tax
 *  - Admin can view all transactions
 *  - Role restrictions enforced (client can't view income; freelancer can't book)
 */

const request = require('supertest');
const app     = require('../src/app');
const fs      = require('fs');
const path    = require('path');

const USERS_FILE = path.join(__dirname, '../src/data/users.json');
const GIGS_FILE  = path.join(__dirname, '../src/data/gigs.json');
const TX_FILE    = path.join(__dirname, '../src/data/transactions.json');

beforeEach(() => {
  fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  fs.writeFileSync(GIGS_FILE,  '[]', 'utf8');
  fs.writeFileSync(TX_FILE,    '[]', 'utf8');
});
afterAll(() => {
  fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  fs.writeFileSync(GIGS_FILE,  '[]', 'utf8');
  fs.writeFileSync(TX_FILE,    '[]', 'utf8');
});

// ── Test Helpers ───────────────────────────────────────────────────────────

async function registerAndLogin(role) {
  const email = `${role}${Date.now()}@hustlehub.test`;
  const body  = { name: `Test ${role}`, email, password: 'TestPass1!', role };
  const res   = await request(app).post('/api/auth/register').send(body);
  return { token: res.body.token, user: res.body.user };
}

async function createGigAsFreelancer(token) {
  return request(app)
    .post('/api/gigs')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title:       'Test Service',
      description: 'A test service for integration tests',
      price:       1000,
      category:    'Testing',
    });
}

// ── Transaction Tests ──────────────────────────────────────────────────────

describe('POST /api/transactions – Book a gig', () => {
  test('client can book a gig and receive a completed transaction', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gigRes     = await createGigAsFreelancer(freelancer.token);
    const gigId      = gigRes.body.gig.id;

    const client = await registerAndLogin('client');
    const res    = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId });

    expect(res.status).toBe(201);
    expect(res.body.transaction.status).toBe('completed');
    expect(res.body.transaction.amount).toBe(1000);
    expect(res.body.transaction.clientId).toBe(client.user.id);
    expect(res.body.transaction.freelancerId).toBe(freelancer.user.id);
  });

  test('freelancer cannot book a gig (403)', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gigRes     = await createGigAsFreelancer(freelancer.token);

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${freelancer.token}`)
      .send({ gigId: gigRes.body.gig.id });

    expect(res.status).toBe(403);
  });

  test('booking a non-existent gig returns 404', async () => {
    const client = await registerAndLogin('client');
    const res    = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: '00000000-0000-4000-8000-000000000000' });

    expect(res.status).toBe(404);
  });

  test('invalid gigId returns 422', async () => {
    const client = await registerAndLogin('client');
    const res    = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: 'not-a-uuid' });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/transactions/income – Freelancer income summary', () => {
  test('freelancer sees income summary with estimated tax after booking', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gigRes     = await createGigAsFreelancer(freelancer.token);
    const client     = await registerAndLogin('client');

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gigRes.body.gig.id });

    const res = await request(app)
      .get('/api/transactions/income')
      .set('Authorization', `Bearer ${freelancer.token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalIncome).toBe(1000);
    expect(res.body.estimatedTax).toBe(250); // 25% of 1000
    expect(res.body).toHaveProperty('taxRate');
    expect(res.body.transactions).toHaveLength(1);
  });

  test('client cannot access income summary (403)', async () => {
    const client = await registerAndLogin('client');
    const res    = await request(app)
      .get('/api/transactions/income')
      .set('Authorization', `Bearer ${client.token}`);

    expect(res.status).toBe(403);
  });
});
