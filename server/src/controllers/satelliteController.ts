import { Request, Response } from 'express';
import { z } from 'zod';
import { SatelliteRepository } from '../repositories/satelliteRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse, PaginatedResponse, Satellite } from '../schemas/types.js';

const listQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  search: z.string().optional(),
  regime: z.enum(['LEO', 'MEO', 'GEO']).optional(),
});

const paramsSchema = z.object({
  id: z.string(),
});

export function listSatellites(req: Request, res: Response): void {
  const { page, limit, search, regime } = listQuerySchema.parse(req.query);
  const satelliteRepo = new SatelliteRepository(req.app.get('db'));

  let satellites: Satellite[];
  let total: number;

  if (search) {
    satellites = satelliteRepo.search(search, limit);
    total = satellites.length;
  } else if (regime) {
    // Filter by regime
    const all = satelliteRepo.findAll(10000, 0);
    satellites = all.filter(s => s.regime === regime).slice((page - 1) * limit, page * limit);
    total = all.filter(s => s.regime === regime).length;
  } else {
    satellites = satelliteRepo.findAll(limit, (page - 1) * limit);
    total = satelliteRepo.count();
  }

  const totalPages = Math.ceil(total / limit);

  const response: PaginatedResponse<Satellite> = {
    success: true,
    data: satellites,
    pagination: {
      page,
      limit,
      total,
      totalPages,
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

export function getSatellite(req: Request, res: Response): void {
  const { id } = paramsSchema.parse(req.params);
  const satelliteRepo = new SatelliteRepository(req.app.get('db'));

  const satellite = satelliteRepo.findById(id);

  if (!satellite) {
    throw new AppError(404, 'Satellite not found');
  }

  const response: ApiResponse<Satellite> = {
    success: true,
    data: satellite,
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

export function getSatelliteTrajectory(req: Request, res: Response): void {
  const { id } = paramsSchema.parse(req.params);
  const satelliteRepo = new SatelliteRepository(req.app.get('db'));

  const satellite = satelliteRepo.findById(id);

  if (!satellite) {
    throw new AppError(404, 'Satellite not found');
  }

  // Return the raw OMM data for trajectory calculation
  // The frontend will use this for propagation
  const response: ApiResponse<any> = {
    success: true,
    data: {
      satelliteId: satellite.id,
      rawOmm: satellite.rawOmm,
      limitations: [
        'Trajectory data provided as mean orbital elements',
        'Propagation should use SGP4 or two-body model',
        'No covariance data available for uncertainty bounds',
      ],
    },
    metadata: {
      dataMode: 'SIMULATED',
      sourceType: 'database',
      sourceName: 'VIGIL Backend',
      isSynthetic: false,
      generatedAtUtc: new Date().toISOString(),
      units: 'km, km/s, degrees',
      limitations: 'Mean elements only, no covariance',
    },
  };

  res.json(response);
}
