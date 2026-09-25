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

async function loginAgent(email: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: DEFAULT_TEST_PASSWORD });
  return agent;
}

describe('profile', () => {
  it('updates name, phone, dateOfBirth and address', async () => {
    const { user } = await createUser({ email: 'profile-update@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.patch('/api/users/me').send({
      name: 'Updated Name',
      phone: '+919999999999',
      dateOfBirth: '1995-06-15',
      address: '221B Baker Street',
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Updated Name',
      phone: '+919999999999',
      dateOfBirth: '1995-06-15',
      address: '221B Baker Street',
    });
  });

  it('never accepts email through the profile update payload', async () => {
    const { user } = await createUser({ email: 'profile-noemail@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.patch('/api/users/me').send({ email: 'hacker@example.com', name: 'Still Me' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('profile-noemail@example.com');
  });
});

describe('change password', () => {
  it('changes the password and revokes the current session', async () => {
    const { user } = await createUser({ email: 'pw-change@example.com' });
    const agent = await loginAgent(user.email);

    const changeRes = await agent
      .post('/api/users/me/password')
      .send({ currentPassword: DEFAULT_TEST_PASSWORD, newPassword: 'BrandNewPass9' });
    expect(changeRes.status).toBe(204);

    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(401);

    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: DEFAULT_TEST_PASSWORD });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'BrandNewPass9' });
    expect(newLoginRes.status).toBe(200);
  });

  it('rejects an incorrect current password', async () => {
    const { user } = await createUser({ email: 'pw-wrongcurrent@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent
      .post('/api/users/me/password')
      .send({ currentPassword: 'NotTheRealOne9', newPassword: 'BrandNewPass9' });

    expect(res.status).toBe(401);
  });
});
