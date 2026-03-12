
import type { ISODateRange } from '../utils/monthHelperFunc';

export type WorkRate = 'monthly' | 'hourly' | 'contractOfMandate';

export type SalaryCalculatorValues = {
  
  // podatki i potracenia
  taxRegime: 0 | 12;

  // tylko na umowie o prace
  pit2: boolean;

  // tylko na umowie zlecenia
  kup: 20 | 50;

  isStudent: boolean, // tylko dla umowy zlecenia
  isUnder26: boolean, // tylko dla umowy zlecenia

  deductionAfterTax: number;
  additionAfterTax: number;

  // Kalendarz i norma czasu pracy
  year: number;
  month: number;
  workingHours: number;

  // Stawka i premie
  workRateType: WorkRate;
  rate: number;
  attendanceBonus: number;
  discretionaryBonus: number;
  otherBonus: number;

  holidays: ISODateRange[];

  // Nadgodziny i godziny nocne
  dailyOvertime: number;
  weekendHolidayOvertime: number;
  nightOvertime: number;

  nightHours: number;
  turnOfDayHours: number;

  overtimeLimit: number;

  // Zwolnienie lekarskie (L4)
  l4: ISODateRange[];

  l4Base: number;

  // Urlop
  leave: ISODateRange[];

  leaveBase: number;

  // virtual property for error
  totalOvertime?: string;
};