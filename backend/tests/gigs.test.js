'use strict';

/**
 * gigs.test.js – Integration tests for Gig management
 *
 * Tests cover:
 *  - Freelancers can create, view, update and delete their own gigs
 *  - Freelancers cannot edit or delete other freelancers' gigs
 *  - Clients cannot create, edit or delete gigs
 *  - Admin can delete any gig
 *  - Input validation and HTML escaping on create and update
 */

const request = require('supertest');
const {
  app, useTestDatabase, registerAndLogin, createAdminAndLogin, createGig, VALID_GIG,
} = require('./helpers');

useTestDatabase();

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Gig create & view', () => {
  test('freelancer creates a gig (201) owned by them', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const res = await createGig(freelancer.token);
    expect(res.status).toBe(201);
    expect(res.body.gig.freelancer).toBe(freelancer.user.id);
    expect(res.body.gig.title).toBe(VALID_GIG.title);
  });

  test('client cannot create a gig (403)', async () => {
    const client = await registerAndLogin('client');
    const res    = await createGig(client.token);
    expect(res.status).toBe(403);
  });

  test('unauthenticated users cannot browse gigs (401)', async () => {
    const res = await request(app).get('/api/gigs');
    expect(res.status).toBe(401);
  });

  test('any authenticated user can browse gigs and view one', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const gig        = (await createGig(freelancer.token)).body.gig;
    const client     = await registerAndLogin('client');

    const list = await request(app).get('/api/gigs').set(auth(client.token));
    expect(list.status).toBe(200);
    expect(list.body.count).toBe(1);
    expect(list.body.gigs[0].freelancer.name).toBeDefined();
    expect(list.body.gigs[0].freelancer).not.toHaveProperty('email'); // only public fields

    const one = await request(app).get(`/api/gigs/${gig.id}`).set(auth(client.token));
    expect(one.status).toBe(200);
    expect(one.body.gig.id).toBe(gig.id);
  });

  test('GET /api/gigs/mine returns only the freelancer\'s own gigs', async () => {
    const a = await registerAndLogin('freelancer');
    const b = await registerAndLogin('freelancer');
    await createGig(a.token);
    await createGig(b.token);

    const res = await request(app).get('/api/gigs/mine').set(auth(a.token));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.gigs[0].freelancer).toBe(a.user.id);
  });

  test('invalid gig id returns 422', async () => {
    const client = await registerAndLogin('client');
    const res    = await request(app).get('/api/gigs/not-an-id').set(auth(client.token));
    expect(res.status).toBe(422);
  });

  test('rejects invalid gig input with 422 and field errors', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const res = await createGig(freelancer.token, { title: 'ab', description: 'short', price: -5, category: '' });
    expect(res.status).toBe(422);
    const fields = res.body.fields.map((f) => f.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'description', 'price', 'category']));
  });

  test('HTML in gig input is escaped (stored XSS prevention)', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const res = await createGig(freelancer.token, {
      ...VALID_GIG, title: '<script>alert(1)</script>',
    });
    expect(res.status).toBe(201);
    expect(res.body.gig.title).not.toContain('<script>');
    expect(res.body.gig.title).toContain('&lt;script&gt;');
  });
});

describe('Gig update & delete – ownership', () => {
  test('owner can update their gig', async () => {
    const owner = await registerAndLogin('freelancer');
    const gig   = (await createGig(owner.token)).body.gig;

    const res = await request(app)
      .put(`/api/gigs/${gig.id}`)
      .set(auth(owner.token))
      .send({ price: 1500, title: 'Updated Logo Design' });

    expect(res.status).toBe(200);
    expect(res.body.gig.price).toBe(1500);
    expect(res.body.gig.title).toBe('Updated Logo Design');
    expect(res.body.gig.description).toBe(VALID_GIG.description); // untouched
  });

  test('update input is validated (422)', async () => {
    const owner = await registerAndLogin('freelancer');
    const gig   = (await createGig(owner.token)).body.gig;

    const res = await request(app)
      .put(`/api/gigs/${gig.id}`)
      .set(auth(owner.token))
      .send({ price: 'free', title: 'x' });

    expect(res.status).toBe(422);
  });

  test('update cannot reassign ownership', async () => {
    const owner = await registerAndLogin('freelancer');
    const other = await registerAndLogin('freelancer');
    const gig   = (await createGig(owner.token)).body.gig;

    const res = await request(app)
      .put(`/api/gigs/${gig.id}`)
      .set(auth(owner.token))
      .send({ freelancer: other.user.id, title: 'Still my gig here' });

    expect(res.status).toBe(200);
    expect(res.body.gig.freelancer).toBe(owner.user.id);
  });

  test('another freelancer cannot update or delete the gig (403)', async () => {
    const owner    = await registerAndLogin('freelancer');
    const intruder = await registerAndLogin('freelancer');
    const gig      = (await createGig(owner.token)).body.gig;

    const put = await request(app).put(`/api/gigs/${gig.id}`).set(auth(intruder.token)).send({ price: 1 });
    expect(put.status).toBe(403);

    const del = await request(app).delete(`/api/gigs/${gig.id}`).set(auth(intruder.token));
    expect(del.status).toBe(403);
  });

  test('client cannot update or delete gigs (403)', async () => {
    const owner  = await registerAndLogin('freelancer');
    const client = await registerAndLogin('client');
    const gig    = (await createGig(owner.token)).body.gig;

    const put = await request(app).put(`/api/gigs/${gig.id}`).set(auth(client.token)).send({ price: 1 });
    expect(put.status).toBe(403);
    const del = await request(app).delete(`/api/gigs/${gig.id}`).set(auth(client.token));
    expect(del.status).toBe(403);
  });

  test('owner can delete their gig', async () => {
    const owner = await registerAndLogin('freelancer');
    const gig   = (await createGig(owner.token)).body.gig;

    const del = await request(app).delete(`/api/gigs/${gig.id}`).set(auth(owner.token));
    expect(del.status).toBe(200);

    const get = await request(app).get(`/api/gigs/${gig.id}`).set(auth(owner.token));
    expect(get.status).toBe(404);
  });

  test('admin can delete any gig', async () => {
    const owner = await registerAndLogin('freelancer');
    const gig   = (await createGig(owner.token)).body.gig;
    const admin = await createAdminAndLogin();

    const del = await request(app).delete(`/api/gigs/${gig.id}`).set(auth(admin.token));
    expect(del.status).toBe(200);
  });
});
