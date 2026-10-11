/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BudgetData,
  CommitmentItem,
  DayForecastPoint,
  PastExpenseItem,
  SimulationState,
  CalculatedPlan,
  RiskLevel,
} from '../types/finance';
import { getDefaultCurrentMonthPlan, formatDateHuman, calculatePlanMetricsFromDates } from './dateTime';

/**
 * Format Currency with standard number grouping
 * Defaults to INR (₹) with Indian Lakhs/Thousands numbering
 */
export function formatINR(
  amount: number,
  options?: { showSign?: boolean; hideDecimals?: boolean; currency?: string }
): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const rounded = options?.hideDecimals !== false ? Math.round(absVal) : Number(absVal.toFixed(2));
  
  const formattedAbs = rounded.toLocaleString('en-IN');
  const symbol = options?.currency && options.currency !== 'INR' ? `${options.currency} ` : '₹';
  
  if (isNegative) {
    return `-${symbol}${formattedAbs}`;
  }
  if (options?.showSign && amount > 0) {
    return `+${symbol}${formattedAbs}`;
  }
  return `${symbol}${formattedAbs}`;
}

const initialPlanMetrics = getDefaultCurrentMonthPlan();

export const INITIAL_BUDGET: BudgetData = {
  monthlyIncome: 10000,
  currentDay: initialPlanMetrics.currentDay,
  totalDays: initialPlanMetrics.totalDays,
  planStartDate: initialPlanMetrics.startDate,
  planEndDate: initialPlanMetrics.endDate,
  cycleStartFormatted: formatDateHuman(initialPlanMetrics.startDate),
  cycleEndFormatted: formatDateHuman(initialPlanMetrics.endDate),
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  emergencyBuffer: 1000,
  savingsGoalTarget: 2000,
  savingsGoalCurrent: 1500,
  isOnboardingComplete: false,
};

export const EMPTY_BUDGET: BudgetData = {
  monthlyIncome: 0,
  currentDay: initialPlanMetrics.currentDay,
  totalDays: initialPlanMetrics.totalDays,
  planStartDate: initialPlanMetrics.startDate,
  planEndDate: initialPlanMetrics.endDate,
  cycleStartFormatted: formatDateHuman(initialPlanMetrics.startDate),
  cycleEndFormatted: formatDateHuman(initialPlanMetrics.endDate),
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  emergencyBuffer: 0,
  savingsGoalTarget: 0,
  savingsGoalCurrent: 0,
  currentCash: 0,
  isOnboardingComplete: false,
};

export const INITIAL_PAST_EXPENSES: PastExpenseItem[] = [
  { id: 'exp-1', name: 'Mobile Recharge (30-day pack)', amount: 499, day: 1, category: 'Phone & Internet', essential: true },
  { id: 'exp-2', name: 'Weekly Music Streaming', amount: 199, day: 2, category: 'Subscriptions', essential: false },
  { id: 'exp-3', name: 'Transit Metro Smartcard', amount: 550, day: 4, category: 'Commute', essential: true },
  { id: 'exp-4', name: 'Groceries & Batch Cooking', amount: 820, day: 5, category: 'Food & Essentials', essential: true },
  { id: 'exp-5', name: 'Chai & Campus Meals', amount: 332, day: 7, category: 'Flexible Meals', essential: false },
];

export const INITIAL_COMMITMENTS: CommitmentItem[] = [
  {
    id: 'com-room',
    name: 'Room Share (Rent & Power)',
    category: 'essential',
    amount: 3000,
    dueDateDay: 12,
    isPaid: false,
    frequency: 'monthly',
    note: 'Split share due on Day 12. Must be protected.',
    iconType: 'home',
  },
  {
    id: 'com-phone',
    name: 'Phone & 5G Data Pack',
    category: 'essential',
    amount: 499,
    dueDateDay: 1,
    isPaid: true,
    frequency: 'monthly',
    note: 'Paid on Day 1 of the cycle.',
    iconType: 'phone',
  },
  {
    id: 'com-music',
    name: 'Music Streaming Premium',
    category: 'subscription',
    amount: 199,
    dueDateDay: 9, // Next upcoming weekly renewal
    isPaid: false,
    frequency: 'weekly',
    isPaused: false,
    note: 'INR 199 charged each week (~3 payments left this cycle).',
    iconType: 'music',
  },
  {
    id: 'com-wifi',
    name: 'Shared Flat Wi-Fi',
    category: 'essential',
    amount: 350,
    dueDateDay: 20,
    isPaid: false,
    frequency: 'monthly',
    note: 'Broadband share due mid-month.',
    iconType: 'wifi',
  },
];

export const INITIAL_SIMULATION: SimulationState = {
  oneTimePurchase: 0,
  oneTimeTitle: '',
  weeklySubscription: 0,
  weeklySubscriptionTitle: '',
  unexpectedExpense: 0,
  unexpectedTitle: '',
};

/**
 * Calculates remaining active weekly subscription cycles from currentDay to totalDays
 */
export function getRemainingSubscriptionCost(
  commitments: CommitmentItem[],
  currentDay: number,
  totalDays: number
): number {
  const daysLeft = Math.max(0, totalDays - currentDay);
  const remainingWeeks = Math.ceil(daysLeft / 7);

  return commitments
    .filter((c) => c.category === 'subscription' && !c.isPaused && !c.isPaid)
    .reduce((total, sub) => {
      if (sub.frequency === 'weekly') {
        return total + sub.amount * remainingWeeks;
      }
      return total + sub.amount;
    }, 0);
}

/**
 * Computes plan metrics for either baseline or simulated conditions
 */
export function calculatePlanMetrics(
  budget: BudgetData,
  commitments: CommitmentItem[],
  pastExpenses: PastExpenseItem[],
  simulation: SimulationState = INITIAL_SIMULATION
): CalculatedPlan {
  const spentSoFar = pastExpenses.reduce((sum, item) => sum + item.amount, 0);
  const baselineRemaining = budget.monthlyIncome - spentSoFar;
  
  const daysRemaining = Math.max(1, budget.totalDays - budget.currentDay);
  const remainingWeeks = Math.ceil(daysRemaining / 7);

  // Unpaid essentials
  const unpaidEssentials = commitments
    .filter((c) => c.category === 'essential' && !c.isPaid)
    .reduce((sum, c) => sum + c.amount, 0);

  // Active subscriptions currently committed
  const committedSubscriptions = getRemainingSubscriptionCost(commitments, budget.currentDay, budget.totalDays);

  // Additional simulated costs
  const simulatedOneTime = (simulation.oneTimePurchase || 0) + (simulation.unexpectedExpense || 0);
  const simulatedSubTotal = (simulation.weeklySubscription || 0) * remainingWeeks;
  const totalSimulatedCost = simulatedOneTime + simulatedSubTotal;

  // Remaining balance under this scenario
  const effectiveRemainingBalance = baselineRemaining - totalSimulatedCost;

  // Emergency buffer (INR 1,000 protected)
  const emergencyBuffer = budget.emergencyBuffer;

  // Flexible Spending Pool = Balance - Unpaid Essentials - Buffer - Subscriptions
  // If this dips below 0, it means the buffer is being touched.
  const rawFlexible = effectiveRemainingBalance - unpaidEssentials - committedSubscriptions;
  
  let flexibleSpendingPool = 0;
  let bufferDipped = false;
  let bufferDeficitAmount = 0;
  let isDeficit = false;
  let deficitAmount = 0;

  if (rawFlexible >= emergencyBuffer) {
    // Both essentials and full emergency buffer are safe!
    flexibleSpendingPool = rawFlexible - emergencyBuffer;
    bufferDipped = false;
    bufferDeficitAmount = 0;
  } else if (rawFlexible >= 0) {
    // Essentials are covered, but emergency buffer is partially eroded
    flexibleSpendingPool = 0;
    bufferDipped = true;
    bufferDeficitAmount = emergencyBuffer - rawFlexible;
  } else {
    // Critical: Even essentials cannot be fully covered!
    flexibleSpendingPool = 0;
    bufferDipped = true;
    bufferDeficitAmount = emergencyBuffer;
    isDeficit = true;
    deficitAmount = Math.abs(rawFlexible);
  }

  // Safe daily spend is calculated from the uncommitted flexible pool divided by remaining days
  const safeDailySpend = flexibleSpendingPool > 0
    ? Math.floor(flexibleSpendingPool / daysRemaining)
    : 0;

  // Savings goal evaluation:
  // Target = 2000, current = 1500, needed = 500
  const savingsTarget = budget.savingsGoalTarget;
  const savingsCurrent = budget.savingsGoalCurrent;
  const savingsNeeded = Math.max(0, savingsTarget - savingsCurrent);

  // Projected end month surplus if user sticks to safeDailySpend:
  // Since safeDailySpend * daysRemaining leaves the remainder of flexible pool,
  // the surplus is flexibleSpendingPool - (safeDailySpend * daysRemaining) + any extra
  const unspentFlexible = flexibleSpendingPool - (safeDailySpend * daysRemaining);
  const projectedEndMonthSurplus = unspentFlexible;

  // If flexible spending pool before daily spend is at least the needed savings (₹500),
  // user can achieve savings goal comfortably by allocating ~₹23/day of their flexible pool.
  const savingsAchievable = !bufferDipped && !isDeficit && flexibleSpendingPool >= savingsNeeded;

  // Transparent risk and health scoring
  let score = 100;
  const reasons: string[] = [];

  // 1. Buffer health (up to 30 pts)
  if (isDeficit) {
    score -= 30;
    reasons.push(`Budget is ₹${deficitAmount.toLocaleString('en-IN')} in deficit; essentials cannot be met.`);
  } else if (bufferDipped) {
    const dipPercent = Math.min(100, Math.round((bufferDeficitAmount / emergencyBuffer) * 100));
    const penalty = Math.round((dipPercent / 100) * 28);
    score -= penalty;
    reasons.push(`Emergency buffer dipped by ₹${bufferDeficitAmount.toLocaleString('en-IN')} (${dipPercent}%).`);
  } else {
    reasons.push(`Emergency buffer of ₹${emergencyBuffer.toLocaleString('en-IN')} is 100% protected.`);
  }

  // 2. Safe daily spending comfort (up to 35 pts)
  if (safeDailySpend >= 120) {
    reasons.push(`Safe daily allowance is a comfortable ₹${safeDailySpend}/day for flexible needs.`);
  } else if (safeDailySpend >= 75) {
    score -= 10;
    reasons.push(`Daily allowance is modest (₹${safeDailySpend}/day); mindful dining is recommended.`);
  } else if (safeDailySpend > 0) {
    score -= 22;
    reasons.push(`Daily spending room is narrow (₹${safeDailySpend}/day); discretionary expenses are tight.`);
  } else {
    score -= 35;
    reasons.push(`Zero daily flexible room remaining until next month's income.`);
  }

  // 3. Commitments safety (up to 20 pts)
  if (isDeficit) {
    score -= 20;
    reasons.push(`Room share or fixed bills face payment risk.`);
  } else {
    reasons.push(`All upcoming essential bills (₹${unpaidEssentials.toLocaleString('en-IN')}) are locked in safely.`);
  }

  // 4. Savings goal pace (up to 15 pts)
  if (savingsAchievable) {
    reasons.push(`Rainy-day goal (₹${savingsTarget.toLocaleString('en-IN')}) remains fully reachable.`);
  } else if (!bufferDipped && flexibleSpendingPool > 0) {
    score -= 8;
    reasons.push(`Goal completion will take a bit longer, but existing ₹${savingsCurrent.toLocaleString('en-IN')} is safe.`);
  } else {
    score -= 15;
    reasons.push(`Goal contributions paused to protect essential cash flow.`);
  }

  score = Math.max(5, Math.min(98, score));

  let riskLevel: RiskLevel = 'low';
  let healthSummary = 'Healthy & Balanced';

  if (score >= 72) {
    riskLevel = 'low';
    healthSummary = 'Comfortable Pace & Protected Cushions';
  } else if (score >= 42) {
    riskLevel = 'moderate';
    healthSummary = 'Manageable Margin · Keep Flexible Spends Steady';
  } else {
    riskLevel = 'high';
    healthSummary = 'High Pressure · Buffer or Essentials Under Strain';
  }

  const riskScore = 100 - score;

  return {
    income: budget.monthlyIncome,
    spentSoFar,
    remainingBalance: effectiveRemainingBalance,
    unpaidEssentials,
    projectedSubscriptions: committedSubscriptions + simulatedSubTotal,
    emergencyBuffer,
    flexibleSpendingPool,
    safeDailySpend,
    daysRemaining,
    savingsTarget,
    savingsCurrent,
    savingsNeeded,
    savingsAchievable,
    projectedEndMonthSurplus,
    riskLevel,
    riskScore,
    healthScore: score,
    healthSummary,
    healthReasons: reasons,
    bufferDipped,
    bufferDeficitAmount,
    isDeficit,
    deficitAmount,
  };
}

/**
 * Generates day-by-day forecast coordinates for 30-day timeline chart
 */
export function generate30DayForecast(
  budget: BudgetData,
  commitments: CommitmentItem[],
  pastExpenses: PastExpenseItem[],
  simulation: SimulationState
): DayForecastPoint[] {
  const currentPlan = calculatePlanMetrics(budget, commitments, pastExpenses, INITIAL_SIMULATION);
  const simPlan = calculatePlanMetrics(budget, commitments, pastExpenses, simulation);

  const points: DayForecastPoint[] = [];

  // Historical past points (Days 1 to currentDay)
  // Reconstruct historical balance trajectory
  let runningBalance = budget.monthlyIncome;
  
  // Map day to expenses
  const expensesByDay: Record<number, number> = {};
  pastExpenses.forEach((exp) => {
    expensesByDay[exp.day] = (expensesByDay[exp.day] || 0) + exp.amount;
  });

  for (let d = 1; d <= budget.currentDay; d++) {
    const daySpend = expensesByDay[d] || 0;
    runningBalance -= daySpend;

    const events: string[] = [];
    if (d === 1) events.push('Income: ₹10,000 received');
    if (d === 1) events.push('Phone recharge: ₹499 paid');
    if (d === 2) events.push('Music subscription: ₹199 paid');
    if (d === 4) events.push('Metro card reload: ₹550');
    if (d === budget.currentDay) events.push('Today · Current balance checkpoint');

    points.push({
      day: d,
      dayLabel: `Day ${d}`,
      currentBalance: runningBalance,
      simulatedBalance: runningBalance,
      isPast: d < budget.currentDay,
      isToday: d === budget.currentDay,
      events,
    });
  }

  // Future projection points (Days currentDay + 1 to 30)
  let projCurrentBal = currentPlan.remainingBalance;
  let projSimBal = simPlan.remainingBalance;

  // Daily drawdown rates
  const currentDailySpend = currentPlan.safeDailySpend;
  const simDailySpend = simPlan.safeDailySpend;

  // Unpaid commitments due on specific days
  const commitmentsByDay: Record<number, { name: string; amount: number }[]> = {};
  commitments
    .filter((c) => !c.isPaid && c.dueDateDay > budget.currentDay)
    .forEach((c) => {
      if (!commitmentsByDay[c.dueDateDay]) {
        commitmentsByDay[c.dueDateDay] = [];
      }
      commitmentsByDay[c.dueDateDay].push({ name: c.name, amount: c.amount });
    });

  // Future weekly subscription dates (every 7 days from next renewal)
  const musicSub = commitments.find((c) => c.id === 'com-music' && !c.isPaused);

  for (let d = budget.currentDay + 1; d <= budget.totalDays; d++) {
    const events: string[] = [];

    // Check commitments on day d
    if (commitmentsByDay[d]) {
      commitmentsByDay[d].forEach((item) => {
        projCurrentBal -= item.amount;
        projSimBal -= item.amount;
        events.push(`${item.name}: ₹${item.amount.toLocaleString('en-IN')} due`);
      });
    }

    // Weekly subscription charges
    if (musicSub && (d === 9 || d === 16 || d === 23)) {
      projCurrentBal -= musicSub.amount;
      projSimBal -= musicSub.amount;
      events.push(`Music sub: ₹${musicSub.amount}`);
    }

    // Daily safe living expenditure
    projCurrentBal -= currentDailySpend;
    projSimBal -= simDailySpend;

    if (d === budget.totalDays) {
      events.push('Cycle end: 30-day plan complete');
    }

    points.push({
      day: d,
      dayLabel: `Day ${d}`,
      currentBalance: Math.max(0, Math.round(projCurrentBal)),
      simulatedBalance: Math.round(projSimBal),
      isPast: false,
      isToday: false,
      events,
    });
  }

  return points;
}
