import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Prisma/database errors
  if (err.message.includes('SQLITE_CONSTRAINT')) {
    res.status(409).json({
      success: false,
      error: 'Resource already exists or violates constraints',
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
