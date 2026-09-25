import { z } from 'zod';

// Mirrors backend/src/wallets/wallets.schemas.ts. `amount` is coerced to a number by
// react-hook-form's `valueAsNumber` on the input, not by the schema — see AddMoneyModal.
export const addMoneyFormSchema = z.object({
  amount: z
    .number({ error: 'Enter a valid amount' })
    .positive('Amount must be greater than 0')
    .max(500000, 'Amount exceeds the maximum allowed top-up'),
  description: z.string().trim().max(140).optional(),
});

export type AddMoneyFormValues = z.infer<typeof addMoneyFormSchema>;
