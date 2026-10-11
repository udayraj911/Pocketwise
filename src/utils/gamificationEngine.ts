/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GamificationProfile,
  Badge,
  Challenge,
} from '../types/gamification';
import {
  BudgetData,
  CommitmentItem,
  EngineEvaluationResult,
  FinancialTransaction,
} from '../types/finance';

const STORAGE_PREFIX = 'pocketwise_gamification_v1';

export const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, nextXp: 150, title: 'Mindful Planner' },
  { level: 2, minXp: 150, nextXp: 350, title: 'Budget Strategist' },
  { level: 3, minXp: 350, nextXp: 700, title: 'Wealth Guardian' },
  { level: 4, minXp: 700, nextXp: 1200, title: 'Financial Sovereign' },
  { level: 5, minXp: 1200, nextXp: 2000, title: 'Master of Capital' },
];

export function getLevelInfo(xp: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) {
      return LEVEL_THRESHOLDS[i];
    }
  }
  return LEVEL_THRESHOLDS[0];
}

const DEFAULT_BADGES: Badge[] = [
  {
    id: 'badge-savings-goal-half',
    name: 'Savings Sprinter',
    description: 'Achieve at least 50% of your current cycle savings target.',
    category: 'savings',
    tier: 'bronze',
    iconName: 'Target',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 50,
    unit: '%',
  },
  {
    id: 'badge-savings-goal-full',
    name: 'Goal Crusher',
    description: 'Hit 100% of your savings goal target without compromising essentials.',
    category: 'savings',
    tier: 'gold',
    iconName: 'Trophy',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 100,
    unit: '%',
  },
  {
    id: 'badge-streak-3',
    name: 'Green Zone Scout',
    description: 'Maintain a 3-day Safe-to-Spend streak with positive flexible funds.',
    category: 'streak',
    tier: 'bronze',
    iconName: 'Flame',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 3,
    unit: 'days',
  },
  {
    id: 'badge-streak-7',
    name: 'Safe-to-Spend Sentinel',
    description: 'Maintain a continuous 7-day streak within your safe daily spend limits.',
    category: 'streak',
    tier: 'silver',
    iconName: 'ShieldCheck',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 7,
    unit: 'days',
  },
  {
    id: 'badge-simulation-first',
    name: 'Scenario Explorer',
    description: 'Test a hypothetical purchase or scenario in the decision simulator.',
    category: 'simulation',
    tier: 'bronze',
    iconName: 'Compass',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 1,
    unit: 'tests',
  },
  {
    id: 'badge-simulation-safe',
    name: 'Scenario Strategist',
    description: 'Successfully navigate and test 3 financial scenarios with zero deficit.',
    category: 'simulation',
    tier: 'silver',
    iconName: 'Sparkles',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 3,
    unit: 'safe tests',
  },
  {
    id: 'badge-emergency-intact',
    name: 'Buffer Fortress',
    description: 'Fully preserve your emergency reserve with zero deficits.',
    category: 'discipline',
    tier: 'gold',
    iconName: 'Shield',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 100,
    unit: '%',
  },
  {
    id: 'badge-ledger-master',
    name: 'Clean Ledger',
    description: 'Track at least 3 transactions or custom expense categories.',
    category: 'discipline',
    tier: 'bronze',
    iconName: 'BookOpen',
    unlocked: false,
    progress: 0,
    currentValue: 0,
    targetValue: 3,
    unit: 'entries',
  },
];

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'daily-checkin',
    title: 'Daily Financial Check-in',
    description: 'Review your available cash, flexible pool, and days remaining today.',
    period: 'daily',
    rewardXp: 20,
    progress: 100,
    current: 1,
    target: 1,
    unit: 'check-in',
    isCompleted: true,
    isClaimed: false,
  },
  {
    id: 'daily-safe-spend',
    title: 'Stay in the Safe Zone',
    description: 'Keep your flexible spending pool positive and within safe daily limits.',
    period: 'daily',
    rewardXp: 30,
    progress: 0,
    current: 0,
    target: 1,
    unit: 'day',
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'daily-simulate',
    title: 'Stress-Test a Decision',
    description: 'Simulate at least 1 hypothetical purchase or subscription before spending.',
    period: 'daily',
    rewardXp: 25,
    progress: 0,
    current: 0,
    target: 1,
    unit: 'sim',
    isCompleted: false,
    isClaimed: false,
  },
  {
    id: 'weekly-shield-reserve',
    title: 'Shield the Emergency Cushion',
    description: 'Maintain your emergency buffer without dipping into reserves this week.',
    period: 'weekly',
    rewardXp: 50,
    progress: 0,
    current: 0,
    target: 100,
    unit: '%',
    isCompleted: false,
    isClaimed: false,
    expiresInDays: 5,
  },
  {
    id: 'weekly-recurring-audit',
    title: 'Recurring Commitment Audit',
    description: 'Audit your subscriptions and upcoming bills in the Commitments view.',
    period: 'weekly',
    rewardXp: 40,
    progress: 0,
    current: 0,
    target: 1,
    unit: 'audit',
    isCompleted: false,
    isClaimed: false,
    expiresInDays: 4,
  },
];

export function getInitialGamificationProfile(userId?: string): GamificationProfile {
  const today = new Date().toISOString().slice(0, 10);
  return {
    level: 1,
    currentXp: 20, // starts with 20 XP from first login
    nextLevelXp: 150,
    levelTitle: 'Mindful Planner',
    safeSpendStreak: 1,
    bestStreak: 1,
    lastEvaluatedDate: today,
    totalSimulationsRun: 0,
    totalSimulationsNavigatedSafely: 0,
    badges: DEFAULT_BADGES,
    challenges: DEFAULT_CHALLENGES,
  };
}

export function loadGamificationProfile(userId?: string): GamificationProfile {
  try {
    const key = `${STORAGE_PREFIX}_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with default badges and challenges to ensure newly added entries appear
      const badgesMap = new Map((parsed.badges || []).map((b: Badge) => [b.id, b]));
      const mergedBadges = DEFAULT_BADGES.map((b) => {
        const existing = badgesMap.get(b.id);
        return existing ? { ...b, ...existing } : b;
      });

      const challengesMap = new Map((parsed.challenges || []).map((c: Challenge) => [c.id, c]));
      const mergedChallenges = DEFAULT_CHALLENGES.map((c) => {
        const existing = challengesMap.get(c.id);
        return existing ? { ...c, ...existing } : c;
      });

      const levelInfo = getLevelInfo(parsed.currentXp || 20);

      return {
        ...parsed,
        level: levelInfo.level,
        levelTitle: levelInfo.title,
        nextLevelXp: levelInfo.nextXp,
        badges: mergedBadges,
        challenges: mergedChallenges,
      };
    }
  } catch (err) {
    console.error('Failed to load gamification profile from localStorage:', err);
  }
  return getInitialGamificationProfile(userId);
}

export function saveGamificationProfile(profile: GamificationProfile, userId?: string): void {
  try {
    const key = `${STORAGE_PREFIX}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save gamification profile to localStorage:', err);
  }
}

/**
 * Evaluates badges, streaks, and challenges based on live financial engine state.
 */
export function evaluateGamification(
  currentProfile: GamificationProfile,
  engineResult: EngineEvaluationResult,
  budget: BudgetData,
  transactions: FinancialTransaction[],
  commitments: CommitmentItem[]
): { updatedProfile: GamificationProfile; newlyUnlockedBadges: Badge[] } {
  const profile = { ...currentProfile };
  const newlyUnlockedBadges: Badge[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // 1. Streak update
  const isSafeToday = !engineResult.isFlexibleDeficit && engineResult.flexibleAmount >= 0;
  if (isSafeToday) {
    if (profile.lastEvaluatedDate !== today) {
      profile.safeSpendStreak = (profile.safeSpendStreak || 0) + 1;
      profile.bestStreak = Math.max(profile.bestStreak, profile.safeSpendStreak);
      profile.lastEvaluatedDate = today;
    }
  } else {
    // If in deficit, streak resets to 0
    profile.safeSpendStreak = 0;
  }

  // 2. Savings Goal progress calculation
  const savingsTarget = budget.savingsGoalTarget || 1;
  const savingsSaved = budget.savingsGoalCurrent || engineResult.existingSavingsTotal || 0;
  const savingsPercent = Math.min(100, Math.round((savingsSaved / savingsTarget) * 100));

  // 3. Emergency buffer calculation
  const emergencyTarget = budget.emergencyBuffer || 1;
  const bufferIntact = !engineResult.isFlexibleDeficit && engineResult.emergencyReserveAllocation >= emergencyTarget;
  const bufferPercent = bufferIntact ? 100 : Math.max(0, Math.round((engineResult.emergencyReserveAllocation / emergencyTarget) * 100));

  // 4. Update Badges
  profile.badges = profile.badges.map((badge) => {
    const updated = { ...badge };

    if (badge.id === 'badge-savings-goal-half') {
      updated.currentValue = savingsPercent;
      updated.progress = Math.min(100, Math.round((savingsPercent / 50) * 100));
      if (savingsPercent >= 50 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 50;
      }
    } else if (badge.id === 'badge-savings-goal-full') {
      updated.currentValue = savingsPercent;
      updated.progress = savingsPercent;
      if (savingsPercent >= 100 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 100;
      }
    } else if (badge.id === 'badge-streak-3') {
      updated.currentValue = profile.safeSpendStreak;
      updated.progress = Math.min(100, Math.round((profile.safeSpendStreak / 3) * 100));
      if (profile.safeSpendStreak >= 3 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 40;
      }
    } else if (badge.id === 'badge-streak-7') {
      updated.currentValue = profile.safeSpendStreak;
      updated.progress = Math.min(100, Math.round((profile.safeSpendStreak / 7) * 100));
      if (profile.safeSpendStreak >= 7 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 80;
      }
    } else if (badge.id === 'badge-simulation-first') {
      updated.currentValue = profile.totalSimulationsRun;
      updated.progress = profile.totalSimulationsRun >= 1 ? 100 : 0;
      if (profile.totalSimulationsRun >= 1 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 30;
      }
    } else if (badge.id === 'badge-simulation-safe') {
      updated.currentValue = profile.totalSimulationsNavigatedSafely;
      updated.progress = Math.min(100, Math.round((profile.totalSimulationsNavigatedSafely / 3) * 100));
      if (profile.totalSimulationsNavigatedSafely >= 3 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 70;
      }
    } else if (badge.id === 'badge-emergency-intact') {
      updated.currentValue = bufferPercent;
      updated.progress = bufferPercent;
      if (bufferPercent >= 100 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 60;
      }
    } else if (badge.id === 'badge-ledger-master') {
      const entryCount = transactions.length;
      updated.currentValue = entryCount;
      updated.progress = Math.min(100, Math.round((entryCount / 3) * 100));
      if (entryCount >= 3 && !updated.unlocked) {
        updated.unlocked = true;
        updated.unlockedAt = today;
        newlyUnlockedBadges.push(updated);
        profile.currentXp += 40;
      }
    }

    return updated;
  });

  // 5. Update Challenges
  profile.challenges = profile.challenges.map((c) => {
    const updated = { ...c };
    if (c.id === 'daily-safe-spend') {
      updated.current = isSafeToday ? 1 : 0;
      updated.progress = isSafeToday ? 100 : 0;
      updated.isCompleted = isSafeToday;
    } else if (c.id === 'daily-simulate') {
      const didSimulate = profile.totalSimulationsRun >= 1;
      updated.current = didSimulate ? 1 : 0;
      updated.progress = didSimulate ? 100 : 0;
      updated.isCompleted = didSimulate;
    } else if (c.id === 'weekly-shield-reserve') {
      updated.current = bufferPercent;
      updated.progress = bufferPercent;
      updated.isCompleted = bufferPercent >= 100;
    } else if (c.id === 'weekly-recurring-audit') {
      const hasAudited = commitments.length > 0;
      updated.current = hasAudited ? 1 : 0;
      updated.progress = hasAudited ? 100 : 0;
      updated.isCompleted = hasAudited;
    }
    return updated;
  });

  // 6. Recalculate Level
  const levelInfo = getLevelInfo(profile.currentXp);
  profile.level = levelInfo.level;
  profile.levelTitle = levelInfo.title;
  profile.nextLevelXp = levelInfo.nextXp;

  return { updatedProfile: profile, newlyUnlockedBadges };
}

export function recordSimulationEvent(
  profile: GamificationProfile,
  isNavigatedSafely: boolean
): GamificationProfile {
  const updated = { ...profile };
  updated.totalSimulationsRun += 1;
  if (isNavigatedSafely) {
    updated.totalSimulationsNavigatedSafely += 1;
  }
  return updated;
}

export function claimReward(
  profile: GamificationProfile,
  challengeId: string
): { updatedProfile: GamificationProfile; claimedXp: number } {
  const updated = { ...profile };
  let claimedXp = 0;

  updated.challenges = updated.challenges.map((ch) => {
    if (ch.id === challengeId && ch.isCompleted && !ch.isClaimed) {
      claimedXp = ch.rewardXp;
      return { ...ch, isClaimed: true };
    }
    return ch;
  });

  if (claimedXp > 0) {
    updated.currentXp += claimedXp;
    const levelInfo = getLevelInfo(updated.currentXp);
    updated.level = levelInfo.level;
    updated.levelTitle = levelInfo.title;
    updated.nextLevelXp = levelInfo.nextXp;
  }

  return { updatedProfile: updated, claimedXp };
}
