/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CommitmentCategory = 'essential' | 'subscription' | 'flexible';
export type Frequency = 'once' | 'weekly' | 'monthly';
export type RiskLevel = 'low' | 'moderate' | 'high';

export interface CommitmentItem {
  id: string;
  name: string;
  category: CommitmentCategory;
  amount: number;
  dueDateDay: number; // Day index (1-totalDays)
  dueDate?: string; // YYYY-MM-DD
  isPaid: boolean;
  frequency: Frequency;
  isPaused?: boolean; // For subscriptions
  note?: string;
  iconType?: string;
}

export interface PastExpenseItem {
  id: string;
  name: string;
  amount: number;
  day: number;
  date?: string; // YYYY-MM-DD
  category: string;
  essential: boolean;
}

export interface BudgetData {
  monthlyIncome: number;
  currentDay: number;
  totalDays: number;
  planStartDate: string; // e.g. "2026-10-01"
  planEndDate: string; // e.g. "2026-10-30"
  cycleStartFormatted: string; // e.g. "1 Oct 2026"
  cycleEndFormatted: string; // e.g. "30 Oct 2026"
  currency: string; // e.g. "INR"
  timezone: string; // e.g. "Asia/Kolkata"
  emergencyBuffer: number;
  savingsGoalTarget: number;
  savingsGoalCurrent: number;
  currentCash?: number; // Real available cash starting balance
  isOnboardingComplete?: boolean;
}

export interface SimulationState {
  oneTimePurchase: number;
  oneTimeTitle: string;
  weeklySubscription: number;
  weeklySubscriptionTitle: string;
  unexpectedExpense: number;
  unexpectedTitle: string;
}

export interface DayForecastPoint {
  day: number;
  dayLabel: string;
  date?: string; // YYYY-MM-DD
  currentBalance: number;
  simulatedBalance: number;
  isPast: boolean;
  isToday: boolean;
  events?: string[];
  isShortfall?: boolean;
  shortfallAmount?: number;
}

export interface CalculatedPlan {
  income: number;
  spentSoFar: number;
  remainingBalance: number;
  unpaidEssentials: number;
  projectedSubscriptions: number;
  emergencyBuffer: number;
  flexibleSpendingPool: number;
  safeDailySpend: number;
  daysRemaining: number;
  
  // Savings status
  savingsTarget: number;
  savingsCurrent: number;
  savingsNeeded: number;
  savingsAchievable: boolean;
  projectedEndMonthSurplus: number;
  
  // Risk and Health
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  healthScore: number; // 0-100
  healthSummary: string;
  healthReasons: string[];
  
  // Buffer warnings
  bufferDipped: boolean;
  bufferDeficitAmount: number;
  isDeficit: boolean;
  deficitAmount: number;
}

// ==========================================
// PHASE 2: FINANCIAL ENGINE & TRANSACTION MODEL
// ==========================================

export type TransactionCategory =
  | 'needs'
  | 'wants'
  | 'savings'
  | 'debt'
  | 'emergency'
  | 'income'
  | 'custom'
  | (string & {});

export type TransactionType =
  | 'actual_expense'
  | 'planned_expense'
  | 'confirmed_income'
  | 'estimated_income'
  | 'savings_transfer'
  | 'debt_payment'
  | 'internal_transfer';

export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'scheduled'
  | 'cancelled';

export interface FinancialTransaction {
  id: string;
  userId?: string;
  name: string;
  amount: number;
  currency: string;
  category: TransactionCategory;
  customCategory?: string; // Optional user-defined custom category name (e.g. "Pet Care", "Education", "Tech Subscriptions")
  type: TransactionType;
  status: TransactionStatus;
  date: string; // Transaction date (YYYY-MM-DD)
  dueDate?: string; // Due date if applicable
  isPaid?: boolean;
  isRecurring?: boolean;
  recurrenceRule?: 'weekly' | 'monthly' | 'once';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RiskType =
  | 'negative_cash'
  | 'insufficient_cash_for_bill'
  | 'savings_compromises_essentials'
  | 'emergency_reserve_breach'
  | 'negative_flexible_funds'
  | 'unconfirmed_income_dependency'
  | 'missing_critical_data';

export interface FinancialRisk {
  id: string;
  type: RiskType;
  severity: RiskSeverity;
  amount?: number;
  date?: string;
  title: string;
  explanation: string;
}

export interface DatedCashPoint {
  date: string;
  dayIndex: number;
  projectedCash: number;
  inflowsOnDate: number;
  outflowsOnDate: number;
  events: string[];
  isShortfall: boolean;
  shortfallAmount: number;
  bufferBreached: boolean;
}

export interface EngineEvaluationResult {
  currentCash: number;
  startingBalance: number;
  totalHistoricalSpent: number;
  confirmedInflowsTotal: number;
  estimatedInflowsTotal: number;
  unpaidCommitmentsTotal: number;
  emergencyReserveAllocation: number;
  existingSavingsTotal: number;
  plannedSavingsTotal: number;
  flexibleAmount: number;
  safeDailySpend: number | null;
  isFlexibleDeficit: boolean;
  deficitAmount: number;
  daysRemaining: number;
  totalPlanDays: number;
  planStartDate: string;
  planEndDate: string;
  datedForecast: DatedCashPoint[];
  risks: FinancialRisk[];
  goalEvaluation: {
    target: number;
    currentSaved: number;
    needed: number;
    isAchievable: boolean;
    statusText: string;
    reason: string;
  };
  explanations: {
    currentCash: string;
    flexibleAmount: string;
    dailySpending: string;
    emergencyReserve: string;
    forecast: string;
  };
}

// ==========================================
// PHASE 3: AI COACH, ROADMAP & SCENARIO SIMULATION
// ==========================================

export type RoadmapPriority = 'high' | 'medium' | 'low';
export type RoadmapTimeframe = 'immediate' | 'mid_cycle' | 'end_of_cycle';
export type RoadmapCategory =
  | 'bill_protection'
  | 'daily_guardrails'
  | 'savings_growth'
  | 'subscription_pruning'
  | 'debt_mitigation';

export interface RoadmapItem {
  id: string;
  userId?: string;
  priority: RoadmapPriority;
  title: string;
  description: string;
  category: RoadmapCategory;
  timeframe: RoadmapTimeframe;
  impactRupees?: number;
  isCompleted: boolean;
  targetDate?: string;
  createdAt?: string;
}

export interface AICoachAnalysis {
  id?: string;
  userId?: string;
  summary: string;
  cashFlowStatus: string;
  strengths: string[];
  vulnerabilities: string[];
  groundedBenchmark?: string;
  roadmap: RoadmapItem[];
  generatedAt: string;
}

export interface AIScenarioEvaluation {
  verdict: 'safe' | 'caution' | 'high_risk';
  verdictHeadline: string;
  impactSummary: string;
  tradeOffAdvice: string;
  alternatives: string[];
  evaluatedAt: string;
}

export interface AICoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  groundingSources?: { title: string; url: string }[];
}

// ==========================================
// PHASE 5: REAL-TIME VOICE AI ASSISTANT
// ==========================================

export type VoiceAssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export type VoiceActionType =
  | 'add_expense'
  | 'record_income'
  | 'update_transaction'
  | 'add_bill'
  | 'update_bill'
  | 'adjust_savings_goal'
  | 'set_emergency_buffer'
  | 'simulate_scenario'
  | 'request_analysis'
  | 'none';

export interface ProposedFinancialAction {
  id: string;
  actionType: VoiceActionType;
  title: string;
  description: string;
  amount?: number;
  category?: TransactionCategory;
  customCategory?: string;
  date?: string; // Resolved ISO date (YYYY-MM-DD)
  dueDate?: string; // Resolved ISO date for bills
  isPaid?: boolean;
  notes?: string;
  targetGoalAmount?: number;
  emergencyBufferAmount?: number;
  requiresConfirmation: boolean;
  isConfirmed?: boolean;
  isExecuted?: boolean;
  status: 'pending_confirmation' | 'confirmed' | 'cancelled' | 'executed' | 'failed';
}

export interface VoiceInteractionTurn {
  id: string;
  userTranscript: string;
  assistantSpokenText: string;
  assistantDisplayText: string;
  proposedAction?: ProposedFinancialAction | null;
  timestamp: string;
  isSpoken: boolean;
}
