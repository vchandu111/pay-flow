import request from 'supertest';
import { app } from '../setup/app.js';
import { disconnectDb, prisma, resetDb } from '../setup/testDb.js';
import { createUser, DEFAULT_TEST_PASSWORD } from '../setup/factories.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and sets cookies', async () => {
    const { user } = await createUser({ email: 'login-ok@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: DEFAULT_TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('payflow_at='))).toBe(true);
  });

  it('rejects an unknown email with a generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever123' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('rejects a wrong password with the same generic message', async () => {
    const { user } = await createUser({ email: 'login-wrongpw@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'TotallyWrong9' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('records a LOGIN_FAILURE audit entry on wrong password', async () => {
    const { user } = await createUser({ email: 'login-audit@example.com' });

    await request(app).post('/api/auth/login').send({ email: user.email, password: 'TotallyWrong9' });

    const logs = await prisma.auditLog.findMany({ where: { userId: user.id, eventType: 'LOGIN_FAILURE' } });
    expect(logs).toHaveLength(1);
  });

  it('rate limits repeated login attempts', async () => {
    const { user } = await createUser({ email: 'login-ratelimit@example.com' });

    let lastStatus = 0;
    for (let i = 0; i < 11; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongEveryTime9' });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
