import request from 'supertest';
import { app } from '../setup/app.js';
import { disconnectDb, resetDb } from '../setup/testDb.js';
import { createUser, DEFAULT_TEST_PASSWORD } from '../setup/factories.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('session lifecycle', () => {
  it('rejects /users/me with no cookie', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('rotates the refresh token and issues a new access token', async () => {
    const { user } = await createUser({ email: 'session-refresh@example.com' });
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: user.email, password: DEFAULT_TEST_PASSWORD });

    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(204);

    const meRes = await agent.get('/api/users/me');
    expect(meRes.status).toBe(200);
  });

  it('rejects reuse of an already-rotated refresh token and kills the whole session', async () => {
    const { user } = await createUser({ email: 'session-reuse@example.com' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: DEFAULT_TEST_PASSWORD });
    const originalRefreshCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('payflow_rt='),
    )!;

    // Rotate using a second agent seeded with the same original refresh cookie.
    const second = request.agent(app);
    await second.post('/api/auth/refresh').set('Cookie', originalRefreshCookie);

    // Reusing the now-stale original refresh cookie must fail...
    const reuseRes = await request(app).post('/api/auth/refresh').set('Cookie', originalRefreshCookie);
    expect(reuseRes.status).toBe(401);

    // ...and must also invalidate the token that replaced it (whole-family revocation).
    const afterReuseRes = await second.post('/api/auth/refresh');
    expect(afterReuseRes.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const { user } = await createUser({ email: 'session-logout@example.com' });
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: user.email, password: DEFAULT_TEST_PASSWORD });
    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(204);

    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(401);
  });
});
