import { z } from 'zod';

// Mirrors backend/src/shared/contact.ts + beneficiaries/beneficiaries.schemas.ts.
const phoneRegex = /^\+?[0-9]{7,15}$/;
const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Enter an email or phone number')
  .refine((v) => z.email().safeParse(v).success || phoneRegex.test(v), 'Enter a valid email or phone number');

export const addBeneficiaryFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  identifier: identifierSchema,
});

export type AddBeneficiaryFormValues = z.infer<typeof addBeneficiaryFormSchema>;
