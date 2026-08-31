import { countDays, getWorkedDaysInMonth } from '../utils/monthHelperFunc';
import type { Pit0Relief, SalaryCalculatorValues } from '../types/salaryCalculator';

export type SalaryCalculationResult = {
  fullSalaryBrutto: number;

  // earnings
  workDaysPayment?: number;
  l4Payment?: number;
  employerSickPay?: number;
  sicknessBenefit?: number;
  employerSickPayDays?: number;
  sicknessBenefitDays?: number;
  leavePayment?: number;
  attendanceBonus?: number;
  discretionaryBonus?: number;
  otherBonus?: number;
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

  warnings?: string[];

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
  PIT2_relief: 300, // legacy fallback

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

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundPln = (value: number) => Math.round(value);
const percent = (value: number, rate: number) => round2(value * rate / 100);

const assertSupportedTaxYear = (values: SalaryCalculatorValues) => {
  if (values.year !== taxes.year) {
    throw new Error(
      `Tax rules for ${values.year} are not configured. This calculator currently contains verified rules for ${taxes.year}.`,
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

const getPit2Reduction = (values: SalaryCalculatorValues) =>
  values.pit2MonthlyReduction ?? (values.pit2 ? taxes.PIT2_relief : 0);

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
  const remainingAnnualLimit = Math.max(
    0,
    taxes.zusAnnualPensionDisabilityLimit - previousPensionDisabilityBase,
  );

  const pensionDisabilityBase = round2(
    Math.min(socialBase, remainingAnnualLimit),
  );

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
  warnings: string[],
) => {
  if (!enabled || base <= 0) {
    return { ppkBase: 0, ppkEmployee: 0, ppkEmployer: 0 };
  }

  const employeeRate = values.ppkEmployeeRate ?? taxes.ppkEmployeeBasic;
  const employerRate = values.ppkEmployerRate ?? taxes.ppkEmployerBasic;

  if (employeeRate < 0.5 || employeeRate > 4) {
    warnings.push('PPK employee rate should be between 0.5% and 4%.');
  }

  if (employerRate < 1.5 || employerRate > 4) {
    warnings.push('PPK employer rate should be between 1.5% and 4%.');
  }

  if (employeeRate < 2 && base > taxes.reducedPpkMonthlyIncomeLimit) {
    warnings.push(
      `Reduced PPK rate below 2% normally requires total monthly remuneration not to exceed ${taxes.reducedPpkMonthlyIncomeLimit.toFixed(2)} zł in 2026.`,
    );
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

  const warnings: string[] = [];

  const fullSalaryBrutto = round2(
    values.rate + values.discretionaryBonus,
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
      warnings.push(
        'The <=200 zł lump-sum PIT branch is enabled, but gross remuneration exceeds 200 zł.',
      );
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
      getPit2Reduction(values),
      values.doNotWithholdPitAdvance,
    );

    ({ pitTax, pitAt12, pitAt32 } = pit);
  }

  const netto = round2(
    fullSalaryBrutto
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
    calculationType: 'uod_fixed',
  };
};

export const calculateTaxesContractOfMandate = (
  values: SalaryCalculatorValues,
): SalaryCalculationResult => {
  assertSupportedTaxYear(values);

  const warnings: string[] = [];

  const regularRemunerationBrutto = round2(
    values.rate * values.workingHours
      + values.attendanceBonus
      + values.discretionaryBonus
      + values.otherBonus,
  );

  const l4DaysCount = countDays(values.l4);

  const treatedAsEmployee = Boolean(
    values.isOwnEmployerContract || values.performedForOwnEmployer,
  );

  const studentExemption = Boolean(
    values.isStudent
      && values.isUnder26
      && !treatedAsEmployee,
  );

  const otherTitleRemovesCompulsorySocial = Boolean(
    !treatedAsEmployee
      && !studentExemption
      && (
        values.mandateHasOtherUopAtLeastMinimumBase
        || (values.mandateOtherSocialBaseBeforeThisContract ?? 0)
          >= taxes.minimumWage
      ),
  );

  const compulsorySocial =
    !studentExemption && !otherTitleRemovesCompulsorySocial;

  const healthCompulsory = !studentExemption;

  const voluntarySicknessInsuranceActive = Boolean(
    values.mandateVoluntarySicknessInsurance
      && compulsorySocial
      && !treatedAsEmployee,
  );

  const sicknessBenefitEligible = Boolean(
    voluntarySicknessInsuranceActive
      && values.mandateSicknessBenefitEligible,
  );

  let sicknessBenefit = 0;

  if (l4DaysCount > 0) {
    if (!values.mandateVoluntarySicknessInsurance) {
      warnings.push(
        'L4 on UZ requires sickness-insurance coverage. No sickness benefit was added.',
      );
    } else if (!voluntarySicknessInsuranceActive) {
      warnings.push(
        'Voluntary sickness insurance cannot be applied to this UZ because compulsory pension/disability insurance is not present for this title.',
      );
    } else if (!values.mandateSicknessBenefitEligible) {
      warnings.push(
        'L4 was entered for UZ, but the right to sickness benefit is not confirmed. Normally voluntary sickness insurance requires a 90-day waiting period, unless an exception or qualifying previous insurance period applies.',
      );
    } else {
      sicknessBenefit = round2(
        (values.l4Base / 30) * l4DaysCount * 0.8,
      );
    }
  }

  const fullSalaryBrutto = round2(
    regularRemunerationBrutto + sicknessBenefit,
  );

  // Sickness benefit itself is not a social/health contribution base.
  const socialInsuranceBase = compulsorySocial
    ? regularRemunerationBrutto
    : 0;

  const sicknessBase = treatedAsEmployee
    ? socialInsuranceBase
    : voluntarySicknessInsuranceActive
      ? Math.min(
          socialInsuranceBase,
          taxes.voluntarySicknessMonthlyBaseLimit,
        )
      : 0;

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
    warnings.push(
      'PPK is not calculated from this UZ because compulsory pension/disability insurance is not present for this title.',
    );
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
      warnings.push(
        'The <=200 zł lump-sum PIT branch is enabled, but gross remuneration exceeds 200 zł.',
      );
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
        getPit2Reduction(values),
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
      getPit2Reduction(values),
      values.doNotWithholdPitAdvance,
    );

    ({ pitTax, pitAt12, pitAt32 } = pit);
  }

  if (values.rate < taxes.minimumHourlyRate) {
    warnings.push(
      `Entered UZ hourly rate ${values.rate.toFixed(2)} zł is below the 2026 statutory minimum hourly rate of ${taxes.minimumHourlyRate.toFixed(2)} zł. Verify whether the contract is covered by the statutory minimum-rate rules.`,
    );
  }

  const netto = round2(
    fullSalaryBrutto
      - social.zusTaxes
      - healthInsurance
      - pitTax
      - ppk.ppkEmployee
      - values.deductionAfterTax
      + values.additionAfterTax,
  );

  return {
    fullSalaryBrutto,
    brutto: fullSalaryBrutto,
    netto,

    l4Payment: sicknessBenefit,
    sicknessBenefit,
    employerSickPay: 0,
    employerSickPayDays: 0,
    sicknessBenefitDays:
      sicknessBenefitEligible
        ? l4DaysCount
        : 0,

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
    calculationType: 'mandate',
  };
};

export const calculateTaxesUoP = (
  values: SalaryCalculatorValues,
): SalaryCalculationResult => {
  assertSupportedTaxYear(values);

  const warnings: string[] = [];

  const workingDaysInMonth = getWorkedDaysInMonth(
    values.year,
    values.month - 1,
    values.holidays,
    values.l4,
    values.leave,
  );

  const l4DaysCount = countDays(values.l4);

  const employerSickPayLimit =
    values.uopEmployerSickPayLimit ?? 33;

  const previousEmployerSickPayDays = Math.max(
    0,
    values.previousEmployerSickPayDays ?? 0,
  );

  const remainingEmployerSickPayDays = Math.max(
    0,
    employerSickPayLimit
      - previousEmployerSickPayDays,
  );

  const employerSickPayDays = Math.min(
    l4DaysCount,
    remainingEmployerSickPayDays,
  );

  const sicknessBenefitDays = Math.max(
    0,
    l4DaysCount - employerSickPayDays,
  );

  const dailySickPayment = values.l4Base > 0
    ? (values.l4Base / 30) * 0.8
    : 0;

  const employerSickPay = round2(
    dailySickPayment * employerSickPayDays,
  );

  const sicknessBenefit = round2(
    dailySickPayment * sicknessBenefitDays,
  );

  const l4Payment = round2(
    employerSickPay + sicknessBenefit,
  );

  const leaveDaysCount = countDays(
    values.leave,
  );

  const allWorkDaysInMonth =
    getWorkedDaysInMonth(
      values.year,
      values.month - 1,
      values.holidays,
      [],
      [],
    );

  const leavePayment =
    allWorkDaysInMonth > 0
      ? round2(
          (values.leaveBase / allWorkDaysInMonth)
            * leaveDaysCount,
        )
      : 0;

  const nominalWorkingHours =
    values.workingHours;

  const perHourRaw =
    values.workRateType === 'uop_hourly'
      ? values.rate
      : nominalWorkingHours > 0
        ? values.rate / nominalWorkingHours
        : 0;

  const perHour = round2(perHourRaw);

  let workDaysPayment: number;

  if (values.workRateType === 'uop_monthly') {
    const leaveReduction =
      allWorkDaysInMonth > 0
        ? (values.rate / allWorkDaysInMonth)
          * leaveDaysCount
        : 0;

    const l4Reduction =
      (values.rate / 30) * l4DaysCount;

    workDaysPayment = round2(
      Math.max(
        0,
        values.rate
          - leaveReduction
          - l4Reduction,
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
    perHour
      * values.dailyOvertime
      * taxes.dailyOvertimeMultiplier,
  );

  const weekendHolidayOvertimes = round2(
    perHour
      * values.weekendHolidayOvertime
      * taxes.weekendHolidayOvertimeMultiplier,
  );

  const nightOvertime = round2(
    perHour
      * values.nightOvertime
      * taxes.nightOvertimeMultiplier,
  );

  const minimumHourlyForNightAllowance =
    nominalWorkingHours > 0
      ? taxes.minimumWage / nominalWorkingHours
      : 0;

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
    perHour
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
      + values.attendanceBonus
      + values.discretionaryBonus
      + values.otherBonus
      + overtimes,
  );

  // Neither employer-funded sick pay nor sickness benefit is a social-insurance base.
  const socialInsuranceBase = round2(
    Math.max(
      0,
      fullSalaryBrutto
        - employerSickPay
        - sicknessBenefit,
    ),
  );

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
    getPit2Reduction(values),
    values.doNotWithholdPitAdvance,
  );

  const netto = round2(
    fullSalaryBrutto
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

    l4Payment,
    employerSickPay,
    sicknessBenefit,
    employerSickPayDays,
    sicknessBenefitDays,

    leavePayment,

    attendanceBonus:
      values.attendanceBonus,
    discretionaryBonus:
      values.discretionaryBonus,
    otherBonus:
      values.otherBonus,

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