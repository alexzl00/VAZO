import type { SalaryFieldConfig } from './salaryFieldMetadata';

const UOP_CONTRACTS = ['uop_monthly', 'uop_hourly'] as const;
const CIVIL_CONTRACTS = ['mandate_hourly', 'uod_fixed'] as const;
const PPK_CONTRACTS = ['uop_monthly', 'uop_hourly', 'mandate_hourly'] as const;

const positiveRequired = {
  required: true,
  min: 0,
  minMessageId: 'validation-number-min-zero',
} as const;

const round2 = (value: number) => Math.round(value * 100) / 100;

export const rateFieldConfigs: SalaryFieldConfig[] = [
  {
    name: 'workRateType',
    type: 'select',
    labelId: 'rate-and-bonuses-work-rate-type',
    options: [
      { value: 'uop_monthly', labelId: 'rate-monthly' },
      { value: 'uop_hourly', labelId: 'rate-hourly' },
      { value: 'mandate_hourly', labelId: 'rate-contract-of-mandate' },
      { value: 'uod_fixed', labelId: 'rate-contract-for-specific-work' },
    ],
    disabledWhen: (_, context) => context.formMode === 'update',
    validation: {
      required: true,
    },
  },
  {
    name: 'rate',
    type: 'number',
    labelId: 'rate-and-bonuses-rate',
    unit: (values) => {
      if (!values.workingHours || values.workingHours <= 0) {
        return undefined;
      }

      if (values.workRateType === 'uop_monthly') {
        return `${round2(values.rate / values.workingHours)} zł/h`;
      }

      if (
        values.workRateType === 'uop_hourly' ||
        values.workRateType === 'mandate_hourly'
      ) {
        return `${round2(values.rate * values.workingHours)} zł`;
      }

      return undefined;
    },
    validation: positiveRequired,
  },
];

/**
 * Common tax settings shown directly on the tax tab.
 * Rare / expert-only fields live in advancedTaxFieldConfigs and are rendered in
 * AdvancedSalarySettingsDialog.
 */
export const taxFieldConfigs: SalaryFieldConfig[] = [
  {
    name: 'uopKup',
    type: 'select',
    labelId: 'taxes-and-deductions-uop-kup',
    contracts: [...UOP_CONTRACTS],
    defaultValue: 250,
    options: [
      { value: 250, label: '250 zł' },
      { value: 300, label: '300 zł' },
      { value: 0, label: '0 zł' },
    ],
    validation: {
      required: true,
    },
  },
  {
    name: 'kup',
    type: 'select',
    labelId: 'taxes-and-deductions-kup',
    contracts: [...CIVIL_CONTRACTS],
    options: [
      { value: 20, label: '20%' },
      { value: 50, label: '50%' },
    ],
    validation: {
      required: true,
    },
  },
  {
    name: 'pit0Relief',
    type: 'select',
    labelId: 'taxes-and-deductions-pit0-relief',
    contracts: [...PPK_CONTRACTS],
    defaultValue: (values) =>
      values.taxRegime === 0 || values.isUnder26
        ? 'young'
        : 'none',
    options: [
      { value: 'none', labelId: 'taxes-and-deductions-pit0-none' },
      { value: 'young', labelId: 'taxes-and-deductions-pit0-young' },
      { value: 'return', labelId: 'taxes-and-deductions-pit0-return' },
      { value: 'family4plus', labelId: 'taxes-and-deductions-pit0-family4plus' },
      { value: 'workingSenior', labelId: 'taxes-and-deductions-pit0-working-senior' },
    ],
    onChange: (value, { setFieldValue }) => {
      const relief = String(value);

      setFieldValue('taxRegime', relief === 'young' ? 0 : 12, false);

      if (relief !== 'young') {
        setFieldValue('isUnder26', false, false);
      }
    },
    validation: {
      required: true,
    },
  },
  {
    name: 'isUnder26',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-age-status',
    contracts: [...PPK_CONTRACTS],
    defaultValue: false,
    visibleWhen: (values) => values.pit0Relief === 'young',
    validation: {
      required: true,
    },
  },
  {
    name: 'isStudent',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-student-status',
    contracts: ['mandate_hourly'],
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'pit2MonthlyReduction',
    type: 'select',
    labelId: 'taxes-and-deductions-pit2-reduction',
    defaultValue: (values) => values.pit2 ? 300 : 0,
    options: [
      { value: 0, label: '0 zł' },
      { value: 100, label: '100 zł' },
      { value: 150, label: '150 zł' },
      { value: 300, label: '300 zł' },
    ],
    onChange: (value, { setFieldValue }) => {
      setFieldValue('pit2', Number(value) > 0, false);
    },
    validation: {
      required: true,
    },
  },
  {
    name: 'mandateVoluntarySicknessInsurance',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-voluntary-sickness',
    contracts: ['mandate_hourly'],
    defaultValue: false,
    onChange: (value, { setFieldValue }) => {
      if (!Boolean(value)) {
        setFieldValue('mandateSicknessBenefitEligible', false, false);
      }
    },
    validation: {
      required: true,
    },
  },
  {
    name: 'ppkEnabled',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-ppk',
    contracts: [...PPK_CONTRACTS],
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'ppkEmployeeRate',
    type: 'number',
    labelId: 'taxes-and-deductions-ppk-employee-rate',
    contracts: [...PPK_CONTRACTS],
    visibleWhen: (values) => Boolean(values.ppkEnabled),
    unit: '%',
    defaultValue: 2,
    validation: {
      required: true,
      min: 0.5,
      max: 4,
      minMessageId: 'validation-ppk-employee-rate-min',
      maxMessageId: 'validation-ppk-employee-rate-max',
    },
  },
  {
    name: 'ppkEmployerRate',
    type: 'number',
    labelId: 'taxes-and-deductions-ppk-employer-rate',
    contracts: [...PPK_CONTRACTS],
    visibleWhen: (values) => Boolean(values.ppkEnabled),
    unit: '%',
    defaultValue: 1.5,
    validation: {
      required: true,
      min: 1.5,
      max: 4,
      minMessageId: 'validation-ppk-employer-rate-min',
      maxMessageId: 'validation-ppk-employer-rate-max',
    },
  },
  {
    name: 'deductionAfterTax',
    type: 'number',
    labelId: 'taxes-and-deductions-deduction-after-tax',
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
  {
    name: 'additionAfterTax',
    type: 'number',
    labelId: 'taxes-and-deductions-addition-after-tax',
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
];

export const advancedTaxFieldConfigs: SalaryFieldConfig[] = [
  {
    name: 'hourlyRateCalculationMode',
    type: 'select',
    labelId: 'advanced-settings-hourly-rate-calculation-mode',
    helperTextId: 'advanced-settings-hourly-rate-calculation-mode-help',
    contracts: ['uop_monthly'],
    defaultValue: 'roundedTo2',
    options: [
      {
        value: 'roundedTo2',
        labelId: 'advanced-settings-hourly-rate-rounded-to-2',
      },
      {
        value: 'fullPrecision',
        labelId: 'advanced-settings-hourly-rate-full-precision',
      },
    ],
    validation: {
      required: true,
    },
  },
  {
    name: 'doNotWithholdPitAdvance',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-no-pit-advance',
    helperTextId: 'taxes-and-deductions-no-pit-advance-help',
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'hasMultipleEmploymentRelationships',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-multiple-employments',
    helperTextId: 'taxes-and-deductions-multiple-employments-help',
    contracts: [...UOP_CONTRACTS],
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'uopEmployerSickPayLimit',
    type: 'select',
    labelId: 'taxes-and-deductions-uop-sick-pay-limit',
    helperTextId: 'taxes-and-deductions-uop-sick-pay-limit-help',
    contracts: [...UOP_CONTRACTS],
    defaultValue: 33,
    options: [
      { value: 33, labelId: 'taxes-and-deductions-uop-sick-pay-limit-33' },
      { value: 14, labelId: 'taxes-and-deductions-uop-sick-pay-limit-14' },
    ],
    validation: {
      required: true,
    },
  },
  {
    name: 'previousEmployerSickPayDays',
    type: 'number',
    labelId: 'taxes-and-deductions-previous-employer-sick-pay-days',
    helperTextId: 'taxes-and-deductions-previous-employer-sick-pay-days-help',
    contracts: [...UOP_CONTRACTS],
    unit: 'dni',
    defaultValue: 0,
    validation: {
      ...positiveRequired,
      maxField: 'uopEmployerSickPayLimit',
      maxFieldMessageId: 'validation-uop-sick-pay-days-limit',
    },
  },
  {
    name: 'mandateSicknessBenefitEligible',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-mandate-sickness-benefit-eligible',
    helperTextId: 'taxes-and-deductions-mandate-sickness-benefit-eligible-help',
    contracts: ['mandate_hourly'],
    visibleWhen: (values) => Boolean(values.mandateVoluntarySicknessInsurance),
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'mandateHasOtherUopAtLeastMinimumBase',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-other-uop-minimum',
    helperTextId: 'taxes-and-deductions-other-uop-minimum-help',
    contracts: ['mandate_hourly'],
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'mandateOtherSocialBaseBeforeThisContract',
    type: 'number',
    labelId: 'taxes-and-deductions-earlier-uz-social-base',
    contracts: ['mandate_hourly'],
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
  {
    name: 'isOwnEmployerContract',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-own-employer-contract',
    contracts: [...CIVIL_CONTRACTS],
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'performedForOwnEmployer',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-performed-for-own-employer',
    contracts: [...CIVIL_CONTRACTS],
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'smallContractLumpSumEligible',
    type: 'checkbox',
    labelId: 'taxes-and-deductions-small-contract-lump-sum',
    contracts: [...CIVIL_CONTRACTS],
    defaultValue: false,
    validation: {
      required: true,
    },
  },
  {
    name: 'previousTaxableIncome',
    type: 'number',
    labelId: 'taxes-and-deductions-ytd-taxable-income',
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
  {
    name: 'previousPit0Revenue',
    type: 'number',
    labelId: 'taxes-and-deductions-ytd-pit0-revenue',
    contracts: [...PPK_CONTRACTS],
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
  {
    name: 'previousPensionDisabilityBase',
    type: 'number',
    labelId: 'taxes-and-deductions-ytd-zus-base',
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
  {
    name: 'previous50KupUsed',
    type: 'number',
    labelId: 'taxes-and-deductions-ytd-50-kup',
    contracts: [...CIVIL_CONTRACTS],
    visibleWhen: (values) => values.kup === 50,
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
  {
    name: 'previousUopKupUsed',
    type: 'number',
    labelId: 'taxes-and-deductions-ytd-uop-kup',
    contracts: [...UOP_CONTRACTS],
    unit: 'zł',
    defaultValue: 0,
    validation: positiveRequired,
  },
];

export const overtimeFieldConfigs: SalaryFieldConfig[] = [
  {
    name: 'dailyOvertime',
    type: 'number',
    labelId: 'overtime-and-night-hours-daily-overtime',
    contracts: [...UOP_CONTRACTS],
    validation: {
      ...positiveRequired,
      maxField: 'overtimeLimit',
      maxFieldMessageId: 'validation-number-cannot-exceed-overtime-limit',
    },
  },
  {
    name: 'weekendHolidayOvertime',
    type: 'number',
    labelId: 'overtime-and-night-hours-weekend-holiday-overtime',
    contracts: [...UOP_CONTRACTS],
    validation: {
      ...positiveRequired,
      maxField: 'overtimeLimit',
      maxFieldMessageId: 'validation-number-cannot-exceed-overtime-limit',
    },
  },
  {
    name: 'nightOvertime',
    type: 'number',
    labelId: 'overtime-and-night-hours-night-overtime',
    contracts: [...UOP_CONTRACTS],
    validation: {
      ...positiveRequired,
      maxField: 'overtimeLimit',
      maxFieldMessageId: 'validation-number-cannot-exceed-overtime-limit',
    },
  },
  {
    name: 'nightHours',
    type: 'number',
    labelId: 'overtime-and-night-hours-night-hours',
    contracts: [...UOP_CONTRACTS],
    validation: positiveRequired,
  },
  {
    name: 'turnOfDayHours',
    type: 'number',
    labelId: 'overtime-and-night-hours-turn-of-day-hours',
    contracts: [...UOP_CONTRACTS],
    validation: positiveRequired,
  },
  {
    name: 'overtimeLimit',
    type: 'number',
    labelId: 'overtime-and-night-hours-overtime-limit',
    contracts: [...UOP_CONTRACTS],
    validation: positiveRequired,
  },
];

export const metadataDrivenFieldConfigs = [
  ...rateFieldConfigs,
  ...taxFieldConfigs,
  ...advancedTaxFieldConfigs,
  ...overtimeFieldConfigs,
];
