/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Repeat,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  ShieldAlert,
  Flame,
  Bot,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { CalculatedPlan, SimulationState, AIScenarioEvaluation } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';

interface DecisionSimulatorProps {
  simulation: SimulationState;
  onUpdateSimulation: (updater: (prev: SimulationState) => SimulationState) => void;
  onCommitSimulation: () => void;
  onResetSimulation: () => void;
  currentPlan: CalculatedPlan;
  simulatedPlan: CalculatedPlan;
}

export const DecisionSimulator: React.FC<DecisionSimulatorProps> = ({
  simulation,
  onUpdateSimulation,
  onCommitSimulation,
  onResetSimulation,
  currentPlan,
  simulatedPlan,
}) => {
  const isSimulating =
    simulation.oneTimePurchase > 0 ||
    simulation.weeklySubscription > 0 ||
    simulation.unexpectedExpense > 0;

  // Preset chips for rapid exploration
  const oneTimePresets = [
    { label: 'None', amount: 0, title: '' },
    { label: 'Weekend Cafe (₹450)', amount: 450, title: 'Weekend Cafe Outing' },
    { label: 'Sneakers (₹1,400)', amount: 1400, title: 'New Sneakers on Sale' },
    { label: 'Concert Pass (₹2,500)', amount: 2500, title: 'Live Music Festival Pass' },
  ];

  const subscriptionPresets = [
    { label: 'None', amount: 0, title: '' },
    { label: 'OTT Pass (₹149/wk)', amount: 149, title: 'Streaming Service' },
    { label: 'Gym (₹350/wk)', amount: 350, title: 'Fitness Center' },
    { label: 'Studio Pass (₹499/wk)', amount: 499, title: 'Creative Studio' },
  ];

  const unexpectedPresets = [
    { label: 'None', amount: 0, title: '' },
    { label: 'Meds & Clinic (₹650)', amount: 650, title: 'Clinic Consultation & Meds' },
    { label: 'Phone Repair (₹1,800)', amount: 1800, title: 'Screen Glass Replacement' },
    { label: 'Emergency Ticket (₹2,800)', amount: 2800, title: 'Last-minute Transit Fare' },
  ];

  const remainingWeeks = Math.ceil(currentPlan.daysRemaining / 7);
  const totalSubCost = simulation.weeklySubscription * remainingWeeks;
  const totalSimulatedSpend =
    simulation.oneTimePurchase + simulation.unexpectedExpense + totalSubCost;

  const balDelta = simulatedPlan.remainingBalance - currentPlan.remainingBalance;
  const dailyDelta = simulatedPlan.safeDailySpend - currentPlan.safeDailySpend;

  // Phase 3: AI Scenario Simulation Advisor
  const [scenarioEval, setScenarioEval] = useState<AIScenarioEvaluation | null>(null);
  const [isLoadingEval, setIsLoadingEval] = useState(false);

  React.useEffect(() => {
    if (!isSimulating) {
      setScenarioEval(null);
    }
  }, [isSimulating]);

  const handleEvaluateScenario = async () => {
    if (!isSimulating) return;
    setIsLoadingEval(true);
    try {
      const res = await fetch('/api/coach/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation,
          baseline: currentPlan,
          simulated: simulatedPlan,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setScenarioEval(data.data);
      }
    } catch (err) {
      console.error('Failed to evaluate scenario with AI coach:', err);
    } finally {
      setIsLoadingEval(false);
    }
  };

  return (
    <div className="bg-white border border-[#E8E3DA] rounded-3xl p-5 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0EBE2]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#133226] text-[#D4F478] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#1C2B22]">Decision Simulator</h2>
          </div>
          <p className="text-xs text-[#5E7166] mt-1">
            Slide or tap presets to test the domino effect of purchases before spending a single Rupee.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetSimulation}
            disabled={!isSimulating}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] ${
              isSimulating
                ? 'bg-[#F2EDE4] text-[#1C2B22] hover:bg-[#E5DFD4] cursor-pointer'
                : 'bg-[#F7F5F0] text-[#B0BDB5] cursor-not-allowed opacity-60'
            }`}
            title="Reset preview back to current plan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Preview</span>
          </button>

          <button
            onClick={onCommitSimulation}
            disabled={!isSimulating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              isSimulating
                ? 'bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] shadow-md shadow-[#133226]/10 cursor-pointer active:scale-98'
                : 'bg-[#EAE6DF] text-[#8E9E94] cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#D4F478]" />
            <span>Add to my plan</span>
          </button>
        </div>
      </div>

      {/* Simulator Sliders & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        {/* Control 1: One-time Purchase */}
        <div className="space-y-3 bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#EDE8E0]">
          <div className="flex items-center justify-between">
            <label htmlFor="one-time-slider" className="flex items-center gap-2 text-xs font-bold text-[#1C2B22] uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-[#133226]" />
              One-Time Purchase
            </label>
            <span className="text-base font-extrabold text-[#133226] tabular-nums">
              {formatINR(simulation.oneTimePurchase)}
            </span>
          </div>

          <p className="text-xs text-[#5E7166]">
            E.g. Clothes, electronics, concert tickets, gifts.
          </p>

          <input
            id="one-time-slider"
            type="range"
            min={0}
            max={3000}
            step={50}
            value={simulation.oneTimePurchase}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateSimulation((prev) => ({
                ...prev,
                oneTimePurchase: val,
                oneTimeTitle: val > 0 ? (prev.oneTimeTitle || 'Planned One-Time Purchase') : '',
              }));
            }}
            className="w-full h-2 bg-[#E2DCCE] rounded-lg cursor-pointer"
            aria-label="One-time purchase amount in INR"
          />

          <div className="flex justify-between text-[11px] text-[#8B9B90] font-mono">
            <span>₹0</span>
            <span>₹1,500</span>
            <span>₹3,000</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {oneTimePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  onUpdateSimulation((prev) => ({
                    ...prev,
                    oneTimePurchase: preset.amount,
                    oneTimeTitle: preset.title,
                  }))
                }
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  simulation.oneTimePurchase === preset.amount
                    ? 'bg-[#133226] text-[#D4F478]'
                    : 'bg-white text-[#5E7166] hover:bg-[#EFEAE2] border border-[#E5E0D8]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Control 2: Weekly Subscription */}
        <div className="space-y-3 bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#EDE8E0]">
          <div className="flex items-center justify-between">
            <label htmlFor="weekly-sub-slider" className="flex items-center gap-2 text-xs font-bold text-[#1C2B22] uppercase tracking-wider">
              <Repeat className="w-4 h-4 text-[#133226]" />
              Weekly Subscription
            </label>
            <div className="text-right">
              <span className="text-base font-extrabold text-[#133226] tabular-nums">
                {formatINR(simulation.weeklySubscription)}
              </span>
              <span className="text-[11px] text-[#5E7166]">/wk</span>
            </div>
          </div>

          <p className="text-xs text-[#5E7166]">
            Total this month: <strong className="text-[#1C2B22]">{formatINR(totalSubCost)}</strong> ({remainingWeeks} weeks remaining).
          </p>

          <input
            id="weekly-sub-slider"
            type="range"
            min={0}
            max={500}
            step={25}
            value={simulation.weeklySubscription}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateSimulation((prev) => ({
                ...prev,
                weeklySubscription: val,
                weeklySubscriptionTitle: val > 0 ? (prev.weeklySubscriptionTitle || 'New Recurring Subscription') : '',
              }));
            }}
            className="w-full h-2 bg-[#E2DCCE] rounded-lg cursor-pointer"
            aria-label="Weekly subscription cost in INR"
          />

          <div className="flex justify-between text-[11px] text-[#8B9B90] font-mono">
            <span>₹0</span>
            <span>₹250</span>
            <span>₹500</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {subscriptionPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  onUpdateSimulation((prev) => ({
                    ...prev,
                    weeklySubscription: preset.amount,
                    weeklySubscriptionTitle: preset.title,
                  }))
                }
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  simulation.weeklySubscription === preset.amount
                    ? 'bg-[#133226] text-[#D4F478]'
                    : 'bg-white text-[#5E7166] hover:bg-[#EFEAE2] border border-[#E5E0D8]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Control 3: Unexpected Expense */}
        <div className="space-y-3 bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#EDE8E0]">
          <div className="flex items-center justify-between">
            <label htmlFor="unexpected-slider" className="flex items-center gap-2 text-xs font-bold text-[#1C2B22] uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-[#C2410C]" />
              Unexpected Expense
            </label>
            <span className="text-base font-extrabold text-[#C2410C] tabular-nums">
              {formatINR(simulation.unexpectedExpense)}
            </span>
          </div>

          <p className="text-xs text-[#5E7166]">
            E.g. Broken phone screen, clinic visit, unplanned travel.
          </p>

          <input
            id="unexpected-slider"
            type="range"
            min={0}
            max={3000}
            step={50}
            value={simulation.unexpectedExpense}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateSimulation((prev) => ({
                ...prev,
                unexpectedExpense: val,
                unexpectedTitle: val > 0 ? (prev.unexpectedTitle || 'Unexpected Expense') : '',
              }));
            }}
            className="w-full h-2 bg-[#E2DCCE] rounded-lg cursor-pointer"
            aria-label="Unexpected expense amount in INR"
          />

          <div className="flex justify-between text-[11px] text-[#8B9B90] font-mono">
            <span>₹0</span>
            <span>₹1,500</span>
            <span>₹3,000</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {unexpectedPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  onUpdateSimulation((prev) => ({
                    ...prev,
                    unexpectedExpense: preset.amount,
                    unexpectedTitle: preset.title,
                  }))
                }
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  simulation.unexpectedExpense === preset.amount
                    ? 'bg-[#C2410C] text-white'
                    : 'bg-white text-[#5E7166] hover:bg-[#EFEAE2] border border-[#E5E0D8]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Immediate Live Impact Matrix */}
      <div className="mt-6 pt-6 border-t border-[#F0EBE2]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1C2B22]">
              Live Projected Consequence
            </span>
            {isSimulating && (
              <span className="text-xs text-[#C2410C] font-semibold bg-[#FEE5D8] px-2 py-0.5 rounded-md">
                Total impact: {formatINR(totalSimulatedSpend)}
              </span>
            )}
          </div>
          <span className="text-xs text-[#8B9B90]">
            Comparing Committed vs Simulated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tile 1: Remaining Balance */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-1">
            <span className="text-xs text-[#5E7166]">Remaining Balance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tabular-nums text-[#1C2B22]">
                {formatINR(simulatedPlan.remainingBalance)}
              </span>
              {isSimulating && (
                <span className="text-xs font-medium text-[#C2410C]">
                  ({formatINR(balDelta, { showSign: true })})
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8B9B90]">
              Baseline: {formatINR(currentPlan.remainingBalance)}
            </div>
          </div>

          {/* Tile 2: Safe Daily Allowance */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-1">
            <span className="text-xs text-[#5E7166]">Safe Daily Allowance</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold tabular-nums ${simulatedPlan.safeDailySpend < 50 ? 'text-[#C2410C]' : 'text-[#1C2B22]'}`}>
                {formatINR(simulatedPlan.safeDailySpend)}/day
              </span>
              {isSimulating && (
                <span className="text-xs font-medium text-[#C2410C]">
                  ({formatINR(dailyDelta, { showSign: true })})
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8B9B90]">
              Baseline: {formatINR(currentPlan.safeDailySpend)}/day
            </div>
          </div>

          {/* Tile 3: Savings Goal Achievable */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-1">
            <span className="text-xs text-[#5E7166]">Savings Goal (₹2,000)</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  simulatedPlan.savingsAchievable
                    ? 'bg-[#E1F7C5] text-[#1E5225]'
                    : simulatedPlan.bufferDipped
                    ? 'bg-[#FEE5D8] text-[#9A3412]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}
              >
                {simulatedPlan.savingsAchievable
                  ? 'On Track'
                  : simulatedPlan.bufferDipped
                  ? 'Goal Paused'
                  : 'Tight / Delayed'}
              </span>
            </div>
            <div className="text-[11px] text-[#8B9B90]">
              {simulatedPlan.savingsAchievable
                ? `Flexible pool covers final ₹500`
                : `Focus on room & food first`}
            </div>
          </div>

          {/* Tile 4: Financial Health & Risk */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-1">
            <span className="text-xs text-[#5E7166]">Risk Level</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-sm font-bold uppercase tracking-wider ${
                  simulatedPlan.riskLevel === 'low'
                    ? 'text-[#20703B]'
                    : simulatedPlan.riskLevel === 'moderate'
                    ? 'text-[#B45309]'
                    : 'text-[#C2410C]'
                }`}
              >
                {simulatedPlan.riskLevel} Risk
              </span>
              <span className="text-xs text-[#8B9B90] tabular-nums">
                Score {simulatedPlan.healthScore}/100
              </span>
            </div>
            <div className="text-[11px] text-[#8B9B90] truncate">
              {simulatedPlan.healthSummary}
            </div>
          </div>
        </div>

        {/* PHASE 3: AI Scenario Simulation Advisor */}
        {isSimulating && (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#F6FAF7] border border-[#CFE4D4] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFEDE2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#133226] text-[#D4F478] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#1C2B22] uppercase tracking-wider">
                  AI Coach Scenario Verdict
                </span>
                {scenarioEval && (
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      scenarioEval.verdict === 'safe'
                        ? 'bg-[#E1F7C5] text-[#1E5225]'
                        : scenarioEval.verdict === 'caution'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#FEE5D8] text-[#9A3412]'
                    }`}
                  >
                    {scenarioEval.verdict === 'safe'
                      ? 'Safe Decision'
                      : scenarioEval.verdict === 'caution'
                      ? 'Proceed with Caution'
                      : 'High Risk'}
                  </span>
                )}
              </div>

              <button
                onClick={handleEvaluateScenario}
                disabled={isLoadingEval}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#133226] text-white hover:bg-[#1a4434] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 w-fit"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEval ? 'animate-spin' : ''}`} />
                <span>{scenarioEval ? 'Re-evaluate with Coach' : 'Evaluate with AI Coach'}</span>
              </button>
            </div>

            {isLoadingEval ? (
              <div className="py-4 text-center text-xs text-[#5E7166] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#133226]" />
                <span>Sage is evaluating trade-offs and cashflow consequences...</span>
              </div>
            ) : scenarioEval ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-[#1C2B22]">{scenarioEval.verdictHeadline}</h4>
                  <p className="text-xs text-[#4E6254] mt-1 leading-relaxed">
                    {scenarioEval.impactSummary}
                  </p>
                </div>

                {scenarioEval.tradeOffAdvice && (
                  <div className="p-3 bg-white rounded-xl border border-[#DDECE1] text-xs text-[#2A4B32] space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-[#133226]">
                      Recommended Trade-Off:
                    </strong>
                    <p>{scenarioEval.tradeOffAdvice}</p>
                  </div>
                )}

                {scenarioEval.alternatives && scenarioEval.alternatives.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[#1C2B22] uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-[#133226]" />
                      Smart Alternatives:
                    </span>
                    <ul className="space-y-1 text-xs text-[#5E7166]">
                      {scenarioEval.alternatives.map((alt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#133226] font-bold">•</span>
                          <span>{alt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4E6254]">
                <span>
                  Tap <strong>Evaluate with AI Coach</strong> to get instant Gemini analysis of domino effects on your daily allowance and upcoming bills.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Friendly Gen-Z Reassurance Microcopy */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#F4EFEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4E6254]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#133226] shrink-0" />
            <span>
              {isSimulating ? (
                simulatedPlan.bufferDipped ? (
                  <strong className="text-[#9A3412]">
                    Notice: This spend would dip into your ₹1,000 emergency buffer by {formatINR(simulatedPlan.bufferDeficitAmount)}. Consider dialing it back or splitting the cost.
                  </strong>
                ) : (
                  <>You can comfortably afford this if you limit everyday casual spends to <strong>{formatINR(simulatedPlan.safeDailySpend)}/day</strong>.</>
                )
              ) : (
                <>Simulating has zero consequences on your bank account. Adjust the sliders above to see your exact leeway.</>
              )}
            </span>
          </div>

          {isSimulating && (
            <button
              onClick={onCommitSimulation}
              className="text-xs font-bold text-[#133226] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Commit scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
