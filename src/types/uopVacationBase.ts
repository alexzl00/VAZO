import type { ISODateRange } from '../utils/monthHelperFunc';
import type { VacationBaseMonths, VacationTreatment } from './salaryCalculator';
import type { UopSicknessBaseHistory, UopSicknessHistoryMonth } from './uopSicknessBase';

export type UopVacationHistoryMonth = Omit<UopSicknessHistoryMonth, 'bonuses'> & {
  bonuses: (UopSicknessHistoryMonth['bonuses'][number] & {
    vacationTreatment: VacationTreatment | null;
  })[];
};
export type UopVacationBaseHistory = Omit<UopSicknessBaseHistory, 'months'> & {
  months: UopVacationHistoryMonth[];
};
export type UopVacationBaseTarget = {
  year: number;
  month: number;
  workRateType: 'uop_monthly' | 'uop_hourly';
  rate: number;
  workingHours: number;
  leave: ISODateRange[];
  l4: ISODateRange[];
  holidays: ISODateRange[];
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;
  vacationBaseMonths: VacationBaseMonths;
};
export type UopVacationBaseMonthDetail = {
  period: string;
  grossVariable: number;
  actuallyWorkedHours: number;
};
export type UopVacationBaseResult = {
  /** Monthly equivalent, compatible with the existing V1 leaveBase persistence. */
  monthlyBase: number;
  variableHourlyRate: number;
  vacationHourlyRate: number;
  leaveHours: number;
  referencePeriods: string[];
  monthDetails: UopVacationBaseMonthDetail[];
  variableGrossTotal: number;
  actualHoursTotal: number;
  notes: { id: string; values?: Record<string, string | number> }[];
};
