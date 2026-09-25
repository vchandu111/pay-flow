import { z } from 'zod';

export const phoneRegex = /^\+?[0-9]{7,15}$/;

// Accepts either an email or a phone number — used wherever a user identifies a
// recipient/contact by either (transfers, beneficiaries), not just registration.
export const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Enter an email or phone number')
  .refine((v) => z.email().safeParse(v).success || phoneRegex.test(v), 'Enter a valid email or phone number');

export function normalizeIdentifier(value: string): string {
  return value.includes('@') ? value.toLowerCase() : value;
}
