import { z } from 'zod';

// Mirrors backend/src/users/users.schemas.ts.
export const updateProfileFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits, optionally prefixed with +'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
});

const changePasswordPasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: changePasswordPasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type UpdateProfileFormValues = z.infer<typeof updateProfileFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
