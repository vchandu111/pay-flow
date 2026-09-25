import request from 'supertest';
import { app } from '../setup/app.js';
import { disconnectDb, prisma, resetDb } from '../setup/testDb.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

const validPayload = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '+919812345678',
  password: 'CorrectHorse9',
  confirmPassword: 'CorrectHorse9',
};

describe('POST /api/auth/register', () => {
  it('creates a user and wallet, and sets auth cookies', async () => {
    const res = await request(app).post('/api/auth/register').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Jordan Lee', email: 'jordan@example.com' });

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('payflow_at='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('payflow_rt='))).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId: res.body.user.id } });
    expect(wallet).not.toBeNull();
    expect(wallet?.balance.toNumber()).toBe(0);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validPayload);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, phone: '+919812345679' });

    expect(res.status).toBe(409);
  });

  it('rejects a duplicate phone with 409', async () => {
    await request(app).post('/api/auth/register').send(validPayload);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, email: 'other@example.com' });

    expect(res.status).toBe(409);
  });

  it('rejects a password that is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, password: 'short1', confirmPassword: 'short1' });

    expect(res.status).toBe(400);
  });

  it('rejects mismatched password confirmation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, confirmPassword: 'SomethingElse9' });

    expect(res.status).toBe(400);
  });
});
