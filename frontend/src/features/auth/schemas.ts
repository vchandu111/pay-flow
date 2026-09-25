import { z } from 'zod';

// Mirrors backend/src/auth/auth.schemas.ts — kept in sync by hand for Phase 1.
const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.email('Invalid email address'),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits, optionally prefixed with +'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginFormSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
