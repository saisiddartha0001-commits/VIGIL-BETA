import { EvidenceSeverity, StabilityRating } from '../../types/vigil';
import { getSeverityMeta, getStabilityMeta } from '../../utils/formatters';

interface StatusBadgeProps {
  type?: 'risk' | 'freshness' | 'severity' | 'stability' | 'verdict' | 'grade';
  value: string;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = 'risk',
  value,
  size = 'sm',
  pulse = false,
  className = '',
}) => {
  const sizeClass =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-xs';

  if (type === 'risk') {
    const isCritical = value === 'Critical';
    const isElevated = value === 'Elevated';
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-[6px] border ${
          isCritical
            ? 'bg-[#FF00FF]/15 text-[#FF00FF] border-[#FF00FF]/50 shadow-[0_0_10px_rgba(255,0,255,0.2)]'
            : isElevated
            ? 'bg-[#FF4500]/15 text-[#FF4500] border-[#FF4500]/50 shadow-[0_0_10px_rgba(255,69,0,0.2)]'
            : 'bg-[#29AB87]/15 text-[#29AB87] border-[#29AB87]/50 shadow-[0_0_10px_rgba(41,171,135,0.2)]'
        } ${sizeClass} ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isCritical ? 'bg-[#FF00FF] animate-pulse' : isElevated ? 'bg-[#FF4500]' : 'bg-[#29AB87]'
          }`}
        />
        {value.toUpperCase()}
      </span>
    );
  }

  if (type === 'freshness') {
    const isFresh = value === 'FRESH';
    const isExpiring = value === 'EXPIRING';
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-[6px] border ${
          isFresh
            ? 'bg-[#29AB87]/15 text-[#29AB87] border-[#29AB87]/50'
            : isExpiring
            ? 'bg-[#FF4500]/15 text-[#FF4500] border-[#FF4500]/50'
            : 'bg-[#FF00FF]/15 text-[#FF00FF] border-[#FF00FF]/50 shadow-[0_0_12px_rgba(255,0,255,0.25)]'
        } ${sizeClass} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${
          isFresh ? 'bg-[#29AB87]' : isExpiring ? 'bg-[#FF4500]' : 'bg-[#FF00FF] animate-pulse'
        }`} />
        {value}
      </span>
    );
  }

  if (type === 'severity') {
    const meta = getSeverityMeta(value as EvidenceSeverity);
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-[6px] border ${meta.badgeClass} ${sizeClass} ${className}`}
      >
        {meta.label}
      </span>
    );
  }

  if (type === 'stability') {
    const meta = getStabilityMeta(value as StabilityRating);
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-[6px] border ${meta.badgeClass} ${sizeClass} ${className}`}
      >
        {meta.label}
      </span>
    );
  }

  if (type === 'verdict') {
    const val = value || 'INSUFFICIENT DATA FOR THIS CHECK';
    const isPassed = val === 'DATA QUALITY CHECKS PASSED' || val === 'EVIDENCE VERIFIED';
    const isWarning = val === 'WARNINGS PRESENT' || val === 'SENSITIVITY FLAGGED';
    const isFailed = val === 'VALIDATION FAILED' || val === 'CRITICAL CONJUNCTION';
    const isInsufficient = val === 'INSUFFICIENT DATA FOR THIS CHECK' || val === 'INSUFFICIENT EVIDENCE';

    const colorClass = isPassed
      ? 'bg-[#29AB87]/20 text-[#29AB87] border-[#29AB87]/50 shadow-[0_0_12px_rgba(41,171,135,0.25)]'
      : isWarning
      ? 'bg-[#FFBE55]/20 text-[#FFBE55] border-[#FFBE55]/50 shadow-[0_0_10px_rgba(255,190,85,0.2)]'
      : isFailed
      ? 'bg-[#FF00FF]/20 text-[#FF00FF] border-[#FF00FF]/60 shadow-[0_0_15px_rgba(255,0,255,0.35)]'
      : isInsufficient
      ? 'bg-[#FF4500]/15 text-[#FF4500] border-[#FF4500]/50 shadow-[0_0_12px_rgba(255,69,0,0.25)]'
      : 'bg-[#101228] text-[#00FFFF] border-[#00FFFF]/30';

    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold tracking-wider rounded-[6px] border ${colorClass} ${sizeClass} ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            pulse || isFailed || isInsufficient ? 'animate-pulse' : ''
          } ${
            isPassed
              ? 'bg-[#29AB87]'
              : isWarning
              ? 'bg-[#FFBE55]'
              : isFailed
              ? 'bg-[#FF00FF]'
              : isInsufficient
              ? 'bg-[#FF4500]'
              : 'bg-[#00FFFF]'
          }`}
        />
        {val}
      </span>
    );
  }

  if (type === 'grade') {
    const gradeColor =
      value === 'A'
        ? 'bg-[#29AB87]/20 text-[#29AB87] border-[#29AB87]/50 shadow-[0_0_8px_rgba(41,171,135,0.25)]'
        : value === 'B'
        ? 'bg-[#00FFFF]/20 text-[#00FFFF] border-[#00FFFF]/40 shadow-[0_0_8px_rgba(0,255,255,0.25)]'
        : value === 'C'
        ? 'bg-[#FF4500]/20 text-[#FF4500] border-[#FF4500]/40'
        : 'bg-[#FF00FF]/20 text-[#FF00FF] border-[#FF00FF]/50 shadow-[0_0_10px_rgba(255,0,255,0.3)]';

    return (
      <span
        className={`inline-flex items-center justify-center font-mono font-bold rounded-[6px] border ${gradeColor} ${
          size === 'xs' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
        } ${className}`}
        title={`Quality Grade: ${value}`}
      >
        {value}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-mono rounded-[6px] border px-2 py-0.5 text-xs ${className}`}>
      {value}
    </span>
  );
};
