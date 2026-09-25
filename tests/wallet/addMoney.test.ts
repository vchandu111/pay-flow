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

async function loginAgent(email: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: DEFAULT_TEST_PASSWORD });
  return agent;
}

describe('POST /api/wallets/me/topups', () => {
  it('credits the wallet and creates a completed TOPUP transaction', async () => {
    const { user, wallet } = await createUser({ email: 'topup-ok@example.com', balance: 100 });
    const agent = await loginAgent(user.email);

    const res = await agent.post('/api/wallets/me/topups').send({ amount: 250.5, description: 'Test' });

    expect(res.status).toBe(201);
    expect(res.body.wallet.balance).toBe('350.50');
    expect(res.body.transaction).toMatchObject({ type: 'TOPUP', status: 'COMPLETED', amount: '250.50' });

    const dbWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
    expect(dbWallet.balance.toFixed(2)).toBe('350.50');
  });

  it('rejects zero and negative amounts', async () => {
    const { user } = await createUser({ email: 'topup-invalid@example.com' });
    const agent = await loginAgent(user.email);

    const zeroRes = await agent.post('/api/wallets/me/topups').send({ amount: 0 });
    expect(zeroRes.status).toBe(400);

    const negativeRes = await agent.post('/api/wallets/me/topups').send({ amount: -50 });
    expect(negativeRes.status).toBe(400);
  });

  it('rejects a non-numeric amount', async () => {
    const { user } = await createUser({ email: 'topup-nan@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.post('/api/wallets/me/topups').send({ amount: 'lots' });
    expect(res.status).toBe(400);
  });

  it('rejects an amount above the maximum allowed top-up', async () => {
    const { user } = await createUser({ email: 'topup-toolarge@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.post('/api/wallets/me/topups').send({ amount: 10_000_000 });
    expect(res.status).toBe(400);
  });

  it('is rejected when unauthenticated', async () => {
    const res = await request(app).post('/api/wallets/me/topups').send({ amount: 100 });
    expect(res.status).toBe(401);
  });

  it('accumulates balance correctly across multiple sequential top-ups', async () => {
    const { user, wallet } = await createUser({ email: 'topup-sequential@example.com', balance: 0 });
    const agent = await loginAgent(user.email);

    await agent.post('/api/wallets/me/topups').send({ amount: 100 });
    await agent.post('/api/wallets/me/topups').send({ amount: 200 });
    await agent.post('/api/wallets/me/topups').send({ amount: 300 });

    const dbWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
    expect(dbWallet.balance.toFixed(2)).toBe('600.00');
  });
});
