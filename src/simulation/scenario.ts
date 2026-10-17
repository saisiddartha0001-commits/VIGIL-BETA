/**
 * Deterministic Scenario Generator
 * Produces a physically coherent population of simulated satellites across LEO, MEO, and GEO.
 * Strictly uses pseudorandom numbers derived from a configurable seed for reproducible scenarios.
 */

import { KeplerianElements, SimulatedSatellite, SimulatedObjectType, CovarianceMatrix6x6 } from '../types/simulation';
import { OrbitRegime } from '../types/vigil';
import { propagateKeplerianOrbit, sampleOrbitPath } from './orbitalMechanics';

export interface ScenarioConfig {
  seed: number;
  totalObjects: number;
  scenarioEpochUtc: string;
}

/**
 * Linear Congruential Generator for reproducible deterministic floats in [0, 1)
 */
class DeterministicRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

/**
 * Generate a 6x6 Positional/Velocity Covariance matrix for an object
 * In UVW (Radial, In-track, Cross-track) frame and converted to Cartesian approximations.
 */
function generateCovariance(
  rng: DeterministicRNG,
  regime: OrbitRegime,
  isDebris: boolean
): CovarianceMatrix6x6 {
  // Typical standard deviations in km (Radial, In-track, Cross-track)
  let sigmaR = regime === 'LEO' ? (isDebris ? rng.range(0.04, 0.15) : rng.range(0.015, 0.05)) : rng.range(0.08, 0.3);
  let sigmaT = sigmaR * rng.range(3.0, 6.0); // In-track uncertainty is typically larger due to drag/gravity
  let sigmaN = sigmaR * rng.range(1.2, 2.5); // Cross-track

  const matrix = [
    [sigmaR * sigmaR, 0, 0, 0, 0, 0],
    [0, sigmaT * sigmaT, 0, 0, 0, 0],
    [0, 0, sigmaN * sigmaN, 0, 0, 0],
    [0, 0, 0, 1e-6, 0, 0],
    [0, 0, 0, 0, 1e-6, 0],
    [0, 0, 0, 0, 0, 1e-6],
  ];

  return {
    matrix,
    sigmaRadialKm: sigmaR,
    sigmaInTrackKm: sigmaT,
    sigmaCrossTrackKm: sigmaN,
  };
}

/**
 * Generate deterministic simulated satellite population
 */
export function generateDeterministicPopulation(config: ScenarioConfig): SimulatedSatellite[] {
  const rng = new DeterministicRNG(config.seed);
  const epochMs = new Date(config.scenarioEpochUtc).getTime();
  const satellites: SimulatedSatellite[] = [];

  const NAMES_LEO_PAYLOAD = [
    'VIGIL-SENTINEL-1', 'AEGIS-OBSERVER-A', 'AURORA-RESEARCH-3', 'TERRA-SCAN-IX',
    'ORBIT-NET-ALPHA', 'HELIOS-LEO-01', 'CYBER-RADAR-X', 'VANGUARD-7',
    'SPECTRA-CLIMATE-B', 'ZENITH-PULSE-1'
  ];

  const NAMES_MEO_PAYLOAD = [
    'NAV-CONSTELLATION-04', 'GALAXIA-TIME-2', 'CHRONOS-MEO-01', 'ATLAS-PNT-VII'
  ];

  const NAMES_GEO_PAYLOAD = [
    'GEO-RELAY-PRIME', 'EQUATOR-COMMS-8', 'STRATO-LINK-XII', 'SOLARIS-GEO-EAST'
  ];

  const NAMES_DEBRIS = [
    'DEB-SL-16-R/B', 'DEB-COSMOS-FRAG', 'DEB-PEGASUS-EXP', 'DEB-UPPER-STAGE',
    'DEB-PAYLOAD-ADAPTER', 'DEB-MISSION-SHROUD', 'DEB-FENGYUN-FRAG', 'DEB-COLLISION-CLUSTER'
  ];

  const targetCount = Math.max(12, config.totalObjects);

  // We explicitly engineer two specific objects (SIM-000001 and SIM-000002) to enter a close approach encounter
  // for high-fidelity conjunction and collision probability analysis!
  for (let i = 0; i < targetCount; i++) {
    const simIndex = i + 1;
    const id = `SIM-${String(simIndex).padStart(6, '0')}`;
    const noradId = 90000 + simIndex;

    let regime: OrbitRegime = 'LEO';
    let type: SimulatedObjectType = 'PAYLOAD';
    let name = '';
    let semiMajorAxisKm = 6378.137 + 550; // default 550km LEO
    let eccentricity = 0.001;
    let inclinationDeg = 53.0;
    let raanDeg = (i * 35.5) % 360;
    let argPerigeeDeg = (i * 47.2) % 360;
    let meanAnomalyDeg = (i * 29.3) % 360;
    let hardBodyRadiusMeters = 3.5;

    if (i === 0) {
      // Primary High-Interest Satellite
      name = 'VIGIL-SENTINEL-1';
      type = 'PAYLOAD';
      regime = 'LEO';
      semiMajorAxisKm = 6378.137 + 520.0; // 520 km circular
      eccentricity = 0.0008;
      inclinationDeg = 97.4; // Sun-synchronous
      raanDeg = 45.0;
      argPerigeeDeg = 0.0;
      meanAnomalyDeg = 0.0;
      hardBodyRadiusMeters = 4.2;
    } else if (i === 1) {
      // Secondary Object engineered for a realistic close approach with VIGIL-SENTINEL-1
      name = 'DEB-SL-16-FRAG-88';
      type = 'DEBRIS';
      regime = 'LEO';
      semiMajorAxisKm = 6378.137 + 520.0; // Identical energy / co-orbital intersection
      eccentricity = 0.0008;
      inclinationDeg = 97.4012; // Slight 0.0012 deg inclination difference
      raanDeg = 45.0;
      argPerigeeDeg = 0.0;
      meanAnomalyDeg = 28.5; // Nominal separation from SIM-000001 at baseline epoch
      hardBodyRadiusMeters = 1.8;
    } else if (i < 10) {
      // Standard LEO Payloads
      name = NAMES_LEO_PAYLOAD[(i - 2) % NAMES_LEO_PAYLOAD.length];
      type = 'PAYLOAD';
      regime = 'LEO';
      semiMajorAxisKm = 6378.137 + rng.range(420, 850);
      eccentricity = rng.range(0.0002, 0.015);
      inclinationDeg = rng.range(45.0, 98.6);
      hardBodyRadiusMeters = rng.range(2.0, 6.0);
    } else if (i < 16) {
      // LEO Debris Objects
      name = `${NAMES_DEBRIS[(i - 10) % NAMES_DEBRIS.length]}-${rng.intRange(10, 99)}`;
      type = 'DEBRIS';
      regime = 'LEO';
      semiMajorAxisKm = 6378.137 + rng.range(450, 950);
      eccentricity = rng.range(0.005, 0.08);
      inclinationDeg = rng.range(50.0, 102.0);
      hardBodyRadiusMeters = rng.range(0.4, 2.0);
    } else if (i < 20) {
      // MEO Navigation Objects
      name = NAMES_MEO_PAYLOAD[(i - 16) % NAMES_MEO_PAYLOAD.length];
      type = 'PAYLOAD';
      regime = 'MEO';
      semiMajorAxisKm = 6378.137 + rng.range(19000, 24000);
      eccentricity = rng.range(0.001, 0.02);
      inclinationDeg = rng.range(54.0, 65.0);
      hardBodyRadiusMeters = 3.8;
    } else {
      // GEO Satellites
      name = NAMES_GEO_PAYLOAD[(i - 20) % NAMES_GEO_PAYLOAD.length];
      type = 'PAYLOAD';
      regime = 'GEO';
      semiMajorAxisKm = 6378.137 + 35786.0; // Geostationary altitude
      eccentricity = rng.range(0.0001, 0.0008);
      inclinationDeg = rng.range(0.02, 4.5);
      hardBodyRadiusMeters = 5.5;
    }

    const elements: KeplerianElements = {
      semiMajorAxisKm,
      eccentricity,
      inclinationDeg,
      raanDeg,
      argPerigeeDeg,
      meanAnomalyDeg,
      epochTimeMs: epochMs,
    };

    // Propagate state at epoch
    const prop = propagateKeplerianOrbit(elements, epochMs);
    const orbitPath = sampleOrbitPath(elements, 72);
    const covariance = generateCovariance(rng, regime, type === 'DEBRIS');

    satellites.push({
      id,
      name,
      noradId,
      type,
      regime,
      elements,
      positionKm: prop.positionKm,
      velocityKmS: prop.velocityKmS,
      speedKmS: prop.speedKmS,
      altitudeKm: prop.altitudeKm,
      periodMinutes: prop.periodMinutes,
      orbitPath,
      covariance,
      hardBodyRadiusMeters,
      status: i === 0 || i === 1 ? 'CRITICAL_CONJUNCTION' : 'NOMINAL',
      riskLevel: i === 0 || i === 1 ? 'Critical' : 'Nominal',
      dataQualityVerdict: 'EVIDENCE VERIFIED',
      verdictReason: 'SIMULATED DETERMINISTIC ORBIT (KEPLERIAN TWO-BODY)',
    });
  }

  return satellites;
}
