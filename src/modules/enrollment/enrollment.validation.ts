import { EnrollmentStatus } from '@prisma/client';
import { z } from 'zod';

const create = z.object({
  body: z.object({
    courseId: z.string().uuid('Invalid Course ID'),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum(EnrollmentStatus),
  }),
});

const params = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID'),
  }),
});

const list = z.object({
  query: z.object({
    courseId: z.string().uuid('Invalid course ID').optional(),
    studentId: z.string().uuid('Invalid student ID').optional(),
    status: z.nativeEnum(EnrollmentStatus).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const enrollmentValidation = {
  create,
  updateStatus,
  params,
  list,
};
