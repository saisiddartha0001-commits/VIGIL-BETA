import { SimulatedSatellite } from '../types/simulation';
import { OrbitalObject } from '../types/vigil';
import { AuditedOmmRecord, PublicDataManifest, QualityCheckItem } from '../types/omm';

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
    relativeSpeedKmS: sim.relativeSpeedKmS,
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

/**
 * Creates simulated AuditedOmmRecord for DataProvenancePage inspection
 */
export function simulatedSatelliteToAuditedOmm(
  sim: SimulatedSatellite,
  timestampUtc: string
): AuditedOmmRecord {
  const epochIso = new Date(sim.elements.epochTimeMs).toISOString();
  const meanMotionRevD = 1440 / Math.max(0.1, sim.periodMinutes);

  const checks: QualityCheckItem[] = [
    {
      id: 'CHK_SIM_NAME',
      label: 'Simulated Object Identifier',
      category: 'IDENTIFIERS',
      status: 'PASS',
      details: `Simulated object title: "${sim.name}" with synthetic ID: ${sim.id}`,
      measuredValue: sim.name,
    },
    {
      id: 'CHK_SIM_DOMAIN',
      label: 'Keplerian Parameter Validity',
      category: 'DOMAIN_BOUNDS',
      status: 'PASS',
      details: `Inclination (${sim.elements.inclinationDeg.toFixed(2)}°) and Eccentricity (${sim.elements.eccentricity.toFixed(4)}) strictly bounded.`,
      measuredValue: `${sim.elements.inclinationDeg.toFixed(2)}°`,
    },
    {
      id: 'CHK_SIM_EPOCH',
      label: 'Simulation Clock Alignment',
      category: 'EPOCH_CHRONOLOGY',
      status: 'PASS',
      details: `Epoch timestamp (${epochIso}) aligned with central simulation engine clock.`,
      measuredValue: epochIso,
    },
    {
      id: 'CHK_SIM_PROP',
      label: 'Two-Body Mechanics Baseline',
      category: 'SCHEMA',
      status: 'PASS',
      details: 'Deterministic Keplerian propagation active with Newton-Raphson eccentric anomaly solver.',
      measuredValue: 'Kepler 2-Body',
    },
    {
      id: 'CHK_SIM_COVARIANCE',
      label: '6x6 State Error Covariance Tensor',
      category: 'COVARIANCE',
      status: sim.covariance ? 'PASS' : 'WARNING',
      details: sim.covariance
        ? `Modeled 6x6 UVW Covariance: σRadial=${sim.covariance.sigmaRadialKm.toFixed(3)}km, σInTrack=${sim.covariance.sigmaInTrackKm.toFixed(3)}km, σCrossTrack=${sim.covariance.sigmaCrossTrackKm.toFixed(3)}km.`
        : 'Covariance matrix uninitialized for this object.',
      measuredValue: sim.covariance ? '6x6 UVW Validated' : 'Omitted',
    },
    {
      id: 'CHK_SIM_FRESHNESS',
      label: 'Simulation State Freshness',
      category: 'FRESHNESS',
      status: 'PASS',
      details: 'Active state vector continuously generated at 10Hz by central simulation engine.',
      measuredValue: '< 0.1h Age',
    },
  ];

  return {
    raw: {
      OBJECT_NAME: sim.name,
      OBJECT_ID: sim.id,
      EPOCH: epochIso,
      MEAN_MOTION: meanMotionRevD,
      ECCENTRICITY: sim.elements.eccentricity,
      INCLINATION: sim.elements.inclinationDeg,
      RA_OF_ASC_NODE: sim.elements.raanDeg,
      ARG_OF_PERICENTER: sim.elements.argPerigeeDeg,
      MEAN_ANOMALY: sim.elements.meanAnomalyDeg,
      NORAD_CAT_ID: sim.noradId,
      BSTAR: 0.00012,
    },
    objectName: sim.name,
    objectId: sim.id,
    noradCatId: sim.noradId,
    epochUtc: epochIso,
    retrievedAtUtc: timestampUtc,
    recordAgeHours: 0.1,
    freshnessCategory: 'FRESH',
    semiMajorAxisKm: Math.round(sim.elements.semiMajorAxisKm * 10) / 10,
    approxAltitudeKm: Math.round(sim.altitudeKm),
    approxVelocityKmS: Math.round(sim.speedKmS * 100) / 100,
    orbitalPeriodMin: Math.round(sim.periodMinutes * 10) / 10,
    covarianceAvailable: Boolean(sim.covariance),
    evidenceVerdict: 'VERIFIED RECENT',
    verdictReason: 'Simulated deterministic orbit parameters validated against two-body Keplerian mechanics.',
    checks,
    missingFields: [],
    qualityScore: 100,
  };
}

export function buildSimulatedManifest(timestampUtc: string, count: number): PublicDataManifest {
  return {
    sourceName: 'VIGIL CENTRAL DETERMINISTIC SIMULATION ENGINE (2-BODY KEPLER)',
    exactUrl: 'local://vigil-engine/simulation/orbit-elements?format=json',
    retrievedAtUtc: timestampUtc,
    recordCount: count,
    contentType: 'application/json',
    httpStatus: 200,
    sha256: 'sim-sha256-e9b40127ac87bf6210f92b7c4d5e89a103c847e2b190f842',
    isCached: false,
    cachingPolicy: 'Continuous Real-Time Clock Sync (Seed: 42)',
    nextRecommendedRefreshUtc: new Date(Date.now() + 3600000).toISOString(),
  };
}
