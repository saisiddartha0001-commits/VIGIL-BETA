import React from 'react';
import { OrbitalObject } from '../../types/vigil';
import { Flame, X } from 'lucide-react';

interface ManeuverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetSatellite: OrbitalObject | null;
}

export const ManeuverModal: React.FC<ManeuverModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetSatellite,
}) => {
  if (!isOpen || !targetSatellite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030408]/85 backdrop-blur-md font-mono animate-in fade-in">
      <div className="w-full max-w-md bg-[#080b18] border border-[#FF00FF]/50 rounded-[8px] p-6 shadow-[0_0_40px_rgba(255,0,255,0.25)] relative overflow-hidden">
        {/* Top laser accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF00FF] via-[#FF4500] to-[#00FFFF]" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#FF00FF]/15 border border-[#FF00FF]/40 text-[#FF00FF]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FFFFFF] tracking-tight font-display">
                AUTHORIZE SIMULATED ΔV BURN
              </h3>
              <p className="text-[11px] text-[#00FFFF]">
                Collision avoidance vector simulation
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
        <div className="p-3.5 bg-[#101228] border border-[rgba(0,255,255,0.25)] rounded-[8px] space-y-2 text-xs mb-4">
          <div className="flex justify-between">
            <span className="text-[#8b80b6]">TARGET ASSET:</span>
            <span className="text-[#FFFFFF] font-bold">{targetSatellite.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b80b6]">CONJUNCTION THREAT:</span>
            <span className="text-[#FF00FF] font-bold">{targetSatellite.conjunctionTarget}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b80b6]">MODELED THRUST DELTA:</span>
            <span className="text-[#00FFFF] font-bold">+2.40 m/s (Prograde Vector)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b80b6]">POST-BURN MISS DISTANCE:</span>
            <span className="text-[#29AB87] font-bold">&gt; 5,380 meters</span>
          </div>
        </div>

        <div className="p-2.5 bg-[#FF4500]/15 rounded-[8px] border border-[#FF4500]/40 text-[11px] text-[#00FFFF] leading-relaxed mb-6 font-sans">
          <span className="text-[#FF4500] font-mono font-bold block mb-0.5">
            ACADEMIC RESEARCH DISCLAIMER:
          </span>
          This is an illustrative simulation testbed. No real spacecraft command transmitters or live telemetry links are active.
        </div>

        <div className="flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border border-[rgba(0,255,255,0.3)] text-[#00FFFF] hover:text-[#FFFFFF] hover:bg-[#111530] transition-colors"
          >
            ABORT
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-[8px] bg-[#00FFFF] hover:bg-[#00FFFF]/85 text-[#030408] font-bold transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] flex items-center gap-2 hover:scale-[1.02] active:translate-y-[1px]"
          >
            <Flame className="w-3.5 h-3.5 text-[#030408]" />
            <span className="font-display tracking-wider text-[11px]">CONFIRM SIMULATED BURN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
