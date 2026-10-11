/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { BrandEmblem } from './BrandLogo';
import { BudgetData, CommitmentItem, PastExpenseItem } from '../types/finance';
import { ReviewAndSaveScreen } from './ReviewAndSaveScreen';
import { formatINR } from '../utils/financeCalculations';
import { getDefaultCurrentMonthPlan, formatDateHuman } from '../utils/dateTime';

interface ChatMessage {
  id: string;
  role: 'model' | 'user';
  text: string;
}

interface AIOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBudget: BudgetData;
  initialCommitments: CommitmentItem[];
  initialExpenses: PastExpenseItem[];
  onSavePlan: (
    budget: BudgetData,
    commitments: CommitmentItem[],
    expenses: PastExpenseItem[]
  ) => Promise<void>;
}

export const AIOnboardingModal: React.FC<AIOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialBudget,
  initialCommitments,
  initialExpenses,
  onSavePlan,
}) => {
  const [step, setStep] = useState<'chat' | 'review'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extracted financial state being built during conversation
  const [extractedBudget, setExtractedBudget] = useState<BudgetData>({ ...initialBudget });
  const [extractedCommitments, setExtractedCommitments] = useState<CommitmentItem[]>([
    ...initialCommitments,
  ]);
  const [extractedExpenses, setExtractedExpenses] = useState<PastExpenseItem[]>([
    ...initialExpenses,
  ]);
  const [isReadyForReview, setIsReadyForReview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested quick response pills
  const suggestedChips = [
    '₹12,000 monthly income',
    '₹25,000 monthly allowance',
    'Current calendar month',
    'Room rent ₹3,500 due on 12th',
    'No subscriptions right now',
    'Keep ₹1,000 emergency buffer',
    'I want to save ₹2,000',
    'Ready to review my plan!',
  ];

  // Initialize initial greeting when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const plan = getDefaultCurrentMonthPlan(initialBudget.timezone);
      const greeting: ChatMessage = {
        id: 'msg-0',
        role: 'model',
        text: `Hey! I'm Sage, your Pocketwise financial coach. Let's build your 30-day game plan together. We won't judge, and there's no fixed ₹10,000 limit—everything is tailored to your real cash flow.\n\nTo start, what is your expected total income or available money for this upcoming month?`,
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length, initialBudget.timezone]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/coach/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newMessages.map((m) => ({ role: m.role, text: m.text })),
          currentExtracted: {
            budget: extractedBudget,
            commitments: extractedCommitments,
            expenses: extractedExpenses,
          },
          userMessage: text,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const { message, extractedData, isReadyForReview: ready } = resData.data;

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            role: 'model',
            text: message || 'Got it! What else would you like to plan for?',
          },
        ]);

        // Merge extracted data if returned
        if (extractedData) {
          if (extractedData.monthlyIncome !== null && extractedData.monthlyIncome !== undefined) {
            setExtractedBudget((prev) => ({
              ...prev,
              monthlyIncome: Number(extractedData.monthlyIncome),
              currency: extractedData.currency || prev.currency,
            }));
          }
          if (extractedData.emergencyBuffer !== null && extractedData.emergencyBuffer !== undefined) {
            setExtractedBudget((prev) => ({
              ...prev,
              emergencyBuffer: Number(extractedData.emergencyBuffer),
            }));
          }
          if (extractedData.savingsGoalTarget !== null && extractedData.savingsGoalTarget !== undefined) {
            setExtractedBudget((prev) => ({
              ...prev,
              savingsGoalTarget: Number(extractedData.savingsGoalTarget),
            }));
          }
          if (extractedData.commitments && Array.isArray(extractedData.commitments)) {
            const mappedCommitments: CommitmentItem[] = extractedData.commitments.map(
              (c: any, idx: number) => ({
                id: `com-ai-${idx}-${Date.now()}`,
                name: c.name || 'Commitment',
                amount: Number(c.amount) || 0,
                category: c.category || 'essential',
                dueDateDay: 15,
                dueDate: c.dueDate,
                isPaid: !!c.isPaid,
                frequency: c.frequency || 'monthly',
                note: c.note || '',
              })
            );
            if (mappedCommitments.length > 0) {
              setExtractedCommitments(mappedCommitments);
            }
          }
        }

        if (ready) {
          setIsReadyForReview(true);
        }
      } else {
        // Friendly fallback
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            role: 'model',
            text: "Got it! Let's also look at any upcoming living commitments like room rent, bills, or subscriptions. Do you have any due soon?",
          },
        ]);
      }
    } catch (err) {
      console.error('Error contacting coach:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'model',
          text: 'Thanks for sharing. Feel free to continue telling me about your expenses or click "Review & Save" below at any time!',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAndSave = async (
    finalBudget: BudgetData,
    finalCommitments: CommitmentItem[],
    finalExpenses: PastExpenseItem[]
  ) => {
    setIsSaving(true);
    try {
      await onSavePlan(finalBudget, finalCommitments, finalExpenses);
      onClose();
    } catch (err) {
      console.error('Error saving plan to Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl border border-[#E8E3DA] flex flex-col h-[90vh] max-h-[850px] animate-slideUp">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE2] shrink-0">
          <div className="flex items-center gap-3">
            <BrandEmblem sizePx={36} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#1C2B22]">
                  Pocketwise AI Financial Interview
                </h3>
                <span className="text-[10px] font-bold text-[#133226] bg-[#E1F7C5] px-2 py-0.5 rounded-full">
                  Sage · Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-[#5E7166]">
                Adaptive questions tailored to your lifestyle & income
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'chat' && (
              <button
                onClick={() => setStep('review')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#DDD7CD] rounded-xl text-xs font-bold text-[#133226] transition-colors"
              >
                <span>Review & Edit Draft</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-[#F2EDE4] flex items-center justify-center text-[#5E7166] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content View Switcher */}
        {step === 'review' ? (
          <div className="flex-1 overflow-hidden pt-4">
            <ReviewAndSaveScreen
              draftBudget={extractedBudget}
              draftCommitments={extractedCommitments}
              draftExpenses={extractedExpenses}
              onBackToChat={() => setStep('chat')}
              onConfirmAndSave={handleConfirmAndSave}
              isSaving={isSaving}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 pt-4">
            {/* Scrollable Conversation Thread */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((m) => {
                const isModel = m.role === 'model';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isModel ? 'bg-[#133226] text-[#D4F478]' : 'bg-[#E5DFD4] text-[#1C2B22]'
                      }`}
                    >
                      {isModel ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                        isModel
                          ? 'bg-[#FAF8F5] text-[#1C2B22] border border-[#EDE8E0]'
                          : 'bg-[#133226] text-white shadow-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#5E7166] pl-10">
                  <span className="w-2 h-2 rounded-full bg-[#133226] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#133226] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#133226] animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px]">Sage is tailoring your plan...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Ready for review callout banner if triggered */}
            {isReadyForReview && (
              <div className="my-2 p-3 bg-[#E1F7C5] border border-[#C5E89B] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#1E5225]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#1E5225] shrink-0" />
                  <span>
                    We have enough info to draft your budget! Ready to check the numbers?
                  </span>
                </div>
                <button
                  onClick={() => setStep('review')}
                  className="px-3 py-1 bg-[#133226] text-[#D4F478] rounded-xl font-bold text-xs hover:bg-[#1A4233] transition-colors shrink-0"
                >
                  Review Summary
                </button>
              </div>
            )}

            {/* Quick response chips */}
            <div className="pt-2 pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                {suggestedChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSendMessage(chip)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#F4EFEA] hover:bg-[#E8E2D6] text-[#1C2B22] font-medium transition-colors border border-[#E0DAD0]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="pt-2 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type your answer (e.g. ₹18,000 income, rent is ₹4,000)..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226] bg-[#FAF8F5]"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
