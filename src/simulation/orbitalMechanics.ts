/**
 * Orbital Mechanics & Numerical Propagator
 * Baseline: 2-Body Keplerian Mechanics with Newton-Raphson Kepler's equation solver
 * and ECI (Earth-Centered Inertial) coordinate transformations.
 */

import { KeplerianElements, Vector3D } from '../types/simulation';

export const MU_EARTH = 398600.4418;  // Earth's gravitational parameter (km^3 / s^2)
export const R_EARTH = 6378.137;      // WGS-84 Earth equatorial radius (km)

/**
 * Solve Kepler's equation: M = E - e * sin(E) using Newton-Raphson iteration.
 */
export function solveKeplersEquation(meanAnomalyRad: number, eccentricity: number, tolerance = 1e-8): number {
  // Normalize M to [0, 2pi)
  let M = meanAnomalyRad % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  // Initial guess for Eccentric Anomaly E
  let E = eccentricity < 0.8 ? M : Math.PI;

  for (let iter = 0; iter < 30; iter++) {
    const f = E - eccentricity * Math.sin(E) - M;
    const fPrime = 1 - eccentricity * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < tolerance) {
      break;
    }
  }

  return E;
}

/**
 * Propagate Keplerian elements to an offset time (dt in seconds)
 * and compute Cartesian position (km) and velocity (km/s) in ECI frame.
 */
export function propagateKeplerianOrbit(
  elements: KeplerianElements,
  currentTimeMs: number
): { positionKm: Vector3D; velocityKmS: Vector3D; altitudeKm: number; speedKmS: number; periodMinutes: number } {
  const { semiMajorAxisKm: a, eccentricity: e, inclinationDeg, raanDeg, argPerigeeDeg, meanAnomalyDeg, epochTimeMs } = elements;

  // Orbital Mean Motion n (rad/s)
  const n = Math.sqrt(MU_EARTH / Math.pow(a, 3));
  const periodSeconds = 2 * Math.PI / n;
  const periodMinutes = periodSeconds / 60;

  // Delta time from element epoch in seconds
  const dtSeconds = (currentTimeMs - epochTimeMs) / 1000;

  // Current Mean Anomaly M(t) in radians
  const M0 = (meanAnomalyDeg * Math.PI) / 180;
  const Mt = M0 + n * dtSeconds;

  // Solve for Eccentric Anomaly E
  const E = solveKeplersEquation(Mt, e);

  // True anomaly ν (nu)
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  // Radius distance r (km)
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane (perifocal PQW frame)
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Velocity in orbital plane
  const p = a * (1 - e * e); // semi-latus rectum
  const h = Math.sqrt(MU_EARTH * p); // specific angular momentum
  const vxOrb = -(MU_EARTH / h) * Math.sin(nu);
  const vyOrb = (MU_EARTH / h) * (e + Math.cos(nu));

  // Convert angles to radians
  const inc = (inclinationDeg * Math.PI) / 180;
  const raan = (raanDeg * Math.PI) / 180;
  const argP = (argPerigeeDeg * Math.PI) / 180;

  // Rotation matrices from Perifocal to ECI frame:
  // R = Rz(-raan) * Rx(-inc) * Rz(-argP)
  const cosRaan = Math.cos(raan);
  const sinRaan = Math.sin(raan);
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);
  const cosArgP = Math.cos(argP);
  const sinArgP = Math.sin(argP);

  // Direction cosine matrix elements
  const Px = cosRaan * cosArgP - sinRaan * sinArgP * cosInc;
  const Py = sinRaan * cosArgP + cosRaan * sinArgP * cosInc;
  const Pz = sinArgP * sinInc;

  const Qx = -cosRaan * sinArgP - sinRaan * cosArgP * cosInc;
  const Qy = -sinRaan * sinArgP + cosRaan * cosArgP * cosInc;
  const Qz = cosArgP * sinInc;

  // ECI position (km)
  const posX = xOrb * Px + yOrb * Qx;
  const posY = xOrb * Py + yOrb * Qy;
  const posZ = xOrb * Pz + yOrb * Qz;

  // ECI velocity (km/s)
  const velX = vxOrb * Px + vyOrb * Qx;
  const velY = vxOrb * Py + vyOrb * Qy;
  const velZ = vxOrb * Pz + vyOrb * Qz;

  const speedKmS = Math.sqrt(velX * velX + velY * velY + velZ * velZ);
  const altitudeKm = r - R_EARTH;

  return {
    positionKm: { x: posX, y: posY, z: posZ },
    velocityKmS: { x: velX, y: velY, z: velZ },
    altitudeKm,
    speedKmS,
    periodMinutes,
  };
}

/**
 * Sample 64 points around an entire orbit to generate a continuous 3D trajectory path.
 */
export function sampleOrbitPath(elements: KeplerianElements, numSamples = 64): Vector3D[] {
  const points: Vector3D[] = [];
  const { semiMajorAxisKm: a, eccentricity: e, inclinationDeg, raanDeg, argPerigeeDeg } = elements;

  const inc = (inclinationDeg * Math.PI) / 180;
  const raan = (raanDeg * Math.PI) / 180;
  const argP = (argPerigeeDeg * Math.PI) / 180;

  const cosRaan = Math.cos(raan);
  const sinRaan = Math.sin(raan);
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);
  const cosArgP = Math.cos(argP);
  const sinArgP = Math.sin(argP);

  const Px = cosRaan * cosArgP - sinRaan * sinArgP * cosInc;
  const Py = sinRaan * cosArgP + cosRaan * sinArgP * cosInc;
  const Pz = sinArgP * sinInc;

  const Qx = -cosRaan * sinArgP - sinRaan * cosArgP * cosInc;
  const Qy = -sinRaan * sinArgP + cosRaan * cosArgP * cosInc;
  const Qz = cosArgP * sinInc;

  for (let i = 0; i <= numSamples; i++) {
    const E = (i / numSamples) * 2 * Math.PI;
    const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
    const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);
    const r = a * (1 - e * Math.cos(E));

    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);

    points.push({
      x: xOrb * Px + yOrb * Qx,
      y: xOrb * Py + yOrb * Qy,
      z: xOrb * Pz + yOrb * Qz,
    });
  }

  return points;
}
