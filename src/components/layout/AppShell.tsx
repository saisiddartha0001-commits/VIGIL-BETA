import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageId } from '../../types/vigil';

interface AppShellProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  pageTitle: string;
  pageDescription?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  gapsCount: number;
  catalogCount: number;
  freshnessFailuresCount: number;
  onResetDemo: () => void;
  toastMessage?: { title: string; body: string } | null;
  onDismissToast?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentPage,
  onSelectPage,
  pageTitle,
  pageDescription,
  searchQuery,
  onSearchChange,
  gapsCount,
  catalogCount,
  freshnessFailuresCount,
  onResetDemo,
  toastMessage,
  onDismissToast,
  children,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#050914] text-[#edf4ff] font-sans overflow-x-hidden pt-12">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={onSelectPage}
        gapsCount={gapsCount}
        catalogCount={catalogCount}
        freshnessFailuresCount={freshnessFailuresCount}
        onResetDemo={onResetDemo}
        isMobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          pageTitle={pageTitle}
          pageDescription={pageDescription}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          showSearch={currentPage === 'catalog' || currentPage === 'overview'}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 bg-[#0b1424] border border-[#38d9f5]/50 rounded-xl shadow-[0_0_30px_rgba(56,217,245,0.25)] font-mono text-xs transition-all animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(91,160,190,0.2)] mb-2">
            <span className="text-[#38d9f5] font-bold tracking-wider">
              {toastMessage.title}
            </span>
            {onDismissToast && (
              <button
                type="button"
                onClick={onDismissToast}
                className="text-[#61738c] hover:text-white ml-2 text-sm"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-[#91a2b9] leading-relaxed text-[11px]">
            {toastMessage.body}
          </div>
        </div>
      )}
    </div>
  );
};
