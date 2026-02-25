import { z } from 'zod';

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'inactive', 'suspended']),
  }),
});

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(6),
    name: z.string().optional(),
    role: z.enum(['super_admin', 'admin', 'student']).optional(),
  }),
});

const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['super_admin', 'admin', 'student', 'instructor']),
  }),
});

const updateAdminSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().toLowerCase().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    email: z.string().email().toLowerCase().optional(),
    password: z.string().min(6).optional(),
  }),
});

export const userValidation = {
  updateStatusSchema,
  createUserSchema,
  updateRoleSchema,
  updateAdminSchema,
  updateUserSchema,
};
