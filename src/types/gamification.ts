/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BadgeCategory = 'savings' | 'streak' | 'simulation' | 'discipline';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 - 100
  currentValue: number;
  targetValue: number;
  unit: string;
}

export type ChallengePeriod = 'daily' | 'weekly';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  period: ChallengePeriod;
  rewardXp: number;
  progress: number; // 0 - 100
  current: number;
  target: number;
  unit: string;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresInDays?: number;
}

export interface GamificationProfile {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  levelTitle: string;
  safeSpendStreak: number; // in days
  bestStreak: number;
  lastEvaluatedDate: string;
  totalSimulationsRun: number;
  totalSimulationsNavigatedSafely: number;
  badges: Badge[];
  challenges: Challenge[];
}
