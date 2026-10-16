import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler.js';

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  };
}

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  };
}
