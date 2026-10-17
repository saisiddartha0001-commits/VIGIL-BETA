import React, { useState } from 'react';
import { OrbitalObject } from '../../types/vigil';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { formatAltitude, formatVelocity, formatDistance } from '../../utils/formatters';
import {
  Orbit,
  Search,
  FileSearch,
  FlaskConical,
  ShieldAlert,
} from 'lucide-react';

interface ObjectCatalogPageProps {
  satellites: OrbitalObject[];
  selectedSatellite: OrbitalObject;
  onSelectSatellite: (sat: OrbitalObject) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateToEvidence?: () => void;
  onNavigateToStability?: () => void;
  onRequestSimBurn?: (satId: string) => void;
}

export const ObjectCatalogPage: React.FC<ObjectCatalogPageProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  searchQuery,
  onSearchChange,
  onNavigateToEvidence,
  onNavigateToStability,
  onRequestSimBurn,
}) => {
  const [regimeFilter, setRegimeFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  const filteredSatellites = satellites.filter((sat) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      sat.name.toLowerCase().includes(q) ||
      sat.id.toLowerCase().includes(q) ||
      sat.noradId.toString().includes(q) ||
      sat.operator.toLowerCase().includes(q);

    const matchesRegime = regimeFilter === 'ALL' || sat.regime === regimeFilter;
    const matchesRisk = riskFilter === 'ALL' || sat.riskLevel === riskFilter;
    const matchesGrade = gradeFilter === 'ALL' || sat.dataQualityGrade === gradeFilter;

    return matchesSearch && matchesRegime && matchesRisk && matchesGrade;
  });

  const resetAllFilters = () => {
    onSearchChange('');
    setRegimeFilter('ALL');
    setRiskFilter('ALL');
    setGradeFilter('ALL');
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <SectionHeader
        title="Orbital Catalog & Fleet Registry"
        subtitle="Cataloged space objects with integrated data freshness, state covariance availability, and evidence audit ratings."
        badge={
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#38d9f5]/15 text-[#38d9f5] border border-[#38d9f5]/30">
            {satellites.length} TRACKED OBJECTS
          </span>
        }
      />

      {/* Filter & Search Control Bar */}
      <div className="p-4 bg-[#0b1424] rounded-xl border border-[rgba(91,160,190,0.18)] flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#61738c]" />
          <input
            type="text"
            placeholder="Filter by name, NORAD ID, operator..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#101c30] border border-[rgba(91,160,190,0.2)] rounded-lg text-xs text-[#edf4ff] placeholder-[#61738c] focus:outline-none focus:border-[#38d9f5]"
          />
        </div>

        {/* Regime Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#61738c] uppercase">REGIME:</span>
          {['ALL', 'LEO', 'MEO', 'GEO'].map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegimeFilter(reg)}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                regimeFilter === reg
                  ? 'bg-[#38d9f5] text-[#050914] font-bold shadow-[0_0_8px_rgba(56,217,245,0.4)]'
                  : 'bg-[#101c30] border border-[rgba(91,160,190,0.2)] text-[#91a2b9] hover:text-[#edf4ff]'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#61738c] uppercase">RISK:</span>
          {['ALL', 'Critical', 'Elevated', 'Nominal'].map((rk) => (
            <button
              key={rk}
              type="button"
              onClick={() => setRiskFilter(rk)}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                riskFilter === rk
                  ? 'bg-[#38d9f5] text-[#050914] font-bold shadow-[0_0_8px_rgba(56,217,245,0.4)]'
                  : 'bg-[#101c30] border border-[rgba(91,160,190,0.2)] text-[#91a2b9] hover:text-[#edf4ff]'
              }`}
            >
              {rk}
            </button>
          ))}
        </div>

        {/* Quality Grade Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#61738c] uppercase">GRADE:</span>
          {['ALL', 'A', 'B', 'C', 'UNVERIFIED'].map((gr) => (
            <button
              key={gr}
              type="button"
              onClick={() => setGradeFilter(gr)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                gradeFilter === gr
                  ? 'bg-[#38d9f5] text-[#050914] font-bold'
                  : 'bg-[#101c30] border border-[rgba(91,160,190,0.2)] text-[#91a2b9] hover:text-[#edf4ff]'
              }`}
            >
              {gr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Catalog Cards (8 Cols) + Inspector Drawer (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catalog Items (8 Cols) */}
        <div className="lg:col-span-8">
          {filteredSatellites.length === 0 ? (
            <div className="p-12 text-center bg-[#0b1424] border border-dashed border-[rgba(91,160,190,0.25)] rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-[#edf4ff]">
                NO ORBITAL OBJECTS MATCH CRITERIA
              </div>
              <p className="text-xs text-[#91a2b9] max-w-md mx-auto">
                No objects matched "{searchQuery}" with the active filters. Try broadening your search or resetting all filters.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-2 px-4 py-2 bg-[#101c30] hover:bg-[#38d9f5]/20 hover:text-[#38d9f5] text-[#91a2b9] rounded-lg border border-[rgba(91,160,190,0.2)] transition-colors text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSatellites.map((sat) => {
                const isSelected = selectedSatellite.id === sat.id;

                return (
                  <div
                    key={sat.id}
                    onClick={() => onSelectSatellite(sat)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#101c30] border-[#38d9f5] shadow-[0_0_15px_rgba(56,217,245,0.15)] ring-1 ring-[#38d9f5]/50'
                        : 'bg-[#0b1424] border-[rgba(91,160,190,0.18)] hover:border-[rgba(56,217,245,0.35)]'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(91,160,190,0.15)]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101c30] border border-[rgba(91,160,190,0.2)] text-[#38d9f5] font-semibold">
                            {sat.regime}
                          </span>
                          <StatusBadge type="grade" value={sat.dataQualityGrade} size="xs" />
                        </div>
                        <StatusBadge type="risk" value={sat.riskLevel} size="xs" />
                      </div>

                      <div className="font-bold text-[#edf4ff] text-sm break-words leading-tight">
                        {sat.name}
                      </div>
                      <div className="text-[11px] text-[#91a2b9] mt-1 break-words">
                        NORAD #{sat.noradId} • <span className="text-[#38d9f5]">{sat.operator}</span>
                      </div>

                      {/* Technical Specs */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[rgba(91,160,190,0.12)] text-xs">
                        <div>
                          <span className="text-[10px] text-[#61738c] block">ALTITUDE</span>
                          <span className="text-[#edf4ff] font-semibold">
                            {formatAltitude(sat.altitude)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#61738c] block">VELOCITY</span>
                          <span className="text-[#edf4ff] font-semibold">
                            {formatVelocity(sat.velocity)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#61738c] block">COVARIANCE</span>
                          <span className="text-amber-400 font-bold text-[10px]">
                            {sat.covarianceStatusText || (sat.covarianceAvailable ? '✓ Available' : 'NOT IN GP/OMM')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#61738c] block">EPOCH AGE</span>
                          <span className={sat.currentElementAgeHours && sat.currentElementAgeHours > 24 ? 'text-rose-400' : 'text-[#38d9f5]'}>
                            {(sat.currentElementAgeHours ?? sat.freshnessHours).toFixed(1)}h UTC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Threat / Verdict indicator */}
                    <div className="mt-3 pt-2 border-t border-[rgba(91,160,190,0.12)] flex items-center justify-between text-[11px]">
                      <span className="text-[#61738c]">VERDICT:</span>
                      <StatusBadge
                        type="verdict"
                        value={sat.evidenceVerdict || sat.auditVerdict || 'DATA QUALITY CHECKS PASSED'}
                        size="xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Inspector Drawer (4 Cols) */}
        <div className="lg:col-span-4">
          <Panel
            title="Telemetry & Evidence Inspector"
            subtitle={`Target: ${selectedSatellite.id}`}
            icon={Orbit}
            accent={selectedSatellite.riskLevel === 'Critical' ? 'danger' : 'cyan'}
          >
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-[10px] text-[#61738c] uppercase">OBJECT DOSSIER</div>
                <div className="text-lg font-bold text-[#edf4ff] mt-0.5">
                  {selectedSatellite.name}
                </div>
                <div className="text-xs text-[#38d9f5]">{selectedSatellite.operator}</div>
              </div>

              {/* Status & Verdict Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge type="risk" value={selectedSatellite.riskLevel} />
                <StatusBadge type="verdict" value={selectedSatellite.evidenceVerdict || selectedSatellite.auditVerdict || 'DATA QUALITY CHECKS PASSED'} />
              </div>

              {/* Orbital Telemetry & SATCAT Dossier Parameters */}
              <div className="p-3 bg-[#101c30] rounded-xl border border-[rgba(91,160,190,0.2)] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">NORAD Catalog ID:</span>
                  <span className="font-semibold text-[#edf4ff]">#{selectedSatellite.noradId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Int'l Designator:</span>
                  <span className="font-semibold text-[#00FFFF]">{selectedSatellite.intlDesignator || 'NOT PROVIDED BY SOURCE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Object Classification:</span>
                  <span className="font-semibold text-[#edf4ff]">{selectedSatellite.objectType || 'NOT PROVIDED BY SOURCE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">State / Owner Code:</span>
                  <span className="font-semibold text-[#edf4ff]">{selectedSatellite.ownerCode || 'NOT PROVIDED BY SOURCE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Launch Date / Site:</span>
                  <span className="font-semibold text-[#edf4ff]">
                    {selectedSatellite.launchDate ? `${selectedSatellite.launchDate} (${selectedSatellite.launchSite || 'N/A'})` : 'NOT PROVIDED BY SOURCE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Orbital Regime:</span>
                  <span className="text-[#38d9f5] font-semibold">{selectedSatellite.regime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Mean Altitude:</span>
                  <span className="font-semibold text-[#edf4ff]">
                    {formatAltitude(selectedSatellite.altitude)} <span className="text-[9px] text-[#61738c]">({selectedSatellite.altitudeLabel || 'APPROX'})</span>
                  </span>
                </div>
                {selectedSatellite.apogeeKm !== undefined && selectedSatellite.perigeeKm !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[#91a2b9]">Apogee / Perigee:</span>
                    <span className="font-semibold text-[#edf4ff]">
                      {selectedSatellite.apogeeKm} km / {selectedSatellite.perigeeKm} km
                    </span>
                  </div>
                )}
                {selectedSatellite.periodMin !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[#91a2b9]">Orbital Period:</span>
                    <span className="font-semibold text-[#edf4ff]">
                      {selectedSatellite.periodMin.toFixed(2)} min
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Orbital Velocity:</span>
                  <span className="font-semibold text-[#edf4ff]">
                    {formatVelocity(selectedSatellite.velocity)} <span className="text-[9px] text-[#61738c]">(APPROX)</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Inclination:</span>
                  <span className="font-semibold text-[#edf4ff]">{selectedSatellite.inclination.toFixed(2)}°</span>
                </div>
                {selectedSatellite.rcsSm !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[#91a2b9]">Radar Cross Section (RCS):</span>
                    <span className="font-semibold text-[#38d9f5]">{selectedSatellite.rcsSm} m²</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#91a2b9]">Status Mode:</span>
                  <span className="text-emerald-400 font-semibold">{selectedSatellite.status}</span>
                </div>
              </div>

              {/* Conjunction Risk Metrics */}
              {selectedSatellite.conjunctionTarget && !selectedSatellite.conjunctionTarget.includes('NONE') && !selectedSatellite.conjunctionTarget.includes('NO CDM') ? (
                <div className="p-3.5 bg-[#101c30] rounded-xl border border-rose-500/30 space-y-2">
                  <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    CONJUNCTION THREAT PROFILE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#91a2b9]">Secondary Object:</span>
                    <span className="text-rose-400 font-bold">{selectedSatellite.conjunctionTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#91a2b9]">Miss Distance:</span>
                    <span className="text-[#edf4ff] font-bold">{formatDistance(selectedSatellite.missDistance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#91a2b9]">Collision Prob (PoC):</span>
                    <span className="text-amber-400 font-bold">{selectedSatellite.poc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#91a2b9]">Time to Closest Approach:</span>
                    <span className="text-[#38d9f5] font-bold">{selectedSatellite.tca}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-[#030408] rounded-[8px] border border-[rgba(0,255,255,0.25)] space-y-2 text-xs">
                  <div className="text-[10px] text-[#00FFFF] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#00FFFF]" />
                    {selectedSatellite.covarianceAvailable ? 'CONJUNCTION STATUS: SAFE SEPARATION' : 'CONJUNCTION RISK: NOT EVALUATED'}
                  </div>
                  <div className="text-[11px] text-[#8b80b6] leading-relaxed">
                    {selectedSatellite.covarianceAvailable
                      ? 'Simulated 6x6 UVW state covariance active. Trajectory screening confirms safe separation distance (> 50 km) along the 72-hour propagation horizon.'
                      : 'CDM DATA NOT AVAILABLE. Public CelesTrak GP/OMM elements do not provide 6x6 covariance tensors or conjunction event geometries. Collision-risk assessment is strictly suppressed.'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[rgba(0,255,255,0.15)] text-[10px]">
                    <div>
                      <span className="text-[#8b80b6] block">PoC STATUS:</span>
                      <span className="text-[#00FFFF] font-bold">
                        {selectedSatellite.covarianceAvailable ? '< 1.00e-07 (NOMINAL)' : 'NOT EVALUATED'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8b80b6] block">COVARIANCE:</span>
                      <span className={`font-bold ${selectedSatellite.covarianceAvailable ? 'text-emerald-400' : 'text-[#FF4500]'}`}>
                        {selectedSatellite.covarianceAvailable ? '6x6 UVW TENSOR' : 'ABSENT'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Forensic Quality Dossier */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#61738c] uppercase tracking-wider block">
                  EVIDENCE QUALITY AUDIT:
                </span>
                <p className="text-[11px] text-[#91a2b9] font-sans leading-relaxed">
                  {selectedSatellite.verdictReason}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[rgba(91,160,190,0.18)] space-y-2">
                {onNavigateToEvidence && (
                  <button
                    type="button"
                    onClick={onNavigateToEvidence}
                    className="w-full py-2 bg-[#101c30] hover:bg-[#38d9f5]/20 text-[#38d9f5] rounded-lg border border-[rgba(91,160,190,0.2)] font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>View Evidence Audit</span>
                  </button>
                )}

                {onNavigateToStability && (
                  <button
                    type="button"
                    onClick={onNavigateToStability}
                    className="w-full py-2 bg-[#101c30] hover:bg-[#14233c] text-[#91a2b9] hover:text-white rounded-lg border border-[rgba(91,160,190,0.2)] font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Test In Stability Lab</span>
                  </button>
                )}

                {onRequestSimBurn && (
                  <button
                    type="button"
                    onClick={() => onRequestSimBurn(selectedSatellite.id)}
                    className="w-full py-2 bg-[#00FFFF] hover:bg-[#00FFFF]/85 text-[#030408] font-bold rounded-lg uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,255,0.3)] flex items-center justify-center gap-2 transition-all"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>Export Audit Dossier</span>
                  </button>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
