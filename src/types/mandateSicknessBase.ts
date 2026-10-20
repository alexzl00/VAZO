import type { SalaryBonus, SalaryCalculatorValues, L4Range } from './salaryCalculator';
import type { ISODateRange } from '../utils/monthHelperFunc';

/** The database RPC returns historical facts, never recalculated totals. */
export type MandateSicknessHistoryMonth = {
  salaryId: string;
  year: number;
  month: number;
  engineId: string;
  inputSchemaId: string;
  paymentMode: 'hourly';
  employmentStartDate: string | null;
  employmentEndDate: string | null;
  grossSalaryCalculated: number;
  pensionDisabilityBaseCalculated: number | null;
} & Pick<SalaryCalculatorValues,
  | 'rate' | 'workingHours' | 'isStudent' | 'isUnder26'
  | 'mandateVoluntarySicknessInsurance' | 'sicknessBenefitEligible'
  | 'mandateHasOtherUopAtLeastMinimumBase'
  | 'mandateOtherSocialBaseBeforeThisContract'
  | 'isOwnEmployerContract' | 'performedForOwnEmployer'
  | 'previousPensionDisabilityBase' | 'holidays' | 'l4'
  | 'l4Base' | 'l4BaseAfterTermination'
> & {
  bonuses: SalaryBonus[];
  calculationSettings: Record<string, unknown>;
};

export type MandateSicknessBaseHistory = {
  relation: {
    id: string;
    startDate: string;
    endDate: string | null;
    paymentMode: 'hourly';
  };
  historyStart: string;
  historyEnd: string;
  missingPeriods: string[];
  months: MandateSicknessHistoryMonth[];
};

export type MandateSicknessBaseTarget = Pick<SalaryCalculatorValues,
  | 'year' | 'month' | 'rate' | 'workingHours' | 'l4' | 'holidays'
  | 'employmentStartDate' | 'employmentEndDate' | 'isStudent' | 'isUnder26'
  | 'mandateVoluntarySicknessInsurance' | 'sicknessBenefitEligible'
  | 'mandateHasOtherUopAtLeastMinimumBase'
  | 'mandateOtherSocialBaseBeforeThisContract'
  | 'isOwnEmployerContract' | 'performedForOwnEmployer'
  | 'previousPensionDisabilityBase' | 'bonuses'
>;

export type MandateSicknessBaseMonthDetail = {
  period: string;
  grossContributionBase: number;
  deduction: number;
  netIncluded: number;
  included: boolean;
  sicknessReduced: boolean;
};

export type MandateSicknessBaseResult = {
  base: number;
  source: 'history' | 'reusedPreviousBase';
  reusedFromPeriod?: string;
  referencePeriod: { start: string; end: string };
  usedPeriods: string[];
  excludedPeriods: string[];
  monthDetails: MandateSicknessBaseMonthDetail[];
};

export type MandateSicknessBasesResult = {
  duringEmployment: MandateSicknessBaseResult | null;
  afterEmployment: MandateSicknessBaseResult | null;
};

export type CalculateMandateSicknessBasesParams = {
  history: MandateSicknessBaseHistory;
  target: MandateSicknessBaseTarget;
};

// Retain project ISODateRange and L4Range as the single range types.
export type MandateSicknessRanges = { holidays: ISODateRange[]; l4: L4Range[] };
