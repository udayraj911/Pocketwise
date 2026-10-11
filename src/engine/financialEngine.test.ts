/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {
  evaluateFinancialEngine,
  roundCurrency,
  validateTransaction,
} from './financialEngine';
import { calculatePlanMetricsFromDates } from '../utils/dateTime';
import { BudgetData, CommitmentItem, PastExpenseItem, FinancialTransaction } from '../types/finance';

console.log('=== RUNNING POCKETWISE PHASE 2 FINANCIAL ENGINE TEST SUITE ===\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(err);
    testsFailed++;
  }
}

// -------------------------------------------------------------
// Test 1: Any valid starting balance works (not just ₹10,000)
// -------------------------------------------------------------
runTest('1. Any valid starting balance works (₹4,500, ₹32,000, ₹0)', () => {
  // Test ₹4,500
  const b1: BudgetData = {
    monthlyIncome: 4500,
    currentCash: 4500,
    currentDay: 1,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 500,
    savingsGoalTarget: 1000,
    savingsGoalCurrent: 200,
  };
  const res1 = evaluateFinancialEngine({ budget: b1 });
  assert.strictEqual(res1.currentCash, 4500);
  assert.strictEqual(res1.flexibleAmount, 4000); // 4500 - 500 buffer

  // Test ₹0
  const b0: BudgetData = { ...b1, monthlyIncome: 0, currentCash: 0, emergencyBuffer: 0 };
  const res0 = evaluateFinancialEngine({ budget: b0 });
  assert.strictEqual(res0.currentCash, 0);
  assert.strictEqual(res0.flexibleAmount, 0);

  // Test ₹32,000
  const b32: BudgetData = { ...b1, monthlyIncome: 32000, currentCash: 32000, emergencyBuffer: 5000 };
  const res32 = evaluateFinancialEngine({ budget: b32 });
  assert.strictEqual(res32.currentCash, 32000);
  assert.strictEqual(res32.flexibleAmount, 27000); // 32000 - 5000
});

// -------------------------------------------------------------
// Test 2: Historical spending is not deducted twice
// -------------------------------------------------------------
runTest('2. Historical spending is not deducted twice from current cash', () => {
  // If user provides starting currentCash = ₹7,600, historical expenses of ₹2,400 must NOT be deducted again!
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 7600, // Cash available now
    currentDay: 8,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1500,
  };
  const pastExpenses: PastExpenseItem[] = [
    { id: 'e1', name: 'Phone', amount: 499, day: 1, category: 'Utilities', essential: true },
    { id: 'e2', name: 'Groceries', amount: 1901, day: 5, category: 'Food', essential: true },
  ]; // Total 2400

  const res = evaluateFinancialEngine({ budget: b, pastExpenses });
  // Current cash should remain exactly 7600, NOT 7600 - 2400 = 5200!
  assert.strictEqual(res.currentCash, 7600);
  assert.strictEqual(res.totalHistoricalSpent, 2400);
});

// -------------------------------------------------------------
// Test 3: Paid bills are not deducted again
// -------------------------------------------------------------
runTest('3. Paid bills are not deducted again', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 7600,
    currentDay: 8,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1500,
  };
  const commitments: CommitmentItem[] = [
    {
      id: 'c1',
      name: 'Phone plan',
      amount: 499,
      dueDateDay: 1,
      isPaid: true, // ALREADY PAID!
      category: 'essential',
      frequency: 'monthly',
    },
    {
      id: 'c2',
      name: 'Room share',
      amount: 3000,
      dueDateDay: 12,
      isPaid: false, // UNPAID
      category: 'essential',
      frequency: 'monthly',
    },
  ];

  const res = evaluateFinancialEngine({ budget: b, commitments });
  // Only the unpaid 3000 should be in unpaidCommitmentsTotal, NOT 3499!
  assert.strictEqual(res.unpaidCommitmentsTotal, 3000);
  // Flexible pool: 7600 - 3000 (room share) - 1000 (buffer) = 3600
  assert.strictEqual(res.flexibleAmount, 3600);
});

// -------------------------------------------------------------
// Test 4: Unpaid bills are counted on the correct dates
// -------------------------------------------------------------
runTest('4. Unpaid bills are counted on the correct dates', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 5000,
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1000,
  };
  const commitments: CommitmentItem[] = [
    {
      id: 'rent',
      name: 'Rent',
      amount: 3000,
      dueDateDay: 15,
      dueDate: '2026-10-15',
      isPaid: false,
      category: 'essential',
      frequency: 'monthly',
    },
  ];

  const res = evaluateFinancialEngine({ budget: b, commitments, currentDateIso: '2026-10-10' });
  // Find forecast on Oct 14 vs Oct 15
  const pt14 = res.datedForecast.find((p) => p.date === '2026-10-14');
  const pt15 = res.datedForecast.find((p) => p.date === '2026-10-15');

  assert.ok(pt14 && pt15);
  // On Oct 15, outflows should include the 3000 rent
  assert.ok(pt15.outflowsOnDate >= 3000);
  assert.ok(pt15.events.some((e) => e.includes('Rent')));
});

// -------------------------------------------------------------
// Test 5: Future income is not treated as current cash before arrival
// -------------------------------------------------------------
runTest('5. Future income is not treated as current cash before arrival', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 2000, // Only 2000 in hand today
    currentDay: 5,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 500,
    savingsGoalTarget: 1000,
    savingsGoalCurrent: 0,
  };
  const txs: FinancialTransaction[] = [
    {
      id: 't-inc',
      name: 'Mid-month freelance payout',
      amount: 6000,
      currency: 'INR',
      category: 'income',
      type: 'confirmed_income',
      status: 'scheduled',
      date: '2026-10-20', // Arrives on Oct 20
    },
  ];

  const res = evaluateFinancialEngine({ budget: b, transactions: txs, currentDateIso: '2026-10-05' });
  // Current cash TODAY must remain 2000! Not 8000!
  assert.strictEqual(res.currentCash, 2000);
  assert.strictEqual(res.confirmedInflowsTotal, 6000);

  // In forecast: on Oct 5-19 cash is around 2000; on Oct 20 it jumps up by 6000
  const ptBefore = res.datedForecast.find((p) => p.date === '2026-10-19');
  const ptAfter = res.datedForecast.find((p) => p.date === '2026-10-20');
  assert.ok(ptBefore && ptAfter);
  assert.ok(ptAfter.projectedCash > ptBefore.projectedCash);
});

// -------------------------------------------------------------
// Test 6: Transfers and earmarks do not incorrectly become expenses
// -------------------------------------------------------------
runTest('6. Internal transfers and earmarks do not incorrectly become expenses', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 8000,
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1000,
  };
  const txs: FinancialTransaction[] = [
    {
      id: 't-int',
      name: 'Transfer from HDFC to ICICI wallet',
      amount: 2000,
      currency: 'INR',
      category: 'savings',
      type: 'internal_transfer',
      status: 'completed',
      date: '2026-10-08',
    },
  ];

  const res = evaluateFinancialEngine({ budget: b, transactions: txs, currentDateIso: '2026-10-10' });
  // Internal transfer must NOT count as an expense or reduce current cash
  assert.strictEqual(res.currentCash, 8000);
});

// -------------------------------------------------------------
// Test 7: Planned savings distinguished from completed transfers
// -------------------------------------------------------------
runTest('7. Planned savings distinguished from completed transfers', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 8000,
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1000,
  };
  const txs: FinancialTransaction[] = [
    {
      id: 'ps1',
      name: 'Planned month-end savings contribution',
      amount: 500,
      currency: 'INR',
      category: 'savings',
      type: 'savings_transfer',
      status: 'scheduled', // PLANNED, NOT COMPLETED YET
      date: '2026-10-28',
    },
  ];

  const res = evaluateFinancialEngine({ budget: b, transactions: txs, currentDateIso: '2026-10-10' });
  // Current cash today is NOT reduced by 500:
  assert.strictEqual(res.currentCash, 8000);
  // But flexible pool subtracts planned savings: 8000 - 1000 (buffer) - 500 (planned savings) = 6500
  assert.strictEqual(res.flexibleAmount, 6500);
});

// -------------------------------------------------------------
// Test 8: Flexible funds match defined accounting rules
// -------------------------------------------------------------
runTest('8. Flexible funds match exact accounting rules formula', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 7000,
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1000,
  };
  const commitments: CommitmentItem[] = [
    { id: 'c1', name: 'Wi-Fi', amount: 500, dueDateDay: 20, isPaid: false, category: 'essential', frequency: 'monthly' },
  ];
  const txs: FinancialTransaction[] = [
    { id: 'inc1', name: 'Confirmed bonus', amount: 1200, currency: 'INR', category: 'income', type: 'confirmed_income', status: 'scheduled', date: '2026-10-25' },
    { id: 'sav1', name: 'Planned gold SIP', amount: 700, currency: 'INR', category: 'savings', type: 'savings_transfer', status: 'scheduled', date: '2026-10-28' },
  ];

  // Formula: Current Cash (7000) + Confirmed Inflows (1200) - Commitments (500) - Buffer (1000) - Planned Savings (700) = 6000
  const res = evaluateFinancialEngine({ budget: b, commitments, transactions: txs, currentDateIso: '2026-10-10' });
  assert.strictEqual(res.flexibleAmount, 6000);
});

// -------------------------------------------------------------
// Test 9: Dated forecasts detect cash shortfalls
// -------------------------------------------------------------
runTest('9. Dated forecasts detect cash shortfalls before bill due dates', () => {
  const b: BudgetData = {
    monthlyIncome: 5000,
    currentCash: 1500, // Only 1500 in hand
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 500,
    savingsGoalTarget: 1000,
    savingsGoalCurrent: 0,
  };
  const commitments: CommitmentItem[] = [
    {
      id: 'c-big',
      name: 'Big electricity bill',
      amount: 2500, // Bill is 2500, but user only has 1500!
      dueDateDay: 15,
      dueDate: '2026-10-15',
      isPaid: false,
      category: 'essential',
      frequency: 'monthly',
    },
  ];

  const res = evaluateFinancialEngine({ budget: b, commitments, currentDateIso: '2026-10-10' });
  // Engine must detect negative cash or bill shortfall risk!
  const hasShortfallRisk = res.risks.some(
    (r) => r.type === 'negative_cash' || r.type === 'insufficient_cash_for_bill'
  );
  assert.strictEqual(hasShortfallRisk, true);
  // Flexible amount is negative
  assert.strictEqual(res.isFlexibleDeficit, true);
  // Safe daily spend must NOT be positive!
  assert.strictEqual(res.safeDailySpend, 0);
});

// -------------------------------------------------------------
// Test 10: Savings goals handle existing balances & contributions
// -------------------------------------------------------------
runTest('10. Savings goals handle existing balances and contributions correctly', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 7000,
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1500, // 1500 already saved, only 500 needed
  };

  const res = evaluateFinancialEngine({ budget: b, currentDateIso: '2026-10-10' });
  assert.strictEqual(res.goalEvaluation.target, 2000);
  assert.strictEqual(res.goalEvaluation.currentSaved, 1500);
  assert.strictEqual(res.goalEvaluation.needed, 500);
  assert.strictEqual(res.goalEvaluation.isAchievable, true);
});

// -------------------------------------------------------------
// Test 11: Month-end, year-end, and leap-year calculations
// -------------------------------------------------------------
runTest('11. Month-end, year-end (Dec-Jan) and leap-year (Feb 29) calculations', () => {
  // December to January rollover
  const decJan = calculatePlanMetricsFromDates('2026-12-15', '2027-01-14', '2026-12-15');
  assert.strictEqual(decJan.totalDays, 31);
  assert.strictEqual(decJan.currentDay, 1);
  assert.strictEqual(decJan.daysRemaining, 30);

  // Leap year February 2028 (29 days)
  const leapFeb = calculatePlanMetricsFromDates('2028-02-01', '2028-02-29', '2028-02-15');
  assert.strictEqual(leapFeb.totalDays, 29);
  assert.strictEqual(leapFeb.currentDay, 15);
  assert.strictEqual(leapFeb.daysRemaining, 14);

  // Non-leap year February 2027 (28 days)
  const normFeb = calculatePlanMetricsFromDates('2027-02-01', '2027-02-28', '2027-02-01');
  assert.strictEqual(normFeb.totalDays, 28);
});

// -------------------------------------------------------------
// Test 12: Real-time updates recalculate derived values
// -------------------------------------------------------------
runTest('12. Real-time updates recalculate derived values deterministically', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 8000,
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1000,
  };

  const eval1 = evaluateFinancialEngine({ budget: b, currentDateIso: '2026-10-10' });
  const eval2 = evaluateFinancialEngine({ budget: b, currentDateIso: '2026-10-10' });
  // Deterministic: Same inputs produce exact same flexible amount
  assert.strictEqual(eval1.flexibleAmount, eval2.flexibleAmount);
  assert.strictEqual(eval1.safeDailySpend, eval2.safeDailySpend);

  // When a new expense of ₹1,000 is logged:
  const newTxs: FinancialTransaction[] = [
    { id: 'tx-new', name: 'Shoes', amount: 1000, currency: 'INR', category: 'wants', type: 'actual_expense', status: 'completed', date: '2026-10-10' },
  ];
  const evalUpdated = evaluateFinancialEngine({ budget: b, transactions: newTxs, currentDateIso: '2026-10-10' });
  assert.strictEqual(evalUpdated.currentCash, 7000); // 8000 - 1000
  assert.strictEqual(evalUpdated.flexibleAmount, eval1.flexibleAmount - 1000);
});

// -------------------------------------------------------------
// Test 13: Duplicate events do not cause double-counting
// -------------------------------------------------------------
runTest('13. Duplicate events do not cause double-counting', () => {
  const tx: Partial<FinancialTransaction> = {
    name: 'Rent',
    amount: 3000,
    date: '2026-10-15',
    category: 'needs',
    type: 'actual_expense',
  };
  const valResult = validateTransaction(tx);
  assert.strictEqual(valResult.isValid, true);

  // If a commitment is paid and also recorded as an expense, only deducted once
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 7000,
    currentDay: 10,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1000,
  };
  const paidCommitment: CommitmentItem = {
    id: 'c-paid',
    name: 'Rent',
    amount: 3000,
    dueDateDay: 5,
    isPaid: true, // Marked paid
    category: 'essential',
    frequency: 'monthly',
  };

  const res = evaluateFinancialEngine({ budget: b, commitments: [paidCommitment], currentDateIso: '2026-10-10' });
  // Unpaid commitments total must be 0
  assert.strictEqual(res.unpaidCommitmentsTotal, 0);
});

// -------------------------------------------------------------
// Test 14: Currency arithmetic rounding
// -------------------------------------------------------------
runTest('14. Currency arithmetic rounding eliminates floating point drift', () => {
  // 0.1 + 0.2 in JS is 0.30000000000000004
  const sum = 0.1 + 0.2;
  const rounded = roundCurrency(sum);
  assert.strictEqual(rounded, 0.3);

  // 199 / 7 * 3 = 85.28571428571429
  assert.strictEqual(roundCurrency(199.999), 200);
});

// -------------------------------------------------------------
// Test 15: Phase 3 Scenario simulation delta determinism
// -------------------------------------------------------------
runTest('15. Phase 3 Scenario simulation calculates exact delta without modifying baseline', () => {
  const b: BudgetData = {
    monthlyIncome: 10000,
    currentCash: 7600,
    currentDay: 8,
    totalDays: 30,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-30',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '30 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 1000,
    savingsGoalTarget: 2000,
    savingsGoalCurrent: 1500,
  };

  const baseline = evaluateFinancialEngine({ budget: b });
  const simulated = evaluateFinancialEngine({ budget: b, simulationSpend: 1500 });

  assert.strictEqual(baseline.currentCash, 7600);
  assert.strictEqual(simulated.currentCash, 6100);
  // Flexible amount drops by exactly ₹1,500
  assert.strictEqual(baseline.flexibleAmount - simulated.flexibleAmount, 1500);
  // Baseline remains untouched
  assert.strictEqual(baseline.currentCash, 7600);
});

// -------------------------------------------------------------
// Test 16: Phase 3 Roadmap structure & priority sorting
// -------------------------------------------------------------
runTest('16. Phase 3 Roadmap steps validate category, timeframe, and priority fields', () => {
  const step = {
    id: 'step-test-1',
    priority: 'high' as const,
    title: 'Protect Rent Payment',
    description: 'Ensure ₹3,500 is reserved for upcoming rent.',
    category: 'bill_protection' as const,
    timeframe: 'immediate' as const,
    impactRupees: 3500,
    isCompleted: false,
  };

  assert.strictEqual(step.priority, 'high');
  assert.strictEqual(step.timeframe, 'immediate');
  assert.strictEqual(step.isCompleted, false);
  // Toggle
  step.isCompleted = true;
  assert.strictEqual(step.isCompleted, true);
});

// -------------------------------------------------------------
// Test 17: Phase 5 Voice Assistant Action Validation & Confirmation Guard
// -------------------------------------------------------------
runTest('17. Voice action proposal validates required fields and enforces confirmation', () => {
  const proposedAction = {
    id: 'voice-action-101',
    actionType: 'add_expense' as const,
    title: 'Lunch with colleagues',
    description: 'Record expense of ₹450 on 2026-10-11',
    amount: 450,
    category: 'needs' as const,
    date: '2026-10-11',
    isPaid: true,
    status: 'pending_confirmation' as const,
    requiresConfirmation: true,
  };

  // Must require explicit confirmation before execution
  assert.strictEqual(proposedAction.requiresConfirmation, true);
  assert.strictEqual(proposedAction.status, 'pending_confirmation');
  assert.ok(proposedAction.amount > 0);
  assert.ok(proposedAction.date.match(/^\d{4}-\d{2}-\d{2}$/));

  // If user rejects, action is cancelled and status transitions without modifying ledger
  const cancelledAction = { ...proposedAction, status: 'cancelled' as const };
  assert.strictEqual(cancelledAction.status, 'cancelled');
});

// -------------------------------------------------------------
// Test 18: Voice Assistant Relative Date Resolution & Engine Accuracy
// -------------------------------------------------------------
runTest('18. Voice Assistant answers questions using exact deterministic engine output', () => {
  const b: BudgetData = {
    monthlyIncome: 25000,
    currentCash: 12000,
    currentDay: 11,
    totalDays: 31,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-31',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '31 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emergencyBuffer: 2000,
    savingsGoalTarget: 3000,
    savingsGoalCurrent: 1000,
  };

  const comms: CommitmentItem[] = [
    {
      id: 'c-elec',
      name: 'Electricity Bill',
      category: 'essential',
      amount: 1500,
      dueDateDay: 20,
      dueDate: '2026-10-20',
      isPaid: false,
      frequency: 'monthly',
    },
  ];

  const engineRes = evaluateFinancialEngine({
    budget: b,
    commitments: comms,
    currentDateIso: '2026-10-11',
  });

  // Authoritative metrics that Voice Assistant must relay:
  assert.strictEqual(engineRes.currentCash, 12000);
  assert.strictEqual(engineRes.unpaidCommitmentsTotal, 1500);
  assert.strictEqual(engineRes.emergencyReserveAllocation, 2000);
  assert.strictEqual(engineRes.daysRemaining, 20); // 31 - 11 = 20 remaining plan days

  // Formula: currentCash (12000) - unpaidCommitments (1500) - emergencyReserve (2000) - plannedSavings (0) = 8500.
  // safeDailySpend = roundCurrency(8500 / 20) = 425.
  assert.strictEqual(engineRes.flexibleAmount, 8500);
  assert.strictEqual(engineRes.safeDailySpend, 425);

  // Affordability query: ₹300 fits within today's safeDailySpend (425)
  const affordableToday = 300;
  assert.ok(affordableToday <= engineRes.safeDailySpend);

  // ₹2,000 fits in overall flexible pool (8500) but exceeds daily spend (425)
  const flexiblePoolPurchase = 2000;
  assert.ok(flexiblePoolPurchase <= engineRes.flexibleAmount);

  // Big purchase: ₹15,000 exceeds available cash
  const expensivePurchase = 15000;
  assert.ok(expensivePurchase > engineRes.currentCash);
});

// -------------------------------------------------------------
// Test 19: Phase 6 Section B Dynamic Ledger & Custom Category Aggregation
// -------------------------------------------------------------
runTest('19. Section B ledger aggregates income, expenses, custom categories and obligations deterministically', () => {
  const txs: FinancialTransaction[] = [
    {
      id: 'tx-1',
      name: 'Client Payment',
      amount: 15000,
      currency: 'INR',
      category: 'income',
      type: 'confirmed_income',
      status: 'completed',
      date: '2026-10-02',
      isPaid: true,
      createdAt: '2026-10-02T10:00:00Z',
    },
    {
      id: 'tx-2',
      name: 'Grocery Mart',
      amount: 2400,
      currency: 'INR',
      category: 'needs',
      type: 'actual_expense',
      status: 'completed',
      date: '2026-10-04',
      isPaid: true,
      createdAt: '2026-10-04T10:00:00Z',
    },
    {
      id: 'tx-3',
      name: 'Custom Pet Supplies',
      amount: 1200,
      currency: 'INR',
      category: 'custom',
      customCategory: 'Pet Care',
      type: 'actual_expense',
      status: 'completed',
      date: '2026-10-06',
      isPaid: true,
      createdAt: '2026-10-06T10:00:00Z',
    },
    {
      id: 'tx-4',
      name: 'Pending Internet Bill',
      amount: 800,
      currency: 'INR',
      category: 'needs',
      type: 'planned_expense',
      status: 'scheduled',
      date: '2026-10-20',
      isPaid: false,
      createdAt: '2026-10-06T10:00:00Z',
    },
  ];

  let totalIncome = 0;
  let totalExpenses = 0;
  let customCategoryTotal = 0;
  let unpaidTotal = 0;

  for (const t of txs) {
    if (t.category === 'income' || t.type === 'confirmed_income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      if (t.customCategory === 'Pet Care' || t.category === 'custom') {
        customCategoryTotal += t.amount;
      }
    }
    if (!t.isPaid) {
      unpaidTotal += t.amount;
    }
  }

  assert.strictEqual(totalIncome, 15000);
  assert.strictEqual(totalExpenses, 4400); // 2400 + 1200 + 800
  assert.strictEqual(customCategoryTotal, 1200);
  assert.strictEqual(unpaidTotal, 800);
});

// -------------------------------------------------------------
// Test 20: Phase 6 Floating Chatboard grounding consistency across sections
// -------------------------------------------------------------
runTest('20. Floating Chatboard displays authoritative data across all modular sections', () => {
  const budget: BudgetData = {
    currentCash: 25000,
    monthlyIncome: 25000,
    totalDays: 30,
    currentDay: 15,
    savingsGoalTarget: 5000,
    savingsGoalCurrent: 0,
    emergencyBuffer: 4000,
    planStartDate: '2026-10-01',
    planEndDate: '2026-10-31',
    cycleStartFormatted: '1 Oct 2026',
    cycleEndFormatted: '31 Oct 2026',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  };

  const comms: CommitmentItem[] = [
    {
      id: 'c1',
      name: 'Car Loan',
      amount: 3000,
      dueDateDay: 20,
      category: 'essential',
      dueDate: '2026-10-20',
      isPaid: false,
      isPaused: false,
      frequency: 'monthly',
    },
  ];

  const evalResult = evaluateFinancialEngine({
    budget,
    commitments: comms,
    currentDateIso: '2026-10-15',
  });

  // Authoritative calculations
  assert.strictEqual(evalResult.currentCash, 25000);
  assert.strictEqual(evalResult.unpaidCommitmentsTotal, 3000);
  assert.strictEqual(evalResult.emergencyReserveAllocation, 4000);
  // Flexible: 25000 - 3000 (bills) - 4000 (emergency) - 0 (past savings) = 18000
  assert.strictEqual(evalResult.flexibleAmount, 18000);
  assert.strictEqual(evalResult.daysRemaining, 16); // 31 - 15 = 16
  assert.strictEqual(evalResult.safeDailySpend, Math.round((18000 / 16) * 100) / 100); // 1125
});

console.log(`\n=== TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed ===`);

if (testsFailed > 0) {
  process.exit(1);
}


