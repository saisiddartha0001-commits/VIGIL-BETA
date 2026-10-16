import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[rgba(0,255,255,0.2)] ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#FFFFFF] font-display">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-[#00FFFF] mt-1 leading-relaxed max-w-3xl opacity-90">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 font-mono text-xs shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
