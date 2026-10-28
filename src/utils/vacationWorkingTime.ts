import type { ISODateRange } from './monthHelperFunc';
import { getWorkedDaysInMonthWithPolishHolidays } from './workingTimeHelper';

/** Standard Mon-Fri 8-hour schedule represented by the current V1 calendar.
 * For a nonstandard shift plan, payroll requires manually verified data.
 */
export const getVacationScheduledHours = ({
  year, month, leave, l4 = [], holidays = [], employmentStartDate,
  employmentEndDate,
}: {
  year: number; month: number; leave: ISODateRange[]; l4?: ISODateRange[];
  holidays?: ISODateRange[]; employmentStartDate?: string | null;
  employmentEndDate?: string | null;
}): number => {
  const scheduled = getWorkedDaysInMonthWithPolishHolidays(
    year, month - 1, holidays, l4, [], employmentStartDate, employmentEndDate,
  );
  const remaining = getWorkedDaysInMonthWithPolishHolidays(
    year, month - 1, holidays, l4, leave, employmentStartDate, employmentEndDate,
  );
  return Math.max(0, scheduled - remaining) * 8;
};

export const getHistoricalActuallyWorkedHours = ({
  year, month, workingHours, l4, leave, holidays, employmentStartDate,
  employmentEndDate, dailyOvertime, weekendHolidayOvertime, nightOvertime,
}: {
  year: number; month: number; workingHours: number; l4: ISODateRange[];
  leave: ISODateRange[]; holidays: ISODateRange[];
  employmentStartDate?: string | null; employmentEndDate?: string | null;
  dailyOvertime: number; weekendHolidayOvertime: number; nightOvertime: number;
}): { regularHours: number; totalHours: number } => {
  const scheduledDays = getWorkedDaysInMonthWithPolishHolidays(
    year, month - 1, holidays, [], [],
  );
  const workedDays = getWorkedDaysInMonthWithPolishHolidays(
    year, month - 1, holidays, l4, leave, employmentStartDate, employmentEndDate,
  );
  const regularHours = Math.max(0, workingHours - (scheduledDays - workedDays) * 8);
  const overtime = dailyOvertime + weekendHolidayOvertime + nightOvertime;
  return { regularHours, totalHours: regularHours + overtime };
};
