import { Request, Response } from 'express';
import { z } from 'zod';
import { AuditRepository } from '../repositories/auditRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse } from '../schemas/types.js';

export function getAuditLogs(req: Request, res: Response): void {
  const auditRepo = new AuditRepository(req.app.get('db'));
  const logs = auditRepo.findAuditLogs(100, 0);

  const response: ApiResponse<any> = {
    success: true,
    data: logs,
    metadata: {
      dataMode: 'SIMULATED',
      sourceType: 'database',
      sourceName: 'VIGIL Backend',
      isSynthetic: false,
      generatedAtUtc: new Date().toISOString(),
    },
  };

  res.json(response);
}

export function getEvidenceGaps(req: Request, res: Response): void {
  const auditRepo = new AuditRepository(req.app.get('db'));
  const gaps = auditRepo.findEvidenceGaps(50, 0);

  const response: ApiResponse<any> = {
    success: true,
    data: gaps,
    metadata: {
      dataMode: 'SIMULATED',
      sourceType: 'database',
      sourceName: 'VIGIL Backend',
      isSynthetic: false,
      generatedAtUtc: new Date().toISOString(),
    },
  };

  res.json(response);
}

export function updateEvidenceGap(req: Request, res: Response): void {
  const { id } = req.params;
  const { status } = req.body;

  if (!['OPEN', 'INVESTIGATING', 'ACKNOWLEDGED'].includes(status)) {
    throw new AppError(400, 'Invalid status');
  }

  const auditRepo = new AuditRepository(req.app.get('db'));
  const updated = auditRepo.updateEvidenceGap(id, { status });

  if (!updated) {
    throw new AppError(404, 'Evidence gap not found');
  }

  const gap = auditRepo.findEvidenceGapById(id);

  const response: ApiResponse<any> = {
    success: true,
    data: gap,
    metadata: {
      dataMode: 'SIMULATED',
      sourceType: 'database',
      sourceName: 'VIGIL Backend',
      isSynthetic: false,
      generatedAtUtc: new Date().toISOString(),
    },
  };

  res.json(response);
}
