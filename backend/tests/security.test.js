'use strict';

/**
 * security.test.js – Tests for cross-cutting security controls
 *
 * Tests cover:
 *  - NoSQL injection attempts are neutralised
 *  - JWT issuer/audience and signature checks
 *  - Admin-only user listing (RBAC)
 *  - Admin role cannot be self-assigned at registration
 *  - Rate limiters return 429 with a meaningful JSON message
 *  - Helmet security headers and Content Security Policy
 */

const express = require('express');
const jwt     = require('jsonwebtoken');
const request = require('supertest');
const {
  app, useTestDatabase, registerAndLogin, createAdminAndLogin, PASSWORD,
} = require('./helpers');
const { buildLimiters }   = require('../src/middleware/rateLimiter');
const { stripUnsafeKeys } = require('../src/middleware/sanitize');

useTestDatabase();

describe('NoSQL injection protection', () => {
  test('operator object in login email is rejected, not used as a query', async () => {
    await registerAndLogin('client');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect([401, 422]).toContain(res.status);
    expect(res.body).not.toHaveProperty('token');
  });

  test('stripUnsafeKeys removes $ and dotted keys at any depth', () => {
    const input = { a: 1, $where: 'x', nested: { 'b.c': 2, ok: [{ $gt: 1, keep: true }] } };
    expect(stripUnsafeKeys(input)).toBe(true);
    expect(input).toEqual({ a: 1, nested: { ok: [{ keep: true }] } });
  });
});

describe('JWT validation', () => {
  const secret = process.env.JWT_SECRET;

  test('token with wrong audience is rejected (401)', async () => {
    const { user } = await registerAndLogin('client');
    const token = jwt.sign({ id: user.id, role: 'client' }, secret, {
      issuer: 'hustlehub-api', audience: 'some-other-service', expiresIn: '1h',
    });
    const res = await request(app).get('/api/users/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('token signed with a different secret is rejected (401)', async () => {
    const token = jwt.sign({ id: 'x', role: 'admin' }, 'attacker-secret', {
      issuer: 'hustlehub-api', audience: 'hustlehub-client',
    });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('expired token is rejected with a clear message (401)', async () => {
    const token = jwt.sign({ id: 'x', role: 'client' }, secret, {
      issuer: 'hustlehub-api', audience: 'hustlehub-client', expiresIn: -10,
    });
    const res = await request(app).get('/api/users/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });
});

describe('Admin access control', () => {
  test('admin can list users; passwords never included', async () => {
    await registerAndLogin('client');
    const admin = await createAdminAndLogin();
    const res   = await request(app).get('/api/users').set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    res.body.users.forEach((u) => expect(u).not.toHaveProperty('passwordHash'));
  });

  test('non-admins cannot list users (403)', async () => {
    const freelancer = await registerAndLogin('freelancer');
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${freelancer.token}`);
    expect(res.status).toBe(403);
  });

  test('cannot self-register as admin (422)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky', email: 'sneaky@hustlehub.test', password: PASSWORD, role: 'admin',
    });
    expect(res.status).toBe(422);
  });

  test('registration rejects passwords over 128 characters (bcrypt DoS guard)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Long', email: 'long@hustlehub.test', password: `Aa1!${'x'.repeat(130)}`,
    });
    expect(res.status).toBe(422);
  });
});

describe('Rate limiting', () => {
  // The app bypasses limiters under NODE_ENV=test, so mount real ones here.
  function appWith(limiter) {
    const mini = express();
    mini.post('/target', limiter, (_req, res) => res.status(200).json({ ok: true }));
    return mini;
  }

  test('booking limiter returns 429 with a JSON message after 10 requests', async () => {
    const mini = appWith(buildLimiters().bookingLimiter);
    for (let i = 0; i < 10; i += 1) {
      expect((await request(mini).post('/target')).status).toBe(200);
    }
    const blocked = await request(mini).post('/target');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many booking attempts/i);
    expect(blocked.body.retryAfterSeconds).toBe(900);
    expect(blocked.headers).toHaveProperty('ratelimit-limit');
  });

  test('auth limiter returns 429 after 20 requests', async () => {
    const mini = appWith(buildLimiters().authLimiter);
    for (let i = 0; i < 20; i += 1) await request(mini).post('/target');
    const blocked = await request(mini).post('/target');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many authentication attempts/i);
  });
});

describe('Security headers', () => {
  test('Helmet sets CSP, HSTS, nosniff and frame protection', async () => {
    const res = await request(app).get('/api/health');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers['strict-transport-security']).toMatch(/max-age=31536000/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('requests from an unknown origin are refused with 403', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });
});
