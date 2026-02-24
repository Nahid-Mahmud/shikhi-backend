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
      if (validatedData.query)
        req.query = validatedData.query as unknown as typeof req.query;
      if (validatedData.params)
        req.params = validatedData.params as unknown as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
