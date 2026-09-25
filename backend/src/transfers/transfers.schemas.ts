import { z } from 'zod';
import { identifierSchema } from '../shared/contact.js';

export const lookupRecipientQuerySchema = z.object({
  identifier: identifierSchema,
});

// Same amount policy as wallets/wallets.schemas.ts's addMoneySchema.
export const createTransferSchema = z.object({
  identifier: identifierSchema,
  amount: z
    .number()
    .max(500000, 'Amount exceeds the maximum allowed transfer')
    .refine((n) => Number.isInteger(n * 100), 'Amount must have at most 2 decimal places'),
  note: z.string().trim().max(140).optional(),
});

export type LookupRecipientQuery = z.infer<typeof lookupRecipientQuerySchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
