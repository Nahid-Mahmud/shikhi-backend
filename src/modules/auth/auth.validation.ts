import { z } from 'zod';

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Email is required').toLowerCase(),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters long'),
  }),
});

const registerValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Email is required').toLowerCase(),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters long'),
    name: z.string(),
    role: z.enum(['student', 'instructor']).optional(),
  }),
});

const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Email is required').toLowerCase(),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password is too long'),
  }),
});

export const authValidation = {
  loginValidationSchema,
  registerValidationSchema,
  forgetPasswordValidationSchema,
  resetPasswordValidationSchema,
};
