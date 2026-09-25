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

describe('GET /api/transactions/:id', () => {
  it('is visible to the sender', async () => {
    const { user: sender } = await createUser({ email: 'detail-sender@example.com', balance: 1000 });
    const { user: recipient } = await createUser({ email: 'detail-recipient@example.com' });
    const senderAgent = await loginAgent(sender.email);

    const transferRes = await senderAgent
      .post('/api/transfers')
      .send({ identifier: recipient.email, amount: 100, note: 'test' });
    const id = transferRes.body.transaction.id as string;

    const res = await senderAgent.get(`/api/transactions/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.transaction).toMatchObject({ id, description: 'test', direction: 'debit' });
  });

  it('is visible to the receiver', async () => {
    const { user: sender } = await createUser({ email: 'detail-sender2@example.com', balance: 1000 });
    const { user: recipient } = await createUser({ email: 'detail-recipient2@example.com' });
    const senderAgent = await loginAgent(sender.email);
    const recipientAgent = await loginAgent(recipient.email);

    const transferRes = await senderAgent.post('/api/transfers').send({ identifier: recipient.email, amount: 100 });
    const id = transferRes.body.transaction.id as string;

    const res = await recipientAgent.get(`/api/transactions/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.transaction.direction).toBe('credit');
  });

  it('returns 404 for a transaction the caller is not a party to', async () => {
    const { user: sender } = await createUser({ email: 'detail-sender3@example.com', balance: 1000 });
    const { user: recipient } = await createUser({ email: 'detail-recipient3@example.com' });
    const { user: outsider } = await createUser({ email: 'detail-outsider@example.com' });
    const senderAgent = await loginAgent(sender.email);
    const outsiderAgent = await loginAgent(outsider.email);

    const transferRes = await senderAgent.post('/api/transfers').send({ identifier: recipient.email, amount: 100 });
    const id = transferRes.body.transaction.id as string;

    const res = await outsiderAgent.get(`/api/transactions/${id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a malformed id', async () => {
    const { user } = await createUser({ email: 'detail-malformed@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.get('/api/transactions/not-a-uuid');
    expect(res.status).toBe(404);
  });

  it('is rejected when unauthenticated', async () => {
    const res = await request(app).get('/api/transactions/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });
});
