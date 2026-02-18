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

// project imports
import CardTabs from '../components/CardTabs';
import MonthPicker from '../components/MonthPikcer';
import FormWithInfo from '../components/FormWithInfo';


// utils 
import camelToKebabCase from '../utils/camelToKebab';

type DateRange = {
  start: string; // ISO date "YYYY-MM-DD"
  end: string;
};

type SalaryCalculatorValues = {
  
  // podatki i potracenia
  taxRegime: 0 | 12;
  pit2: boolean;
  deductionAfterTax: number;

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

  // Nadgodziny i godziny nocne
  dailyOvertime: number;
  weekendHolidayOvertime: number;
  nightOvertime: number;

  nightHours: number;
  turnOfDayHours: number;

  overtimeLimit: number;

  // Zwolnienie lekarskie (L4)
  l4: DateRange[];

  // Urlop
  leave: DateRange[];

  leaveBase: number;

  // virtual property for error
  totalOvertime?: string;
};

const now = new Date();

export const initialSalaryFormValues: SalaryCalculatorValues = {
  // podatki i potracenia
  taxRegime: 12,
  pit2: false,
  deductionAfterTax: 0,

  // Kalendarz i norma czasu pracy
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  workingHours: getWorkingDaysInMonth(now.getFullYear(), now.getMonth())*8,

  // Stawka i premie
  workRateType: 'monthly',
  rate: 0,
  attendanceBonus: 0,
  discretionaryBonus: 0,
  otherBonus: 0,

  // Nadgodziny i godziny nocne
  dailyOvertime: 0,
  weekendHolidayOvertime: 0,
  nightOvertime: 0,

  nightHours: 0,
  turnOfDayHours: 0,

  overtimeLimit: 30,

  // Zwolnienie lekarskie (L4)
  l4: [],

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

  nightHours: 120, // +20%

  turnOfDayHours: 50, // it will be counted separately as extra +50%
}

const getMonthBounds = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day of month
  return { start, end };
};

const isInMonth = (dateStr: string, year: number, month: number) => {
  const d = new Date(dateStr);
  const { start, end } = getMonthBounds(year, month);
  return d >= start && d <= end;
};

function getWorkingDaysInMonth(year: number, month: number): number {
  const date = new Date(year, month, 1);
  let workingDays = 0;

  while (date.getMonth() === month) {
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) workingDays++; // count Mon–Fri
    date.setDate(date.getDate() + 1);
  }

  return workingDays;
}

const calculateTaxes = (values: SalaryCalculatorValues) => {
  const perHour = values.rate / values.workingHours

  const overtimes = perHour*(values.dailyOvertime*taxes.dailyOvertime + 
    values.weekendHolidayOvertime*taxes.weekendHolidayOvertime + 
    values.nightOvertime*taxes.nightOvertime + 
    values.nightHours*taxes.nightHours +
    values.turnOfDayHours*taxes.turnOfDayHours
  ) / 100;

  const fullSalaryBrutto = values.rate + 
    values.attendanceBonus + 
    values.discretionaryBonus + 
    values.otherBonus +
    overtimes;

  const zusTaxes = Math.round(fullSalaryBrutto*taxes.zusPensionInsurance +
    fullSalaryBrutto*taxes.zusDisability +
    fullSalaryBrutto*taxes.zusSicknessInsurance)/100

  const sicknessTax = Math.round((fullSalaryBrutto-zusTaxes)*9) / 100;
  let pitTax = (fullSalaryBrutto-zusTaxes-taxes.taxDeductibaleExpenses) * (values.taxRegime/100);
  pitTax = values.pit2 ? Math.round(pitTax - taxes.PIT2_relief) : Math.round(pitTax*100) / 100;

  const netto = fullSalaryBrutto - zusTaxes - sicknessTax - pitTax;

  const deductionAfterTax = netto - values.deductionAfterTax;

  return {
    zusTaxes: zusTaxes,
    sicknessTax: sicknessTax,
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
          <CardTabs value={value} labels={labels} onChange={changeTab} />

          <Box sx={{ mt: 3 }}>
            {/* TAB 0: Podatki i potrącenia */}
            {value === 0 && (
              <FormWithInfo 
                title={intl.formatMessage({id: 'tabs-taxes-and-deductions' })}
                infoText={intl.formatMessage({id: "taxes-and-deductions-info"})}
              >
                <Stack spacing={2}>
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
                            onChange={(e) => setFieldValue('taxRegime', Number(e.target.value))}
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

                  <FormControlLabel
                    control={
                      <Checkbox
                        name="pit2"
                        checked={values.pit2}
                        onChange={handleChange}
                      />
                    }
                    label="PIT-2"
                  />

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
                </Stack>
              </FormWithInfo>
            )}

            {/* TAB 1: Kalendarz i norma czasu */}
            {value === 1 && (
              <FormWithInfo
                title={intl.formatMessage({id: 'tabs-calendar-and-working-time' })}
                infoText={intl.formatMessage({id: "calendar-and-working-time-info"})}
              >
                <Stack spacing={2}>
                  <Stack spacing={1}>
                    <InputLabel>
                      <FormattedMessage id={"year"}/>
                    </InputLabel>
                    <Field name="year">
                      {({ field }: FieldProps<number>) => (
                        <TextField
                          {...field}
                          type="number"
                          error={Boolean(touched.year && errors.year)}
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
                      setFieldValue("workingHours", getWorkingDaysInMonth(now.getFullYear(), val-1)*8)
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
                            onChange={(e) => setFieldValue('workRateType', e.target.value)}
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
                <Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Tu dodasz zakresy L4
                  </Typography>
                  {errors.l4 && <FormHelperText error>{errors.l4 as string}</FormHelperText>}
                </Box>
              </FormWithInfo>
            )}

            {/* TAB 5: Urlop */}
            {value === 5 && (
              <FormWithInfo
                title={intl.formatMessage({id: 'tabs-vacation' })}
                infoText={intl.formatMessage({id: "vacation-leave-info"})}
              >
                <Stack spacing={2}>
                  <Stack spacing={1}>
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

                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Tu dodasz zakresy urlopu
                  </Typography>
                  {errors.leave && <FormHelperText error>{errors.leave as string}</FormHelperText>}
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