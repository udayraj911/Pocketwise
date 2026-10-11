/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  PiggyBank,
  Wallet,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { BudgetData, CommitmentItem, PastExpenseItem } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';
import { formatDateHuman } from '../utils/dateTime';

interface ReviewAndSaveScreenProps {
  draftBudget: BudgetData;
  draftCommitments: CommitmentItem[];
  draftExpenses: PastExpenseItem[];
  onBackToChat: () => void;
  onConfirmAndSave: (
    budget: BudgetData,
    commitments: CommitmentItem[],
    expenses: PastExpenseItem[]
  ) => Promise<void>;
  isSaving: boolean;
}

export const ReviewAndSaveScreen: React.FC<ReviewAndSaveScreenProps> = ({
  draftBudget,
  draftCommitments,
  draftExpenses,
  onBackToChat,
  onConfirmAndSave,
  isSaving,
}) => {
  const [budget, setBudget] = useState<BudgetData>({ ...draftBudget });
  const [commitments, setCommitments] = useState<CommitmentItem[]>([...draftCommitments]);
  const [expenses, setExpenses] = useState<PastExpenseItem[]>([...draftExpenses]);

  // Editing state for commitments
  const [newCommitmentName, setNewCommitmentName] = useState('');
  const [newCommitmentAmount, setNewCommitmentAmount] = useState<number>(1000);
  const [newCommitmentCategory, setNewCommitmentCategory] = useState<'essential' | 'subscription'>('essential');
  const [showAddCommitment, setShowAddCommitment] = useState(false);

  const handleAddCommitment = () => {
    if (!newCommitmentName.trim() || newCommitmentAmount <= 0) return;
    const item: CommitmentItem = {
      id: `com-draft-${Date.now()}`,
      name: newCommitmentName.trim(),
      amount: newCommitmentAmount,
      category: newCommitmentCategory,
      dueDateDay: 15,
      isPaid: false,
      frequency: newCommitmentCategory === 'subscription' ? 'weekly' : 'monthly',
      note: 'Added during review',
    };
    setCommitments([...commitments, item]);
    setNewCommitmentName('');
    setShowAddCommitment(false);
  };

  const handleRemoveCommitment = (id: string) => {
    setCommitments(commitments.filter((c) => c.id !== id));
  };

  const handleToggleCommitmentPaid = (id: string) => {
    setCommitments(
      commitments.map((c) => (c.id === id ? { ...c, isPaid: !c.isPaid } : c))
    );
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalUpcomingEssentials = commitments
    .filter((c) => c.category === 'essential' && !c.isPaid)
    .reduce((sum, c) => sum + c.amount, 0);

  const remainingBalance = budget.monthlyIncome - totalSpent;

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      {/* Header Banner */}
      <div className="bg-[#133226] text-white p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#C8E8B6] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D4F478]" />
            <span>AI Financial Interview Complete</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">
            Review Your Financial Profile
          </h3>
          <p className="text-xs text-[#BACDBF] mt-0.5">
            Check and adjust any numbers before locking in your plan to Cloud Firestore.
          </p>
        </div>

        <button
          onClick={onBackToChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#244F3D] hover:bg-[#2C5F4A] text-xs font-semibold rounded-xl text-[#D4F478] transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Interview</span>
        </button>
      </div>

      {/* Core Numbers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Income & Currency */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-4 rounded-2xl space-y-2">
          <label className="text-xs font-bold text-[#5E7166] uppercase tracking-wider block">
            Expected Income / Budget
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={budget.monthlyIncome}
              onChange={(e) =>
                setBudget({ ...budget, monthlyIncome: Number(e.target.value) })
              }
              className="w-full text-xl font-bold bg-white px-2.5 py-1 rounded-lg border border-[#DDD7CD] text-[#1C2B22] tabular-nums"
            />
            <span className="text-xs font-bold text-[#5E7166]">{budget.currency}</span>
          </div>
          <span className="text-[11px] text-[#8B9B90] block">
            For planning period
          </span>
        </div>

        {/* Emergency Buffer */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-4 rounded-2xl space-y-2">
          <label className="text-xs font-bold text-[#5E7166] uppercase tracking-wider block">
            Emergency Cushion
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={budget.emergencyBuffer}
              onChange={(e) =>
                setBudget({ ...budget, emergencyBuffer: Number(e.target.value) })
              }
              className="w-full text-xl font-bold bg-white px-2.5 py-1 rounded-lg border border-[#DDD7CD] text-[#1C2B22] tabular-nums"
            />
          </div>
          <span className="text-[11px] text-[#8B9B90] block">
            Protected from daily spending
          </span>
        </div>

        {/* Savings Goal Target */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-4 rounded-2xl space-y-2">
          <label className="text-xs font-bold text-[#5E7166] uppercase tracking-wider block">
            Savings Target
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={budget.savingsGoalTarget}
              onChange={(e) =>
                setBudget({ ...budget, savingsGoalTarget: Number(e.target.value) })
              }
              className="w-full text-xl font-bold bg-white px-2.5 py-1 rounded-lg border border-[#DDD7CD] text-[#1C2B22] tabular-nums"
            />
          </div>
          <span className="text-[11px] text-[#8B9B90] block">
            Goal amount for this plan
          </span>
        </div>

        {/* Current Saved */}
        <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-4 rounded-2xl space-y-2">
          <label className="text-xs font-bold text-[#5E7166] uppercase tracking-wider block">
            Already Saved
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={budget.savingsGoalCurrent}
              onChange={(e) =>
                setBudget({ ...budget, savingsGoalCurrent: Number(e.target.value) })
              }
              className="w-full text-xl font-bold bg-white px-2.5 py-1 rounded-lg border border-[#DDD7CD] text-[#1C2B22] tabular-nums"
            />
          </div>
          <span className="text-[11px] text-[#8B9B90] block">
            Current deposit in savings
          </span>
        </div>
      </div>

      {/* Plan Dates Row */}
      <div className="bg-[#FAF8F5] border border-[#E8E3DA] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#133226]" />
          <span className="text-xs font-bold text-[#1C2B22]">Plan Calendar Dates:</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div>
            <span className="text-[#5E7166] mr-1">Start:</span>
            <input
              type="date"
              value={budget.planStartDate}
              onChange={(e) => setBudget({ ...budget, planStartDate: e.target.value })}
              className="px-2 py-1 rounded-lg border border-[#DDD7CD] bg-white text-xs"
            />
          </div>
          <div>
            <span className="text-[#5E7166] mr-1">End:</span>
            <input
              type="date"
              value={budget.planEndDate}
              onChange={(e) => setBudget({ ...budget, planEndDate: e.target.value })}
              className="px-2 py-1 rounded-lg border border-[#DDD7CD] bg-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Commitments & Subscriptions Table */}
      <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
          <div>
            <h4 className="text-sm font-bold text-[#1C2B22]">
              Upcoming Bills, Commitments & Subscriptions ({commitments.length})
            </h4>
            <p className="text-xs text-[#5E7166]">
              Total upcoming essentials: <strong className="text-[#133226]">{formatINR(totalUpcomingEssentials)}</strong>
            </p>
          </div>
          <button
            onClick={() => setShowAddCommitment(!showAddCommitment)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#F2EDE4] hover:bg-[#E5DFD4] rounded-lg text-[#133226] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Add commitment subform */}
        {showAddCommitment && (
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E0] space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Name (e.g. Wi-Fi bill)"
                value={newCommitmentName}
                onChange={(e) => setNewCommitmentName(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[#DDD7CD] bg-white"
              />
              <input
                type="number"
                placeholder="Amount (INR)"
                value={newCommitmentAmount}
                onChange={(e) => setNewCommitmentAmount(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[#DDD7CD] bg-white"
              />
              <select
                value={newCommitmentCategory}
                onChange={(e) =>
                  setNewCommitmentCategory(e.target.value as 'essential' | 'subscription')
                }
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[#DDD7CD] bg-white"
              >
                <option value="essential">Essential Living</option>
                <option value="subscription">Recurring Subscription</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCommitment(false)}
                className="px-2.5 py-1 text-xs text-[#5E7166]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCommitment}
                className="px-3 py-1 bg-[#133226] text-[#D4F478] rounded-lg text-xs font-bold"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Commitments List */}
        <div className="divide-y divide-[#F0EBE2]">
          {commitments.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#8B9B90]">
              No commitments added yet. Add any upcoming bills above.
            </div>
          ) : (
            commitments.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCommitmentPaid(c.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center border ${
                      c.isPaid ? 'bg-[#133226] border-[#133226] text-white' : 'border-[#DDD7CD]'
                    }`}
                    title={c.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                  >
                    {c.isPaid && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <span className="font-semibold text-[#1C2B22] block">{c.name}</span>
                    <span className="text-[11px] text-[#5E7166]">
                      {c.category === 'essential' ? 'Essential Living' : 'Subscription'} · Due Day {c.dueDateDay}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums text-[#1C2B22]">
                    {formatINR(c.amount)}
                  </span>
                  <button
                    onClick={() => handleRemoveCommitment(c.id)}
                    className="text-[#8B9B90] hover:text-[#C2410C] p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Already Paid Expenses List */}
      <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
          <div>
            <h4 className="text-sm font-bold text-[#1C2B22]">
              Expenses Already Spent This Period ({expenses.length})
            </h4>
            <p className="text-xs text-[#5E7166]">
              Total already paid: <strong className="text-[#133226]">{formatINR(totalSpent)}</strong>
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#F0EBE2]">
          {expenses.length === 0 ? (
            <div className="py-3 text-center text-xs text-[#8B9B90]">
              No past expenses recorded for this cycle yet.
            </div>
          ) : (
            expenses.map((e) => (
              <div key={e.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-[#1C2B22]">{e.name}</span>
                  <span className="text-[11px] text-[#5E7166] ml-2">({e.category})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums text-[#1C2B22]">{formatINR(e.amount)}</span>
                  <button
                    onClick={() => handleRemoveExpense(e.id)}
                    className="text-[#8B9B90] hover:text-[#C2410C] p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 border-t border-[#E8E3DA] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#5E7166]">
          Projected Available Balance: <strong className="text-[#133226] font-bold text-sm">{formatINR(remainingBalance)}</strong>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToChat}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#5E7166] hover:bg-[#F2EDE4] rounded-xl transition-colors"
          >
            Ask Sage More Questions
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => onConfirmAndSave(budget, commitments, expenses)}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#133226] text-[#D4F478] font-bold text-xs rounded-xl hover:bg-[#1A4233] transition-all shadow-md shadow-[#133226]/10 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#D4F478]" />
            <span>{isSaving ? 'Saving to Firestore...' : 'Confirm & Launch My Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
