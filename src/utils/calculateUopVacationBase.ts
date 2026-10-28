import type {
  UopVacationBaseHistory, UopVacationBaseMonthDetail,
  UopVacationBaseResult, UopVacationBaseTarget,
} from '../types/uopVacationBase';
import { getHistoricalUopOvertimeGross } from './uopHistoricalOvertime';
import {
  getVacationScheduledHours, getHistoricalActuallyWorkedHours,
} from './vacationWorkingTime';

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const key = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;


export class UopVacationBaseError extends Error {
  public id: string;
  public values?: Record<string, string | number>;

  constructor(id: string, values?: Record<string, string | number>) {
    super(id);
    this.name = 'UopVacationBaseError';
    this.id = id;
    this.values = values;
  }
}


/** Sole UoP vacation-base calculator. Neither the UI nor the payroll engine
 * reconstructs/averages historical earnings outside this function.
 * Unknown bonus payment dates and unusual schedules are surfaced for review.
 */
export const calculateUopVacationBase = ({
  history, target,
}: {
  history: UopVacationBaseHistory;
  target: UopVacationBaseTarget;
}): UopVacationBaseResult => {
  if (history.relation.paymentMode !== (target.workRateType === 'uop_hourly' ? 'hourly' : 'monthly')) {
    throw new UopVacationBaseError('vacation-base-error-payment-mode');
  }
  if (target.vacationBaseMonths !== 3 && target.vacationBaseMonths !== 12) {
    throw new UopVacationBaseError('vacation-base-error-month-count');
  }
  if (!Number.isFinite(target.rate) || target.rate < 0
    || !Number.isFinite(target.workingHours) || target.workingHours <= 0) {
    throw new UopVacationBaseError('vacation-base-error-working-hours');
  }
  const leaveHours = getVacationScheduledHours({
    year: target.year, month: target.month, leave: target.leave,
    l4: target.l4, holidays: target.holidays,
    employmentStartDate: target.employmentStartDate,
    employmentEndDate: target.employmentEndDate,
  });
  if (leaveHours <= 0) throw new UopVacationBaseError('vacation-base-error-no-leave');
  const monthStart = new Date(Date.UTC(target.year, target.month - 1, 1));
  const previousMonthEnd = new Date(Date.UTC(target.year, target.month - 1, 0))
    .toISOString().slice(0, 10);
  const currentMonthFirst = monthStart.toISOString().slice(0, 10);
  const previousMonth = history.months.find(m => key(m.year, m.month) === previousMonthEnd.slice(0, 7));
  // A continuous vacation crossing the salary-month boundary must retain its
  // established reference basis. V1 has no reliable historical payment-date
  // information to reconstruct a previous vacation's hourly component.
  if (previousMonth?.leave.some(r => r.start <= previousMonthEnd && r.end >= previousMonthEnd)
      && target.leave.some(r => r.start <= currentMonthFirst && r.end >= currentMonthFirst)) {
    throw new UopVacationBaseError('vacation-base-error-cross-month');
  }
  const employedFrom = new Date(`${history.relation.startDate}T00:00:00Z`);
  if (Number.isNaN(employedFrom.getTime())) {
    throw new UopVacationBaseError('vacation-base-error-history');
  }
  const periods: string[] = [];
  for (let offset = target.vacationBaseMonths; offset >= 1; offset -= 1) {
    const date = new Date(Date.UTC(target.year, target.month - 1 - offset, 1));
    if (date.getTime() < Date.UTC(employedFrom.getUTCFullYear(), employedFrom.getUTCMonth(), 1)) continue;
    if (date.getTime() >= monthStart.getTime()) continue;
    periods.push(key(date.getUTCFullYear(), date.getUTCMonth() + 1));
  }
  const saved = new Map(history.months.map(m => [key(m.year, m.month), m]));
  const missing = periods.filter(period => !saved.has(period));
  if (missing.length) throw new UopVacationBaseError('vacation-base-error-missing-history', { periods: missing.join(', ') });
  if (!periods.length && target.workRateType === 'uop_hourly') {
    throw new UopVacationBaseError('vacation-base-error-no-history');
  }

  const details: UopVacationBaseMonthDetail[] = [];
  let grossTotal = 0;
  let hoursTotal = 0;
  for (const period of periods) {
    const month = saved.get(period)!;
    if (month.paymentMode !== history.relation.paymentMode) {
      throw new UopVacationBaseError('vacation-base-error-payment-mode');
    }
    const hourly = getHistoricalActuallyWorkedHours({
      ...month,
    });
    if (hourly.totalHours <= 0) {
      // In a fully unworked month, § 11 can require earlier pay periods;
      // do not create a fictitious zero denominator or salary.
      throw new UopVacationBaseError('vacation-base-error-unworked-period', { period });
    }
    const overtime = getHistoricalUopOvertimeGross(month);
    if (overtime.minimumWageUnavailable) {
      throw new UopVacationBaseError('vacation-base-error-historical-rate', { period });
    }
    let eligibleBonuses = 0;
    for (const bonus of month.bonuses) {
      if (!bonus.vacationTreatment) {
        throw new UopVacationBaseError('vacation-base-error-bonus-policy', { bonus: bonus.name, period });
      }
      if (bonus.vacationTreatment !== 'variableBase') continue;
      if (bonus.frequency !== 'monthly' || bonus.paymentType === 'nonCash') {
        throw new UopVacationBaseError('vacation-base-error-bonus-frequency', { bonus: bonus.name, period });
      }
      eligibleBonuses += bonus.amount;
    }
    const gross = round2(
      (month.paymentMode === 'hourly' ? month.rate * hourly.regularHours : 0)
      + overtime.gross + eligibleBonuses,
    );
    grossTotal += gross;
    hoursTotal += hourly.totalHours;
    details.push({ period, grossVariable: gross, actuallyWorkedHours: hourly.totalHours });
  }
  if (hoursTotal <= 0 && target.workRateType === 'uop_hourly') {
    throw new UopVacationBaseError('vacation-base-error-no-history');
  }
  const hourlyVariable = hoursTotal > 0 ? grossTotal / hoursTotal : 0;
  const fullHourly = (target.workRateType === 'uop_monthly' ? target.rate / target.workingHours : 0) + hourlyVariable;
  // V1 leaveBase is a monthly gross equivalent, NOT the hourly rate.
  const monthlyBase = round2(fullHourly * target.workingHours);
  return {
    monthlyBase,
    variableHourlyRate: round2(hourlyVariable),
    vacationHourlyRate: round2(fullHourly),
    leaveHours,
    referencePeriods: periods,
    monthDetails: details,
    variableGrossTotal: round2(grossTotal),
    actualHoursTotal: hoursTotal,
    notes: grossTotal > 0 ? [{ id: 'vacation-base-note-payment-month' }, { id: 'vacation-base-note-standard-schedule' }] : [{ id: 'vacation-base-note-standard-schedule' }],
  };
};
