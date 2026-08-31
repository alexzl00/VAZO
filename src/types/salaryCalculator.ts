import type { ISODateRange } from '../utils/monthHelperFunc';

export type WorkRate = 'uop_monthly' | 'uop_hourly' | 'mandate_hourly' | 'uod_fixed';

export type Pit2MonthlyReduction = 0 | 100 | 150 | 300;
export type UopKup = 0 | 250 | 300;
export type UopEmployerSickPayLimit = 14 | 33;
export type Pit0Relief = 'none' | 'young' | 'return' | 'family4plus' | 'workingSenior';

export type SalaryCalculatorValues = {
  // --- PIT / tax ---

  /**
   * @deprecated Legacy field. Do not use it as the tax-rate source anymore.
   * 32% is determined from year-to-date taxable income, and PIT-0 from pit0Relief.
   */
  taxRegime: 0 | 12;

  /** Legacy PIT-2 switch kept so the current form does not break. */
  pit2: boolean;

  /**
   * Preferred PIT-2 value. If omitted, pit2=true is treated as 300 zł.
   * Allows splitting the tax-reducing amount between 1/12, 1/24 and 1/36.
   */
  pit2MonthlyReduction?: Pit2MonthlyReduction;

  /** UoP monthly KUP: 250 standard, 300 commuter, 0 if not applied. */
  uopKup?: UopKup;

  /** Used only to select the annual cap for fixed UoP KUP. */
  hasMultipleEmploymentRelationships?: boolean;

  /** UZ/UoD KUP. 50% should only be selected for qualifying copyright income. */
  kup: 20 | 50;

  /** PIT-0 relief. UoD is never covered by these reliefs. */
  pit0Relief?: Pit0Relief;

  isStudent: boolean;
  isUnder26: boolean;

  /** YTD taxable income before this calculation. Used to apply the 120,000 zł PIT threshold. */
  previousTaxableIncome?: number;

  /** YTD PIT-0 exempt revenue before this calculation. Shared annual limit: 85,528 zł. */
  previousPit0Revenue?: number;

  /** YTD pension/disability contribution base before this calculation. Annual limit in 2026: 282,600 zł. */
  previousPensionDisabilityBase?: number;

  /** YTD 50% KUP already used before this calculation. */
  previous50KupUsed?: number;

  /** YTD fixed UoP KUP already used before this calculation. */
  previousUopKupUsed?: number;

  /** Special request to the payer not to collect PIT advances, if the taxpayer is eligible. */
  doNotWithholdPitAdvance?: boolean;

  /**
   * UoP: statutory employer-funded sick-pay limit for the calendar year.
   * Usually 33 days, or 14 days from the year after the employee turns 50.
   */
  uopEmployerSickPayLimit?: UopEmployerSickPayLimit;

  /** UoP: employer-funded sick-pay days already used before the calculated month. */
  previousEmployerSickPayDays?: number;

  deductionAfterTax: number;
  additionAfterTax: number;

  // --- UZ insurance status ---

  /** Voluntary sickness insurance on an ordinary UZ. */
  mandateVoluntarySicknessInsurance?: boolean;

  /**
   * True when the zleceniobiorca has already acquired the right to sickness benefit
   * (normally after the 90-day waiting period, or under a statutory exception /
   * qualifying previous insurance period).
   */
  mandateSicknessBenefitEligible?: boolean;

  /**
   * True when another UoP gives at least the minimum base required to make
   * pension/disability insurance from this UZ non-compulsory.
   */
  mandateHasOtherUopAtLeastMinimumBase?: boolean;

  /**
   * Sum of compulsory social-insurance bases from earlier concurrent UZ titles
   * in the same month/order. If it already reaches the 2026 minimum wage,
   * social insurance from this UZ is treated as non-compulsory.
   */
  mandateOtherSocialBaseBeforeThisContract?: number;

  /** UZ/UoD with own employer or work actually performed for own employer. */
  isOwnEmployerContract?: boolean;
  performedForOwnEmployer?: boolean;

  /**
   * Explicitly enable the special <=200 zł 12% lump-sum PIT branch.
   * Do not derive this from amount alone because statutory conditions must also be satisfied.
   */
  smallContractLumpSumEligible?: boolean;

  // --- PPK ---

  ppkEnabled?: boolean;
  ppkEmployeeRate?: number; // normally 2%, optionally 0.5-4%
  ppkEmployerRate?: number; // normally 1.5%, optionally 1.5-4%

  /**
   * Employer PPK amount that is actually taxable in this payroll month.
   * If omitted, the calculator assumes the current calculated employer PPK
   * is transferred in the same month. Use this override when transfer timing
   * makes the taxable PPK amount differ from the accrued current-month amount.
   */
  ppkEmployerTaxableContribution?: number;

  // --- Calendar and working-time norm ---

  year: number;
  month: number;
  workingHours: number;

  // --- Rate and bonuses ---

  workRateType: WorkRate;
  rate: number;

  attendanceBonus: number;
  discretionaryBonus: number;
  otherBonus: number;

  holidays: ISODateRange[];

  // --- Overtime and night work ---

  /** Overtime hours paid with normal wage + 50% addition. */
  dailyOvertime: number;

  /** Overtime hours paid with normal wage + 100% addition. */
  weekendHolidayOvertime: number;

  /** Night overtime hours. The engine adds normal wage + 100% OT and the statutory night allowance. */
  nightOvertime: number;

  /** Ordinary night-work hours excluding nightOvertime, to avoid double-counting the night allowance. */
  nightHours: number;

  /** Existing app-specific field; fixed +50% is preserved in the engine. */
  turnOfDayHours: number;
  overtimeLimit: number;

  // --- Sick leave (L4) ---

  l4: ISODateRange[];
  l4Base: number;

  // --- Annual leave ---

  leave: ISODateRange[];
  leaveBase: number;

  // virtual property for error
  totalOvertime?: string;

  // --- For edit form ---

  isOverride: boolean;
  netSalaryOverride: number | null;
  grossSalaryOverride: number | null;
  reason: string | null;
};
