/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRightLeft,
  Calendar,
  Tag,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Shield,
  CreditCard,
  PiggyBank,
} from 'lucide-react';
import {
  FinancialTransaction,
  TransactionCategory,
  TransactionType,
  TransactionStatus,
} from '../types/finance';
import { formatINR } from '../utils/financeCalculations';
import { getCurrentClock } from '../utils/dateTime';

interface TransactionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: FinancialTransaction[];
  onAddTransaction: (tx: FinancialTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
  currency?: string;
}

export const TransactionManagerModal: React.FC<TransactionManagerModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  currency = 'INR',
}) => {
  const clock = getCurrentClock();
  const [filter, setFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(500);
  const [category, setCategory] = useState<string>('needs');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [type, setType] = useState<TransactionType>('actual_expense');
  const [date, setDate] = useState(clock.isoDate);
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState('');

  // Collect any existing user custom categories from transactions
  const userCustomCategories = Array.from(
    new Set(
      transactions
        .map((tx) => tx.customCategory || (['needs', 'wants', 'income', 'savings', 'debt', 'emergency'].includes(tx.category) ? null : tx.category))
        .filter((c): c is string => Boolean(c && c.trim()))
    )
  );

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) return;

    const isCustom = category === 'custom' || (!['needs', 'wants', 'income', 'savings', 'debt', 'emergency'].includes(category));
    const effectiveCategory = isCustom ? 'custom' : (category as TransactionCategory);
    const effectiveCustomLabel = isCustom ? (customCategoryInput.trim() || 'Custom Expense') : undefined;

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      name: name.trim(),
      amount,
      currency,
      category: effectiveCategory,
      customCategory: effectiveCustomLabel,
      type,
      status: isPaid ? 'completed' : 'scheduled',
      date,
      dueDate: isPaid ? undefined : date,
      isPaid,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddTransaction(newTx);
    setName('');
    setNotes('');
    setCustomCategoryInput('');
    setShowAddForm(false);
  };

  const filtered = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'income') return tx.category === 'income';
    if (filter === 'needs') return tx.category === 'needs';
    if (filter === 'wants') return tx.category === 'wants';
    if (filter === 'savings') return tx.category === 'savings';
    if (filter === 'debt') return tx.category === 'debt';
    if (filter === 'custom') {
      return tx.category === 'custom' || Boolean(tx.customCategory) || !['needs', 'wants', 'income', 'savings', 'debt', 'emergency'].includes(tx.category);
    }
    // Filter by specific custom category name
    if (tx.customCategory === filter || tx.category === filter) return true;
    return true;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-[#20703B]" />;
      case 'needs':
        return <Shield className="w-4 h-4 text-[#133226]" />;
      case 'debt':
        return <CreditCard className="w-4 h-4 text-[#C2410C]" />;
      case 'savings':
        return <PiggyBank className="w-4 h-4 text-[#133226]" />;
      case 'wants':
        return <DollarSign className="w-4 h-4 text-[#2A6A4E]" />;
      case 'custom':
      default:
        return <Tag className="w-4 h-4 text-[#8A5A2B]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-[#E8E3DA] flex flex-col h-[85vh] max-h-[750px] animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE2] shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-[#1C2B22]">
              Transactions & Records
            </h3>
            <p className="text-xs text-[#5E7166]">
              Deterministic cash ledger · Distinct classifications without double-counting
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-[#F2EDE4] flex items-center justify-center text-[#5E7166]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar text-xs font-medium shrink-0">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'income', label: 'Income' },
            { id: 'needs', label: 'Essentials' },
            { id: 'wants', label: 'Wants' },
            { id: 'custom', label: 'Custom' },
            { id: 'savings', label: 'Savings' },
            { id: 'debt', label: 'Debt' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-[#133226] text-[#D4F478] font-bold'
                  : 'bg-[#FAF8F5] text-[#5E7166] hover:bg-[#F2EDE4]'
              }`}
            >
              {f.label}
            </button>
          ))}
          {userCustomCategories.map((customName) => (
            <button
              key={customName}
              onClick={() => setFilter(customName)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border border-[#E8E2D6] ${
                filter === customName
                  ? 'bg-[#133226] text-[#D4F478] font-bold'
                  : 'bg-[#FAF8F5] text-[#5E7166] hover:bg-[#F2EDE4]'
              }`}
            >
              ★ {customName}
            </button>
          ))}
        </div>

        {/* Add Transaction Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="p-4 bg-[#FAF8F5] border border-[#E8E2D6] rounded-2xl mb-3 space-y-3 shrink-0 animate-fadeIn text-xs"
          >
            <div className="flex items-center justify-between font-bold text-[#1C2B22]">
              <span>New Financial Transaction</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[#5E7166] hover:underline text-[11px]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[#5E7166] mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Card, Freelance, EMI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DDD7CD] bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[#5E7166] mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DDD7CD] bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[#5E7166] mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DDD7CD] bg-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[#5E7166] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#DDD7CD] bg-white text-xs"
                >
                  <option value="needs">Needs & Essentials</option>
                  <option value="wants">Wants & Discretionary</option>
                  <option value="custom">Custom Category...</option>
                  <option value="income">Income</option>
                  <option value="savings">Savings</option>
                  <option value="debt">Debt Repayment</option>
                  <option value="emergency">Emergency Reserve</option>
                  {userCustomCategories.length > 0 && (
                    <optgroup label="Saved Custom Categories">
                      {userCustomCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {category === 'custom' ? (
                <div>
                  <label className="block text-[#5E7166] mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pet Care, Tuition, Gadgets"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#133226] bg-[#FCFBF8] text-xs font-medium"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[#5E7166] mb-1">Accounting Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#DDD7CD] bg-white text-xs"
                  >
                    <option value="actual_expense">Actual Expense (Spent)</option>
                    <option value="planned_expense">Planned Expense (Future)</option>
                    <option value="confirmed_income">Confirmed Inflow</option>
                    <option value="estimated_income">Estimated Inflow</option>
                    <option value="savings_transfer">Savings Transfer</option>
                    <option value="debt_payment">Debt Repayment</option>
                    <option value="internal_transfer">Internal Transfer</option>
                  </select>
                </div>
              )}

              {category === 'custom' ? (
                <div>
                  <label className="block text-[#5E7166] mb-1">Accounting Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#DDD7CD] bg-white text-xs"
                  >
                    <option value="actual_expense">Actual Expense (Spent)</option>
                    <option value="planned_expense">Planned Expense (Future)</option>
                    <option value="savings_transfer">Savings Transfer</option>
                    <option value="debt_payment">Debt Repayment</option>
                  </select>
                </div>
              ) : null}

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="tx-is-paid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#133226]"
                />
                <label htmlFor="tx-is-paid" className="text-xs font-semibold text-[#1C2B22]">
                  Already Paid / Completed
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#133226] text-[#D4F478] rounded-xl font-bold text-xs hover:bg-[#1A4233]"
              >
                Save Transaction
              </button>
            </div>
          </form>
        )}

        {/* Scrollable Transaction List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F0EBE2] pr-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8B9B90] space-y-1">
              <p>No transactions matching this filter.</p>
              <p>Click "Add Record" above to record income, bills, or transfers.</p>
            </div>
          ) : (
            filtered.map((tx) => {
              const isIncome = tx.category === 'income' || tx.type.includes('income');

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF8F5] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E2D6] flex items-center justify-center shrink-0">
                      {getCategoryIcon(tx.category)}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#1C2B22]">{tx.name}</span>
                        {tx.customCategory ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            ★ {tx.customCategory}
                          </span>
                        ) : tx.category !== 'needs' && tx.category !== 'wants' ? (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#EFEBE4] text-[#4E6254]">
                            {tx.category}
                          </span>
                        ) : null}
                        <span className="text-[10px] font-semibold text-[#5E7166] uppercase">
                          {tx.type.replace('_', ' ')}
                        </span>
                        {tx.isPaid !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              tx.isPaid
                                ? 'bg-[#E1F7C5] text-[#1E5225]'
                                : 'bg-[#FEE2E2] text-[#991B1B]'
                            }`}
                          >
                            {tx.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8B9B90]">
                        <span>{tx.date}</span>
                        {tx.notes && <span className="ml-2 italic">· {tx.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-extrabold tabular-nums text-sm ${
                        isIncome ? 'text-[#20703B]' : 'text-[#1C2B22]'
                      }`}
                    >
                      {isIncome ? `+${formatINR(tx.amount)}` : formatINR(tx.amount)}
                    </span>

                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1 text-[#8B9B90] hover:text-[#C2410C] rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#F0EBE2] flex items-center justify-between text-[11px] text-[#8B9B90]">
          <span>Total records: {filtered.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-[#133226] text-white rounded-xl hover:bg-[#1A4233]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
