import { useState } from 'react';

// mui
import {
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Stack
} from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

// third party
import { FormattedMessage, useIntl } from 'react-intl';
import { 
  Formik,
  Form,
  Field
} from "formik";

import type { FieldProps } from 'formik';

import * as Yup from 'yup';

import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);

// project imports
import CardTabs from '../components/CardTabs';
import MonthPicker from '../components/MonthPikcer';
import FormWithInfo from '../components/FormWithInfo';

// utils 
import camelToKebabCase from '../utils/camelToKebab';
import { MultiRangeMonthPicker } from '../components/DaysPicker';
import { isInMonth, isoToDayjsRanges, countDays, countWorkingDays, getWorkedDaysInMonth } from '../utils/monthHelperFunc';

import type { DateRange } from '../components/DaysPicker';
import type { ISODateRange } from '../utils/monthHelperFunc';

type SalaryCalculatorValues = {
  
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
  workRateType: 'monthly' | 'hourly' | 'contractOfMandate';
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

const now = new Date();

export const initialSalaryFormValues: SalaryCalculatorValues = {
  // podatki i potracenia
  taxRegime: 12,
  pit2: false, // umowa o prace

  kup: 20, // umowa zelcenia
  isStudent: false, // tylko dla umowy zlecenia
  isUnder26: false, // tylko dla umowy zlecenia

  deductionAfterTax: 0,
  additionAfterTax: 0,

  // Kalendarz i norma czasu pracy
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  workingHours: getWorkedDaysInMonth(now.getFullYear(), now.getMonth(), [], [], [])*8,

  // Stawka i premie
  workRateType: 'monthly',
  rate: 0,
  attendanceBonus: 0,
  discretionaryBonus: 0,
  otherBonus: 0,

  holidays: [],

  // Nadgodziny i godziny nocne
  dailyOvertime: 0,
  weekendHolidayOvertime: 0,
  nightOvertime: 0,

  nightHours: 0,
  turnOfDayHours: 0,

  overtimeLimit: 30,

  // Zwolnienie lekarskie (L4)
  l4: [],

  l4Base: 0,

  // Urlop
  leave: [],

  leaveBase: 0
};

const taxes = {
  // Podatki PIT
  zusPensionInsurance: 9.76, // %
  zusDisability: 1.5, // %
  zusSicknessInsurance: 2.45, // %
  taxDeductibaleExpenses: 250, // KUP zł
  PIT2_relief: 300, // zł

  // overtimes
  dailyOvertime: 150, // +50%
  weekendHolidayOvertime: 200, // +100%
  nightOvertime: 220, // +120%

  nightHours: 20, // +20%

  turnOfDayHours: 50, // it will be counted separately as extra +50%
}

const calculateTaxesContractOfMandate = (values: SalaryCalculatorValues) => {
  const fullSalaryBrutto = values.rate * values.workingHours;

  const zusTaxes = (values.isStudent && values.isUnder26)
    ? 0
    : Math.round(fullSalaryBrutto*taxes.zusPensionInsurance +
      fullSalaryBrutto*taxes.zusDisability)/100

  const healthInsurance = (values.isStudent && values.isUnder26)
    ? 0
    : (fullSalaryBrutto-zusTaxes)*0.09;

  const pitBase = (fullSalaryBrutto-zusTaxes) * (100-values.kup) / 100;
  let pit = values.isUnder26
    ? 0
    : (pitBase * 0.12);
  pit = values.pit2 ? Math.max(pit-taxes.PIT2_relief, 0) : pit

  const netto = fullSalaryBrutto - zusTaxes - healthInsurance - pit;

  console.log("ZUS "+zusTaxes, "healthInsurance " +healthInsurance, "pitBase "+pitBase, "pit "+pit, "netto " + netto)
}

const calculateTaxes = (values: SalaryCalculatorValues) => {
  if ( values.workRateType === 'contractOfMandate' ) return calculateTaxesContractOfMandate(values);
  const workingDaysInMonth = getWorkedDaysInMonth(values.year, values.month-1, values.holidays, values.l4, values.leave)

  const l4DaysCount = countDays(values.l4)
  const l4Payment = (values.l4Base / 30) * l4DaysCount * 0.8;

  const leaveDaysCount = countDays(values.leave);
  const leavePayment = (values.leaveBase / getWorkedDaysInMonth(values.year, values.month-1, values.holidays, [], [])) * leaveDaysCount;

  const perHour = values.workRateType === 'hourly' ? values.rate : values.rate / values.workingHours

  const workDaysPayment = workingDaysInMonth * perHour * 8;

  const overtimes = perHour*(values.dailyOvertime*taxes.dailyOvertime + 
    values.weekendHolidayOvertime*taxes.weekendHolidayOvertime + 
    values.nightOvertime*taxes.nightOvertime + 
    values.nightHours*taxes.nightHours +
    values.turnOfDayHours*taxes.turnOfDayHours
  ) / 100;

  const fullSalaryBrutto = workDaysPayment + l4Payment + leavePayment +
    values.attendanceBonus + 
    values.discretionaryBonus + 
    values.otherBonus +
    overtimes;

  const zusTaxes = Math.round(fullSalaryBrutto*taxes.zusPensionInsurance +
    fullSalaryBrutto*taxes.zusDisability +
    fullSalaryBrutto*taxes.zusSicknessInsurance)/100

  const healthInsurance = Math.round((fullSalaryBrutto-zusTaxes)*9) / 100;
  let pitTax = (fullSalaryBrutto-zusTaxes-taxes.taxDeductibaleExpenses) * (values.taxRegime/100);
  pitTax = values.pit2 ? Math.round(pitTax - taxes.PIT2_relief) : Math.round(pitTax*100) / 100;

  const netto = fullSalaryBrutto - zusTaxes - healthInsurance - pitTax;

  const deductionAfterTax = netto - values.deductionAfterTax + values.additionAfterTax;

  const format = (v: number) =>
  new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

  console.group("💰 Salary Calculation - FULL BREAKDOWN");

  console.group("📅 Month & Days");
  console.table({
    year: values.year,
    month: values.month,
    workingDaysInMonth,
    l4DaysCount,
    //l4WorkingDays,
    leaveDaysCount,
    actualWorkedDays: workingDaysInMonth
      //workingDaysInMonth - l4WorkingDays - leaveDaysCount,
  });
  console.groupEnd();

  console.group("⏱ Hour & Base Rates");
  console.table({
    monthlyRate: format(values.rate),
    leaveBase: format(values.leaveBase),
    workingHoursInMonth: values.workingHours,
    perHour: format(perHour),
    perWorkDay: format(perHour * 8),
  });
  console.groupEnd();

  console.group("💵 Earnings");
  console.table({
    workDaysPayment: format(workDaysPayment),
    l4Payment: format(l4Payment),
    leavePayment: format(leavePayment),
    attendanceBonus: format(values.attendanceBonus),
    discretionaryBonus: format(values.discretionaryBonus),
    otherBonus: format(values.otherBonus),
    overtimes: format(overtimes),
    fullSalaryBrutto: format(fullSalaryBrutto),
  });
  console.groupEnd();

  console.group("🏛 Taxes");
  console.table({
    zusTaxes: format(zusTaxes),
    healthInsurance: format(healthInsurance),
    pitTax: format(pitTax),
  });
  console.groupEnd();

  console.group("🧾 Final Result");
  console.table({
    netto: format(netto),
    deductionAfterTaxInput: format(values.deductionAfterTax),
    finalPayout: format(deductionAfterTax),
  });
  console.groupEnd();

  console.groupEnd();
  return {
    zusTaxes: zusTaxes,
    healthInsurance: healthInsurance,
    pitTax: pitTax,
    netto: netto,
    result: deductionAfterTax
  }
}

const SalarySchema = Yup.object().shape({
  taxRegime: Yup.mixed<0 | 12>().oneOf([0, 12]).required(),
  pit2: Yup.boolean(),
  deductionAfterTax: Yup.number().min(0, 'Must be >= 0'),

  year: Yup.number().required().min(2000),
  month: Yup.number().required().min(1).max(12),
  workingHours: Yup.number().min(0, 'Must be >= 0'),

  workRateType: Yup.mixed<'monthly' | 'hourly' | 'contractOfMandate'>().required(),
  rate: Yup.number().min(0, 'Must be >= 0'),
  attandanceBonus: Yup.number().min(0, 'Must be >= 0'),
  discretionaryBonus: Yup.number().min(0, 'Must be >= 0'),
  otherBonus: Yup.number().min(0, 'Must be >= 0'),

  overtimeLimit: Yup.number().min(0, 'Must be >= 0'),

  dailyOvertime: Yup.number()
    .min(0, 'Must be >= 0')
    .max(Yup.ref('overtimeLimit'), 'Cannot exceed overtime limit'),

  weekendHolidayOvertime: Yup.number()
    .min(0, 'Must be >= 0')
    .max(Yup.ref('overtimeLimit'), 'Cannot exceed overtime limit'),

  nightOvertime: Yup.number()
    .min(0, 'Must be >= 0')
    .max(Yup.ref('overtimeLimit'), 'Cannot exceed overtime limit'),

  nightHours: Yup.number().min(0, 'Must be >= 0'),
  turnOfDayHours: Yup.number().min(0, 'Must be >= 0'),

  leaveBase: Yup.number().min(0, 'Must be >= 0'),

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


export default function SalaryCalculator() {

  const intl = useIntl();
  const [value, setValue] = useState(0);

  const [disabledTabs, setDisabledTabs] = useState<number[]>([]);

  const labels = [
    intl.formatMessage({ id: 'tabs-taxes-and-deductions' }),
    intl.formatMessage({ id: 'tabs-calendar-and-working-time' }),
    intl.formatMessage({ id: 'tabs-rate-and-bonuses' }),
    intl.formatMessage({ id: 'tabs-overtime-and-night-hours' }),
    intl.formatMessage({ id: 'tabs-sick-leave' }),
    intl.formatMessage({ id: 'tabs-vacation' })
  ];

  const changeTab = (value: number) => {
    setValue(value);
  }

  return (
    <Formik
      initialValues={initialSalaryFormValues}
      validationSchema={SalarySchema}
      onSubmit={(values) => {
        console.log(calculateTaxes(values));
      }}
    >
      {({ values, handleChange, setFieldValue, errors, touched }) => (
        <Form>
          <CardTabs value={value} labels={labels} onChange={changeTab} disabledTabs={disabledTabs}/>

          <Box sx={{ mt: 3 }}>
            {/* TAB 0: Podatki i potrącenia */}
            {value === 0 && (
              <FormWithInfo 
                title={intl.formatMessage({id: 'tabs-taxes-and-deductions' })}
                infoText={intl.formatMessage({id: "taxes-and-deductions-info"})}
              >
                <Stack spacing={2}>
                  {(values.workRateType === 'hourly' || values.workRateType === 'monthly') && (
                    <>
                      <Stack spacing={1}>
                        <InputLabel>
                          <FormattedMessage id={"taxes-and-deductions-tax-regime"}/>
                        </InputLabel>
                        <Field name="taxRegime">
                          {({ field }: FieldProps<number>) => (
                            <FormControl fullWidth error={Boolean(touched.taxRegime && errors.taxRegime)}>
                              <Select
                                {...field}
                                sx={{ backgroundColor: 'white' }}
                                value={values.taxRegime}
                                onChange={(e) => {
                                  const newTaxRegime = Number(e.target.value);

                                  setFieldValue("taxRegime", newTaxRegime);

                                  if (newTaxRegime === 0) {
                                    setFieldValue("pit2", false);
                                  }
                                }}
                              >
                                <MenuItem value={12}>PIT 12%</MenuItem>          
                                <MenuItem value={0}>
                                  PIT 0% 
                                  (<FormattedMessage id={"taxes-and-deductions-young-relief"}/>)
                                </MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </Field>
                        {touched.taxRegime && errors.taxRegime && (
                          <FormHelperText error>{errors.taxRegime}</FormHelperText>
                        )}
                      </Stack>
                    </>
                  )}

                  {(values.workRateType === 'contractOfMandate') && (           
                    <Stack spacing={1}>
                      <InputLabel>
                        <FormattedMessage id={"taxes-and-deductions-kup"}/>
                      </InputLabel>
                      <Field name="kup">
                        {({ field }: FieldProps<number>) => (
                          <FormControl fullWidth error={Boolean(touched.kup && errors.kup)}>
                            <Select
                              {...field}
                              sx={{ backgroundColor: 'white' }}
                              value={values.kup}
                              onChange={(e) => {
                                const kup = Number(e.target.value);

                                setFieldValue("kup", kup);
                              }}
                            >
                              <MenuItem value={20}>20%</MenuItem>          
                              <MenuItem value={50}>
                                50%
                              </MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </Field>
                    </Stack>
                  )}

                  <FormControlLabel
                    control={
                      <Checkbox
                        disabled={values.taxRegime === 0}
                        name="pit2"
                        checked={values.pit2}
                        onChange={handleChange}
                      />
                    }
                    label="PIT-2"
                  />

                  {(values.workRateType === 'contractOfMandate') && (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={values.taxRegime === 0}
                            name="isStudent"
                            checked={values.isStudent}
                            onChange={handleChange}
                          />
                        }
                        label={intl.formatMessage({id: 'taxes-and-deductions-student-status'})}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={values.taxRegime === 0}
                            name="isUnder26"
                            checked={values.isUnder26}
                            onChange={handleChange}
                          />
                        }
                        label={intl.formatMessage({id: 'taxes-and-deductions-age-status'})}
                      />
                    </>
                  )}

                  <Stack spacing={1}>
                    <InputLabel>
                      <FormattedMessage id={"taxes-and-deductions-deduction-after-tax"}/>
                    </InputLabel>
                    <Field name="deductionAfterTax">
                      {({ field }: FieldProps<number>) => (
                        <TextField
                          {...field}
                          type="number"
                          error={Boolean(touched.deductionAfterTax && errors.deductionAfterTax)}
                        />
                      )}
                    </Field>
                    {touched.deductionAfterTax && errors.deductionAfterTax && (
                      <FormHelperText error>{errors.deductionAfterTax}</FormHelperText>
                    )}
                  </Stack>
                  <Stack spacing={1}>
                    <InputLabel>
                      <FormattedMessage id={"taxes-and-deductions-addition-after-tax"}/>
                    </InputLabel>
                    <Field name="additionAfterTax">
                      {({ field }: FieldProps<number>) => (
                        <TextField
                          {...field}
                          type="number"
                          error={Boolean(touched.additionAfterTax && errors.additionAfterTax)}
                        />
                      )}
                    </Field>
                    {touched.additionAfterTax && errors.additionAfterTax && (
                      <FormHelperText error>{errors.additionAfterTax}</FormHelperText>
                    )}
                  </Stack>
                </Stack>
              </FormWithInfo>
            )}

            {/* TAB 1: Kalendarz i norma czasu */}
            {value === 1 && (
              <FormWithInfo
                title={intl.formatMessage({id: 'tabs-calendar-and-working-time' })}
                infoText={intl.formatMessage({id: "calendar-and-working-time-info"})}
              >
                <Stack spacing={2} width={'320px'}>
                  <Stack spacing={1}>
                    <InputLabel>
                      <FormattedMessage id={"year"}/>
                    </InputLabel>
                    <Field name="year">
                      {({ field, form }: FieldProps<number>) => (
                        <TextField
                          {...field}
                          type="number"
                          value={field.value} // make sure value is controlled
                          onChange={(e) => {
                            const newYear = Number(e.target.value);
                            form.setFieldValue("year", newYear);

                            // Update workingHours
                            const month = form.values.month; // get current month from Formik
                            const holidays = form.values.holidays;
                            const newWorkingHours = getWorkedDaysInMonth(newYear, month-1, holidays, [], []) * 8;
                            console.log(holidays, newYear, month, newWorkingHours)
                            form.setFieldValue("workingHours", newWorkingHours);
                          }}
                          error={Boolean(form.touched.year && form.errors.year)}
                        />
                      )}
                    </Field>
                    {touched.year && errors.year && (
                      <FormHelperText error>{errors.year as string}</FormHelperText>
                    )}
                  </Stack>

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
                    <InputLabel>
                      <FormattedMessage id={"calendar-and-working-time-working-hours"}/>
                    </InputLabel>
                    <Field name="workingHours">
                      {({ field }: FieldProps<number>) => (
                        <TextField
                          {...field}
                          type="number"
                          error={Boolean(touched.workingHours && errors.workingHours)}
                        />
                      )}
                    </Field>
                    {touched.workingHours && errors.workingHours && (
                      <FormHelperText error>{errors.workingHours as string}</FormHelperText>
                    )}
                    {(values.workRateType === 'hourly' || values.workRateType === 'monthly') && (
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

            {/* TAB 2: Stawka i premie */}
            {value === 2 && (
              <FormWithInfo
                title={intl.formatMessage({id: 'tabs-rate-and-bonuses' })}
                infoText={intl.formatMessage({id: "rate-and-bonuses-info"})}
              >
                <Stack spacing={2}>
                  <Stack spacing={1}>
                    <InputLabel>
                      <FormattedMessage id={"rate-and-bonuses-work-rate-type"}/>
                    </InputLabel>
                    <Field name="workRateType">
                      {({ field }: FieldProps<string>) => (
                        <FormControl fullWidth error={Boolean(touched.workRateType && errors.workRateType)}>
                          <Select
                            {...field}
                            value={values.workRateType}
                            onChange={(e) => {
                              if (e.target.value === 'contractOfMandate' ) {
                                setDisabledTabs([3, 4, 5])
                              } else {
                                setDisabledTabs([])
                              }
                              setFieldValue('workRateType', e.target.value)}
                            }
                          >
                            <MenuItem value="monthly">
                              <FormattedMessage id={"rate-monthly"}/>
                            </MenuItem>
                            <MenuItem value="hourly">
                              <FormattedMessage id={"rate-hourly"}/>
                            </MenuItem>
                            <MenuItem value="contractOfMandate">
                              <FormattedMessage id={"rate-contract-of-mandate"}/>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Field>
                    {touched.workRateType && errors.workRateType && (
                      <FormHelperText error>{errors.workRateType}</FormHelperText>
                    )}
                  </Stack>

                  {(['rate', 'attendanceBonus', 'discretionaryBonus', 'otherBonus'] as const).map((name) => (
                    <Stack spacing={1} key={name}>
                      <InputLabel>
                        <FormattedMessage id={`rate-and-bonuses-${camelToKebabCase(name)}`}/>
                        {
                          (name === 'rate' && values.workRateType === 'monthly') ? ` (${Math.round(values.rate / values.workingHours * 100) / 100} zł/h)` : ""
                        }
                        {
                          (name === 'rate' && (values.workRateType === 'hourly' || values.workRateType === 'contractOfMandate' )) ? ` (${Math.round(values.rate * values.workingHours * 100) / 100} zł)` : ""
                        }
                      </InputLabel>
                      <Field name={name}>
                        {({ field }: FieldProps<number>) => (
                          <TextField
                            {...field}
                            type="number"
                            error={Boolean(touched[name] && errors[name])}
                          />
                        )}
                      </Field>
                      {touched[name] && errors[name] && (
                        <FormHelperText error>{errors[name] as string}</FormHelperText>
                      )}
                    </Stack>
                  ))}
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
                    <Stack spacing={1} key={name}>
                      <InputLabel>
                        <FormattedMessage id={`overtime-and-night-hours-${camelToKebabCase(name)}`}/>
                      </InputLabel>
                      <Field name={name}>
                        {({ field }: FieldProps<number>) => (
                          <TextField
                            {...field}
                            type="number"
                            error={Boolean(touched[name] && errors[name])}
                          />
                        )}
                      </Field>
                      {touched[name] && errors[name] && (
                        <FormHelperText error>{errors[name] as string}</FormHelperText>
                      )}
                    </Stack>
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
                  <Stack spacing={1} width={'320px'}>
                    <InputLabel>
                      <FormattedMessage id={"l4-base"}/>
                    </InputLabel>
                    <Field name="l4Base">
                      {({ field }: FieldProps<number>) => (
                        <TextField
                          {...field}
                          type="number"
                          error={Boolean(touched.l4Base && errors.l4Base)}
                        />
                      )}
                    </Field>
                    {touched.l4Base && errors.l4Base && (
                      <FormHelperText error>{errors.l4Base}</FormHelperText>
                    )}
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
                    <InputLabel>
                      <FormattedMessage id={"vacation-leave-base"}/>
                    </InputLabel>
                    <Field name="leaveBase">
                      {({ field }: FieldProps<number>) => (
                        <TextField
                          {...field}
                          type="number"
                          error={Boolean(touched.leaveBase && errors.leaveBase)}
                        />
                      )}
                    </Field>
                    {touched.leaveBase && errors.leaveBase && (
                      <FormHelperText error>{errors.leaveBase}</FormHelperText>
                    )}
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

          <Box sx={{ mt: 4 }}>
            <Button type="submit" variant="contained">
              <FormattedMessage id={"calculate"}/>
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  );
}