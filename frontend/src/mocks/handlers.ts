import { http, HttpResponse } from 'msw';

export const testUser = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  phone: '+919810000001',
  dateOfBirth: null,
  address: null,
};

export const testWallet = {
  id: 'wallet-1',
  walletNumber: 'WLT-000001',
  currency: 'INR',
  status: 'ACTIVE',
};

export const KNOWN_RECIPIENT = { name: 'Priya Patel', identifier: 'priya@example.com' };

const INITIAL_BALANCE = 1000;

interface MockTransaction {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  direction: 'credit' | 'debit';
  counterpartyName: string | null;
  createdAt: string;
  from: { walletNumber: string; name: string } | null;
  to: { walletNumber: string; name: string } | null;
  completedAt: string | null;
}

interface MockBeneficiary {
  id: string;
  name: string;
  identifier: string;
  createdAt: string;
}

// Mutable in-memory state so a mutation (top-up, transfer, add beneficiary) followed by
// a re-fetch (the app's real "refresh after X" flow) sees the update, the same way the
// real API would. Reset between tests via resetMockState() (see setupTests.ts).
let currentBalance = INITIAL_BALANCE;
let transactions: MockTransaction[] = [];
let beneficiaries: MockBeneficiary[] = [];
let nextId = 1;

export function resetMockState(): void {
  currentBalance = INITIAL_BALANCE;
  transactions = [];
  beneficiaries = [];
  nextId = 1;
}

function generateId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

export const handlers = [
  http.get('/api/users/me', () => HttpResponse.json({ user: testUser }, { status: 200 })),

  http.post('/api/auth/login', () => HttpResponse.json({ user: testUser }, { status: 200 })),

  http.get('/api/wallets/me', () =>
    HttpResponse.json({ wallet: { ...testWallet, balance: currentBalance.toFixed(2) } }, { status: 200 }),
  ),

  http.post('/api/wallets/me/topups', async ({ request }) => {
    const body = (await request.json()) as { amount: number; description?: string };
    currentBalance += body.amount;

    const transaction: MockTransaction = {
      id: generateId('txn'),
      reference: `TXN-${String(nextId).padStart(6, '0')}`,
      type: 'TOPUP',
      status: 'COMPLETED',
      amount: body.amount.toFixed(2),
      currency: 'INR',
      description: body.description ?? null,
      direction: 'credit',
      counterpartyName: null,
      createdAt: new Date().toISOString(),
      from: null,
      to: { walletNumber: testWallet.walletNumber, name: testUser.name },
      completedAt: new Date().toISOString(),
    };
    transactions = [transaction, ...transactions];

    return HttpResponse.json(
      { wallet: { ...testWallet, balance: currentBalance.toFixed(2) }, transaction },
      { status: 201 },
    );
  }),

  http.get('/api/transactions', () => HttpResponse.json({ transactions }, { status: 200 })),

  http.get('/api/transactions/:id', ({ params }) => {
    const found = transactions.find((t) => t.id === params.id);
    if (!found) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }, { status: 404 });
    }
    return HttpResponse.json({ transaction: found }, { status: 200 });
  }),

  http.get('/api/transfers/recipients/lookup', ({ request }) => {
    const identifier = new URL(request.url).searchParams.get('identifier');
    if (identifier === KNOWN_RECIPIENT.identifier) {
      return HttpResponse.json({ recipient: KNOWN_RECIPIENT }, { status: 200 });
    }
    return HttpResponse.json(
      { error: { code: 'RECIPIENT_NOT_FOUND', message: 'No PayFlow user found with that email or phone' } },
      { status: 404 },
    );
  }),

  http.post('/api/transfers', async ({ request }) => {
    const body = (await request.json()) as { identifier: string; amount: number; note?: string };

    if (body.identifier !== KNOWN_RECIPIENT.identifier) {
      return HttpResponse.json(
        { error: { code: 'RECIPIENT_NOT_FOUND', message: 'No PayFlow user found with that email or phone' } },
        { status: 404 },
      );
    }
    if (body.amount > currentBalance) {
      return HttpResponse.json({ error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' } }, { status: 409 });
    }

    currentBalance -= body.amount;

    const transaction: MockTransaction = {
      id: generateId('txn'),
      reference: `TXN-${String(nextId).padStart(6, '0')}`,
      type: 'TRANSFER',
      status: 'COMPLETED',
      amount: body.amount.toFixed(2),
      currency: 'INR',
      description: body.note ?? null,
      direction: 'debit',
      counterpartyName: KNOWN_RECIPIENT.name,
      createdAt: new Date().toISOString(),
      from: { walletNumber: testWallet.walletNumber, name: testUser.name },
      to: { walletNumber: 'WLT-000002', name: KNOWN_RECIPIENT.name },
      completedAt: new Date().toISOString(),
    };
    transactions = [transaction, ...transactions];

    return HttpResponse.json(
      { wallet: { ...testWallet, balance: currentBalance.toFixed(2) }, transaction },
      { status: 201 },
    );
  }),

  http.get('/api/beneficiaries', () => HttpResponse.json({ beneficiaries }, { status: 200 })),

  http.post('/api/beneficiaries', async ({ request }) => {
    const body = (await request.json()) as { name: string; identifier: string };

    if (beneficiaries.some((b) => b.identifier === body.identifier)) {
      return HttpResponse.json(
        { error: { code: 'BENEFICIARY_EXISTS', message: 'You already have a beneficiary with this email/phone' } },
        { status: 409 },
      );
    }

    const beneficiary: MockBeneficiary = {
      id: generateId('bene'),
      name: body.name,
      identifier: body.identifier,
      createdAt: new Date().toISOString(),
    };
    beneficiaries = [beneficiary, ...beneficiaries];

    return HttpResponse.json({ beneficiary }, { status: 201 });
  }),
];
