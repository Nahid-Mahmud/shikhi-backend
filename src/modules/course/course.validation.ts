import { CourseStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * When using multipart/form-data the middleware parses req.body.data as a
 * JSON string and overwrites req.body with the parsed object, so we validate
 * clean JSON types here.
 */
const create = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    price: z.coerce.number().nonnegative('Price cannot be negative').optional(),
    isFree: z.boolean().optional(),
    status: z.enum(CourseStatus).optional(),
    categoryId: z.uuid('Invalid category ID').optional(),
  }),
});

const update = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().optional(),
    price: z.coerce.number().nonnegative('Price cannot be negative').optional(),
    isFree: z.boolean().optional(),
    status: z.enum(CourseStatus).optional(),
    categoryId: z.uuid('Invalid category ID').optional(),
  }),
});

// common param validator used for routes that include an :id segment
const params = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID'),
  }),
});

// query validation for listing/filtering courses
const list = z.object({
  query: z.object({
    search: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    category: z.string().optional(),
    instructorId: z.string().uuid('Invalid instructor ID').optional(),
    status: z.enum(CourseStatus).optional(),
    isFree: z.preprocess((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'string') {
        const lowered = val.toLowerCase();
        if (lowered === 'true') return true;
        if (lowered === 'false') return false;
      }
      return val;
    }, z.boolean().optional()),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// change status validation for courses

const statusChange = z.object({
  body: z.object({
    status: z.enum(CourseStatus),
  }),
});

export const courseValidation = { create, update, params, list, statusChange };
