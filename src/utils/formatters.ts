import { FreshnessStatus, RiskLevel, EvidenceSeverity, StabilityRating } from '../types/vigil';

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`;
  }
  return `${meters.toLocaleString('en-US')} m`;
}

export function formatAltitude(km: number): string {
  return `${km.toLocaleString('en-US')} km`;
}

export function formatVelocity(velocity: number): string {
  return `${velocity.toFixed(2)} km/s`;
}

export function formatHoursAgo(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m ago`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h ago`;
  }
  const days = (hours / 24).toFixed(1);
  return `${days}d ago (${hours.toFixed(0)}h)`;
}

export function getFreshnessMeta(status: FreshnessStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'FRESH':
      return {
        label: 'FRESH (< 6h)',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
      };
    case 'EXPIRING':
      return {
        label: 'EXPIRING (6-18h)',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotClass: 'bg-amber-400',
      };
    case 'STALE':
      return {
        label: 'STALE (18-48h)',
        badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        dotClass: 'bg-orange-400',
      };
    case 'CRITICAL_LATENCY':
      return {
        label: 'CRITICAL LATENCY (> 48h)',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
        dotClass: 'bg-rose-400 animate-pulse',
      };
  }
}

export function getRiskMeta(level: RiskLevel): {
  label: string;
  badgeClass: string;
  color: string;
} {
  switch (level) {
    case 'Critical':
      return {
        label: 'CRITICAL',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/40',
        color: '#FF536B',
      };
    case 'Elevated':
      return {
        label: 'ELEVATED',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
        color: '#FFBE55',
      };
    case 'Nominal':
      return {
        label: 'NOMINAL',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        color: '#35D39A',
      };
  }
}

export function getSeverityMeta(severity: EvidenceSeverity): {
  label: string;
  badgeClass: string;
} {
  switch (severity) {
    case 'CRITICAL':
      return {
        label: 'CRITICAL GAP',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
      };
    case 'WARNING':
      return {
        label: 'SENSITIVITY WARNING',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    case 'INFORMATIONAL':
      return {
        label: 'ADVISORY',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      };
  }
}

export function getStabilityMeta(rating: StabilityRating): {
  label: string;
  badgeClass: string;
} {
  switch (rating) {
    case 'STABLE':
      return {
        label: 'STABLE UNDER PERTURBATION',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    case 'MODERATE_SENSITIVITY':
      return {
        label: 'MODERATE SENSITIVITY',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    case 'EXTREME_DIVERGENCE':
      return {
        label: 'EXTREME UNCERTAINTY DIVERGENCE',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
      };
  }
}
