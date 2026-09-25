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

describe('GET /api/transactions', () => {
  it('returns only the caller\'s own transactions, newest first', async () => {
    const { user: userA } = await createUser({ email: 'txn-a@example.com', balance: 1000 });
    const { user: userB } = await createUser({ email: 'txn-b@example.com' });
    const agentA = await loginAgent(userA.email);
    const agentB = await loginAgent(userB.email);

    await agentA.post('/api/wallets/me/topups').send({ amount: 100, description: 'first' });
    await agentB.post('/api/wallets/me/topups').send({ amount: 999, description: 'not-mine' });
    await agentA.post('/api/transfers').send({ identifier: userB.email, amount: 50, note: 'second' });

    const res = await agentA.get('/api/transactions');

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(2);
    expect(res.body.transactions[0].description).toBe('second');
    expect(res.body.transactions[1].description).toBe('first');
    expect(res.body.transactions.every((t: { description: string }) => t.description !== 'not-mine')).toBe(true);
  });

  it('exposes credit/debit direction from each party\'s perspective', async () => {
    const { user: sender } = await createUser({ email: 'txn-dir-a@example.com', balance: 1000 });
    const { user: recipient } = await createUser({ email: 'txn-dir-b@example.com' });
    const senderAgent = await loginAgent(sender.email);
    const recipientAgent = await loginAgent(recipient.email);

    await senderAgent.post('/api/transfers').send({ identifier: recipient.email, amount: 100 });

    const senderView = await senderAgent.get('/api/transactions?type=TRANSFER');
    const recipientView = await recipientAgent.get('/api/transactions?type=TRANSFER');

    expect(senderView.body.transactions[0].direction).toBe('debit');
    expect(recipientView.body.transactions[0].direction).toBe('credit');
  });

  it('filters by type and status', async () => {
    const { user } = await createUser({ email: 'txn-filter@example.com' });
    const agent = await loginAgent(user.email);

    await agent.post('/api/wallets/me/topups').send({ amount: 100 });

    const matching = await agent.get('/api/transactions?type=TOPUP&status=COMPLETED');
    expect(matching.body.transactions).toHaveLength(1);

    const nonMatching = await agent.get('/api/transactions?type=TRANSFER');
    expect(nonMatching.body.transactions).toHaveLength(0);
  });

  it('filters by amount range', async () => {
    const { user } = await createUser({ email: 'txn-amount@example.com' });
    const agent = await loginAgent(user.email);

    await agent.post('/api/wallets/me/topups').send({ amount: 50 });
    await agent.post('/api/wallets/me/topups').send({ amount: 500 });

    const res = await agent.get('/api/transactions?minAmount=100&maxAmount=1000');
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].amount).toBe('500.00');
  });

  it('respects the limit query parameter', async () => {
    const { user } = await createUser({ email: 'txn-limit@example.com' });
    const agent = await loginAgent(user.email);

    for (let i = 0; i < 5; i += 1) {
      await agent.post('/api/wallets/me/topups').send({ amount: 10 });
    }

    const res = await agent.get('/api/transactions?limit=2');
    expect(res.body.transactions).toHaveLength(2);
  });

  it('is rejected when unauthenticated', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });
});
