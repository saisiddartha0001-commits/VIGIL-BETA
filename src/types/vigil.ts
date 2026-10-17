export type OrbitRegime = 'LEO' | 'MEO' | 'GEO';

export type RiskLevel = 'Nominal' | 'Elevated' | 'Critical';

export type FreshnessStatus = 'FRESH' | 'EXPIRING' | 'STALE' | 'CRITICAL_LATENCY';

export type AuditVerdict =
  | 'DATA QUALITY CHECKS PASSED'
  | 'WARNINGS PRESENT'
  | 'VALIDATION FAILED'
  | 'INSUFFICIENT DATA FOR THIS CHECK'
  | 'EVIDENCE VERIFIED'
  | 'INSUFFICIENT EVIDENCE'
  | 'SENSITIVITY FLAGGED'
  | 'CRITICAL CONJUNCTION';

export type EvidenceSeverity = 'CRITICAL' | 'WARNING' | 'INFORMATIONAL';

export type StabilityRating = 'STABLE' | 'MODERATE_SENSITIVITY' | 'EXTREME_DIVERGENCE';

export interface OrbitalObject {
  id: string;
  name: string;
  noradId: number;
  regime: OrbitRegime;
  altitude: number; // km
  altitudeLabel?: string; // e.g. "APPROX (MEAN ELEMENTS)" or "SGP4 STATE"
  velocity: number; // km/s
  velocityLabel?: string;
  inclination: number; // degrees
  eccentricity: number;
  status: string;
  riskLevel: RiskLevel;
  operator: string;
  conjunctionTarget: string;
  missDistance: number; // meters
  poc: string; // Probability of collision string
  pocValue: number;
  relativeSpeedKmS?: number;
  tca: string; // Time to Closest Approach
  color: string;
  radiusRatio: number; // for polar schematic placement (0.2 to 0.9)
  angle: number; // polar angle radians
  speed: number;
  // Evidence & Provenance attributes
  covarianceAvailable: boolean;
  covarianceStatusText?: string; // e.g. "NOT PROVIDED IN GP/OMM"
  lastObservationEpoch: string;
  retrievedAtUtc?: string;
  currentElementAgeHours?: number; // current UTC - source epoch
  freshnessHours: number;
  freshnessStatus: FreshnessStatus;
  sensorConfidence?: number;
  dataQualityGrade: 'A' | 'B' | 'C' | 'UNVERIFIED';
  evidenceGapsCount: number;
  // SATCAT supplementary fields
  intlDesignator?: string;
  objectType?: string; // e.g. "Payload", "Rocket Body"
  ownerCode?: string; // e.g. "ISS", "PRC"
  opsStatusCode?: string; // e.g. "+" (Operational)
  launchDate?: string;
  launchSite?: string;
  decayDate?: string;
  apogeeKm?: number;
  perigeeKm?: number;
  periodMin?: number;
  rcsSm?: number;
  orbitCenter?: string;
  orbitType?: string;
  // 3 Independent Assessment Categories
  dataQualityStatus?: 'PASS' | 'WARNING' | 'FAIL';
  dataQualityDetails?: string;
  propagationStatus?: 'SGP4_CAPABLE' | 'PROPAGATION_UNTESTED' | 'INVALID_INPUTS';
  propagationDetails?: string;
  conjunctionRiskStatus?: 'CDM_NOT_AVAILABLE' | 'COVARIANCE_ABSENT' | 'NOT_EVALUATED' | 'EVALUATED_SAFE' | 'EVALUATED_ELEVATED';
  conjunctionRiskDetails?: string;
  evidenceVerdict: AuditVerdict;
  auditVerdict?: AuditVerdict;
  verdictReason: string;
}

export interface DataProvenanceRecord {
  id: string;
  objectId: string;
  objectName: string;
  sourceCatalog: string;
  epochUtc: string;
  freshnessHours: number;
  freshnessStatus: FreshnessStatus;
  sensorNetwork: string;
  sensorType: 'RADAR' | 'OPTICAL' | 'SPACE_BASED' | 'ESTIMATED_TLE';
  observationsCount: number;
  covarianceMatrixProvided: boolean;
  propagationModel: 'SGP4' | 'HPOP' | 'NUMERICAL_EPHEMERIS';
  verificationHash: string;
  lastIngestionUtc: string;
  ingestionQualityScore: number; // 0 - 100
}

export interface FreshnessCheck {
  id: string;
  name: string;
  category: 'RADAR_TRACK' | 'TLE_AGE' | 'COVARIANCE_VALIDITY' | 'ATMOSPHERIC_EPOCH';
  thresholdHours: number;
  actualHours: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  impactDescription: string;
}

export interface SensitivityDataPoint {
  timeOffsetHours: number;
  baselineKm: number;
  perturbedKm: number;
  upperUncertaintyKm: number;
  lowerUncertaintyKm: number;
}

export interface AssessmentScenario {
  id: string;
  name: string;
  shortTag: string;
  description: string;
  perturbationModel: string;
  parameters: {
    label: string;
    baseline: string;
    perturbed: string;
    delta: string;
  }[];
  missDistanceRangeKm: [number, number];
  pocDivergence: string;
  stabilityRating: StabilityRating;
  keyFinding: string;
  riskVerdict: string;
  chartData: SensitivityDataPoint[];
}

export interface EvidenceGap {
  id: string;
  title: string;
  severity: EvidenceSeverity;
  category: 'OBSERVATION_LATENCY' | 'MISSING_COVARIANCE' | 'SOLAR_FLUX_UNCERTAINTY' | 'MANEUVER_DRIFT' | 'ATMOSPHERIC_MODEL';
  affectedObjects: string[];
  description: string;
  whyItMatters: string;
  recommendedAction: string;
  impactOnVerdict: string;
  detectionTimestamp: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ACKNOWLEDGED';
}

export interface EvidenceTraceStep {
  step: 'INPUT' | 'VALIDATION' | 'ASSUMPTIONS' | 'ASSESSMENT';
  title: string;
  status: 'VERIFIED' | 'WARNING' | 'GAP_DETECTED' | 'UNRESOLVED';
  summary: string;
  details: string[];
  confidenceScore: number; // percentage
}

export interface AuditEvent {
  id: string;
  timestampUtc: string;
  operator: string;
  action: string;
  category: 'INGEST' | 'VALIDATION' | 'SENSITIVITY_RUN' | 'VERDICT_OVERRIDE';
  details: string;
}

export type PageId = 'overview' | 'provenance' | 'stability' | 'evidence' | 'catalog';
