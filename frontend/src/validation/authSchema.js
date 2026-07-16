import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

// ─── Password strength rules (reused in both schema and UI) ──────────────────
export const passwordRules = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ─── Register schema ─────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(3, 'Name must be at least 3 characters'),

    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),

    phone: z
      .string()
      .min(1, 'Phone number is required')
      .refine((val) => {
        try {
          return isValidPhoneNumber(val);
        } catch {
          return false;
        }
      }, 'Phone number is invalid for the selected country'),

    country: z.string().min(1, 'Country is required'),

    orgName: z.string().optional(),

    role: z.string().min(1, 'Role is required'),

    password: passwordRules,

    confirmPassword: z.string().min(1, 'Please confirm your password'),

    terms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the Terms & Conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Login schema ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),

  password: z.string().min(1, 'Password is required'),
});

export default { registerSchema, loginSchema, passwordRules };
