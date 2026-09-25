import { z } from 'zod';
import { identifierSchema } from '../shared/contact.js';

export const addBeneficiarySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  identifier: identifierSchema,
});

export type AddBeneficiaryInput = z.infer<typeof addBeneficiarySchema>;
