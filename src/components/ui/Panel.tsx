import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PanelProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  accent?: 'cyan' | 'warning' | 'danger' | 'none';
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  accent = 'none',
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  const getAccentBorder = () => {
    switch (accent) {
      case 'cyan':
        return 'border-[#00FFFF]/50 shadow-[0_0_20px_rgba(0,255,255,0.18)]';
      case 'warning':
        return 'border-[#FF4500]/50 shadow-[0_0_20px_rgba(255,69,0,0.18)]';
      case 'danger':
        return 'border-[#FF00FF]/50 shadow-[0_0_20px_rgba(255,0,255,0.22)]';
      default:
        return 'border-[rgba(0,255,255,0.18)] hover:border-[rgba(0,255,255,0.38)]';
    }
  };

  const getAccentHeaderLine = () => {
    switch (accent) {
      case 'cyan':
        return 'bg-gradient-to-r from-[#00FFFF] via-[#BF00FF] to-transparent';
      case 'warning':
        return 'bg-gradient-to-r from-[#FF4500] via-[#FF00FF]/50 to-transparent';
      case 'danger':
        return 'bg-gradient-to-r from-[#FF00FF] via-[#4B0082] to-transparent';
      default:
        return 'bg-gradient-to-r from-[#00FFFF]/30 via-[#BF00FF]/20 to-transparent';
    }
  };

  const headerLine = getAccentHeaderLine();

  return (
    <div
      className={`bg-[#080b18] rounded-[8px] border relative overflow-hidden transition-all duration-200 ${getAccentBorder()} ${className}`}
    >
      {headerLine && <div className={`h-[2px] w-full ${headerLine}`} />}

      {(title || actions || badge) && (
        <div
          className={`flex flex-wrap items-center justify-between px-4 py-3 border-b border-[rgba(91,160,190,0.16)] gap-2 ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1 rounded bg-[#101c30] text-[#38d9f5] border border-white/10 shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-mono font-semibold tracking-wider text-[#edf4ff] uppercase truncate">
                    {title}
                  </h3>
                  {badge}
                </div>
              )}
              {subtitle && (
                <p className="text-[11px] text-[#91a2b9] font-sans mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className={`p-4 md:p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
