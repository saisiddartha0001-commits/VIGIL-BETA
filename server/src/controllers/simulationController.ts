import { Request, Response } from 'express';
import { z } from 'zod';
import { SimulationRepository } from '../repositories/simulationRepository.js';
import { SatelliteRepository } from '../repositories/satelliteRepository.js';
import { SimulationEngine } from '../simulation/engine.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse, Simulation, SimulationState } from '../schemas/types.js';

const paramsSchema = z.object({
  id: z.string(),
});

const createSimulationSchema = z.object({
  satelliteId: z.string(),
  durationSeconds: z.number().min(1).max(86400),
  timeStepSeconds: z.number().min(1).max(3600),
  propagationMethod: z.enum(['TWO_BODY', 'SGP4']).default('TWO_BODY'),
  randomSeed: z.number().optional(),
  perturbations: z
    .object({
      dragDensityVariation: z.number().optional(),
      srpVariation: z.number().optional(),
      initialUncertainty: z.number().optional(),
    })
    .optional(),
});

export function listSimulations(req: Request, res: Response): void {
  const simulationRepo = new SimulationRepository(req.app.get('db'));
  const simulations = simulationRepo.findAll(50, 0);

  const response: ApiResponse<Simulation[]> = {
    success: true,
    data: simulations,
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

export function getSimulation(req: Request, res: Response): void {
  const { id } = paramsSchema.parse(req.params);
  const simulationRepo = new SimulationRepository(req.app.get('db'));

  const simulation = simulationRepo.findById(id);

  if (!simulation) {
    throw new AppError(404, 'Simulation not found');
  }

  const response: ApiResponse<Simulation> = {
    success: true,
    data: simulation,
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

export function createSimulation(req: Request, res: Response): void {
  const data = createSimulationSchema.parse(req.body);
  const satelliteRepo = new SatelliteRepository(req.app.get('db'));
  const simulationRepo = new SimulationRepository(req.app.get('db'));

  const satellite = satelliteRepo.findById(data.satelliteId);

  if (!satellite) {
    throw new AppError(404, 'Satellite not found');
  }

  if (!satellite.rawOmm) {
    throw new AppError(400, 'Satellite OMM data not available for simulation');
  }

  // Create simulation record
  const simulationId = `SIM-${Date.now()}`;
  const simulation: Omit<Simulation, 'createdAt' | 'updatedAt'> = {
    id: simulationId,
    name: `Simulation for ${satellite.name}`,
    satelliteId: data.satelliteId,
    status: 'idle',
    timeStepSeconds: data.timeStepSeconds,
    propagationMethod: data.propagationMethod,
    randomSeed: data.randomSeed || Math.floor(Math.random() * 2 ** 31),
    speedMultiplier: 1,
    parameters: data.perturbations,
  };

  simulationRepo.create(simulation);

  const response: ApiResponse<Simulation> = {
    success: true,
    data: simulationRepo.findById(simulationId)!,
    metadata: {
      dataMode: 'SIMULATED',
      sourceType: 'database',
      sourceName: 'VIGIL Backend',
      isSynthetic: true,
      generatedAtUtc: new Date().toISOString(),
      limitations: 'Simulation not yet executed',
    },
  };

  res.status(201).json(response);
}

export async function runSimulation(req: Request, res: Response): Promise<void> {
  const { id } = paramsSchema.parse(req.params);
  const simulationRepo = new SimulationRepository(req.app.get('db'));
  const satelliteRepo = new SatelliteRepository(req.app.get('db'));

  const simulation = simulationRepo.findById(id);

  if (!simulation) {
    throw new AppError(404, 'Simulation not found');
  }

  if (simulation.status === 'running') {
    throw new AppError(400, 'Simulation is already running');
  }

  const satellite = satelliteRepo.findById(simulation.satelliteId);

  if (!satellite || !satellite.rawOmm) {
    throw new AppError(400, 'Satellite OMM data not available');
  }

  // Update simulation status to running
  simulationRepo.update(id, { status: 'running' });

  const engine = new SimulationEngine(simulation.randomSeed);

  const config = {
    satelliteId: simulation.satelliteId,
    durationSeconds: 86400, // Default 24 hours
    timeStepSeconds: simulation.timeStepSeconds,
    propagationMethod: simulation.propagationMethod as any,
    randomSeed: simulation.randomSeed,
    perturbations: simulation.parameters,
  };

  try {
    const result = await engine.runSimulation(config, satellite, satellite.rawOmm);

    // Save states
    simulationRepo.saveStates(result.states);

    // Update simulation status
    simulationRepo.update(id, {
      status: 'completed',
      currentTimestampUtc: result.simulation.simulationEndUtc,
      simulationStartUtc: result.simulation.simulationStartUtc,
      simulationEndUtc: result.simulation.simulationEndUtc,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        simulation: simulationRepo.findById(id),
        states: result.states.slice(0, 100), // Return first 100 states
        metadata: result.metadata,
      },
      metadata: {
        dataMode: 'SIMULATED',
        sourceType: 'simulation',
        sourceName: 'VIGIL Simulation Engine',
        isSynthetic: true,
        generatedAtUtc: new Date().toISOString(),
        limitations: result.metadata.limitations.join('; '),
      },
    };

    res.json(response);
  } catch (error) {
    simulationRepo.update(id, { status: 'error' });
    throw new AppError(500, 'Simulation failed');
  }
}

export function resetSimulation(req: Request, res: Response): void {
  const { id } = paramsSchema.parse(req.params);
  const simulationRepo = new SimulationRepository(req.app.get('db'));

  const simulation = simulationRepo.findById(id);

  if (!simulation) {
    throw new AppError(404, 'Simulation not found');
  }

  // Delete simulation and its states
  simulationRepo.delete(id);

  res.json({
    success: true,
    data: { message: 'Simulation reset successfully' },
  });
}

export function getSimulationStates(req: Request, res: Response): void {
  const { id } = paramsSchema.parse(req.params);
  const simulationRepo = new SimulationRepository(req.app.get('db'));

  const simulation = simulationRepo.findById(id);

  if (!simulation) {
    throw new AppError(404, 'Simulation not found');
  }

  const states = simulationRepo.getStates(id, 1000);

  const response: ApiResponse<SimulationState[]> = {
    success: true,
    data: states,
    metadata: {
      dataMode: 'SIMULATED',
      sourceType: 'database',
      sourceName: 'VIGIL Backend',
      isSynthetic: true,
      generatedAtUtc: new Date().toISOString(),
    },
  };

  res.json(response);
}
