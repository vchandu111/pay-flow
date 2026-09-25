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

describe('GET /api/transfers/recipients/lookup', () => {
  it('resolves a known recipient by email', async () => {
    const { user: sender } = await createUser({ email: 'lookup-sender@example.com' });
    const { user: recipient } = await createUser({ email: 'lookup-recipient@example.com', name: 'Recipient Person' });
    const agent = await loginAgent(sender.email);

    const res = await agent.get(`/api/transfers/recipients/lookup?identifier=${recipient.email}`);

    expect(res.status).toBe(200);
    expect(res.body.recipient).toMatchObject({ name: 'Recipient Person' });
  });

  it('resolves a known recipient by phone', async () => {
    const { user: sender } = await createUser({ email: 'lookup-sender2@example.com' });
    const { user: recipient } = await createUser({ phone: '+919811112222', name: 'Phone Person' });
    const agent = await loginAgent(sender.email);

    const res = await agent.get(
      `/api/transfers/recipients/lookup?identifier=${encodeURIComponent(recipient.phone)}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.recipient).toMatchObject({ name: 'Phone Person' });
  });

  it('returns 404 for an unknown identifier', async () => {
    const { user: sender } = await createUser({ email: 'lookup-sender3@example.com' });
    const agent = await loginAgent(sender.email);

    const res = await agent.get('/api/transfers/recipients/lookup?identifier=nobody@example.com');
    expect(res.status).toBe(404);
  });

  it('returns 400 when looking up yourself', async () => {
    const { user: sender } = await createUser({ email: 'lookup-self@example.com' });
    const agent = await loginAgent(sender.email);

    const res = await agent.get(`/api/transfers/recipients/lookup?identifier=${sender.email}`);
    expect(res.status).toBe(400);
  });

  it('is rejected when unauthenticated', async () => {
    const res = await request(app).get('/api/transfers/recipients/lookup?identifier=nobody@example.com');
    expect(res.status).toBe(401);
  });
});
