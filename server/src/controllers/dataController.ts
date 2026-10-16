import { Request, Response } from 'express';
import { z } from 'zod';
import { SatelliteRepository } from '../repositories/satelliteRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';
import type { ApiResponse } from '../schemas/types.js';

export function getDataSources(req: Request, res: Response): void {
  const auditRepo = new AuditRepository(req.app.get('db'));
  const sources = auditRepo.findDataSources(50);

  const response: ApiResponse<any> = {
    success: true,
    data: sources,
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

export function getDataQuality(req: Request, res: Response): void {
  const satelliteRepo = new SatelliteRepository(req.app.get('db'));
  const satellites = satelliteRepo.findAll(10000, 0);

  const qualitySummary = satellites.map(sat => ({
    satelliteId: sat.id,
    satelliteName: sat.name,
    qualityScore: sat.qualityScore,
    freshnessCategory: sat.freshnessCategory,
    covarianceAvailable: sat.covarianceAvailable,
    recordAgeHours: sat.recordAgeHours,
  }));

  const response: ApiResponse<any> = {
    success: true,
    data: {
      summary: qualitySummary,
      averageQualityScore:
        satellites.length > 0
          ? satellites.reduce((sum, sat) => sum + sat.qualityScore, 0) / satellites.length
          : 0,
      totalSatellites: satellites.length,
      withCovariance: satellites.filter(s => s.covarianceAvailable).length,
      freshCount: satellites.filter(s => s.freshnessCategory === 'FRESH').length,
      agingCount: satellites.filter(s => s.freshnessCategory === 'AGING').length,
      staleCount: satellites.filter(s => s.freshnessCategory === 'STALE').length,
    },
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

export function getDataManifest(req: Request, res: Response): void {
  const auditRepo = new AuditRepository(req.app.get('db'));
  const sources = auditRepo.findDataSources(1);

  const response: ApiResponse<any> = {
    success: true,
    data: sources[0] || {
      sourceName: 'VIGIL Backend',
      sourceType: 'database',
      recordCount: 0,
      retrievedAtUtc: new Date().toISOString(),
    },
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
