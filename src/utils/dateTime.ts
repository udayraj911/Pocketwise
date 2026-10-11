/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Real Date & Time Utilities
 * Reads actual system clock, computes dynamic calendar days,
 * supports leap years, month boundaries, and user timezone (default Asia/Kolkata).
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export interface ClockState {
  timeStr: string; // e.g. "03:15:42 PM"
  dateStr: string; // e.g. "Sunday, 11 October 2026"
  shortDateStr: string; // e.g. "11 Oct 2026"
  isoDate: string; // e.g. "2026-10-11"
  year: number;
  month: number; // 1-12
  day: number;
  weekday: string;
}

/**
 * Returns current clock state formatted in the specified timezone
 */
export function getCurrentClock(timezone = DEFAULT_TIMEZONE): ClockState {
  const now = new Date();

  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const fullDateFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const shortDateFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Extract year, month, day in target timezone
  const partsFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const isoDate = partsFormatter.format(now); // "YYYY-MM-DD"
  const [yearStr, monthStr, dayStr] = isoDate.split('-');

  const weekdayFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    weekday: 'short',
  });

  return {
    timeStr: timeFormatter.format(now),
    dateStr: fullDateFormatter.format(now),
    shortDateStr: shortDateFormatter.format(now),
    isoDate,
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr),
    weekday: weekdayFormatter.format(now),
  };
}

/**
 * Formats a YYYY-MM-DD date string into human readable e.g. "15 Oct 2026"
 */
export function formatDateHuman(isoDate: string, timezone = DEFAULT_TIMEZONE): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Generates default current month plan dates:
 * Start: 1st of current month
 * End: Last day of current month (handles 28, 29, 30, 31 dynamically)
 */
export function getDefaultCurrentMonthPlan(timezone = DEFAULT_TIMEZONE): {
  startDate: string;
  endDate: string;
  totalDays: number;
  currentDay: number;
  daysRemaining: number;
} {
  const clock = getCurrentClock(timezone);
  const year = clock.year;
  const month = clock.month; // 1-12

  // Month starts on day 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

  // Number of days in this specific month (handles leap year 2028/2032 etc)
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  return calculatePlanMetricsFromDates(startDate, endDate, clock.isoDate);
}

/**
 * Dynamic calculation of total days, current day of plan, and remaining days
 * based entirely on real calendar dates.
 */
export function calculatePlanMetricsFromDates(
  startDateStr: string,
  endDateStr: string,
  currentDateStr: string
): {
  startDate: string;
  endDate: string;
  totalDays: number;
  currentDay: number;
  daysRemaining: number;
} {
  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const [cY, cM, cD] = currentDateStr.split('-').map(Number);

  const startUtc = Date.UTC(sY, sM - 1, sD);
  const endUtc = Date.UTC(eY, eM - 1, eD);
  const currUtc = Date.UTC(cY, cM - 1, cD);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Total days inclusive: e.g. Oct 1 to Oct 30 = 30 days
  const diffDays = Math.round((endUtc - startUtc) / MS_PER_DAY);
  const totalDays = Math.max(1, diffDays + 1);

  // Current day index: if today is start date, day is 1
  const elapsedDays = Math.round((currUtc - startUtc) / MS_PER_DAY);
  const currentDay = Math.max(1, Math.min(totalDays, elapsedDays + 1));

  // Remaining days till plan end (including today)
  const remaining = Math.max(0, Math.round((endUtc - currUtc) / MS_PER_DAY));

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalDays,
    currentDay,
    daysRemaining: remaining,
  };
}
