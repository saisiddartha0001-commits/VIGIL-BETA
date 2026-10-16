import React, { useState } from 'react';
import { EvidenceGap, AuditEvent, OrbitalObject } from '../../types/vigil';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import {
  AlertTriangle,
  ShieldX,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Radio,
  ExternalLink,
  ShieldCheck,
  Database,
} from 'lucide-react';

interface EvidenceReportPageProps {
  evidenceGaps: EvidenceGap[];
  auditLogs: AuditEvent[];
  selectedSatellite?: OrbitalObject;
  selectedGapId?: string;
  onNavigateToStability?: () => void;
  onNavigateToProvenance?: () => void;
  onTaskSensor?: (gapId: string) => void;
}

export const EvidenceReportPage: React.FC<EvidenceReportPageProps> = ({
  evidenceGaps,
  auditLogs,
  selectedSatellite,
  selectedGapId,
  onNavigateToStability,
  onNavigateToProvenance,
  onTaskSensor,
}) => {
  const [expandedGapIds, setExpandedGapIds] = useState<string[]>(() => {
    return selectedGapId ? [selectedGapId] : [evidenceGaps[0]?.id || ''];
  });

  // Ensure deep-linked gap expands when selectedGapId changes
  React.useEffect(() => {
    if (selectedGapId && !expandedGapIds.includes(selectedGapId)) {
      setExpandedGapIds((prev) => [...prev, selectedGapId]);
    }
  }, [selectedGapId]);

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [taskedGaps, setTaskedGaps] = useState<Record<string, boolean>>({});

  const toggleExpand = (gapId: string) => {
    setExpandedGapIds((prev) =>
      prev.includes(gapId) ? prev.filter((id) => id !== gapId) : [...prev, gapId]
    );
  };

  const handleSimulateTasking = (gapId: string) => {
    setTaskedGaps((prev) => ({ ...prev, [gapId]: true }));
    if (onTaskSensor) onTaskSensor(gapId);
  };

  const filteredGaps = evidenceGaps.filter((gap) => {
    if (filterSeverity === 'ALL') return true;
    return gap.severity === filterSeverity;
  });

  const criticalCount = evidenceGaps.filter((g) => g.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <SectionHeader
        title="Evidence Quality & Uncertainty Audit Report"
        subtitle="Rigorous verification dossier identifying ungrounded assumptions, observation latencies, and maneuver blockers."
        badge={
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {selectedSatellite ? `TARGET: ${selectedSatellite.name} (NORAD #${selectedSatellite.noradId})` : 'FLEET AUDIT DOSSIER'}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {onNavigateToProvenance && (
              <button
                type="button"
                onClick={onNavigateToProvenance}
                className="px-3 py-1.5 rounded-lg bg-[#101c30] hover:bg-[#14233c] text-[#38d9f5] border border-[#38d9f5]/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Sensor Lineage</span>
              </button>
            )}
            <span className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2">
              <ShieldX className="w-4 h-4 text-rose-400" />
              <span>MANEUVER APPROVAL: BLOCKED</span>
            </span>
          </div>
        }
      />

      {/* Forensic Verdict Header Banner */}
      <div className="p-5 bg-gradient-to-r from-[#080b18] via-[#101228] to-[#080b18] rounded-[8px] border border-[#FF4500]/50 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <AlertTriangle className="w-5 h-5 text-[#FF4500]" />
              <span className="text-base font-bold text-[#FFFFFF] font-display uppercase tracking-wider">
                AUDIT FINDING: CDM NOT SUPPLIED • COLLISION RISK NOT EVALUATED
              </span>
            </div>
            <p className="text-xs text-[#00FFFF] font-sans leading-relaxed">
              Public CelesTrak General Perturbations (GP/OMM) records provide mean Keplerian elements fitted under SGP4 theory.
              <strong> Conjunction-specific inputs, Conjunction Data Messages (CDMs), and 6x6 state covariance tensors are ABSENT</strong> in public ephemeris catalogs.
              Without covariance error bounds and cross-correlated sensor passes, numerical collision probability cannot be mathematically certified.
              Collision-risk assessments are strictly suppressed rather than guessed with synthetic probabilities.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3 bg-[#030408] rounded-[8px] border border-[rgba(0,255,255,0.25)] text-center">
              <span className="text-[10px] text-[#8b80b6] uppercase block">COLLISION RISK (PoC)</span>
              <span className="text-xs font-bold text-[#00FFFF] block mt-1">NOT EVALUATED</span>
            </div>
            <div className="p-3 bg-[#030408] rounded-[8px] border border-[#FF00FF]/40 text-center">
              <span className="text-[10px] text-[#FF00FF] uppercase block">EVIDENCE GAPS</span>
              <span className="text-xl font-bold text-[#FF00FF]">{criticalCount} Flagged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-[rgba(91,160,190,0.15)]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#61738c] uppercase">FILTER BY SEVERITY:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'INFORMATIONAL'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterSeverity === sev
                  ? 'bg-[#38d9f5] text-[#050914]'
                  : 'bg-[#101c30] text-[#91a2b9] hover:text-white border border-[rgba(91,160,190,0.2)]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#61738c]">
          Showing {filteredGaps.length} of {evidenceGaps.length} documented evidence gaps
        </div>
      </div>

      {/* Evidence Gaps Detailed List */}
      <div className="space-y-4">
        {filteredGaps.map((gap) => {
          const isExpanded = expandedGapIds.includes(gap.id);
          const isTasked = taskedGaps[gap.id];

          return (
            <div
              key={gap.id}
              className={`rounded-xl border transition-all ${
                gap.severity === 'CRITICAL'
                  ? 'bg-[#0b1424] border-rose-500/40'
                  : gap.severity === 'WARNING'
                  ? 'bg-[#0b1424] border-amber-500/30'
                  : 'bg-[#0b1424] border-[rgba(91,160,190,0.2)]'
              }`}
            >
              {/* Gap Header Bar */}
              <div
                onClick={() => toggleExpand(gap.id)}
                className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-[#101c30]/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge type="severity" value={gap.severity} size="sm" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#edf4ff]">
                        {gap.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#101c30] text-[#38d9f5] border border-white/10">
                        {gap.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#61738c] mt-0.5">
                      Affected Objects: <strong className="text-[#91a2b9]">{gap.affectedObjects.join(', ')}</strong> | Detected: {gap.detectionTimestamp.replace('T', ' ').substring(0, 16)} UTC
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isTasked ? (
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tasking Queued</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#101c30] text-[#91a2b9] border border-white/10 text-[10px]">
                      STATUS: {gap.status}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#91a2b9]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#91a2b9]" />
                  )}
                </div>
              </div>

              {/* Expanded Detail Body */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-2 border-t border-[rgba(91,160,190,0.15)] space-y-4 text-xs font-sans">
                  {/* Detailed Description */}
                  <div>
                    <span className="font-mono text-[10px] text-[#61738c] uppercase tracking-wider block mb-1">
                      TECHNICAL DESCRIPTION & ANOMALY:
                    </span>
                    <p className="text-[#edf4ff] leading-relaxed">
                      {gap.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                    {/* Why It Matters */}
                    <div className="p-3.5 bg-[#101c30] rounded-xl border border-[rgba(91,160,190,0.2)] space-y-1.5">
                      <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        WHY IT MATTERS TO FLIGHT SAFETY:
                      </span>
                      <p className="text-xs text-[#91a2b9] font-sans leading-relaxed">
                        {gap.whyItMatters}
                      </p>
                    </div>

                    {/* Recommended Action */}
                    <div className="p-3.5 bg-[#101c30] rounded-xl border border-[rgba(91,160,190,0.2)] space-y-1.5">
                      <span className="text-[10px] text-[#38d9f5] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#38d9f5]" />
                        MANDATED FORENSIC REMEDIATION:
                      </span>
                      <p className="text-xs text-[#91a2b9] font-sans leading-relaxed">
                        {gap.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Impact on Verdict & Interactive Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[rgba(91,160,190,0.15)] font-mono">
                    <div className="text-[11px] text-[#91a2b9]">
                      <span className="text-[#61738c]">VERDICT IMPACT:</span>{' '}
                      <strong className="text-rose-400">{gap.impactOnVerdict}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isTasked && (
                        <button
                          type="button"
                          onClick={() => handleSimulateTasking(gap.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#38d9f5]/15 hover:bg-[#38d9f5]/25 text-[#38d9f5] border border-[#38d9f5]/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Simulate Radar Tasking</span>
                        </button>
                      )}
                      {onNavigateToStability && (
                        <button
                          type="button"
                          onClick={onNavigateToStability}
                          className="px-3 py-1.5 rounded-lg bg-[#101c30] hover:bg-[#14233c] text-[#91a2b9] hover:text-white border border-[rgba(91,160,190,0.2)] text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <span>Test in Stability Lab</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assumptions & Scientific Limitations Card */}
      <Panel
        title="Scientific Honesty & Explicit Modeling Limitations"
        subtitle="Foundational assumptions governing current VIGIL calculations"
        icon={FileText}
        accent="cyan"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed">
          <div className="space-y-2 p-3.5 bg-[#101c30] rounded-xl border border-[rgba(91,160,190,0.18)]">
            <h4 className="font-mono text-xs font-bold text-[#38d9f5] uppercase">
              1. Propagator Assumptions & Scope
            </h4>
            <p className="text-[#91a2b9]">
              Standard Two-Line Element (TLE) sets use simplified general perturbations (SGP4) which only model mean elements. 
              SGP4 ignores third-body lunar-solar resonances, short-period tesseral harmonics, and rapid thermospheric density expansions caused by coronal mass ejections.
            </p>
          </div>

          <div className="space-y-2 p-3.5 bg-[#101c30] rounded-xl border border-[rgba(91,160,190,0.18)]">
            <h4 className="font-mono text-xs font-bold text-[#38d9f5] uppercase">
              2. Synthetic Data Transparency
            </h4>
            <p className="text-[#91a2b9]">
              All records presented in this hackathon research prototype are simulated synthetic representations.
              No live spacecraft RF command channels are accessible, and no actual orbital maneuvers are authorized.
              VIGIL serves as an evidence verification framework to prevent false-alarm propellant expenditure.
            </p>
          </div>
        </div>
      </Panel>

      {/* Audit Log Stream */}
      <Panel
        title="Chronological Audit Event Log"
        subtitle="Cryptographically logged operator actions and forensic validation flags"
        icon={Clock}
      >
        <div className="space-y-2 font-mono text-xs">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-[#050914] border border-[rgba(91,160,190,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[#38d9f5] text-[10px] font-bold">
                  {log.timestampUtc}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#101c30] text-[#91a2b9] text-[10px] border border-white/10">
                  {log.category}
                </span>
                <span className="font-bold text-[#edf4ff] text-[11px]">
                  {log.action}
                </span>
              </div>
              <div className="text-[11px] text-[#91a2b9] font-sans truncate max-w-xl">
                {log.details}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};
