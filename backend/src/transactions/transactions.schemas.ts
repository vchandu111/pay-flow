import { z } from 'zod';

export const listTransactionsQuerySchema = z
  .object({
    type: z.enum(['TOPUP', 'WITHDRAWAL', 'TRANSFER']).optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    minAmount: z.coerce.number().nonnegative().optional(),
    maxAmount: z.coerce.number().nonnegative().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((d) => d.minAmount === undefined || d.maxAmount === undefined || d.minAmount <= d.maxAmount, {
    message: 'minAmount must be less than or equal to maxAmount',
    path: ['minAmount'],
  })
  .refine((d) => !d.from || !d.to || d.from <= d.to, {
    message: 'from must be before to',
    path: ['from'],
  });

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
