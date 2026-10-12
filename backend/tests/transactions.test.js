'use strict';

/**
 * transactions.test.js – Integration tests for Job Request / Transaction endpoints
 *
 * Tests cover:
 *  - Client sends a job request (details + offered amount); it starts as pending
 *  - Only the freelancer who received a request can accept or decline it, once
 *  - Accepting counts as the simulated payment and shows up as income
 *  - Clients and freelancers see only their own requests
 *  - Admin can view all transactions
 *  - Role restrictions enforced (client can't respond or view income; freelancer can't request)
 */

const request = require('supertest');
const {
  app, useTestDatabase, registerAndLogin, createAdminAndLogin, createGig, sendRequest, respond,
} = require('./helpers');

useTestDatabase();

const auth = (token) => ({ Authorization: `Bearer ${token}` });

/** Freelancer with one gig, plus a client who has sent a pending request for it. */
async function pendingRequest(overrides) {
  const freelancer = await registerAndLogin('freelancer');
  const gig        = (await createGig(freelancer.token)).body.gig;
  const client     = await registerAndLogin('client');
  const res        = await sendRequest(client.token, gig.id, overrides);
  return { freelancer, client, gig, tx: res.body.transaction };
}

// ── Sending a request ──────────────────────────────────────────────────────

describe('POST /api/transactions – Send a job request', () => {
  test('client sends a request with details and their own amount; it starts as pending', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gig        = (await createGig(freelancer.token)).body.gig;
    const client     = await registerAndLogin('client');

    const res = await sendRequest(client.token, gig.id, { amount: 750 });

    expect(res.status).toBe(201);
    expect(res.body.transaction.status).toBe('pending');
    expect(res.body.transaction.amount).toBe(750);
    expect(res.body.transaction.details).toMatch(/logo for my bakery/);
    expect(res.body.transaction.client).toBe(client.user.id);
    expect(res.body.transaction.freelancer).toBe(freelancer.user.id);
    expect(res.body.transaction.gig).toBe(gig.id);
  });

  test('client cannot redirect a request to another freelancer via the body', async () => {
    const owner  = await registerAndLogin('freelancer');
    const other  = await registerAndLogin('freelancer');
    const gig    = (await createGig(owner.token)).body.gig;
    const client = await registerAndLogin('client');

    const res = await sendRequest(client.token, gig.id, { freelancer: other.user.id, status: 'accepted' });

    expect(res.status).toBe(201);
    expect(res.body.transaction.freelancer).toBe(owner.user.id);
    expect(res.body.transaction.status).toBe('pending');
  });

  test('work details are HTML-escaped before storage (stored XSS defence)', async () => {
    const { tx } = await pendingRequest({ details: '<script>alert(1)</script> please' });
    expect(tx.details).not.toContain('<script>');
    expect(tx.details).toContain('&lt;script&gt;');
  });

  test.each([
    ['missing details',  { details: undefined }, 'details'],
    ['too-short details', { details: 'short' },  'details'],
    ['missing amount',   { amount: undefined },  'amount'],
    ['zero amount',      { amount: 0 },          'amount'],
    ['non-numeric amount', { amount: 'lots' },   'amount'],
  ])('%s returns 422', async (_label, overrides, field) => {
    const freelancer = await registerAndLogin('freelancer');
    const gig        = (await createGig(freelancer.token)).body.gig;
    const client     = await registerAndLogin('client');

    const res = await sendRequest(client.token, gig.id, overrides);
    expect(res.status).toBe(422);
    expect(res.body.fields.map((f) => f.field)).toContain(field);
  });

  test('freelancer cannot send a request (403)', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gig        = (await createGig(freelancer.token)).body.gig;

    const res = await sendRequest(freelancer.token, gig.id);
    expect(res.status).toBe(403);
  });

  test('sending without a token returns 401', async () => {
    const res = await request(app).post('/api/transactions').send({ gigId: '64b7f0c2a1b2c3d4e5f6a7b8' });
    expect(res.status).toBe(401);
  });

  test('requesting a non-existent gig returns 404', async () => {
    const client = await registerAndLogin('client');
    const res    = await sendRequest(client.token, '64b7f0c2a1b2c3d4e5f6a7b8');
    expect(res.status).toBe(404);
  });

  test('invalid gigId returns 422', async () => {
    const client = await registerAndLogin('client');
    const res    = await sendRequest(client.token, 'not-an-id');
    expect(res.status).toBe(422);
  });
});

// ── Responding to a request ────────────────────────────────────────────────

describe('PATCH /api/transactions/:id – Accept or decline', () => {
  test('freelancer accepts a pending request (simulated payment)', async () => {
    const { freelancer, tx } = await pendingRequest();

    const res = await respond(freelancer.token, tx.id, 'accepted');

    expect(res.status).toBe(200);
    expect(res.body.transaction.status).toBe('accepted');
    expect(res.body.transaction.respondedAt).toBeDefined();
    expect(res.body.message).toMatch(/payment simulated/i);
  });

  test('freelancer declines a pending request', async () => {
    const { freelancer, tx } = await pendingRequest();

    const res = await respond(freelancer.token, tx.id, 'declined');

    expect(res.status).toBe(200);
    expect(res.body.transaction.status).toBe('declined');
  });

  test('a request can only be answered once (409)', async () => {
    const { freelancer, tx } = await pendingRequest();
    await respond(freelancer.token, tx.id, 'declined');

    const res = await respond(freelancer.token, tx.id, 'accepted');
    expect(res.status).toBe(409);
  });

  test('another freelancer cannot respond to a request that is not theirs (403)', async () => {
    const { tx } = await pendingRequest();
    const other  = await registerAndLogin('freelancer');

    const res = await respond(other.token, tx.id, 'accepted');
    expect(res.status).toBe(403);
  });

  test('client cannot accept their own request (403)', async () => {
    const { client, tx } = await pendingRequest();
    const res = await respond(client.token, tx.id, 'accepted');
    expect(res.status).toBe(403);
  });

  test('invalid status value returns 422', async () => {
    const { freelancer, tx } = await pendingRequest();
    const res = await respond(freelancer.token, tx.id, 'pending');
    expect(res.status).toBe(422);
  });

  test('unknown request id returns 404; malformed id returns 422', async () => {
    const freelancer = await registerAndLogin('freelancer');
    expect((await respond(freelancer.token, '64b7f0c2a1b2c3d4e5f6a7b8', 'accepted')).status).toBe(404);
    expect((await respond(freelancer.token, 'not-an-id', 'accepted')).status).toBe(422);
  });
});

// ── Viewing requests ───────────────────────────────────────────────────────

describe('GET /api/transactions/mine – Own requests', () => {
  test('client sees only requests they sent; freelancer sees only requests they received', async () => {
    const freelancerA = await registerAndLogin('freelancer');
    const freelancerB = await registerAndLogin('freelancer');
    const gigA = (await createGig(freelancerA.token)).body.gig;
    const gigB = (await createGig(freelancerB.token)).body.gig;

    const client1 = await registerAndLogin('client');
    const client2 = await registerAndLogin('client');
    await sendRequest(client1.token, gigA.id);
    await sendRequest(client2.token, gigB.id);

    const c1 = await request(app).get('/api/transactions/mine').set(auth(client1.token));
    expect(c1.status).toBe(200);
    expect(c1.body.count).toBe(1);
    expect(c1.body.transactions[0].gig).toBe(gigA.id);
    expect(c1.body.transactions[0].freelancer.name).toBeDefined();

    const fB = await request(app).get('/api/transactions/mine').set(auth(freelancerB.token));
    expect(fB.status).toBe(200);
    expect(fB.body.count).toBe(1);
    expect(fB.body.transactions[0].client.id).toBe(client2.user.id);
    expect(fB.body.transactions[0].details).toBeDefined();
  });

  test('admin is not allowed on /mine (403)', async () => {
    const admin = await createAdminAndLogin();
    const res   = await request(app).get('/api/transactions/mine').set(auth(admin.token));
    expect(res.status).toBe(403);
  });
});

// ── Income ─────────────────────────────────────────────────────────────────

describe('GET /api/transactions/income – Freelancer income summary', () => {
  test('only accepted requests count as income', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gig        = (await createGig(freelancer.token)).body.gig;
    const client     = await registerAndLogin('client');

    const a = (await sendRequest(client.token, gig.id, { amount: 1200 })).body.transaction;
    const b = (await sendRequest(client.token, gig.id, { amount: 800 })).body.transaction;
    const c = (await sendRequest(client.token, gig.id, { amount: 500 })).body.transaction;
    await sendRequest(client.token, gig.id, { amount: 300 }); // left pending
    await respond(freelancer.token, a.id, 'accepted');
    await respond(freelancer.token, b.id, 'accepted');
    await respond(freelancer.token, c.id, 'declined');

    const res = await request(app).get('/api/transactions/income').set(auth(freelancer.token));

    expect(res.status).toBe(200);
    expect(res.body.totalIncome).toBe(2000);
    expect(res.body.estimatedTax).toBe(500); // 25% of 2000
    expect(res.body.bookings).toBe(2);
    expect(res.body.transactions).toHaveLength(2);
  });

  test('income is only counted for the freelancer who received the request', async () => {
    const { freelancer, tx } = await pendingRequest();
    await respond(freelancer.token, tx.id, 'accepted');
    const other = await registerAndLogin('freelancer');

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
    await pendingRequest();

    const admin = await createAdminAndLogin();
    const res   = await request(app).get('/api/transactions').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('admin cannot respond to requests (403)', async () => {
    const { tx } = await pendingRequest();
    const admin  = await createAdminAndLogin();
    const res    = await respond(admin.token, tx.id, 'accepted');
    expect(res.status).toBe(403);
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
