/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  INITIAL_BUDGET,
  EMPTY_BUDGET,
  INITIAL_COMMITMENTS,
  INITIAL_PAST_EXPENSES,
  INITIAL_SIMULATION,
  formatINR,
} from './utils/financeCalculations';
import {
  BudgetData,
  CommitmentItem,
  PastExpenseItem,
  SimulationState,
  FinancialTransaction,
  CalculatedPlan,
  DayForecastPoint,
} from './types/finance';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  subscribeToBudgetPlan,
  subscribeToCommitments,
  subscribeToExpenses,
  subscribeToTransactions,
  saveUserPlanFull,
  saveUserBudget,
  saveTransaction,
  deleteTransaction,
  subscribeToGamificationProfile,
  saveGamificationProfileToFirestore,
} from './services/firebase';
import { calculatePlanMetricsFromDates, getCurrentClock, formatDateHuman } from './utils/dateTime';
import { evaluateFinancialEngine } from './engine/financialEngine';

import { Header } from './components/Header';
import { LiveClockBar } from './components/LiveClockBar';
import { OverviewHero } from './components/OverviewHero';
import { RiskAlertsBanner } from './components/RiskAlertsBanner';
import { DecisionSimulator } from './components/DecisionSimulator';
import { AICoachPanel } from './components/AICoachPanel';
import { VoiceAssistant } from './components/VoiceAssistant';
import { SavingsGoalCard } from './components/SavingsGoalCard';
import { CommitmentsList } from './components/CommitmentsList';
import { ForecastAndHealth } from './components/ForecastAndHealth';
import { TransactionsSection } from './components/TransactionsSection';
import { FloatingAIChatboard } from './components/FloatingAIChatboard';
import { GamificationSection } from './components/GamificationSection';
import { TransactionManagerModal } from './components/TransactionManagerModal';
import { ExpenseHistoryModal } from './components/ExpenseHistoryModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { AuthModal } from './components/AuthModal';
import { AIOnboardingModal } from './components/AIOnboardingModal';
import { PlanDatePickerModal } from './components/PlanDatePickerModal';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './components/TermsAndConditionsPage';
import { AccountPrivacyModal } from './components/AccountPrivacyModal';
import { Footer } from './components/Footer';
import { Emerald3DEnvironment } from './components/Emerald3DEnvironment';
import { CinematicStartupSequence } from './components/CinematicStartupSequence';
import {
  loadGamificationProfile,
  saveGamificationProfile,
  evaluateGamification,
  claimReward,
  recordSimulationEvent,
} from './utils/gamificationEngine';
import { GamificationProfile } from './types/gamification';

import {
  CheckCircle2,
  RotateCcw,
  LayoutDashboard,
  ArrowRightLeft,
  Sliders,
  Calendar,
  PiggyBank,
  TrendingUp,
  Layers,
  Sparkles,
  Award,
  Flame,
  Zap,
} from 'lucide-react';

function PocketwiseDashboard() {
  const { user } = useAuth();

  // Core Financial State
  const [budget, setBudget] = useState<BudgetData>(user ? EMPTY_BUDGET : INITIAL_BUDGET);
  const [commitments, setCommitments] = useState<CommitmentItem[]>(user ? [] : INITIAL_COMMITMENTS);
  const [pastExpenses, setPastExpenses] = useState<PastExpenseItem[]>(user ? [] : INITIAL_PAST_EXPENSES);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [simulation, setSimulation] = useState<SimulationState>(INITIAL_SIMULATION);

  // Modals & Panels
  const [previousCommittedState, setPreviousCommittedState] = useState<{
    pastExpenses: PastExpenseItem[];
    commitments: CommitmentItem[];
    transactions: FinancialTransaction[];
  } | null>(null);

  const [currentView, setCurrentView] = useState<'dashboard' | 'privacy-policy' | 'terms-and-conditions'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/privacy-policy') return 'privacy-policy';
      if (path === '/terms-and-conditions') return 'terms-and-conditions';
    }
    return 'dashboard';
  });
  const [showPrivacyControlsModal, setShowPrivacyControlsModal] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === '/privacy-policy') setCurrentView('privacy-policy');
        else if (path === '/terms-and-conditions') setCurrentView('terms-and-conditions');
        else setCurrentView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToView = (view: 'dashboard' | 'privacy-policy' | 'terms-and-conditions') => {
    setCurrentView(view);
    let path = '/';
    if (view === 'privacy-policy') path = '/privacy-policy';
    if (view === 'terms-and-conditions') path = '/terms-and-conditions';
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAIOnboardingModal, setShowAIOnboardingModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Phase 6: Modular Section Navigation & Floating AI Chatboard
  const [activeSection, setActiveSection] = useState<
    'all' | 'overview' | 'transactions' | 'simulator' | 'commitments' | 'savings' | 'forecast' | 'gamification'
  >('all');
  const [isAIChatboardOpen, setIsAIChatboardOpen] = useState(false);

  // Gamification & Habit Discipline State
  const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile>(() =>
    loadGamificationProfile(user?.uid)
  );

  // 3D Cinematic Startup Sequence State - plays every time website opens
  const [showCinematicStartup, setShowCinematicStartup] = useState<boolean>(true);

  // Sync with real Firestore when user is authenticated
  useEffect(() => {
    if (!user) {
      setBudget(INITIAL_BUDGET);
      setCommitments(INITIAL_COMMITMENTS);
      setPastExpenses(INITIAL_PAST_EXPENSES);
      setTransactions([]);
      return;
    }

    let unsubPlan = () => {};
    let unsubCommitments = () => {};
    let unsubExpenses = () => {};
    let unsubTransactions = () => {};
    let unsubGamification = () => {};

    try {
      unsubPlan = subscribeToBudgetPlan(user.uid, (remotePlan) => {
        if (remotePlan) {
          const clock = getCurrentClock(remotePlan.timezone);
          const dynamicDays = calculatePlanMetricsFromDates(
            remotePlan.planStartDate,
            remotePlan.planEndDate,
            clock.isoDate
          );
          setBudget({
            ...remotePlan,
            totalDays: dynamicDays.totalDays,
            currentDay: dynamicDays.currentDay,
            cycleStartFormatted: formatDateHuman(remotePlan.planStartDate, remotePlan.timezone),
            cycleEndFormatted: formatDateHuman(remotePlan.planEndDate, remotePlan.timezone),
          });
        } else {
          // New authenticated user with no saved plan
          setBudget(EMPTY_BUDGET);
          setCommitments([]);
          setPastExpenses([]);
          setTransactions([]);
          setShowAIOnboardingModal(true);
        }
      });

      unsubCommitments = subscribeToCommitments(user.uid, (remoteCommitments) => {
        setCommitments(remoteCommitments || []);
      });

      unsubExpenses = subscribeToExpenses(user.uid, (remoteExpenses) => {
        setPastExpenses(remoteExpenses || []);
      });

      unsubTransactions = subscribeToTransactions(user.uid, (remoteTxs) => {
        setTransactions((remoteTxs as FinancialTransaction[]) || []);
      });

      unsubGamification = subscribeToGamificationProfile(user.uid, (remoteProfile) => {
        if (remoteProfile) {
          setGamificationProfile((prev) => ({
            ...prev,
            ...remoteProfile,
          }));
        }
      });
    } catch (e) {
      console.error('Failed to attach Firestore listeners:', e);
    }

    return () => {
      unsubPlan();
      unsubCommitments();
      unsubExpenses();
      unsubTransactions();
      unsubGamification();
    };
  }, [user]);

  // Is active simulation
  const isSimulating = useMemo(() => {
    return (
      simulation.oneTimePurchase > 0 ||
      simulation.weeklySubscription > 0 ||
      simulation.unexpectedExpense > 0
    );
  }, [simulation]);

  const remainingWeeks = Math.ceil(Math.max(1, budget.totalDays - budget.currentDay) / 7);
  const totalSimSpend = useMemo(() => {
    return (
      simulation.oneTimePurchase +
      simulation.unexpectedExpense +
      simulation.weeklySubscription * remainingWeeks
    );
  }, [simulation, remainingWeeks]);

  // PHASE 2: Centralized Deterministic Financial Engine Evaluations
  const engineResult = useMemo(() => {
    return evaluateFinancialEngine({
      budget,
      commitments,
      pastExpenses,
      transactions,
    });
  }, [budget, commitments, pastExpenses, transactions]);

  const simulatedEngineResult = useMemo(() => {
    return evaluateFinancialEngine({
      budget,
      commitments,
      pastExpenses,
      transactions,
      simulationSpend: totalSimSpend,
    });
  }, [budget, commitments, pastExpenses, transactions, totalSimSpend]);

  // Map to unified presentation plans
  const currentPlan: CalculatedPlan = useMemo(() => {
    const isCritical = engineResult.risks.some((r) => r.severity === 'critical');
    const isHigh = engineResult.risks.some((r) => r.severity === 'high');
    const isMed = engineResult.risks.some((r) => r.severity === 'medium');

    const riskLevel = isCritical || isHigh ? 'high' : isMed ? 'moderate' : 'low';
    const healthScore = Math.max(5, Math.min(98, 100 - (isCritical ? 50 : isHigh ? 35 : isMed ? 20 : 5)));

    return {
      income: budget.monthlyIncome,
      spentSoFar: engineResult.totalHistoricalSpent,
      remainingBalance: engineResult.currentCash,
      unpaidEssentials: engineResult.unpaidCommitmentsTotal,
      projectedSubscriptions: commitments
        .filter((c) => c.category === 'subscription' && !c.isPaused && !c.isPaid)
        .reduce((sum, c) => sum + (c.frequency === 'weekly' ? c.amount * remainingWeeks : c.amount), 0),
      emergencyBuffer: engineResult.emergencyReserveAllocation,
      flexibleSpendingPool: Math.max(0, engineResult.flexibleAmount),
      safeDailySpend: engineResult.safeDailySpend || 0,
      daysRemaining: engineResult.daysRemaining,
      savingsTarget: budget.savingsGoalTarget,
      savingsCurrent: budget.savingsGoalCurrent,
      savingsNeeded: Math.max(0, budget.savingsGoalTarget - budget.savingsGoalCurrent),
      savingsAchievable: engineResult.goalEvaluation.isAchievable,
      projectedEndMonthSurplus: Math.max(0, engineResult.flexibleAmount - (engineResult.safeDailySpend || 0) * engineResult.daysRemaining),
      riskLevel,
      riskScore: 100 - healthScore,
      healthScore,
      healthSummary: isCritical
        ? 'Cash Shortfall Detected · Immediate Attention Required'
        : isHigh
        ? 'Flexible Margin Exhausted · Prioritizing Commitments'
        : isMed
        ? 'Tight Cushion · Mindful Spending Recommended'
        : 'Healthy & Balanced Trajectory',
      healthReasons: engineResult.risks.map((r) => r.explanation).slice(0, 3),
      bufferDipped: engineResult.currentCash < engineResult.emergencyReserveAllocation,
      bufferDeficitAmount: Math.max(0, engineResult.emergencyReserveAllocation - engineResult.currentCash),
      isDeficit: engineResult.isFlexibleDeficit,
      deficitAmount: engineResult.deficitAmount,
    };
  }, [budget, commitments, engineResult, remainingWeeks]);

  const simulatedPlan: CalculatedPlan = useMemo(() => {
    const isCritical = simulatedEngineResult.risks.some((r) => r.severity === 'critical');
    const isHigh = simulatedEngineResult.risks.some((r) => r.severity === 'high');
    const isMed = simulatedEngineResult.risks.some((r) => r.severity === 'medium');

    const riskLevel = isCritical || isHigh ? 'high' : isMed ? 'moderate' : 'low';
    const healthScore = Math.max(5, Math.min(98, 100 - (isCritical ? 55 : isHigh ? 40 : isMed ? 25 : 8)));

    return {
      income: budget.monthlyIncome,
      spentSoFar: simulatedEngineResult.totalHistoricalSpent,
      remainingBalance: simulatedEngineResult.currentCash,
      unpaidEssentials: simulatedEngineResult.unpaidCommitmentsTotal,
      projectedSubscriptions: currentPlan.projectedSubscriptions + simulation.weeklySubscription * remainingWeeks,
      emergencyBuffer: simulatedEngineResult.emergencyReserveAllocation,
      flexibleSpendingPool: Math.max(0, simulatedEngineResult.flexibleAmount),
      safeDailySpend: simulatedEngineResult.safeDailySpend || 0,
      daysRemaining: simulatedEngineResult.daysRemaining,
      savingsTarget: budget.savingsGoalTarget,
      savingsCurrent: budget.savingsGoalCurrent,
      savingsNeeded: Math.max(0, budget.savingsGoalTarget - budget.savingsGoalCurrent),
      savingsAchievable: simulatedEngineResult.goalEvaluation.isAchievable,
      projectedEndMonthSurplus: Math.max(0, simulatedEngineResult.flexibleAmount - (simulatedEngineResult.safeDailySpend || 0) * simulatedEngineResult.daysRemaining),
      riskLevel,
      riskScore: 100 - healthScore,
      healthScore,
      healthSummary: isCritical
        ? 'Simulated Scenario Causes Deficit'
        : isHigh
        ? 'Scenario Consumes All Discretionary Leeway'
        : isMed
        ? 'Manageable Margin Under Simulation'
        : 'Affordable Decision',
      healthReasons: simulatedEngineResult.risks.map((r) => r.explanation).slice(0, 3),
      bufferDipped: simulatedEngineResult.currentCash < simulatedEngineResult.emergencyReserveAllocation,
      bufferDeficitAmount: Math.max(0, simulatedEngineResult.emergencyReserveAllocation - simulatedEngineResult.currentCash),
      isDeficit: simulatedEngineResult.isFlexibleDeficit,
      deficitAmount: simulatedEngineResult.deficitAmount,
    };
  }, [budget, currentPlan.projectedSubscriptions, simulation, simulatedEngineResult, remainingWeeks]);

  // Map dated forecast to chart points
  const forecastPoints: DayForecastPoint[] = useMemo(() => {
    const simPoints = simulatedEngineResult.datedForecast;
    return engineResult.datedForecast.map((pt, idx) => {
      const simPt = simPoints[idx] || pt;
      return {
        day: pt.dayIndex,
        dayLabel: `Day ${pt.dayIndex}`,
        date: pt.date,
        currentBalance: pt.projectedCash,
        simulatedBalance: simPt.projectedCash,
        isPast: pt.dayIndex < budget.currentDay,
        isToday: pt.dayIndex === budget.currentDay,
        events: pt.events,
        isShortfall: pt.isShortfall,
        shortfallAmount: pt.shortfallAmount,
      };
    });
  }, [engineResult.datedForecast, simulatedEngineResult.datedForecast, budget.currentDay]);

  const triggerToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Evaluate badges, safe-to-spend streak, and challenges whenever financial engine metrics update
  useEffect(() => {
    setGamificationProfile((prevProfile) => {
      const { updatedProfile, newlyUnlockedBadges } = evaluateGamification(
        prevProfile,
        engineResult,
        budget,
        transactions,
        commitments
      );

      // Save to localStorage & Firestore
      saveGamificationProfile(updatedProfile, user?.uid);
      if (user?.uid) {
        saveGamificationProfileToFirestore(user.uid, updatedProfile).catch(console.error);
      }

      // Celebrate any newly unlocked badges with toast notification
      if (newlyUnlockedBadges.length > 0) {
        newlyUnlockedBadges.forEach((badge) => {
          triggerToast(`🏆 Badge Unlocked: ${badge.name}!`, badge.description);
        });
      }

      return updatedProfile;
    });
  }, [
    engineResult.currentCash,
    engineResult.flexibleAmount,
    engineResult.isFlexibleDeficit,
    budget.savingsGoalCurrent,
    budget.savingsGoalTarget,
    budget.emergencyBuffer,
    transactions.length,
    commitments.length,
    user?.uid,
  ]);

  const handleClaimReward = (challengeId: string) => {
    setGamificationProfile((prev) => {
      const { updatedProfile, claimedXp } = claimReward(prev, challengeId);
      saveGamificationProfile(updatedProfile, user?.uid);
      if (user?.uid) {
        saveGamificationProfileToFirestore(user.uid, updatedProfile).catch(console.error);
      }
      if (claimedXp > 0) {
        triggerToast(
          '🎁 Mission Reward Claimed!',
          `+${claimedXp} XP added to your wellness score! Level ${updatedProfile.level}: ${updatedProfile.levelTitle}`
        );
      }
      return updatedProfile;
    });
  };

  // Commit Simulated Decisions into the Live Engine
  const handleCommitSimulation = async () => {
    if (!isSimulating) return;

    setPreviousCommittedState({
      pastExpenses: [...pastExpenses],
      commitments: [...commitments],
      transactions: [...transactions],
    });

    const newExpenses = [...pastExpenses];
    const newCommitments = [...commitments];
    const newTransactions = [...transactions];
    const committedItemsSummary: string[] = [];

    // 1. One-time purchase
    if (simulation.oneTimePurchase > 0) {
      const item: PastExpenseItem = {
        id: `exp-${Date.now()}-1`,
        name: simulation.oneTimeTitle || 'Planned One-Time Purchase',
        amount: simulation.oneTimePurchase,
        day: budget.currentDay,
        date: getCurrentClock(budget.timezone).isoDate,
        category: 'wants',
        essential: false,
      };
      newExpenses.push(item);
      newTransactions.push({
        id: item.id,
        name: item.name,
        amount: item.amount,
        currency: budget.currency,
        category: 'wants',
        type: 'actual_expense',
        status: 'completed',
        date: item.date || getCurrentClock(budget.timezone).isoDate,
        isPaid: true,
      });
      committedItemsSummary.push(formatINR(simulation.oneTimePurchase));
    }

    // 2. Unexpected expense
    if (simulation.unexpectedExpense > 0) {
      const item: PastExpenseItem = {
        id: `exp-${Date.now()}-2`,
        name: simulation.unexpectedTitle || 'Unexpected Expense',
        amount: simulation.unexpectedExpense,
        day: budget.currentDay,
        date: getCurrentClock(budget.timezone).isoDate,
        category: 'needs',
        essential: true,
      };
      newExpenses.push(item);
      newTransactions.push({
        id: item.id,
        name: item.name,
        amount: item.amount,
        currency: budget.currency,
        category: 'needs',
        type: 'actual_expense',
        status: 'completed',
        date: item.date || getCurrentClock(budget.timezone).isoDate,
        isPaid: true,
      });
      committedItemsSummary.push(formatINR(simulation.unexpectedExpense));
    }

    // 3. Weekly subscription
    if (simulation.weeklySubscription > 0) {
      const item: CommitmentItem = {
        id: `com-sub-${Date.now()}`,
        name: simulation.weeklySubscriptionTitle || 'New Weekly Subscription',
        category: 'subscription',
        amount: simulation.weeklySubscription,
        dueDateDay: budget.currentDay + 1,
        dueDate: getCurrentClock(budget.timezone).isoDate,
        isPaid: false,
        frequency: 'weekly',
        note: `Added from simulator at ${formatINR(simulation.weeklySubscription)}/wk.`,
      };
      newCommitments.push(item);
      committedItemsSummary.push(`${formatINR(simulation.weeklySubscription)}/wk`);
    }

    setPastExpenses(newExpenses);
    setCommitments(newCommitments);
    setTransactions(newTransactions);
    setSimulation(INITIAL_SIMULATION);

    if (user) {
      try {
        await saveUserPlanFull(user.uid, budget, newCommitments, newExpenses);
      } catch (err) {
        console.error('Failed to sync commit to Firestore:', err);
      }
    }

    // Record gamification scenario test
    const isNavigatedSafely = !simulatedPlan.bufferDipped && !simulatedPlan.isDeficit;
    setGamificationProfile((prev) => {
      const updated = recordSimulationEvent(prev, isNavigatedSafely);
      saveGamificationProfile(updated, user?.uid);
      return updated;
    });

    triggerToast(
      'Scenario Added to Plan',
      `Committed ${committedItemsSummary.join(' + ')}. Your live cash and flexible allowances have updated.`
    );
  };

  const handleUndoCommit = async () => {
    if (!previousCommittedState) return;
    setPastExpenses(previousCommittedState.pastExpenses);
    setCommitments(previousCommittedState.commitments);
    setTransactions(previousCommittedState.transactions);

    if (user) {
      try {
        await saveUserPlanFull(user.uid, budget, previousCommittedState.commitments, previousCommittedState.pastExpenses);
      } catch (err) {
        console.error('Failed to sync undo to Firestore:', err);
      }
    }

    setPreviousCommittedState(null);
    triggerToast('Action Undone', 'Restored previous plan state.');
  };

  const handleResetSimulation = () => {
    setSimulation(INITIAL_SIMULATION);
  };

  const handleResetAll = () => {
    setBudget(INITIAL_BUDGET);
    setCommitments(INITIAL_COMMITMENTS);
    setPastExpenses(INITIAL_PAST_EXPENSES);
    setTransactions([]);
    setSimulation(INITIAL_SIMULATION);
    setPreviousCommittedState(null);
    triggerToast('Demo Reset', 'Reset all numbers back to default baseline.');
  };

  // Subscriptions Pause / Resume
  const handleTogglePauseSubscription = async (id: string) => {
    const updatedCommitments = commitments.map((item) => {
      if (item.id === id) {
        const nextPaused = !item.isPaused;
        triggerToast(
          nextPaused ? 'Subscription Paused' : 'Subscription Resumed',
          nextPaused
            ? `Paused! Saved upcoming charges for this cycle. Safe daily allowance increased.`
            : `Resumed subscription charges.`
        );
        return { ...item, isPaused: nextPaused };
      }
      return item;
    });

    setCommitments(updatedCommitments);
    if (user) {
      saveUserPlanFull(user.uid, budget, updatedCommitments, pastExpenses).catch(console.error);
    }
  };

  // Mark Paid
  const handleMarkPaid = async (id: string) => {
    const item = commitments.find((c) => c.id === id);
    if (!item) return;

    const updatedCommitments = commitments.map((c) =>
      c.id === id ? { ...c, isPaid: true } : c
    );
    const updatedExpenses: PastExpenseItem[] = [
      ...pastExpenses,
      {
        id: `exp-${Date.now()}`,
        name: item.name,
        amount: item.amount,
        day: budget.currentDay,
        date: item.dueDate || getCurrentClock(budget.timezone).isoDate,
        category: item.category === 'essential' ? 'needs' : 'wants',
        essential: item.category === 'essential',
      },
    ];

    setCommitments(updatedCommitments);
    setPastExpenses(updatedExpenses);

    if (user) {
      saveUserPlanFull(user.uid, budget, updatedCommitments, updatedExpenses).catch(console.error);
    }

    triggerToast(
      'Payment Recorded',
      `Marked ${item.name} (${formatINR(item.amount)}) as paid. Deducted from available balance.`
    );
  };

  const handleAddCommitment = async (newItem: CommitmentItem) => {
    const updated = [...commitments, newItem];
    setCommitments(updated);
    if (user) {
      saveUserPlanFull(user.uid, budget, updated, pastExpenses).catch(console.error);
    }
    triggerToast('Commitment Added', `Added ${newItem.name} (${formatINR(newItem.amount)}).`);
  };

  const handleAddSavingsDeposit = async (amount: number) => {
    const updatedBudget: BudgetData = {
      ...budget,
      savingsGoalCurrent: Math.min(budget.savingsGoalTarget, budget.savingsGoalCurrent + amount),
    };
    const updatedExpenses: PastExpenseItem[] = [
      ...pastExpenses,
      {
        id: `exp-${Date.now()}`,
        name: 'Transferred to Rainy-Day Savings',
        amount,
        day: budget.currentDay,
        date: getCurrentClock(budget.timezone).isoDate,
        category: 'savings',
        essential: true,
      },
    ];

    setBudget(updatedBudget);
    setPastExpenses(updatedExpenses);

    if (user) {
      saveUserPlanFull(user.uid, updatedBudget, commitments, updatedExpenses).catch(console.error);
    }

    triggerToast(
      'Savings Deposited',
      `Transferred ${formatINR(amount)} into your savings reserve!`
    );
  };

  // Transaction mutations
  const handleAddTransaction = async (newTx: FinancialTransaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    if (user) {
      saveTransaction(user.uid, newTx).catch(console.error);
    }
    triggerToast('Transaction Recorded', `Added ${newTx.name} (${formatINR(newTx.amount)}).`);
  };

  const handleDeleteTransaction = async (txId: string) => {
    const updated = transactions.filter((t) => t.id !== txId);
    setTransactions(updated);
    if (user) {
      deleteTransaction(user.uid, txId).catch(console.error);
    }
    triggerToast('Transaction Removed', 'Record removed from ledger.');
  };

  // Change Timezone
  const handleTimezoneChange = (newTz: string) => {
    const clock = getCurrentClock(newTz);
    const metrics = calculatePlanMetricsFromDates(budget.planStartDate, budget.planEndDate, clock.isoDate);
    const updated: BudgetData = {
      ...budget,
      timezone: newTz,
      currentDay: metrics.currentDay,
      totalDays: metrics.totalDays,
    };
    setBudget(updated);
    if (user) {
      saveUserPlanFull(user.uid, updated, commitments, pastExpenses).catch(console.error);
    }
    triggerToast('Timezone Updated', `Switched display timezone to ${newTz}.`);
  };

  // Save Plan Dates
  const handleSavePlanDates = (startDate: string, endDate: string) => {
    const clock = getCurrentClock(budget.timezone);
    const metrics = calculatePlanMetricsFromDates(startDate, endDate, clock.isoDate);

    const updated: BudgetData = {
      ...budget,
      planStartDate: startDate,
      planEndDate: endDate,
      totalDays: metrics.totalDays,
      currentDay: metrics.currentDay,
      cycleStartFormatted: formatDateHuman(startDate, budget.timezone),
      cycleEndFormatted: formatDateHuman(endDate, budget.timezone),
    };

    setBudget(updated);
    if (user) {
      saveUserPlanFull(user.uid, updated, commitments, pastExpenses).catch(console.error);
    }
    triggerToast(
      'Plan Dates Updated',
      `Plan is now ${formatDateHuman(startDate, budget.timezone)} to ${formatDateHuman(endDate, budget.timezone)} (${metrics.totalDays} days).`
    );
  };

  // Save Full Plan from AI Onboarding / Review
  const handleSavePlanFromOnboarding = async (
    newBudget: BudgetData,
    newCommitments: CommitmentItem[],
    newExpenses: PastExpenseItem[]
  ) => {
    const clock = getCurrentClock(newBudget.timezone || budget.timezone);
    const metrics = calculatePlanMetricsFromDates(
      newBudget.planStartDate || budget.planStartDate,
      newBudget.planEndDate || budget.planEndDate,
      clock.isoDate
    );

    const finalBudget: BudgetData = {
      ...newBudget,
      totalDays: metrics.totalDays,
      currentDay: metrics.currentDay,
      cycleStartFormatted: formatDateHuman(newBudget.planStartDate, newBudget.timezone),
      cycleEndFormatted: formatDateHuman(newBudget.planEndDate, newBudget.timezone),
      isOnboardingComplete: true,
    };

    setBudget(finalBudget);
    setCommitments(newCommitments);
    setPastExpenses(newExpenses);

    if (user) {
      await saveUserPlanFull(user.uid, finalBudget, newCommitments, newExpenses);
    }

    triggerToast('Plan Saved & Active', 'Your personalized financial plan is now live!');
  };

  if (currentView === 'privacy-policy') {
    return <PrivacyPolicyPage onBack={() => navigateToView('dashboard')} />;
  }

  if (currentView === 'terms-and-conditions') {
    return <TermsAndConditionsPage onBack={() => navigateToView('dashboard')} />;
  }

  return (
    <div className="relative min-h-screen text-[#1C2B22] flex flex-col font-sans overflow-x-hidden">
      {/* 3D Canvas Environment in Background (Replaces static CSS background with layered emerald financial world) */}
      <Emerald3DEnvironment />

      {/* Cinematic 3D Startup Sequence (renders 3D Pocketwise SVG logo, light-tracing effect, camera push-through) */}
      {showCinematicStartup && (
        <CinematicStartupSequence
          onComplete={() => {
            sessionStorage.setItem('pocketwise_3d_startup_seen', 'true');
            setShowCinematicStartup(false);
          }}
          isAuthenticated={!!user}
        />
      )}

      {/* Foreground Content Stack */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Bar Contract (Wordmark, Cycle metadata, Auth & Actions) */}
        <Header
          budget={budget}
          onResetAll={handleResetAll}
          onOpenHowItWorks={() => setShowHowItWorksModal(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenAIOnboarding={() => setShowAIOnboardingModal(true)}
          onOpenChatboard={() => setIsAIChatboardOpen(true)}
          onOpen3DIntro={() => setShowCinematicStartup(true)}
          onOpenPrivacyControls={() => setShowPrivacyControlsModal(true)}
          onNavigateOverview={() => {
            navigateToView('dashboard');
            setActiveSection('overview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

      {/* Real-time Dynamic Clock & Calendar Bar */}
      <LiveClockBar
        budget={budget}
        onOpenDateRangeModal={() => setShowDateRangeModal(true)}
        onTimezoneChange={handleTimezoneChange}
      />

      {/* PHASE 6: Modular Section Navigation Bar */}
      <nav className="bg-white border-b border-[#E8E3DA] sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all' as const, label: 'All Sections', badge: 'Full', icon: Layers },
              { id: 'overview' as const, label: 'Overview', badge: 'A', icon: LayoutDashboard },
              { id: 'transactions' as const, label: 'Transactions', badge: 'B', icon: ArrowRightLeft },
              { id: 'simulator' as const, label: 'Decision Simulator', badge: 'C', icon: Sliders },
              { id: 'commitments' as const, label: 'Commitments', badge: 'D', icon: Calendar },
              { id: 'savings' as const, label: 'Savings & Goals', badge: 'E', icon: PiggyBank },
              { id: 'forecast' as const, label: 'Forecast & Health', badge: 'F', icon: TrendingUp },
              {
                id: 'gamification' as const,
                label: 'Badges & Quests',
                badge: `${gamificationProfile.safeSpendStreak}d 🔥`,
                icon: Award,
              },
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#133226] text-[#D4F478] shadow-xs'
                      : 'bg-[#F2EDE4]/70 text-[#5E7166] hover:bg-[#F2EDE4] hover:text-[#1C2B22]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                      isActive ? 'bg-[#1E5225] text-[#D4F478]' : 'bg-[#E5DFD4] text-[#718579]'
                    }`}
                  >
                    {sec.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsAIChatboardOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E1F7C5] text-[#133226] hover:bg-[#D4F478] transition-colors shrink-0 shadow-2xs"
            title="Open Floating AI Financial Coach & Voice Assistant (⌘K or Ctrl+K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1E5225]" />
            <span>AI Advisor</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[#133226]/10 text-[#133226] rounded">
              ⌘K
            </kbd>
          </button>
        </div>
      </nav>

      {/* Main Modular Sections Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* ========================================================= */}
        {/* SECTION A: Financial Overview & Velocity Snapshot         */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'overview') && (
          <section id="section-overview" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#133226]/10 text-[#133226] text-[11px] font-bold uppercase tracking-wider">
                  <LayoutDashboard className="w-3 h-3" />
                  Section A · Financial Overview
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1C2B22] tracking-tight mt-1">
                  Available Cash & Daily Spend Velocity
                </h2>
                <p className="text-xs text-[#5E7166]">
                  Current balance, flexible funds pool, emergency cushion, and cycle timeline calculated dynamically.
                </p>
              </div>
            </div>

            <OverviewHero
              budget={budget}
              currentPlan={currentPlan}
              simulatedPlan={simulatedPlan}
              isSimulating={isSimulating}
              onOpenExpenseLog={() => setShowExpenseModal(true)}
              onOpenTransactions={() => {
                setActiveSection('transactions');
                setShowTransactionModal(true);
              }}
            />

            {/* Quick Gamification & Safe Streak Bar */}
            <div className="bg-gradient-to-r from-[#133226] to-[#1E4334] rounded-2xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-[#234E3C]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#1E5225] border border-[#D4F478]/30 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-[#F97316]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#D4F478] tracking-tight">
                      {gamificationProfile.safeSpendStreak}-Day Safe Streak
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white">
                      Level {gamificationProfile.level}: {gamificationProfile.levelTitle}
                    </span>
                  </div>
                  <p className="text-xs text-[#BACDBF] mt-0.5">
                    {gamificationProfile.badges.filter((b) => b.unlocked).length} of {gamificationProfile.badges.length} badges unlocked · {gamificationProfile.challenges.filter((c) => c.isCompleted && !c.isClaimed).length} quest reward(s) ready to claim
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSection('gamification')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4F478] text-[#133226] text-xs font-black hover:bg-[#E5FFA0] transition-colors self-start sm:self-auto shrink-0 shadow-xs"
              >
                <Award className="w-3.5 h-3.5 text-[#133226]" />
                <span>View Badges & Challenges</span>
              </button>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION B: Transactions & Expenses Ledger                */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'transactions') && (
          <TransactionsSection
            transactions={transactions}
            commitments={commitments}
            budget={budget}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* ========================================================= */}
        {/* SECTION C: Decision Simulator (What-If Scenarios)         */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'simulator') && (
          <section id="section-simulator" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#133226]/10 text-[#133226] text-[11px] font-bold uppercase tracking-wider">
                  <Sliders className="w-3 h-3" />
                  Section C · Decision Simulator
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1C2B22] tracking-tight mt-1">
                  What-If Scenario Simulation
                </h2>
                <p className="text-xs text-[#5E7166]">
                  Test financial moves, purchases, or extra income in sandbox mode before committing to your live ledger.
                </p>
              </div>
            </div>

            <DecisionSimulator
              simulation={simulation}
              onUpdateSimulation={setSimulation}
              onCommitSimulation={handleCommitSimulation}
              onResetSimulation={handleResetSimulation}
              currentPlan={currentPlan}
              simulatedPlan={simulatedPlan}
            />
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION D: Commitments & Subscriptions                    */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'commitments') && (
          <section id="section-commitments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#133226]/10 text-[#133226] text-[11px] font-bold uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  Section D · Commitments & Subscriptions
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1C2B22] tracking-tight mt-1">
                  Scheduled Obligations & Recurring Bills
                </h2>
                <p className="text-xs text-[#5E7166]">
                  Fixed overhead, upcoming bills due, pause/resume subscription levers, and settlement controls.
                </p>
              </div>
            </div>

            <CommitmentsList
              commitments={commitments}
              currentDay={budget.currentDay}
              totalDays={budget.totalDays}
              onTogglePauseSubscription={handleTogglePauseSubscription}
              onMarkPaid={handleMarkPaid}
              onAddCommitment={handleAddCommitment}
            />
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION E: Savings Goals & Reserves                       */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'savings') && (
          <section id="section-savings" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#133226]/10 text-[#133226] text-[11px] font-bold uppercase tracking-wider">
                  <PiggyBank className="w-3 h-3" />
                  Section E · Savings Goals & Rainy-Day Reserves
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1C2B22] tracking-tight mt-1">
                  Disciplined Capital Allocation
                </h2>
                <p className="text-xs text-[#5E7166]">
                  Target savings milestones, emergency cushions, and direct transfers to rainy-day funds.
                </p>
              </div>
            </div>

            <div className="max-w-2xl">
              <SavingsGoalCard
                budget={budget}
                currentPlan={currentPlan}
                simulatedPlan={simulatedPlan}
                isSimulating={isSimulating}
                onAddSavingsDeposit={handleAddSavingsDeposit}
              />
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION F: Forecast and Financial Health Trajectory       */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'forecast') && (
          <section id="section-forecast" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#133226]/10 text-[#133226] text-[11px] font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3" />
                  Section F · Forecast & Financial Health
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1C2B22] tracking-tight mt-1">
                  Predictive Cash Trajectory & Risk Audit
                </h2>
                <p className="text-xs text-[#5E7166]">
                  Day-by-day cash trajectory, deterministic risk alerts, and financial safety sustainability index.
                </p>
              </div>
            </div>

            {/* PHASE 2: Deterministic Risk Alerts & Explanations */}
            {engineResult.risks.length > 0 && (
              <RiskAlertsBanner
                risks={engineResult.risks}
                explanations={engineResult.explanations}
              />
            )}

            <ForecastAndHealth
              forecastPoints={forecastPoints}
              currentPlan={currentPlan}
              simulatedPlan={simulatedPlan}
              isSimulating={isSimulating}
              emergencyBuffer={budget.emergencyBuffer}
            />
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION G: Gamification, Badges & Habit Quests            */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'gamification') && (
          <section id="section-gamification" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#133226]/10 text-[#133226] text-[11px] font-bold uppercase tracking-wider">
                  <Award className="w-3 h-3" />
                  Section G · Discipline & Achievement Milestones
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1C2B22] tracking-tight mt-1">
                  Budgeting Challenges & Achievement Badges
                </h2>
                <p className="text-xs text-[#5E7166]">
                  Build sustainable financial habits with daily & weekly challenges, goal achievements, and safe-to-spend streaks.
                </p>
              </div>
            </div>

            <GamificationSection
              profile={gamificationProfile}
              onClaimReward={handleClaimReward}
              onOpenSimulator={() => setActiveSection('simulator')}
              onOpenLedger={() => setActiveSection('transactions')}
            />
          </section>
        )}
      </main>

      {/* PHASE 6: Floating AI Chatboard (Houses AI Advisor & Real-Time Voice Assistant) */}
      <FloatingAIChatboard
        budget={budget}
        commitments={commitments}
        engineResult={engineResult}
        currentPlan={currentPlan}
        onAddTransaction={handleAddTransaction}
        onUpdateBudgetGoal={async (newTarget) => {
          const updated = { ...budget, savingsGoalTarget: newTarget };
          setBudget(updated);
          if (user) {
            await saveUserBudget(user.uid, updated);
          }
        }}
        isOpen={isAIChatboardOpen}
        onToggleOpen={setIsAIChatboardOpen}
      />

      {/* Footer with Mandatory Disclaimer and Legal Links */}
      <Footer
        onReset={handleResetAll}
        onOpenPrivacyPage={() => navigateToView('privacy-policy')}
        onOpenTermsPage={() => navigateToView('terms-and-conditions')}
        onOpenPrivacyControls={() => setShowPrivacyControlsModal(true)}
      />

      {/* Auth Modal (Google & Email/Password & Reset) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onOpenPrivacyPage={() => navigateToView('privacy-policy')}
        onOpenTermsPage={() => navigateToView('terms-and-conditions')}
      />

      {/* Account Privacy & Legal Data Controls Modal */}
      <AccountPrivacyModal
        isOpen={showPrivacyControlsModal}
        onClose={() => setShowPrivacyControlsModal(false)}
        onOpenPrivacyPage={() => navigateToView('privacy-policy')}
        onOpenTermsPage={() => navigateToView('terms-and-conditions')}
        onResetData={handleResetAll}
        budgetData={budget}
        commitmentsData={commitments}
        expensesData={pastExpenses}
      />

      {/* AI Onboarding Financial Interview Modal */}
      <AIOnboardingModal
        isOpen={showAIOnboardingModal}
        onClose={() => setShowAIOnboardingModal(false)}
        initialBudget={budget}
        initialCommitments={commitments}
        initialExpenses={pastExpenses}
        onSavePlan={handleSavePlanFromOnboarding}
      />

      {/* Plan Date Range Customizer Modal */}
      <PlanDatePickerModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        budget={budget}
        onSavePlanDates={handleSavePlanDates}
      />

      {/* PHASE 2: Unified Transaction Ledger Modal */}
      <TransactionManagerModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactions={transactions}
        onAddTransaction={handleAddTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        currency={budget.currency}
      />

      {/* Expense History Ledger Modal */}
      <ExpenseHistoryModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        expenses={pastExpenses}
        totalSpent={currentPlan.spentSoFar}
      />

      {/* How Pocketwise Works Guide Modal */}
      <HowItWorksModal
        isOpen={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
      />

      {/* Toast Notification with Undo */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#133226] text-white p-4 rounded-2xl shadow-xl border border-[#234E3C] max-w-sm flex items-start gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-[#D4F478] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-bold text-white">{toastMessage.title}</p>
            <p className="text-xs text-[#BACDBF] leading-snug">{toastMessage.desc}</p>
            {previousCommittedState && (
              <button
                onClick={handleUndoCommit}
                className="mt-1 text-xs font-semibold text-[#D4F478] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Undo decision
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PocketwiseDashboard />
    </AuthProvider>
  );
}
