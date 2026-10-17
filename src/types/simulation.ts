/**
 * VIGIL Simulation Types & Data Structures
 * Self-contained, deterministic orbital mechanics and simulation contracts
 */

import { OrbitRegime, RiskLevel, AuditVerdict } from './vigil';

export interface KeplerianElements {
  semiMajorAxisKm: number;    // a (km)
  eccentricity: number;       // e (0 to 1)
  inclinationDeg: number;     // i (degrees)
  raanDeg: number;            // Ω - Right Ascension of Ascending Node (degrees)
  argPerigeeDeg: number;      // ω - Argument of Perigee (degrees)
  meanAnomalyDeg: number;     // M0 at epoch (degrees)
  epochTimeMs: number;        // Epoch timestamp (ms)
}

export interface Vector3D {
  x: number; // km (ECI frame)
  y: number; // km
  z: number; // km
}

export interface CovarianceMatrix6x6 {
  // 6x6 Positional (km^2) & Velocity ((km/s)^2) error covariance matrix
  matrix: number[][]; // 6x6 symmetric positive definite
  sigmaRadialKm: number;
  sigmaInTrackKm: number;
  sigmaCrossTrackKm: number;
}

export type SimulatedObjectType = 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'STATION' | 'CONSTELLATION';

export interface SimulatedSatellite {
  id: string;                 // e.g. "SIM-000101"
  name: string;               // e.g. "VIGIL-SENTINEL-1"
  noradId: number;            // Simulated catalog number
  type: SimulatedObjectType;
  regime: OrbitRegime;
  elements: KeplerianElements;
  // Dynamic State at simulation timestamp
  positionKm: Vector3D;       // ECI position (km)
  velocityKmS: Vector3D;      // ECI velocity (km/s)
  speedKmS: number;           // Velocity magnitude
  altitudeKm: number;         // Altitude above mean Earth radius (6378.137 km)
  periodMinutes: number;      // Orbital period
  orbitPath: Vector3D[];      // Sampled points for rendering 3D trajectory
  // Covariance & Risk
  covariance?: CovarianceMatrix6x6;
  hardBodyRadiusMeters: number; // For collision probability
  status: 'NOMINAL' | 'ELEVATED_RISK' | 'CRITICAL_CONJUNCTION' | 'DECAYED';
  riskLevel: RiskLevel;
  conjunctionPartnerId?: string;
  minMissDistanceM?: number;
  pocValue?: number;
  relativeSpeedKmS?: number;
  tcaUtc?: string;
  dataQualityVerdict: AuditVerdict;
  verdictReason: string;
  hasManeuvered?: boolean;
}

export interface SimulatedConjunction {
  id: string;                 // e.g. "CONJ-2026-001"
  primaryId: string;
  primaryName: string;
  secondaryId: string;
  secondaryName: string;
  tcaSimulationTimeMs: number;// Time of Closest Approach
  tcaUtc: string;
  missDistanceMeters: number;
  relativeSpeedKmS: number;
  collisionProbability: number; // Foster-1992 or 2D B-plane integration
  isProbabilityCalculated: boolean;
  modelLimitations: string[];
  uncertaintyStatus: 'CALCULATED_FROM_COVARIANCE' | 'NOT_EVALUATED_INSUFFICIENT_COVARIANCE';
  riskSeverity: 'CRITICAL' | 'WARNING' | 'LOW';
  encounterGeometry: {
    radialMissM: number;
    inTrackMissM: number;
    crossTrackMissM: number;
  };
}

export interface SimulationClockState {
  currentSimTimeMs: number;
  scenarioStartSimTimeMs: number;
  scenarioEndSimTimeMs: number;
  isPlaying: boolean;
  speedMultiplier: number; // 1x, 5x, 30x, 60x, 300x
  timeStepSeconds: number;
}

export interface SimulationSnapshot {
  timestampMs: number;
  timestampUtc: string;
  satellites: SimulatedSatellite[];
  conjunctions: SimulatedConjunction[];
  activeConjunctionCount: number;
  highRiskCount: number;
  kpis: {
    totalObjects: number;
    leoCount: number;
    meoCount: number;
    geoCount: number;
    debrisCount: number;
    payloadCount: number;
    meanAltitudeKm: number;
    meanVelocityKmS: number;
    closeEncountersNext24h: number;
    maxPoc: number;
  };
}
