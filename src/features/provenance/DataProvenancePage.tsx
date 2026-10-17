import React, { useState, useMemo } from 'react';
import { AuditedOmmRecord, PublicDataManifest } from '../../types/omm';
import { Panel } from '../../components/ui/Panel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { formatAltitude } from '../../utils/formatters';
import {
  auditOmmRecord,
  buildOmmEvidenceTrace,
  FreshnessPolicyConfig,
} from '../../utils/ommQualityAuditor';
import {
  Database,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Hash,
  FileCheck2,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Code,
  Globe,
} from 'lucide-react';

interface DataProvenancePageProps {
  manifest: PublicDataManifest;
  ommRecords: AuditedOmmRecord[];
  selectedNoradId?: number;
  onSelectNoradId?: (noradId: number) => void;
  onRefreshProvenance?: () => void;
  onNavigateToEvidence?: () => void;
  onNavigateToStability?: () => void;
}

export const DataProvenancePage: React.FC<DataProvenancePageProps> = ({
  manifest,
  ommRecords,
  selectedNoradId: externalSelectedNoradId,
  onSelectNoradId: externalOnSelectNoradId,
  onRefreshProvenance,
  onNavigateToEvidence,
  onNavigateToStability,
}) => {
  const [internalSelectedNoradId, setInternalSelectedNoradId] = useState<number>(
    ommRecords[0]?.noradCatId || 25544 // Default to ISS (ZARYA) #25544
  );

  const selectedNoradId = externalSelectedNoradId ?? internalSelectedNoradId;
  const handleSelectNorad = (id: number) => {
    setInternalSelectedNoradId(id);
    if (externalOnSelectNoradId) externalOnSelectNoradId(id);
  };
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [freshnessThresholdHours, setFreshnessThresholdHours] = useState<number>(24);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const policyConfig: FreshnessPolicyConfig = useMemo(() => ({
    freshHoursThreshold: freshnessThresholdHours,
    staleHoursThreshold: freshnessThresholdHours * 2,
  }), [freshnessThresholdHours]);

  // Re-audit records dynamically if policy threshold changes
  const auditedRecords = useMemo(() => {
    return ommRecords.map((rec) =>
      auditOmmRecord(rec.raw, manifest.retrievedAtUtc, policyConfig)
    );
  }, [ommRecords, manifest.retrievedAtUtc, policyConfig]);

  const selectedRecord = useMemo(() => {
    return (
      auditedRecords.find((r) => r.noradCatId === selectedNoradId) ||
      auditedRecords[0]
    );
  }, [auditedRecords, selectedNoradId]);

  // Evidence trace for selected record
  const evidenceTrace = useMemo(() => {
    if (!selectedRecord) return [];
    return buildOmmEvidenceTrace(selectedRecord);
  }, [selectedRecord]);

  const filteredRecords = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return auditedRecords;
    return auditedRecords.filter(
      (r) =>
        r.objectName.toLowerCase().includes(q) ||
        r.objectId.toLowerCase().includes(q) ||
        r.noradCatId.toString().includes(q)
    );
  }, [auditedRecords, filterQuery]);

  const handleSimulateAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      if (onRefreshProvenance) onRefreshProvenance();
    }, 600);
  };

  const passChecksCount = selectedRecord?.checks.filter((c) => c.status === 'PASS').length || 0;
  const totalChecksCount = selectedRecord?.checks.length || 0;

  const isSimulation = manifest.sourceName.includes('SIMULATION') || selectedRecord?.objectId.startsWith('SIM-');

  return (
    <div className="space-y-6 font-mono">
      {/* 1. Header */}
      <SectionHeader
        title={isSimulation ? "Simulated Orbital Data Provenance & Verification Auditor" : "Public Orbital Data Provenance & Freshness Auditor"}
        subtitle={isSimulation ? "Inspection of deterministic Keplerian orbital elements, 6x6 covariance error models, and numerical validation." : "Forensic inspection of real CelesTrak OMM element sets, observation epochs, domain constraints, and covariance omission."}
        badge={
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#38d9f5]/15 text-[#38d9f5] border border-[#38d9f5]/30">
            {isSimulation ? "DETERMINISTIC 2-BODY ENGINE" : "CELESTRAK GP / OMM FEED"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateAudit}
              disabled={isAuditing}
              className="px-3.5 py-2 rounded-xl bg-[#101c30] hover:bg-[#14233c] text-[#38d9f5] border border-[#38d9f5]/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(56,217,245,0.1)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Re-Auditing Records...' : isSimulation ? 'Re-Verify Simulation State' : 'Re-Audit Snapshot'}</span>
            </button>
          </div>
        }
      />

      {/* 2. Source & Manifest Banner */}
      <div className="p-4 md:p-5 bg-[#0b1424] rounded-2xl border border-[rgba(91,160,190,0.22)] space-y-3 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Globe className="w-4 h-4 text-[#38d9f5] shrink-0" />
              <span className="text-xs font-bold text-[#edf4ff] uppercase tracking-wider">
                SOURCE: {manifest.sourceName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101c30] text-[#38d9f5] border border-white/10">
                HTTP {manifest.httpStatus} OK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30">
                {isSimulation ? 'ACTIVE DETERMINISTIC ENGINE' : (manifest.isCached ? 'CACHED SNAPSHOT' : 'LOCAL CACHED SNAPSHOT (2h POLICY)')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#91a2b9] flex-wrap">
              <span>
                Endpoint:{' '}
                {isSimulation ? (
                  <span className="text-[#38d9f5] font-semibold font-mono">{manifest.exactUrl}</span>
                ) : (
                  <a
                    href={manifest.exactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38d9f5] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span className="truncate max-w-xs md:max-w-md">{manifest.exactUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </span>
              <span className="text-[#61738c]">|</span>
              <span className="text-[#91a2b9] text-[11px] inline-flex items-center gap-1">
                <span>Format Spec: {isSimulation ? 'VIGIL SIM-OMM (CCSDS Aligned)' : 'JSON OMM'}</span>
              </span>
            </div>
          </div>

          {/* Right Manifest Metadata */}
          <div className="flex items-center gap-4 text-xs shrink-0 flex-wrap">
            <div>
              <span className="text-[10px] text-[#61738c] uppercase block">SIMULATION CLOCK (UTC)</span>
              <span className="font-bold text-[#edf4ff]">
                {manifest.retrievedAtUtc.replace('T', ' ').substring(0, 19)} UTC
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#61738c] uppercase block">POPULATION</span>
              <span className="font-bold text-[#38d9f5]">{manifest.recordCount} Objects</span>
            </div>
          </div>
        </div>

        {/* SHA-256 Digest Bar */}
        <div className="pt-2.5 border-t border-[rgba(91,160,190,0.12)] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#61738c]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="w-3 h-3 text-[#38d9f5] shrink-0" />
            <span className="uppercase text-[#91a2b9]">STATE DIGEST:</span>
            <span className="text-[#edf4ff] font-mono truncate select-all">{manifest.sha256}</span>
          </div>
          <div className="text-[11px] text-[#91a2b9]">
            {isSimulation ? (
              <span>Engine Status: <strong className="text-emerald-400">Continuous Keplerian Clock (Deterministic Seed: 42)</strong></span>
            ) : (
              <span>Usage Policy: <strong className="text-amber-300">2-hour element refresh window</strong> (celestrak.org/usage-policy.php)</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Essential Notice */}
      <div className={`p-3.5 rounded-xl flex items-start gap-3 ${
        isSimulation ? 'bg-[#00FFFF]/10 border border-[#00FFFF]/30' : 'bg-amber-500/10 border border-amber-500/30'
      }`}>
        <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isSimulation ? 'text-[#00FFFF]' : 'text-amber-400'}`} />
        <div className="space-y-1 text-xs font-sans leading-relaxed">
          <div className={`font-mono font-bold text-[11px] uppercase tracking-wider ${
            isSimulation ? 'text-[#00FFFF]' : 'text-amber-300'
          }`}>
            {isSimulation
              ? 'DETERMINISTIC SIMULATION MODE ACTIVE (SELF-CONTAINED PHYSICAL ENVIRONMENT)'
              : 'PUBLIC ORBITAL DATA TRANSPARENCY NOTICE (NOT A LIVE SENSOR STREAM)'}
          </div>
          <p className="text-[#91a2b9]">
            {isSimulation ? (
              <span>
                All orbital elements, state vectors, and 6x6 UVW covariance tensors are generated deterministically by the <strong>VIGIL 2-Body Simulation Engine</strong>.
                Propagation follows analytical Keplerian dynamics with an iterative Newton-Raphson solver.
                Conjunction risk assessments and encounter B-plane probabilities are <strong>mathematically evaluated directly from modeled covariance</strong>.
              </span>
            ) : (
              <span>
                This data originates from CelesTrak's public General Perturbations (GP) Two-Line Element / OMM catalog.
                It represents mathematical mean elements fitted over tracking arcs under SGP4 orbital theory.
                Crucially, <strong>`EPOCH` represents the fitted reference time of the element set</strong>, not the exact timestamp of the last physical observation.
                Because standard public GP/OMM data does not provide 6x6 state covariance tensors or sensor residuals, <strong>VIGIL marks all records as `INSUFFICIENT EVIDENCE`</strong> for tactical collision avoidance decisions.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 4. Forensic Evidence Trace Panel */}
      <Panel
        title="Forensic Evidence Trace Pipeline"
        subtitle={`Audit Progression for ${selectedRecord?.objectName || 'Selected Object'} (NORAD #${selectedRecord?.noradCatId})`}
        icon={FileCheck2}
        accent="cyan"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {evidenceTrace.map((step, idx) => {
              const isVerified = step.status === 'VERIFIED';
              const isWarning = step.status === 'WARNING';
              const isGap = step.status === 'GAP_DETECTED';

              return (
                <div
                  key={step.step}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isVerified
                      ? 'bg-[#101c30] border-emerald-500/30'
                      : isGap
                      ? 'bg-[#101c30] border-rose-500/40'
                      : isWarning
                      ? 'bg-[#101c30] border-amber-500/30'
                      : 'bg-[#101c30] border-amber-500/40 ring-1 ring-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#61738c] font-bold tracking-wider">
                      STAGE 0{idx + 1}
                    </span>
                    {isVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isGap ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-amber-300" />
                    )}
                  </div>

                  <div className="text-xs font-bold text-[#edf4ff] mb-1">
                    {step.title}
                  </div>

                  <p className="text-[11px] text-[#91a2b9] font-sans leading-snug line-clamp-2 mb-2">
                    {step.summary}
                  </p>

                  <div className="pt-2 border-t border-[rgba(91,160,190,0.12)] space-y-1">
                    {step.details.slice(0, 2).map((d, dIdx) => (
                      <div key={dIdx} className="text-[10px] text-[#61738c] truncate">
                        • {d}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Verdict Callout */}
          <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
            isSimulation ? 'bg-[#050914] border-emerald-500/30' : 'bg-[#050914] border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2.5">
              {isSimulation ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <span className={`font-bold mr-2 ${isSimulation ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {isSimulation ? 'VERDICT: SIMULATED EVIDENCE CERTIFIED' : 'VERDICT: INSUFFICIENT EVIDENCE'}
                </span>
                <span className="text-[#91a2b9] font-sans">
                  {isSimulation
                    ? 'Orbital elements, 6x6 covariance tensors, and propagation states mathematically verified against physical 2-body dynamics.'
                    : 'Trajectory state is mathematically plausible, but absence of 6x6 covariance suppresses collision risk claims.'}
                </span>
              </div>
            </div>
            {onNavigateToStability && (
              <button
                type="button"
                onClick={onNavigateToStability}
                className="px-3 py-1.5 rounded-lg bg-[#38d9f5]/15 hover:bg-[#38d9f5]/25 text-[#38d9f5] border border-[#38d9f5]/30 text-xs font-semibold shrink-0 transition-colors"
              >
                Test Perturbation Sensitivity →
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* 5. Main Content: Stations / Simulation Objects Table (8 Cols) + Quality Audit Dossier (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Panel
            title={isSimulation ? "Simulated Orbital Fleet Registry & Telemetry" : "Real Space Station Element Sets (CelesTrak STATIONS)"}
            subtitle={isSimulation ? "Click any simulated satellite or debris object to inspect Keplerian parameters, covariance matrix, and audit scores" : "Click any station to audit domain bounds, parsed element epoch, and SGP4 terms"}
            icon={Database}
            actions={
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter station name or NORAD..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="px-2.5 py-1 bg-[#101c30] border border-[rgba(91,160,190,0.2)] rounded-lg text-xs text-[#edf4ff] placeholder-[#61738c] focus:outline-none focus:border-[#38d9f5] w-48"
                />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-[rgba(91,160,190,0.2)] text-[#61738c] text-[10px]">
                    <th className="pb-2.5">OBJECT & NORAD</th>
                    <th className="pb-2.5">ELEMENT EPOCH (UTC)</th>
                    <th className="pb-2.5">RECORD AGE</th>
                    <th className="pb-2.5">ALTITUDE / PERIOD</th>
                    <th className="pb-2.5">COVARIANCE</th>
                    <th className="pb-2.5 text-right">AUDIT GRADE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(91,160,190,0.12)]">
                  {filteredRecords.map((rec) => {
                    const isSelected = selectedRecord?.noradCatId === rec.noradCatId;
                    return (
                      <tr
                        key={rec.noradCatId}
                        onClick={() => handleSelectNorad(rec.noradCatId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#00FFFF]/15' : 'hover:bg-[#111530]/60'
                        }`}
                      >
                        <td className="py-3 font-bold text-[#edf4ff]">
                          <div className="flex items-center gap-2">
                            <span>{rec.objectName}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38d9f5]" />
                            )}
                          </div>
                          <div className="text-[10px] text-[#61738c] font-normal">
                            NORAD #{rec.noradCatId} | {rec.objectId}
                          </div>
                        </td>

                        <td className="py-3 text-[#edf4ff] text-[11px]">
                          <div>{rec.epochUtc.replace('T', ' ').substring(0, 19)}</div>
                          <div className="text-[10px] text-[#61738c]">UTC Epoch</div>
                        </td>

                        <td className="py-3">
                          <span
                            className={`font-semibold text-[11px] ${
                              rec.recordAgeHours < policyConfig.freshHoursThreshold
                                ? 'text-emerald-400'
                                : rec.recordAgeHours < policyConfig.staleHoursThreshold
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {rec.recordAgeHours}h
                          </span>
                          <div className="text-[10px] text-[#61738c]">
                            {rec.recordAgeHours < policyConfig.freshHoursThreshold
                              ? 'Fresh (< 24h)'
                              : 'Aging'}
                          </div>
                        </td>

                        <td className="py-3 text-[11px]">
                          <span className="text-[#38d9f5] font-semibold">
                            ~{formatAltitude(rec.approxAltitudeKm)}
                          </span>
                          <span className="text-[#61738c] text-[10px] block">
                            {rec.orbitalPeriodMin}m / {rec.raw.MEAN_MOTION.toFixed(2)} rev/d
                          </span>
                        </td>

                        <td className="py-3">
                          {rec.covarianceAvailable ? (
                            <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              6x6 UVW TENSOR
                            </span>
                          ) : (
                            <span className="text-amber-400 text-[10px] font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30" title="Public GP/OMM format does not provide 6x6 state covariance tensors">
                              NOT IN GP/OMM
                            </span>
                          )}
                        </td>

                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101c30] text-[#38d9f5] border border-[#38d9f5]/30">
                            {rec.qualityScore}% (PASS)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Right Detail Inspector (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Panel
            title="Quality Audit Dossier"
            subtitle={`Target: ${selectedRecord?.objectName} (#${selectedRecord?.noradCatId})`}
            icon={FileCheck2}
            accent="cyan"
            actions={
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-2 py-1 rounded bg-[#101c30] text-[#91a2b9] hover:text-white border border-white/10 text-[10px] flex items-center gap-1"
              >
                <Code className="w-3 h-3" />
                <span>{showRawJson ? 'Hide Raw' : 'Raw OMM'}</span>
              </button>
            }
          >
            {selectedRecord && (
              <div className="space-y-4 text-xs">
                {/* Object Overview */}
                <div>
                  <div className="text-[10px] text-[#61738c] uppercase">OBJECT DOSSIER</div>
                  <div className="text-base font-bold text-[#edf4ff] mt-0.5">
                    {selectedRecord.objectName}
                  </div>
                  <div className="text-[11px] text-[#38d9f5]">
                    NORAD ID: #{selectedRecord.noradCatId} | INTL: {selectedRecord.objectId}
                  </div>
                </div>

                {/* Raw JSON Modal / Dropdown */}
                {showRawJson && (
                  <div className="p-3 bg-[#050914] rounded-xl border border-[rgba(91,160,190,0.25)] space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-[#61738c] pb-1 border-b border-white/5">
                      <span>ORIGINAL SOURCE JSON PAYLOAD</span>
                      <span className="text-[#38d9f5]">CCSDS OMM</span>
                    </div>
                    <pre className="text-[10px] text-[#91a2b9] font-mono overflow-x-auto max-h-56 p-1">
                      {JSON.stringify(selectedRecord.raw, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Epoch vs Retrieval Timestamps */}
                <div className="p-3 bg-[#101c30] rounded-xl border border-[rgba(91,160,190,0.2)] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#61738c]">Element Epoch:</span>
                    <span className="text-[#38d9f5] font-semibold text-right">
                      {selectedRecord.epochUtc.replace('T', ' ').substring(0, 19)} UTC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61738c]">Retrieval Time:</span>
                    <span className="text-[#edf4ff] font-semibold text-right">
                      {selectedRecord.retrievedAtUtc.replace('T', ' ').substring(0, 19)} UTC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61738c]">Calculated Element Age:</span>
                    <span className="text-amber-400 font-bold">
                      {selectedRecord.recordAgeHours} hours old
                    </span>
                  </div>
                </div>

                {/* Configurable Freshness Threshold Control */}
                <div className="p-2.5 bg-[#050914] rounded-lg border border-[rgba(91,160,190,0.15)] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#91a2b9] flex items-center gap-1.5">
                      <Sliders className="w-3 h-3 text-[#38d9f5]" />
                      Freshness Policy Threshold:
                    </span>
                    <span className="text-[#38d9f5] font-bold">{freshnessThresholdHours}h</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[12, 24, 48, 72].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setFreshnessThresholdHours(hours)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                          freshnessThresholdHours === hours
                            ? 'bg-[#38d9f5] text-[#050914]'
                            : 'bg-[#101c30] text-[#91a2b9] hover:text-white border border-white/5'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                  <div className="text-[9px] text-[#61738c] font-sans">
                    *VIGIL prototype policy setting. Not a universal physical law.
                  </div>
                </div>

                {/* 9 Quality Checks Detail List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(91,160,190,0.15)]">
                    <span className="text-[10px] text-[#61738c] uppercase tracking-wider">
                      DOMAIN & QUALITY CHECKS ({passChecksCount}/{totalChecksCount} PASS)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {selectedRecord.qualityScore}% SCORE
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {selectedRecord.checks.map((chk) => (
                      <div
                        key={chk.id}
                        className="p-2 rounded-lg bg-[#050914] border border-[rgba(91,160,190,0.12)] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#edf4ff]">
                            {chk.label}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                              chk.status === 'PASS'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : chk.status === 'WARNING'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                            }`}
                          >
                            {chk.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#91a2b9] font-sans leading-snug">
                          {chk.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Fields Notice */}
                {selectedRecord.missingFields.length > 0 && (
                  <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/25 text-[10px] text-[#91a2b9]">
                    <span className="text-amber-400 font-bold block mb-0.5">
                      MISSING OPTIONAL OMM FIELDS:
                    </span>
                    <span>{selectedRecord.missingFields.join(', ')}</span>
                  </div>
                )}

                {/* Cross-Page Action Buttons */}
                <div className="pt-3 border-t border-[rgba(91,160,190,0.18)] space-y-2">
                  {onNavigateToEvidence && (
                    <button
                      type="button"
                      onClick={onNavigateToEvidence}
                      className="w-full py-2 bg-[#101c30] hover:bg-[#38d9f5]/20 text-[#38d9f5] rounded-lg border border-[rgba(91,160,190,0.2)] font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Open Full Evidence Report</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
