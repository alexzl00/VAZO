import { useState, useEffect, useMemo } from 'react';

// mui
import {
  Box,
  FormControlLabel,
  Checkbox,
  Button,
  Stack
} from '@mui/material';

import FormHelperText from '@mui/material/FormHelperText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// third party
import { FormattedMessage, useIntl } from 'react-intl';
import { 
  Formik,
  Form,
  useFormikContext
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
  pit2: Yup.boolean().required(),
  deductionAfterTax: positiveNumber(),
  additionAfterTax: positiveNumber(),
  kup: Yup.mixed<20 | 50>().oneOf([20, 50]).required(),
  isStudent: Yup.boolean().required(),
  isUnder26: Yup.boolean().required(),

  year: Yup.number().required().min(2000),
  month: Yup.number().required().min(1).max(12),
  workingHours: positiveNumber().min(1),

  workRateType: Yup.mixed<'uop_monthly' | 'uop_hourly' | 'mandate_hourly'>().required(),
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

  const Pit2AutoReset = () => {
    const { values, setFieldValue } = useFormikContext<SalaryCalculatorValues>();

    const isDisabled =
      values.taxRegime === 0 &&
      (values.workRateType === "uop_hourly" ||
        values.workRateType === "uop_monthly");

    useEffect(() => {
      if (isDisabled && values.pit2) {
        setFieldValue("pit2", false);
      }
    }, [isDisabled, values.pit2, setFieldValue]);

    return null;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={SalarySchema}
        onSubmit={ async (values) => {
          await onSubmit(values);
        }}
      >
        {({ values, handleChange, setFieldValue, errors, touched, dirty, resetForm, submitForm }) => {

          const calculations = useMemo(() => {
            if (values.workRateType === 'mandate_hourly') {
              return calculateTaxesContractOfMandate(values);
            } else if (values.workRateType === 'uop_hourly' || values.workRateType === 'uop_monthly') {
              return calculateTaxesUoP(values);
            } else {
              return calculateTaxesUoD(values);
            }
          }, [values])

          return (
            <>    
              <Form>
                <Pit2AutoReset/>
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
                    alignItems={'center'}
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

                            {(values.workRateType === 'mandate_hourly' || values.workRateType === 'uod_fixed') && (      
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
                                  disabled={values.taxRegime === 0 && (values.workRateType === 'uop_hourly' || values.workRateType === 'uop_monthly')}
                                  name="pit2"
                                  checked={values.pit2}
                                  onChange={handleChange}
                                />
                              }
                              label="PIT-2"
                            />

                            {(values.workRateType === 'mandate_hourly') && (
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
                      <TaxChart calculation={calculations}/>
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