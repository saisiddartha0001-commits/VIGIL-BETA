import React, { useState } from 'react';
import { OrbitalObject } from '../../types/vigil';

interface OrbitSchematicProps {
  satellites: OrbitalObject[];
  selectedSatellite: OrbitalObject | null;
  onSelectSatellite: (sat: OrbitalObject) => void;
  onRequestBurn?: (satId: string) => void;
  className?: string;
}

export const OrbitSchematic: React.FC<OrbitSchematicProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  className = '',
}) => {
  // Use first satellite as default if none selected
  const displaySatellite = selectedSatellite || (satellites.length > 0 ? satellites[0] : null);
  const [hoveredSatId, setHoveredSatId] = useState<string | null>(null);

  // SVG coordinate system
  const size = 520;
  const center = size / 2;
  const maxRadius = size * 0.45;

  // Orbital Regime radii (proportional for visual clarity)
  const leoRadius = maxRadius * 0.38;
  const meoRadius = maxRadius * 0.68;
  const geoRadius = maxRadius * 0.92;

  // Find conjunction pairing for selected satellite if any
  const conjunctionPartner = displaySatellite ? satellites.find(
    (s) => s.id === displaySatellite.conjunctionTarget || s.conjunctionTarget === displaySatellite.name
  ) : null;

  return (
    <div className={`relative flex flex-col items-center select-none font-mono ${className}`}>
      {/* Top Legend Bar */}
      <div className="w-full flex flex-wrap items-center justify-between pb-2 border-b border-[rgba(0,255,255,0.2)] text-xs mb-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping" />
          <span className="text-xs font-semibold text-[#00FFFF] uppercase tracking-wider font-display">
            POLAR ORBIT PROJECTION (EQUATORIAL PLANE)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#00FFFF]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#29AB87]" /> NOMINAL
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF4500]" /> ELEVATED
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF00FF] animate-pulse" /> CRITICAL CONJUNCTION
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-square max-w-[480px] bg-[#030408] rounded-[8px] border border-[rgba(0,255,255,0.3)] bg-radar-grid flex items-center justify-center overflow-hidden p-2 shadow-[0_0_25px_rgba(0,255,255,0.15)]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
        >
          <defs>
            {/* Cyber-Tribal Earth Atmosphere */}
            <radialGradient id="earthAtmosphere" cx="50%" cy="50%" r="50%">
              <stop offset="40%" stopColor="#090d1f" />
              <stop offset="85%" stopColor="#4B0082" />
              <stop offset="100%" stopColor="#00FFFF" stopOpacity="0.7" />
            </radialGradient>

            {/* Critical threat pulse */}
            <radialGradient id="threatPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF00FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF00FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Crosshair coordinate axes */}
          <line
            x1={center}
            y1={15}
            x2={center}
            y2={size - 15}
            stroke="rgba(91, 160, 190, 0.15)"
            strokeDasharray="4 4"
          />
          <line
            x1={15}
            y1={center}
            x2={size - 15}
            y2={center}
            stroke="rgba(91, 160, 190, 0.15)"
            strokeDasharray="4 4"
          />

          {/* Orbit Regime Rings with Cyber-Tribal Geometries */}
          {/* LEO Ring */}
          <circle
            cx={center}
            cy={center}
            r={leoRadius}
            fill="none"
            stroke="rgba(0, 255, 255, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={center + leoRadius + 6}
            y={center - 4}
            fill="#00FFFF"
            fontSize="9"
            opacity="0.9"
            fontWeight="bold"
          >
            LEO (500-2,000 km)
          </text>

          {/* MEO Ring */}
          <circle
            cx={center}
            cy={center}
            r={meoRadius}
            fill="none"
            stroke="rgba(191, 0, 255, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={center + meoRadius + 6}
            y={center - 4}
            fill="#BF00FF"
            fontSize="9"
            opacity="0.9"
            fontWeight="bold"
          >
            MEO (20,200 km)
          </text>

          {/* GEO Ring */}
          <circle
            cx={center}
            cy={center}
            r={geoRadius}
            fill="none"
            stroke="rgba(41, 171, 135, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <text
            x={center + geoRadius - 10}
            y={center - 6}
            textAnchor="end"
            fill="#29AB87"
            fontSize="9"
            opacity="0.9"
            fontWeight="bold"
          >
            GEO (35,786 km)
          </text>

          {/* Central Earth Disk */}
          <circle
            cx={center}
            cy={center}
            r={24}
            fill="url(#earthAtmosphere)"
            stroke="#00FFFF"
            strokeWidth="2"
          />
          {/* Earth coordinate lines */}
          <circle
            cx={center}
            cy={center}
            r={14}
            fill="none"
            stroke="rgba(56, 217, 245, 0.3)"
          />
          <line
            x1={center - 24}
            y1={center}
            x2={center + 24}
            y2={center}
            stroke="rgba(56, 217, 245, 0.4)"
          />
          <text
            x={center}
            y={center + 3.5}
            textAnchor="middle"
            fill="#edf4ff"
            fontSize="8"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            EARTH
          </text>

          {/* Conjunction Threat Vector between colliding pairs */}
          {conjunctionPartner && displaySatellite && displaySatellite.riskLevel === 'Critical' && (
            (() => {
              const r1 = maxRadius * displaySatellite.radiusRatio;
              const x1 = center + r1 * Math.cos(displaySatellite.angle);
              const y1 = center + r1 * Math.sin(displaySatellite.angle);

              const r2 = maxRadius * conjunctionPartner.radiusRatio;
              const x2 = center + r2 * Math.cos(conjunctionPartner.angle);
              const y2 = center + r2 * Math.sin(conjunctionPartner.angle);

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g>
                  {/* Cyber Laser Conjunction Threat Vector */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#FF00FF"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-pulse"
                  />
                  <rect
                    x={midX - 35}
                    y={midY - 10}
                    width={70}
                    height={20}
                    rx={6}
                    fill="#030408"
                    stroke="#FF00FF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={midX}
                    y={midY + 3.5}
                    textAnchor="middle"
                    fill="#FF00FF"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono"
                  >
                    Δ {displaySatellite.missDistance}m
                  </text>
                </g>
              );
            })()
          )}

          {/* Satellite Orbit Objects */}
          {satellites.map((sat) => {
            const r = maxRadius * sat.radiusRatio;
            const x = center + r * Math.cos(sat.angle);
            const y = center + r * Math.sin(sat.angle);
            const isSelected = displaySatellite?.id === sat.id;
            const isHovered = hoveredSatId === sat.id;
            const isCritical = sat.riskLevel === 'Critical';

            return (
              <g
                key={sat.id}
                onClick={() => onSelectSatellite(sat)}
                onMouseEnter={() => setHoveredSatId(sat.id)}
                onMouseLeave={() => setHoveredSatId(null)}
                className="cursor-pointer transition-transform"
              >
                {/* Orbit track ring for selected satellite */}
                {isSelected && (
                  <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke={sat.color}
                    strokeWidth="1.2"
                    strokeOpacity="0.4"
                    strokeDasharray="2 4"
                  />
                )}

                {/* Pulsing ring for critical status */}
                {isCritical && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 16 : 12}
                    fill="none"
                    stroke="#ff536b"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Target lock selector ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={14}
                    fill="none"
                    stroke="#38d9f5"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Core node */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : isHovered ? 5.5 : 4}
                  fill={sat.color}
                  stroke="#050914"
                  strokeWidth="1.5"
                />

                {/* Satellite Label */}
                <text
                  x={x + (Math.cos(sat.angle) >= 0 ? 9 : -9)}
                  y={y + (Math.sin(sat.angle) >= 0 ? 11 : -6)}
                  textAnchor={Math.cos(sat.angle) >= 0 ? 'start' : 'end'}
                  fill={isSelected ? '#38d9f5' : isCritical ? '#ff536b' : '#edf4ff'}
                  fontSize={isSelected ? '10' : '8.5'}
                  fontWeight={isSelected || isCritical ? 'bold' : 'normal'}
                >
                  {sat.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Hint */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-[rgba(91,160,190,0.16)] text-[10px] text-[#61738c] mt-2">
        <span>INTERACTIVE: CLICK ANY ORBITAL OBJECT TO INSPECT EVIDENCE</span>
        <span>PROJECTION: 42,164 KM SPAN</span>
      </div>
    </div>
  );
};
