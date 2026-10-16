// Shared API types between backend and frontend

export type DataMode = 'SIMULATED' | 'LIVE' | 'CACHED';

export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_CHECKABLE';

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

export interface DataProvenanceMetadata {
  dataMode: DataMode;
  sourceType: string;
  sourceName: string;
  generatedAtUtc?: string;
  sourceEpochUtc?: string;
  retrievedAtUtc?: string;
  isSynthetic: boolean;
  units?: string;
  limitations?: string;
  qualityStatus?: string;
}

export interface Satellite {
  id: string;
  name: string;
  noradCatId: number;
  objectId?: string;
  regime: OrbitRegime;
  altitude: number;
  velocity: number;
  inclination: number;
  eccentricity: number;
  status: string;
  operator: string;
  objectType?: string;
  ownerCode?: string;
  launchDate?: string;
  epochUtc: string;
  retrievedAtUtc: string;
  recordAgeHours: number;
  freshnessCategory: string;
  semiMajorAxisKm: number;
  approxAltitudeKm: number;
  approxVelocityKmS: number;
  orbitalPeriodMin: number;
  covarianceAvailable: boolean;
  qualityScore: number;
  rawOmm?: any;
  satcatMetadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheck {
  id: string;
  satelliteId: string;
  checkId: string;
  label: string;
  category: string;
  status: CheckStatus;
  details: string;
  measuredValue?: string;
  threshold?: string;
  createdAt: string;
}

export interface Simulation {
  id: string;
  name: string;
  satelliteId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentTimestampUtc?: string;
  simulationStartUtc?: string;
  simulationEndUtc?: string;
  timeStepSeconds: number;
  propagationMethod: string;
  randomSeed: number;
  speedMultiplier: number;
  parameters?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationState {
  id: string;
  simulationId: string;
  timestampUtc: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  velocityX?: number;
  velocityY?: number;
  velocityZ?: number;
  altitudeKm?: number;
  speedKmS?: number;
  metadata?: any;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestampUtc: string;
  operator: string;
  action: string;
  category: string;
  details: string;
  createdAt: string;
}

export interface DataSource {
  id: string;
  sourceName: string;
  sourceType: string;
  url?: string;
  retrievedAtUtc: string;
  recordCount: number;
  contentType?: string;
  httpStatus?: number;
  sha256?: string;
  isCached: boolean;
  cachingPolicy?: string;
  nextRecommendedRefreshUtc?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceGap {
  id: string;
  title: string;
  severity: EvidenceSeverity;
  category: string;
  affectedObjects?: string;
  description: string;
  whyItMatters: string;
  recommendedAction: string;
  impactOnVerdict: string;
  detectionTimestamp: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ACKNOWLEDGED';
  createdAt: string;
  updatedAt: string;
}

export interface OverviewData {
  satelliteCount: number;
  regimeDistribution: Record<OrbitRegime, number>;
  averageQualityScore: number;
  freshnessSummary: Record<string, number>;
  simulationMode: DataMode;
  currentSimulationTime?: string;
  activeSimulations: number;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  database: 'connected' | 'error';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: DataProvenanceMetadata;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata?: DataProvenanceMetadata;
}
