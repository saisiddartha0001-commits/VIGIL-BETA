import React, { useState } from 'react';
import { AssessmentScenario } from '../../types/vigil';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SensitivityChart } from '../../components/charts/SensitivityChart';
import {
  FlaskConical,
  Sliders,
  AlertTriangle,
  ArrowRight,
  Scale,
} from 'lucide-react';

interface StabilityLabPageProps {
  scenarios: AssessmentScenario[];
  activeScenario: AssessmentScenario;
  onSelectScenario: (scenario: AssessmentScenario) => void;
  onNavigateToEvidence?: () => void;
}

export const StabilityLabPage: React.FC<StabilityLabPageProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  onNavigateToEvidence,
}) => {
  const [perturbationScale, setPerturbationScale] = useState<number>(1.0); // 1.0x, 1.5x, 2.0x

  // Compute scaled chart data based on user interactive slider
  const scaledScenario: AssessmentScenario = {
    ...activeScenario,
    chartData: activeScenario.chartData.map((pt) => {
      const delta = (pt.perturbedKm - pt.baselineKm) * perturbationScale;
      const upperDelta = (pt.upperUncertaintyKm - pt.baselineKm) * perturbationScale;
      const lowerDelta = (pt.baselineKm - pt.lowerUncertaintyKm) * perturbationScale;
      return {
        ...pt,
        perturbedKm: Math.max(0.01, pt.baselineKm + delta),
        upperUncertaintyKm: Math.max(0.02, pt.baselineKm + upperDelta),
        lowerUncertaintyKm: Math.max(0.005, pt.baselineKm - lowerDelta),
      };
    }),
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <SectionHeader
        title="Stability Lab & Assumption Sensitivity"
        subtitle="Stress-test conjunction assessments against unmodeled drag, solar radiation pressure, and gravity harmonics."
        badge={
          <span className="px-2.5 py-0.5 rounded-[4px] text-xs font-bold bg-[#FF4500]/15 text-[#FF4500] border border-[#FF4500]/40">
            SIMULATION — NOT CALCULATED FROM REAL DATA
          </span>
        }
        actions={
          onNavigateToEvidence && (
            <button
              type="button"
              onClick={onNavigateToEvidence}
              className="px-3.5 py-2 rounded-[8px] bg-[#111530] hover:bg-[#191c40] text-[#00FFFF] border border-[#00FFFF]/40 text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(0,255,255,0.15)]"
            >
              <span>Audit Evidence Gaps</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00FFFF]" />
            </button>
          )
        }
      />

      {/* Explicit Scientific Disclaimer */}
      <div className="p-3.5 bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-[8px] text-xs text-[#00FFFF] leading-relaxed">
        <strong className="text-[#FF4500] font-mono">SIMULATION TESTBED DISCLAIMER:</strong> These sensitivity curves demonstrate how unmodeled exospheric heating, solar radiation pressure cross-sections, and geopotential truncation propagate along-track error. These are parametric stress-test models, not calculations derived from live operational telemetry.
      </div>

      {/* Selectable Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isSelected = sc.id === activeScenario.id;
          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#101c30] border-[#38d9f5] shadow-[0_0_20px_rgba(56,217,245,0.15)] ring-1 ring-[#38d9f5]/50'
                  : 'bg-[#0b1424] border-[rgba(91,160,190,0.18)] hover:border-[rgba(56,217,245,0.35)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(91,160,190,0.15)]">
                  <span className="text-[10px] text-[#61738c] uppercase font-bold tracking-wider">
                    SCENARIO {sc.id.split('-')[1]}
                  </span>
                  <StatusBadge type="stability" value={sc.stabilityRating} size="xs" />
                </div>

                <div className="text-sm font-bold text-[#edf4ff] leading-snug">
                  {sc.shortTag}
                </div>
                <div className="text-xs text-[#91a2b9] font-sans mt-1.5 leading-relaxed line-clamp-2">
                  {sc.description}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-[rgba(91,160,190,0.15)] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#61738c]">PoC Shift:</span>
                <span className="text-[#38d9f5] font-bold text-[11px]">{sc.pocDivergence.split('➔')[1] || 'Stable'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Stress Controls & Sensitivity Sandbox */}
      <Panel
        title={`Active Model: ${activeScenario.name}`}
        subtitle={activeScenario.perturbationModel}
        icon={FlaskConical}
        accent={
          activeScenario.stabilityRating === 'EXTREME_DIVERGENCE'
            ? 'danger'
            : activeScenario.stabilityRating === 'MODERATE_SENSITIVITY'
            ? 'warning'
            : 'cyan'
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-[#101c30] px-3 py-1.5 rounded-lg border border-[rgba(91,160,190,0.2)]">
              <Sliders className="w-3.5 h-3.5 text-[#38d9f5]" />
              <span className="text-[11px] text-[#91a2b9]">Perturbation Scale:</span>
              <span className="text-[#38d9f5] font-bold">{perturbationScale}x</span>
            </div>
            <div className="flex items-center gap-1">
              {[0.5, 1.0, 1.5, 2.0].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setPerturbationScale(scale)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    perturbationScale === scale
                      ? 'bg-[#38d9f5] text-[#050914]'
                      : 'bg-[#101c30] text-[#91a2b9] hover:text-white border border-[rgba(91,160,190,0.2)]'
                  }`}
                >
                  {scale}x
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Main Reactive SVG Sensitivity Chart */}
          <SensitivityChart scenario={scaledScenario} />

          {/* Key Finding Verdict Box */}
          <div className="p-4 bg-[#101c30] rounded-xl border border-[rgba(91,160,190,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-[#edf4ff] tracking-wider uppercase">
                  FORENSIC STABILITY VERDICT:
                </span>
                <StatusBadge type="stability" value={activeScenario.stabilityRating} size="xs" />
              </div>
              <p className="text-xs text-[#91a2b9] font-sans leading-relaxed max-w-3xl">
                {activeScenario.riskVerdict}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-[#61738c] block uppercase">PROJECTED MISS RANGE</span>
              <span className="text-lg font-bold text-[#edf4ff]">
                {(activeScenario.missDistanceRangeKm[0] * 1000).toFixed(0)}m –{' '}
                {(activeScenario.missDistanceRangeKm[1] * 1000).toFixed(0)}m
              </span>
            </div>
          </div>

          {/* Model Parameter Variance Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(91,160,190,0.18)]">
              <span className="text-xs font-semibold text-[#38d9f5] tracking-wider uppercase flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#38d9f5]" />
                SCENARIO PARAMETER SENSITIVITY DELTAS
              </span>
              <span className="text-[10px] text-[#61738c]">
                Baseline vs Perturbed Input Assumptions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-[rgba(91,160,190,0.15)] text-[#61738c] text-[10px]">
                    <th className="pb-2">PHYSICAL PARAMETER</th>
                    <th className="pb-2">BASELINE ASSUMPTION</th>
                    <th className="pb-2">PERTURBED VALUE</th>
                    <th className="pb-2 text-right">MODEL SENSITIVITY DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(91,160,190,0.1)]">
                  {activeScenario.parameters.map((param, idx) => (
                    <tr key={idx} className="hover:bg-[#101c30]/50 transition-colors">
                      <td className="py-2.5 font-bold text-[#edf4ff]">{param.label}</td>
                      <td className="py-2.5 text-[#91a2b9]">{param.baseline}</td>
                      <td className="py-2.5 text-[#38d9f5] font-semibold">{param.perturbed}</td>
                      <td className="py-2.5 text-right font-bold text-amber-400">
                        {param.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};
