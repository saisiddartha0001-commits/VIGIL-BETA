import React, { useState } from 'react';
import { EvidenceTraceStep } from '../../types/vigil';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface EvidenceTraceDiagramProps {
  steps: EvidenceTraceStep[];
  onNavigateToStage?: (stage: string) => void;
  className?: string;
}

export const EvidenceTraceDiagram: React.FC<EvidenceTraceDiagramProps> = ({
  steps,
  onNavigateToStage,
  className = '',
}) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(1); // Default to VALIDATION (where the gaps are)

  const activeStep = steps[selectedStepIndex] || steps[0];

  const getStatusIcon = (status: EvidenceTraceStep['status']) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'GAP_DETECTED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'UNRESOLVED':
        return <HelpCircle className="w-4 h-4 text-amber-300" />;
    }
  };

  const getStatusBadge = (status: EvidenceTraceStep['status']) => {
    switch (status) {
      case 'VERIFIED':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
      case 'GAP_DETECTED':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
      case 'WARNING':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
      case 'UNRESOLVED':
        return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
    }
  };

  return (
    <div className={`space-y-4 font-mono ${className}`}>
      {/* 4-Step Pipeline Flow Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((s, index) => {
          const isSelected = selectedStepIndex === index;
          const statusBadge = getStatusBadge(s.status);

          return (
            <div
              key={s.step}
              onClick={() => setSelectedStepIndex(index)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-[#101c30] border-[#38d9f5] shadow-[0_0_15px_rgba(56,217,245,0.15)] ring-1 ring-[#38d9f5]/50'
                  : 'bg-[#0b1424] border-[rgba(91,160,190,0.18)] hover:border-[rgba(56,217,245,0.35)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#91a2b9] font-bold tracking-wider">
                  STAGE 0{index + 1} // {s.step}
                </span>
                {getStatusIcon(s.status)}
              </div>

              <div className="text-xs font-bold text-[#edf4ff] truncate mb-2">
                {s.title}
              </div>

              {/* Confidence Score Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#61738c]">
                  <span>Evidence Integrity</span>
                  <span className="text-[#edf4ff] font-bold">{s.confidenceScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#050914] rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full transition-all rounded-full ${
                      s.confidenceScore >= 80
                        ? 'bg-emerald-400'
                        : s.confidenceScore >= 50
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${s.confidenceScore}%` }}
                  />
                </div>
              </div>

              <div className="mt-2.5">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusBadge}`}
                >
                  {s.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Detail Drawer */}
      {activeStep && (
        <div className="p-4 bg-[#101c30]/90 rounded-xl border border-[rgba(91,160,190,0.25)] flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#38d9f5]/15 text-[#38d9f5] border border-[#38d9f5]/30 text-[10px] font-bold">
                STAGE {selectedStepIndex + 1}: {activeStep.step}
              </span>
              <span className="text-sm font-bold text-[#edf4ff]">
                {activeStep.title}
              </span>
            </div>

            <p className="text-xs text-[#91a2b9] font-sans leading-relaxed">
              {activeStep.summary}
            </p>

            <div className="pt-2 border-t border-[rgba(91,160,190,0.15)] space-y-1.5">
              <span className="text-[10px] text-[#61738c] uppercase tracking-wider block">
                AUDIT FINDINGS & CRITERIA:
              </span>
              <ul className="space-y-1 text-xs text-[#edf4ff]">
                {activeStep.details.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#38d9f5] text-[10px] mt-0.5">❯</span>
                    <span className="text-[11px] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Direct Navigation Action */}
          {onNavigateToStage && (
            <div className="shrink-0 flex flex-col justify-end pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => onNavigateToStage(activeStep.step.toLowerCase())}
                className="px-3.5 py-2 rounded-lg bg-[#38d9f5]/15 hover:bg-[#38d9f5]/25 text-[#38d9f5] border border-[#38d9f5]/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(56,217,245,0.1)]"
              >
                <span>Drill Down into {activeStep.step}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
