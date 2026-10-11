/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {
  getInitialGamificationProfile,
  evaluateGamification,
  recordSimulationEvent,
  claimReward,
  getLevelInfo,
} from './gamificationEngine';
import {
  BudgetData,
  EngineEvaluationResult,
  FinancialTransaction,
  CommitmentItem,
} from '../types/finance';

console.log('=== RUNNING POCKETWISE GAMIFICATION ENGINE TESTS ===');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(err.message || err);
    testsFailed++;
  }
}

const mockBudget: BudgetData = {
  monthlyIncome: 30000,
  currentDay: 10,
  totalDays: 30,
  planStartDate: '2026-10-01',
  planEndDate: '2026-10-30',
  cycleStartFormatted: '1 Oct 2026',
  cycleEndFormatted: '30 Oct 2026',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  emergencyBuffer: 2000,
  savingsGoalTarget: 5000,
  savingsGoalCurrent: 2500,
  currentCash: 20000,
};

const mockEngineResult: EngineEvaluationResult = {
  currentCash: 20000,
  startingBalance: 20000,
  totalHistoricalSpent: 5000,
  confirmedInflowsTotal: 0,
  estimatedInflowsTotal: 0,
  unpaidCommitmentsTotal: 3000,
  emergencyReserveAllocation: 2000,
  existingSavingsTotal: 2500,
  plannedSavingsTotal: 2500,
  flexibleAmount: 12500,
  safeDailySpend: 625,
  isFlexibleDeficit: false,
  deficitAmount: 0,
  daysRemaining: 20,
  totalPlanDays: 30,
  planStartDate: '2026-10-01',
  planEndDate: '2026-10-30',
  datedForecast: [],
  risks: [],
  goalEvaluation: {
    target: 5000,
    currentSaved: 2500,
    needed: 2500,
    isAchievable: true,
    statusText: 'Achievable',
    reason: 'On track',
  },
  explanations: {
    currentCash: 'ok',
    flexibleAmount: 'ok',
    dailySpending: 'ok',
    emergencyReserve: 'ok',
    forecast: 'ok',
  },
};

// Test 1: Savings Goal Badge unlock
runTest('1. Unlocks Savings Sprinter badge when hitting 50% of savings target', () => {
  const profile = getInitialGamificationProfile('user-1');
  const { updatedProfile, newlyUnlockedBadges } = evaluateGamification(
    profile,
    mockEngineResult,
    mockBudget, // 2500 / 5000 = 50%
    [],
    []
  );

  const halfBadge = updatedProfile.badges.find((b) => b.id === 'badge-savings-goal-half');
  assert.ok(halfBadge);
  assert.strictEqual(halfBadge.unlocked, true);
  assert.strictEqual(halfBadge.progress, 100);
  assert.ok(newlyUnlockedBadges.some((b) => b.id === 'badge-savings-goal-half'));
});

// Test 2: Goal Crusher at 100%
runTest('2. Unlocks Goal Crusher badge when hitting 100% of savings target', () => {
  const profile = getInitialGamificationProfile('user-2');
  const fullBudget = { ...mockBudget, savingsGoalCurrent: 5000 };
  const { updatedProfile } = evaluateGamification(
    profile,
    mockEngineResult,
    fullBudget,
    [],
    []
  );

  const fullBadge = updatedProfile.badges.find((b) => b.id === 'badge-savings-goal-full');
  assert.ok(fullBadge);
  assert.strictEqual(fullBadge.unlocked, true);
  assert.strictEqual(fullBadge.currentValue, 100);
});

// Test 3: Safe-to-Spend Streak
runTest('3. Increments Safe-to-Spend streak and unlocks streak badges', () => {
  let profile = getInitialGamificationProfile('user-3');
  profile.safeSpendStreak = 2;
  profile.lastEvaluatedDate = '2026-10-09'; // previous day

  const { updatedProfile } = evaluateGamification(
    profile,
    mockEngineResult,
    mockBudget,
    [],
    []
  );

  assert.strictEqual(updatedProfile.safeSpendStreak, 3);
  const streakBadge = updatedProfile.badges.find((b) => b.id === 'badge-streak-3');
  assert.ok(streakBadge);
  assert.strictEqual(streakBadge.unlocked, true);
});

// Test 4: Deficit resets streak to zero
runTest('4. Deficit resets Safe-to-Spend streak to 0', () => {
  const profile = getInitialGamificationProfile('user-4');
  profile.safeSpendStreak = 5;

  const deficitEngineResult: EngineEvaluationResult = {
    ...mockEngineResult,
    isFlexibleDeficit: true,
    flexibleAmount: -1500,
  };

  const { updatedProfile } = evaluateGamification(
    profile,
    deficitEngineResult,
    mockBudget,
    [],
    []
  );

  assert.strictEqual(updatedProfile.safeSpendStreak, 0);
});

// Test 5: Scenario Navigation Badges
runTest('5. Simulation navigation records tests and unlocks Scenario Strategist', () => {
  let profile = getInitialGamificationProfile('user-5');

  // Run 1 simulation
  profile = recordSimulationEvent(profile, true);
  assert.strictEqual(profile.totalSimulationsRun, 1);
  assert.strictEqual(profile.totalSimulationsNavigatedSafely, 1);

  // Run 2 more safe simulations
  profile = recordSimulationEvent(profile, true);
  profile = recordSimulationEvent(profile, true);
  assert.strictEqual(profile.totalSimulationsRun, 3);
  assert.strictEqual(profile.totalSimulationsNavigatedSafely, 3);

  const { updatedProfile } = evaluateGamification(
    profile,
    mockEngineResult,
    mockBudget,
    [],
    []
  );

  const simBadge1 = updatedProfile.badges.find((b) => b.id === 'badge-simulation-first');
  const simBadgeSafe = updatedProfile.badges.find((b) => b.id === 'badge-simulation-safe');
  assert.ok(simBadge1?.unlocked);
  assert.ok(simBadgeSafe?.unlocked);
});

// Test 6: Claiming Daily and Weekly Challenges awards XP and triggers level progression
runTest('6. Claiming challenges awards XP and levels up user', () => {
  let profile = getInitialGamificationProfile('user-6');
  profile.currentXp = 135; // 15 XP away from Level 2 (150 XP)

  const { updatedProfile, claimedXp } = claimReward(profile, 'daily-checkin');
  assert.strictEqual(claimedXp, 20);
  assert.strictEqual(updatedProfile.currentXp, 155);
  assert.strictEqual(updatedProfile.level, 2);
  assert.strictEqual(updatedProfile.levelTitle, 'Budget Strategist');

  const claimedCh = updatedProfile.challenges.find((c) => c.id === 'daily-checkin');
  assert.ok(claimedCh?.isClaimed);
});

console.log(`\n=== GAMIFICATION TESTS: ${testsPassed} passed, ${testsFailed} failed ===`);
if (testsFailed > 0) {
  process.exit(1);
}
