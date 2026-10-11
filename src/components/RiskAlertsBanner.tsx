/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { FinancialRisk } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';

interface RiskAlertsBannerProps {
  risks: FinancialRisk[];
  explanations?: Record<string, string>;
}

export const RiskAlertsBanner: React.FC<RiskAlertsBannerProps> = ({
  risks,
  explanations,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  if (!risks || risks.length === 0) return null;

  const topRisk = risks[0];
  const isCritical = risks.some((r) => r.severity === 'critical');
  const isHigh = risks.some((r) => r.severity === 'high');

  const bgClass = isCritical
    ? 'bg-[#FEE5D8] border-[#FCD2BF] text-[#7C2D12]'
    : isHigh
    ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
    : 'bg-[#F4EFEA] border-[#E8E2D6] text-[#4A5D50]';

  const badgeColor = isCritical
    ? 'bg-[#C2410C] text-white'
    : isHigh
    ? 'bg-[#D97706] text-white'
    : 'bg-[#133226] text-[#D4F478]';

  return (
    <div className={`rounded-2xl border p-4 transition-all ${bgClass} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 text-[#C2410C]" />
            ) : isHigh ? (
              <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            ) : (
              <Info className="w-5 h-5 text-[#133226]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
                {topRisk.severity} Risk Warning
              </span>
              <span className="text-xs font-bold">{topRisk.title}</span>
              {topRisk.amount && (
                <span className="text-xs font-extrabold tabular-nums">
                  ({formatINR(topRisk.amount)})
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed">{topRisk.explanation}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {risks.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
            >
              <span>{risks.length} warnings</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="p-1 rounded-lg hover:bg-black/5"
            title="Inspect calculation explanations"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded List of Additional Warnings */}
      {isExpanded && risks.length > 1 && (
        <div className="pt-3 border-t border-black/10 divide-y divide-black/5 space-y-2">
          {risks.slice(1).map((r) => (
            <div key={r.id} className="pt-2 text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold">{r.title}</span>
                {r.amount && <span className="tabular-nums font-semibold">({formatINR(r.amount)})</span>}
              </div>
              <p className="opacity-90">{r.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calculation Formulas Explanation Box */}
      {showFormulaDetails && explanations && (
        <div className="pt-3 border-t border-black/10 text-[11px] font-mono space-y-1.5 opacity-95">
          <div className="font-bold font-sans uppercase text-[10px] tracking-wider">
            Deterministic Engine Formulas:
          </div>
          <div className="p-2.5 bg-black/5 rounded-xl space-y-1">
            <div>• {explanations.currentCash}</div>
            <div>• {explanations.flexibleAmount}</div>
            <div>• {explanations.dailySpending}</div>
            <div>• {explanations.emergencyReserve}</div>
          </div>
        </div>
      )}
    </div>
  );
};
