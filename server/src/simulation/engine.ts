import { random } from 'crypto';
import { propagateTwoBody, elementsFromOmm, PropagationResult } from '../orbital/propagator.js';
import type { Simulation, SimulationState, Satellite } from '../schemas/types.js';

export interface SimulationConfig {
  satelliteId: string;
  durationSeconds: number;
  timeStepSeconds: number;
  propagationMethod: 'TWO_BODY' | 'SGP4';
  randomSeed?: number;
  perturbations?: {
    dragDensityVariation?: number; // percentage
    srpVariation?: number; // percentage
    initialUncertainty?: number; // km
  };
}

export interface SimulationResult {
  simulation: Simulation;
  states: SimulationState[];
  metadata: {
    propagationMethod: string;
    limitations: string[];
    totalSteps: number;
    randomSeed: number;
  };
}

/**
 * Deterministic random number generator with seed
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * Simulation Engine
 *
 * Generates deterministic orbital simulations based on initial conditions
 * and optional perturbation parameters.
 */
export class SimulationEngine {
  private rng: SeededRandom;

  constructor(seed: number = Date.now()) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Run a complete simulation from start to end
   */
  async runSimulation(
    config: SimulationConfig,
    satellite: Satellite,
    ommData: any
  ): Promise<SimulationResult> {
    const seed = config.randomSeed || this.rng.nextInRange(0, 2 ** 31);
    const localRng = new SeededRandom(seed);

    const simulationId = `SIM-${Date.now()}-${localRng.nextInRange(1000, 9999).toFixed(0)}`;
    const now = new Date();
    const startTime = new Date(now.getTime());
    const endTime = new Date(now.getTime() + config.durationSeconds * 1000);

    const simulation: Simulation = {
      id: simulationId,
      name: `Simulation for ${satellite.name}`,
      satelliteId: config.satelliteId,
      status: 'completed',
      currentTimestampUtc: startTime.toISOString(),
      simulationStartUtc: startTime.toISOString(),
      simulationEndUtc: endTime.toISOString(),
      timeStepSeconds: config.timeStepSeconds,
      propagationMethod: config.propagationMethod,
      randomSeed: seed,
      speedMultiplier: 1,
      parameters: config.perturbations,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const states: SimulationState[] = [];
    const elements = elementsFromOmm(ommData);

    let currentTime = startTime.getTime();
    const endTimeMs = endTime.getTime();
    const stepMs = config.timeStepSeconds * 1000;

    let stepCount = 0;
    const maxSteps = 10000; // Safety limit

    while (currentTime < endTimeMs && stepCount < maxSteps) {
      const deltaTimeSeconds = (currentTime - startTime.getTime()) / 1000;
      const stepDate = new Date(currentTime);

      let result: PropagationResult;

      if (config.propagationMethod === 'TWO_BODY') {
        result = propagateTwoBody(elements, deltaTimeSeconds);
      } else {
        // Fallback to two-body if SGP4 not implemented
        result = propagateTwoBody(elements, deltaTimeSeconds);
        result.limitations.push('SGP4 not implemented, using two-body fallback');
      }

      // Apply perturbations if configured
      if (config.perturbations) {
        const perturbedResult = this.applyPerturbations(result, config.perturbations, localRng);
        result = perturbedResult;
      }

      const state: SimulationState = {
        id: `STATE-${simulationId}-${stepCount}`,
        simulationId: simulationId,
        timestampUtc: stepDate.toISOString(),
        positionX: result.position.x,
        positionY: result.position.y,
        positionZ: result.position.z,
        velocityX: result.velocity.x,
        velocityY: result.velocity.y,
        velocityZ: result.velocity.z,
        altitudeKm: result.altitude,
        speedKmS: result.speed,
        metadata: {
          limitations: result.limitations,
          propagationMethod: config.propagationMethod,
        },
        createdAt: now.toISOString(),
      };

      states.push(state);

      currentTime += stepMs;
      stepCount++;
    }

    return {
      simulation,
      states,
      metadata: {
        propagationMethod: config.propagationMethod,
        limitations: states[0]?.metadata?.limitations || [],
        totalSteps: stepCount,
        randomSeed: seed,
      },
    };
  }

  /**
   * Apply perturbations to propagation result
   */
  private applyPerturbations(
    result: PropagationResult,
    perturbations: NonNullable<SimulationConfig['perturbations']>,
    rng: SeededRandom
  ): PropagationResult {
    const { dragDensityVariation, srpVariation, initialUncertainty } = perturbations;

    // Apply initial position uncertainty
    if (initialUncertainty && initialUncertainty > 0) {
      const uncertaintyKm = initialUncertainty * rng.nextInRange(-1, 1);
      result.position.x += uncertaintyKm;
      result.position.y += uncertaintyKm;
      result.position.z += uncertaintyKm;
    }

    // Apply drag density variation (simplified as altitude drift)
    if (dragDensityVariation && dragDensityVariation !== 0) {
      const dragFactor = 1 + dragDensityVariation / 100;
      const altitudeDrift = (result.altitude * (dragFactor - 1)) * rng.nextInRange(0.5, 1.5);
      result.altitude += altitudeDrift;
    }

    // Apply SRP variation (simplified as transverse drift)
    if (srpVariation && srpVariation !== 0) {
      const srpFactor = 1 + srpVariation / 100;
      const transverseDrift = srpFactor * 0.001 * rng.nextInRange(-1, 1); // Small effect
      result.position.x += transverseDrift;
      result.position.y += transverseDrift;
    }

    // Update limitations metadata
    if (dragDensityVariation) {
      result.limitations.push(`Atmospheric drag density variation: ±${dragDensityVariation}%`);
    }
    if (srpVariation) {
      result.limitations.push(`Solar radiation pressure variation: ±${srpVariation}%`);
    }
    if (initialUncertainty) {
      result.limitations.push(`Initial position uncertainty: ±${initialUncertainty} km`);
    }

    return result;
  }

  /**
   * Step simulation forward by one time step
   */
  stepSimulation(
    elements: any,
    currentTime: Date,
    timeStepSeconds: number,
    config: SimulationConfig
  ): PropagationResult {
    const deltaTimeSeconds = timeStepSeconds;
    const result = propagateTwoBody(elements, deltaTimeSeconds);

    if (config.perturbations) {
      return this.applyPerturbations(result, config.perturbations, this.rng);
    }

    return result;
  }
}
