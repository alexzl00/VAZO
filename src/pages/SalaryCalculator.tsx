import { useState, useEffect } from 'react';

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
  useFormikContext
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
import { FormikNumberField, FomrikSelectField } from '../components/FormikFields';

// utils 
import camelToKebabCase from '../utils/camelToKebab';
import { MultiRangeMonthPicker } from '../components/DaysPicker';
import { isInMonth, isoToDayjsRanges, getWorkedDaysInMonth } from '../utils/monthHelperFunc';

import { calculateTaxesContractOfMandate, calculateTaxesUoP } from '../utils/workTypeSalaryCalc';

import type { DateRange } from '../components/DaysPicker';
import type { ISODateRange } from '../utils/monthHelperFunc';

export type SalaryCalculatorValues = {
  
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


const calculateTaxes = (values: SalaryCalculatorValues) => {
  switch (values.workRateType) {
    case 'contractOfMandate':
      return calculateTaxesContractOfMandate(values);
    case 'hourly':
    case 'monthly':
      return calculateTaxesUoP(values);
  }
}
const positiveNumber = () =>
  Yup.number()
    .typeError('Must be a number')
    .required('Required')
    .test('positive', 'Must be >= 0', (value) => {
      // value can be number or NaN
      return typeof value === 'number' && !isNaN(value) && value >= 0;
    });

const SalarySchema = Yup.object().shape({
  taxRegime: Yup.mixed<0 | 12>().oneOf([0, 12]).required(),
  pit2: Yup.boolean(),
  deductionAfterTax: positiveNumber(),
  additionAfterTax: positiveNumber(),

  year: Yup.number().required().min(2000),
  month: Yup.number().required().min(1).max(12),
  workingHours: positiveNumber().min(1),

  workRateType: Yup.mixed<'monthly' | 'hourly' | 'contractOfMandate'>().required(),
  rate: positiveNumber(),
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

  const Pit2AutoReset = () => {
    const { values, setFieldValue } = useFormikContext<SalaryCalculatorValues>();

    const isDisabled =
      values.taxRegime === 0 &&
      (values.workRateType === "hourly" ||
        values.workRateType === "monthly");

    useEffect(() => {
      if (isDisabled && values.pit2) {
        setFieldValue("pit2", false);
      }
    }, [isDisabled, values.pit2, setFieldValue]);

    return null;
  };

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
          <Pit2AutoReset/>
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
                    <FomrikSelectField 
                      name="taxRegime"
                      inputLabel="taxes-and-deductions-tax-regime"
                      menuItems={[
                        {value: 12, text: 'PIT 12%'}, { value: 0, text: (<> PIT 0% (<FormattedMessage id="taxes-and-deductions-young-relief" />)</>)}
                      ]}
                      onChange={(e) => {
                        const newTaxRegime = Number(e.target.value);
                        setFieldValue("taxRegime", newTaxRegime);
                      }}
                    />
                  )}

                  {(values.workRateType === 'contractOfMandate') && (      
                    <FomrikSelectField 
                      name="kup"
                      inputLabel="taxes-and-deductions-kup"
                      menuItems={[
                        {value: 20, text: '20%'}, { value: 50, text: "50%"}
                      ]}
                      onChange={(e) => {
                        const kup = Number(e.target.value);
                        setFieldValue("kup", kup);
                      }}
                    />
                  )}

                  <FormControlLabel
                    control={
                      <Checkbox
                        disabled={values.taxRegime === 0 && (values.workRateType === 'hourly' || values.workRateType === 'monthly')}
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
                            name="isUnder26"
                            checked={values.isUnder26}
                            onChange={handleChange}
                          />
                        }
                        label={intl.formatMessage({id: 'taxes-and-deductions-age-status'})}
                      />
                    </>
                  )}

                  <FormikNumberField name="deductionAfterTax" labelId="taxes-and-deductions-deduction-after-tax" unit='zł'/>
                  <FormikNumberField name="additionAfterTax" labelId="taxes-and-deductions-addition-after-tax" unit='zł'/>
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
                    <FormikNumberField name="workingHours" labelId="calendar-and-working-time-working-hours"/>

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
                  <FomrikSelectField
                    name="workRateType"
                    inputLabel="rate-and-bonuses-work-rate-type"
                    menuItems={[
                      { value: "monthly", text: <FormattedMessage id="rate-monthly" /> },
                      { value: "hourly", text: <FormattedMessage id="rate-hourly" /> },
                      { value: "contractOfMandate", text: <FormattedMessage id="rate-contract-of-mandate" /> },
                    ]}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFieldValue("workRateType", value);                  
                      if (value === "contractOfMandate") {
                        setDisabledTabs([3, 4, 5]);
                      } else {
                        setDisabledTabs([]);
                      }
                    }}
                  />

                  {(['rate', 'attendanceBonus', 'discretionaryBonus', 'otherBonus'] as const).map((name) => (
                    <FormikNumberField
                      key={name}
                      name={name}
                      labelId={`rate-and-bonuses-${camelToKebabCase(name)}`}
                      unit={
                        name === 'rate' && !errors.workingHours
                          ? values.workRateType === 'monthly'
                            ? `${Math.round(values.rate / values.workingHours * 100) / 100} zł/h`
                            : (values.workRateType === 'hourly' || values.workRateType === 'contractOfMandate')
                              ? `${Math.round(values.rate * values.workingHours * 100) / 100} zł`
                              : ''
                          : undefined
                      }
                    />
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