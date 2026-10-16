import { Request, Response } from 'express';
import { SatelliteRepository } from '../repositories/satelliteRepository.js';
import { SimulationRepository } from '../repositories/simulationRepository.js';
import type { OverviewData, ApiResponse } from '../schemas/types.js';

export function getOverview(req: Request, res: Response): void {
  const satelliteRepo = new SatelliteRepository(req.app.get('db'));
  const simulationRepo = new SimulationRepository(req.app.get('db'));

  const satellites = satelliteRepo.findAll(10000, 0);
  const activeSimulations = simulationRepo.findAll(1000, 0).filter(s => s.status === 'running');

  // Calculate regime distribution
  const regimeDistribution = satellites.reduce((acc, sat) => {
    acc[sat.regime] = (acc[sat.regime] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate average quality score
  const avgQualityScore =
    satellites.length > 0
      ? satellites.reduce((sum, sat) => sum + sat.qualityScore, 0) / satellites.length
      : 0;

  // Calculate freshness summary
  const freshnessSummary = satellites.reduce((acc, sat) => {
    acc[sat.freshnessCategory] = (acc[sat.freshnessCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data: OverviewData = {
    satelliteCount: satellites.length,
    regimeDistribution: regimeDistribution as any,
    averageQualityScore: Math.round(avgQualityScore),
    freshnessSummary,
    simulationMode: 'SIMULATED',
    activeSimulations: activeSimulations.length,
  };

  const response: ApiResponse<OverviewData> = {
    success: true,
    data,
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
