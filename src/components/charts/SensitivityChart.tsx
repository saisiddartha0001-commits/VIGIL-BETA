import React, { useState } from 'react';
import { AssessmentScenario, SensitivityDataPoint } from '../../types/vigil';

interface SensitivityChartProps {
  scenario: AssessmentScenario;
  onHoverPoint?: (point: SensitivityDataPoint | null) => void;
}

export const SensitivityChart: React.FC<SensitivityChartProps> = ({
  scenario,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = scenario.chartData;
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-[#61738c]">
        NO SCENARIO DATA AVAILABLE
      </div>
    );
  }

  // Chart layout dimensions
  const width = 760;
  const height = 320;
  const margin = { top: 25, right: 35, bottom: 40, left: 55 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Max values for scale
  const maxTime = Math.max(...data.map((d) => d.timeOffsetHours));
  const maxKm = Math.max(
    1.4,
    ...data.map((d) => Math.max(d.baselineKm, d.perturbedKm, d.upperUncertaintyKm))
  );

  const getX = (hours: number) => margin.left + (hours / maxTime) * innerWidth;
  const getY = (km: number) =>
    margin.top + innerHeight - (Math.max(0, km) / maxKm) * innerHeight;

  // Build SVG path for baseline curve
  const baselinePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.timeOffsetHours).toFixed(1)} ${getY(d.baselineKm).toFixed(1)}`)
    .join(' ');

  // Build SVG path for perturbed curve
  const perturbedPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.timeOffsetHours).toFixed(1)} ${getY(d.perturbedKm).toFixed(1)}`)
    .join(' ');

  // Build SVG polygon for uncertainty envelope (upper to end, then lower back to start)
  const upperPoints = data
    .map((d) => `${getX(d.timeOffsetHours).toFixed(1)},${getY(d.upperUncertaintyKm).toFixed(1)}`)
    .join(' ');
  const lowerPoints = [...data]
    .reverse()
    .map((d) => `${getX(d.timeOffsetHours).toFixed(1)},${getY(d.lowerUncertaintyKm).toFixed(1)}`)
    .join(' ');
  const envelopePoints = `${upperPoints} ${lowerPoints}`;

  // Critical safety threshold line (e.g. 200m = 0.2 km)
  const thresholdKm = 0.2;
  const thresholdY = getY(thresholdKm);

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 3] || data[0];

  return (
    <div className="w-full font-mono">
      {/* Chart Top Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#38d9f5]" />
            <span className="text-[#edf4ff] text-[11px]">Baseline Trajectory (Nominal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-rose-400 stroke-dashed" />
            <span className="text-rose-400 text-[11px]">Perturbed Trajectory (Simulated Model)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-2 rounded-xs bg-[#38d9f5]/10 border border-[#38d9f5]/30" />
            <span className="text-[#91a2b9] text-[11px]">Illustrative Dispersion Envelope</span>
          </div>
        </div>

        {activePoint && (
          <div className="px-2.5 py-1 rounded bg-[#101c30] border border-[rgba(91,160,190,0.2)] text-[11px] text-[#91a2b9] flex items-center gap-3">
            <span>T+{activePoint.timeOffsetHours}h</span>
            <span>
              Baseline Dispersion: <strong className="text-[#38d9f5]">{(activePoint.baselineKm * 1000).toFixed(0)}m</strong>
            </span>
            <span>
              Perturbed: <strong className="text-rose-400">{(activePoint.perturbedKm * 1000).toFixed(0)}m</strong>
            </span>
            <span>
              Δ Dispersion:{' '}
              <strong className="text-amber-400">
                {(Math.abs(activePoint.baselineKm - activePoint.perturbedKm) * 1000).toFixed(0)}m
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full bg-[#030712] rounded-lg border border-[rgba(91,160,190,0.18)] p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minHeight: '260px', maxHeight: '380px' }}
        >
          <defs>
            <linearGradient id="envelopeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38d9f5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff536b" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="perturbedGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffbe55" />
              <stop offset="100%" stopColor="#ff536b" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.2, 0.5, 0.8, 1.1, 1.4].map((kmVal) => {
            const y = getY(kmVal);
            return (
              <g key={kmVal}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="rgba(91, 160, 190, 0.12)"
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#61738c"
                  fontSize="10"
                >
                  {(kmVal * 1000).toFixed(0)}m
                </text>
              </g>
            );
          })}

          {/* Grid lines (vertical) */}
          {[0, 12, 24, 36, 48, 60, 72].map((hour) => {
            const x = getX(hour);
            return (
              <g key={hour}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="rgba(91, 160, 190, 0.08)"
                />
                <text
                  x={x}
                  y={height - margin.bottom + 16}
                  textAnchor="middle"
                  fill="#61738c"
                  fontSize="10"
                >
                  T+{hour}h
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={margin.left}
            y={margin.top - 8}
            fill="#91a2b9"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            SIMULATED TRAJECTORY DISPERSION (METERS)
          </text>
          <text
            x={width - margin.right}
            y={height - margin.bottom + 32}
            textAnchor="end"
            fill="#91a2b9"
            fontSize="10"
          >
            PROPAGATION TIME HORIZON
          </text>

          {/* Red Critical Warning Zone (below 200m) */}
          <rect
            x={margin.left}
            y={thresholdY}
            width={innerWidth}
            height={height - margin.bottom - thresholdY}
            fill="#ff536b"
            fillOpacity="0.06"
          />
          <line
            x1={margin.left}
            y1={thresholdY}
            x2={width - margin.right}
            y2={thresholdY}
            stroke="#ff536b"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text
            x={width - margin.right - 8}
            y={thresholdY - 5}
            textAnchor="end"
            fill="#ff536b"
            fontSize="9"
            fontWeight="bold"
          >
            ILLUSTRATIVE CONVERGENCE CORRIDOR (200m)
          </text>

          {/* 3-Sigma Uncertainty Envelope Polygon */}
          <polygon points={envelopePoints} fill="url(#envelopeGrad)" />

          {/* Baseline Curve */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#38d9f5"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Perturbed Curve */}
          <path
            d={perturbedPath}
            fill="none"
            stroke="url(#perturbedGlow)"
            strokeWidth="2.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />

          {/* Data point nodes */}
          {data.map((d, i) => {
            const x = getX(d.timeOffsetHours);
            const yBase = getY(d.baselineKm);
            const yPert = getY(d.perturbedKm);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={d.timeOffsetHours}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover zone */}
                <rect
                  x={x - 12}
                  y={margin.top}
                  width={24}
                  height={innerHeight}
                  fill="transparent"
                />

                {isHovered && (
                  <line
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={height - margin.bottom}
                    stroke="#38d9f5"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Baseline node */}
                <circle
                  cx={x}
                  cy={yBase}
                  r={isHovered ? 5 : 3}
                  fill="#030712"
                  stroke="#38d9f5"
                  strokeWidth="2"
                />

                {/* Perturbed node */}
                <circle
                  cx={x}
                  cy={yPert}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ff536b"
                  stroke="#030712"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Narrative Finding Box */}
      <div className="mt-3 p-3 bg-[#0b1424] rounded-lg border border-[rgba(91,160,190,0.18)] flex items-start gap-3">
        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold shrink-0 mt-0.5">
          SENSITIVITY FINDING
        </span>
        <p className="text-xs text-[#91a2b9] leading-relaxed">
          {scenario.keyFinding}
        </p>
      </div>
    </div>
  );
};
