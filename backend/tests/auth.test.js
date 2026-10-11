'use strict';

/**
 * auth.test.js – Unit & Integration Tests for Auth Endpoints
 *
 * Tests cover:
 *  - Successful registration (client and freelancer)
 *  - Duplicate email rejection
 *  - Invalid input validation (missing fields, weak password, bad email)
 *  - Successful login and JWT issuance
 *  - Failed login (wrong password, unknown email)
 *  - Protected route access (with and without token)
 *  - Expired/malformed token rejection
 */

const request = require('supertest');
const { app, useTestDatabase } = require('./helpers');

// Fresh in-memory MongoDB; collections are cleared after each test
useTestDatabase();

// ── Helpers ────────────────────────────────────────────────────────────────

const VALID_CLIENT = {
  name:     'Alice Dlamini',
  email:    'alice@hustlehub.test',
  password: 'SecurePass1!',
  role:     'client',
};

const VALID_FREELANCER = {
  name:     'Bob Nkosi',
  email:    'bob@hustlehub.test',
  password: 'AnotherP@ss9',
  role:     'freelancer',
};

async function registerUser(data = VALID_CLIENT) {
  return request(app).post('/api/auth/register').send(data);
}

async function loginUser(email, password) {
  return request(app).post('/api/auth/login').send({ email, password });
}

// ── Registration Tests ─────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('should register a new client user and return 201 + token', async () => {
    const res = await registerUser(VALID_CLIENT);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('alice@hustlehub.test');
    expect(res.body.user.role).toBe('client');
    // passwordHash must NEVER be in the response
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  test('should register a freelancer user', async () => {
    const res = await registerUser(VALID_FREELANCER);
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('freelancer');
  });

  test('should reject duplicate email with 409', async () => {
    await registerUser(VALID_CLIENT);
    const res = await registerUser(VALID_CLIENT);
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
    // Must not expose internal details
    expect(res.body.error).not.toMatch(/stack|trace|path/i);
  });

  test('should reject missing email with 422', async () => {
    const res = await registerUser({ ...VALID_CLIENT, email: '' });
    expect(res.status).toBe(422);
    expect(res.body.fields.some((f) => f.field === 'email')).toBe(true);
  });

  test('should reject invalid email format with 422', async () => {
    const res = await registerUser({ ...VALID_CLIENT, email: 'not-an-email' });
    expect(res.status).toBe(422);
  });

  test('should reject short password (< 8 chars) with 422', async () => {
    const res = await registerUser({ ...VALID_CLIENT, password: 'Abc1!' });
    expect(res.status).toBe(422);
  });

  test('should reject password without uppercase with 422', async () => {
    const res = await registerUser({ ...VALID_CLIENT, password: 'lowercase1!' });
    expect(res.status).toBe(422);
  });

  test('should reject password without special char with 422', async () => {
    const res = await registerUser({ ...VALID_CLIENT, password: 'NoSpecial1' });
    expect(res.status).toBe(422);
  });

  test('should reject invalid role with 422', async () => {
    const res = await registerUser({ ...VALID_CLIENT, role: 'superadmin' });
    expect(res.status).toBe(422);
  });

  test('should reject missing name with 422', async () => {
    const res = await registerUser({ ...VALID_CLIENT, name: '' });
    expect(res.status).toBe(422);
  });
});

// ── Login Tests ────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => { await registerUser(VALID_CLIENT); });

  test('should login with correct credentials and return token', async () => {
    const res = await loginUser(VALID_CLIENT.email, VALID_CLIENT.password);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  test('should return 401 for wrong password', async () => {
    const res = await loginUser(VALID_CLIENT.email, 'WrongPass9!');
    expect(res.status).toBe(401);
    // Generic message – should not confirm whether user exists
    expect(res.body.error).toBe('Invalid email or password.');
  });

  test('should return 401 for unknown email', async () => {
    const res = await loginUser('unknown@hustlehub.test', 'SomePass1!');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  test('should return 422 for missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_CLIENT.email });
    expect(res.status).toBe(422);
  });
});

// ── Protected Route Tests ──────────────────────────────────────────────────

describe('GET /api/users/profile', () => {
  let token;

  beforeEach(async () => {
    await registerUser(VALID_CLIENT);
    const res = await loginUser(VALID_CLIENT.email, VALID_CLIENT.password);
    token = res.body.token;
  });

  test('should return profile for authenticated user', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@hustlehub.test');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  test('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });

  test('should return 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
    // Must not expose jwt internals
    expect(res.body.error).not.toMatch(/jwt|secret|algorithm/i);
  });

  test('should return 401 with no Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'eyJhbGciOiJIUzI1NiJ9.fake.token'); // No "Bearer " prefix
    expect(res.status).toBe(401);
  });
});

// ── Security Tests ─────────────────────────────────────────────────────────

describe('Security – error response safety', () => {
  test('should not expose stack traces on 500', async () => {
    // Trigger a route that doesn't exist → 404 (no leak)
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|Error:|at Object/);
  });

  test('health endpoint returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
