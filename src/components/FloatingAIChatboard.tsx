/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  Bot,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Radio,
  MessageSquare,
} from 'lucide-react';
import { BrandEmblem } from './BrandLogo';
import {
  BudgetData,
  CommitmentItem,
  EngineEvaluationResult,
  CalculatedPlan,
  FinancialTransaction,
} from '../types/finance';
import { AICoachPanel } from './AICoachPanel';
import { VoiceAssistant } from './VoiceAssistant';

interface FloatingAIChatboardProps {
  budget: BudgetData;
  commitments: CommitmentItem[];
  engineResult: EngineEvaluationResult;
  currentPlan: CalculatedPlan;
  onAddTransaction: (tx: FinancialTransaction) => Promise<void> | void;
  onUpdateBudgetGoal?: (newTarget: number) => Promise<void> | void;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
}

export const FloatingAIChatboard: React.FC<FloatingAIChatboardProps> = ({
  budget,
  commitments,
  engineResult,
  currentPlan,
  onAddTransaction,
  onUpdateBudgetGoal,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'voice'>('advisor');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // If chatboard is closed completely, render persistent floating button trigger
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            onToggleOpen(true);
            setIsMinimized(false);
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#133226] text-white shadow-2xl hover:bg-[#1A4233] hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-[#D4F478]/40 group"
          title="Open AI Financial Coach & Real-Time Voice Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4F478] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4F478]"></span>
          </span>
          <div className="flex items-center gap-1.5 text-[#D4F478]">
            <Sparkles className="w-4 h-4" />
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-xs font-black tracking-tight text-white group-hover:text-[#D4F478] transition-colors">
            AI Coach & Voice
          </span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-white/10 text-[#D4F478] rounded border border-white/20">
            ⌘K
          </kbd>
        </button>
      </div>
    );
  }

  // If open but minimized to a docked bottom pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40 bg-[#133226] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#234E3C] flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#1E5225] flex items-center justify-center text-[#D4F478]">
          {activeTab === 'voice' ? <Radio className="w-4 h-4 animate-pulse" /> : <Bot className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-xs font-bold leading-tight">AI Coach & Voice</p>
          <p className="text-[10px] text-[#BACDBF]">Docked · Grounded in Engine</p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="w-7 h-7 rounded-lg hover:bg-[#234E3C] flex items-center justify-center text-[#D4F478]"
            title="Restore chatboard"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-[#234E3C] flex items-center justify-center text-[#8B9B90] hover:text-white"
            title="Close chatboard"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 flex flex-col bg-[#FAF8F5] rounded-2xl sm:rounded-3xl border border-[#234E3C]/20 shadow-2xl overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'inset-x-3 bottom-3 top-12 sm:inset-auto sm:bottom-5 sm:right-5 w-auto sm:w-[720px] md:w-[760px] max-w-[92vw] h-auto sm:h-[82vh] max-h-[780px]'
          : 'inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-6 sm:right-6 w-auto sm:w-[660px] md:w-[680px] max-w-[90vw] h-auto sm:h-[72vh] max-h-[680px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="bg-[#133226] text-white px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center justify-between shrink-0 border-b border-[#234E3C] gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="shrink-0">
            <BrandEmblem sizePx={28} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white truncate">
                Pocketwise AI Assistant
              </h3>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#1E5225] text-[#D4F478] shrink-0 leading-none">
                Deterministic Grounding
              </span>
            </div>
            <p className="text-[11px] text-[#BACDBF] truncate mt-0.5">
              Authoritative financial guidance & hands-free voice operations
            </p>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-1">
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9.5px] font-mono text-[#BACDBF] bg-[#1E5225] rounded border border-[#2B7034]">
            Esc to close
          </span>
          <button
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-lg hover:bg-[#234E3C] flex items-center justify-center text-[#BACDBF] hover:text-white transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-7 h-7 rounded-lg hover:bg-[#234E3C] flex items-center justify-center text-[#BACDBF] hover:text-white transition-colors hidden sm:flex"
            title={isExpanded ? 'Restore size' : 'Expand full size'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onToggleOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-[#C2410C] flex items-center justify-center text-[#BACDBF] hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Chatboard Sub-Navigation Tabs */}
      <div className="bg-[#FAF8F5] px-3.5 py-2 sm:px-4 sm:py-2 border-b border-[#E8E3DA] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-[#EFE9DF] p-0.5 sm:p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              activeTab === 'advisor'
                ? 'bg-[#133226] text-[#D4F478] shadow-xs'
                : 'text-[#5E7166] hover:text-[#1C2B22]'
            }`}
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>AI Advisor & Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              activeTab === 'voice'
                ? 'bg-[#133226] text-[#D4F478] shadow-xs'
                : 'text-[#5E7166] hover:text-[#1C2B22]'
            }`}
          >
            <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Voice Assistant</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-semibold text-[#5E7166]">
          <BrandEmblem sizePx={14} />
          <span>Real User Data</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 no-scrollbar space-y-3 sm:space-y-4">
        {activeTab === 'advisor' ? (
          <AICoachPanel
            budget={budget}
            commitments={commitments}
            engineResult={engineResult}
            currentPlan={currentPlan}
          />
        ) : (
          <VoiceAssistant
            budget={budget}
            commitments={commitments}
            engineResult={engineResult}
            currentPlan={currentPlan}
            onAddTransaction={onAddTransaction}
            onUpdateBudgetGoal={onUpdateBudgetGoal}
          />
        )}
      </div>
    </div>
  );
};
