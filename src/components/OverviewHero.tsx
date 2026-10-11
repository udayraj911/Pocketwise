/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  PiggyBank,
  ArrowRight,
  ReceiptText,
} from 'lucide-react';
import { BudgetData, CalculatedPlan } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';
import { DimensionalBalanceRing } from './DimensionalBalanceRing';

interface OverviewHeroProps {
  budget: BudgetData;
  currentPlan: CalculatedPlan;
  simulatedPlan: CalculatedPlan;
  isSimulating: boolean;
  onOpenExpenseLog: () => void;
  onOpenTransactions?: () => void;
  onOpenAIOnboarding?: () => void;
}

export const OverviewHero: React.FC<OverviewHeroProps> = ({
  budget,
  currentPlan,
  simulatedPlan,
  isSimulating,
  onOpenExpenseLog,
  onOpenTransactions,
  onOpenAIOnboarding,
}) => {
  const [showFormula, setShowFormula] = useState(false);

  const activePlan = isSimulating ? simulatedPlan : currentPlan;
  const balanceDelta = simulatedPlan.remainingBalance - currentPlan.remainingBalance;
  const dailyDelta = simulatedPlan.safeDailySpend - currentPlan.safeDailySpend;

  // Day progress percentage
  const dayProgressPct = Math.round((budget.currentDay / (budget.totalDays || 1)) * 100);
  // Budget spent percentage (dynamic, never hardcoded)
  const spentPct = budget.monthlyIncome > 0
    ? Math.min(100, Math.max(0, Math.round((currentPlan.spentSoFar / budget.monthlyIncome) * 100)))
    : 0;
  const remainingPct = Math.max(0, 100 - spentPct);

  return (
    <section className="w-full">
      {/* Simulation Banner Notice if active */}
      {isSimulating && (
        <div className="mb-4 bg-[#FEE5D8] border border-[#FCD2BF] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-sm text-[#7C2D12] transition-all">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#C2410C] shrink-0" />
            <span>
              <strong>Simulation Mode Active:</strong> You are previewing a hypothetical scenario. Numbers below reflect the projected impact.
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9A3412] shrink-0 hidden sm:inline">
            Preview Only
          </span>
        </div>
      )}

      {/* Main Primary Forest-Green Hero Card with 3D Dimensional Treatment */}
      <div className="bg-[#133226] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#234E3C]/80 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-[#D4F478]/30 group">
        {/* Layered 3D dimensional lighting and specular sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C4736]/40 via-transparent to-[#081F15]/80 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4F478]/40 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#1C4736]/50 blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-6 w-32 h-32 rounded-full bg-[#D4F478]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Column: Visual Focal Anchor - Available Balance & 3D Dimensional Vault Ring */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 text-xs text-[#A8C8B5]">
              <span className="font-semibold uppercase tracking-wider text-[#C8E8B6] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4F478] animate-pulse" />
                Available Remaining Balance
              </span>
              <span aria-hidden="true">·</span>
              <span>Month Plan: {formatINR(budget.monthlyIncome)}</span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              {/* Main Balance Figures */}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight tabular-nums text-white">
                    {formatINR(activePlan.remainingBalance)}
                  </span>

                  {budget.monthlyIncome === 0 && (
                    <button
                      onClick={onOpenAIOnboarding}
                      className="px-3 py-1.5 bg-[#D4F478] hover:bg-[#c5e865] text-[#133226] font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      + Add available balance
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-[#A8C8B5]">
                  <span>Cycle: {budget.cycleStartFormatted || 'Day 1'} – {budget.cycleEndFormatted || 'Day 30'}</span>
                  <span>·</span>
                  <span>Day {budget.currentDay} of {budget.totalDays} ({dayProgressPct}%)</span>
                </div>
              </div>

              {/* 3D Dimensional Ring Graphic */}
              <div className="hidden sm:block">
                <DimensionalBalanceRing
                  remainingBalance={activePlan.remainingBalance}
                  totalIncome={budget.monthlyIncome || 1}
                  spentSoFar={activePlan.spentSoFar}
                  unpaidEssentials={activePlan.unpaidEssentials}
                  emergencyBuffer={activePlan.emergencyBuffer}
                />
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              <button
                onClick={onOpenExpenseLog}
                className="px-4 py-2 bg-[#D4F478] hover:bg-[#c8ea66] text-[#133226] font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 group/btn"
              >
                <span>+ Log Expense</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>

              {onOpenTransactions && (
                <button
                  onClick={onOpenTransactions}
                  className="px-3.5 py-2 bg-[#1C4233] hover:bg-[#255240] text-white font-semibold text-xs rounded-xl transition-all border border-[#2D604C] flex items-center gap-1.5"
                >
                  <ReceiptText className="w-3.5 h-3.5 text-[#D4F478]" />
                  <span>View All Transactions</span>
                </button>
              )}

              <button
                onClick={() => setShowFormula(!showFormula)}
                className="px-3 py-2 text-[#A8C8B5] hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showFormula ? 'Hide Engine Logic' : 'How this is calculated'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Safe Daily Spend Metric Card */}
          <div className="w-full lg:w-80 bg-[#1A3F30]/90 backdrop-blur border border-[#2A5C47] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A8C8B5]">
                  Safe Daily Spend Limit
                </span>
                <Sparkles className="w-4 h-4 text-[#D4F478]" />
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold text-[#D4F478] tabular-nums my-1">
                {formatINR(activePlan.safeDailySpend)}
                <span className="text-sm font-normal text-[#A8C8B5] ml-1">/ day</span>
              </div>

              <p className="text-xs text-[#A8C8B5] leading-relaxed">
                Protects rent ({formatINR(activePlan.unpaidEssentials)}) & {formatINR(activePlan.emergencyBuffer)} buffer over {activePlan.daysRemaining} days.
              </p>
            </div>

            {/* Delta indicator during simulation */}
            {isSimulating && (
              <div className="mt-3 pt-3 border-t border-[#2A5C47] flex items-center justify-between text-xs">
                <span className="text-[#A8C8B5]">Simulated Daily Impact:</span>
                <span
                  className={`font-bold ${
                    dailyDelta >= 0 ? 'text-[#D4F478]' : 'text-[#FF9B9B]'
                  }`}
                >
                  {dailyDelta >= 0 ? '+' : ''}{formatINR(dailyDelta)}/day
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Formula Explanation Drawer */}
        {showFormula && (
          <div className="mt-6 pt-5 border-t border-[#234E3C] text-xs text-[#A8C8B5] space-y-2 bg-[#0E281E]/60 p-4 rounded-2xl animate-fadeIn">
            <div className="font-bold text-white flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-[#D4F478]" />
              Pocketwise Deterministic Calculation Formula
            </div>
            <p className="leading-relaxed">
              <strong>Available Cash ({formatINR(activePlan.remainingBalance)})</strong> = Starting Cash Balance ({formatINR(budget.monthlyIncome)}) − Actual Logged Expenses ({formatINR(activePlan.spentSoFar)}).
            </p>
            <p className="leading-relaxed">
              <strong>Safe Daily Limit ({formatINR(activePlan.safeDailySpend)})</strong> = [ Remaining Cash ({formatINR(activePlan.remainingBalance)}) − Unpaid Essentials ({formatINR(activePlan.unpaidEssentials)}) − Emergency Buffer ({formatINR(activePlan.emergencyBuffer)}) ] ÷ {activePlan.daysRemaining} remaining days.
            </p>
          </div>
        )}
      </div>

      {/* 4 Key Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
        {/* Metric 1: Actual Spent */}
        <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#5E7166] mb-1">
              <span>Logged Spent</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenTransactions}
                  className="text-[11px] text-[#133226] font-bold hover:underline"
                >
                  History
                </button>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#1C2B22]">
              {formatINR(activePlan.spentSoFar)}
            </div>
          </div>
          <div className="pt-2 text-xs text-[#5E7166]">
            <span>{spentPct}% of {formatINR(budget.monthlyIncome)} income</span>
            <span className="text-[#8B9B90] block text-[11px]">Across Days 1–{budget.currentDay}</span>
          </div>
        </div>

        {/* Metric 2: Essential Commitments */}
        <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#5E7166]">
              <span>Upcoming Essentials</span>
              <Shield className="w-3.5 h-3.5 text-[#133226]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#1C2B22]">
              {formatINR(activePlan.unpaidEssentials)}
            </div>
          </div>
          <div className="pt-2 text-xs text-[#5E7166]">
            <span>
              {activePlan.unpaidEssentials > 0
                ? `${formatINR(activePlan.unpaidEssentials)} in pending essential bills`
                : 'No pending essential bills'}
            </span>
            <span className="text-[#133226] font-medium block text-[11px]">
              {activePlan.unpaidEssentials > 0 ? 'Locked in & protected' : 'All clear'}
            </span>
          </div>
        </div>

        {/* Metric 3: Emergency Buffer */}
        <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#5E7166]">
              <span>Emergency Buffer</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${activePlan.bufferDipped ? 'text-[#C2410C]' : 'text-[#237048]'}`}>
                {activePlan.bufferDipped ? 'Dipped' : 'Intact'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#1C2B22]">
              {formatINR(activePlan.emergencyBuffer - activePlan.bufferDeficitAmount)}
            </div>
          </div>
          <div className="pt-2 text-xs text-[#5E7166]">
            {activePlan.bufferDipped ? (
              <span className="text-[#C2410C] font-semibold text-[11px]">
                Cushion reduced by {formatINR(activePlan.bufferDeficitAmount)}
              </span>
            ) : (
              <span>Target {formatINR(budget.emergencyBuffer)} reserve</span>
            )}
            <span className="text-[#8B9B90] block text-[11px]">Untouchable safety cushion</span>
          </div>
        </div>

        {/* Metric 4: Flexible Pool Remaining */}
        <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#5E7166]">
              <span>Flexible Pool</span>
              <PiggyBank className="w-3.5 h-3.5 text-[#133226]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#1C2B22]">
              {formatINR(activePlan.flexibleSpendingPool)}
            </div>
          </div>
          <div className="pt-2 text-xs text-[#5E7166]">
            <span>For meals, leisure & snacks</span>
            <span className="text-[#133226] font-medium block text-[11px]">
              {formatINR(activePlan.safeDailySpend)}/day over {activePlan.daysRemaining} days
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
