/**
 * Integration tests — Auth routes
 * Run: npm test
 * Uses an in-memory MongoDB URI so no real DB is touched.
 */
const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../server');

const TEST_USER = {
  name:       'Test User',
  email:      'testuser@findoor.test',
  password:   'Password123',       // uppercase required by server validation
  phone:      '01012345678',
  nationalId: '29901011234567',
};

let authToken = '';

beforeAll(async () => {
  // Give the server time to connect to MongoDB
  await new Promise(r => setTimeout(r, 2000));
  // Remove any leftover test user from a previous run
  try {
    const User = require('../models/User');
    await User.deleteOne({ email: TEST_USER.email });
  } catch (_) {}
});

afterAll(async () => {
  // Clean up test user
  try {
    const User = require('../models/User');
    await User.deleteOne({ email: TEST_USER.email });
  } catch (_) {}
  await mongoose.connection.close();
});

// ── Register ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user.role).toBe('citizen');
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...TEST_USER, email: 'other@findoor.test', name: '' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid NID (not 14 digits)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...TEST_USER, email: 'nid@findoor.test', nationalId: '123' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid phone', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...TEST_USER, email: 'phone@findoor.test', phone: '12345' });

    expect(res.status).toBe(400);
  });
});

// ── Login ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    // Token must embed role so requireAdmin middleware works
    const payload = JSON.parse(
      Buffer.from(res.body.data.token.split('.')[1], 'base64').toString()
    );
    expect(payload).toHaveProperty('role');
    expect(payload.role).toBe('citizen');

    authToken = res.body.data.token;
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'Wrongpassword1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@findoor.test', password: 'pass' });

    expect(res.status).toBe(401);
  });
});

// ── Health ──────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 with running status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── Protected route without token ────────────────────────────────────────────

describe('Protected routes', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
  });
});

// ── Forgot password — no email enumeration ───────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  it('returns 200 even for non-existent email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@findoor.test' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
