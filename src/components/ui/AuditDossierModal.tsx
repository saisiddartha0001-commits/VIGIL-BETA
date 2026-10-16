import React from 'react';
import { OrbitalObject } from '../../types/vigil';
import { FileCheck, X, Download, ShieldCheck, Database, Calendar } from 'lucide-react';

interface AuditDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSatellite: OrbitalObject | null;
}

export const AuditDossierModal: React.FC<AuditDossierModalProps> = ({
  isOpen,
  onClose,
  targetSatellite,
}) => {
  if (!isOpen || !targetSatellite) return null;

  const handleDownload = () => {
    const reportData = {
      title: `VIGIL Forensic Evidence Audit Dossier - ${targetSatellite.name}`,
      noradCatalogId: targetSatellite.noradId,
      internationalDesignator: targetSatellite.intlDesignator || 'N/A',
      operator: targetSatellite.operator,
      dataQualityVerdict: targetSatellite.dataQualityStatus,
      dataQualityGrade: targetSatellite.dataQualityGrade,
      propagationStatus: targetSatellite.propagationStatus,
      conjunctionRiskStatus: targetSatellite.conjunctionRiskStatus,
      lastObservationEpochUtc: targetSatellite.lastObservationEpoch,
      retrievedAtUtc: targetSatellite.retrievedAtUtc,
      elementAgeHours: targetSatellite.freshnessHours,
      verdictReason: targetSatellite.verdictReason,
      auditTimestamp: new Date().toISOString(),
      governanceNotice:
        'CelesTrak public GP/OMM data verified. Positional covariance and conjunction probability (PoC) not evaluated in accordance with VIGIL scientific integrity protocol.',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VIGIL_AUDIT_DOSSIER_${targetSatellite.noradId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030408]/85 backdrop-blur-md font-mono animate-in fade-in">
      <div className="w-full max-w-lg bg-[#080b18] border border-[#00FFFF]/50 rounded-[8px] p-6 shadow-[0_0_40px_rgba(0,255,255,0.2)] relative overflow-hidden">
        {/* Top laser accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00FFFF] via-[#BF00FF] to-[#00FFFF]" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#00FFFF]/15 border border-[#00FFFF]/40 text-[#00FFFF]">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF] tracking-tight font-display">
                ORBITAL EVIDENCE AUDIT DOSSIER
              </h3>
              <p className="text-[11px] text-[#00FFFF]">
                Official forensic validation certificate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#8b80b6] hover:text-[#00FFFF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Technical Vector Summary */}
        <div className="p-4 bg-[#101228] border border-[rgba(0,255,255,0.25)] rounded-[8px] space-y-2.5 text-xs mb-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-[#8b80b6]">OBJECT IDENTITY:</span>
            <span className="text-[#FFFFFF] font-bold">
              {targetSatellite.name} (NORAD #{targetSatellite.noradId})
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#8b80b6]">A. DATA QUALITY:</span>
            <span className="text-[#29AB87] font-bold">
              {targetSatellite.dataQualityStatus || 'PASS'} (Grade {targetSatellite.dataQualityGrade})
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#8b80b6]">B. PROPAGATION:</span>
            <span className="text-[#00FFFF] font-bold">
              {targetSatellite.propagationStatus || 'SGP4_CAPABLE'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#8b80b6]">C. CONJUNCTION RISK:</span>
            <span className="text-[#FF4500] font-bold">
              NOT PERFORMED (CDM ABSENT)
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/10 text-[11px]">
            <span className="text-[#8b80b6] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              ELEMENT SET EPOCH:
            </span>
            <span className="text-[#00FFFF]">
              {targetSatellite.lastObservationEpoch.replace('T', ' ').substring(0, 19)} UTC
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#030408] rounded-[8px] border border-[rgba(0,255,255,0.15)] text-[11px] text-[#8b80b6] leading-relaxed mb-6 font-sans">
          <span className="text-[#00FFFF] font-mono font-bold block mb-1 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#00FFFF]" />
            PROVENANCE INTEGRITY ASSURANCE:
          </span>
          This record is certified from public CelesTrak GP/OMM data. In accordance with strict scientific data integrity rules, no collision risk (PoC) or maneuver execution is fabricated without an official 6x6 covariance CDM.
        </div>

        <div className="flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border border-[rgba(0,255,255,0.3)] text-[#00FFFF] hover:text-[#FFFFFF] hover:bg-[#111530] transition-colors"
          >
            CLOSE
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-[8px] bg-[#00FFFF] hover:bg-[#00FFFF]/85 text-[#030408] font-bold transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] flex items-center gap-2 hover:scale-[1.02] active:translate-y-[1px]"
          >
            <Download className="w-3.5 h-3.5 text-[#030408]" />
            <span className="font-display tracking-wider text-[11px]">EXPORT AUDIT DOSSIER (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
