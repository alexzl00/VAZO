import {
  calculateUopPensionDisabilityBase,
  calculateUopSocialInsuranceBase,
} from './uopSocialContributionBase';
import { getBonusTotals } from './salaryBonusTotals';
import { getMandateContributionContext } from './mandateContributionBase';
import { countDaysWithinPeriod } from '../utils/monthHelperFunc';
import { getVacationScheduledHours } from './vacationWorkingTime';
import {
  getWorkedDaysInMonthWithPolishHolidays,
  getWorkingHoursOutsideEmploymentPeriod,
} from '../utils/workingTimeHelper';
import type {
  L4PaymentType,
  L4Range,
  Pit0Relief,
  SalaryBonus,
  SalaryCalculatorValues,
} from '../types/salaryCalculator';

export type SalaryMessageValues = Record<string, string | number>;

export type SalaryCalculationMessage = {
  id: string;
  values?: SalaryMessageValues;
};

export class SalaryCalculationError extends Error {
  id: string;
  values?: SalaryMessageValues;

  constructor(id: string, values?: SalaryMessageValues) {
    super(id);
    this.name = 'SalaryCalculationError';
    this.id = id;
    this.values = values;
  }
}

export type SalaryMonthlyFacts = {
  taxableIncome: number;
  pit0Revenue: number;
  pensionDisabilityBase: number;
  uopKupUsed: number;
};

export type SalaryCalculationResult = {
  fullSalaryBrutto: number;

  // earnings
  workDaysPayment?: number;
  employmentReduction?: number;
  employmentExcludedWorkingHours?: number;
  l4Reduction?: number;
  leaveReduction?: number;
  employmentPeriodStart?: string | null;
  employmentPeriodEnd?: string | null;
  workRateType?: SalaryCalculatorValues['workRateType'];
  l4Payment?: number;
  employerSickPay?: number;
  sicknessBenefit?: number;
  postEmploymentSicknessBenefit?: number;
  postEmploymentSicknessBenefitDays?: number;
  employerSickPayDays?: number;
  sicknessBenefitDays?: number;
  leavePayment?: number;
  functionalAllowancePayment?: number;
  functionalAllowanceEmploymentReduction?: number;
  functionalAllowanceL4Reduction?: number;
  bonuses?: SalaryBonus[];
  bonusTotal?: number;
  cashBonusTotal?: number;
  nonCashBonusTotal?: number;
  overtimes?: number;
  perHour: number;
  rate?: number;
  isUnder26?: boolean;
  isStudent?: boolean;

  // ZUS
  socialInsuranceBase?: number;
  pensionDisabilityBase?: number;
  zusPension?: number;
  zusDisability?: number;
  zusSickness?: number;
  zusTaxes: number;

  // health
  healthInsuranceBase?: number;
  healthInsurance: number;

  // PIT
  pitRevenue?: number;
  pitExemptRevenue?: number;
  pitKup?: number;
  pitBase?: number;
  pitTax: number;
  pitAt12?: number;
  pitAt32?: number;

  // PPK
  ppkBase?: number;
  ppkEmployee?: number;
  ppkEmployer?: number;

  // result
  netto: number;
  brutto: number;

  dailyOvertimes?: number;
  weekendHolidayOvertimes?: number;
  nightOvertime?: number;
  nightHours?: number;
  turnOfDayHours?: number;
  nightWorkAllowance?: number;

  warnings?: SalaryCalculationMessage[];

  monthlyFacts: SalaryMonthlyFacts;

  yearToDate?: {
    taxableIncome: number;
    pit0Revenue: number;
    pensionDisabilityBase: number;
    copyrightKupUsed: number;
    uopKupUsed: number;
    employerSickPayDays: number;
  };

  calculationType: 'uop' | 'mandate' | 'uod_fixed';
};

export const taxes = {
  year: 2026,

  // PIT
  pitFirstRate: 12,
  pitSecondRate: 32,
  pitThreshold: 120_000,
  pit0Limit: 85_528,
  noPitAdvanceIncomeLimit: 30_000,
  copyrightKupAnnualLimit: 120_000,
  uopKupStandard: 250,
  uopKupCommuter: 300,

  // employee ZUS
  zusPensionInsurance: 9.76,
  zusDisability: 1.5,
  zusSicknessInsurance: 2.45,
  zusAnnualPensionDisabilityLimit: 282_600,
  voluntarySicknessMonthlyBaseLimit: 23_550,

  // health
  healthInsurance: 9,

  // 2026 statutory values
  minimumWage: 4_806,
  minimumHourlyRate: 31.4,
  reducedPpkMonthlyIncomeLimit: 5_767.2,

  // PPK
  ppkEmployeeBasic: 2,
  ppkEmployerBasic: 1.5,

  // overtime additions
  dailyOvertimeMultiplier: 1.5, // normal pay + 50% addition
  weekendHolidayOvertimeMultiplier: 2, // normal pay + 100% addition
  nightOvertimeMultiplier: 2, // normal pay + 100% addition; night allowance is separate
  nightAllowancePercentOfMinimumHourly: 20,

  // Kept as your existing business rule. This is not a universal statutory rate.
  turnOfDayHours: 50,
};

/**
 * Employee-financed social-insurance percentage used when the full
 * pension/disability/sickness contribution set applies.
 *
 * Keep the component rates in `taxes` as the single source of truth.
 */
export const employeeSocialInsuranceRate =
  taxes.zusPensionInsurance +
  taxes.zusDisability +
  taxes.zusSicknessInsurance;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const buildMonthlyFacts = ({
  taxableIncome,
  pit0Revenue,
  pensionDisabilityBase,
  uopKupUsed,
}: SalaryMonthlyFacts): SalaryMonthlyFacts => ({
  taxableIncome: round2(Math.max(0, taxableIncome)),
  pit0Revenue: round2(Math.max(0, pit0Revenue)),
  pensionDisabilityBase: round2(
    Math.max(0, pensionDisabilityBase),
  ),
  uopKupUsed: round2(Math.max(0, uopKupUsed)),
});
const roundPln = (value: number) => Math.round(value);
const percent = (value: number, rate: number) => round2(value * rate / 100);

const getL4PaymentType = (range: L4Range): L4PaymentType => {
  // Runtime fallback for historical records created before paymentType existed.
  if (range.paymentType === 'full100' || range.paymentType === 'accident100') {
    return range.paymentType;
  }

  return 'standard80';
};

const getL4PaymentMultiplier = (paymentType: L4PaymentType) =>
  paymentType === 'standard80' ? 0.8 : 1;

const getL4DailyPayment = (
  range: L4Range,
  l4Base: number,
) =>
  l4Base > 0
    ? round2(
        (l4Base / 30)
          * getL4PaymentMultiplier(getL4PaymentType(range)),
      )
    : 0;

/**
 * Divide L4 into insurance-period and post-termination calendar days.
 * The second part is never counted as ordinary employer sick pay.
 */
const getL4RangeDaySplit = (
  range: L4Range,
  employmentStartDate?: string | null,
  employmentEndDate?: string | null,
) => {
  const totalEligibleDays = countDaysWithinPeriod(
    [range],
    employmentStartDate,
    null,
  );

  const duringEmploymentDays = countDaysWithinPeriod(
    [range],
    employmentStartDate,
    employmentEndDate,
  );

  const postEmploymentDays = employmentEndDate
    ? Math.max(0, totalEligibleDays - duringEmploymentDays)
    : 0;

  return { duringEmploymentDays, postEmploymentDays };
};

const getSplitL4Payment = (
  range: L4Range,
  values: SalaryCalculatorValues,
) => {
  const split = getL4RangeDaySplit(
    range,
    values.employmentStartDate,
    values.employmentEndDate,
  );

  return {
    ...split,
    duringEmploymentAmount:
      getL4DailyPayment(range, values.l4Base) * split.duringEmploymentDays,
    postEmploymentAmount:
      getL4DailyPayment(
        range,
        values.l4BaseAfterTermination ?? values.l4Base,
      ) * split.postEmploymentDays,
  };
};

/** Disclose a substituted base only when it affects the calculated amount. */
const warnIfPostEmploymentL4BaseMissing = (
  values: SalaryCalculatorValues,
  warnings: SalaryCalculationMessage[],
) => {
  const includesPostEmployment = values.l4.some(
    (range) => getL4RangeDaySplit(
      range,
      values.employmentStartDate,
      values.employmentEndDate,
    ).postEmploymentDays > 0,
  );

  if (!includesPostEmployment) return;

  if (values.l4BaseAfterTermination == null) {
    warnings.push({ id: 'salary-warning-post-termination-l4-base-fallback' });
  }
};


const assertSupportedTaxYear = (values: SalaryCalculatorValues) => {
  if (values.year !== taxes.year && values.year >= 1000) {
    throw new SalaryCalculationError(
      'salary-calculation-unsupported-tax-year',
      {
        year: values.year,
        supportedYear: taxes.year,
      },
    );
  }
};

const getEmployerPpkTaxableContribution = (
  values: SalaryCalculatorValues,
  calculatedEmployerPpk: number,
) => round2(values.ppkEmployerTaxableContribution ?? calculatedEmployerPpk);

const buildYearToDate = ({
  values,
  pitBase,
  pit0ExemptRevenue,
  pensionDisabilityBase,
  current50Kup,
  currentUopKup,
  currentEmployerSickPayDays = 0,
  includePitBaseInScale = true,
}: {
  values: SalaryCalculatorValues;
  pitBase: number;
  pit0ExemptRevenue: number;
  pensionDisabilityBase: number;
  current50Kup: number;
  currentUopKup: number;
  currentEmployerSickPayDays?: number;
  includePitBaseInScale?: boolean;
}) => ({
  taxableIncome: round2(
    (values.previousTaxableIncome ?? 0) + (includePitBaseInScale ? pitBase : 0),
  ),
  pit0Revenue: round2((values.previousPit0Revenue ?? 0) + pit0ExemptRevenue),
  pensionDisabilityBase: round2(
    (values.previousPensionDisabilityBase ?? 0) + pensionDisabilityBase,
  ),
  copyrightKupUsed: round2((values.previous50KupUsed ?? 0) + current50Kup),
  uopKupUsed: round2((values.previousUopKupUsed ?? 0) + currentUopKup),
  employerSickPayDays: Math.min(
    values.uopEmployerSickPayLimit ?? 33,
    (values.previousEmployerSickPayDays ?? 0) + currentEmployerSickPayDays,
  ),
});


const getPit0Relief = (values: SalaryCalculatorValues): Pit0Relief => {
  if (values.pit0Relief) return values.pit0Relief;

  // Backwards-compatible fallback for the current form.
  if (values.isUnder26) return 'young';

  return 'none';
};

const isPit0EligibleForContract = (
  values: SalaryCalculatorValues,
  contractType: 'uop' | 'mandate' | 'uod_fixed',
) => {
  if (contractType === 'uod_fixed') return false;

  const relief = getPit0Relief(values);
  if (relief === 'none') return false;
  if (relief === 'young') return values.isUnder26;

  // For return/family4plus/workingSenior the calculator assumes the user
  // has already confirmed statutory eligibility in the form.
  return true;
};

const getPit0Split = (
  values: SalaryCalculatorValues,
  contractType: 'uop' | 'mandate' | 'uod_fixed',
  pit0EligibleRevenue: number,
  alwaysTaxableRevenue = 0,
) => {
  const eligibleRevenue = Math.max(0, pit0EligibleRevenue);
  const taxableRegardlessOfRelief = Math.max(0, alwaysTaxableRevenue);

  if (!isPit0EligibleForContract(values, contractType)) {
    return {
      exemptRevenue: 0,
      taxableEligibleRevenue: eligibleRevenue,
      taxableRevenue: round2(eligibleRevenue + taxableRegardlessOfRelief),
    };
  }

  const previousPit0Revenue = values.previousPit0Revenue ?? 0;
  const remaining = Math.max(0, taxes.pit0Limit - previousPit0Revenue);
  const exemptRevenue = round2(Math.min(eligibleRevenue, remaining));
  const taxableEligibleRevenue = round2(
    Math.max(0, eligibleRevenue - exemptRevenue),
  );

  return {
    exemptRevenue,
    taxableEligibleRevenue,
    taxableRevenue: round2(taxableEligibleRevenue + taxableRegardlessOfRelief),
  };
};

/**
 * Social contributions paid by the employee cannot be deducted from taxable
 * income to the extent they relate to PIT-0 exempt revenue. For a generic
 * calculator without payroll-component-level allocation, we allocate them
 * proportionally to the taxable share of current PIT revenue.
 */
const getDeductibleSocialForPit = (
  totalEmployeeSocial: number,
  pit0EligibleRevenue: number,
  taxableEligibleRevenue: number,
) => {
  if (pit0EligibleRevenue <= 0 || taxableEligibleRevenue <= 0) return 0;

  return round2(
    totalEmployeeSocial * (taxableEligibleRevenue / pit0EligibleRevenue),
  );
};

const calculateProgressivePitAdvance = (
  currentPitBase: number,
  previousTaxableIncome: number,
  monthlyTaxReduction: number,
  doNotWithholdPitAdvance = false,
) => {
  if (currentPitBase <= 0) {
    return { pitTax: 0, pitAt12: 0, pitAt32: 0 };
  }

  const previous = Math.max(0, previousTaxableIncome);
  const currentYearToDate = previous + currentPitBase;

  // Art. 31c PIT: the payer does not withhold advances while the relevant
  // year-to-date income does not exceed 30,000 zł. Once the threshold is
  // exceeded, advances are calculated again and without the PIT-2 reduction.
  if (
    doNotWithholdPitAdvance &&
    currentYearToDate <= taxes.noPitAdvanceIncomeLimit
  ) {
    return { pitTax: 0, pitAt12: 0, pitAt32: 0 };
  }

  const effectiveTaxReduction = doNotWithholdPitAdvance
    ? 0
    : monthlyTaxReduction;

  const remainingAt12 = Math.max(0, taxes.pitThreshold - previous);

  const baseAt12 = Math.min(currentPitBase, remainingAt12);
  const baseAt32 = Math.max(0, currentPitBase - baseAt12);

  const pitAt12 = baseAt12 * taxes.pitFirstRate / 100;
  const pitAt32 = baseAt32 * taxes.pitSecondRate / 100;

  const pitTax = roundPln(
    Math.max(0, pitAt12 + pitAt32 - effectiveTaxReduction),
  );

  return {
    pitTax,
    pitAt12: round2(pitAt12),
    pitAt32: round2(pitAt32),
  };
};

const calculateEmployeeSocialContributions = ({
  socialBase,
  previousPensionDisabilityBase,
  sicknessBase,
}: {
  socialBase: number;
  previousPensionDisabilityBase: number;
  sicknessBase: number;
}) => {
  const pensionDisabilityBase = calculateUopPensionDisabilityBase({
    socialInsuranceBase: socialBase,
    previousPensionDisabilityBase,
    annualLimit: taxes.zusAnnualPensionDisabilityLimit,
  });

  const zusPension = percent(pensionDisabilityBase, taxes.zusPensionInsurance);
  const zusDisability = percent(pensionDisabilityBase, taxes.zusDisability);
  const zusSickness = percent(sicknessBase, taxes.zusSicknessInsurance);
  const zusTaxes = round2(zusPension + zusDisability + zusSickness);

  return {
    pensionDisabilityBase,
    zusPension,
    zusDisability,
    zusSickness,
    zusTaxes,
  };
};

const calculatePpk = (
  enabled: boolean,
  base: number,
  values: SalaryCalculatorValues,
  warnings: SalaryCalculationMessage[],
) => {
  if (!enabled || base <= 0) {
    return { ppkBase: 0, ppkEmployee: 0, ppkEmployer: 0 };
  }

  const employeeRate = values.ppkEmployeeRate ?? taxes.ppkEmployeeBasic;
  const employerRate = values.ppkEmployerRate ?? taxes.ppkEmployerBasic;

  if (employeeRate < 0.5 || employeeRate > 4) {
    warnings.push({ id: 'salary-warning-ppk-employee-rate-range' });
  }

  if (employerRate < 1.5 || employerRate > 4) {
    warnings.push({ id: 'salary-warning-ppk-employer-rate-range' });
  }

  if (employeeRate < 2 && base > taxes.reducedPpkMonthlyIncomeLimit) {
    warnings.push({
      id: 'salary-warning-ppk-reduced-rate-income-limit',
      values: {
        limit: taxes.reducedPpkMonthlyIncomeLimit.toFixed(2),
        year: taxes.year,
      },
    });
  }

  return {
    ppkBase: round2(base),
    ppkEmployee: percent(base, employeeRate),
    ppkEmployer: percent(base, employerRate),
  };
};

const calculatePercentageKup = ({
  values,
  taxableRevenue,
  deductibleSocial,
  currentPit0ExemptRevenue,
}: {
  values: SalaryCalculatorValues;
  taxableRevenue: number;
  deductibleSocial: number;
  currentPit0ExemptRevenue: number;
}) => {
  const kupBase = Math.max(0, taxableRevenue - deductibleSocial);

  if (values.kup === 20) {
    return round2(kupBase * 0.2);
  }

  const previous50KupUsed = values.previous50KupUsed ?? 0;
  const previousPit0Revenue = values.previousPit0Revenue ?? 0;

  // 50% KUP + PIT-0 exempt revenue share the 120,000 zł annual ceiling.
  const remaining50KupLimit = Math.max(
    0,
    taxes.copyrightKupAnnualLimit
      - previous50KupUsed
      - previousPit0Revenue
      - currentPit0ExemptRevenue,
  );

  return round2(Math.min(kupBase * 0.5, remaining50KupLimit));
};

const calculateUopKup = (
  values: SalaryCalculatorValues,
  taxableRevenueAfterSocial: number,
) => {
  const monthlyKup = values.uopKup ?? taxes.uopKupStandard;
  if (monthlyKup === 0 || taxableRevenueAfterSocial <= 0) return 0;

  const multiple = values.hasMultipleEmploymentRelationships ?? false;

  const annualLimit = monthlyKup === taxes.uopKupCommuter
    ? (multiple ? 5_400 : 3_600)
    : (multiple ? 4_500 : 3_000);

  const remainingAnnualKup = Math.max(
    0,
    annualLimit - (values.previousUopKupUsed ?? 0),
  );

  return round2(
    Math.min(monthlyKup, remainingAnnualKup, taxableRevenueAfterSocial),
  );
};

export const calculateTaxesUoD = (
  values: SalaryCalculatorValues,
): SalaryCalculationResult => {
  assertSupportedTaxYear(values);

  const warnings: SalaryCalculationMessage[] = [];
  const {
    bonusTotal,
    cashBonusTotal,
    nonCashBonusTotal,
  } = getBonusTotals(values);

  const fullSalaryBrutto = round2(
    values.rate + bonusTotal,
  );

  const treatedAsEmployee = Boolean(
    values.isOwnEmployerContract || values.performedForOwnEmployer,
  );

  let zusPension = 0;
  let zusDisability = 0;
  let zusSickness = 0;
  let zusTaxes = 0;
  let pensionDisabilityBase = 0;
  let socialInsuranceBase = 0;
  let healthInsuranceBase = 0;
  let healthInsurance = 0;

  if (treatedAsEmployee) {
    socialInsuranceBase = fullSalaryBrutto;

    const social = calculateEmployeeSocialContributions({
      socialBase: socialInsuranceBase,
      previousPensionDisabilityBase: values.previousPensionDisabilityBase ?? 0,
      sicknessBase: socialInsuranceBase,
    });

    ({
      pensionDisabilityBase,
      zusPension,
      zusDisability,
      zusSickness,
      zusTaxes,
    } = social);

    healthInsuranceBase = round2(
      fullSalaryBrutto - zusTaxes,
    );

    healthInsurance = percent(
      healthInsuranceBase,
      taxes.healthInsurance,
    );
  }

  // PIT-0 does not apply to UoD.
  const pitRevenue = fullSalaryBrutto;

  let pitKup = 0;
  let pitBase = 0;
  let pitTax = 0;
  let pitAt12 = 0;
  let pitAt32 = 0;

  const lumpSum = Boolean(
    values.smallContractLumpSumEligible,
  ) && !treatedAsEmployee;

  if (lumpSum) {
    if (fullSalaryBrutto > 200) {
      warnings.push({
        id: 'salary-warning-small-contract-lump-sum-over-limit',
        values: { limit: 200 },
      });
    }

    pitTax = roundPln(
      fullSalaryBrutto * taxes.pitFirstRate / 100,
    );

    pitBase = fullSalaryBrutto;
  } else {
    const deductibleSocial = zusTaxes;

    pitKup = calculatePercentageKup({
      values,
      taxableRevenue: pitRevenue,
      deductibleSocial,
      currentPit0ExemptRevenue: 0,
    });

    pitBase = roundPln(
      Math.max(
        0,
        pitRevenue - deductibleSocial - pitKup,
      ),
    );

    const pit = calculateProgressivePitAdvance(
      pitBase,
      values.previousTaxableIncome ?? 0,
      values.pit2MonthlyReduction ?? 0,
      values.doNotWithholdPitAdvance,
    );

    ({ pitTax, pitAt12, pitAt32 } = pit);
  }

  const netto = round2(
    fullSalaryBrutto
      - nonCashBonusTotal
      - zusTaxes
      - healthInsurance
      - pitTax
      - values.deductionAfterTax
      + values.additionAfterTax,
  );

  return {
    fullSalaryBrutto,
    brutto: fullSalaryBrutto,
    netto,

    bonuses: values.bonuses ?? [],
    bonusTotal,
    cashBonusTotal,
    nonCashBonusTotal,

    perHour: 0,
    rate: values.rate,
    isUnder26: values.isUnder26,
    isStudent: values.isStudent,

    socialInsuranceBase,
    pensionDisabilityBase,
    zusPension,
    zusDisability,
    zusSickness,
    zusTaxes,

    healthInsuranceBase,
    healthInsurance,

    pitRevenue,
    pitExemptRevenue: 0,
    pitKup,
    pitBase,
    pitTax,
    pitAt12,
    pitAt32,

    monthlyFacts: buildMonthlyFacts({
      taxableIncome: lumpSum ? 0 : pitBase,
      pit0Revenue: 0,
      pensionDisabilityBase,
      uopKupUsed: 0,
    }),

    yearToDate: buildYearToDate({
      values,
      pitBase,
      pit0ExemptRevenue: 0,
      pensionDisabilityBase,
      current50Kup: values.kup === 50 ? pitKup : 0,
      currentUopKup: 0,
      includePitBaseInScale: !lumpSum,
    }),

    warnings,
    workRateType: values.workRateType,
    calculationType: 'uod_fixed',
  };
};

export const calculateTaxesContractOfMandate = (
  values: SalaryCalculatorValues,
): SalaryCalculationResult => {
  assertSupportedTaxYear(values);

  const warnings: SalaryCalculationMessage[] = [];
  const {
    bonusTotal,
    cashBonusTotal,
    nonCashBonusTotal,
  } = getBonusTotals(values);

  const regularRemunerationBrutto = round2(
    values.rate * values.workingHours
      + bonusTotal,
  );

  const mandateContribution = getMandateContributionContext({
    regularRemunerationBrutto,
    isStudent: values.isStudent,
    isUnder26: values.isUnder26,
    mandateVoluntarySicknessInsurance: values.mandateVoluntarySicknessInsurance,
    mandateHasOtherUopAtLeastMinimumBase: values.mandateHasOtherUopAtLeastMinimumBase,
    mandateOtherSocialBaseBeforeThisContract: values.mandateOtherSocialBaseBeforeThisContract,
    isOwnEmployerContract: values.isOwnEmployerContract,
    performedForOwnEmployer: values.performedForOwnEmployer,
    minimumWage: taxes.minimumWage,
    voluntarySicknessMonthlyBaseLimit: taxes.voluntarySicknessMonthlyBaseLimit,
  });
  const {
    treatedAsEmployee,
    compulsorySocial,
    healthCompulsory,
    voluntarySicknessInsuranceActive,
  } = mandateContribution;

  const ordinaryL4Ranges = values.l4.filter(
    (range) => getL4PaymentType(range) !== 'accident100',
  );
  const accidentL4Ranges = values.l4.filter(
    (range) => getL4PaymentType(range) === 'accident100',
  );

  const ordinaryL4DaysCount = ordinaryL4Ranges.reduce(
    (sum, range) => {
      const split = getL4RangeDaySplit(range, values.employmentStartDate, values.employmentEndDate);
      return sum + split.duringEmploymentDays + split.postEmploymentDays;
    }, 0,
  );
  const accidentL4DaysCount = accidentL4Ranges.reduce(
    (sum, range) => {
      const split = getL4RangeDaySplit(range, values.employmentStartDate, values.employmentEndDate);
      return sum + split.duringEmploymentDays + split.postEmploymentDays;
    }, 0,
  );
  warnIfPostEmploymentL4BaseMissing(values, warnings);

  const ordinarySicknessBenefitEligible = Boolean(
    voluntarySicknessInsuranceActive
      && values.sicknessBenefitEligible,
  );

  // Within the currently supported UZ model, compulsory pension/disability
  // insurance from this title also means accident insurance is active.
  // Voluntary pension/disability edge cases are intentionally not modelled.
  const accidentInsuranceActive = compulsorySocial && !treatedAsEmployee;

  let ordinarySicknessBenefit = 0;
  let accidentSicknessBenefit = 0;
  let postEmploymentSicknessBenefit = 0;
  let postEmploymentSicknessBenefitDays = 0;

  if (ordinaryL4DaysCount > 0) {
    if (!values.mandateVoluntarySicknessInsurance) {
      warnings.push({
        id: 'salary-warning-mandate-l4-no-sickness-insurance',
      });
    } else if (!voluntarySicknessInsuranceActive) {
      warnings.push({
        id: 'salary-warning-mandate-voluntary-sickness-unavailable',
      });
    } else if (!values.sicknessBenefitEligible) {
      warnings.push({
        id: 'salary-warning-mandate-sickness-benefit-not-eligible',
        values: { waitingDays: 90 },
      });
    } else {
      ordinarySicknessBenefit = round2(ordinaryL4Ranges.reduce((total, range) => {
        const payment = getSplitL4Payment(range, values);
        postEmploymentSicknessBenefit += payment.postEmploymentAmount;
        postEmploymentSicknessBenefitDays += payment.postEmploymentDays;
        return total + payment.duringEmploymentAmount + payment.postEmploymentAmount;
      }, 0));
    }
  }

  if (accidentL4DaysCount > 0) {
    if (!accidentInsuranceActive) {
      warnings.push({
        id: 'salary-warning-mandate-accident-insurance-unavailable',
      });
    } else {
      accidentSicknessBenefit = round2(accidentL4Ranges.reduce((total, range) => {
        const payment = getSplitL4Payment(range, values);
        postEmploymentSicknessBenefit += payment.postEmploymentAmount;
        postEmploymentSicknessBenefitDays += payment.postEmploymentDays;
        return total + payment.duringEmploymentAmount + payment.postEmploymentAmount;
      }, 0));
    }
  }

  const sicknessBenefit = round2(
    ordinarySicknessBenefit + accidentSicknessBenefit,
  );

  const fullSalaryBrutto = round2(
    regularRemunerationBrutto + sicknessBenefit,
  );

  // Shared with historical UZ L4 reconstruction: never use pension/disability
  // annual-cap base as a substitute for the sickness-contribution base.
  const {
    socialInsuranceBase,
    sicknessContributionBase: sicknessBase,
  } = mandateContribution;

  const social = calculateEmployeeSocialContributions({
    socialBase: socialInsuranceBase,
    previousPensionDisabilityBase:
      values.previousPensionDisabilityBase ?? 0,
    sicknessBase,
  });

  const healthInsuranceBase = healthCompulsory
    ? round2(
        regularRemunerationBrutto - social.zusTaxes,
      )
    : 0;

  const healthInsurance = healthCompulsory
    ? percent(
        healthInsuranceBase,
        taxes.healthInsurance,
      )
    : 0;

  const ppkAllowedFromThisTitle = compulsorySocial;

  const ppk = calculatePpk(
    Boolean(values.ppkEnabled) && ppkAllowedFromThisTitle,
    socialInsuranceBase,
    values,
    warnings,
  );

  if (values.ppkEnabled && !ppkAllowedFromThisTitle) {
    warnings.push({
      id: 'salary-warning-mandate-ppk-unavailable',
    });
  }

  const employerPpkTaxableContribution =
    getEmployerPpkTaxableContribution(
      values,
      ppk.ppkEmployer,
    );

  // UZ remuneration and employer PPK can qualify for PIT-0. Sickness benefit
  // is taxable income but does not use PIT-0 (e.g. ulga dla młodych).
  const pit0EligibleRevenue = round2(
    regularRemunerationBrutto
      + employerPpkTaxableContribution,
  );

  const pitRevenue = round2(
    pit0EligibleRevenue + sicknessBenefit,
  );

  const lumpSum = Boolean(
    values.smallContractLumpSumEligible,
  ) && !treatedAsEmployee;

  let pitExemptRevenue = 0;
  let pitKup = 0;
  let pitBase = 0;
  let pitTax = 0;
  let pitAt12 = 0;
  let pitAt32 = 0;
  let scalePitBaseForYtd = 0;

  if (lumpSum) {
    if (regularRemunerationBrutto > 200) {
      warnings.push({
        id: 'salary-warning-small-contract-lump-sum-over-limit',
        values: { limit: 200 },
      });
    }

    const contractLumpSumTax = roundPln(
      regularRemunerationBrutto
        * taxes.pitFirstRate
        / 100,
    );

    // Sickness benefit is separate scale-taxed income and does not inherit the
    // civil-contract lump-sum treatment.
    const benefitPitBase = roundPln(
      sicknessBenefit,
    );

    const benefitPit =
      calculateProgressivePitAdvance(
        benefitPitBase,
        values.previousTaxableIncome ?? 0,
        values.pit2MonthlyReduction ?? 0,
        values.doNotWithholdPitAdvance,
      );

    pitBase = benefitPitBase;
    scalePitBaseForYtd = benefitPitBase;
    pitTax = contractLumpSumTax + benefitPit.pitTax;
    pitAt12 = benefitPit.pitAt12;
    pitAt32 = benefitPit.pitAt32;
  } else {
    const split = getPit0Split(
      values,
      'mandate',
      pit0EligibleRevenue,
      sicknessBenefit,
    );

    pitExemptRevenue = split.exemptRevenue;

    const deductibleSocial =
      getDeductibleSocialForPit(
        social.zusTaxes,
        pit0EligibleRevenue,
        split.taxableEligibleRevenue,
      );

    pitKup = calculatePercentageKup({
      values,
      taxableRevenue: split.taxableEligibleRevenue,
      deductibleSocial,
      currentPit0ExemptRevenue: pitExemptRevenue,
    });

    pitBase = roundPln(
      Math.max(
        0,
        split.taxableEligibleRevenue
          - deductibleSocial
          - pitKup
          + sicknessBenefit,
      ),
    );

    scalePitBaseForYtd = pitBase;

    const pit = calculateProgressivePitAdvance(
      pitBase,
      values.previousTaxableIncome ?? 0,
      values.pit2MonthlyReduction ?? 0,
      values.doNotWithholdPitAdvance,
    );

    ({ pitTax, pitAt12, pitAt32 } = pit);
  }

  if (values.rate < taxes.minimumHourlyRate) {
    warnings.push({
      id: 'salary-warning-mandate-minimum-hourly-rate',
      values: {
        rate: values.rate.toFixed(2),
        minimumRate: taxes.minimumHourlyRate.toFixed(2),
        year: taxes.year,
      },
    });
  }

  const netto = round2(
    fullSalaryBrutto
      - nonCashBonusTotal
      - social.zusTaxes- healthInsurance
      - pitTax
      - ppk.ppkEmployee
      - values.deductionAfterTax
      + values.additionAfterTax,
  );

  return {
    fullSalaryBrutto,
    brutto: fullSalaryBrutto,
    netto,

    bonuses: values.bonuses ?? [],
    bonusTotal,
    cashBonusTotal,
    nonCashBonusTotal,

    l4Payment: sicknessBenefit,
    sicknessBenefit,
    postEmploymentSicknessBenefit: round2(postEmploymentSicknessBenefit),
    postEmploymentSicknessBenefitDays,
    employerSickPay: 0,
    employerSickPayDays: 0,
    sicknessBenefitDays:
      (ordinarySicknessBenefitEligible ? ordinaryL4DaysCount : 0)
        + (accidentInsuranceActive ? accidentL4DaysCount : 0),

    socialInsuranceBase,
    pensionDisabilityBase:
      social.pensionDisabilityBase,
    zusPension: social.zusPension,
    zusDisability: social.zusDisability,
    zusSickness: social.zusSickness,
    zusTaxes: social.zusTaxes,

    healthInsuranceBase,
    healthInsurance,

    pitRevenue,
    pitExemptRevenue,
    pitKup,
    pitBase,
    pitTax,
    pitAt12,
    pitAt32,

    ppkBase: ppk.ppkBase,
    ppkEmployee: ppk.ppkEmployee,
    ppkEmployer: ppk.ppkEmployer,

    perHour: values.rate,
    rate: values.rate,
    isUnder26: values.isUnder26,
    isStudent: values.isStudent,

    monthlyFacts: buildMonthlyFacts({
      taxableIncome: scalePitBaseForYtd,
      pit0Revenue: pitExemptRevenue,
      pensionDisabilityBase: social.pensionDisabilityBase,
      uopKupUsed: 0,
    }),

    yearToDate: buildYearToDate({
      values,
      pitBase: scalePitBaseForYtd,
      pit0ExemptRevenue: pitExemptRevenue,
      pensionDisabilityBase:
        social.pensionDisabilityBase,
      current50Kup:
        values.kup === 50
          ? pitKup
          : 0,
      currentUopKup: 0,
      includePitBaseInScale: true,
    }),

    warnings,
    workRateType: values.workRateType,
    calculationType: 'mandate',
  };
};

export const calculateTaxesUoP = (
  values: SalaryCalculatorValues,
): SalaryCalculationResult => {
  assertSupportedTaxYear(values);

  const warnings: SalaryCalculationMessage[] = [];
  const {
    bonusTotal,
    cashBonusTotal,
    nonCashBonusTotal,
  } = getBonusTotals(values);

  const workingDaysInMonth = getWorkedDaysInMonthWithPolishHolidays(
    values.year,
    values.month - 1,
    values.holidays,
    values.l4,
    values.leave,
    values.employmentStartDate,
    values.employmentEndDate,
  );

  // L4 days that overlap the active employment period. These days are used
  // for salary/allowance reductions. Post-employment L4 must not reduce
  // remuneration that is already excluded by employmentEndDate.
  const employmentL4DaysCount = countDaysWithinPeriod(
    values.l4,
    values.employmentStartDate,
    values.employmentEndDate,
  );

  const employerSickPayLimit =
    values.uopEmployerSickPayLimit ?? 33;

  const previousEmployerSickPayDays = Math.max(
    0,
    values.previousEmployerSickPayDays ?? 0,
  );

  const ordinarySicknessBenefitEligible =
    values.sicknessBenefitEligible ?? true;

  let remainingEmployerSickPayDays = Math.max(
    0,
    employerSickPayLimit
      - previousEmployerSickPayDays,
  );

  let employerSickPayDays = 0;
  let sicknessBenefitDays = 0;
  let employerSickPayAmount = 0;
  let sicknessBenefitAmount = 0;
  let postEmploymentSicknessBenefitAmount = 0;
  let postEmploymentSicknessBenefitDays = 0;

  warnIfPostEmploymentL4BaseMissing(values, warnings);

  // Process ranges chronologically because the 33/14-day Art. 92 limit applies
  // only to ordinary sickness/full-100 sickness from sickness insurance.
  // A work accident / occupational disease is paid from accident insurance
  // from the first day and does not consume the employer sick-pay limit.
  const orderedL4Ranges = [...values.l4].sort(
    (left, right) => left.start.localeCompare(right.start),
  );

  const hasOrdinaryL4 = orderedL4Ranges.some(
    (range) => getL4PaymentType(range) !== 'accident100',
  );

  if (hasOrdinaryL4 && !ordinarySicknessBenefitEligible) {
    warnings.push({
      id: 'salary-warning-uop-sickness-benefit-not-eligible',
    });
  }

  orderedL4Ranges.forEach((range) => {
    const paymentType = getL4PaymentType(range);
    const {
      duringEmploymentDays,
      postEmploymentDays,
    } = getL4RangeDaySplit(
      range,
      values.employmentStartDate,
      values.employmentEndDate,
    );

    const totalPayableDays =
      duringEmploymentDays + postEmploymentDays;

    if (totalPayableDays <= 0) return;

    const duringEmploymentDailyPayment = getL4DailyPayment(
      range,
      values.l4Base,
    );
    const postEmploymentDailyPayment = getL4DailyPayment(
      range,
      values.l4BaseAfterTermination ?? values.l4Base,
    );

    // Accident/occupational-disease benefit is ZUS-funded from the first
    // payable day in the currently supported model. Post-employment days are
    // therefore naturally included and never consume the employer limit.
    if (paymentType === 'accident100') {
      sicknessBenefitDays += totalPayableDays;
      sicknessBenefitAmount +=
        duringEmploymentDailyPayment * duringEmploymentDays
          + postEmploymentDailyPayment * postEmploymentDays;
      postEmploymentSicknessBenefitAmount +=
        postEmploymentDailyPayment * postEmploymentDays;
      postEmploymentSicknessBenefitDays += postEmploymentDays;
      return;
    }

    if (!ordinarySicknessBenefitEligible) {
      return;
    }

    // The employer's 33/14-day limit applies only while employment is active.
    // Any qualifying L4 days after employment ends are paid as ZUS sickness
    // benefit and must not consume the remaining employer sick-pay limit.
    const employerDaysForRange = Math.min(
      duringEmploymentDays,
      remainingEmployerSickPayDays,
    );

    const inEmploymentBenefitDays = Math.max(
      0,
      duringEmploymentDays - employerDaysForRange,
    );

    const benefitDaysForRange =
      inEmploymentBenefitDays + postEmploymentDays;

    employerSickPayDays += employerDaysForRange;
    sicknessBenefitDays += benefitDaysForRange;
    remainingEmployerSickPayDays -= employerDaysForRange;

    employerSickPayAmount +=
      duringEmploymentDailyPayment * employerDaysForRange;
    sicknessBenefitAmount +=
      duringEmploymentDailyPayment * inEmploymentBenefitDays
        + postEmploymentDailyPayment * postEmploymentDays;
    postEmploymentSicknessBenefitAmount +=
      postEmploymentDailyPayment * postEmploymentDays;
    postEmploymentSicknessBenefitDays += postEmploymentDays;
  });

  const employerSickPay = round2(employerSickPayAmount);
  const sicknessBenefit = round2(sicknessBenefitAmount);

  const l4Payment = round2(
    employerSickPay + sicknessBenefit,
  );

  const nominalWorkingHours = values.workingHours;
  const leaveHours = getVacationScheduledHours({
    year: values.year,
    month: values.month,
    leave: values.leave,
    l4: values.l4,
    holidays: values.holidays,
    employmentStartDate: values.employmentStartDate,
    employmentEndDate: values.employmentEndDate,
  });

  // leaveBase retains its existing V1 meaning: monthly-equivalent gross.
  // Historical averaging happens exclusively in calculateUopVacationBase.
  const leavePayment = nominalWorkingHours > 0
    ? round2((values.leaveBase / nominalWorkingHours) * leaveHours)
    : 0;

  const perHourRaw =
    values.workRateType === 'uop_hourly'
      ? values.rate
      : nominalWorkingHours > 0
        ? values.rate / nominalWorkingHours
        : 0;

  const perHour = round2(perHourRaw);

  // Some payroll systems round the derived hourly rate before using it in
  // subsequent calculations; others keep the full division result.
  // Display remains rounded to 2 decimals in both modes.
  const hourlyRateForCalculations =
    values.workRateType === 'uop_monthly' &&
    (values.hourlyRateCalculationMode ?? 'roundedTo2') === 'fullPrecision'
      ? perHourRaw
      : perHour;

  const employmentExcludedWorkingHours =
    getWorkingHoursOutsideEmploymentPeriod(
      values.year,
      values.month - 1,
      values.holidays,
      values.employmentStartDate,
      values.employmentEndDate,
    );

  const functionalAllowance = Math.max(
    0,
    values.functionalAllowance ?? 0,
  );

  const functionalAllowanceEmploymentReduction =
    nominalWorkingHours > 0
      ? round2(
          (functionalAllowance / nominalWorkingHours)
            * employmentExcludedWorkingHours,
        )
      : 0;

  const functionalAllowanceAfterEmployment = round2(
    Math.max(
      0,
      functionalAllowance
        - functionalAllowanceEmploymentReduction,
    ),
  );

  const functionalAllowanceL4Reduction =
    values.functionalAllowanceRetainedDuringSickness
      ? 0
      : round2(
          Math.min(
            functionalAllowanceAfterEmployment,
            (functionalAllowance / 30) * employmentL4DaysCount,
          ),
        );

  const functionalAllowancePayment = round2(
    Math.max(
      0,
      functionalAllowanceAfterEmployment
        - functionalAllowanceL4Reduction,
    ),
  );

  // If the allowance is retained during sickness, the sickness-period share
  // remains PIT income but is excluded from the ZUS/health contribution bases.
  const retainedFunctionalAllowanceSicknessPart =
    values.functionalAllowanceRetainedDuringSickness
      ? round2(
          Math.min(
            functionalAllowancePayment,
            (functionalAllowance / 30) * employmentL4DaysCount,
          ),
        )
      : 0;

  let workDaysPayment: number;
  let leaveReduction = 0;
  let l4Reduction = 0;
  let employmentReduction = 0;

  if (values.workRateType === 'uop_monthly') {
    leaveReduction = nominalWorkingHours > 0
      ? round2((values.rate / nominalWorkingHours) * leaveHours)
      : 0;

    l4Reduction = round2(
      (values.rate / 30) * employmentL4DaysCount,
    );

    // For starting/ending employment during the month, payroll reduces the
    // monthly rate using the full monthly working-time norm as the divisor.
    // Keep the raw division until the final component is rounded; this matches
    // cases such as 7,500 / 184 * 72 = 2,934.78.
    employmentReduction =
      nominalWorkingHours > 0
        ? round2(
            (values.rate / nominalWorkingHours)
              * employmentExcludedWorkingHours,
          )
        : 0;

    workDaysPayment = round2(
      Math.max(
        0,
        values.rate
          - leaveReduction
          - l4Reduction
          - employmentReduction,
      ),
    );
  } else {
    workDaysPayment = round2(
      workingDaysInMonth
        * perHourRaw
        * 8,
    );
  }

  const dailyOvertimes = round2(
    hourlyRateForCalculations
      * values.dailyOvertime
      * taxes.dailyOvertimeMultiplier,
  );

  const weekendHolidayOvertimes = round2(
    hourlyRateForCalculations
      * values.weekendHolidayOvertime
      * taxes.weekendHolidayOvertimeMultiplier,
  );

  const nightOvertime = round2(
    hourlyRateForCalculations
      * values.nightOvertime
      * taxes.nightOvertimeMultiplier,
  );

  const minimumHourlyForNightAllowance =
    nominalWorkingHours > 0
      ? taxes.minimumWage / nominalWorkingHours
      : 0;

  // Deliberately unchanged: the statutory night allowance has its own base and
  // is not controlled by hourlyRateCalculationMode.
  const nightWorkAllowance = round2(
    (
      values.nightHours
        + values.nightOvertime
    )
      * minimumHourlyForNightAllowance
      * taxes.nightAllowancePercentOfMinimumHourly
      / 100,
  );

  const turnOfDayHours = round2(
    hourlyRateForCalculations
      * values.turnOfDayHours
      * taxes.turnOfDayHours
      / 100,
  );

  const overtimes = round2(
    dailyOvertimes
      + weekendHolidayOvertimes
      + nightOvertime
      + nightWorkAllowance
      + turnOfDayHours,
  );

  const fullSalaryBrutto = round2(
    workDaysPayment
      + employerSickPay
      + sicknessBenefit
      + leavePayment
      + functionalAllowancePayment
      + bonusTotal
      + overtimes,
  );

  // Neither employer-funded sick pay nor sickness benefit is a social-insurance base.
  // A functional allowance retained for the sickness period also remains outside
  // the social-insurance base for that retained sickness-period share.
  const socialInsuranceBase = calculateUopSocialInsuranceBase({
    grossComponents: [fullSalaryBrutto],
    nonContributoryComponents: [
      employerSickPay,
      sicknessBenefit,
      retainedFunctionalAllowanceSicknessPart,
    ],
  });

  const social =
    calculateEmployeeSocialContributions({
      socialBase: socialInsuranceBase,
      previousPensionDisabilityBase:
        values.previousPensionDisabilityBase ?? 0,
      sicknessBase: socialInsuranceBase,
    });

  // Employer-funded sick pay is included in the health base. Sickness benefit is not.
  const healthInsuranceBase = round2(
    Math.max(
      0,
      fullSalaryBrutto
        - sicknessBenefit
        - retainedFunctionalAllowanceSicknessPart
        - social.zusTaxes,
    ),
  );

  const healthInsurance = percent(
    healthInsuranceBase,
    taxes.healthInsurance,
  );

  const ppk = calculatePpk(
    Boolean(values.ppkEnabled),
    socialInsuranceBase,
    values,
    warnings,
  );

  const employerPpkTaxableContribution =
    getEmployerPpkTaxableContribution(
      values,
      ppk.ppkEmployer,
    );

  const pitRevenue = round2(
    fullSalaryBrutto
      + employerPpkTaxableContribution,
  );

  // Employer-funded sick pay remains employment income and can use PIT-0 when
  // the selected relief applies. Sickness benefit is always outside PIT-0.
  const pit0EligibleRevenue = round2(
    pitRevenue - sicknessBenefit,
  );

  const split = getPit0Split(
    values,
    'uop',
    pit0EligibleRevenue,
    sicknessBenefit,
  );

  const deductibleSocial =
    getDeductibleSocialForPit(
      social.zusTaxes,
      pit0EligibleRevenue,
      split.taxableEligibleRevenue,
    );

  const taxableEmploymentRevenueAfterSocial =
    Math.max(
      0,
      split.taxableEligibleRevenue
        - deductibleSocial,
    );

  // Employee KUP applies to employment income, not to sickness benefit.
  const pitKup = calculateUopKup(
    values,
    taxableEmploymentRevenueAfterSocial,
  );

  const pitBase = roundPln(
    Math.max(
      0,
      taxableEmploymentRevenueAfterSocial
        - pitKup
        + sicknessBenefit,
    ),
  );

  const pit = calculateProgressivePitAdvance(
    pitBase,
    values.previousTaxableIncome ?? 0,
    values.pit2MonthlyReduction ?? 0,
    values.doNotWithholdPitAdvance,
  );

  const netto = round2(
    fullSalaryBrutto
      - nonCashBonusTotal
      - social.zusTaxes
      - healthInsurance
      - pit.pitTax
      - ppk.ppkEmployee
      - values.deductionAfterTax
      + values.additionAfterTax,
  );

  return {
    fullSalaryBrutto,

    workDaysPayment,
    employmentReduction,
    employmentExcludedWorkingHours,
    l4Reduction,
    leaveReduction,
    employmentPeriodStart: values.employmentStartDate ?? null,
    employmentPeriodEnd: values.employmentEndDate ?? null,
    workRateType: values.workRateType,

    l4Payment,
    employerSickPay,
    sicknessBenefit,
    postEmploymentSicknessBenefit: round2(postEmploymentSicknessBenefitAmount),
    postEmploymentSicknessBenefitDays,
    employerSickPayDays,
    sicknessBenefitDays,

    leavePayment,
    functionalAllowancePayment,
    functionalAllowanceEmploymentReduction,
    functionalAllowanceL4Reduction,

    bonuses: values.bonuses ?? [],
    bonusTotal,
    cashBonusTotal,
    nonCashBonusTotal,

    overtimes,
    dailyOvertimes,
    weekendHolidayOvertimes,
    nightOvertime,

    nightHours:
      nightWorkAllowance,

    nightWorkAllowance,
    turnOfDayHours,

    perHour,
    rate: values.rate,
    isUnder26: values.isUnder26,
    isStudent: values.isStudent,

    socialInsuranceBase,
    pensionDisabilityBase:
      social.pensionDisabilityBase,
    zusPension:
      social.zusPension,
    zusDisability:
      social.zusDisability,
    zusSickness:
      social.zusSickness,
    zusTaxes:
      social.zusTaxes,

    healthInsuranceBase,
    healthInsurance,

    pitRevenue,
    pitExemptRevenue:
      split.exemptRevenue,
    pitKup,
    pitBase,
    pitTax:
      pit.pitTax,
    pitAt12:
      pit.pitAt12,
    pitAt32:
      pit.pitAt32,

    ppkBase:
      ppk.ppkBase,
    ppkEmployee:
      ppk.ppkEmployee,
    ppkEmployer:
      ppk.ppkEmployer,

    netto,
    brutto:
      fullSalaryBrutto,

    monthlyFacts: buildMonthlyFacts({
      taxableIncome: pitBase,
      pit0Revenue: split.exemptRevenue,
      pensionDisabilityBase: social.pensionDisabilityBase,
      uopKupUsed: pitKup,
    }),

    yearToDate: buildYearToDate({
      values,
      pitBase,
      pit0ExemptRevenue:
        split.exemptRevenue,
      pensionDisabilityBase:
        social.pensionDisabilityBase,
      current50Kup: 0,
      currentUopKup:
        pitKup,
      currentEmployerSickPayDays:
        employerSickPayDays,
    }),

    warnings,
    calculationType: 'uop',
  };
};