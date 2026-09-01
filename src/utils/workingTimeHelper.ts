import dayjs from 'dayjs';

import { getPolishHolidays } from './getHolidays';
import { getWorkedDaysInMonth } from './monthHelperFunc';
import type { ISODateRange } from './monthHelperFunc';

const toIso = (value: { format: (template: string) => string }) =>
  value.format('YYYY-MM-DD');

const isDateInsideRange = (dateIso: string, range: ISODateRange) =>
  dateIso >= range.start && dateIso <= range.end;

const isDateInsideAnyRange = (dateIso: string, ranges: ISODateRange[]) =>
  ranges.some((range) => isDateInsideRange(dateIso, range));

export const getPolishStatutoryHolidayRanges = (
  year: number,
): ISODateRange[] =>
  getPolishHolidays(year).map((holiday) => ({
    start: holiday.date,
    end: holiday.date,
  }));

export const getWorkedDaysInMonthWithPolishHolidays = (
  year: number,
  monthIndex: number,
  additionalDaysOff: ISODateRange[] = [],
  l4: ISODateRange[] = [],
  leave: ISODateRange[] = [],
  periodStart?: string | null,
  periodEnd?: string | null,
) => {
  const statutoryHolidays = getPolishStatutoryHolidayRanges(year);

  return getWorkedDaysInMonth(
    year,
    monthIndex,
    [...statutoryHolidays, ...additionalDaysOff],
    l4,
    leave,
    periodStart,
    periodEnd,
  );
};

export const getNominalWorkingHoursInMonth = (
  year: number,
  monthIndex: number,
  additionalDaysOff: ISODateRange[] = [],
): number => {
  const start = dayjs(new Date(year, monthIndex, 1));
  const daysInMonth = start.daysInMonth();

  let mondayToFridayDays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = dayjs(new Date(year, monthIndex, day));
    const weekday = date.day();

    if (weekday >= 1 && weekday <= 5) {
      mondayToFridayDays += 1;
    }
  }

  const statutoryHolidays = getPolishHolidays(year).filter(
    (holiday) => dayjs(holiday.date).month() === monthIndex,
  );

  const statutoryReductionHours = statutoryHolidays.filter(
    (holiday) => dayjs(holiday.date).day() !== 0,
  ).length * 8;

  const statutoryHolidayDates = new Set(
    statutoryHolidays.map((holiday) => holiday.date),
  );

  const additionalWeekdayDates = new Set<string>();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = dayjs(new Date(year, monthIndex, day));
    const weekday = date.day();

    if (weekday < 1 || weekday > 5) continue;

    const iso = date.format('YYYY-MM-DD');

    if (
      !statutoryHolidayDates.has(iso) &&
      isDateInsideAnyRange(iso, additionalDaysOff)
    ) {
      additionalWeekdayDates.add(iso);
    }
  }

  const baseHours = mondayToFridayDays * 8;
  const additionalReductionHours = additionalWeekdayDates.size * 8;

  return Math.max(
    0,
    baseHours - statutoryReductionHours - additionalReductionHours,
  );
};

/**
 * Nominal Mon-Fri working hours in the month that fall outside the effective
 * employment period. Statutory Polish holidays and user-selected extra days off
 * are excluded consistently with the rest of the calculator.
 */
export const getWorkingHoursOutsideEmploymentPeriod = (
  year: number,
  monthIndex: number,
  additionalDaysOff: ISODateRange[] = [],
  periodStart?: string | null,
  periodEnd?: string | null,
): number => {
  if (!periodStart && !periodEnd) return 0;

  const fullMonthWorkingDays = getWorkedDaysInMonthWithPolishHolidays(
    year,
    monthIndex,
    additionalDaysOff,
    [],
    [],
  );

  const employmentWorkingDays = getWorkedDaysInMonthWithPolishHolidays(
    year,
    monthIndex,
    additionalDaysOff,
    [],
    [],
    periodStart,
    periodEnd,
  );

  return Math.max(
    0,
    (fullMonthWorkingDays - employmentWorkingDays) * 8,
  );
};
