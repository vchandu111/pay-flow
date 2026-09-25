import { z } from 'zod';
import { phoneRegex } from '../shared/contact.js';

// Shared password policy: long enough to resist brute force, and not purely numeric/alpha
// so trivially-guessable passwords ("password", "12345678") are rejected.
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.email('Invalid email address').toLowerCase(),
    phone: z.string().trim().regex(phoneRegex, 'Phone must be 7-15 digits, optionally prefixed with +'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
