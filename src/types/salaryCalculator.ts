import type { ISODateRange } from '../utils/monthHelperFunc';

export type WorkRate = 'uop_monthly' | 'uop_hourly' | 'mandate_hourly' | 'uod_fixed';

export type Pit2MonthlyReduction = 0 | 100 | 150 | 300;
export type UopKup = 0 | 250 | 300;
export type UopEmployerSickPayLimit = 14 | 33;
export type Pit0Relief = 'none' | 'young' | 'return' | 'family4plus' | 'workingSenior';

export type BonusFrequency =
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'oneOff';

export type BonusAmountType =
  | 'fixed'
  | 'variable';

export type SickLeaveTreatment =
  | 'paidInFull'
  | 'proportional'
  | 'nonProportional'
  | 'notPaid';

export type L4PaymentType =
  | 'standard80'
  | 'full100'
  | 'accident100';

export type L4Range = ISODateRange & {
  paymentType: L4PaymentType;
};

export const normalizeL4Ranges = (
  ranges: Array<ISODateRange & { paymentType?: string }> | null | undefined,
): L4Range[] =>
  (ranges ?? []).map((range) => ({
    start: range.start,
    end: range.end,
    paymentType:
      range.paymentType === 'full100' || range.paymentType === 'accident100'
        ? range.paymentType
        : 'standard80',
  }));

export type BonusPaymentType =
  | 'cash'
  | 'nonCash';


/**
 * Controls which hourly rate is used in calculations that derive an hourly
 * value from a monthly UoP salary.
 *
 * roundedTo2 preserves the calculator's previous behaviour.
 * fullPrecision keeps the raw division result until the final component is rounded.
 */
export type HourlyRateCalculationMode =
  | 'roundedTo2'
  | 'fullPrecision';

export type SalaryBonus = {
  id: string;
  name: string;
  amount: number;
  frequency: BonusFrequency;

  /**
   * Basic payment form.
   * Undefined is treated as cash for old records.
   */
  paymentType?: BonusPaymentType;

  amountType?: BonusAmountType;
  sickLeaveTreatment?: SickLeaveTreatment;
};

export type SalaryCalculatorValues = {
  // --- PIT / tax ---

  /**
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

  // --- Sickness eligibility / UZ insurance status ---

  /** Voluntary sickness insurance on an ordinary UZ. */
  mandateVoluntarySicknessInsurance?: boolean;

  /**
   * True when the insured person has acquired the right to ordinary sickness
   * benefits for this title. For UoP this normally follows the compulsory
   * sickness-insurance waiting period; for ordinary UZ it normally follows the
   * voluntary sickness-insurance waiting period. Statutory exceptions can make
   * the person eligible earlier. Accident-insurance L4 (accident100) is handled
   * separately and is not blocked by this flag.
   */
  sicknessBenefitEligible?: boolean;

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

  // --- Work relation / employment period ---

  /** Selected persisted work relation. Empty for guest calculations. */
  workRelationId?: string | null;

  /**
   * Effective relation period inside the selected salary month. These values
   * are derived from WorkRelation.start_date/end_date and clamped to the month.
   */
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;

  // --- Calendar and working-time norm ---

  year: number;
  month: number;
  workingHours: number;

  // --- Rate and bonuses ---

  workRateType: WorkRate;
  rate: number;

  /**
   * For a monthly UoP rate, controls whether derived hourly calculations use
   * a 2-decimal hourly rate or the full raw division result.
   * Optional for backward compatibility; undefined is treated as roundedTo2.
   */
  hourlyRateCalculationMode?: HourlyRateCalculationMode;

  /**
   * User-defined remuneration components.
   * The basic form edits name, amount and frequency.
   * Advanced Settings edits amountType and sickLeaveTreatment on the same objects.
   */
  bonuses?: SalaryBonus[];

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

  l4: L4Range[];
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
