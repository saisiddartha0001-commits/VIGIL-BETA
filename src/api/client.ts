/**
 * Typed API Client for VIGIL Backend
 *
 * Provides a type-safe interface to all backend endpoints with proper error handling
 * and response validation.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiError {
  success: false;
  error: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    dataMode: 'SIMULATED' | 'LIVE' | 'CACHED';
    sourceType: string;
    sourceName: string;
    generatedAtUtc?: string;
    sourceEpochUtc?: string;
    retrievedAtUtc?: string;
    isSynthetic: boolean;
    units?: string;
    limitations?: string;
    qualityStatus?: string;
  };
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
  metadata?: ApiResponse<T>['metadata'];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { headers, signal, ...rest } = options;

  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal: signal ?? AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Health
export async function getHealth() {
  return request<{ status: string; timestamp: string; version: string; uptime: number; database: string }>('/health');
}

// Overview
export async function getOverview() {
  return request<ApiResponse<{
    satelliteCount: number;
    regimeDistribution: Record<string, number>;
    averageQualityScore: number;
    freshnessSummary: Record<string, number>;
    simulationMode: 'SIMULATED' | 'LIVE' | 'CACHED';
    currentSimulationTime?: string;
    activeSimulations: number;
  }>>('/overview');
}

// Satellites
export async function listSatellites(params?: {
  page?: number;
  limit?: number;
  search?: string;
  regime?: 'LEO' | 'MEO' | 'GEO';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.search) query.set('search', params.search);
  if (params?.regime) query.set('regime', params.regime);

  const endpoint = `/satellites${query.toString() ? `?${query.toString()}` : ''}`;
  return request<PaginatedResponse<any>>(endpoint);
}

export async function getSatellite(id: string) {
  return request<ApiResponse<any>>(`/satellites/${id}`);
}

export async function getSatelliteTrajectory(id: string) {
  return request<ApiResponse<{
    satelliteId: string;
    rawOmm: any;
    limitations: string[];
  }>>(`/satellites/${id}/trajectory`);
}

// Data Sources and Quality
export async function getDataSources() {
  return request<ApiResponse<any[]>>('/data/sources');
}

export async function getDataQuality() {
  return request<ApiResponse<{
    summary: any[];
    averageQualityScore: number;
    totalSatellites: number;
    withCovariance: number;
    freshCount: number;
    agingCount: number;
    staleCount: number;
  }>>('/data/quality');
}

export async function getDataManifest() {
  return request<ApiResponse<any>>('/data/manifest');
}

// Simulations
export async function listSimulations() {
  return request<ApiResponse<any[]>>('/simulations');
}

export async function getSimulation(id: string) {
  return request<ApiResponse<any>>(`/simulations/${id}`);
}

export async function createSimulation(data: {
  satelliteId: string;
  durationSeconds: number;
  timeStepSeconds: number;
  propagationMethod?: 'TWO_BODY' | 'SGP4';
  randomSeed?: number;
  perturbations?: {
    dragDensityVariation?: number;
    srpVariation?: number;
    initialUncertainty?: number;
  };
}) {
  return request<ApiResponse<any>>('/simulations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function runSimulation(id: string) {
  return request<ApiResponse<{
    simulation: any;
    states: any[];
    metadata: any;
  }>>(`/simulations/${id}/run`, {
    method: 'POST',
  });
}

export async function resetSimulation(id: string) {
  return request<{ success: boolean; data: { message: string } }>(`/simulations/${id}/reset`, {
    method: 'POST',
  });
}

export async function getSimulationStates(id: string) {
  return request<ApiResponse<any[]>>(`/simulations/${id}/states`);
}

// Audit Logs and Evidence Gaps
export async function getAuditLogs() {
  return request<ApiResponse<any[]>>('/audit-logs');
}

export async function getEvidenceGaps() {
  return request<ApiResponse<any[]>>('/evidence-gaps');
}

export async function updateEvidenceGap(id: string, status: 'OPEN' | 'INVESTIGATING' | 'ACKNOWLEDGED') {
  return request<ApiResponse<any>>(`/evidence-gaps/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// API client object for convenience
export const api = {
  health: { get: getHealth },
  overview: { get: getOverview },
  satellites: {
    list: listSatellites,
    get: getSatellite,
    getTrajectory: getSatelliteTrajectory,
  },
  data: {
    getSources: getDataSources,
    getQuality: getDataQuality,
    getManifest: getDataManifest,
  },
  simulations: {
    list: listSimulations,
    get: getSimulation,
    create: createSimulation,
    run: runSimulation,
    reset: resetSimulation,
    getStates: getSimulationStates,
  },
  audit: {
    getLogs: getAuditLogs,
    getEvidenceGaps: getEvidenceGaps,
    updateEvidenceGap: updateEvidenceGap,
  },
};
