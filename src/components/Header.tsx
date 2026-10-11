/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Calendar,
  RotateCcw,
  Sparkles,
  HelpCircle,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import { BudgetData } from '../types/finance';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  budget: BudgetData;
  onResetAll: () => void;
  onOpenHowItWorks: () => void;
  onOpenAuth: () => void;
  onOpenAIOnboarding: () => void;
  onOpenChatboard?: () => void;
  onNavigateOverview?: () => void;
  onOpen3DIntro?: () => void;
  onOpenPrivacyControls?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  budget,
  onResetAll,
  onOpenHowItWorks,
  onOpenAuth,
  onOpenAIOnboarding,
  onOpenChatboard,
  onNavigateOverview,
  onOpen3DIntro,
  onOpenPrivacyControls,
}) => {
  const { user, logout } = useAuth();
  const daysLeft = Math.max(0, budget.totalDays - budget.currentDay);

  return (
    <header className="w-full border-b border-[#E8E3DA] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Official Pocketwise Brand Logo (links back to main dashboard overview) */}
        <div className="shrink-0">
          <BrandLogo
            variant="full"
            theme="light"
            size="default"
            showTagline={false}
            onClick={onNavigateOverview}
          />
        </div>

        {/* Zone 2: Plan Progress & Cycle Info */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-[#5E7166] font-medium">
          <div className="flex items-center gap-1.5 bg-[#F2EDE4] px-3 py-1.5 rounded-lg text-[#1C2B22]">
            <Calendar className="w-3.5 h-3.5 text-[#133226]" />
            <span className="font-semibold">
              Day {budget.currentDay} of {budget.totalDays}
            </span>
            <span className="text-[#8B9B90]">·</span>
            <span>{daysLeft} days left</span>
          </div>
          <span className="text-[#8B9B90]">·</span>
          <span>
            {budget.cycleStartFormatted} – {budget.cycleEndFormatted}
          </span>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          {/* 3D Cinematic Intro replay button */}
          {onOpen3DIntro && (
            <button
              onClick={onOpen3DIntro}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#133226] hover:bg-[#F2EDE4] rounded-lg transition-colors whitespace-nowrap min-h-[36px]"
              title="Experience Pocketwise 3D Cinematic Intro"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4F478]" />
              <span>3D Intro</span>
            </button>
          )}

          {/* Floating AI Chatboard trigger */}
          <button
            onClick={onOpenChatboard || onOpenAIOnboarding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] rounded-xl transition-all shadow-xs min-h-[36px]"
            title="Open AI Financial Coach & Voice Assistant (Press ⌘K or Ctrl+K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4F478]" />
            <span>AI Coach & Voice</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#1C4334] text-[#D4F478] rounded border border-[#2B7034]">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={onOpenHowItWorks}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#133226] hover:bg-[#F2EDE4] rounded-lg transition-colors whitespace-nowrap min-h-[36px]"
            title="How Pocketwise calculates your numbers"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>

          {/* Privacy & Legal Controls Button */}
          {onOpenPrivacyControls && (
            <button
              onClick={onOpenPrivacyControls}
              className="p-2 text-xs font-medium text-[#5E7166] hover:text-[#122B1E] hover:bg-[#F2EDE4] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Privacy Policy, Terms & Data Controls"
            >
              <Shield className="w-4 h-4 text-[#22C55E]" />
            </button>
          )}

          {/* Auth Button: User Profile or Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-[#F2EDE4] pl-2.5 pr-1 py-1 rounded-xl text-xs">
              <span className="max-w-[110px] truncate font-semibold text-[#1C2B22]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                onClick={() => logout()}
                className="w-7 h-7 rounded-lg hover:bg-[#E5DFD4] flex items-center justify-center text-[#5E7166] hover:text-[#C2410C] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#133226] bg-[#F2EDE4] hover:bg-[#E5DFD4] rounded-xl transition-colors whitespace-nowrap min-h-[36px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onResetAll}
            className="p-2 text-xs font-medium text-[#8B9B90] hover:text-[#133226] hover:bg-[#F2EDE4] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Reset to default demo values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
