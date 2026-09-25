import { z } from 'zod';

// Positive amount, at most 2 decimal places, capped well above any realistic demo
// top-up so validation still rejects absurd/overflow-probing values.
export const addMoneySchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(500000, 'Amount exceeds the maximum allowed top-up')
    .refine((n) => Number.isInteger(n * 100), 'Amount must have at most 2 decimal places'),
  description: z.string().trim().max(140).optional(),
});

export type AddMoneyInput = z.infer<typeof addMoneySchema>;
