import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = config.rateLimitWindowMs;
  const maxRequests = config.rateLimitMaxRequests;

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    // Reset window
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (record.count >= maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
    });
    return;
  }

  record.count++;
  next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60000); // Clean up every minute
