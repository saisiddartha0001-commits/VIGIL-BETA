import React from 'react';
import { PageId } from '../../types/vigil';
import {
  LayoutDashboard,
  Database,
  FlaskConical,
  FileSearch,
  Orbit,
  RotateCcw,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  gapsCount: number;
  catalogCount: number;
  freshnessFailuresCount: number;
  onResetDemo: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  gapsCount,
  catalogCount,
  freshnessFailuresCount: _freshnessFailuresCount,
  onResetDemo,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: {
    id: PageId;
    label: string;
    icon: React.ElementType;
    badge?: string | number | null;
    badgeVariant?: 'default' | 'danger' | 'warning' | 'cyan';
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'provenance',
      label: 'Data Provenance',
      icon: Database,
      badge: '21 OMM',
      badgeVariant: 'cyan',
    },
    {
      id: 'stability',
      label: 'Stability Lab',
      icon: FlaskConical,
      badge: '3 Models',
      badgeVariant: 'cyan',
    },
    {
      id: 'evidence',
      label: 'Evidence Report',
      icon: FileSearch,
      badge: gapsCount,
      badgeVariant: 'warning',
    },
    {
      id: 'catalog',
      label: 'Object Catalog',
      icon: Orbit,
      badge: catalogCount,
      badgeVariant: 'default',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 font-mono select-none">
      <div>
        {/* Brand Header */}
        <div className="pb-4 border-b border-[rgba(0,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-[#090d1f] border border-[#00FFFF]/50 shadow-[0_0_20px_rgba(0,255,255,0.3)] text-[#00FFFF]">
                {/* Cyber-Tribal Sacred Geometry Symbol */}
                <svg
                  className="w-6 h-6 text-[#00FFFF]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <polygon points="12,2 22,12 12,22 2,12" stroke="#00FFFF" strokeWidth="1.5" fill="rgba(75,0,130,0.3)" />
                  <circle cx="12" cy="12" r="3" fill="#FF00FF" fillOpacity="0.4" stroke="#FF00FF" />
                  <line x1="12" y1="5" x2="12" y2="9" stroke="#00FFFF" strokeWidth="1.5" />
                  <line x1="12" y1="15" x2="12" y2="19" stroke="#00FFFF" strokeWidth="1.5" />
                  <line x1="5" y1="12" x2="9" y2="12" stroke="#00FFFF" strokeWidth="1.5" />
                  <line x1="15" y1="12" x2="19" y2="12" stroke="#00FFFF" strokeWidth="1.5" />
                  <path d="M7 8 L10 10" stroke="#29AB87" strokeWidth="1.2" />
                  <path d="M17 8 L14 10" stroke="#29AB87" strokeWidth="1.2" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-wider text-[#FFFFFF] font-display">
                    VIGIL
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-[4px] bg-[#111530] border border-[#00FFFF]/40 text-[#00FFFF]">
                    ALPHA
                  </span>
                </div>
                <div className="text-[10px] text-[#00FFFF] font-mono tracking-wider uppercase font-semibold">
                  CYBER-TRIBAL AUDITOR
                </div>
              </div>
            </div>

            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg border border-white/10 text-[#91a2b9] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-3 text-[10px] text-[#61738c] tracking-wider uppercase bg-[#0b1424]/80 px-2.5 py-1 rounded border border-[rgba(91,160,190,0.15)] flex items-center justify-between">
            <span>Evidence & Uncertainty</span>
            <span className="text-[#38d9f5]">SSA</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-5 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectPage(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs tracking-wide transition-all ${
                  active
                    ? 'bg-[#00FFFF]/15 text-[#00FFFF] border border-[#00FFFF]/50 shadow-[0_0_15px_rgba(0,255,255,0.2)] font-semibold'
                    : 'text-[#8b80b6] hover:text-[#FFFFFF] hover:bg-[#111530]/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#00FFFF]' : 'text-[#8b80b6]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-semibold ${
                      item.badgeVariant === 'danger'
                        ? 'bg-[#FF00FF]/20 text-[#FF00FF] border border-[#FF00FF]/40 shadow-[0_0_8px_rgba(255,0,255,0.3)]'
                        : item.badgeVariant === 'warning'
                        ? 'bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/40'
                        : item.badgeVariant === 'cyan'
                        ? 'bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40'
                        : 'bg-[#111530] text-[#00FFFF] border border-[#00FFFF]/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Demo Controls */}
        <div className="mt-6 pt-4 border-t border-[rgba(91,160,190,0.18)]">
          <span className="text-[10px] text-[#61738c] tracking-wider uppercase block mb-2">
            Harness Controls
          </span>
          <button
            type="button"
            onClick={onResetDemo}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-[#91a2b9] hover:text-[#edf4ff] bg-[#101c30] border border-[rgba(91,160,190,0.2)] hover:border-[#38d9f5]/40 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#38d9f5]" />
            <span>Reset Demo Scenario</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[rgba(91,160,190,0.18)] space-y-2.5 text-[11px]">
        <div className="flex justify-between items-center text-[#91a2b9]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            EVIDENCE ENGINE:
          </span>
          <span className="text-emerald-400 font-semibold">ACTIVE</span>
        </div>

        <div className="p-2.5 bg-[#0b1424] rounded-lg border border-[rgba(91,160,190,0.18)] text-[10px] text-[#61738c] leading-relaxed">
          <span className="text-amber-400 font-semibold block mb-0.5">
            RESEARCH PROTOTYPE
          </span>
          Uncertainty auditor for space situational awareness. Fictional demo dataset.
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-[260px] shrink-0 bg-[#080f1d] border-r border-[rgba(91,160,190,0.18)] z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#050914]/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative w-[280px] bg-[#080f1d] border-r border-[rgba(91,160,190,0.3)] z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
