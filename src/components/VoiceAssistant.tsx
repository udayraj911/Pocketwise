/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Bot,
  User,
  Radio,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  VoiceAssistantState,
  VoiceInteractionTurn,
  ProposedFinancialAction,
  CalculatedPlan,
  BudgetData,
  CommitmentItem,
  EngineEvaluationResult,
  FinancialTransaction,
} from '../types/finance';
import { formatINR } from '../utils/financeCalculations';
import { getCurrentClock } from '../utils/dateTime';

interface VoiceAssistantProps {
  budget: BudgetData;
  commitments: CommitmentItem[];
  engineResult: EngineEvaluationResult | null;
  currentPlan: CalculatedPlan;
  onAddTransaction: (tx: FinancialTransaction) => Promise<void> | void;
  onUpdateCommitment?: (commitment: CommitmentItem) => Promise<void> | void;
  onUpdateBudgetGoal?: (newTarget: number) => Promise<void> | void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  budget,
  commitments,
  engineResult,
  currentPlan,
  onAddTransaction,
  onUpdateBudgetGoal,
}) => {
  const [state, setState] = useState<VoiceAssistantState>('idle');
  const [turns, setTurns] = useState<VoiceInteractionTurn[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ProposedFinancialAction | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Browser Speech Recognition & Speech Synthesis references
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize Speech Recognition once
  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Tuned for Indian English financial vernacular

    recognition.onstart = () => {
      setState('listening');
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          setCurrentTranscript(finalTranscript);
          handleProcessSpeech(finalTranscript);
        } else {
          interim += event.results[i][0].transcript;
          setCurrentTranscript(interim);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access denied. You can still use text input below.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('No speech detected. Try speaking closer to your mic or type below.');
      } else {
        setErrorMessage(`Speech input error (${event.error}). Feel free to type.`);
      }
      setState('idle');
    };

    recognition.onend = () => {
      if (state === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      stopSpeaking();
    };
  }, [isSpeechRecognitionSupported, engineResult, budget, commitments]);

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [turns, currentTranscript, state]);

  // Speech Output (Text to Speech)
  const speakText = (text: string) => {
    if (isMuted || !synthesisRef.current) return;

    stopSpeaking();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setState('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setState('idle');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setState('idle');
      };

      currentUtteranceRef.current = utterance;
      synthesisRef.current.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      setIsSpeaking(false);
      setState('idle');
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current && synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }
    setIsSpeaking(false);
    if (state === 'speaking') {
      setState('idle');
    }
  };

  const startListening = () => {
    stopSpeaking();
    setErrorMessage(null);
    setCurrentTranscript('');

    if (!isSpeechRecognitionSupported) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      // If already started, stop then restart
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setState('idle');
  };

  // Main processing pipeline
  const handleProcessSpeech = async (transcript: string) => {
    if (!transcript.trim()) return;

    setState('processing');
    setErrorMessage(null);
    setActionSuccessMessage(null);

    const clock = getCurrentClock();

    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechTranscript: transcript,
          conversationHistory: turns.map((t) => ({
            role: 'user',
            content: t.userTranscript,
          })).concat(
            turns.map((t) => ({
              role: 'assistant',
              content: t.assistantDisplayText,
            }))
          ),
          engineResult,
          budget,
          commitments,
          currentClock: {
            isoDate: clock.isoDate,
            timeString: clock.timeStr,
            weekday: clock.weekday,
            dayOfMonth: clock.day,
            monthName: clock.shortDateStr,
            year: clock.year,
            timezone: budget.timezone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process voice request');
      }

      const { spokenText, displayText, proposedAction } = data.data;

      const newTurn: VoiceInteractionTurn = {
        id: `turn-${Date.now()}`,
        userTranscript: transcript,
        assistantSpokenText: spokenText,
        assistantDisplayText: displayText,
        proposedAction: proposedAction || null,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isSpoken: !isMuted,
      };

      setTurns((prev) => [...prev, newTurn]);
      setCurrentTranscript('');
      setActiveAction(proposedAction || null);

      // Trigger spoken output
      speakText(spokenText);
    } catch (err) {
      console.error('Error processing speech:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to reach AI assistant');
      setState('error');
    }
  };

  const handleManualTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || state === 'processing') return;

    const query = textInput.trim();
    setTextInput('');
    handleProcessSpeech(query);
  };

  // Explicit user confirmation for proposed financial changes
  const handleConfirmAction = async (action: ProposedFinancialAction) => {
    setIsExecutingAction(true);
    setErrorMessage(null);

    try {
      const clock = getCurrentClock();

      if (action.actionType === 'add_expense' || action.actionType === 'record_income') {
        const isExpense = action.actionType === 'add_expense';
        const newTx: FinancialTransaction = {
          id: `tx-${Date.now()}`,
          name: action.title || (isExpense ? 'Logged Expense' : 'Recorded Income'),
          amount: Math.abs(action.amount || 0),
          currency: budget.currency || 'INR',
          category: action.category || (isExpense ? 'needs' : 'income'),
          customCategory: action.customCategory,
          type: isExpense ? 'actual_expense' : 'confirmed_income',
          status: 'completed',
          date: action.date || clock.isoDate,
          isPaid: true,
          notes: action.description || 'Voice assistant command',
          createdAt: new Date().toISOString(),
        };

        await onAddTransaction(newTx);
      } else if (action.actionType === 'adjust_savings_goal' && onUpdateBudgetGoal && action.targetGoalAmount) {
        await onUpdateBudgetGoal(action.targetGoalAmount);
      } else {
        // Generic transaction record
        const newTx: FinancialTransaction = {
          id: `tx-${Date.now()}`,
          name: action.title || 'Financial Record',
          amount: Math.abs(action.amount || 0),
          currency: budget.currency || 'INR',
          category: action.category || 'needs',
          type: 'planned_expense',
          status: 'scheduled',
          date: action.date || clock.isoDate,
          dueDate: action.dueDate,
          isPaid: false,
          notes: action.description,
          createdAt: new Date().toISOString(),
        };
        await onAddTransaction(newTx);
      }

      // Mark action confirmed
      setActiveAction(null);
      setActionSuccessMessage(`Successfully saved "${action.title}"! Your dashboard & ledger have been refreshed.`);

      // Voice acknowledge
      speakText(`Confirmed. I've updated your financial records.`);
    } catch (err) {
      console.error('Failed to execute proposed financial action:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Database update failed. Transaction was not recorded.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleCancelAction = () => {
    setActiveAction(null);
    speakText('Action cancelled. No changes were made to your records.');
  };

  const handleClearSession = () => {
    stopSpeaking();
    stopListening();
    setTurns([]);
    setActiveAction(null);
    setCurrentTranscript('');
    setErrorMessage(null);
    setActionSuccessMessage(null);
    setState('idle');
  };

  return (
    <div className="bg-white border border-[#E8E3DA] rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-[#F0EBE2]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#133226] text-[#D4F478] flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h3 className="text-sm sm:text-base font-extrabold text-[#1C2B22]">
                Real-Time Voice Assistant
              </h3>
              <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#E1F7C5] text-[#1E5225]">
                Phase 5 Live
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#5E7166] leading-snug">
              Conversational speech interface · Authoritative deterministic calculations
            </p>
          </div>
        </div>

        {/* Audio controls & clear session */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setIsMuted(!isMuted);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              isMuted
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                : 'bg-[#FAF8F5] border-[#E8E2D6] text-[#133226] hover:bg-[#F2EDE4]'
            }`}
            title={isMuted ? 'Unmute spoken responses' : 'Mute spoken responses'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Muted' : 'Voice Audio'}</span>
          </button>

          {turns.length > 0 && (
            <button
              onClick={handleClearSession}
              className="p-1 text-[#8B9B90] hover:text-[#1C2B22] hover:bg-[#FAF8F5] rounded-lg transition-all"
              title="Clear voice conversation session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Status Indicator Bar */}
      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D9] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              state === 'listening'
                ? 'bg-[#EF4444] animate-ping'
                : state === 'processing'
                ? 'bg-[#F59E0B] animate-spin'
                : state === 'speaking'
                ? 'bg-[#10B981] animate-pulse'
                : 'bg-[#8B9B90]'
            }`}
          />
          <span className="font-bold text-[#1C2B22]">
            {state === 'listening' && 'Listening to your speech... (Speak now)'}
            {state === 'processing' && 'Analyzing with financial engine & AI...'}
            {state === 'speaking' && 'Assistant is speaking response aloud...'}
            {state === 'idle' && 'Voice Assistant Ready'}
            {state === 'error' && 'Encountered an issue'}
          </span>
        </div>

        {/* Live status actions */}
        <div className="flex items-center gap-2">
          {state === 'speaking' && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] text-[11px] font-bold rounded-lg transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Interrupt / Stop Audio</span>
            </button>
          )}
          {state === 'listening' && (
            <button
              onClick={stopListening}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#133226] text-[#D4F478] text-[11px] font-bold rounded-lg transition-colors"
            >
              <Square className="w-3 h-3" />
              <span>Stop Listening</span>
            </button>
          )}
        </div>
      </div>

      {/* Error & Success Messages */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-bold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1 font-medium">{actionSuccessMessage}</span>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-[11px] font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Microphone Pulse Center */}
      <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-[#FAF8F5] to-white rounded-3xl border border-[#ECE6DC] space-y-4">
        <div className="relative">
          {state === 'listening' && (
            <div className="absolute inset-0 rounded-full bg-[#EF4444]/20 animate-ping" />
          )}
          {state === 'speaking' && (
            <div className="absolute inset-0 rounded-full bg-[#10B981]/20 animate-pulse" />
          )}

          <button
            onClick={state === 'listening' ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              state === 'listening'
                ? 'bg-[#EF4444] text-white hover:bg-[#DC2626] scale-105 shadow-[#EF4444]/30'
                : state === 'speaking'
                ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                : 'bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] hover:scale-105 shadow-[#133226]/20'
            }`}
            title={state === 'listening' ? 'Click to stop listening' : 'Click to start speaking'}
          >
            {state === 'listening' ? (
              <MicOff className="w-8 h-8 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs font-extrabold text-[#1C2B22]">
            {state === 'listening'
              ? 'Listening... Speak your financial request'
              : state === 'processing'
              ? 'Computing response...'
              : 'Tap microphone and speak naturally'}
          </p>
          <p className="text-[11px] text-[#5E7166]">
            Try: "How much can I safely spend today?" · "Can I afford ₹2,000?" · "I spent ₹450 on food"
          </p>
        </div>

        {/* Live speech waveform / interim text */}
        {currentTranscript && (
          <div className="px-4 py-2 bg-white rounded-xl border border-[#DDD7CD] max-w-md text-xs text-[#1C2B22] italic text-center animate-fadeIn shadow-xs">
            "{currentTranscript}"
          </div>
        )}
      </div>

      {/* Active Proposed Financial Action Card (Safeguard Confirmation) */}
      {activeAction && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] border-2 border-[#FCD34D] space-y-3 animate-slideUp">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#B45309]" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#92400E]">
                  Action Confirmation Required
                </h4>
                <p className="text-xs font-bold text-[#1C2B22]">
                  {activeAction.title}
                </p>
              </div>
            </div>
            {activeAction.amount !== undefined && (
              <span className="font-black text-sm text-[#1C2B22]">
                ₹{activeAction.amount.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <p className="text-xs text-[#78350F]">
            {activeAction.description}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleConfirmAction(activeAction)}
              disabled={isExecutingAction}
              className="flex-1 py-2 px-3 bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isExecutingAction ? (
                <div className="w-3.5 h-3.5 border-2 border-[#D4F478] border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Yes, Save to Records</span>
            </button>
            <button
              onClick={handleCancelAction}
              disabled={isExecutingAction}
              className="py-2 px-4 bg-white border border-[#DDD7CD] hover:bg-[#F2EDE4] text-[#5E7166] text-xs font-bold rounded-xl transition-all flex items-center gap-1"
            >
              <XCircle className="w-4 h-4 text-[#8B9B90]" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Conversation History / Transcript Area */}
      <div
        ref={transcriptScrollRef}
        className="max-h-72 overflow-y-auto space-y-3.5 pr-1 divide-y divide-[#F0EBE2]"
      >
        {turns.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8B9B90] space-y-1">
            <Bot className="w-6 h-6 mx-auto opacity-40 mb-1" />
            <p>Your spoken transcript and answers will appear here.</p>
            <p className="text-[11px]">
              The voice assistant respects your configured timezone (Asia/Kolkata) and live financial engine.
            </p>
          </div>
        ) : (
          turns.map((turn) => (
            <div key={turn.id} className="pt-3.5 space-y-2 text-xs first:pt-0">
              {/* User turn */}
              <div className="flex items-start gap-2.5 justify-end">
                <div className="bg-[#FAF8F5] border border-[#E8E2D6] rounded-2xl rounded-tr-xs p-3 max-w-[85%] text-[#1C2B22]">
                  <p className="font-medium">{turn.userTranscript}</p>
                  <span className="text-[10px] text-[#8B9B90] block text-right mt-1">
                    {turn.timestamp}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#1C2B22] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Assistant turn */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#133226] text-[#D4F478] flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#F6FAF7] border border-[#CFE4D4] rounded-2xl rounded-tl-xs p-3.5 max-w-[85%] text-[#1C2B22] space-y-2">
                  <p className="leading-relaxed whitespace-pre-line">{turn.assistantDisplayText}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#DCEBE0] text-[10px] text-[#5E7166]">
                    <span>Pocketwise Voice AI</span>
                    <button
                      onClick={() => speakText(turn.assistantSpokenText)}
                      className="hover:underline flex items-center gap-1 text-[#133226] font-bold"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay audio</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Accessible Text Fallback Input */}
      <form onSubmit={handleManualTextSubmit} className="pt-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your question or financial command (e.g. Can I afford ₹2,000?)..."
            disabled={state === 'processing'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#DDD7CD] bg-[#FAF8F5] text-xs text-[#1C2B22] focus:bg-white focus:outline-hidden focus:border-[#133226] transition-colors"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || state === 'processing'}
            className="px-4 py-2.5 bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
