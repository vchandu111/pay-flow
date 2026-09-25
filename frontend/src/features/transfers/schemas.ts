import { z } from 'zod';

// Mirrors backend/src/shared/contact.ts + transfers/transfers.schemas.ts.
const phoneRegex = /^\+?[0-9]{7,15}$/;
const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Enter an email or phone number')
  .refine((v) => z.email().safeParse(v).success || phoneRegex.test(v), 'Enter a valid email or phone number');

export const sendMoneyFormSchema = z.object({
  identifier: identifierSchema,
  amount: z
    .number({ error: 'Enter a valid amount' })
    .positive('Amount must be greater than 0')
    .max(500000, 'Amount exceeds the maximum allowed transfer'),
  note: z.string().trim().max(140).optional(),
});

export type SendMoneyFormValues = z.infer<typeof sendMoneyFormSchema>;
