/**
 * Simplified Two-Body Orbital Propagator
 *
 * This implements a basic Keplerian two-body propagation model for demonstration purposes.
 * It is NOT a full SGP4 implementation and does not account for:
 * - Atmospheric drag (beyond simple decay)
 * - Earth oblateness (J2, J3, J4 perturbations)
 * - Solar radiation pressure
 * - Third-body gravity (Moon, Sun)
 * - Tidal effects
 *
 * For production use, integrate a proper SGP4 library such as satellite.js or similar.
 */

const MU_EARTH = 398600.4418; // Earth gravitational parameter (km^3/s^2)
const R_EARTH = 6378.137; // Earth mean radius (km)

export interface OrbitalElements {
  meanMotion: number; // rev/day
  eccentricity: number;
  inclination: number; // degrees
  raan: number; // degrees (Right Ascension of Ascending Node)
  argPerigee: number; // degrees (Argument of Perigee)
  meanAnomaly: number; // degrees
  epoch: Date;
}

export interface CartesianState {
  position: { x: number; y: number; z: number }; // km
  velocity: { x: number; y: number; z: number }; // km/s
}

export interface PropagationResult {
  timestamp: Date;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  altitude: number;
  speed: number;
  orbitalPeriod: number;
  limitations: string[];
}

/**
 * Convert mean motion from rev/day to rad/s
 */
function meanMotionToRadS(meanMotionRevDay: number): number {
  return (meanMotionRevDay * 2 * Math.PI) / 86400;
}

/**
 * Calculate semi-major axis from mean motion using Kepler's Third Law
 */
function calculateSemiMajorAxis(meanMotionRadS: number): number {
  return Math.cbrt(MU_EARTH / Math.pow(meanMotionRadS, 2));
}

/**
 * Calculate orbital period from semi-major axis
 */
function calculateOrbitalPeriod(semiMajorAxis: number): number {
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / MU_EARTH);
}

/**
 * Simplified Keplerian propagation
 * Note: This is a circular orbit approximation for demonstration
 * Real orbital propagation requires solving Kepler's equation iteratively
 */
export function propagateTwoBody(
  elements: OrbitalElements,
  deltaTimeSeconds: number
): PropagationResult {
  const limitations: string[] = [
    'Simplified two-body model (circular orbit approximation)',
    'No atmospheric drag modeling',
    'No Earth oblateness (J2) perturbations',
    'No solar radiation pressure',
    'No third-body gravity effects',
    'Mean anomaly propagated linearly (Kepler equation not solved iteratively)',
  ];

  // Convert mean motion to rad/s
  const n = meanMotionToRadS(elements.meanMotion);

  // Calculate semi-major axis
  const a = calculateSemiMajorAxis(n);

  // Calculate orbital period
  const period = calculateOrbitalPeriod(a);

  // Propagate mean anomaly (simplified linear propagation)
  const deltaTimeDays = deltaTimeSeconds / 86400;
  const newMeanAnomalyDeg = elements.meanAnomaly + elements.meanMotion * deltaTimeDays * 360;
  const newMeanAnomalyRad = (newMeanAnomalyDeg * Math.PI) / 180;

  // For circular orbit approximation, true anomaly ≈ mean anomaly
  const trueAnomaly = newMeanAnomalyRad;

  // Calculate position in orbital plane (simplified circular)
  const r = a; // Circular orbit radius
  const x_orb = r * Math.cos(trueAnomaly);
  const y_orb = r * Math.sin(trueAnomaly);
  const z_orb = 0;

  // Velocity in orbital plane (circular)
  const v = Math.sqrt(MU_EARTH / a);
  const vx_orb = -v * Math.sin(trueAnomaly);
  const vy_orb = v * Math.cos(trueAnomaly);
  const vz_orb = 0;

  // Convert to ECI (Earth-Centered Inertial) coordinates
  // This is a simplified rotation - full 3-1-3 Euler rotation needed for accuracy
  const i = (elements.inclination * Math.PI) / 180;
  const raan = (elements.raan * Math.PI) / 180;
  const argP = (elements.argPerigee * Math.PI) / 180;

  // Simplified rotation (only inclination and RAAN for demonstration)
  const cosRAAN = Math.cos(raan);
  const sinRAAN = Math.sin(raan);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const x = x_orb * cosRAAN - y_orb * cosI * sinRAAN;
  const y = x_orb * sinRAAN + y_orb * cosI * cosRAAN;
  const z = y_orb * sinI;

  const vx = vx_orb * cosRAAN - vy_orb * cosI * sinRAAN;
  const vy = vx_orb * sinRAAN + vy_orb * cosI * cosRAAN;
  const vz = vy_orb * sinI;

  // Calculate altitude
  const positionMagnitude = Math.sqrt(x * x + y * y + z * z);
  const altitude = positionMagnitude - R_EARTH;

  // Calculate speed
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

  const newTimestamp = new Date(elements.epoch.getTime() + deltaTimeSeconds * 1000);

  return {
    timestamp: newTimestamp,
    position: { x, y, z },
    velocity: { x: vx, y: vy, z: vz },
    altitude,
    speed,
    orbitalPeriod: period / 60, // Convert to minutes
    limitations,
  };
}

/**
 * Create orbital elements from OMM record
 */
export function elementsFromOmm(omm: any): OrbitalElements {
  return {
    meanMotion: omm.MEAN_MOTION,
    eccentricity: omm.ECCENTRICITY || 0,
    inclination: omm.INCLINATION || 0,
    raan: omm.RA_OF_ASC_NODE || 0,
    argPerigee: omm.ARG_OF_PERICENTER || 0,
    meanAnomaly: omm.MEAN_ANOMALY || 0,
    epoch: new Date(omm.EPOCH),
  };
}
