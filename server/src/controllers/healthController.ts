import { Request, Response } from 'express';
import type { HealthResponse } from '../schemas/types.js';

let serverStartTime = Date.now();

export function getHealth(req: Request, res: Response): void {
  const uptime = Date.now() - serverStartTime;

  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.floor(uptime / 1000),
    database: 'connected',
  };

  res.json(response);
}
