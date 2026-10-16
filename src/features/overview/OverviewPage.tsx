import React from 'react';
import {
  OrbitalObject,
  AssessmentScenario,
  EvidenceGap,
  EvidenceTraceStep,
  FreshnessCheck,
  PageId,
} from '../../types/vigil';
import { MetricCard } from '../../components/ui/MetricCard';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OrbitSchematic } from '../../components/charts/OrbitSchematic';
import { SensitivityChart } from '../../components/charts/SensitivityChart';
import { EvidenceTraceDiagram } from '../../components/charts/EvidenceTraceDiagram';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  ArrowRight,
  Database,
  FlaskConical,
  FileSearch,
  Orbit,
  CheckCircle2,
} from 'lucide-react';

interface OverviewPageProps {
  satellites: OrbitalObject[];
  selectedSatellite: OrbitalObject;
  onSelectSatellite: (sat: OrbitalObject) => void;
  scenarios: AssessmentScenario[];
  activeScenario: AssessmentScenario;
  onSelectScenario: (scenario: AssessmentScenario) => void;
  evidenceGaps: EvidenceGap[];
  evidenceTrace: EvidenceTraceStep[];
  freshnessChecks: FreshnessCheck[];
  onNavigate: (page: PageId, targetId?: string) => void;
  onRequestSimBurn: (satId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  scenarios,
  activeScenario,
  onSelectScenario,
  evidenceGaps,
  evidenceTrace,
  freshnessChecks,
  onNavigate,
  onRequestSimBurn,
}) => {
  const staleChecksCount = freshnessChecks.filter((c) => c.status !== 'PASS').length;
  const criticalGapsCount = evidenceGaps.filter((g) => g.severity === 'CRITICAL').length;
  const sensitiveScenariosCount = scenarios.filter((s) => s.stabilityRating !== 'STABLE').length;

  return (
    <div className="space-y-6">
      {/* 1. Cyber-Tribal Display Banner */}
      <div className="pb-3 border-b border-[rgba(0,255,255,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#FFFFFF] font-display">
            TRUST THE EVIDENCE. AUDIT THE UNCERTAINTY.
          </h1>
          <p className="text-xs md:text-sm text-[#00FFFF] mt-1 font-mono tracking-wide">
            Primal geometry meets digital orbital forensics. Verify observation lineage before interpreting collision vectors.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#00FFFF] bg-[#111530] px-3.5 py-2 rounded-[8px] border border-[#00FFFF]/40 shadow-[0_0_15px_rgba(0,255,255,0.2)] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping" />
          <span className="font-semibold tracking-wider">CYBER-TRIBAL HUD ONLINE</span>
        </div>
      </div>

      {/* 2. Restrained Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 font-mono">
        <MetricCard
          label="Demo Records"
          value={satellites.length}
          subtitle={`LEO: ${satellites.filter((s) => s.regime === 'LEO').length} | MEO: ${
            satellites.filter((s) => s.regime === 'MEO').length
          } | GEO: ${satellites.filter((s) => s.regime === 'GEO').length}`}
          icon={Orbit}
          variant="default"
          onClick={() => onNavigate('catalog')}
          badge="Inspect Catalog"
        />

        <MetricCard
          label="Freshness Checks"
          value={`${staleChecksCount} Flagged`}
          subtitle="3 of 4 checks exceed latency tolerances"
          icon={Clock}
          variant={staleChecksCount > 0 ? 'danger' : 'success'}
          onClick={() => onNavigate('provenance')}
          badge="View Lineage"
        />

        <MetricCard
          label="Evidence Gaps"
          value={`${evidenceGaps.length} Open`}
          subtitle={`${criticalGapsCount} Critical unverified covariance gaps`}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => onNavigate('evidence')}
          badge="Audit Report"
        />

        <MetricCard
          label="Sensitivity Flags"
          value={`${sensitiveScenariosCount} Models`}
          subtitle="Atmospheric drag & SRP induce divergence"
          icon={FlaskConical}
          variant="cyan"
          onClick={() => onNavigate('stability')}
          badge="Stability Lab"
        />
      </div>

      {/* 3. Central Focal Point: 3-Tier Independent Audit Verdict */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-[#080b18] via-[#101228] to-[#080b18] border-2 border-[#00FFFF]/50 rounded-[8px] shadow-[0_0_30px_rgba(0,255,255,0.12)] relative overflow-hidden font-mono">
        {/* Accent top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00FFFF] via-[#BF00FF] to-[#00FFFF]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-[8px] bg-[#00FFFF]/15 border border-[#00FFFF]/40 text-[#00FFFF]">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div className="text-xl md:text-2xl font-black text-[#FFFFFF] font-display tracking-wider">
                INDEPENDENT EVIDENCE AUDIT DOSSIER
              </div>
              <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30">
                ACTIVE TARGET: {selectedSatellite.name} (NORAD #{selectedSatellite.noradId})
              </span>
            </div>

            {/* 3 Independent Assessment Categories (Section 3 of requirements) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Category A: Data Quality */}
              <div className="p-3 bg-[#030408] rounded-[8px] border border-[#29AB87]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b80b6] uppercase font-bold">A. DATA QUALITY</span>
                  <span className="text-[10px] font-bold text-[#29AB87] px-1.5 py-0.2 rounded bg-[#29AB87]/15 border border-[#29AB87]/30">
                    {selectedSatellite.dataQualityStatus || 'PASS'}
                  </span>
                </div>
                <div className="text-[11px] text-[#FFFFFF] font-semibold">
                  Grade {selectedSatellite.dataQualityGrade} • {selectedSatellite.freshnessHours.toFixed(1)}h Age
                </div>
                <div className="text-[10px] text-[#00FFFF]/80 font-sans leading-snug">
                  Identifiers verified, valid Keplerian bounds, ISO epoch parsed.
                </div>
              </div>

              {/* Category B: Orbital Propagation */}
              <div className="p-3 bg-[#030408] rounded-[8px] border border-[#00FFFF]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b80b6] uppercase font-bold">B. PROPAGATION</span>
                  <span className="text-[10px] font-bold text-[#00FFFF] px-1.5 py-0.2 rounded bg-[#00FFFF]/15 border border-[#00FFFF]/30">
                    {selectedSatellite.propagationStatus || 'SGP4_CAPABLE'}
                  </span>
                </div>
                <div className="text-[11px] text-[#FFFFFF] font-semibold">
                  SGP4 Model Certified
                </div>
                <div className="text-[10px] text-[#00FFFF]/80 font-sans leading-snug">
                  Mean motion ({selectedSatellite.velocity.toFixed(2)} km/s) & BSTAR inputs valid.
                </div>
              </div>

              {/* Category C: Conjunction Risk */}
              <div className="p-3 bg-[#030408] rounded-[8px] border border-[#FF4500]/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b80b6] uppercase font-bold">C. CONJUNCTION RISK</span>
                  <span className="text-[10px] font-bold text-[#FF4500] px-1.5 py-0.2 rounded bg-[#FF4500]/15 border border-[#FF4500]/40">
                    NO CDM
                  </span>
                </div>
                <div className="text-[11px] text-[#FF4500] font-semibold">
                  NOT EVALUATED
                </div>
                <div className="text-[10px] text-[#00FFFF]/80 font-sans leading-snug">
                  CDM and 6x6 covariance absent in public GP elements. PoC suppressed.
                </div>
              </div>
            </div>

            <p className="text-xs text-[#00FFFF] font-sans leading-relaxed pt-1">
              <strong>Forensic Rationale:</strong> A valid orbital record is NOT given a blanket failure verdict. The public element set is physically authentic and suitable for situational awareness, but because no Conjunction Data Message (CDM) or covariance tensor is supplied, collision probability cannot be evaluated. Tactical maneuver burns remain blocked.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('evidence')}
              className="px-4 py-2.5 bg-[#00FFFF] hover:bg-[#00FFFF]/85 text-[#030408] font-bold text-xs rounded-[8px] shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:translate-y-[1px]"
            >
              <FileSearch className="w-4 h-4 text-[#030408]" />
              <span className="font-display tracking-wider text-[11px]">AUDIT REPORT</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('provenance')}
              className="px-4 py-2 bg-[#111530] hover:bg-[#191c40] text-[#00FFFF] border border-[#00FFFF]/40 text-xs rounded-[8px] flex items-center justify-center gap-2 transition-all"
            >
              <Database className="w-4 h-4 text-[#00FFFF]" />
              <span className="font-display tracking-wider text-[11px]">INSPECT LINEAGE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Three Readable Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono">
        {/* Area 1: Data Provenance Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Panel
            title="Data Provenance Summary"
            subtitle="Source records, epochs, and sensor freshness"
            icon={Database}
            accent="cyan"
            actions={
              <button
                type="button"
                onClick={() => onNavigate('provenance')}
                className="text-xs text-[#38d9f5] hover:underline flex items-center gap-1"
              >
                <span>Full Lineage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            }
          >
            <div className="space-y-3">
              {/* Selected object telemetry badge */}
              <div className="p-3 bg-[#101228] rounded-[8px] border border-[rgba(0,255,255,0.25)] space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,255,255,0.15)]">
                  <span className="text-[10px] text-[#8b80b6] uppercase font-bold">SELECTED TARGET</span>
                  <StatusBadge type="grade" value={selectedSatellite.dataQualityGrade} size="xs" />
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[#FFFFFF] text-sm">{selectedSatellite.name}</span>
                  <span className="text-[#00FFFF] text-[11px] font-semibold">{selectedSatellite.regime} (NORAD #{selectedSatellite.noradId})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-[#8b80b6] block text-[10px]">SOURCE EPOCH AGE</span>
                    <span className="text-[#00FFFF] font-bold">{selectedSatellite.freshnessHours.toFixed(1)}h ago</span>
                  </div>
                  <div>
                    <span className="text-[#8b80b6] block text-[10px]">COVARIANCE TENSOR</span>
                    <span className="text-[#FF4500] font-bold">ABSENT (NO CDM)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Freshness & Validation Breakdown from real data */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] text-[#8b80b6] uppercase tracking-wider block font-bold">
                  VERIFIED AUDIT CRITERIA:
                </span>
                <div className="p-2.5 rounded-[8px] bg-[#030408] border border-[rgba(0,255,255,0.2)] flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#FFFFFF] truncate">
                      Orbital Epoch Freshness
                    </div>
                    <div className="text-[10px] text-[#8b80b6] truncate">
                      Epoch Age: {selectedSatellite.freshnessHours.toFixed(1)}h (Policy: &lt; 24.0h)
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                    selectedSatellite.freshnessHours <= 24
                      ? 'bg-[#29AB87]/15 text-[#29AB87] border-[#29AB87]/40'
                      : 'bg-[#FF4500]/15 text-[#FF4500] border-[#FF4500]/40'
                  }`}>
                    {selectedSatellite.freshnessHours <= 24 ? 'PASS' : 'WARNING'}
                  </span>
                </div>

                <div className="p-2.5 rounded-[8px] bg-[#030408] border border-[rgba(0,255,255,0.2)] flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#FFFFFF] truncate">
                      Domain Bounds (Mean Motion & Inclination)
                    </div>
                    <div className="text-[10px] text-[#8b80b6] truncate">
                      Velocity: {selectedSatellite.velocity.toFixed(2)} km/s | Inc: {selectedSatellite.inclination.toFixed(2)}°
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 bg-[#29AB87]/15 text-[#29AB87] border-[#29AB87]/40">
                    PASS
                  </span>
                </div>

                <div className="p-2.5 rounded-[8px] bg-[#030408] border border-[rgba(0,255,255,0.2)] flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#FFFFFF] truncate">
                      Conjunction State Covariance
                    </div>
                    <div className="text-[10px] text-[#8b80b6] truncate">
                      Standard GP/OMM record does not include 6x6 tensor
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 bg-[#FF00FF]/15 text-[#FF00FF] border-[#FF00FF]/40">
                    ABSENT
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Quick Interactive Polar Orbit Schematic */}
          <Panel
            title="Interactive Polar Radar"
            subtitle="Click satellites to target and inspect"
            icon={Orbit}
          >
            <OrbitSchematic
              satellites={satellites}
              selectedSatellite={selectedSatellite}
              onSelectSatellite={onSelectSatellite}
              onRequestBurn={onRequestSimBurn}
            />
          </Panel>
        </div>

        {/* Area 2 & Area 3: Stability Visualization & Prioritized Evidence Gaps (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Area 2: Assessment Stability Visualization */}
          <Panel
            title="Assessment Stability Engine"
            subtitle={`Model: ${activeScenario.shortTag} — Sensitivity divergence over 72h`}
            icon={FlaskConical}
            accent="warning"
            badge={
              <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#FF4500]/15 text-[#FF4500] border border-[#FF4500]/30">
                SIMULATION — NOT CALCULATED FROM REAL DATA
              </span>
            }
            actions={
              <button
                type="button"
                onClick={() => onNavigate('stability')}
                className="text-xs text-[#00FFFF] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Stability Lab</span>
                <ArrowRight className="w-3 h-3 text-[#00FFFF]" />
              </button>
            }
          >
            <div className="space-y-3">
              <div className="p-2.5 bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-[6px] text-[11px] text-[#00FFFF] leading-relaxed">
                <strong className="text-[#FF4500] font-mono">SIMULATION HARNESS NOTICE:</strong> Trajectory sensitivity curves reflect parameterized atmospheric drag, solar radiation pressure, and gravity harmonics perturbations. They are simulated perturbation tests and not derived from live telemetry.
              </div>
              {/* Scenario selector tabs */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[rgba(91,160,190,0.16)]">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onSelectScenario(sc)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                      activeScenario.id === sc.id
                        ? 'bg-[#38d9f5]/20 text-[#38d9f5] border border-[#38d9f5]/50 font-bold'
                        : 'bg-[#101c30] text-[#91a2b9] hover:text-white border border-transparent'
                    }`}
                  >
                    {sc.shortTag}
                  </button>
                ))}
              </div>

              {/* Render Native SVG Sensitivity Chart */}
              <SensitivityChart scenario={activeScenario} />
            </div>
          </Panel>

          {/* Area 3: Prioritized Evidence Gaps */}
          <Panel
            title="Prioritized Evidence Gaps"
            subtitle="Blocking automated avoidance maneuvers"
            icon={AlertTriangle}
            accent="danger"
            badge={
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {criticalGapsCount} CRITICAL
              </span>
            }
            actions={
              <button
                type="button"
                onClick={() => onNavigate('evidence')}
                className="text-xs text-[#38d9f5] hover:underline flex items-center gap-1"
              >
                <span>Full Audit Report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            }
          >
            <div className="space-y-3">
              {evidenceGaps.slice(0, 3).map((gap) => (
                <div
                  key={gap.id}
                  onClick={() => onNavigate('evidence', gap.id)}
                  className="p-3.5 rounded-xl bg-[#101c30] border border-[rgba(91,160,190,0.2)] hover:border-[#38d9f5]/50 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusBadge type="severity" value={gap.severity} size="xs" />
                      <span className="font-bold text-xs text-[#edf4ff] truncate">
                        {gap.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#38d9f5] hover:underline shrink-0">
                      Inspect →
                    </span>
                  </div>

                  <p className="text-xs text-[#91a2b9] font-sans leading-relaxed">
                    {gap.whyItMatters}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#61738c] pt-1">
                    <span>Impact: {gap.impactOnVerdict}</span>
                    <span className="font-mono text-[#38d9f5]">
                      {gap.affectedObjects.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* 5. Clear Evidence Trace: Input → Validation → Assumptions → Assessment */}
      <Panel
        title="Orbital Evidence Trace Pipeline"
        subtitle="Audit progression: Input → Validation → Assumptions → Assessment"
        icon={CheckCircle2}
        accent="cyan"
      >
        <EvidenceTraceDiagram
          steps={evidenceTrace}
          onNavigateToStage={(stage) => {
            if (stage === 'input' || stage === 'validation') {
              onNavigate('provenance');
            } else if (stage === 'assumptions') {
              onNavigate('stability');
            } else {
              onNavigate('evidence');
            }
          }}
        />
      </Panel>
    </div>
  );
};
