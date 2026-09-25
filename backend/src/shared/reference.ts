import crypto from 'node:crypto';

function randomDigits(length: number): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(length, '0');
}

export function generateWalletNumber(): string {
  return `WLT-${randomDigits(6)}`;
}

export function generateTransactionReference(): string {
  return `TXN-${randomDigits(6)}`;
}
