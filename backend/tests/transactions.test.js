'use strict';

/**
 * transactions.test.js – Integration tests for Booking / Transaction endpoints
 *
 * Tests cover:
 *  - Client can book a gig and a transaction is recorded for both parties
 *  - Clients and freelancers see only their own bookings
 *  - Freelancer can view their income summary and estimated tax
 *  - Admin can view all transactions
 *  - Role restrictions enforced (client can't view income; freelancer can't book)
 */

const request = require('supertest');
const {
  app, useTestDatabase, registerAndLogin, createAdminAndLogin, createGig, bookGig,
} = require('./helpers');

useTestDatabase();

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// ── Booking ────────────────────────────────────────────────────────────────

describe('POST /api/transactions – Book a gig', () => {
  test('client can book a gig and receive a completed transaction', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gigRes     = await createGig(freelancer.token);
    const client     = await registerAndLogin('client');

    const res = await bookGig(client.token, gigRes.body.gig.id);

    expect(res.status).toBe(201);
    expect(res.body.transaction.status).toBe('completed');
    expect(res.body.transaction.amount).toBe(1000);
    expect(res.body.transaction.client).toBe(client.user.id);
    expect(res.body.transaction.freelancer).toBe(freelancer.user.id);
    expect(res.body.transaction.gig).toBe(gigRes.body.gig.id);
  });

  test('client cannot override the price in the request body', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gigRes     = await createGig(freelancer.token);
    const client     = await registerAndLogin('client');

    const res = await request(app)
      .post('/api/transactions')
      .set(auth(client.token))
      .send({ gigId: gigRes.body.gig.id, amount: 1 });

    expect(res.status).toBe(201);
    expect(res.body.transaction.amount).toBe(1000);
  });

  test('freelancer cannot book a gig (403)', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gigRes     = await createGig(freelancer.token);

    const res = await bookGig(freelancer.token, gigRes.body.gig.id);
    expect(res.status).toBe(403);
  });

  test('booking without a token returns 401', async () => {
    const res = await request(app).post('/api/transactions').send({ gigId: '64b7f0c2a1b2c3d4e5f6a7b8' });
    expect(res.status).toBe(401);
  });

  test('booking a non-existent gig returns 404', async () => {
    const client = await registerAndLogin('client');
    const res    = await bookGig(client.token, '64b7f0c2a1b2c3d4e5f6a7b8');
    expect(res.status).toBe(404);
  });

  test('invalid gigId returns 422', async () => {
    const client = await registerAndLogin('client');
    const res    = await bookGig(client.token, 'not-an-id');
    expect(res.status).toBe(422);
  });
});

// ── Viewing bookings ───────────────────────────────────────────────────────

describe('GET /api/transactions/mine – Own bookings', () => {
  test('client sees only bookings they made; freelancer sees only bookings they received', async () => {
    const freelancerA = await registerAndLogin('freelancer');
    const freelancerB = await registerAndLogin('freelancer');
    const gigA = (await createGig(freelancerA.token)).body.gig;
    const gigB = (await createGig(freelancerB.token)).body.gig;

    const client1 = await registerAndLogin('client');
    const client2 = await registerAndLogin('client');
    await bookGig(client1.token, gigA.id);
    await bookGig(client2.token, gigB.id);

    const c1 = await request(app).get('/api/transactions/mine').set(auth(client1.token));
    expect(c1.status).toBe(200);
    expect(c1.body.count).toBe(1);
    expect(c1.body.transactions[0].gig).toBe(gigA.id);
    expect(c1.body.transactions[0].freelancer.name).toBeDefined();

    const fB = await request(app).get('/api/transactions/mine').set(auth(freelancerB.token));
    expect(fB.status).toBe(200);
    expect(fB.body.count).toBe(1);
    expect(fB.body.transactions[0].client.id).toBe(client2.user.id);
  });

  test('admin is not allowed on /mine (403)', async () => {
    const admin = await createAdminAndLogin();
    const res   = await request(app).get('/api/transactions/mine').set(auth(admin.token));
    expect(res.status).toBe(403);
  });
});

// ── Income ─────────────────────────────────────────────────────────────────

describe('GET /api/transactions/income – Freelancer income summary', () => {
  test('freelancer sees income summary with estimated tax after booking', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gigRes     = await createGig(freelancer.token);
    const client     = await registerAndLogin('client');
    await bookGig(client.token, gigRes.body.gig.id);
    await bookGig(client.token, gigRes.body.gig.id);

    const res = await request(app).get('/api/transactions/income').set(auth(freelancer.token));

    expect(res.status).toBe(200);
    expect(res.body.totalIncome).toBe(2000);
    expect(res.body.estimatedTax).toBe(500); // 25% of 2000
    expect(res.body.bookings).toBe(2);
    expect(res.body.transactions).toHaveLength(2);
  });

  test('income is only counted for the freelancer who owns the gig', async () => {
    const owner  = await registerAndLogin('freelancer');
    const other  = await registerAndLogin('freelancer');
    const gig    = (await createGig(owner.token)).body.gig;
    const client = await registerAndLogin('client');
    await bookGig(client.token, gig.id);

    const res = await request(app).get('/api/transactions/income').set(auth(other.token));
    expect(res.body.totalIncome).toBe(0);
  });

  test('client cannot access income summary (403)', async () => {
    const client = await registerAndLogin('client');
    const res    = await request(app).get('/api/transactions/income').set(auth(client.token));
    expect(res.status).toBe(403);
  });
});

// ── Admin ──────────────────────────────────────────────────────────────────

describe('GET /api/transactions – Admin view', () => {
  test('admin sees all transactions', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gig        = (await createGig(freelancer.token)).body.gig;
    const client     = await registerAndLogin('client');
    await bookGig(client.token, gig.id);

    const admin = await createAdminAndLogin();
    const res   = await request(app).get('/api/transactions').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('client and freelancer cannot view all transactions (403)', async () => {
    const client     = await registerAndLogin('client');
    const freelancer = await registerAndLogin('freelancer');
    for (const user of [client, freelancer]) {
      const res = await request(app).get('/api/transactions').set(auth(user.token));
      expect(res.status).toBe(403);
    }
  });
});
