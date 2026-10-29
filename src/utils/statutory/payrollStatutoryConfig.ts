/**
 * Single source for Polish payroll statutory parameters.
 *
 * 2025 and 2026 are supported for new payroll calculations. 2024 is retained
 * only for historical L4/vacation reconstruction of 2025 records. It is NOT
 * an enabled target year for the salary engine.
 *
 * Important: common employer/application preferences are not laws and should
 * remain in their own configuration (e.g. bonus-treatment defaults).
 */

export const SUPPORTED_PAYROLL_YEARS = [2025, 2026] as const;
export type SupportedPayrollYear = (typeof SUPPORTED_PAYROLL_YEARS)[number];

export type PayrollStatutoryConfig = Readonly<{
  year: number;
  pitFirstRate: number;
  pitSecondRate: number;
  pitThreshold: number;
  pit0Limit: number;
  noPitAdvanceIncomeLimit: number;
  copyrightKupAnnualLimit: number;
  uopKupStandard: number;
  uopKupCommuter: number;
  uopKupAnnualStandard: number;
  uopKupAnnualCommuter: number;
  uopKupAnnualMultipleStandard: number;
  uopKupAnnualMultipleCommuter: number;
  zusPensionInsurance: number;
  zusDisability: number;
  zusSicknessInsurance: number;
  zusAnnualPensionDisabilityLimit: number;
  voluntarySicknessMonthlyBaseLimit: number;
  healthInsurance: number;
  minimumWage: number;
  minimumHourlyRate: number;
  reducedPpkMonthlyIncomeLimit: number;
  ppkEmployeeBasic: number;
  ppkEmployeeMinimum: number;
  ppkEmployeeMaximum: number;
  ppkEmployerMaximum: number;
  sickPayDaysStandard: number;
  sickPayDaysOver50: number;
  smallContractLumpSumMax: number;
  ppkEmployerBasic: number;
  dailyOvertimeMultiplier: number;
  weekendHolidayOvertimeMultiplier: number;
  nightOvertimeMultiplier: number;
  nightAllowancePercentOfMinimumHourly: number;
  /** Existing application-specific remuneration rule, not a statutory rate. */
  turnOfDayHours: number;
}>;

const COMMON = Object.freeze({
  pitFirstRate: 12,
  pitSecondRate: 32,
  pitThreshold: 120_000,
  pit0Limit: 85_528,
  noPitAdvanceIncomeLimit: 30_000,
  copyrightKupAnnualLimit: 120_000,
  uopKupStandard: 250,
  uopKupCommuter: 300,
  uopKupAnnualStandard: 3_000,
  uopKupAnnualCommuter: 3_600,
  uopKupAnnualMultipleStandard: 4_500,
  uopKupAnnualMultipleCommuter: 5_400,
  zusPensionInsurance: 9.76,
  zusDisability: 1.5,
  zusSicknessInsurance: 2.45,
  healthInsurance: 9,
  ppkEmployeeBasic: 2,
  ppkEmployeeMinimum: 0.5,
  ppkEmployeeMaximum: 4,
  ppkEmployerMaximum: 4,
  sickPayDaysStandard: 33,
  sickPayDaysOver50: 14,
  smallContractLumpSumMax: 200,
  ppkEmployerBasic: 1.5,
  dailyOvertimeMultiplier: 1.5,
  weekendHolidayOvertimeMultiplier: 2,
  nightOvertimeMultiplier: 2,
  nightAllowancePercentOfMinimumHourly: 20,
  turnOfDayHours: 50,
});

// Annual values. No within-year change for these parameters in 2025–2026.
const ANNUAL = {
  2025: {
    minimumWage: 4_666,
    minimumHourlyRate: 30.50,
    zusAnnualPensionDisabilityLimit: 260_190,
    voluntarySicknessMonthlyBaseLimit: 21_682.50,
  },
  2026: {
    minimumWage: 4_806,
    minimumHourlyRate: 31.40,
    zusAnnualPensionDisabilityLimit: 282_600,
    voluntarySicknessMonthlyBaseLimit: 23_550,
  },
} as const;

const TARGET_CONFIGS: Record<SupportedPayrollYear, PayrollStatutoryConfig> = {
  2025: Object.freeze({
    ...COMMON, ...ANNUAL[2025], year: 2025,
    reducedPpkMonthlyIncomeLimit: Math.round(ANNUAL[2025].minimumWage * 120) / 100,
  }),
  2026: Object.freeze({
    ...COMMON, ...ANNUAL[2026], year: 2026,
    reducedPpkMonthlyIncomeLimit: Math.round(ANNUAL[2026].minimumWage * 120) / 100,
  }),
};

export const isSupportedPayrollYear = (year: number): year is SupportedPayrollYear =>
  year === 2025 || year === 2026;

export const getPayrollStatutoryConfig = (
  year: number,
  month: number,
): PayrollStatutoryConfig => {
  if (!isSupportedPayrollYear(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Unsupported payroll period: ${year}-${month}`);
  }
  return TARGET_CONFIGS[year];
};

/** Only values needed to reconstruct prior-year history, never a target payroll. */
const LOOKBACK_2024 = Object.freeze({
  minimumHourlyRate: 27.70,
  zusAnnualPensionDisabilityLimit: 234_720,
  voluntarySicknessMonthlyBaseLimit: 19_560,
});

export const getHistoricalPayrollStatutoryConfig = (
  year: number,
  month: number,
): PayrollStatutoryConfig | null => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (isSupportedPayrollYear(year)) return getPayrollStatutoryConfig(year, month);
  if (year === 2024) {
    const minimumWage = month <= 6 ? 4_242 : 4_300;
    return Object.freeze({
      ...COMMON,
      ...LOOKBACK_2024,
      year,
      minimumWage,
      minimumHourlyRate: month <= 6 ? 27.70 : 28.10,
      reducedPpkMonthlyIncomeLimit: Math.round(minimumWage * 120) / 100,
    });
  }
  return null;
};

/** Year-independent defaults also used in forms and Supabase request payloads. */
export const PAYROLL_DEFAULTS = Object.freeze({
  uopKup: COMMON.uopKupStandard,
  uopKupCommuter: COMMON.uopKupCommuter,
  employerSickPayLimit: COMMON.sickPayDaysStandard,
  olderEmployeeSickPayLimit: COMMON.sickPayDaysOver50,
  ppkEmployeeRate: COMMON.ppkEmployeeBasic,
  ppkEmployerRate: COMMON.ppkEmployerBasic,
  ppkEmployeeMin: COMMON.ppkEmployeeMinimum,
  ppkEmployeeMax: COMMON.ppkEmployeeMaximum,
  ppkEmployerMax: COMMON.ppkEmployerMaximum,
});

export const employeeSocialInsuranceRate =
  COMMON.zusPensionInsurance + COMMON.zusDisability + COMMON.zusSicknessInsurance;
