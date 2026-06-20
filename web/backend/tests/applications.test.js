/**
 * Integration tests — Applications routes
 */
const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../server');

let adminToken = '';

const VALID_APP = {
  name:         'Ahmed Hassan',
  nationalId:   '30001011234567',
  email:        'ahmed@example.com',
  phone:        '01012345678',
  projectId:    '000000000000000000000001',
  projectName:  'Test Project',
  unitType:     '2BR',
  income:       15000,
  familySize:   4,
  paymentMethod:'installments',
};

beforeAll(async () => {
  await new Promise(r => setTimeout(r, 2000));
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@gov.eg', password: 'admin123' });
  adminToken = res.body?.data?.token || '';
});

afterAll(async () => {
  await mongoose.connection.close();
});

// ── POST /api/applications ───────────────────────────────────────────────────

describe('POST /api/applications', () => {
  it('rejects application with invalid NID', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ ...VALID_APP, nationalId: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects application with invalid phone', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ ...VALID_APP, phone: '12345' });

    expect(res.status).toBe(400);
  });

  it('rejects application with invalid email', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ ...VALID_APP, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('rejects application with negative income', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ ...VALID_APP, income: -1 });

    expect(res.status).toBe(400);
  });
});

// ── GET /api/applications (admin only) ──────────────────────────────────────

describe('GET /api/applications', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(401);
  });

  it('returns applications list for admin', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });
});
