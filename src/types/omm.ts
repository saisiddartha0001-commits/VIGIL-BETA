export interface CelesTrakOmmRaw {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE?: number;
  CLASSIFICATION_TYPE?: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO?: number;
  REV_AT_EPOCH?: number;
  BSTAR?: number;
  MEAN_MOTION_DOT?: number;
  MEAN_MOTION_DDOT?: number;
}

export interface PublicDataManifest {
  sourceName: string;
  exactUrl: string;
  retrievedAtUtc: string;
  recordCount: number;
  contentType: string;
  httpStatus: number;
  sha256: string;
  isCached: boolean;
  cachingPolicy: string;
  nextRecommendedRefreshUtc: string;
}

export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_CHECKABLE';

export interface QualityCheckItem {
  id: string;
  label: string;
  category: 'SCHEMA' | 'IDENTIFIERS' | 'EPOCH_CHRONOLOGY' | 'DOMAIN_BOUNDS' | 'COVARIANCE' | 'FRESHNESS';
  status: CheckStatus;
  details: string;
  measuredValue?: string | number;
  threshold?: string;
}

export interface SatcatRecord {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: number;
  OBJECT_TYPE?: string; // PAY = Payload, R/B = Rocket Body, DEB = Debris, etc.
  OPS_STATUS_CODE?: string; // + = Operational, - = Non-operational, P = Partially Operational, etc.
  OWNER?: string; // Country / Organization code (e.g., ISS, PRC, US)
  LAUNCH_DATE?: string;
  LAUNCH_SITE?: string;
  DECAY_DATE?: string;
  PERIOD?: number; // minutes
  INCLINATION?: number; // degrees
  APOGEE?: number; // km
  PERIGEE?: number; // km
  RCS?: number; // Radar Cross Section (m^2)
  DATA_STATUS_CODE?: string;
  ORBIT_CENTER?: string;
  ORBIT_TYPE?: string;
}

export interface AuditedOmmRecord {
  raw: CelesTrakOmmRaw;
  satcat?: SatcatRecord;
  objectName: string;
  objectId: string;
  noradCatId: number;
  epochUtc: string;
  retrievedAtUtc: string;
  recordAgeHours: number;
  freshnessCategory: 'FRESH' | 'AGING' | 'STALE' | 'CRITICAL_LATENCY';
  semiMajorAxisKm: number;
  approxAltitudeKm: number;
  approxVelocityKmS: number;
  orbitalPeriodMin: number;
  covarianceAvailable: boolean;
  evidenceVerdict: 'INSUFFICIENT EVIDENCE' | 'VERIFIED RECENT' | 'AGING DATA';
  verdictReason: string;
  checks: QualityCheckItem[];
  missingFields: string[];
  qualityScore: number; // 0 - 100
}

export interface OmmEvidenceTraceStep {
  step: 'SOURCE_RECORD' | 'VALIDATION_CHECKS' | 'ASSUMPTIONS' | 'DISPLAYED_RESULT';
  title: string;
  status: 'VERIFIED' | 'WARNING' | 'GAP_DETECTED' | 'UNRESOLVED';
  summary: string;
  details: string[];
}
