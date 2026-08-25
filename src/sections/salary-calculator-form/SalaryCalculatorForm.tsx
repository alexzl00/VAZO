import { useState } from 'react';

// mui
import {
  Box,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Alert
} from '@mui/material';

import FormHelperText from '@mui/material/FormHelperText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// third party
import { FormattedMessage, useIntl } from 'react-intl';
import { 
  Formik,
  Form
} from "formik";

import * as Yup from 'yup';

import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);


// project imports
import CardTabs from '../../components/CardTabs';
import MonthPicker from '../../components/MonthPikcer';
import FormWithInfo from '../../components/FormWithInfo';
import { FormikNumberField, FomrikSelectField } from '../../components/FormikFields';

import TaxChart from '../../components/Calculator/TaxChart';

import EditSalaryCalculation from '../../components/Modals/EditSalaryCalculation';
import ConfirmActionDialog from '../../components/Modals/ConfirmActionDialog';

// utils 
import camelToKebabCase from '../../utils/camelToKebab';
import { MultiRangeMonthPicker } from '../../components/DaysPicker';
import { isInMonth, isoToDayjsRanges, getWorkedDaysInMonth } from '../../utils/monthHelperFunc';
import { calculateTaxesUoP, calculateTaxesContractOfMandate, calculateTaxesUoD} from '../../utils/workTypeSalaryCalc';
import type { SalaryCalculationResult } from '../../utils/workTypeSalaryCalc';
import type { DateRange } from '../../components/DaysPicker';

// types
import type { SalaryCalculatorValues } from '../../types/salaryCalculator';
import type { DialogConfig } from '../../components/Modals/ConfirmActionDialog';

type BaseProps = {
  initialValues: SalaryCalculatorValues;
  onSubmit: (values: SalaryCalculatorValues) => Promise<void>;
};

type SalaryFormProps =
  | (BaseProps & { type: "create" })
  | (BaseProps & { type: "update"; deleteOverride: () => void });


const normalizeSalaryValues = (values: SalaryCalculatorValues): SalaryCalculatorValues => ({
  ...values,

  // backwards compatibility for records created before the 2026 tax-engine upgrade
  pit2MonthlyReduction: values.pit2MonthlyReduction ?? (values.pit2 ? 300 : 0),
  uopKup: values.uopKup ?? 250,
  hasMultipleEmploymentRelationships: values.hasMultipleEmploymentRelationships ?? false,
  pit0Relief:
    values.pit0Relief ??
    (values.taxRegime === 0 || values.isUnder26 ? 'young' : 'none'),
  isStudent: values.isStudent ?? false,
  isUnder26: values.isUnder26 ?? values.taxRegime === 0,
  doNotWithholdPitAdvance: values.doNotWithholdPitAdvance ?? false,

  previousTaxableIncome: values.previousTaxableIncome ?? 0,
  previousPit0Revenue: values.previousPit0Revenue ?? 0,
  previousPensionDisabilityBase: values.previousPensionDisabilityBase ?? 0,
  previous50KupUsed: values.previous50KupUsed ?? 0,
  previousUopKupUsed: values.previousUopKupUsed ?? 0,

  mandateVoluntarySicknessInsurance: values.mandateVoluntarySicknessInsurance ?? false,
  mandateHasOtherUopAtLeastMinimumBase: values.mandateHasOtherUopAtLeastMinimumBase ?? false,
  mandateOtherSocialBaseBeforeThisContract: values.mandateOtherSocialBaseBeforeThisContract ?? 0,
  isOwnEmployerContract: values.isOwnEmployerContract ?? false,
  performedForOwnEmployer: values.performedForOwnEmployer ?? false,
  smallContractLumpSumEligible: values.smallContractLumpSumEligible ?? false,

  ppkEnabled: values.ppkEnabled ?? false,
  ppkEmployeeRate: values.ppkEmployeeRate ?? 2,
  ppkEmployerRate: values.ppkEmployerRate ?? 1.5,
});


const positiveNumber = () =>
  Yup.number()
    .typeError('Must be a number')
    .required('Required')
    .test('positive', 'Must be >= 0', (value) => {
      // value can be number or NaN
      return typeof value === 'number' && !isNaN(value) && value >= 0;
    });

const SalarySchema = Yup.object().shape({
  // legacy fields kept for backwards compatibility with saved salaries
  taxRegime: Yup.mixed<0 | 12>().oneOf([0, 12]).required(),
  pit2: Yup.boolean().required(),

  pit2MonthlyReduction: Yup.mixed<0 | 100 | 150 | 300>()
    .oneOf([0, 100, 150, 300])
    .required(),
  uopKup: Yup.mixed<0 | 250 | 300>().oneOf([0, 250, 300]).required(),
  hasMultipleEmploymentRelationships: Yup.boolean().required(),
  pit0Relief: Yup.mixed<'none' | 'young' | 'return' | 'family4plus' | 'workingSenior'>()
    .oneOf(['none', 'young', 'return', 'family4plus', 'workingSenior'])
    .required(),
  doNotWithholdPitAdvance: Yup.boolean().required(),

  deductionAfterTax: positiveNumber(),
  additionAfterTax: positiveNumber(),
  kup: Yup.mixed<20 | 50>().oneOf([20, 50]).required(),
  isStudent: Yup.boolean().required(),
  isUnder26: Yup.boolean().required(),

  previousTaxableIncome: positiveNumber(),
  previousPit0Revenue: positiveNumber(),
  previousPensionDisabilityBase: positiveNumber(),
  previous50KupUsed: positiveNumber(),
  previousUopKupUsed: positiveNumber(),

  mandateVoluntarySicknessInsurance: Yup.boolean().required(),
  mandateHasOtherUopAtLeastMinimumBase: Yup.boolean().required(),
  mandateOtherSocialBaseBeforeThisContract: positiveNumber(),
  isOwnEmployerContract: Yup.boolean().required(),
  performedForOwnEmployer: Yup.boolean().required(),
  smallContractLumpSumEligible: Yup.boolean().required(),

  ppkEnabled: Yup.boolean().required(),
  ppkEmployeeRate: Yup.number()
    .typeError('Must be a number')
    .required('Required')
    .min(0.5, 'PPK employee rate must be at least 0.5%')
    .max(4, 'PPK employee rate cannot exceed 4%'),
  ppkEmployerRate: Yup.number()
    .typeError('Must be a number')
    .required('Required')
    .min(1.5, 'PPK employer rate must be at least 1.5%')
    .max(4, 'PPK employer rate cannot exceed 4%'),

  year: Yup.number().required().min(2000),
  month: Yup.number().required().min(1).max(12),
  workingHours: positiveNumber().min(1),

  workRateType: Yup.mixed<'uop_monthly' | 'uop_hourly' | 'mandate_hourly' | 'uod_fixed'>().required(),
  rate: positiveNumber().required(),
  attendanceBonus: positiveNumber(),
  discretionaryBonus: positiveNumber(),
  otherBonus: positiveNumber(),

  overtimeLimit: positiveNumber(),

  dailyOvertime: positiveNumber()
    .max(Yup.ref('overtimeLimit'), 'Cannot exceed overtime limit'),

  weekendHolidayOvertime: positiveNumber()
    .max(Yup.ref('overtimeLimit'), 'Cannot exceed overtime limit'),

  nightOvertime: positiveNumber()
    .max(Yup.ref('overtimeLimit'), 'Cannot exceed overtime limit'),

  nightHours: positiveNumber(),
  turnOfDayHours: positiveNumber(),

  l4Base: positiveNumber(),

  l4: Yup.array().of(
    Yup.object().shape({
      start: Yup.string().required(),
      end: Yup.string().required(),
    })
  ).test('l4-in-month', 'L4 must be within selected month', function (ranges) {
    const { year, month } = this.parent;
    if (!ranges) return true;
    return ranges.every(r =>
      isInMonth(r.start, year, month) && isInMonth(r.end, year, month)
    );
  }),

  leaveBase: positiveNumber(),

  leave: Yup.array().of(
    Yup.object().shape({
      start: Yup.string().required(),
      end: Yup.string().required(),
    })
  ).test('leave-in-month', 'Leave must be within selected month', function (ranges) {
    const { year, month } = this.parent;
    if (!ranges) return true;
    return ranges.every(r =>
      isInMonth(r.start, year, month) && isInMonth(r.end, year, month)
    );
  }),

  holidays: Yup.array().of(
    Yup.object().shape({
      start: Yup.string().required(),
      end: Yup.string().required(),
    })
  ).test('holidays-in-month', 'Hlidays must be within selected month', function (ranges) {
    const { year, month } = this.parent;
    if (!ranges) return true;
    return ranges.every(r =>
      isInMonth(r.start, year, month) && isInMonth(r.end, year, month)
    );
  }),

  netSalaryOverride: Yup.number()
    .nullable()
    .typeError('Must be a number')
    .min(0, 'Must be >= 0'),

  grossSalaryOverride: Yup.number()
    .nullable()
    .typeError('Must be a number')
    .min(0, 'Must be >= 0'),

  reason: Yup.string().nullable(),

}).test('overtime-sum', function (values) {
  const { dailyOvertime = 0, weekendHolidayOvertime = 0, nightOvertime = 0, overtimeLimit = 0 } = values;
  if (dailyOvertime + weekendHolidayOvertime + nightOvertime > overtimeLimit) {
    return this.createError({
      path: 'totalOvertime', // attach error to dailyOvertime field
      message: 'Total overtime cannot exceed overtime limit',
    });
  }
  return true; // pass validation if sum is ok
});

export default function SalaryForm({ initialValues, onSubmit, type, ...rest }: SalaryFormProps) {
  const intl = useIntl();
  const normalizedInitialValues = normalizeSalaryValues(initialValues);
  const [value, setValue] = useState(0);

  const [editCalculationOpen, setEditCalculationOpen] = useState(false);

  const [dialogType, setDialogType] = useState<"reset" | "save" | null>(null);

  const theme = useTheme();
  const isMidScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const isInitiallyOverride = initialValues.isOverride ?? false;
  const deleteOverride = 'deleteOverride' in rest ? rest.deleteOverride : undefined;

  const [disabledTabs, setDisabledTabs] = useState<number[]>(
    initialValues.workRateType === 'mandate_hourly' || initialValues.workRateType === 'uod_fixed'
      ? [3, 4, 5]
      : []
  );

  const labels = [
    intl.formatMessage({ id: 'tabs-rate-and-bonuses' }),
    intl.formatMessage({ id: 'tabs-taxes-and-deductions' }),
    intl.formatMessage({ id: 'tabs-calendar-and-working-time' }),
    intl.formatMessage({ id: 'tabs-overtime-and-night-hours' }),
    intl.formatMessage({ id: 'tabs-sick-leave' }),
    intl.formatMessage({ id: 'tabs-vacation' })
  ];

  const dialogMap: Record<string, DialogConfig> = {
    save: {
      variant: 'success' as const,
      title: <FormattedMessage id="dialog-save-salary-update-title" />,
      message: <FormattedMessage id="dialog-save-salary-update-message" />,
      confirmText: <FormattedMessage id="save" />,
      getAction: (closeDialog: () => void, saveSalaryUpdate: () => void) => () => {
        saveSalaryUpdate();
        closeDialog();
      },
    },
    reset: {
      variant: 'danger' as const,
      title: <FormattedMessage id="dialog-reset-salary-update-title" />,
      message: <FormattedMessage id="dialog-reset-salary-update-message" />,
      confirmText: <FormattedMessage id="reset" />,
      getAction: (closeDialog: () => void, resetFormik: () => void) => () => {
        resetFormik();
        closeDialog();
      },
    },
  };

  const changeTab = (value: number) => {
    setValue(value);
  }

  const closeDialog = () => {
    setDialogType(null);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Formik
        initialValues={normalizedInitialValues}
        validationSchema={SalarySchema}
        onSubmit={ async (values) => {
          await onSubmit(values);
        }}
      >
        {({ values, handleChange, setFieldValue, errors, touched, dirty, resetForm, submitForm }) => {

          let calculation: SalaryCalculationResult | null = null;
          let calculationError: string | null = null;

          try {
            if (values.workRateType === 'mandate_hourly') {
              calculation = calculateTaxesContractOfMandate(values);
            } else if (values.workRateType === 'uop_hourly' || values.workRateType === 'uop_monthly') {
              calculation = calculateTaxesUoP(values);
            } else {
              calculation = calculateTaxesUoD(values);
            }
          } catch (error) {
            calculationError = error instanceof Error ? error.message : 'Salary calculation failed';
          }

          return (
            <>    
              <Form>
                <CardTabs value={value} labels={labels} onChange={changeTab} disabledTabs={disabledTabs}/>

                <Box 
                  sx={{
                    display:'flex', 
                    justifyContent: isMidScreen ? 'center' : 'flex-start', 
                    mt: 3
                  }}
                >
                  <Stack 
                    direction={isMidScreen ? 'column' : 'row'}
                    spacing={isMidScreen ? 2 : 0}
                    justifyContent={isMidScreen ? 'center' : 'space-between'}

                    sx={{ width: '100%' }}
                  >
                    <Box sx={{ mt: 3, width: '320px' }}>
                      {/* TAB 0: Stawka i premie */}
                      {value === 0 && (
                        <FormWithInfo
                          title={intl.formatMessage({id: 'tabs-rate-and-bonuses' })}
                          infoText={intl.formatMessage({id: "rate-and-bonuses-info"})}
                        >
                          <Stack spacing={2}>
                            <FomrikSelectField
                              name="workRateType"
                              inputLabel="rate-and-bonuses-work-rate-type"
                              disabled={type === 'update'}
                              menuItems={[
                                { value: "uop_monthly", text: <FormattedMessage id="rate-monthly" /> },
                                { value: "uop_hourly", text: <FormattedMessage id="rate-hourly" /> },
                                { value: "mandate_hourly", text: <FormattedMessage id="rate-contract-of-mandate" /> },
                                { value: "uod_fixed", text: <FormattedMessage id="rate-contract-for-specific-work" /> },
                              ]}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFieldValue("workRateType", value);                  
                                if (value === "mandate_hourly" || value === "uod_fixed") {
                                  setDisabledTabs([3, 4, 5]);
                                } else {
                                  setDisabledTabs([]);
                                }
                              }}
                            />

                            {(['rate', 'attendanceBonus', 'discretionaryBonus', 'otherBonus'] as const).map((name) => {
                              if ( values.workRateType === 'uod_fixed' && (name === 'attendanceBonus' || name === 'otherBonus') ) {
                                return null; // we consider only discretionary bonus for CSW, so we hide attendance and other bonus fields
                              }
                              return (
                                <FormikNumberField
                                  key={name}
                                  name={name}
                                  labelId={`rate-and-bonuses-${camelToKebabCase(name)}`}
                                  unit={
                                    name === 'rate' && !errors.workingHours
                                      ? values.workRateType === 'uop_monthly'
                                        ? `${Math.round(values.rate / values.workingHours * 100) / 100} zł/h`
                                        : (values.workRateType === 'uop_hourly' || values.workRateType === 'mandate_hourly')
                                          ? `${Math.round(values.rate * values.workingHours * 100) / 100} zł`
                                          : ''
                                      : undefined
                                  }
                                />
                              )
                            })}
                          </Stack>
                        </FormWithInfo>
                      )}

                      {/* TAB 1: Podatki i potrącenia */}
                      {value === 1 && (
                        <FormWithInfo 
                          title={intl.formatMessage({id: 'tabs-taxes-and-deductions' })}
                          infoText={intl.formatMessage({id: "taxes-and-deductions-info"})}
                        >
                          <Stack spacing={2}>
                            {(values.workRateType === 'uop_hourly' || values.workRateType === 'uop_monthly') && (
                              <FomrikSelectField
                                name="uopKup"
                                inputLabel="taxes-and-deductions-uop-kup"
                                menuItems={[
                                  { value: 250, text: '250 zł' },
                                  { value: 300, text: '300 zł' },
                                  { value: 0, text: '0 zł' },
                                ]}
                                onChange={(e) => setFieldValue('uopKup', Number(e.target.value))}
                              />
                            )}

                            {(values.workRateType === 'mandate_hourly' || values.workRateType === 'uod_fixed') && (
                              <FomrikSelectField
                                name="kup"
                                inputLabel="taxes-and-deductions-kup"
                                menuItems={[
                                  { value: 20, text: '20%' },
                                  { value: 50, text: '50%' },
                                ]}
                                onChange={(e) => setFieldValue('kup', Number(e.target.value))}
                              />
                            )}

                            {values.workRateType !== 'uod_fixed' && (
                              <FomrikSelectField
                                name="pit0Relief"
                                inputLabel="taxes-and-deductions-pit0-relief"
                                menuItems={[
                                  { value: 'none', text: intl.formatMessage({ id: 'taxes-and-deductions-pit0-none', defaultMessage: 'No PIT-0 relief' }) },
                                  { value: 'young', text: intl.formatMessage({ id: 'taxes-and-deductions-pit0-young', defaultMessage: 'Ulga dla młodych' }) },
                                  { value: 'return', text: intl.formatMessage({ id: 'taxes-and-deductions-pit0-return', defaultMessage: 'Ulga na powrót' }) },
                                  { value: 'family4plus', text: intl.formatMessage({ id: 'taxes-and-deductions-pit0-family4plus', defaultMessage: 'Ulga dla rodzin 4+' }) },
                                  { value: 'workingSenior', text: intl.formatMessage({ id: 'taxes-and-deductions-pit0-working-senior', defaultMessage: 'Ulga dla pracujących seniorów' }) },
                                ]}
                                onChange={(e) => {
                                  const relief = e.target.value;
                                  setFieldValue('pit0Relief', relief);
                                  setFieldValue('taxRegime', relief === 'young' ? 0 : 12); // legacy compatibility only

                                  if (relief !== 'young') {
                                    setFieldValue('isUnder26', false);
                                  }
                                }}
                              />
                            )}

                            {values.workRateType !== 'uod_fixed' && values.pit0Relief === 'young' && (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="isUnder26"
                                    checked={values.isUnder26}
                                    onChange={handleChange}
                                  />
                                }
                                label={intl.formatMessage({ id: 'taxes-and-deductions-age-status', defaultMessage: 'Under 26' })}
                              />
                            )}

                            {values.workRateType === 'mandate_hourly' && (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="isStudent"
                                    checked={values.isStudent}
                                    onChange={handleChange}
                                  />
                                }
                                label={intl.formatMessage({ id: 'taxes-and-deductions-student-status', defaultMessage: 'Student / pupil status' })}
                              />
                            )}

                            <FomrikSelectField
                              name="pit2MonthlyReduction"
                              inputLabel="taxes-and-deductions-pit2-reduction"
                              menuItems={[
                                { value: 0, text: '0 zł' },
                                { value: 100, text: '100 zł' },
                                { value: 150, text: '150 zł' },
                                { value: 300, text: '300 zł' },
                              ]}
                              onChange={(e) => {
                                const reduction = Number(e.target.value) as 0 | 100 | 150 | 300;
                                setFieldValue('pit2MonthlyReduction', reduction);
                                setFieldValue('pit2', reduction > 0); // legacy compatibility
                              }}
                            />

                            <FormControlLabel
                              control={
                                <Checkbox
                                  name="doNotWithholdPitAdvance"
                                  checked={values.doNotWithholdPitAdvance ?? false}
                                  onChange={handleChange}
                                />
                              }
                              label={intl.formatMessage({ id: 'taxes-and-deductions-no-pit-advance', defaultMessage: 'Do not withhold PIT advance (eligible cases only)' })}
                            />

                            {(values.workRateType === 'uop_hourly' || values.workRateType === 'uop_monthly') && (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="hasMultipleEmploymentRelationships"
                                    checked={values.hasMultipleEmploymentRelationships ?? false}
                                    onChange={handleChange}
                                  />
                                }
                                label={intl.formatMessage({ id: 'taxes-and-deductions-multiple-employments', defaultMessage: 'Multiple employment relationships' })}
                              />
                            )}

                            {values.workRateType === 'mandate_hourly' && (
                              <>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      name="mandateVoluntarySicknessInsurance"
                                      checked={values.mandateVoluntarySicknessInsurance ?? false}
                                      onChange={handleChange}
                                    />
                                  }
                                  label={intl.formatMessage({ id: 'taxes-and-deductions-voluntary-sickness', defaultMessage: 'Voluntary sickness insurance' })}
                                />

                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      name="mandateHasOtherUopAtLeastMinimumBase"
                                      checked={values.mandateHasOtherUopAtLeastMinimumBase ?? false}
                                      onChange={handleChange}
                                    />
                                  }
                                  label={intl.formatMessage({ id: 'taxes-and-deductions-other-uop-minimum', defaultMessage: 'Another UoP reaches the minimum insurance base' })}
                                />

                                <FormikNumberField
                                  name="mandateOtherSocialBaseBeforeThisContract"
                                  labelId="taxes-and-deductions-earlier-uz-social-base"
                                  unit="zł"
                                />
                              </>
                            )}

                            {(values.workRateType === 'mandate_hourly' || values.workRateType === 'uod_fixed') && (
                              <>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      name="isOwnEmployerContract"
                                      checked={values.isOwnEmployerContract ?? false}
                                      onChange={handleChange}
                                    />
                                  }
                                  label={intl.formatMessage({ id: 'taxes-and-deductions-own-employer-contract', defaultMessage: 'Contract with own employer' })}
                                />

                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      name="performedForOwnEmployer"
                                      checked={values.performedForOwnEmployer ?? false}
                                      onChange={handleChange}
                                    />
                                  }
                                  label={intl.formatMessage({ id: 'taxes-and-deductions-performed-for-own-employer', defaultMessage: 'Work performed for own employer' })}
                                />

                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      name="smallContractLumpSumEligible"
                                      checked={values.smallContractLumpSumEligible ?? false}
                                      onChange={handleChange}
                                    />
                                  }
                                  label={intl.formatMessage({ id: 'taxes-and-deductions-small-contract-lump-sum', defaultMessage: 'Special ≤200 zł lump-sum PIT conditions are met' })}
                                />
                              </>
                            )}

                            {values.workRateType !== 'uod_fixed' && (
                              <>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      name="ppkEnabled"
                                      checked={values.ppkEnabled ?? false}
                                      onChange={handleChange}
                                    />
                                  }
                                  label="PPK"
                                />

                                {values.ppkEnabled && (
                                  <>
                                    <FormikNumberField
                                      name="ppkEmployeeRate"
                                      labelId="taxes-and-deductions-ppk-employee-rate"
                                      unit="%"
                                    />
                                    <FormikNumberField
                                      name="ppkEmployerRate"
                                      labelId="taxes-and-deductions-ppk-employer-rate"
                                      unit="%"
                                    />
                                  </>
                                )}
                              </>
                            )}

                            <FormikNumberField name="previousTaxableIncome" labelId="taxes-and-deductions-ytd-taxable-income" unit="zł"/>

                            {values.workRateType !== 'uod_fixed' && (
                              <FormikNumberField name="previousPit0Revenue" labelId="taxes-and-deductions-ytd-pit0-revenue" unit="zł"/>
                            )}

                            <FormikNumberField name="previousPensionDisabilityBase" labelId="taxes-and-deductions-ytd-zus-base" unit="zł"/>

                            {(values.workRateType === 'mandate_hourly' || values.workRateType === 'uod_fixed') && values.kup === 50 && (
                              <FormikNumberField name="previous50KupUsed" labelId="taxes-and-deductions-ytd-50-kup" unit="zł"/>
                            )}

                            {(values.workRateType === 'uop_hourly' || values.workRateType === 'uop_monthly') && (
                              <FormikNumberField name="previousUopKupUsed" labelId="taxes-and-deductions-ytd-uop-kup" unit="zł"/>
                            )}

                            <FormikNumberField name="deductionAfterTax" labelId="taxes-and-deductions-deduction-after-tax" unit="zł"/>
                            <FormikNumberField name="additionAfterTax" labelId="taxes-and-deductions-addition-after-tax" unit="zł"/>
                          </Stack>
                        </FormWithInfo>
                      )}

                      {/* TAB 2: Kalendarz i norma czasu */}
                      {value === 2 && (
                        <FormWithInfo
                          title={intl.formatMessage({id: 'tabs-calendar-and-working-time' })}
                          infoText={intl.formatMessage({id: "calendar-and-working-time-info"})}
                        >
                          <Stack spacing={2} width={'320px'}>
                            <FormikNumberField
                              name="year"
                              labelId="year"
                              onChange={(newYear, form) => {
                                const month = form.values.month;
                                const holidays = form.values.holidays;
                                const newWorkingHours = getWorkedDaysInMonth(newYear, month - 1, holidays, [], []) * 8;
                                form.setFieldValue("workingHours", newWorkingHours);
                              }}
                            />

                            <MonthPicker
                              value={values.month}
                              onChange={(val) => {
                                setFieldValue("month", val)
                                setFieldValue("workingHours", getWorkedDaysInMonth(values.year, val-1, values.holidays, [], []) * 8)
                              }}
                              label={intl.formatMessage({id: "month-picker-label"})}
                              error={Boolean(touched.month && errors.month)}
                              helperText={touched.month && errors.month ? errors.month : ""}
                            />

                            <Stack spacing={1}>
                              {/* // For UoP and Mandate we show working hours field, for CSW we hide it as it's not relevant (CSW is based on fixed price, not hourly rate) */}
                              { (values.workRateType === 'uop_hourly' 
                                  || values.workRateType === 'uop_monthly' 
                                  || values.workRateType === 'mandate_hourly'
                                ) &&
                                <FormikNumberField name="workingHours" labelId="calendar-and-working-time-working-hours"/>
                              }

                              {(values.workRateType === 'uop_hourly' || values.workRateType === 'uop_monthly') && (
                                <Box sx={{paddingTop: '10px'}}>
                                  <MultiRangeMonthPicker
                                    singleClick
                                    initialMonth={dayjs(
                                      `${values.year}-${String(values.month).padStart(2, "0")}-01`
                                    )}
                                    defaultValue={isoToDayjsRanges(values.holidays)}
                                    disableMonthSwitching={true}
                                    onChange={(ranges: DateRange[]) => {
                                      const isoRanges = ranges.map(r => ({
                                        start: r.start.format("YYYY-MM-DD"),
                                        end: r.end.format("YYYY-MM-DD"),
                                      }));
                                      setFieldValue("holidays", isoRanges);
                                      setFieldValue("workingHours", getWorkedDaysInMonth(values.year, values.month-1, isoRanges, [], []) * 8)
                                    }} 
                                  />
                                  {errors.holidays && <FormHelperText error>{errors.holidays as string}</FormHelperText>}
                                </Box>
                              )}
                            </Stack>
                          </Stack>
                        </FormWithInfo>
                      )}

                      {/* TAB 3: Nadgodziny */}
                      {value === 3 && (
                        <FormWithInfo
                          title={intl.formatMessage({id: 'tabs-overtime-and-night-hours' })}
                          infoText={intl.formatMessage({id: "overtime-and-night-hours-info"})}
                        >
                          <Stack spacing={2}>
                            {/* Show total overtime sum error once at the top */}
                            {(['dailyOvertime', 'weekendHolidayOvertime', 'nightOvertime'] as const).some(
                              (name) => touched[name]
                            ) && errors.totalOvertime && (
                              <FormHelperText error>{errors.totalOvertime}</FormHelperText>
                            )}

                            {([
                              'dailyOvertime',
                              'weekendHolidayOvertime',
                              'nightOvertime',
                              'nightHours',
                              'turnOfDayHours',
                              'overtimeLimit',
                            ] as const).map((name) => (
                              <FormikNumberField
                                key={name}
                                name={name}
                                labelId={`overtime-and-night-hours-${camelToKebabCase(name)}`}
                              />
                            ))}
                          </Stack>
                        </FormWithInfo>
                      )}

                      {/* TAB 4: L4 */}
                      {value === 4 && (
                        <FormWithInfo
                          title={intl.formatMessage({id: 'tabs-sick-leave' })}
                          infoText={intl.formatMessage({id: "sick-leave-info"})
                        }>
                          <Stack spacing={2}>
                            <Stack spacing={0} width={'320px'}>
                              <FormikNumberField name="l4Base" labelId="l4-base"/>
                            </Stack>
                            <Box>
                              <MultiRangeMonthPicker
                                initialMonth={dayjs(
                                  `${values.year}-${String(values.month).padStart(2, "0")}-01`
                                )}
                                defaultValue={isoToDayjsRanges(values.l4)}
                                disableMonthSwitching={true}
                                onChange={(ranges: DateRange[]) => {
                                  const isoRanges = ranges.map(r => ({
                                    start: r.start.format("YYYY-MM-DD"),
                                    end: r.end.format("YYYY-MM-DD"),
                                  }));
                                  setFieldValue("l4", isoRanges);
                                }} 
                              />
                              {errors.l4 && <FormHelperText error>{errors.l4 as string}</FormHelperText>}
                            </Box>
                          </Stack>
                        </FormWithInfo>
                      )}

                      {/* TAB 5: Urlop */}
                      {value === 5 && (
                        <FormWithInfo
                          title={intl.formatMessage({id: 'tabs-vacation' })}
                          infoText={intl.formatMessage({id: "vacation-leave-info"})}
                        >
                          <Stack spacing={2}>
                            <Stack spacing={1} width={'320px'}>
                              <FormikNumberField name="leaveBase" labelId="vacation-leave-base"/>
                            </Stack>
                            <Box>
                              <MultiRangeMonthPicker
                                initialMonth={dayjs(
                                  `${values.year}-${String(values.month).padStart(2, "0")}-01`
                                )}
                                defaultValue={isoToDayjsRanges(values.leave)}
                                disableMonthSwitching={true}
                                onChange={(ranges: DateRange[]) => {
                                  const isoRanges = ranges.map(r => ({
                                    start: r.start.format("YYYY-MM-DD"),
                                    end: r.end.format("YYYY-MM-DD"),
                                  }));
                                  setFieldValue("leave", isoRanges);
                                }} 
                              />
                              {errors.leave && <FormHelperText error>{errors.leave as string}</FormHelperText>}
                            </Box>
                          </Stack>
                        </FormWithInfo>
                      )}
                    </Box>
                    <Box sx={{ mt: 7}}>
                      {calculation ? (
                        <TaxChart calculation={calculation}/>
                      ) : (
                        <Alert severity="warning" sx={{ maxWidth: 420 }}>
                          {calculationError}
                        </Alert>
                      )}
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    {dirty && 
                      <>
                        <Button variant="contained" sx={{backgroundColor: 'rgb(7, 173, 82)'}} onClick={()=>{setDialogType("save")}}>
                          <FormattedMessage id={"save"}/>
                        </Button>

                        <Button variant="contained" sx={{backgroundColor: 'rgb(149, 57, 4)'}} onClick={() => setDialogType('reset')} >
                          <FormattedMessage id={"reset"}/>
                        </Button>
                      </>
                    }

                    <Button variant="contained" onClick={() => setEditCalculationOpen(true)}>
                      <FormattedMessage id={"calculation-edit"}/>
                    </Button>
                  </Stack>
                </Box>

                <EditSalaryCalculation 
                  open={editCalculationOpen} 
                  setFieldValue={setFieldValue} 
                  onClose={() => setEditCalculationOpen(false)}
                  isInitiallyOverride={isInitiallyOverride}
                  deleteOverride={deleteOverride}
                  values={{
                    grossSalaryOverride: values.grossSalaryOverride, 
                    netSalaryOverride: values.netSalaryOverride, 
                    reason: values.reason
                  }}
                  initialValues={{
                    grossSalaryOverride: initialValues.grossSalaryOverride,
                    netSalaryOverride: initialValues.netSalaryOverride,
                    reason: initialValues.reason
                  }}
                />
              </Form>

              <ConfirmActionDialog
                open={!!dialogType}
                form={false}
                extraContent={dialogType ? dialogMap[dialogType].extraContent : undefined}
                title={dialogType ? dialogMap[dialogType].title : ''}
                message={dialogType ? dialogMap[dialogType].message : ''}
                confirmText={dialogType ? dialogMap[dialogType].confirmText : ''}
                variant={dialogType ? dialogMap[dialogType].variant : 'default'}
                onConfirm={() => {
                  if (!dialogType) return;

                  console.log(submitForm)

                  if (dialogType === 'save') {
                    dialogMap["save"].getAction(
                      closeDialog,
                      submitForm
                    )();
                  } else if (dialogType === 'reset') {
                    dialogMap["reset"].getAction(
                      closeDialog,
                      resetForm
                    )();
                  }
                }}
                onCancel={closeDialog}
              />
            </>
          )
        }}
      </Formik>
    </Box>
  );
}