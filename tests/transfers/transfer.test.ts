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

describe('POST /api/transfers', () => {
  it('moves money atomically and records exactly one TRANSFER transaction', async () => {
    const { user: sender, wallet: senderWallet } = await createUser({ email: 'xfer-a@example.com', balance: 1000 });
    const { user: recipient, wallet: recipientWallet } = await createUser({
      email: 'xfer-b@example.com',
      balance: 0,
    });
    const agent = await loginAgent(sender.email);

    const res = await agent
      .post('/api/transfers')
      .send({ identifier: recipient.email, amount: 250, note: 'Dinner' });

    expect(res.status).toBe(201);
    expect(res.body.wallet.balance).toBe('750.00');
    expect(res.body.transaction).toMatchObject({
      type: 'TRANSFER',
      status: 'COMPLETED',
      amount: '250.00',
      direction: 'debit',
      counterpartyName: recipient.name,
      to: { walletNumber: recipientWallet.walletNumber },
    });

    const senderDb = await prisma.wallet.findUniqueOrThrow({ where: { id: senderWallet.id } });
    const recipientDb = await prisma.wallet.findUniqueOrThrow({ where: { id: recipientWallet.id } });
    expect(senderDb.balance.toFixed(2)).toBe('750.00');
    expect(recipientDb.balance.toFixed(2)).toBe('250.00');

    const rows = await prisma.transaction.findMany({
      where: { senderWalletId: senderWallet.id, receiverWalletId: recipientWallet.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.type).toBe('TRANSFER');
  });

  it('rejects an amount greater than the balance with 409', async () => {
    const { user: sender } = await createUser({ email: 'xfer-poor@example.com', balance: 50 });
    const { user: recipient } = await createUser({ email: 'xfer-rich@example.com' });
    const agent = await loginAgent(sender.email);

    const res = await agent.post('/api/transfers').send({ identifier: recipient.email, amount: 100 });
    expect(res.status).toBe(409);
  });

  it('rejects an unknown recipient with 404', async () => {
    const { user: sender } = await createUser({ email: 'xfer-c@example.com', balance: 1000 });
    const agent = await loginAgent(sender.email);

    const res = await agent.post('/api/transfers').send({ identifier: 'nobody@example.com', amount: 100 });
    expect(res.status).toBe(404);
  });

  it('rejects invalid amounts', async () => {
    const { user: sender } = await createUser({ email: 'xfer-d@example.com', balance: 1000 });
    const { user: recipient } = await createUser({ email: 'xfer-e@example.com' });
    const agent = await loginAgent(sender.email);

    const zero = await agent.post('/api/transfers').send({ identifier: recipient.email, amount: 0 });
    expect(zero.status).toBe(400);

    const negative = await agent.post('/api/transfers').send({ identifier: recipient.email, amount: -10 });
    expect(negative.status).toBe(400);
  });

  it('rejects sending money to yourself', async () => {
    const { user: sender } = await createUser({ email: 'xfer-self@example.com', balance: 1000 });
    const agent = await loginAgent(sender.email);

    const res = await agent.post('/api/transfers').send({ identifier: sender.email, amount: 100 });
    expect(res.status).toBe(400);
  });

  it('rejects a transfer to a recipient whose wallet is suspended', async () => {
    const { user: sender } = await createUser({ email: 'xfer-f@example.com', balance: 1000 });
    const { user: recipient } = await createUser({ email: 'xfer-g@example.com', walletStatus: 'SUSPENDED' });
    const agent = await loginAgent(sender.email);

    const res = await agent.post('/api/transfers').send({ identifier: recipient.email, amount: 100 });
    expect(res.status).toBe(404);
  });

  it('is rejected when unauthenticated', async () => {
    const res = await request(app).post('/api/transfers').send({ identifier: 'nobody@example.com', amount: 100 });
    expect(res.status).toBe(401);
  });

  it('never lets two concurrent transfers overdraw the same wallet', async () => {
    const { user: sender, wallet: senderWallet } = await createUser({ email: 'xfer-race@example.com', balance: 100 });
    const { user: recipient } = await createUser({ email: 'xfer-race-target@example.com' });
    const agent = await loginAgent(sender.email);

    const [first, second] = await Promise.all([
      agent.post('/api/transfers').send({ identifier: recipient.email, amount: 80 }),
      agent.post('/api/transfers').send({ identifier: recipient.email, amount: 80 }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const senderDb = await prisma.wallet.findUniqueOrThrow({ where: { id: senderWallet.id } });
    expect(senderDb.balance.toFixed(2)).toBe('20.00');
  });
});
