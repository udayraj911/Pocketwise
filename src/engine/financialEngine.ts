/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BudgetData,
  CommitmentItem,
  PastExpenseItem,
  FinancialTransaction,
  FinancialRisk,
  DatedCashPoint,
  EngineEvaluationResult,
  RiskType,
  RiskSeverity,
} from '../types/finance';
import { calculatePlanMetricsFromDates, getCurrentClock, formatDateHuman } from '../utils/dateTime';

/**
 * Currency arithmetic helper to prevent floating-point drift
 */
export function roundCurrency(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Validates a financial transaction against schema and bounds
 */
export function validateTransaction(tx: Partial<FinancialTransaction>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!tx.name || tx.name.trim().length === 0) {
    errors.push('Transaction name is required');
  }
  if (tx.amount === undefined || tx.amount === null || isNaN(tx.amount)) {
    errors.push('Transaction amount must be a valid number');
  } else if (tx.amount < 0) {
    errors.push('Transaction amount cannot be negative');
  }
  if (!tx.date || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
    errors.push('Transaction date must be in YYYY-MM-DD format');
  }
  if (
    tx.category &&
    !['needs', 'wants', 'savings', 'debt', 'emergency', 'income', 'custom'].includes(tx.category) &&
    !tx.customCategory
  ) {
    errors.push(`Invalid category: ${tx.category}`);
  }
  if (
    tx.type &&
    ![
      'actual_expense',
      'planned_expense',
      'confirmed_income',
      'estimated_income',
      'savings_transfer',
      'debt_payment',
      'internal_transfer',
    ].includes(tx.type)
  ) {
    errors.push(`Invalid transaction type: ${tx.type}`);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates the full deterministic financial plan.
 * Pure function: Given the exact same inputs, always produces identical outputs.
 */
export function evaluateFinancialEngine(params: {
  budget: BudgetData;
  commitments?: CommitmentItem[];
  pastExpenses?: PastExpenseItem[];
  transactions?: FinancialTransaction[];
  simulationSpend?: number;
  currentDateIso?: string;
}): EngineEvaluationResult {
  const {
    budget,
    commitments = [],
    pastExpenses = [],
    transactions = [],
    simulationSpend = 0,
    currentDateIso,
  } = params;

  const clock = getCurrentClock(budget.timezone || 'Asia/Kolkata');
  const todayIso = currentDateIso || clock.isoDate;

  // 1. Planning Period & Dates
  const planStart = budget.planStartDate || todayIso;
  const planEnd = budget.planEndDate || todayIso;
  const dateMetrics = calculatePlanMetricsFromDates(planStart, planEnd, todayIso);

  const totalPlanDays = dateMetrics.totalDays;
  const daysRemaining = dateMetrics.daysRemaining;

  // 2. Current Cash
  // Rule: Current cash represents money actually available now.
  // If budget.currentCash is explicitly provided, starting balance = budget.currentCash.
  // Otherwise, fallback to budget.monthlyIncome minus recorded pastExpenses.
  const startingBalance =
    budget.currentCash !== undefined && budget.currentCash !== null
      ? roundCurrency(budget.currentCash)
      : roundCurrency(budget.monthlyIncome);

  // Calculate actual expenses logged during this cycle (excluding historical baseline expenses already factored in)
  const actualCycleExpenses = transactions
    .filter((tx) => tx.type === 'actual_expense' && tx.status === 'completed' && tx.date >= planStart)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate past expenses for reporting
  const legacyExpensesTotal = pastExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalHistoricalSpent = roundCurrency(legacyExpensesTotal + actualCycleExpenses);

  // Current available cash right now:
  // If user provided an explicit currentCash, it already reflects historical expenses, so do not subtract them again!
  let currentCash = roundCurrency(
    budget.currentCash !== undefined
      ? budget.currentCash - actualCycleExpenses
      : budget.monthlyIncome - legacyExpensesTotal - actualCycleExpenses
  );

  // Apply simulated spend if active
  if (simulationSpend > 0) {
    currentCash = roundCurrency(currentCash - simulationSpend);
  }

  // 3. Inflows (Future Income)
  // Rule: Do not count future income as current cash before it arrives!
  // Future income is only recognized in the dated forecast and flexible fund pool.
  const futureIncomeTxs = transactions.filter(
    (tx) =>
      (tx.type === 'confirmed_income' || tx.type === 'estimated_income') &&
      tx.date > todayIso &&
      tx.date <= planEnd
  );

  const confirmedFutureInflows = futureIncomeTxs
    .filter((tx) => tx.type === 'confirmed_income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const estimatedFutureInflows = futureIncomeTxs
    .filter((tx) => tx.type === 'estimated_income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // 4. Unpaid Commitments & Bills
  // Rule: Only unpaid future commitments applicable to the plan reduce flexible funds.
  // Paid bills must not be deducted again.
  const remainingWeeks = Math.ceil(Math.max(1, daysRemaining) / 7);

  let unpaidCommitmentsTotal = 0;
  const unpaidItemsList: { name: string; amount: number; dueDate: string }[] = [];

  // Legacy commitments check
  commitments.forEach((c) => {
    if (c.isPaid) return; // Paid bills are never deducted again!

    if (c.category === 'subscription') {
      if (c.isPaused) return; // Paused subscriptions cost 0
      const subCost = c.frequency === 'weekly' ? c.amount * remainingWeeks : c.amount;
      unpaidCommitmentsTotal += subCost;
      unpaidItemsList.push({
        name: c.name,
        amount: subCost,
        dueDate: c.dueDate || todayIso,
      });
    } else {
      unpaidCommitmentsTotal += c.amount;
      unpaidItemsList.push({
        name: c.name,
        amount: c.amount,
        dueDate: c.dueDate || todayIso,
      });
    }
  });

  // Additional scheduled transactions in the transaction model
  transactions.forEach((tx) => {
    if (
      tx.status === 'scheduled' &&
      !tx.isPaid &&
      (tx.type === 'debt_payment' || tx.type === 'planned_expense') &&
      tx.date >= todayIso &&
      tx.date <= planEnd
    ) {
      unpaidCommitmentsTotal += tx.amount;
      unpaidItemsList.push({
        name: tx.name,
        amount: tx.amount,
        dueDate: tx.dueDate || tx.date,
      });
    }
  });

  unpaidCommitmentsTotal = roundCurrency(unpaidCommitmentsTotal);

  // 5. Emergency Reserve
  // Rule: An emergency reserve is an earmark, not an expense.
  // It reduces flexible funds, but does not reduce cash balance unless transferred out.
  const emergencyReserveAllocation = roundCurrency(budget.emergencyBuffer || 0);

  // 6. Savings Goals & Planned Savings
  // Rule: Planned savings contribution is an earmark until transferred.
  // Does not deduct from cash until completed, but subtracts from flexible allowance.
  const plannedSavingsContributions = transactions
    .filter((tx) => tx.type === 'savings_transfer' && tx.status === 'scheduled' && tx.date <= planEnd)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const existingSavingsTotal = roundCurrency(budget.savingsGoalCurrent || 0);
  const plannedSavingsTotal = roundCurrency(plannedSavingsContributions);

  // 7. Flexible Amount
  // Rule: Flexible funds =
  // Current available cash
  // + eligible confirmed future income within the plan
  // − unpaid commitments applicable to the plan
  // − emergency reserve allocation
  // − planned savings contributions not already completed.
  const rawFlexible = roundCurrency(
    currentCash +
      confirmedFutureInflows -
      unpaidCommitmentsTotal -
      emergencyReserveAllocation -
      plannedSavingsTotal
  );

  const flexibleAmount = rawFlexible;
  const isFlexibleDeficit = flexibleAmount < 0;
  const deficitAmount = isFlexibleDeficit ? Math.abs(flexibleAmount) : 0;

  // 8. Daily Spending Guidance
  // Rule: Flexible funds divided by remaining planning days.
  // If flexible amount is negative or missing data, do NOT present misleading positive allowance!
  const safeDailySpend =
    flexibleAmount > 0 && daysRemaining > 0
      ? Math.floor(flexibleAmount / daysRemaining)
      : flexibleAmount <= 0
      ? 0
      : null;

  // 9. Dated Cash Forecast
  // Rule: For each forecast date:
  // Projected cash = starting cash + confirmed inflows received by that date − actual/scheduled outflows due by that date.
  // Check for shortfalls on specific dates!
  const datedForecast: DatedCashPoint[] = [];
  const risks: FinancialRisk[] = [];

  let runningProjectedCash = currentCash;

  // Build daily points from today until planEnd
  const [startYear, startMonth, startDay] = planStart.split('-').map(Number);
  const [endYear, endMonth, endDay] = planEnd.split('-').map(Number);
  const [currYear, currMonth, currDay] = todayIso.split('-').map(Number);

  const startDateObj = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const endDateObj = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  const currDateObj = new Date(Date.UTC(currYear, currMonth - 1, currDay));

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const numForecastDays = Math.max(1, Math.round((endDateObj.getTime() - startDateObj.getTime()) / MS_PER_DAY) + 1);

  for (let i = 0; i < numForecastDays; i++) {
    const dObj = new Date(startDateObj.getTime() + i * MS_PER_DAY);
    const dIso = dObj.toISOString().split('T')[0];
    const isPast = dObj.getTime() < currDateObj.getTime();
    const isToday = dIso === todayIso;

    let inflowsOnDate = 0;
    let outflowsOnDate = 0;
    const events: string[] = [];

    // Inflows on this date
    futureIncomeTxs
      .filter((tx) => tx.date === dIso)
      .forEach((tx) => {
        inflowsOnDate += tx.amount;
        events.push(`${tx.name}: +${tx.amount.toLocaleString('en-IN')}`);
      });

    // Outflows on this date from unpaid commitments
    unpaidItemsList
      .filter((item) => item.dueDate === dIso)
      .forEach((item) => {
        outflowsOnDate += item.amount;
        events.push(`${item.name}: -${item.amount.toLocaleString('en-IN')}`);
      });

    // Daily flexible burn if future
    if (!isPast && !isToday && safeDailySpend && safeDailySpend > 0) {
      outflowsOnDate += safeDailySpend;
    }

    if (!isPast) {
      runningProjectedCash = roundCurrency(runningProjectedCash + inflowsOnDate - outflowsOnDate);
    }

    const isShortfall = runningProjectedCash < 0;
    const shortfallAmount = isShortfall ? Math.abs(runningProjectedCash) : 0;
    const bufferBreached = runningProjectedCash < emergencyReserveAllocation;

    datedForecast.push({
      date: dIso,
      dayIndex: i + 1,
      projectedCash: runningProjectedCash,
      inflowsOnDate: roundCurrency(inflowsOnDate),
      outflowsOnDate: roundCurrency(outflowsOnDate),
      events,
      isShortfall,
      shortfallAmount,
      bufferBreached,
    });

    // Detect risk: Cash shortfall on this date
    if (isShortfall && !isPast) {
      const existing = risks.find((r) => r.type === 'negative_cash');
      if (!existing) {
        risks.push({
          id: `risk-neg-${dIso}`,
          type: 'negative_cash',
          severity: 'critical',
          amount: shortfallAmount,
          date: dIso,
          title: `Projected Cash Deficit on ${formatDateHuman(dIso, budget.timezone)}`,
          explanation: `Cash drops to -₹${shortfallAmount.toLocaleString('en-IN')} on ${formatDateHuman(dIso, budget.timezone)} due to scheduled obligations exceeding available funds.`,
        });
      }
    }

    // Detect risk: Insufficient cash for a specific bill
    if (outflowsOnDate > 0 && runningProjectedCash < 0 && !isPast) {
      risks.push({
        id: `risk-bill-${dIso}`,
        type: 'insufficient_cash_for_bill',
        severity: 'high',
        amount: outflowsOnDate,
        date: dIso,
        title: `Bill Due Without Sufficient Cash on ${formatDateHuman(dIso, budget.timezone)}`,
        explanation: `Scheduled payments of ₹${outflowsOnDate.toLocaleString('en-IN')} on ${formatDateHuman(dIso, budget.timezone)} cannot be covered by the available balance.`,
      });
    }
  }

  // 10. Additional Deterministic Risk Evaluations
  // Risk: Negative flexible funds
  if (isFlexibleDeficit) {
    risks.push({
      id: 'risk-flex-deficit',
      type: 'negative_flexible_funds',
      severity: 'high',
      amount: deficitAmount,
      title: 'Flexible Spending Pool Exhausted',
      explanation: `Upcoming commitments and emergency earmarks exceed available funds by ₹${deficitAmount.toLocaleString('en-IN')}. Daily spending allowance is ₹0.`,
    });
  }

  // Risk: Emergency reserve breach
  if (currentCash < emergencyReserveAllocation && !isFlexibleDeficit) {
    const breachAmount = emergencyReserveAllocation - currentCash;
    risks.push({
      id: 'risk-buffer-breach',
      type: 'emergency_reserve_breach',
      severity: 'medium',
      amount: breachAmount,
      title: 'Emergency Cushion Dipped',
      explanation: `Available cash (₹${currentCash.toLocaleString('en-IN')}) is below your ₹${emergencyReserveAllocation.toLocaleString('en-IN')} protected emergency reserve by ₹${breachAmount.toLocaleString('en-IN')}.`,
    });
  }

  // Risk: Unconfirmed income dependency
  if (estimatedFutureInflows > 0 && unpaidCommitmentsTotal > currentCash) {
    risks.push({
      id: 'risk-unconfirmed-income',
      type: 'unconfirmed_income_dependency',
      severity: 'medium',
      amount: estimatedFutureInflows,
      title: 'Reliance on Unconfirmed Future Income',
      explanation: `Your plan relies on ₹${estimatedFutureInflows.toLocaleString('en-IN')} of estimated income to cover commitments. If this inflow is delayed, shortfalls will occur.`,
    });
  }

  // Risk: Savings compromise essentials
  if (plannedSavingsTotal > 0 && isFlexibleDeficit) {
    risks.push({
      id: 'risk-savings-conflict',
      type: 'savings_compromises_essentials',
      severity: 'high',
      amount: plannedSavingsTotal,
      title: 'Planned Savings Squeezing Living Essentials',
      explanation: `Allocating ₹${plannedSavingsTotal.toLocaleString('en-IN')} to savings leaves essential bills in deficit. Consider pausing savings transfers.`,
    });
  }

  // 11. Savings Goal Evaluation
  const target = budget.savingsGoalTarget || 0;
  const currentSaved = budget.savingsGoalCurrent || 0;
  const needed = Math.max(0, target - currentSaved);
  const isGoalAchievable = !isFlexibleDeficit && flexibleAmount >= needed;

  let goalStatusText = 'On Track';
  let goalReason = `Flexible surplus of ₹${flexibleAmount.toLocaleString('en-IN')} is sufficient to achieve your remaining goal of ₹${needed.toLocaleString('en-IN')}.`;

  if (target === 0) {
    goalStatusText = 'No Target Set';
    goalReason = 'Set a savings target to begin tracking progress.';
  } else if (currentSaved >= target) {
    goalStatusText = 'Goal Completed';
    goalReason = `You have fully achieved your goal of ₹${target.toLocaleString('en-IN')}!`;
  } else if (isFlexibleDeficit) {
    goalStatusText = 'Paused';
    goalReason = 'Savings contributions are paused to protect living essentials and room share.';
  } else if (!isGoalAchievable) {
    goalStatusText = 'Behind Pace';
    goalReason = `Flexible margin (₹${flexibleAmount.toLocaleString('en-IN')}) is less than the needed ₹${needed.toLocaleString('en-IN')}. Consider extending the deadline.`;
  }

  // 12. Transparent Explanations
  const explanations = {
    currentCash: `Current Cash (₹${currentCash.toLocaleString('en-IN')}) = Starting Balance (₹${startingBalance.toLocaleString('en-IN')}) − Actual Cycle Expenses (₹${actualCycleExpenses.toLocaleString('en-IN')})`,
    flexibleAmount: `Flexible Pool (₹${flexibleAmount.toLocaleString('en-IN')}) = Current Cash (₹${currentCash.toLocaleString('en-IN')}) + Confirmed Future Income (₹${confirmedFutureInflows.toLocaleString('en-IN')}) − Unpaid Commitments (₹${unpaidCommitmentsTotal.toLocaleString('en-IN')}) − Emergency Buffer (₹${emergencyReserveAllocation.toLocaleString('en-IN')}) − Planned Savings (₹${plannedSavingsTotal.toLocaleString('en-IN')})`,
    dailySpending:
      safeDailySpend !== null && safeDailySpend > 0
        ? `Safe Daily Allowance (₹${safeDailySpend.toLocaleString('en-IN')}/day) = Flexible Pool (₹${flexibleAmount.toLocaleString('en-IN')}) ÷ Remaining Days (${daysRemaining} days)`
        : `Safe Daily Allowance is ₹0 because flexible funds are exhausted or in deficit.`,
    emergencyReserve: `Emergency Reserve of ₹${emergencyReserveAllocation.toLocaleString('en-IN')} is fully earmarked and cannot be spent on casual items.`,
    forecast: `Dated forecast projects balance day-by-day considering exact payment due dates.`,
  };

  return {
    currentCash,
    startingBalance,
    totalHistoricalSpent,
    confirmedInflowsTotal: confirmedFutureInflows,
    estimatedInflowsTotal: estimatedFutureInflows,
    unpaidCommitmentsTotal,
    emergencyReserveAllocation,
    existingSavingsTotal,
    plannedSavingsTotal,
    flexibleAmount,
    safeDailySpend,
    isFlexibleDeficit,
    deficitAmount,
    daysRemaining,
    totalPlanDays,
    planStartDate: planStart,
    planEndDate: planEnd,
    datedForecast,
    risks,
    goalEvaluation: {
      target,
      currentSaved,
      needed,
      isAchievable: isGoalAchievable,
      statusText: goalStatusText,
      reason: goalReason,
    },
    explanations,
  };
}
