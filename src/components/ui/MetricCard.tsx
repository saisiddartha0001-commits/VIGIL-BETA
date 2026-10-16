import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'cyan';
  onClick?: () => void;
  badge?: string;
  active?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  onClick,
  badge,
  active = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          card: 'border-[#FF00FF]/40 bg-[#080b18] hover:border-[#FF00FF] hover:shadow-[0_0_18px_rgba(255,0,255,0.25)]',
          val: 'text-[#FF00FF]',
          icon: 'text-[#FF00FF] bg-[#FF00FF]/15 border-[#FF00FF]/40',
        };
      case 'warning':
        return {
          card: 'border-[#FF4500]/40 bg-[#080b18] hover:border-[#FF4500] hover:shadow-[0_0_18px_rgba(255,69,0,0.25)]',
          val: 'text-[#FF4500]',
          icon: 'text-[#FF4500] bg-[#FF4500]/15 border-[#FF4500]/40',
        };
      case 'success':
        return {
          card: 'border-[#29AB87]/40 bg-[#080b18] hover:border-[#29AB87] hover:shadow-[0_0_18px_rgba(41,171,135,0.25)]',
          val: 'text-[#29AB87]',
          icon: 'text-[#29AB87] bg-[#29AB87]/15 border-[#29AB87]/40',
        };
      case 'cyan':
        return {
          card: 'border-[#00FFFF]/40 bg-[#080b18] hover:border-[#00FFFF] hover:shadow-[0_0_18px_rgba(0,255,255,0.25)]',
          val: 'text-[#00FFFF]',
          icon: 'text-[#00FFFF] bg-[#00FFFF]/15 border-[#00FFFF]/40',
        };
      default:
        return {
          card: 'border-[rgba(0,255,255,0.18)] bg-[#080b18] hover:border-[#00FFFF]/60 hover:shadow-[0_0_15px_rgba(0,255,255,0.15)]',
          val: 'text-[#FFFFFF]',
          icon: 'text-[#00FFFF] bg-[#101228] border-[rgba(0,255,255,0.25)]',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-[8px] border transition-all duration-200 font-mono relative overflow-hidden ${
        styles.card
      } ${onClick ? 'cursor-pointer hover:scale-[1.03]' : ''} ${
        active ? 'ring-2 ring-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.25)]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#91a2b9] uppercase">
          {label}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-lg border text-xs ${styles.icon}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight ${styles.val}`}>
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#101c30] text-[#91a2b9] border border-white/10">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-[11px] text-[#61738c] mt-1.5 leading-snug">
          {subtitle}
        </div>
      )}
    </div>
  );
};
