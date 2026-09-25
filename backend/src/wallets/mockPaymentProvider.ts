import crypto from 'node:crypto';

export interface MockPaymentResult {
  success: true;
  providerReference: string;
}

/**
 * Simulated payment provider for the "Add Money" flow — no real payment integration
 * in Phase 1 (per the product spec). Deterministically succeeds after a short delay so
 * the flow feels asynchronous without introducing real network/flakiness.
 */
export async function simulateTopUp(_amount: number): Promise<MockPaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true, providerReference: `MOCK-${crypto.randomUUID()}` };
}
