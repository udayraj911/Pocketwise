/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Globe, CalendarDays, Edit3 } from 'lucide-react';
import { getCurrentClock, ClockState, DEFAULT_TIMEZONE, formatDateHuman } from '../utils/dateTime';
import { BudgetData } from '../types/finance';

interface LiveClockBarProps {
  budget: BudgetData;
  onOpenDateRangeModal: () => void;
  onTimezoneChange: (tz: string) => void;
}

export const LiveClockBar: React.FC<LiveClockBarProps> = ({
  budget,
  onOpenDateRangeModal,
  onTimezoneChange,
}) => {
  const [clock, setClock] = useState<ClockState>(() => getCurrentClock(budget.timezone || DEFAULT_TIMEZONE));
  const [showTzDropdown, setShowTzDropdown] = useState(false);

  const timezones = [
    { label: 'India Standard Time (IST)', value: 'Asia/Kolkata' },
    { label: 'Coordinated Universal Time (UTC)', value: 'UTC' },
    { label: 'US Eastern Time (ET)', value: 'America/New_York' },
    { label: 'US Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'British Summer Time / GMT', value: 'Europe/London' },
    { label: 'Gulf Standard Time (GST)', value: 'Asia/Dubai' },
    { label: 'Singapore Time (SGT)', value: 'Asia/Singapore' },
  ];

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(getCurrentClock(budget.timezone || DEFAULT_TIMEZONE));
    }, 1000);
    return () => clearInterval(timer);
  }, [budget.timezone]);

  return (
    <div className="w-full bg-[#F4EFEA] border-b border-[#E8E2D6] py-2 px-4 sm:px-6 text-xs text-[#4A5D50]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: Dynamic Live System Clock */}
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 font-mono text-[#1C2B22]">
            <Clock className="w-3.5 h-3.5 text-[#133226]" />
            <span className="font-bold tabular-nums">{clock.timeStr}</span>
          </div>

          <span className="text-[#8B9B90] hidden sm:inline">·</span>

          <div className="flex items-center gap-1.5 text-[#1C2B22]">
            <Calendar className="w-3.5 h-3.5 text-[#133226]" />
            <span>{clock.dateStr}</span>
          </div>

          <span className="text-[#8B9B90] hidden md:inline">·</span>

          {/* Timezone Switcher */}
          <div className="relative inline-block">
            <button
              onClick={() => setShowTzDropdown(!showTzDropdown)}
              className="flex items-center gap-1 text-[#5E7166] hover:text-[#133226] font-medium transition-colors"
              title="Change Timezone"
            >
              <Globe className="w-3 h-3 text-[#133226]" />
              <span>{budget.timezone || DEFAULT_TIMEZONE}</span>
            </button>

            {showTzDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-[#E8E3DA] p-1.5 z-40">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B9B90]">
                  Select Timezone
                </div>
                {timezones.map((tz) => (
                  <button
                    key={tz.value}
                    onClick={() => {
                      onTimezoneChange(tz.value);
                      setShowTzDropdown(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors ${
                      (budget.timezone || DEFAULT_TIMEZONE) === tz.value
                        ? 'bg-[#133226] text-[#D4F478] font-bold'
                        : 'text-[#1C2B22] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {tz.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Financial Plan Date Range & Remaining Days */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#1C2B22] bg-white px-2.5 py-1 rounded-lg border border-[#E0DAD0] shadow-2xs">
            <CalendarDays className="w-3.5 h-3.5 text-[#133226]" />
            <span className="font-semibold">
              Plan: {formatDateHuman(budget.planStartDate, budget.timezone)} – {formatDateHuman(budget.planEndDate, budget.timezone)}
            </span>
            <span className="text-[#8B9B90]">·</span>
            <span className="font-bold text-[#133226]">
              {budget.totalDays - budget.currentDay} days left
            </span>
          </div>

          <button
            onClick={onOpenDateRangeModal}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#133226] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E0DAD0]"
            title="Change Plan Start or End Date"
          >
            <Edit3 className="w-3 h-3" />
            <span className="hidden sm:inline">Change Dates</span>
          </button>
        </div>
      </div>
    </div>
  );
};
