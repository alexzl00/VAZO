/** Shared reconstruction of historical UoP overtime/night earnings.
 * Used by both L4 and vacation history; never calculates either benefit base.
 */
import type { UopSicknessHistoryMonth } from '../types/uopSicknessBase';

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const getHistoricalMinimumWage = (year: number, month: number): number | null => {
  if (year === 2024) return month <= 6 ? 4242 : 4300;
  if (year === 2025) return 4666;
  if (year === 2026) return 4806;
  return null;
};

export const getHistoricalUopOvertimeGross = (
  month: UopSicknessHistoryMonth,
): { gross: number; minimumWageUnavailable: boolean } => {
  const hourlyRate = month.paymentMode === 'hourly'
    ? month.rate
    : month.workingHours > 0
      ? month.calculationSettings.hourlyRateCalculationMode === 'fullPrecision'
        ? month.rate / month.workingHours
        : round2(month.rate / month.workingHours)
      : 0;
  const minimumWage = getHistoricalMinimumWage(month.year, month.month);
  const hasNightHours = month.nightHours + month.nightOvertime > 0;
  const nightAllowance = minimumWage != null && month.workingHours > 0
    ? round2((month.nightHours + month.nightOvertime)
      * (minimumWage / month.workingHours) * 0.2)
    : 0;
  return {
    gross: round2(
      round2(hourlyRate * month.dailyOvertime * 1.5)
      + round2(hourlyRate * month.weekendHolidayOvertime * 2)
      + round2(hourlyRate * month.nightOvertime * 2)
      + nightAllowance
      + round2(hourlyRate * month.turnOfDayHours * 0.5),
    ),
    minimumWageUnavailable: hasNightHours && minimumWage == null,
  };
};
