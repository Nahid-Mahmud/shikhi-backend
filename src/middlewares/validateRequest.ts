import type { NextFunction, Request, Response } from 'express';
import { ZodObject, type ZodRawShape } from 'zod';

export const validateRequest =
  (ZodSchema: ZodObject<ZodRawShape>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body && req.body.data) {
        req.body = JSON.parse(req.body.data);
      }

      // Wrap the request properties to match schema structure
      const validatedData = await ZodSchema.parseAsync({
        body: req.body || {},
        query: req.query,
        params: req.params,
      });

      // Update request with validated data if present in schema
      if (validatedData.body) req.body = validatedData.body;

      // `req.query` and `req.params` may be accessor-only on some environments
      // (assignment can throw). Merge validated values into the existing
      // objects instead of replacing the property.
      if (validatedData.query && typeof validatedData.query === 'object') {
        const q = validatedData.query as Record<string, unknown>;
        const targetQuery = (req.query as Record<string, unknown>) || {};
        Object.keys(q).forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (targetQuery as any)[key] = (q as any)[key];
        });
      }

      if (validatedData.params && typeof validatedData.params === 'object') {
        const p = validatedData.params as Record<string, unknown>;
        const targetParams = (req.params as Record<string, unknown>) || {};
        Object.keys(p).forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (targetParams as any)[key] = (p as any)[key];
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
