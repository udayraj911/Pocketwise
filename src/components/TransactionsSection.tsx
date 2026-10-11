/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Calendar,
  Tag,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Shield,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import {
  FinancialTransaction,
  TransactionCategory,
  TransactionType,
  CommitmentItem,
  BudgetData,
} from '../types/finance';
import { formatINR } from '../utils/financeCalculations';
import { getCurrentClock } from '../utils/dateTime';

interface TransactionsSectionProps {
  transactions: FinancialTransaction[];
  commitments: CommitmentItem[];
  budget: BudgetData;
  onAddTransaction: (tx: FinancialTransaction) => Promise<void> | void;
  onDeleteTransaction: (txId: string) => Promise<void> | void;
}

export const TransactionsSection: React.FC<TransactionsSectionProps> = ({
  transactions,
  commitments,
  budget,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const clock = getCurrentClock(budget.timezone);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(500);
  const [category, setCategory] = useState<string>('needs');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [type, setType] = useState<TransactionType>('actual_expense');
  const [date, setDate] = useState(clock.isoDate);
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState('');

  // Collect any existing user custom categories from transactions
  const userCustomCategories = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .map((tx) =>
            tx.customCategory ||
            (['needs', 'wants', 'income', 'savings', 'debt', 'emergency'].includes(tx.category)
              ? null
              : tx.category)
          )
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    );
  }, [transactions]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let incomeCount = 0;
    let totalExpenses = 0;
    let expenseCount = 0;
    let needsTotal = 0;
    let wantsTotal = 0;
    let customTotal = 0;
    let unpaidTotal = 0;
    let unpaidCount = 0;

    for (const tx of transactions) {
      if (tx.type === 'confirmed_income' || tx.type === 'estimated_income' || tx.category === 'income') {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        totalExpenses += tx.amount;
        expenseCount++;
        if (tx.customCategory || tx.category === 'custom') {
          customTotal += tx.amount;
        } else if (tx.category === 'needs') {
          needsTotal += tx.amount;
        } else if (tx.category === 'wants') {
          wantsTotal += tx.amount;
        }
      }

      if (!tx.isPaid) {
        unpaidTotal += tx.amount;
        unpaidCount++;
      }
    }

    // Unpaid commitments from commitments list
    const unpaidCommitments = commitments.filter((c) => !c.isPaid && !c.isPaused);
    const unpaidCommitmentsTotal = unpaidCommitments.reduce((sum, c) => sum + c.amount, 0);

    return {
      totalIncome,
      incomeCount,
      totalExpenses,
      expenseCount,
      needsTotal,
      wantsTotal,
      customTotal,
      unpaidTotal: unpaidTotal + unpaidCommitmentsTotal,
      unpaidCount: unpaidCount + unpaidCommitments.length,
    };
  }, [transactions, commitments]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tx.name.toLowerCase().includes(q);
        const matchesNote = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        const matchesCustom = tx.customCategory ? tx.customCategory.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesNote && !matchesCustom) return false;
      }

      // Category / Type filter
      if (filter === 'all') return true;
      if (filter === 'income') {
        return (
          tx.category === 'income' ||
          tx.type === 'confirmed_income' ||
          tx.type === 'estimated_income'
        );
      }
      if (filter === 'expenses') {
        return tx.category !== 'income' && tx.type !== 'confirmed_income' && tx.type !== 'estimated_income';
      }
      if (filter === 'needs') return tx.category === 'needs';
      if (filter === 'wants') return tx.category === 'wants';
      if (filter === 'paid') return tx.isPaid;
      if (filter === 'unpaid') return !tx.isPaid;
      if (filter.startsWith('custom:')) {
        const targetCustom = filter.replace('custom:', '');
        return tx.customCategory === targetCustom || tx.category === targetCustom;
      }
      return tx.category === filter;
    });
  }, [transactions, filter, searchQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) return;

    const isCustom =
      category === 'custom' ||
      !['needs', 'wants', 'income', 'savings', 'debt', 'emergency'].includes(category);
    const effectiveCategory = isCustom ? 'custom' : (category as TransactionCategory);
    const effectiveCustomLabel = isCustom
      ? customCategoryInput.trim() || 'Custom Expense'
      : undefined;

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      name: name.trim(),
      amount,
      currency: budget.currency || 'INR',
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

  return (
    <section id="section-transactions" className="space-y-6">
      {/* Section Header */}
      <div className="bg-white rounded-3xl border border-[#E8E3DA] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#F2EDE4]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#133226]/10 text-[#133226] text-xs font-bold uppercase tracking-wider">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#133226]" />
              Section B · Transactions & Expenses
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1C2B22] tracking-tight">
              Dynamic Ledger & Expense Control
            </h2>
            <p className="text-xs sm:text-sm text-[#5E7166]">
              Authoritative transaction records, custom categories, upcoming commitments, and real-time cash ledger.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] transition-all shadow-xs shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add Transaction'}</span>
          </button>
        </div>

        {/* Aggregate KPI Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E8E3DA]/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E7166] mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Income Records</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-[#16A34A]">
              +{formatINR(metrics.totalIncome)}
            </p>
            <p className="text-[11px] text-[#8B9B90] mt-0.5">{metrics.incomeCount} entries</p>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E8E3DA]/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E7166] mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Total Expenses</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-[#1C2B22]">
              {formatINR(metrics.totalExpenses)}
            </p>
            <p className="text-[11px] text-[#8B9B90] mt-0.5">{metrics.expenseCount} entries recorded</p>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E8E3DA]/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E7166] mb-1">
              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Unpaid Obligations</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-[#D97706]">
              {formatINR(metrics.unpaidTotal)}
            </p>
            <p className="text-[11px] text-[#8B9B90] mt-0.5">{metrics.unpaidCount} bills scheduled</p>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E8E3DA]/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E7166] mb-1">
              <Tag className="w-3.5 h-3.5 text-[#133226]" />
              <span>Needs vs Wants</span>
            </div>
            <p className="text-sm font-bold text-[#1C2B22] truncate">
              {formatINR(metrics.needsTotal)} / {formatINR(metrics.wantsTotal)}
            </p>
            <p className="text-[11px] text-[#8B9B90] mt-0.5">
              Custom: {formatINR(metrics.customTotal)}
            </p>
          </div>
        </div>

        {/* Collapsible Add Transaction Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#F4F1EA] border border-[#E2DDD3] space-y-4 animate-slideDown"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#133226] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Record New Transaction
              </h3>
              <span className="text-[11px] text-[#5E7166]">Updates deterministic cash balance immediately</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5E7166] uppercase mb-1">
                  Description / Payee *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery store, Freelance client, Coffee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D5CFC3] bg-white text-[#1C2B22] focus:outline-hidden focus:ring-2 focus:ring-[#133226]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5E7166] uppercase mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D5CFC3] bg-white text-[#1C2B22] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#133226]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5E7166] uppercase mb-1">
                  Transaction Type
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as TransactionType;
                    setType(newType);
                    if (newType === 'confirmed_income' || newType === 'estimated_income') {
                      setCategory('income');
                    } else if (newType === 'savings_transfer') {
                      setCategory('savings');
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D5CFC3] bg-white text-[#1C2B22] focus:outline-hidden focus:ring-2 focus:ring-[#133226]"
                >
                  <option value="actual_expense">Actual Expense (Paid)</option>
                  <option value="planned_expense">Planned / Bill (Upcoming)</option>
                  <option value="confirmed_income">Confirmed Income</option>
                  <option value="estimated_income">Estimated Future Income</option>
                  <option value="savings_transfer">Savings Transfer</option>
                  <option value="debt_payment">Debt Repayment</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5E7166] uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D5CFC3] bg-white text-[#1C2B22] focus:outline-hidden focus:ring-2 focus:ring-[#133226]"
                >
                  <option value="needs">Needs & Essentials</option>
                  <option value="wants">Wants & Discretionary</option>
                  <option value="income">Income</option>
                  <option value="savings">Savings & Investments</option>
                  <option value="debt">Debt Repayment</option>
                  <option value="emergency">Emergency Fund</option>
                  <option value="custom">★ Custom Category...</option>
                  {userCustomCategories.map((c) => (
                    <option key={c} value={c}>
                      Custom: {c}
                    </option>
                  ))}
                </select>
              </div>

              {category === 'custom' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#854D0E] uppercase mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#854D0E]" />
                    Custom Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pet Care, Gadgets, Books"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#FDE047] bg-[#FEFCE8] text-[#854D0E] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#CA8A04]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#5E7166] uppercase mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D5CFC3] bg-white text-[#1C2B22] focus:outline-hidden focus:ring-2 focus:ring-[#133226]"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="tx-is-paid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#133226] focus:ring-[#133226]"
                />
                <label htmlFor="tx-is-paid" className="text-xs font-bold text-[#1C2B22] cursor-pointer">
                  Mark as Already Paid / Settled
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2DDD3]">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-xs font-semibold text-[#5E7166] hover:bg-[#E8E3DA] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-[#133226] text-[#D4F478] hover:bg-[#1A4233] rounded-xl shadow-xs"
              >
                Save to Ledger
              </button>
            </div>
          </form>
        )}

        {/* Filter bar and search */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-[#F2EDE4]">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-medium pb-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                filter === 'all'
                  ? 'bg-[#133226] text-[#D4F478] font-bold'
                  : 'bg-[#F2EDE4] text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              All Records ({transactions.length})
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                filter === 'income'
                  ? 'bg-[#16A34A] text-white font-bold'
                  : 'bg-[#F2EDE4] text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilter('needs')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                filter === 'needs'
                  ? 'bg-[#133226] text-white font-bold'
                  : 'bg-[#F2EDE4] text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Needs
            </button>
            <button
              onClick={() => setFilter('wants')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                filter === 'wants'
                  ? 'bg-[#133226] text-white font-bold'
                  : 'bg-[#F2EDE4] text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Wants
            </button>
            {userCustomCategories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(`custom:${c}`)}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                  filter === `custom:${c}`
                    ? 'bg-[#B45309] text-white font-bold'
                    : 'bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047] hover:bg-[#FEF08A]'
                }`}
              >
                ★ {c}
              </button>
            ))}
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                filter === 'paid'
                  ? 'bg-[#133226] text-[#D4F478] font-bold'
                  : 'bg-[#F2EDE4] text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                filter === 'unpaid'
                  ? 'bg-[#D97706] text-white font-bold'
                  : 'bg-[#F2EDE4] text-[#5E7166] hover:text-[#1C2B22]'
              }`}
            >
              Unpaid
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#8B9B90] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-[#1C2B22] focus:outline-hidden focus:ring-2 focus:ring-[#133226]"
            />
          </div>
        </div>

        {/* Ledger Transaction Items */}
        <div className="mt-4 divide-y divide-[#F2EDE4]">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-[#5E7166]">
              <ArrowRightLeft className="w-8 h-8 mx-auto text-[#BACDBF] mb-2" />
              <p className="text-sm font-semibold text-[#1C2B22]">No matching transactions</p>
              <p className="text-xs text-[#8B9B90] mt-0.5">
                {transactions.length === 0
                  ? 'Click "Add Transaction" or use voice commands to record your spending.'
                  : 'No transactions match the selected filter.'}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncome =
                tx.type === 'confirmed_income' ||
                tx.type === 'estimated_income' ||
                tx.category === 'income';

              return (
                <div
                  key={tx.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : tx.customCategory
                          ? 'bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047]'
                          : 'bg-[#133226]/10 text-[#133226]'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : tx.category === 'savings' ? (
                        <PiggyBank className="w-4 h-4" />
                      ) : tx.category === 'debt' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : tx.customCategory ? (
                        <Tag className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1C2B22] truncate">{tx.name}</span>
                        {tx.customCategory ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEFCE8] text-[#854D0E] border border-[#FDE047]">
                            ★ {tx.customCategory}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#5E7166] uppercase px-1.5 py-0.5 rounded-md bg-[#F2EDE4]">
                            {tx.category}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.isPaid
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : 'bg-[#D97706]/10 text-[#D97706]'
                          }`}
                        >
                          {tx.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8B9B90]">
                        <span>{tx.date}</span>
                        {tx.notes && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">{tx.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-black ${
                        isIncome ? 'text-[#16A34A]' : 'text-[#1C2B22]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </span>

                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="w-8 h-8 rounded-lg hover:bg-[#FEE2E2] flex items-center justify-center text-[#8B9B90] hover:text-[#DC2626] transition-colors"
                      title="Remove transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
