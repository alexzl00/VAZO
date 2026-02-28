import { getPolishHolidays } from "./getHolidays";

import dayjs from "dayjs";
import type { DateRange } from '../components/DaysPicker';

export type ISODateRange = {
  start: string; // ISO date "YYYY-MM-DD"
  end: string;
};

function isInRanges(dateStr: string, ranges: ISODateRange[]) {
  return ranges.some(
    r => dateStr >= r.start && dateStr <= r.end
  );
}

function toISODateLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export const getMonthBounds = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1); // last day of month
  return { start, end };
};

export const isInMonth = (dateStr: string, year: number, month: number) => {
  const d = new Date(dateStr);
  const { start, end } = getMonthBounds(year, month);
  return d >= start && d <= end;
};


export function getWorkedDaysInMonth(
  year: number,
  month: number,
  holidays: ISODateRange[],
  sickLeaves: ISODateRange[],
  vacations: ISODateRange[]
) {
  let workedDays = 0;

  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay();
    const dateStr = toISODateLocal(date);

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = isInRanges(dateStr, holidays);
    const isSick = isInRanges(dateStr, sickLeaves);
    const isVacation = isInRanges(dateStr, vacations);

    // ---- PRIORITY LOGIC ----

    if (isWeekend) {
      // free day
    }
    else if (isSick) {
      // paid sick (even if holiday)
    }
    else if (isHoliday) {
      // holiday
    }
    else if (isVacation) {
      // vacation only consumes working day
    }
    else {
      workedDays++;
    }

    date.setDate(date.getDate() + 1);
  }

  return workedDays;
}

export function isoToDayjsRanges(isoRanges: ISODateRange[]): DateRange[] {
  return isoRanges.map(r => ({
    start: dayjs(r.start),
    end: dayjs(r.end),
  }));
}

export function countDays(ranges: ISODateRange[]): number {
  let total = 0;

  for (const range of ranges) {
    const start = dayjs(range.start);
    const end = dayjs(range.end);

    const days = end.diff(start, "day") + 1;

    total += days;
  }

  return total;
}

export function countWorkingDays(ranges: ISODateRange[]): number {
  let total = 0;

  for (const range of ranges) {
    let current = dayjs(range.start);
    const end = dayjs(range.end);

    while (current.isSameOrBefore(end, "day")) {
      const dayOfWeek = current.day();
      // Monday = 1, ..., Friday = 5
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        total += 1;
      }
      current = current.add(1, "day");
    }
  }

  return total;
}