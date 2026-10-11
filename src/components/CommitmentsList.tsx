/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Repeat,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Plus,
  Home,
  Phone,
  Music,
  Wifi,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CommitmentItem } from '../types/finance';
import { formatINR } from '../utils/financeCalculations';

interface CommitmentsListProps {
  commitments: CommitmentItem[];
  currentDay: number;
  totalDays: number;
  onTogglePauseSubscription: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onAddCommitment: (commitment: CommitmentItem) => void;
}

export const CommitmentsList: React.FC<CommitmentsListProps> = ({
  commitments,
  currentDay,
  totalDays,
  onTogglePauseSubscription,
  onMarkPaid,
  onAddCommitment,
}) => {
  const [filter, setFilter] = useState<'all' | 'essential' | 'subscription'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState<number>(300);
  const [newDueDate, setNewDueDate] = useState<number>(15);
  const [newCategory, setNewCategory] = useState<'essential' | 'subscription'>('essential');

  const daysLeft = Math.max(0, totalDays - currentDay);
  const remainingWeeks = Math.ceil(daysLeft / 7);

  const filtered = commitments.filter((item) => {
    if (filter === 'essential') return item.category === 'essential';
    if (filter === 'subscription') return item.category === 'subscription';
    return true;
  });

  const musicSub = commitments.find((c) => c.id === 'com-music');
  const isMusicPaused = musicSub?.isPaused;
  const musicPotentialSavings = (musicSub?.amount || 199) * remainingWeeks;
  const dailyBoostFromMusic = Math.round(musicPotentialSavings / Math.max(1, daysLeft));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newAmount <= 0) return;

    const newItem: CommitmentItem = {
      id: `com-custom-${Date.now()}`,
      name: newTitle.trim(),
      category: newCategory,
      amount: newAmount,
      dueDateDay: newDueDate,
      isPaid: false,
      frequency: newCategory === 'subscription' ? 'weekly' : 'monthly',
      note: 'User added custom commitment.',
    };

    onAddCommitment(newItem);
    setNewTitle('');
    setShowAddModal(false);
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-4 h-4 text-[#133226]" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-[#133226]" />;
      case 'music':
        return <Music className="w-4 h-4 text-[#133226]" />;
      case 'wifi':
        return <Wifi className="w-4 h-4 text-[#133226]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#133226]" />;
    }
  };

  return (
    <div className="bg-white border border-[#E8E3DA] rounded-3xl p-5 sm:p-7 shadow-sm">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE2]">
        <div>
          <h3 className="text-xl font-bold text-[#1C2B22]">
            Commitments & Subscriptions
          </h3>
          <p className="text-xs text-[#5E7166] mt-0.5">
            Upcoming essentials that must be protected vs flexible recurring services.
          </p>
        </div>

        {/* Filter controls & Add Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F2EDE4] rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-white text-[#133226] shadow-xs'
                  : 'text-[#5E7166] hover:text-[#133226]'
              }`}
            >
              All ({commitments.length})
            </button>
            <button
              onClick={() => setFilter('essential')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'essential'
                  ? 'bg-white text-[#133226] shadow-xs'
                  : 'text-[#5E7166] hover:text-[#133226]'
              }`}
            >
              Essentials
            </button>
            <button
              onClick={() => setFilter('subscription')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'subscription'
                  ? 'bg-white text-[#133226] shadow-xs'
                  : 'text-[#5E7166] hover:text-[#133226]'
              }`}
            >
              Subscriptions
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E0DAD0] hover:bg-[#EFEAE0] flex items-center justify-center text-[#133226] transition-colors"
            title="Add a custom commitment"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subscription Pause Spotlight Explainer (Required in prompt) */}
      {musicSub && (
        <div className="mt-4 p-4 rounded-2xl bg-[#F7F5F0] border border-[#E8E2D6] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMusicPaused ? 'bg-[#FEE5D8] text-[#C2410C]' : 'bg-[#D4F478] text-[#0D281E]'}`}>
              <Music className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1C2B22]">
                  Interactive Spotlight: Music Subscription (₹199 / week)
                </span>
                <span className="text-[10px] font-semibold uppercase text-[#5E7166]">
                  {isMusicPaused ? 'Currently Paused' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-[#5E7166]">
                {isMusicPaused ? (
                  <>
                    <strong className="text-[#133226]">Paused:</strong> You saved <strong>{formatINR(musicPotentialSavings)}</strong> for the rest of this month! Your safe daily allowance gained <strong>+{formatINR(dailyBoostFromMusic)}/day</strong>.
                  </>
                ) : (
                  <>
                    Active recurring cost: ~{formatINR(musicPotentialSavings)} will be charged over the next {remainingWeeks} weeks. Pausing it frees up <strong>+{formatINR(dailyBoostFromMusic)}/day</strong> for casual spending.
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onTogglePauseSubscription(musicSub.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
              isMusicPaused
                ? 'bg-[#133226] text-[#D4F478] hover:bg-[#1C4233]'
                : 'bg-white border border-[#DDD7CD] text-[#5E7166] hover:text-[#1C2B22] hover:bg-[#FAF8F5]'
            }`}
          >
            {isMusicPaused ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume Subscription</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause to Save ₹{musicPotentialSavings}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Commitments List Rows */}
      <div className="divide-y divide-[#F0EBE2] mt-2">
        {filtered.map((item) => {
          const isDueSoon = !item.isPaid && item.dueDateDay > currentDay && item.dueDateDay <= currentDay + 5;
          const isPastDue = !item.isPaid && item.dueDateDay < currentDay;

          return (
            <div
              key={item.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors px-2 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F2EDE4] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.iconType)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#1C2B22]">
                      {item.name}
                    </span>

                    {/* Unboxed category label */}
                    <span className="text-xs text-[#5E7166]">
                      {item.category === 'essential' ? 'Essential Living' : 'Recurring Subscription'}
                    </span>

                    {item.isPaid && (
                      <span className="text-xs text-[#20703B] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Paid
                      </span>
                    )}

                    {isDueSoon && (
                      <span className="text-xs text-[#C2410C] font-semibold">
                        Due in {item.dueDateDay - currentDay} days
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#5E7166]">
                    {item.note || `Due on Day ${item.dueDateDay} of 30`}
                    {item.frequency === 'weekly' && ` · ${item.isPaused ? 'Paused' : 'Billed weekly'}`}
                  </p>
                </div>
              </div>

              {/* Amount and Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-base font-extrabold tabular-nums text-[#1C2B22]">
                    {formatINR(item.amount)}
                    {item.frequency === 'weekly' && <span className="text-xs font-normal text-[#5E7166]">/wk</span>}
                  </div>
                  <span className="text-[11px] text-[#8B9B90]">
                    {item.isPaid ? 'Settled this cycle' : `Due on Day ${item.dueDateDay}`}
                  </span>
                </div>

                {item.category === 'subscription' ? (
                  <button
                    onClick={() => onTogglePauseSubscription(item.id)}
                    className="p-2 rounded-lg text-xs font-semibold border border-[#E0DAD0] hover:bg-[#F2EDE4] text-[#133226] transition-colors"
                    title={item.isPaused ? 'Resume' : 'Pause subscription'}
                  >
                    {item.isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                  </button>
                ) : !item.isPaid ? (
                  <button
                    onClick={() => onMarkPaid(item.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F2EDE4] hover:bg-[#E5DFD4] text-[#133226] transition-colors"
                  >
                    Mark Paid
                  </button>
                ) : (
                  <span className="text-xs text-[#20703B] font-medium px-2">Settled</span>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center space-y-1.5">
            <p className="text-sm font-semibold text-[#1C2B22]">No commitments or subscriptions</p>
            <p className="text-xs text-[#5E7166]">
              Click "+ Add Commitment" to track recurring rent, bills, or subscriptions.
            </p>
          </div>
        )}
      </div>

      {/* Add Commitment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-[#E8E3DA] space-y-4">
            <h4 className="text-lg font-bold text-[#1C2B22]">Add New Commitment</h4>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#5E7166] mb-1">
                  Name / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laundry card, Library deposit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5E7166] mb-1">
                    Amount (INR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5E7166] mb-1">
                    Due Day (1–30)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E7166] mb-1">
                  Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategory('essential')}
                    className={`py-2 text-xs font-semibold rounded-xl border ${
                      newCategory === 'essential'
                        ? 'bg-[#133226] text-white border-[#133226]'
                        : 'bg-white text-[#5E7166] border-[#DDD7CD]'
                    }`}
                  >
                    Essential Living
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategory('subscription')}
                    className={`py-2 text-xs font-semibold rounded-xl border ${
                      newCategory === 'subscription'
                        ? 'bg-[#133226] text-white border-[#133226]'
                        : 'bg-white text-[#5E7166] border-[#DDD7CD]'
                    }`}
                  >
                    Recurring Sub
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5E7166] hover:bg-[#F2EDE4] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#133226] text-[#D4F478] rounded-xl hover:bg-[#1C4233] transition-colors"
                >
                  Save Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
