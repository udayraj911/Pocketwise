/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { calculatePlanMetricsFromDates, getCurrentClock, formatDateHuman } from '../utils/dateTime';
import { BudgetData } from '../types/finance';

interface PlanDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetData;
  onSavePlanDates: (startDate: string, endDate: string) => void;
}

export const PlanDatePickerModal: React.FC<PlanDatePickerModalProps> = ({
  isOpen,
  onClose,
  budget,
  onSavePlanDates,
}) => {
  const clock = getCurrentClock(budget.timezone);
  const [startDate, setStartDate] = useState(budget.planStartDate || clock.isoDate);
  const [endDate, setEndDate] = useState(budget.planEndDate || clock.isoDate);

  if (!isOpen) return null;

  // Real-time recalculation of previewed dates
  const preview = calculatePlanMetricsFromDates(startDate, endDate, clock.isoDate);
  const isValid = startDate && endDate && startDate <= endDate;

  // Preset 1: Current Calendar Month
  const handleCurrentMonthPreset = () => {
    const y = clock.year;
    const m = clock.month;
    const sDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const eDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setStartDate(sDate);
    setEndDate(eDate);
  };

  // Preset 2: Next 30 Days
  const handle30DaysPreset = () => {
    const sDate = clock.isoDate;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const eDate = d.toISOString().split('T')[0];
    setStartDate(sDate);
    setEndDate(eDate);
  };

  // Preset 3: Bi-weekly (14 days)
  const handle14DaysPreset = () => {
    const sDate = clock.isoDate;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const eDate = d.toISOString().split('T')[0];
    setStartDate(sDate);
    setEndDate(eDate);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSavePlanDates(startDate, endDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#E8E3DA] space-y-5 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#133226] text-[#D4F478] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C2B22]">
                Financial Plan Calendar
              </h3>
              <p className="text-xs text-[#5E7166]">
                Set custom start & end dates for this cycle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-[#F2EDE4] flex items-center justify-center text-[#5E7166]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#5E7166]">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCurrentMonthPreset}
              className="text-xs font-medium px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#DDD7CD] rounded-lg text-[#1C2B22] transition-colors"
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={handle30DaysPreset}
              className="text-xs font-medium px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#DDD7CD] rounded-lg text-[#1C2B22] transition-colors"
            >
              Rolling 30 Days
            </button>
            <button
              type="button"
              onClick={handle14DaysPreset}
              className="text-xs font-medium px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#DDD7CD] rounded-lg text-[#1C2B22] transition-colors"
            >
              14 Days (Bi-weekly)
            </button>
          </div>
        </div>

        {/* Date Inputs */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5E7166] mb-1">
                Plan Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5E7166] mb-1">
                Plan End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226]"
              />
            </div>
          </div>

          {/* Dynamic Preview Box */}
          {isValid ? (
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EDE8E0] space-y-1 text-xs">
              <div className="font-bold text-[#133226] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {formatDateHuman(startDate, budget.timezone)} to {formatDateHuman(endDate, budget.timezone)}
                </span>
              </div>
              <div className="text-[#5E7166]">
                Total Duration: <strong>{preview.totalDays} days</strong> · Currently on <strong>Day {preview.currentDay}</strong> · <strong>{preview.daysRemaining} days remaining</strong>.
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#C2410C] bg-[#FEE5D8] p-2.5 rounded-xl">
              End date must be on or after start date.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EBE2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5E7166] hover:bg-[#F2EDE4] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-xs font-bold bg-[#133226] text-[#D4F478] rounded-xl hover:bg-[#1C4233] transition-colors disabled:opacity-50"
            >
              Apply Plan Dates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
