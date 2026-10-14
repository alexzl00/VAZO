import type {
  BonusAmountType,
  BonusPaymentType,
  L4Range,
  SalaryBonus,
  SalaryCalculatorValues,
  SickLeaveTreatment,
} from "./salaryCalculator";
import type { PaymentMode } from "./workRelation";
import type { ISODateRange } from "../utils/monthHelperFunc";

export type UopHistoryPaymentMode = Exclude<PaymentMode, "fixed">;

export type UopSicknessHistoryBonus =
  Pick<
    SalaryBonus,
    | "id"
    | "name"
    | "amount"
    | "frequency"
  >
  & {
    bonusDefinitionId: string | null;
    paymentType: BonusPaymentType;
    amountType: BonusAmountType | null;
    sickLeaveTreatment: SickLeaveTreatment | null;
    sortOrder: number;
  };

export type UopSicknessHistoryMonth = {
  salaryId: string;
  year: number;
  month: number;
  paymentMode: UopHistoryPaymentMode;
  employmentStartDate: string;
  employmentEndDate: string;
  grossSalaryCalculated: number;
  pensionDisabilityBaseCalculated: number | null;

  rate: number;
  workingHours: number;
  previousPensionDisabilityBase: number;

  holidays: ISODateRange[];
  dailyOvertime: number;
  weekendHolidayOvertime: number;
  nightOvertime: number;
  nightHours: number;
  turnOfDayHours: number;

  l4: L4Range[];
  l4Base: number;
  leave: ISODateRange[];
  leaveBase: number;

  functionalAllowance: number;
  functionalAllowanceRetainedDuringSickness: boolean;

  calculationSettings: Record<string, unknown>;
  bonuses: UopSicknessHistoryBonus[];
};

export type UopSicknessBaseHistory = {
  relation: {
    id: string;
    startDate: string;
    endDate: string | null;
    paymentMode: UopHistoryPaymentMode;
  };
  historyStart: string;
  historyEnd: string;
  missingPeriods: string[];
  months: UopSicknessHistoryMonth[];
};

export type UopSicknessContext =
  | "duringInsurance"
  | "afterInsurance";

export type UopSicknessBaseMessage = {
  id: string;
  values?: Record<string, string | number>;
};

export type UopSicknessBaseMonthDetail = {
  period: string;
  requiredWorkDays: number;
  workedEquivalentDays: number;
  included: boolean;
  supplemented: boolean;
  grossIncluded: number;
  employeeContributionRate: number;
  netIncluded: number;
};

export type UopSicknessBaseResult = {
  base: number;
  calculatedBaseBeforeMinimum: number;
  minimumBase: number | null;
  minimumApplied: boolean;
  context: UopSicknessContext;
  source: "reusedPreviousBase" | "history" | "currentMonthFallback";
  reusedFromPeriod?: string;

  monthlyAverage: number;
  quarterlyShare: number;
  annualShare: number;

  referencePeriod: {
    monthlyStart: string | null;
    monthlyEnd: string | null;
    quarterlyStart: string;
    quarterlyEnd: string;
    annualYear: number;
  };

  usedPeriods: string[];
  excludedPeriods: string[];
  missingPeriods: string[];
  monthDetails: UopSicknessBaseMonthDetail[];
  warnings: UopSicknessBaseMessage[];
};

export type UopSicknessBaseTarget =
  Pick<
    SalaryCalculatorValues,
    | "year"
    | "month"
    | "rate"
    | "workingHours"
    | "employmentStartDate"
    | "employmentEndDate"
    | "l4"
    | "holidays"
    | "leave"
    | "leaveBase"
    | "dailyOvertime"
    | "weekendHolidayOvertime"
    | "nightOvertime"
    | "nightHours"
    | "turnOfDayHours"
    | "hourlyRateCalculationMode"
    | "functionalAllowance"
    | "functionalAllowanceRetainedDuringSickness"
    | "bonuses"
  >
  & {
    paymentMode: UopHistoryPaymentMode;
  };

export type CalculateUopSicknessBaseParams = {
  history: UopSicknessBaseHistory;
  target: UopSicknessBaseTarget;
};
