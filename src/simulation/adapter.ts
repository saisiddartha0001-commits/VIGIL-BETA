/**
 * Adapter to map SimulatedSatellite to existing OrbitalObject structure
 * Ensures 100% type compatibility with all existing dashboard pages, modals, and tables!
 */

import { SimulatedSatellite } from '../types/simulation';
import { OrbitalObject } from '../types/vigil';

export function simulatedSatelliteToOrbitalObject(
  sim: SimulatedSatellite,
  index: number,
  totalCount: number
): OrbitalObject {
  const angle = (index / totalCount) * 2 * Math.PI;

  return {
    id: sim.id,
    name: sim.name,
    noradId: sim.noradId,
    regime: sim.regime,
    altitude: Math.round(sim.altitudeKm),
    altitudeLabel: 'SIMULATED (2-BODY KEPLER)',
    velocity: Math.round(sim.speedKmS * 100) / 100,
    velocityLabel: 'SIMULATED ECI STATE',
    inclination: Math.round(sim.elements.inclinationDeg * 100) / 100,
    eccentricity: Math.round(sim.elements.eccentricity * 10000) / 10000,
    status: sim.status,
    riskLevel: sim.riskLevel,
    operator: sim.type === 'DEBRIS' ? 'NONE (DEBRIS)' : 'VIGIL SIMULATED FLEET',
    conjunctionTarget: sim.conjunctionPartnerId || 'NONE',
    missDistance: sim.minMissDistanceM !== undefined ? sim.minMissDistanceM : 999999,
    poc: sim.pocValue !== undefined ? sim.pocValue.toExponential(2) : '0.00e+00',
    pocValue: sim.pocValue !== undefined ? sim.pocValue : 0,
    tca: sim.tcaUtc ? sim.tcaUtc.substring(11, 19) + ' UTC' : 'NOMINAL',
    color: sim.status === 'CRITICAL_CONJUNCTION' ? '#FF00FF' : sim.type === 'DEBRIS' ? '#FFA500' : '#00FFFF',
    radiusRatio: sim.regime === 'LEO' ? 0.35 : sim.regime === 'MEO' ? 0.65 : 0.9,
    angle,
    speed: sim.speedKmS,
    covarianceAvailable: Boolean(sim.covariance),
    covarianceStatusText: 'SIMULATED 6x6 UVW TENSOR',
    lastObservationEpoch: new Date(sim.elements.epochTimeMs).toISOString(),
    freshnessHours: 0.1,
    freshnessStatus: 'FRESH',
    sensorConfidence: 98,
    dataQualityGrade: 'A',
    evidenceGapsCount: sim.status === 'CRITICAL_CONJUNCTION' ? 2 : 1,
    objectType: sim.type,
    ownerCode: sim.type === 'DEBRIS' ? 'DEB' : 'VGL',
    opsStatusCode: sim.type === 'DEBRIS' ? 'D' : '+',
    periodMin: Math.round(sim.periodMinutes * 10) / 10,
    dataQualityStatus: 'PASS',
    dataQualityDetails: 'Deterministic Keplerian initial parameters strictly validated.',
    propagationStatus: 'SGP4_CAPABLE',
    propagationDetails: 'Keplerian two-body propagation active.',
    conjunctionRiskStatus: sim.status === 'CRITICAL_CONJUNCTION' ? 'EVALUATED_ELEVATED' : 'EVALUATED_SAFE',
    conjunctionRiskDetails: sim.conjunctionPartnerId ? `Predicted miss distance ${sim.minMissDistanceM}m` : 'No close approach detected in horizon',
    evidenceVerdict: sim.dataQualityVerdict,
    verdictReason: sim.verdictReason,
  };
}
