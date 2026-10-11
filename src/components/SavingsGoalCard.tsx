/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PiggyBank, Sparkles, Check, ArrowUpRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { BudgetData, CalculatedPlan } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';

interface SavingsGoalCardProps {
  budget: BudgetData;
  currentPlan: CalculatedPlan;
  simulatedPlan: CalculatedPlan;
  isSimulating: boolean;
  onAddSavingsDeposit: (amount: number) => void;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({
  budget,
  currentPlan,
  simulatedPlan,
  isSimulating,
  onAddSavingsDeposit,
}) => {
  const [depositAmount, setDepositAmount] = useState<number>(250);
  const [showQuickDeposit, setShowQuickDeposit] = useState(false);

  const activePlan = isSimulating ? simulatedPlan : currentPlan;

  const target = budget.savingsGoalTarget; // 2,000
  const current = budget.savingsGoalCurrent; // 1,500
  const needed = Math.max(0, target - current); // 500
  const progressPct = Math.min(100, Math.round((current / target) * 100)); // 75%

  // Evaluation: Is the goal achievable under current simulated or baseline scenario?
  const isAchievable = activePlan.savingsAchievable;

  return (
    <div className="bg-white border border-[#E8E3DA] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#1E5225] flex items-center justify-center">
              <PiggyBank className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C2B22]">
                Rainy-Day Savings
              </h3>
              <p className="text-xs text-[#5E7166]">
                Target: {formatINR(target)} · 30-day cushion
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              isAchievable
                ? 'bg-[#E1F7C5] text-[#1E5225]'
                : activePlan.bufferDipped
                ? 'bg-[#FEE5D8] text-[#9A3412]'
                : 'bg-[#FEF3C7] text-[#92400E]'
            }`}
          >
            {isAchievable
              ? 'On Track'
              : activePlan.bufferDipped
              ? 'Paused for Buffer'
              : 'Margin Tight'}
          </span>
        </div>

        {/* Current Saved vs Target Display */}
        <div className="space-y-2 mb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[#1C2B22]">
              {formatINR(current)}
            </span>
            <span className="text-xs font-semibold text-[#5E7166]">
              {progressPct}% of {formatINR(target)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-[#EAE5DC] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAchievable ? 'bg-[#133226]' : 'bg-[#B45309]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#5E7166]">
            <span>{formatINR(needed)} remaining to reach goal</span>
            <span className="font-medium text-[#133226]">
              {isAchievable ? `~${formatINR(Math.ceil(needed / activePlan.daysRemaining))}/day needed` : 'Prioritize essentials'}
            </span>
          </div>
        </div>

        {/* Explanatory Context Note */}
        <div className="text-xs text-[#4A5D50] bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE8E0] space-y-1.5">
          <div className="font-semibold text-[#1C2B22] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#133226]" />
            <span>
              {isAchievable
                ? 'Plan comfortably funds this goal'
                : activePlan.bufferDipped
                ? 'Emergency buffer takes precedence'
                : 'Spending pace is close to the line'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#5E7166]">
            {isAchievable ? (
              <>
                Your flexible pool ({formatINR(activePlan.flexibleSpendingPool)}) easily covers the remaining {formatINR(needed)} goal while leaving {formatINR(activePlan.safeDailySpend)}/day for daily lifestyle.
              </>
            ) : activePlan.bufferDipped ? (
              <>
                Your simulated expense dips into your {formatINR(activePlan.emergencyBuffer)} emergency buffer. Pocketwise pauses new savings contributions to protect your rent and living safety net.
              </>
            ) : (
              <>
                After paying essential commitments and subscriptions, your flexible margin is tight. Consider reaching the {formatINR(target)} mark in the first week of next month.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Quick Deposit Action Button */}
      <div className="mt-4 pt-4 border-t border-[#F0EBE2]">
        {!showQuickDeposit ? (
          <button
            onClick={() => setShowQuickDeposit(true)}
            disabled={activePlan.flexibleSpendingPool < 100}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activePlan.flexibleSpendingPool >= 100
                ? 'bg-[#F2EDE4] hover:bg-[#E5DFD4] text-[#1C2B22]'
                : 'bg-[#F7F5F0] text-[#8B9B90] cursor-not-allowed'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Transfer from flexible pool to goal</span>
          </button>
        ) : (
          <div className="space-y-2 bg-[#F2EDE4] p-3 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1C2B22]">Deposit into Savings</span>
              <button
                onClick={() => setShowQuickDeposit(false)}
                className="text-[11px] text-[#5E7166] hover:underline"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-1.5">
              {[100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg ${
                    depositAmount === amt
                      ? 'bg-[#133226] text-[#D4F478]'
                      : 'bg-white text-[#1C2B22] border border-[#DDD7CD]'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                onAddSavingsDeposit(depositAmount);
                setShowQuickDeposit(false);
              }}
              disabled={depositAmount > activePlan.flexibleSpendingPool}
              className="w-full py-2 bg-[#133226] text-[#D4F478] rounded-lg text-xs font-bold hover:bg-[#1C4233] transition-colors"
            >
              Deposit {formatINR(depositAmount)} now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
