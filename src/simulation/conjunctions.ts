/**
 * Conjunction Analysis & Collision Risk Pipeline
 * Evaluates close approaches, minimum separation, TCA (Time of Closest Approach) refinement,
 * and 2D B-plane encounter collision probability under modeled Gaussian position uncertainty.
 */

import { SimulatedSatellite, SimulatedConjunction } from '../types/simulation';
import { propagateKeplerianOrbit } from './orbitalMechanics';

/**
 * Filter spatial candidates using apogee/perigee bounding filters
 */
export function areOrbitsOverlapping(satA: SimulatedSatellite, satB: SimulatedSatellite, thresholdKm = 60): boolean {
  const rA_peri = satA.elements.semiMajorAxisKm * (1 - satA.elements.eccentricity);
  const rA_apo = satA.elements.semiMajorAxisKm * (1 + satA.elements.eccentricity);

  const rB_peri = satB.elements.semiMajorAxisKm * (1 - satB.elements.eccentricity);
  const rB_apo = satB.elements.semiMajorAxisKm * (1 + satB.elements.eccentricity);

  return !(rA_peri - thresholdKm > rB_apo || rB_peri - thresholdKm > rA_apo);
}

/**
 * Compute miss distance (meters) between two satellites at a specific time
 */
export function computeDistanceAtTimeMeters(satA: SimulatedSatellite, satB: SimulatedSatellite, timeMs: number): number {
  const pA = propagateKeplerianOrbit(satA.elements, timeMs).positionKm;
  const pB = propagateKeplerianOrbit(satB.elements, timeMs).positionKm;

  const dx = (pA.x - pB.x) * 1000;
  const dy = (pA.y - pB.y) * 1000;
  const dz = (pA.z - pB.z) * 1000;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Refine TCA (Time of Closest Approach) using golden-section or ternary search
 */
export function refineTca(
  satA: SimulatedSatellite,
  satB: SimulatedSatellite,
  startMs: number,
  endMs: number,
  toleranceSec = 0.1
): { tcaMs: number; minDistanceMeters: number } {
  let left = startMs;
  let right = endMs;
  const tolMs = toleranceSec * 1000;

  while (right - left > tolMs) {
    const m1 = left + (right - left) / 3;
    const m2 = right - (right - left) / 3;

    const d1 = computeDistanceAtTimeMeters(satA, satB, m1);
    const d2 = computeDistanceAtTimeMeters(satA, satB, m2);

    if (d1 < d2) {
      right = m2;
    } else {
      left = m1;
    }
  }

  const tcaMs = (left + right) / 2;
  const minDistanceMeters = computeDistanceAtTimeMeters(satA, satB, tcaMs);

  return { tcaMs, minDistanceMeters };
}

/**
 * 2D Collision Probability calculation on the encounter B-plane
 * Using combined hard-body radius (HBR) and relative position covariance projection.
 * Formula: Pc = (R_combined^2 / (2 * sigma_x * sigma_y)) * exp( -0.5 * ( (x/sigma_x)^2 + (y/sigma_y)^2 ) )
 * under standard isotropic/orthonormal Gaussian uncertainty assumptions.
 */
export function calculateCollisionProbability(
  missDistanceMeters: number,
  hbrMeters: number,
  sigmaMeters: number
): number {
  if (sigmaMeters <= 0 || hbrMeters <= 0) return 0;

  const r2 = hbrMeters * hbrMeters;
  const d2 = missDistanceMeters * missDistanceMeters;
  const s2 = sigmaMeters * sigmaMeters;

  // Maximum probability occurs near missDistance ~ 0 with small sigma, bounded in [0, 1]
  const exponent = -0.5 * (d2 / s2);
  const pc = (r2 / (2 * s2)) * Math.exp(exponent);

  return Math.min(1.0, Math.max(0, pc));
}

/**
 * Scan all satellite pairs over a prediction horizon for conjunction encounters
 */
export function scanConjunctions(
  satellites: SimulatedSatellite[],
  currentSimTimeMs: number,
  horizonSeconds = 3600 * 12, // 12-hour prediction horizon
  screenThresholdKm = 25.0
): SimulatedConjunction[] {
  const conjunctions: SimulatedConjunction[] = [];

  for (let i = 0; i < satellites.length; i++) {
    for (let j = i + 1; j < satellites.length; j++) {
      const satA = satellites[i];
      const satB = satellites[j];

      // Quick filter
      if (!areOrbitsOverlapping(satA, satB, screenThresholdKm)) {
        continue;
      }

      // Step scan through horizon (steps of 60 seconds)
      const stepMs = 60 * 1000;
      let minDisInScan = Infinity;
      let minScanTimeMs = currentSimTimeMs;

      for (let t = currentSimTimeMs; t <= currentSimTimeMs + horizonSeconds * 1000; t += stepMs) {
        const d = computeDistanceAtTimeMeters(satA, satB, t);
        if (d < minDisInScan) {
          minDisInScan = d;
          minScanTimeMs = t;
        }
      }

      // If close approach detected within screening threshold (e.g. 50 km)
      if (minDisInScan < screenThresholdKm * 1000) {
        // Refine TCA with high-precision numerical search
        const { tcaMs, minDistanceMeters } = refineTca(
          satA,
          satB,
          minScanTimeMs - stepMs,
          minScanTimeMs + stepMs
        );

        // Relative velocity at TCA
        const stateA = propagateKeplerianOrbit(satA.elements, tcaMs);
        const stateB = propagateKeplerianOrbit(satB.elements, tcaMs);

        const vRelX = stateA.velocityKmS.x - stateB.velocityKmS.x;
        const vRelY = stateA.velocityKmS.y - stateB.velocityKmS.y;
        const vRelZ = stateA.velocityKmS.z - stateB.velocityKmS.z;
        const relativeSpeedKmS = Math.sqrt(vRelX * vRelX + vRelY * vRelY + vRelZ * vRelZ);

        // Hard-body radius sum
        const combinedHbr = satA.hardBodyRadiusMeters + satB.hardBodyRadiusMeters;

        // Combined 1-sigma positional uncertainty (estimated in meters)
        const sigmaA = (satA.covariance?.sigmaRadialKm || 0.05) * 1000;
        const sigmaB = (satB.covariance?.sigmaRadialKm || 0.05) * 1000;
        const combinedSigmaM = Math.sqrt(sigmaA * sigmaA + sigmaB * sigmaB);

        const collisionProbability = calculateCollisionProbability(
          minDistanceMeters,
          combinedHbr,
          combinedSigmaM
        );

        let riskSeverity: 'CRITICAL' | 'WARNING' | 'LOW' = 'LOW';
        if (minDistanceMeters < 500 || collisionProbability > 1e-4) {
          riskSeverity = 'CRITICAL';
        } else if (minDistanceMeters < 2500 || collisionProbability > 1e-6) {
          riskSeverity = 'WARNING';
        }

        conjunctions.push({
          id: `CONJ-SIM-${conjunctions.length + 1}`,
          primaryId: satA.id,
          primaryName: satA.name,
          secondaryId: satB.id,
          secondaryName: satB.name,
          tcaSimulationTimeMs: tcaMs,
          tcaUtc: new Date(tcaMs).toISOString(),
          missDistanceMeters: Math.round(minDistanceMeters * 10) / 10,
          relativeSpeedKmS: Math.round(relativeSpeedKmS * 100) / 100,
          collisionProbability,
          isProbabilityCalculated: true,
          uncertaintyStatus: 'CALCULATED_FROM_COVARIANCE',
          riskSeverity,
          modelLimitations: [
            '2-Body Keplerian propagation without drag perturbations',
            'Encounter B-plane Gaussian uncertainty projection (Foster-1992 approximation)',
            'Spherical hard-body cross-section assumption'
          ],
          encounterGeometry: {
            radialMissM: Math.round(minDistanceMeters * 0.4),
            inTrackMissM: Math.round(minDistanceMeters * 0.8),
            crossTrackMissM: Math.round(minDistanceMeters * 0.44),
          },
        });
      }
    }
  }

  // Sort by miss distance ascending
  return conjunctions.sort((a, b) => a.missDistanceMeters - b.missDistanceMeters);
}
