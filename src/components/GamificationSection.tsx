/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  Target,
  ShieldCheck,
  Shield,
  Compass,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Gift,
  Zap,
  Sliders,
} from 'lucide-react';
import {
  Badge,
  Challenge,
  GamificationProfile,
  BadgeCategory,
} from '../types/gamification';

interface GamificationSectionProps {
  profile: GamificationProfile;
  onClaimReward: (challengeId: string) => void;
  onOpenSimulator?: () => void;
  onOpenLedger?: () => void;
}

export const GamificationSection: React.FC<GamificationSectionProps> = ({
  profile,
  onClaimReward,
  onOpenSimulator,
  onOpenLedger,
}) => {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');

  // Track newly unlocked badges for subtle scale and glow animation
  const [newlyUnlockedBadgeIds, setNewlyUnlockedBadgeIds] = useState<Set<string>>(new Set());
  const prevUnlockedIdsRef = useRef<Set<string>>(
    new Set(profile.badges.filter((b) => b.unlocked).map((b) => b.id))
  );

  useEffect(() => {
    const currentUnlockedIds = new Set(profile.badges.filter((b) => b.unlocked).map((b) => b.id));
    const justUnlocked = new Set<string>();

    currentUnlockedIds.forEach((id) => {
      if (!prevUnlockedIdsRef.current.has(id)) {
        justUnlocked.add(id);
      }
    });

    if (justUnlocked.size > 0) {
      setNewlyUnlockedBadgeIds((prev) => new Set([...prev, ...justUnlocked]));
    }

    prevUnlockedIdsRef.current = currentUnlockedIds;
  }, [profile.badges]);

  const handleClearNewUnlock = (badgeId: string) => {
    setNewlyUnlockedBadgeIds((prev) => {
      const next = new Set(prev);
      next.delete(badgeId);
      return next;
    });
  };

  const handleTriggerSampleUnlock = () => {
    const targetBadge = profile.badges.find((b) => b.unlocked) || profile.badges[0];
    if (targetBadge) {
      setNewlyUnlockedBadgeIds((prev) => new Set([...prev, targetBadge.id]));
    }
  };

  // Filter badges
  const filteredBadges = profile.badges.filter((b) => {
    if (activeCategory !== 'all' && b.category !== activeCategory) return false;
    if (badgeFilter === 'unlocked' && !b.unlocked) return false;
    if (badgeFilter === 'in_progress' && b.unlocked) return false;
    return true;
  });

  const unlockedCount = profile.badges.filter((b) => b.unlocked).length;
  const totalBadges = profile.badges.length;

  // Render icon based on name
  const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const iconClass = `w-5 h-5 ${isUnlocked ? 'text-[#D4F478]' : 'text-[#8C9E91]'}`;
    switch (iconName) {
      case 'Trophy':
        return <Trophy className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Shield':
        return <Shield className={iconClass} />;
      case 'Target':
        return <Target className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  const getTierGlow = (tier: string, isUnlocked: boolean) => {
    if (!isUnlocked) return 'border-[#E5DFD4] bg-[#F7F4EE] opacity-75';
    switch (tier) {
      case 'gold':
        return 'border-[#F59E0B]/40 bg-gradient-to-br from-[#133226] to-[#1E4334] text-white shadow-md';
      case 'silver':
        return 'border-[#94A3B8]/40 bg-gradient-to-br from-[#133226] to-[#1C3D30] text-white shadow-md';
      default:
        return 'border-[#D97706]/30 bg-gradient-to-br from-[#133226] to-[#1A382C] text-white shadow-sm';
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & HERO CARD */}
      <div className="bg-[#133226] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-[#234E3C]">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4F478]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#D4F478]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Level & Title */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 text-xs font-black tracking-wide uppercase bg-[#D4F478] text-[#133226] rounded-lg">
                Level {profile.level}
              </span>
              <span className="text-xs font-bold text-[#BACDBF] uppercase tracking-wider">
                {profile.levelTitle}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Financial Discipline & Achievements
            </h2>
            <p className="text-sm text-[#BACDBF] leading-relaxed">
              Build lasting wealth habits through daily consistency. Earn badges for meeting savings targets,
              preserving your safe-to-spend streak, and stress-testing financial decisions.
            </p>

            {/* Level XP Progress Bar */}
            <div className="pt-2 space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-[#BACDBF]">
                <span>Wellness Experience</span>
                <span className="font-bold text-[#D4F478]">
                  {profile.currentXp} / {profile.nextLevelXp} XP
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#86EFAC] to-[#D4F478] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((profile.currentXp / profile.nextLevelXp) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Key Streak & Stats Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            {/* Safe Streak Pill */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#BACDBF] uppercase">Safe Streak</span>
                <Flame className="w-4 h-4 text-[#F97316]" />
              </div>
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-black text-[#D4F478]">
                  {profile.safeSpendStreak}
                  <span className="text-xs font-normal text-white ml-1">days</span>
                </p>
                <p className="text-[10px] text-[#BACDBF] mt-0.5">Best: {profile.bestStreak} days</p>
              </div>
            </div>

            {/* Badges Unlocked */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#BACDBF] uppercase">Badges</span>
                <Award className="w-4 h-4 text-[#D4F478]" />
              </div>
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {unlockedCount}
                  <span className="text-xs font-normal text-[#BACDBF] ml-1">/ {totalBadges}</span>
                </p>
                <p className="text-[10px] text-[#D4F478] mt-0.5 font-semibold">
                  {Math.round((unlockedCount / totalBadges) * 100)}% Complete
                </p>
              </div>
            </div>

            {/* Simulations Tested */}
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#BACDBF] uppercase">Scenarios</span>
                <Sliders className="w-4 h-4 text-[#93C5FD]" />
              </div>
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {profile.totalSimulationsNavigatedSafely}
                </p>
                <p className="text-[10px] text-[#BACDBF] mt-0.5">Safely stress-tested</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY & WEEKLY CHALLENGES SECTION */}
      <div className="bg-white border border-[#E8E3DA] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EBE2]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#133226] text-[#D4F478] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-lg font-black text-[#1C2B22]">Active Challenges & Rewards</h3>
            </div>
            <p className="text-xs text-[#5E7166]">
              Complete daily and weekly budgeting objectives to earn wellness XP and unlock tier bonuses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#234E3C] bg-[#EDF6EE] px-3 py-1 rounded-xl">
              🎁 Small Rewards & Habits
            </span>
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.challenges.map((ch) => {
            return (
              <div
                key={ch.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                  ch.isCompleted && !ch.isClaimed
                    ? 'border-[#D4F478] bg-[#F7FBEA] shadow-xs'
                    : ch.isClaimed
                    ? 'border-[#E8E3DA] bg-[#FAF8F5] opacity-80'
                    : 'border-[#E8E3DA] bg-white hover:border-[#133226]/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        ch.period === 'daily'
                          ? 'bg-[#133226] text-[#D4F478]'
                          : 'bg-[#0284C7] text-white'
                      }`}
                    >
                      {ch.period === 'daily' ? 'Daily Mission' : 'Weekly Goal'}
                    </span>
                    <span className="text-xs font-bold text-[#133226] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#133226]" />
                      +{ch.rewardXp} XP
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#1C2B22]">{ch.title}</h4>
                    <p className="text-xs text-[#5E7166] mt-0.5 leading-snug">{ch.description}</p>
                  </div>
                </div>

                {/* Progress bar & Action */}
                <div className="space-y-2 pt-2 border-t border-[#F0EBE2]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-[#5E7166]">
                      {ch.isCompleted ? 'Objective Fulfilled' : `${ch.current} / ${ch.target} ${ch.unit}`}
                    </span>
                    <span className="text-[11px] font-bold text-[#1C2B22]">{ch.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E8E3DA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ch.isCompleted ? 'bg-[#133226]' : 'bg-[#133226]/60'
                      }`}
                      style={{ width: `${Math.min(100, ch.progress)}%` }}
                    />
                  </div>

                  {/* Claim Button */}
                  <div className="pt-1 flex items-center justify-between">
                    {ch.expiresInDays && (
                      <span className="text-[10px] text-[#8C9E91] font-medium">
                        Resets in {ch.expiresInDays} days
                      </span>
                    )}
                    <div className="ml-auto">
                      {ch.isClaimed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#133226]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#133226]" />
                          Claimed (+{ch.rewardXp} XP)
                        </span>
                      ) : ch.isCompleted ? (
                        <button
                          onClick={() => onClaimReward(ch.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] rounded-xl shadow-xs transition-all animate-pulse"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Claim +{ch.rewardXp} XP</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#8C9E91] font-medium">In Progress</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BADGES SHOWCASE SECTION */}
      <div className="bg-white border border-[#E8E3DA] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE2]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#133226] text-[#D4F478] flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-lg font-black text-[#1C2B22]">Milestone Badges</h3>
            </div>
            <p className="text-xs text-[#5E7166]">
              Real awards calculated strictly from your active savings targets, spending streaks, and simulation decisions.
            </p>
          </div>

          {/* Filter Controls & Interactive Animation Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#F2EDE4] p-1 rounded-xl text-xs font-semibold text-[#1C2B22]">
              <button
                onClick={() => setBadgeFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  badgeFilter === 'all' ? 'bg-[#133226] text-white' : 'hover:bg-[#E5DFD4]'
                }`}
              >
                All ({profile.badges.length})
              </button>
              <button
                onClick={() => setBadgeFilter('unlocked')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  badgeFilter === 'unlocked' ? 'bg-[#133226] text-white' : 'hover:bg-[#E5DFD4]'
                }`}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                onClick={() => setBadgeFilter('in_progress')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  badgeFilter === 'in_progress' ? 'bg-[#133226] text-white' : 'hover:bg-[#E5DFD4]'
                }`}
              >
                In Progress ({totalBadges - unlockedCount})
              </button>
            </div>

            {/* Interactive Preview Trigger */}
            <button
              onClick={handleTriggerSampleUnlock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E1F7C5] text-[#133226] hover:bg-[#D4F478] transition-colors shadow-2xs"
              title="Click to trigger interactive scale and glow effect on a badge"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1E5225]" />
              <span>Preview Unlock Glow</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {(
            [
              { id: 'all', label: 'All Categories' },
              { id: 'savings', label: 'Savings Goals' },
              { id: 'streak', label: 'Safe Spends & Streaks' },
              { id: 'simulation', label: 'Scenario Navigations' },
              { id: 'discipline', label: 'Reserves & Ledger' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#133226] text-[#D4F478]'
                  : 'bg-[#FAF8F5] border border-[#E8E3DA] text-[#5E7166] hover:bg-[#F2EDE4]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges Grid with Interactive BadgeComponent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => (
            <BadgeComponent
              key={badge.id}
              badge={badge}
              isNewlyUnlocked={newlyUnlockedBadgeIds.has(badge.id)}
              onClearNewUnlock={handleClearNewUnlock}
              renderBadgeIcon={renderBadgeIcon}
              getTierGlow={getTierGlow}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INTERACTIVE BADGE COMPONENT WITH SUBTLE SCALE AND GLOW EFFECT
// ============================================================================
interface BadgeComponentProps {
  badge: Badge;
  isNewlyUnlocked: boolean;
  onClearNewUnlock: (badgeId: string) => void;
  renderBadgeIcon: (iconName: string, isUnlocked: boolean) => React.ReactNode;
  getTierGlow: (tier: string, isUnlocked: boolean) => string;
}

export const BadgeComponent: React.FC<BadgeComponentProps> = ({
  badge,
  isNewlyUnlocked,
  onClearNewUnlock,
  renderBadgeIcon,
  getTierGlow,
}) => {
  const [isAnimatingUnlock, setIsAnimatingUnlock] = useState(isNewlyUnlocked);
  const [showTip, setShowTip] = useState(false);

  // Trigger celebration animation when newly unlocked status is detected
  useEffect(() => {
    if (isNewlyUnlocked) {
      setIsAnimatingUnlock(true);
      const timer = setTimeout(() => {
        setIsAnimatingUnlock(false);
        onClearNewUnlock(badge.id);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isNewlyUnlocked, badge.id, onClearNewUnlock]);

  // Interactive click handler: allows users to interact with any badge
  const handleClick = () => {
    if (badge.unlocked) {
      // Re-trigger the subtle scale and radiant glow animation on demand
      setIsAnimatingUnlock(true);
      setTimeout(() => {
        setIsAnimatingUnlock(false);
      }, 1600);
    } else {
      setShowTip((prev) => !prev);
    }
  };

  const glowClass = getTierGlow(badge.tier, badge.unlocked);

  return (
    <div
      tabIndex={0}
      role="article"
      aria-label={`${badge.name} badge: ${badge.unlocked ? 'Unlocked' : 'Locked'}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 relative cursor-pointer overflow-hidden transform hover:-translate-y-1 hover:scale-[1.025] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#D4F478]/50 select-none ${glowClass} ${
        isAnimatingUnlock
          ? 'animate-badge-unlock shadow-2xl z-20 ring-2 ring-[#D4F478]'
          : badge.unlocked
          ? 'animate-badge-glow shadow-lg'
          : 'hover:border-[#133226]/40 hover:bg-[#F2EDE4]'
      }`}
    >
      {/* Expanding Halo Wave on Unlock / Interactive Trigger */}
      {isAnimatingUnlock && (
        <div
          className="absolute inset-0 rounded-2xl border-2 border-[#D4F478] bg-[#D4F478]/20 animate-badge-halo pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Celebratory Floating Pill on Unlock */}
      {isAnimatingUnlock && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-[#D4F478] text-[#133226] shadow-md animate-bounce">
            <Sparkles className="w-3 h-3 text-[#133226]" />
            Unlocked!
          </span>
        </div>
      )}

      {/* Dynamic Shimmer Light Sweep on Unlocked Badges */}
      {badge.unlocked && (
        <div
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/18 to-transparent pointer-events-none animate-shimmer"
          aria-hidden="true"
        />
      )}

      {/* Subtle ambient corner glow on unlocked cards */}
      {badge.unlocked && (
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#D4F478]/15 rounded-full blur-xl pointer-events-none transition-opacity group-hover:opacity-100" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
              badge.unlocked
                ? 'bg-[#1E4334] border border-[#D4F478]/60 shadow-[0_0_14px_rgba(212,244,120,0.35)]'
                : 'bg-[#E5DFD4] text-[#8C9E91]'
            }`}
          >
            {badge.unlocked ? (
              renderBadgeIcon(badge.iconName, true)
            ) : (
              <Lock className="w-4 h-4 text-[#8C9E91]" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {badge.unlocked && (
              <span className="text-[9px] font-bold text-[#D4F478] opacity-75 group-hover:opacity-100 hidden sm:inline">
                Tap to pulse
              </span>
            )}
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
                badge.tier === 'gold'
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 group-hover:bg-[#F59E0B]/30'
                  : badge.tier === 'silver'
                  ? 'bg-[#94A3B8]/20 text-[#CBD5E1] border border-[#94A3B8]/30 group-hover:bg-[#94A3B8]/30'
                  : 'bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/30 group-hover:bg-[#D97706]/30'
              }`}
            >
              {badge.tier}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <h4
            className={`text-sm font-black tracking-tight flex items-center gap-1.5 ${
              badge.unlocked ? 'text-white' : 'text-[#1C2B22]'
            }`}
          >
            <span>{badge.name}</span>
            {badge.unlocked && (
              <Sparkles className="w-3 h-3 text-[#D4F478] shrink-0 opacity-80 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
            )}
          </h4>
          <p
            className={`text-xs mt-1 leading-snug line-clamp-2 ${
              badge.unlocked ? 'text-[#BACDBF]' : 'text-[#5E7166]'
            }`}
          >
            {badge.description}
          </p>
        </div>
      </div>

      {/* Progress / Status Marker */}
      <div className="relative z-10 pt-2 border-t border-current/10 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className={badge.unlocked ? 'text-[#D4F478] flex items-center gap-1 font-bold' : 'text-[#5E7166]'}>
            {badge.unlocked ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-[#D4F478]" />
                <span>Unlocked</span>
              </>
            ) : (
              `${badge.currentValue} / ${badge.targetValue} ${badge.unit}`
            )}
          </span>
          <span className={badge.unlocked ? 'text-[#D4F478] font-bold' : 'text-[#8C9E91]'}>
            {badge.progress}%
          </span>
        </div>

        {!badge.unlocked && (
          <div className="w-full h-1.5 bg-[#E0D9CE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#133226] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, badge.progress)}%` }}
            />
          </div>
        )}

        {badge.unlocked && badge.unlockedAt && (
          <p className="text-[10px] text-[#BACDBF]">Earned {badge.unlockedAt}</p>
        )}

        {showTip && !badge.unlocked && (
          <p className="text-[10px] text-[#234E3C] bg-white/90 p-2 rounded-xl border border-[#E0D9CE] shadow-xs">
            💡 Keep logging daily to reach {badge.targetValue} {badge.unit} and unlock this badge!
          </p>
        )}
      </div>
    </div>
  );
};

