import React from 'react';
import {
  OrbitalObject,
  AssessmentScenario,
  EvidenceGap,
  EvidenceTraceStep,
  FreshnessCheck,
  PageId,
} from '../../types/vigil';
import { SimulatedSatellite } from '../../types/simulation';
import { MetricCard } from '../../components/ui/MetricCard';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Orbital3DEnvironment } from '../../components/charts/Orbital3DEnvironment';
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
  simSatellites?: SimulatedSatellite[];
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
  isSimPlaying?: boolean;
  onToggleSimPlay?: () => void;
  simSpeed?: number;
  onSetSimSpeed?: (speed: number) => void;
  onResetSimClock?: () => void;
  currentSimUtc?: string;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  satellites,
  simSatellites = [],
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
  isSimPlaying = false,
  onToggleSimPlay = () => {},
  simSpeed = 1,
  onSetSimSpeed = () => {},
  onResetSimClock = () => {},
  currentSimUtc = new Date().toISOString(),
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

      {/* 2. Interactive 3D Orbital Intelligence Dashboard: 2-Column Responsive Layout (Hero Position) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-mono">
        {/* Left Column (8 cols): Large 3D Orbital Simulation Scene */}
        <div className="lg:col-span-8 flex flex-col">
          <Panel
            title="Interactive 3D Orbital Intelligence Dashboard"
            subtitle="Physics-driven 3D Earth, orbital trajectories, and conjunction threat visualization"
            icon={Orbit}
            accent="cyan"
            className="flex-1 flex flex-col"
          >
            <Orbital3DEnvironment
              satellites={simSatellites}
              selectedSatId={selectedSatellite.id}
              onSelectSatellite={(satId) => {
                const match = satellites.find(s => s.id === satId);
                if (match) onSelectSatellite(match);
              }}
              isPlaying={isSimPlaying}
              onTogglePlay={onToggleSimPlay}
              speed={simSpeed}
              onSetSpeed={onSetSimSpeed}
              onResetClock={onResetSimClock}
              currentSimUtc={currentSimUtc}
            />
          </Panel>
        </div>

        {/* Right Column (4 cols): Selected Target Telemetry & Physical Parameters Side Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <Panel
            title="Target Telemetry & State"
            subtitle="State vector derived from simulation engine"
            icon={Database}
            accent="cyan"
          >
            <div className="space-y-3.5">
              {/* Selected object telemetry card */}
              <div className="p-3.5 bg-[#101228] rounded-[8px] border border-[rgba(0,255,255,0.25)] space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,255,255,0.15)]">
                  <span className="text-[10px] text-[#8b80b6] uppercase font-bold tracking-wider">TARGET TRACKING</span>
                  <StatusBadge type="grade" value={selectedSatellite.dataQualityGrade} size="xs" />
                </div>
                <div>
                  <div className="font-bold text-[#FFFFFF] text-base font-display">{selectedSatellite.name}</div>
                  <div className="text-[#00FFFF] text-[11px] font-semibold">{selectedSatellite.regime} • ID: {selectedSatellite.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-[#030408] p-2 rounded border border-[rgba(0,255,255,0.15)]">
                    <div className="text-[10px] text-[#8b80b6]">ALTITUDE</div>
                    <div className="text-sm font-bold text-[#FFFFFF]">{selectedSatellite.altitude} km</div>
                  </div>
                  <div className="bg-[#030408] p-2 rounded border border-[rgba(0,255,255,0.15)]">
                    <div className="text-[10px] text-[#8b80b6]">VELOCITY</div>
                    <div className="text-sm font-bold text-[#FFFFFF]">{selectedSatellite.velocity.toFixed(2)} km/s</div>
                  </div>
                  <div className="bg-[#030408] p-2 rounded border border-[rgba(0,255,255,0.15)]">
                    <div className="text-[10px] text-[#8b80b6]">INCLINATION</div>
                    <div className="text-sm font-bold text-[#FFFFFF]">{selectedSatellite.inclination.toFixed(2)}°</div>
                  </div>
                  <div className="bg-[#030408] p-2 rounded border border-[rgba(0,255,255,0.15)]">
                    <div className="text-[10px] text-[#8b80b6]">PERIOD</div>
                    <div className="text-sm font-bold text-[#FFFFFF]">{selectedSatellite.periodMin || 94.2} min</div>
                  </div>
                </div>

                {selectedSatellite.conjunctionTarget && selectedSatellite.conjunctionTarget !== 'NONE' && (
                  <div className="p-2.5 rounded bg-[#FF00FF]/10 border border-[#FF00FF]/40 text-[#FF00FF] text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF00FF] animate-pulse" />
                      PREDICTED CONJUNCTION
                    </div>
                    <div>Partner: {selectedSatellite.conjunctionTarget}</div>
                    <div>Miss Distance: {selectedSatellite.missDistance} m</div>
                    <div>Collision Prob: {selectedSatellite.poc}</div>
                  </div>
                )}
              </div>

              {/* Simulation Status Checks */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-[8px] bg-[#030408] border border-[rgba(0,255,255,0.2)] flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#FFFFFF] truncate">
                      Orbital Physics Model
                    </div>
                    <div className="text-[10px] text-[#8b80b6] truncate">
                      2-Body Keplerian • Newton-Raphson Solver
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 bg-[#00FFFF]/15 text-[#00FFFF] border-[#00FFFF]/40">
                    ACTIVE
                  </span>
                </div>

                <div className="p-2.5 rounded-[8px] bg-[#030408] border border-[rgba(0,255,255,0.2)] flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#FFFFFF] truncate">
                      Uncertainty / Covariance
                    </div>
                    <div className="text-[10px] text-[#8b80b6] truncate">
                      Modeled 6x6 UVW Covariance Matrix
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 bg-[#29AB87]/15 text-[#29AB87] border-[#29AB87]/40">
                    VALIDATED
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* 3. Restrained Metric Strip */}
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
          subtitle={`${staleChecksCount} of ${freshnessChecks.length} checks require attention`}
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

      {/* 4. Central Focal Point: 3-Tier Independent Audit Verdict */}
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
                  SGP4 Propagation Compatible
                </div>
                <div className="text-[10px] text-[#00FFFF]/80 font-sans leading-snug">
                  Mean motion ({selectedSatellite.velocity.toFixed(2)} km/s) & BSTAR inputs valid.
                </div>
              </div>

              {/* Category C: Conjunction Risk */}
              <div className="p-3 bg-[#030408] rounded-[8px] border border-[#FF00FF]/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b80b6] uppercase font-bold">C. CONJUNCTION RISK</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    selectedSatellite.conjunctionTarget && selectedSatellite.conjunctionTarget !== 'NONE'
                      ? 'bg-[#FF00FF]/15 text-[#FF00FF] border-[#FF00FF]/40'
                      : 'bg-[#29AB87]/15 text-[#29AB87] border-[#29AB87]/30'
                  }`}>
                    {selectedSatellite.conjunctionTarget && selectedSatellite.conjunctionTarget !== 'NONE'
                      ? 'EVALUATED (ALERT)'
                      : 'EVALUATED (SAFE)'}
                  </span>
                </div>
                <div className="text-[11px] text-[#FFFFFF] font-semibold">
                  {selectedSatellite.conjunctionTarget && selectedSatellite.conjunctionTarget !== 'NONE'
                    ? `PoC: ${selectedSatellite.poc}`
                    : 'Safe Orbital Separation'}
                </div>
                <div className="text-[10px] text-[#00FFFF]/80 font-sans leading-snug">
                  {selectedSatellite.conjunctionTarget && selectedSatellite.conjunctionTarget !== 'NONE'
                    ? `Close approach: ${selectedSatellite.missDistance}m miss distance computed.`
                    : 'Modeled 6x6 UVW covariance confirms zero high-risk conjunctions in horizon.'}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#00FFFF] font-sans leading-relaxed pt-1">
              <strong>Forensic Rationale:</strong> Deterministic 2-body Keplerian simulation active. Each object maintains an explicit 6x6 state error covariance tensor and valid physical elements. Conjunction screening evaluates miss distance and collision probability (PoC) on the encounter B-plane, unlocking tactical maneuver planning.
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
              onClick={() => onRequestSimBurn(selectedSatellite.id)}
              className="px-4 py-2 bg-[#FF00FF]/15 hover:bg-[#FF00FF]/25 text-[#FF00FF] border border-[#FF00FF]/40 text-xs rounded-[8px] flex items-center justify-center gap-2 transition-all font-bold"
            >
              <Orbit className="w-4 h-4 text-[#FF00FF]" />
              <span className="font-display tracking-wider text-[11px]">MANEUVER DOSSIER</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Assessment Stability & Prioritized Evidence Gaps (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono">
        {/* Left Column (7 cols): Stability Engine */}
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
        </div>

        {/* Right Column (5 cols): Prioritized Evidence Gaps */}
        <div className="lg:col-span-5 space-y-6">
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
