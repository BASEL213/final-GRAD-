/**
 * Integration tests — Projects routes
 */
const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../server');

let adminToken = '';
let createdProjectId = '';

beforeAll(async () => {
  await new Promise(r => setTimeout(r, 2000));

  // Login as admin fallback user (works even without DB)
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@gov.eg', password: 'admin123' });

  if (res.body?.data?.token) {
    adminToken = res.body.data.token;
  }
});

afterAll(async () => {
  // Remove test project
  if (createdProjectId) {
    try {
      const Project = require('../models/Project');
      await Project.findByIdAndDelete(createdProjectId);
    } catch (_) {}
  }
  await mongoose.connection.close();
});

// ── GET /api/projects ────────────────────────────────────────────────────────

describe('GET /api/projects', () => {
  it('returns a list of projects (public)', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── POST /api/projects ───────────────────────────────────────────────────────

describe('POST /api/projects', () => {
  const payload = {
    name:           'Test Project',
    location:       'Cairo',
    totalUnits:     100,
    availableUnits: 50,
    priceRange:     '1M - 2M EGP',
    type:           'Apartments',
    status:         'active',
  };

  it('creates a project when admin token is provided', async () => {
    if (!adminToken) return; // skip if fallback login not available
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    if (res.status === 201) {
      createdProjectId = res.body.data?._id || res.body.data?.id;
    }
    expect([201, 200]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('rejects project creation without a token', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send(payload);

    expect(res.status).toBe(401);
  });

  it('rejects project with missing required fields', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
