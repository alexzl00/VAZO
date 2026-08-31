import { useEffect, useState } from 'react';

// mui
import {
  Box,
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
import { FormikNumberField } from '../../components/FormikFields';

import TaxChart from '../../components/Calculator/TaxChart';

import EditSalaryCalculation from '../../components/Modals/EditSalaryCalculation';
import ConfirmActionDialog from '../../components/Modals/ConfirmActionDialog';
import AdvancedSalarySettingsDialog from './AdvancedSalarySettingsDialog';

// utils 
import { MultiRangeMonthPicker } from '../../components/DaysPicker';
import { isInMonth, isoToDayjsRanges, getWorkedDaysInMonth } from '../../utils/monthHelperFunc';
import { calculateTaxesUoP, calculateTaxesContractOfMandate, calculateTaxesUoD} from '../../utils/workTypeSalaryCalc';
import type { SalaryCalculationResult } from '../../utils/workTypeSalaryCalc';
import type { DateRange } from '../../components/DaysPicker';

// types
import type { SalaryCalculatorValues } from '../../types/salaryCalculator';
import type { DialogConfig } from '../../components/Modals/ConfirmActionDialog';


import DynamicSalaryFields from './DynamicSalaryFields';
import {
  metadataDrivenFieldConfigs,
  overtimeFieldConfigs,
  rateFieldConfigs,
  taxFieldConfigs,
} from './metadata/salaryFieldConfigs';
import {
  applySalaryFieldDefaults,
  buildSalaryFieldValidationShape,
} from './metadata/salaryFieldMetadata';

type BaseProps = {
  initialValues: SalaryCalculatorValues;
  onSubmit: (values: SalaryCalculatorValues) => Promise<void>;
};

type SalaryFormProps =
  | (BaseProps & { type: "create" })
  | (BaseProps & { type: "update"; deleteOverride: () => void });


const normalizeSalaryValues = (
  values: SalaryCalculatorValues,
): SalaryCalculatorValues =>
  applySalaryFieldDefaults(values, metadataDrivenFieldConfigs);


const positiveNumber = () =>
  Yup.number()
    .typeError('Must be a number')
    .required('Required')
    .test('positive', 'Must be >= 0', (value) => {
      // value can be number or NaN
      return typeof value === 'number' && !isNaN(value) && value >= 0;
    });

const SalaryTabAvailabilityGuard = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: number;
  setActiveTab: (value: number) => void;
}) => {
  const { values } = useFormikContext<SalaryCalculatorValues>();

  useEffect(() => {
    const mandateL4Enabled =
      values.workRateType === 'mandate_hourly' &&
      Boolean(values.mandateVoluntarySicknessInsurance);

    const disabledTabs =
      values.workRateType === 'uod_fixed'
        ? [3, 4, 5]
        : values.workRateType === 'mandate_hourly'
          ? (mandateL4Enabled ? [3, 5] : [3, 4, 5])
          : [];

    if (disabledTabs.includes(activeTab)) {
      setActiveTab(1);
    }
  }, [
    activeTab,
    setActiveTab,
    values.workRateType,
    values.mandateVoluntarySicknessInsurance,
  ]);

  return null;
};

const SalarySchema = Yup.object().shape({
  // Legacy fields remain because older saved records still contain them.
  // They are not rendered directly by metadata.
  taxRegime: Yup.mixed<0 | 12>().oneOf([0, 12]).required(),
  pit2: Yup.boolean().required(),

  // All simple input validation is generated from the same metadata
  // that renders those fields.
  ...buildSalaryFieldValidationShape(metadataDrivenFieldConfigs),

  year: Yup.number().required().min(2000),
  month: Yup.number().required().min(1).max(12),
  workingHours: positiveNumber().min(1),

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
  // The metadata-generated validation shape is dynamic, so Yup cannot infer
  // every SalaryCalculatorValues key in this object-level test. Keep the
  // runtime schema dynamic, but restore the domain type here without using any.
  const salaryValues = values as Partial<SalaryCalculatorValues>;

  const {
    dailyOvertime = 0,
    weekendHolidayOvertime = 0,
    nightOvertime = 0,
    overtimeLimit = 0,
  } = salaryValues;

  if (
    dailyOvertime +
    weekendHolidayOvertime +
    nightOvertime >
    overtimeLimit
  ) {
    return this.createError({
      path: 'totalOvertime',
      message: 'Total overtime cannot exceed overtime limit',
    });
  }

  return true;
});

export default function SalaryForm({ initialValues, onSubmit, type, ...rest }: SalaryFormProps) {
  const intl = useIntl();
  const normalizedInitialValues = normalizeSalaryValues(initialValues);
  const [value, setValue] = useState(0);

  const [editCalculationOpen, setEditCalculationOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  const [dialogType, setDialogType] = useState<"reset" | "save" | null>(null);

  const theme = useTheme();
  const isMidScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const isInitiallyOverride = initialValues.isOverride ?? false;
  const deleteOverride = 'deleteOverride' in rest ? rest.deleteOverride : undefined;

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
        {({ values, setFieldValue, errors, touched, dirty, resetForm, submitForm }) => {

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

          const mandateL4Enabled =
            values.workRateType === 'mandate_hourly' &&
            Boolean(values.mandateVoluntarySicknessInsurance);

          const disabledTabs =
            values.workRateType === 'uod_fixed'
              ? [3, 4, 5]
              : values.workRateType === 'mandate_hourly'
                ? (mandateL4Enabled ? [3, 5] : [3, 4, 5])
                : [];

          return (
            <>    
              <Form>
                <SalaryTabAvailabilityGuard activeTab={value} setActiveTab={setValue} />
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
                          <DynamicSalaryFields
                            fields={rateFieldConfigs}
                            values={values}
                            formMode={type}
                            setFieldValue={setFieldValue}
                          />
                        </FormWithInfo>
                      )}

                      {/* TAB 1: Podatki i potrącenia */}
                      {value === 1 && (
                        <FormWithInfo 
                          title={intl.formatMessage({id: 'tabs-taxes-and-deductions' })}
                          infoText={intl.formatMessage({id: "taxes-and-deductions-info"})}
                        >
                          <Stack spacing={2}>
                            <DynamicSalaryFields
                              fields={taxFieldConfigs}
                              values={values}
                              formMode={type}
                              setFieldValue={setFieldValue}
                            />

                            <Button
                              variant="outlined"
                              onClick={() => setAdvancedSettingsOpen(true)}
                            >
                              <FormattedMessage id="advanced-settings-open" />
                            </Button>
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
                            {(['dailyOvertime', 'weekendHolidayOvertime', 'nightOvertime'] as const).some(
                              (name) => touched[name]
                            ) && errors.totalOvertime && (
                              <FormHelperText error>{errors.totalOvertime}</FormHelperText>
                            )}

                            <DynamicSalaryFields
                              fields={overtimeFieldConfigs}
                              values={values}
                              formMode={type}
                              setFieldValue={setFieldValue}
                            />
                          </Stack>
                        </FormWithInfo>
                      )}

                      {/* TAB 4: L4 */}
                      {value === 4 && (
                        <FormWithInfo
                          title={intl.formatMessage({id: 'tabs-sick-leave' })}
                          infoText={intl.formatMessage({
                            id: values.workRateType === 'mandate_hourly'
                              ? 'sick-leave-info-mandate'
                              : 'sick-leave-info'
                          })}
                        >
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

                <AdvancedSalarySettingsDialog
                  open={advancedSettingsOpen}
                  onClose={() => setAdvancedSettingsOpen(false)}
                  values={values}
                  formMode={type}
                  setFieldValue={setFieldValue}
                />

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