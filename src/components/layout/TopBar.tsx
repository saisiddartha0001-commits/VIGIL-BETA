import React, { useState, useEffect } from 'react';
import { Search, Menu, Clock, AlertCircle } from 'lucide-react';

interface TopBarProps {
  pageTitle: string;
  pageDescription?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileNav: () => void;
  showSearch?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  pageDescription,
  searchQuery,
  onSearchChange,
  onOpenMobileNav,
  showSearch = true,
}) => {
  const [utcTime, setUtcTime] = useState<string>(() => {
    return new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-[rgba(0,255,255,0.2)] bg-[#090d1f]/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between font-mono shrink-0 z-10 gap-3">
      {/* Left: Mobile Nav toggle + Title & Description */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-[8px] bg-[#111530] border border-[rgba(0,255,255,0.3)] text-[#00FFFF] hover:text-white"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-[#FFFFFF] tracking-tight truncate font-display">
              {pageTitle}
            </h2>
          </div>
          {pageDescription && (
            <p className="text-[11px] text-[#00FFFF]/80 font-sans truncate hidden sm:block">
              {pageDescription}
            </p>
          )}
        </div>
      </div>

      {/* Right: Search + UTC Clock + Synthetic Demo Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {showSearch && (
          <div className="relative hidden lg:block w-52 xl:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8b80b6]" />
            <input
              type="text"
              placeholder="Search object ID or name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#111530] border border-[rgba(0,255,255,0.25)] rounded-[8px] text-xs text-[#FFFFFF] placeholder-[#8b80b6] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF] focus:ring-offset-2 focus:ring-offset-[#030408]"
            />
          </div>
        )}

        {/* Live UTC Clock */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#00FFFF] px-2.5 py-1 bg-[#111530] rounded-[8px] border border-[rgba(0,255,255,0.3)] shadow-[0_0_12px_rgba(0,255,255,0.15)]">
          <Clock className="w-3.5 h-3.5 text-[#00FFFF]" />
          <span className="text-[11px] font-medium">{utcTime}</span>
        </div>

        {/* Visible Synthetic Demo Data Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#FF4500]/15 border border-[#FF4500]/40 text-[#FF4500] text-[10px] font-bold tracking-wider shadow-[0_0_10px_rgba(255,69,0,0.2)]">
          <AlertCircle className="w-3 h-3 text-[#FF4500] shrink-0" />
          <span className="hidden xs:inline">SYNTHETIC AUDIT DATA</span>
          <span className="xs:hidden">DEMO</span>
        </div>
      </div>
    </header>
  );
};
