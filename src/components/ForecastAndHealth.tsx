/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Info,
  Activity,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { DayForecastPoint, CalculatedPlan } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';

interface ForecastAndHealthProps {
  forecastPoints: DayForecastPoint[];
  currentPlan: CalculatedPlan;
  simulatedPlan: CalculatedPlan;
  isSimulating: boolean;
  emergencyBuffer: number;
}

export const ForecastAndHealth: React.FC<ForecastAndHealthProps> = ({
  forecastPoints,
  currentPlan,
  simulatedPlan,
  isSimulating,
  emergencyBuffer,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DayForecastPoint | null>(null);

  const activePlan = isSimulating ? simulatedPlan : currentPlan;

  // Chart Dimensions
  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Dynamic Max scale based on user data
  const highestVal = Math.max(
    ...(forecastPoints && forecastPoints.length > 0
      ? forecastPoints.map((p) => Math.max(p.currentBalance || 0, p.simulatedBalance || 0))
      : [0]),
    emergencyBuffer || 0,
    500
  );
  const maxBalance = Math.ceil(highestVal / 1000) * 1000 || 1000;
  const minBalance = 0;

  // Coordinate mappers
  const getX = (day: number) => {
    return padding.left + ((day - 1) / 29) * chartW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minBalance, Math.min(maxBalance, val));
    return padding.top + chartH - (clamped / maxBalance) * chartH;
  };

  // Generate SVG path for Current Plan
  const currentPath = forecastPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.day).toFixed(1)} ${getY(pt.currentBalance).toFixed(1)}`)
    .join(' ');

  // Generate SVG path for Simulated Plan
  const simulatedPath = forecastPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.day).toFixed(1)} ${getY(pt.simulatedBalance).toFixed(1)}`)
    .join(' ');

  // Area under current path for subtle fill
  const currentAreaPath = `${currentPath} L ${getX(30)} ${getY(0)} L ${getX(1)} ${getY(0)} Z`;

  // Buffer line Y
  const bufferY = getY(emergencyBuffer);

  // Default active inspect point is current day (Day 8) if none hovered
  const displayPoint = hoveredPoint || forecastPoints.find((p) => p.isToday) || forecastPoints[7];

  return (
    <div className="bg-white border border-[#E8E3DA] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE2]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#133226] text-[#D4F478] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#1C2B22]">
              30-Day Trajectory & Health
            </h3>
          </div>
          <p className="text-xs text-[#5E7166] mt-0.5">
            Compare your baseline trajectory against the simulated decision over the remaining days.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#5E7166] flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-[#133226] rounded-full inline-block" />
            <span>Committed Plan</span>
          </div>

          {isSimulating && (
            <div className="flex items-center gap-1.5 text-[#C2410C]">
              <span className="w-3.5 h-1 border-t-2 border-dashed border-[#C2410C] inline-block" />
              <span>Simulated Scenario</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[#8B9B90]">
            <span className="w-3.5 h-0.5 border-t border-dotted border-[#8B9B90] inline-block" />
            <span>₹1k Buffer Line</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative bg-[#FAF8F5] rounded-2xl p-3 sm:p-4 border border-[#EDE8E0]">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[550px] select-none"
            aria-label="30-day balance forecast chart"
          >
            {/* Grid Lines */}
            {[0, 2500, 5000, 7500, 10000].map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#E6E0D4"
                    strokeWidth="1"
                    strokeDasharray={tick === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-[#8B9B90] font-mono"
                  >
                    ₹{tick.toLocaleString('en-IN')}
                  </text>
                </g>
              );
            })}

            {/* Day Axis Ticks (Days 1, 8 [today], 12 [rent], 20, 30) */}
            {[1, 8, 12, 18, 24, 30].map((d) => {
              const x = getX(d);
              return (
                <g key={d}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke={d === 8 ? '#133226' : '#EDE8E0'}
                    strokeWidth={d === 8 ? '1.5' : '1'}
                    strokeDasharray={d === 8 ? '2 2' : 'none'}
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-mono ${
                      d === 8 ? 'fill-[#133226] font-bold' : 'fill-[#8B9B90]'
                    }`}
                  >
                    {d === 8 ? 'Day 8 (Today)' : `Day ${d}`}
                  </text>
                </g>
              );
            })}

            {/* Emergency Buffer Dotted Threshold Line (₹1,000) */}
            <line
              x1={padding.left}
              y1={bufferY}
              x2={width - padding.right}
              y2={bufferY}
              stroke="#D97706"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x={width - padding.right}
              y={bufferY - 5}
              textAnchor="end"
              className="text-[9px] fill-[#B45309] font-semibold"
            >
              Emergency Cushion: ₹1,000
            </text>

            {/* Area Fill for Committed Plan */}
            <path
              d={currentAreaPath}
              fill="#133226"
              fillOpacity="0.04"
            />

            {/* Committed Plan Line */}
            <path
              d={currentPath}
              fill="none"
              stroke="#133226"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Simulated Plan Line (if active) */}
            {isSimulating && (
              <path
                d={simulatedPath}
                fill="none"
                stroke={simulatedPlan.bufferDipped ? '#C2410C' : '#3B82F6'}
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Nodes / Markers */}
            {forecastPoints.map((pt) => {
              const x = getX(pt.day);
              const yCurrent = getY(pt.currentBalance);
              const ySim = getY(pt.simulatedBalance);
              const isSelected = displayPoint?.day === pt.day;

              return (
                <g key={pt.day} className="cursor-pointer">
                  {/* Invisible wide hit area for easy hover/touch */}
                  <rect
                    x={x - 10}
                    y={padding.top}
                    width={20}
                    height={chartH}
                    fill="transparent"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => setHoveredPoint(pt)}
                  />

                  {/* Node point for Today or selected */}
                  {(pt.isToday || isSelected || pt.day === 12 || pt.day === 30) && (
                    <circle
                      cx={x}
                      cy={yCurrent}
                      r={isSelected ? 5 : 3.5}
                      fill="#133226"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  )}

                  {isSimulating && (pt.isToday || isSelected || pt.day === 30) && (
                    <circle
                      cx={x}
                      cy={ySim}
                      r={isSelected ? 5 : 3.5}
                      fill={simulatedPlan.bufferDipped ? '#C2410C' : '#3B82F6'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Day Inspector Chip */}
        {displayPoint && (
          <div className="mt-3 p-3 bg-white rounded-xl border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-[#133226] text-white rounded-lg font-bold font-mono text-xs">
                {displayPoint.dayLabel}
                {displayPoint.isToday && ' (Today)'}
              </div>
              <div className="flex items-center gap-3 font-semibold text-[#1C2B22]">
                <span>
                  Committed: <strong className="tabular-nums">{formatINR(displayPoint.currentBalance)}</strong>
                </span>
                {isSimulating && (
                  <span className="text-[#C2410C]">
                    Simulated: <strong className="tabular-nums">{formatINR(displayPoint.simulatedBalance)}</strong>
                  </span>
                )}
              </div>
            </div>

            {displayPoint.events && displayPoint.events.length > 0 && (
              <div className="text-[11px] text-[#5E7166] flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-[#1C2B22]">Events:</span>
                {displayPoint.events.join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Health Score & Risk Level Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Risk Level Card */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5E7166] uppercase tracking-wider">
              Financial Risk
            </span>
            <span className="text-xs font-mono text-[#8B9B90]">
              Score {activePlan.riskScore}/100
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold uppercase tracking-tight ${
                activePlan.riskLevel === 'low'
                  ? 'text-[#20703B]'
                  : activePlan.riskLevel === 'moderate'
                  ? 'text-[#B45309]'
                  : 'text-[#C2410C]'
              }`}
            >
              {activePlan.riskLevel} Risk
            </span>
          </div>

          <p className="text-xs text-[#5E7166] leading-relaxed">
            {activePlan.riskLevel === 'low'
              ? 'Your essentials, emergency buffer, and savings target remain well-protected with comfortable breathing room.'
              : activePlan.riskLevel === 'moderate'
              ? 'Your margin is narrow. Mindful day-to-day spending is required so you do not dip into your reserve.'
              : 'Caution: This scenario puts pressure on your emergency buffer or living commitments.'}
          </p>
        </div>

        {/* Health Score Card */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5E7166] uppercase tracking-wider">
              Pocketwise Health
            </span>
            <span className="text-xs font-semibold text-[#133226]">
              {activePlan.healthScore} / 100
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full h-2.5 rounded-full bg-[#E5E0D8] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                activePlan.healthScore >= 70
                  ? 'bg-[#133226]'
                  : activePlan.healthScore >= 45
                  ? 'bg-[#B45309]'
                  : 'bg-[#C2410C]'
              }`}
              style={{ width: `${activePlan.healthScore}%` }}
            />
          </div>

          <p className="text-xs font-semibold text-[#1C2B22]">
            {activePlan.healthSummary}
          </p>
          <p className="text-[11px] text-[#5E7166]">
            Based on buffer integrity, living allowances, and savings pace.
          </p>
        </div>

        {/* Transparent Demo Logic & Non-Judgmental Insights */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-2">
          <span className="text-xs font-bold text-[#5E7166] uppercase tracking-wider">
            Key Factors In Play
          </span>
          <ul className="text-xs text-[#4A5D50] space-y-1">
            {activePlan.healthReasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <span className="text-[#133226] font-bold">·</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Advisory & Demo Logic Disclaimer */}
      <div className="p-3 bg-[#F4EFEA] rounded-xl text-center text-[11px] text-[#7A8C80] flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-[#8B9B90] shrink-0" />
        <span>
          Illustrative demo calculation based on transparent rule set · Not certified financial advice.
        </span>
      </div>
    </div>
  );
};
