/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Send,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Flame,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  BudgetData,
  CommitmentItem,
  EngineEvaluationResult,
  CalculatedPlan,
  RoadmapItem,
  RoadmapTimeframe,
  AICoachAnalysis,
  AICoachMessage,
} from '../types/finance';
import { formatINR } from '../utils/financeCalculations';
import {
  subscribeToRoadmap,
  saveFullRoadmap,
  toggleRoadmapItemCompleted,
  saveAICoachInsight,
} from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface AICoachPanelProps {
  budget: BudgetData;
  commitments: CommitmentItem[];
  engineResult: EngineEvaluationResult;
  currentPlan: CalculatedPlan;
  onRefreshData?: () => void;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  budget,
  commitments,
  engineResult,
  currentPlan,
}) => {
  const { user } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'roadmap' | 'analysis' | 'chat'>('roadmap');

  // Roadmap State
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | RoadmapTimeframe>('all');
  const [analysis, setAnalysis] = useState<AICoachAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<AICoachMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hey! I'm Sage, your Pocketwise coach. You currently have **${formatINR(engineResult.currentCash)}** in cash with **${engineResult.daysRemaining} days** left in your cycle. Your safe daily allowance is **${formatINR(engineResult.safeDailySpend || 0)}/day**. What money decision are you pondering today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Sync roadmap from Firestore when user is authenticated
  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToRoadmap(user.uid, (remoteRoadmap) => {
      if (remoteRoadmap && remoteRoadmap.length > 0) {
        setRoadmap(remoteRoadmap as RoadmapItem[]);
      }
    });

    return () => unsub();
  }, [user]);

  // Initial load of AI Analysis & Roadmap
  useEffect(() => {
    if (!analysis && !isLoadingAnalysis && roadmap.length === 0) {
      fetchAIAnalysis();
    }
  }, [engineResult.currentCash, engineResult.flexibleAmount]);

  const fetchAIAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineResult,
          budget,
          commitments,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data);
        if (json.data.roadmap && json.data.roadmap.length > 0) {
          setRoadmap(json.data.roadmap);
          if (user) {
            saveFullRoadmap(user.uid, json.data.roadmap).catch(console.error);
            saveAICoachInsight(user.uid, json.data).catch(console.error);
          }
        }
      } else {
        throw new Error(json.error || 'Failed to generate financial analysis');
      }
    } catch (err) {
      console.error('Error fetching AI coach analysis:', err);
      setAnalysisError('Could not connect to AI advisor. Falling back to deterministic engine metrics.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Toggle step completion
  const handleToggleStep = async (stepId: string) => {
    const updated = roadmap.map((item) =>
      item.id === stepId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setRoadmap(updated);

    const targetItem = updated.find((item) => item.id === stepId);
    if (user && targetItem) {
      toggleRoadmapItemCompleted(user.uid, stepId, targetItem.isCompleted).catch(console.error);
    }
  };

  // Send message to coach
  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputMessage).trim();
    if (!text || isSendingMessage) return;

    const userMsg: AICoachMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          history: chatMessages,
          engineResult,
          budget,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-ai`,
            role: 'assistant',
            content: json.data.content,
            timestamp: json.data.timestamp,
            groundingSources: json.data.groundingSources,
          },
        ]);
      } else {
        throw new Error(json.error || 'Coach did not respond');
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: `I'm having trouble connecting right now, but your engine numbers are clear: you have ${formatINR(engineResult.currentCash)} available with a safe daily limit of ${formatINR(engineResult.safeDailySpend || 0)}/day.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const filteredRoadmap = roadmap.filter((item) => {
    if (timeframeFilter === 'all') return true;
    return item.timeframe === timeframeFilter;
  });

  const completedCount = roadmap.filter((r) => r.isCompleted).length;
  const progressPercent = roadmap.length > 0 ? Math.round((completedCount / roadmap.length) * 100) : 0;

  return (
    <div className="bg-white border border-[#E8E3DA] rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-3 pb-3.5 border-b border-[#F0EBE2]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#133226] text-[#D4F478] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-[19px] sm:text-[21px] font-[650] text-[#1C2B22] tracking-tight leading-snug">
                  AI Financial Coach & Roadmap
                </h2>
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#E1F7C5] text-[#1E5225] uppercase tracking-wider shrink-0 leading-none">
                  Phase 3
                </span>
              </div>
              <p className="text-[13px] sm:text-[13.5px] text-[#5E7166] mt-0.5 leading-snug">
                Objective guidance and step-by-step prioritization powered by Gemini and your financial engine.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
          <div className="bg-[#FAF8F5] p-0.5 sm:p-1 rounded-xl border border-[#EBE6DD] inline-flex items-center gap-1">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-[#133226] text-white shadow-xs'
                  : 'text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Action Roadmap ({completedCount}/{roadmap.length})
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analysis'
                  ? 'bg-[#133226] text-white shadow-xs'
                  : 'text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Health Analysis
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#133226] text-white shadow-xs'
                  : 'text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Ask Coach
            </button>
          </div>

          <button
            onClick={fetchAIAnalysis}
            disabled={isLoadingAnalysis}
            className="p-1.5 sm:p-2 rounded-xl bg-[#FAF8F5] text-[#133226] hover:bg-[#EFEAE2] border border-[#EBE6DD] transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh AI Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIONABLE ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="space-y-3.5">
          {/* Progress summary banner */}
          <div className="bg-[#FAF8F5] p-3 sm:p-3.5 rounded-xl border border-[#EDE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#1C2B22] uppercase tracking-wider">
                  Cycle Roadmap Progress
                </span>
                <span className="text-xs font-extrabold text-[#133226]">{progressPercent}%</span>
              </div>
              <p className="text-xs text-[#5E7166] leading-snug">
                Targeted steps tailored to protect your ₹{formatINR(engineResult.currentCash)} balance and keep you on track.
              </p>
            </div>

            {/* Timeframe Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 shrink-0">
              {[
                { id: 'all', label: 'All Steps' },
                { id: 'immediate', label: 'Immediate' },
                { id: 'mid_cycle', label: 'This Week' },
                { id: 'end_of_cycle', label: 'Cycle End' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTimeframeFilter(f.id as any)}
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                    timeframeFilter === f.id
                      ? 'bg-[#133226] text-[#D4F478]'
                      : 'bg-white text-[#5E7166] hover:bg-[#EFEAE2] border border-[#E5E0D8]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#E8E3DA] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#133226] h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Roadmap Steps List */}
          {isLoadingAnalysis && roadmap.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#133226] animate-spin mx-auto opacity-70" />
              <p className="text-xs font-medium text-[#5E7166]">
                Generating personalized financial roadmap based on your deterministic engine metrics...
              </p>
            </div>
          ) : filteredRoadmap.length === 0 ? (
            <div className="py-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#DDD7CD]">
              <p className="text-xs text-[#5E7166]">No steps match this filter.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRoadmap.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleStep(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    item.isCompleted
                      ? 'bg-[#F7F9F7] border-[#D4E2D8] opacity-75'
                      : 'bg-white border-[#E8E3DA] hover:border-[#133226] shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStep(item.id);
                    }}
                    className="mt-0.5 text-[#133226] hover:scale-110 transition-transform shrink-0"
                    aria-label={item.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#20703B]" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-[#9DAFA2]" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-xs sm:text-[13px] font-bold truncate ${
                            item.isCompleted ? 'line-through text-[#6D8073]' : 'text-[#1C2B22]'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                            item.priority === 'high'
                              ? 'bg-[#FEE5D8] text-[#9A3412]'
                              : item.priority === 'medium'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#E1F7C5] text-[#1E5225]'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      {item.impactRupees !== undefined && item.impactRupees > 0 && (
                        <span className="text-[11px] font-bold text-[#133226] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EDE8E0] tabular-nums shrink-0">
                          {item.category === 'daily_guardrails' ? `Limit: ` : `Impact: `}
                          {formatINR(item.impactRupees)}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        item.isCompleted ? 'text-[#87998D]' : 'text-[#4E6254]'
                      }`}
                    >
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2.5 pt-0.5 text-[10.5px] text-[#7E9184]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.timeframe === 'immediate'
                          ? 'Next 24-48 hours'
                          : item.timeframe === 'mid_cycle'
                          ? 'This week'
                          : 'By cycle end'}
                      </span>
                      <span className="capitalize">
                        • {item.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HEALTH ANALYSIS */}
      {activeTab === 'analysis' && (
        <div className="space-y-3.5">
          {isLoadingAnalysis ? (
            <div className="py-10 text-center space-y-2.5">
              <RefreshCw className="w-7 h-7 text-[#133226] animate-spin mx-auto opacity-70" />
              <p className="text-xs font-medium text-[#5E7166]">
                Analyzing budget health and cashflow stress points...
              </p>
            </div>
          ) : (
            <>
              {/* Executive Assessment Box */}
              <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-xl border border-[#EDE8E0] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#133226]" />
                    <span className="text-[11px] font-bold text-[#1C2B22] uppercase tracking-wider">
                      Coach Situation Summary
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E1F7C5] text-[#1E5225]">
                    {analysis?.cashFlowStatus || 'Evaluated'}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#1C2B22] leading-relaxed">
                  {analysis?.summary ||
                    `You currently hold ${formatINR(engineResult.currentCash)} in real cash with ${engineResult.daysRemaining} days remaining in your plan. Protecting your scheduled bills while pacing flexible spending ensures your ${formatINR(budget.emergencyBuffer)} cushion remains intact.`}
                </p>
              </div>

              {/* Strengths & Vulnerabilities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Strengths */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#F6FAF7] border border-[#D5E6D8] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E5225] uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Key Strengths
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#2A4B32]">
                    {(analysis?.strengths && analysis.strengths.length > 0
                      ? analysis.strengths
                      : [
                          `Emergency cushion of ${formatINR(engineResult.emergencyReserveAllocation)} actively ring-fenced.`,
                          `Deterministic safe daily allowance calculated at ${formatINR(engineResult.safeDailySpend || 0)}/day.`,
                          `Upcoming obligations tracked with verified calendar due dates.`,
                        ]
                    ).map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#20703B] shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vulnerabilities */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#FFF9F5] border border-[#FDE6D7] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9A3412] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Areas to Guard
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#7C2D12]">
                    {(analysis?.vulnerabilities && analysis.vulnerabilities.length > 0
                      ? analysis.vulnerabilities
                      : engineResult.risks.map((r) => r.explanation).slice(0, 3)
                    ).map((v, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Realistic Grounded Benchmark */}
              {analysis?.groundedBenchmark && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE8E0] flex items-start gap-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#133226] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#1C2B22]">
                      Grounded Benchmark Context
                    </span>
                    <p className="text-xs text-[#5E7166] leading-relaxed">
                      {analysis.groundedBenchmark}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: ASK COACH CONVERSATION */}
      {activeTab === 'chat' && (
        <div className="space-y-3">
          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {[
              'Can I afford weekend dining out?',
              'How can I speed up my savings goal?',
              'Should I pause any subscriptions?',
              'How do I handle an unexpected bill?',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                disabled={isSendingMessage}
                className="text-[10.5px] font-medium bg-[#FAF8F5] text-[#1C2B22] hover:bg-[#EFEAE2] border border-[#E5E0D8] px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Conversation Thread */}
          <div className="max-h-72 overflow-y-auto space-y-2.5 p-2.5 sm:p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E0]">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#133226] text-white rounded-br-xs'
                      : 'bg-white text-[#1C2B22] border border-[#E8E3DA] rounded-bl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Grounding web sources */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#F0EBE2] text-[10px] text-[#5E7166] space-y-0.5">
                      <span className="font-semibold text-[#1C2B22]">Sources:</span>
                      {msg.groundingSources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#133226] hover:underline truncate"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{s.title || s.url}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9.5px] text-[#8B9B90] mt-0.5 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isSendingMessage && (
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-[#E8E3DA] w-fit shadow-xs">
                <Bot className="w-3.5 h-3.5 text-[#133226] animate-bounce" />
                <span className="text-xs text-[#5E7166]">Sage is analyzing your finances...</span>
              </div>
            )}
          </div>

          {/* Input field */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Sage anything about your budget, bills, or plans..."
              className="flex-1 bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#1C2B22] focus:outline-none focus:ring-2 focus:ring-[#133226]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSendingMessage || !inputMessage.trim()}
              className="p-2 bg-[#133226] text-[#D4F478] rounded-lg hover:bg-[#1a4434] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Advisory boundary disclaimer */}
      <div className="pt-2.5 border-t border-[#F0EBE2] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px] text-[#8B9B90]">
        <span>Authoritative figures strictly derived from deterministic financial engine.</span>
        <span>Pocketwise AI is an advisor, not formal financial advice.</span>
      </div>
    </div>
  );
};
