/**
 * Shared Simulation Engine & Clock Orchestrator
 * Single source of truth for the entire application.
 * Manages simulation time, play/pause, speed controls, propagation, and emits consistent snapshots.
 */

import {
  SimulationClockState,
  SimulationSnapshot,
  SimulatedSatellite,
  SimulatedConjunction
} from '../types/simulation';
import { generateDeterministicPopulation } from './scenario';
import { propagateKeplerianOrbit } from './orbitalMechanics';
import { scanConjunctions } from './conjunctions';

export type SnapshotListener = (snapshot: SimulationSnapshot) => void;

export class CentralSimulationEngine {
  private clock: SimulationClockState;
  private satellites: SimulatedSatellite[] = [];
  private conjunctions: SimulatedConjunction[] = [];
  private listeners: Set<SnapshotListener> = new Set();
  private timerHandle: any = null;
  private lastTickRealTimeMs = Date.now();
  private seed: number;

  constructor(seed = 42, initialEpochUtc = '2026-10-17T00:00:00.000Z') {
    this.seed = seed;
    const epochMs = new Date(initialEpochUtc).getTime();

    this.clock = {
      currentSimTimeMs: epochMs,
      scenarioStartSimTimeMs: epochMs,
      scenarioEndSimTimeMs: epochMs + 86400 * 1000 * 3, // 3-day scenario
      isPlaying: false,
      speedMultiplier: 10, // 10x real-time default
      timeStepSeconds: 1,
    };

    this.initScenario();
  }

  public initScenario() {
    this.satellites = generateDeterministicPopulation({
      seed: this.seed,
      totalObjects: 24,
      scenarioEpochUtc: new Date(this.clock.scenarioStartSimTimeMs).toISOString(),
    });

    this.recomputeConjunctions();
    this.propagateAll(this.clock.currentSimTimeMs);
  }

  public recomputeConjunctions() {
    this.conjunctions = scanConjunctions(
      this.satellites,
      this.clock.currentSimTimeMs,
      3600 * 12
    );

    // Update satellite statuses based on conjunction results
    for (const sat of this.satellites) {
      const activeConj = this.conjunctions.find(
        c => c.primaryId === sat.id || c.secondaryId === sat.id
      );

      if (activeConj) {
        sat.conjunctionPartnerId = activeConj.primaryId === sat.id ? activeConj.secondaryId : activeConj.primaryId;
        sat.minMissDistanceM = activeConj.missDistanceMeters;
        sat.pocValue = activeConj.collisionProbability;
        sat.tcaUtc = activeConj.tcaUtc;
        if (activeConj.riskSeverity === 'CRITICAL') {
          sat.status = 'CRITICAL_CONJUNCTION';
          sat.riskLevel = 'Critical';
        } else if (activeConj.riskSeverity === 'WARNING') {
          sat.status = 'ELEVATED_RISK';
          sat.riskLevel = 'Elevated';
        }
      }
    }
  }

  public propagateAll(timeMs: number) {
    for (const sat of this.satellites) {
      const state = propagateKeplerianOrbit(sat.elements, timeMs);
      sat.positionKm = state.positionKm;
      sat.velocityKmS = state.velocityKmS;
      sat.speedKmS = state.speedKmS;
      sat.altitudeKm = state.altitudeKm;
      sat.periodMinutes = state.periodMinutes;
    }
  }

  public start() {
    if (this.clock.isPlaying) return;
    this.clock.isPlaying = true;
    this.lastTickRealTimeMs = Date.now();
    this.timerHandle = setInterval(() => this.tick(), 50); // 20 FPS simulation clock cycle
    this.notifyListeners();
  }

  public pause() {
    if (!this.clock.isPlaying) return;
    this.clock.isPlaying = false;
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.notifyListeners();
  }

  public setSpeed(multiplier: number) {
    this.clock.speedMultiplier = Math.max(1, Math.min(3600, multiplier));
    this.notifyListeners();
  }

  public seekTime(targetSimTimeMs: number) {
    this.clock.currentSimTimeMs = Math.max(
      this.clock.scenarioStartSimTimeMs,
      Math.min(this.clock.scenarioEndSimTimeMs, targetSimTimeMs)
    );
    this.propagateAll(this.clock.currentSimTimeMs);
    this.notifyListeners();
  }

  public reset() {
    this.pause();
    this.clock.currentSimTimeMs = this.clock.scenarioStartSimTimeMs;
    this.initScenario();
    this.notifyListeners();
  }

  private tick() {
    const now = Date.now();
    const dtRealMs = now - this.lastTickRealTimeMs;
    this.lastTickRealTimeMs = now;

    // Advance simulation time by real delta * speed multiplier
    const simAdvanceMs = dtRealMs * this.clock.speedMultiplier;
    this.clock.currentSimTimeMs += simAdvanceMs;

    if (this.clock.currentSimTimeMs > this.clock.scenarioEndSimTimeMs) {
      this.clock.currentSimTimeMs = this.clock.scenarioEndSimTimeMs;
      this.pause();
    }

    this.propagateAll(this.clock.currentSimTimeMs);
    this.notifyListeners();
  }

  public getSnapshot(): SimulationSnapshot {
    const activeConjunctions = this.conjunctions.filter(c => c.riskSeverity !== 'LOW');
    const highRiskConjunctions = this.conjunctions.filter(c => c.riskSeverity === 'CRITICAL');

    const leoCount = this.satellites.filter(s => s.regime === 'LEO').length;
    const meoCount = this.satellites.filter(s => s.regime === 'MEO').length;
    const geoCount = this.satellites.filter(s => s.regime === 'GEO').length;
    const debrisCount = this.satellites.filter(s => s.type === 'DEBRIS').length;
    const payloadCount = this.satellites.filter(s => s.type === 'PAYLOAD').length;
    const meanAlt = this.satellites.reduce((sum, s) => sum + s.altitudeKm, 0) / this.satellites.length;
    const meanVel = this.satellites.reduce((sum, s) => sum + s.speedKmS, 0) / this.satellites.length;

    return {
      timestampMs: this.clock.currentSimTimeMs,
      timestampUtc: new Date(this.clock.currentSimTimeMs).toISOString(),
      satellites: [...this.satellites],
      conjunctions: [...this.conjunctions],
      activeConjunctionCount: activeConjunctions.length,
      highRiskCount: highRiskConjunctions.length,
      kpis: {
        totalObjects: this.satellites.length,
        leoCount,
        meoCount,
        geoCount,
        debrisCount,
        payloadCount,
        meanAltitudeKm: Math.round(meanAlt),
        meanVelocityKmS: Math.round(meanVel * 100) / 100,
        closeEncountersNext24h: this.conjunctions.length,
        maxPoc: this.conjunctions.length > 0 ? this.conjunctions[0].collisionProbability : 0,
      },
    };
  }

  public getClock(): SimulationClockState {
    return { ...this.clock };
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    // Send immediate snapshot upon subscribe
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(fn => fn(snapshot));
  }
}

// Global shared singleton for the application
export const sharedSimulationEngine = new CentralSimulationEngine();
