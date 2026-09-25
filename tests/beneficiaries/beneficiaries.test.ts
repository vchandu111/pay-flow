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

describe('beneficiaries', () => {
  it('adds a beneficiary by email', async () => {
    const { user } = await createUser({ email: 'bene-owner@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.post('/api/beneficiaries').send({ name: 'Rahul', identifier: 'rahul@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.beneficiary).toMatchObject({ name: 'Rahul', identifier: 'rahul@example.com' });
  });

  it('adds a beneficiary by phone', async () => {
    const { user } = await createUser({ email: 'bene-owner2@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.post('/api/beneficiaries').send({ name: 'Arjun', identifier: '+919812340000' });

    expect(res.status).toBe(201);
    expect(res.body.beneficiary).toMatchObject({ name: 'Arjun', identifier: '+919812340000' });
  });

  it('rejects a duplicate identifier for the same owner with 409', async () => {
    const { user } = await createUser({ email: 'bene-owner3@example.com' });
    const agent = await loginAgent(user.email);

    await agent.post('/api/beneficiaries').send({ name: 'Rahul', identifier: 'rahul@example.com' });
    const res = await agent.post('/api/beneficiaries').send({ name: 'Rahul S', identifier: 'rahul@example.com' });

    expect(res.status).toBe(409);
  });

  it('allows two different owners to save the same identifier', async () => {
    const { user: ownerA } = await createUser({ email: 'bene-a@example.com' });
    const { user: ownerB } = await createUser({ email: 'bene-b@example.com' });
    const agentA = await loginAgent(ownerA.email);
    const agentB = await loginAgent(ownerB.email);

    const resA = await agentA.post('/api/beneficiaries').send({ name: 'Rahul', identifier: 'rahul@example.com' });
    const resB = await agentB.post('/api/beneficiaries').send({ name: 'Rahul', identifier: 'rahul@example.com' });

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
  });

  it('rejects an invalid identifier', async () => {
    const { user } = await createUser({ email: 'bene-owner4@example.com' });
    const agent = await loginAgent(user.email);

    const res = await agent.post('/api/beneficiaries').send({ name: 'Rahul', identifier: 'not-an-email-or-phone' });
    expect(res.status).toBe(400);
  });

  it('lists only the caller\'s own beneficiaries, newest first', async () => {
    const { user: ownerA } = await createUser({ email: 'bene-list-a@example.com' });
    const { user: ownerB } = await createUser({ email: 'bene-list-b@example.com' });
    const agentA = await loginAgent(ownerA.email);
    const agentB = await loginAgent(ownerB.email);

    await agentA.post('/api/beneficiaries').send({ name: 'First', identifier: 'first@example.com' });
    await agentB.post('/api/beneficiaries').send({ name: 'NotMine', identifier: 'notmine@example.com' });
    await agentA.post('/api/beneficiaries').send({ name: 'Second', identifier: 'second@example.com' });

    const res = await agentA.get('/api/beneficiaries');

    expect(res.status).toBe(200);
    expect(res.body.beneficiaries).toHaveLength(2);
    expect(res.body.beneficiaries[0].name).toBe('Second');
    expect(res.body.beneficiaries[1].name).toBe('First');
  });

  it('is rejected when unauthenticated', async () => {
    const res = await request(app).get('/api/beneficiaries');
    expect(res.status).toBe(401);
  });
});
