import { useCallback, useEffect, useMemo, useState } from 'react';

// mui
import {
  Box,
  Button,
  Stack,
  Alert,
  CircularProgress,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';

import FormHelperText from '@mui/material/FormHelperText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// third party
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
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
import AuthRequiredDialog from '../../components/Modals/AuthRequiredDialog';
import AdvancedSalarySettingsDialog from './AdvancedSalarySettingsDialog';
import SalaryBonusesEditor from './SalaryBonusesEditor';

// auth
import { useAuth } from '../../auth/AuthContext';

// api
import { getWorkRelationsForMonth } from '../../api/work_relations';

// utils
import { MultiRangeMonthPicker } from '../../components/DaysPicker';
import { isInMonth, isoToDayjsRanges } from '../../utils/monthHelperFunc';
import { getNominalWorkingHoursInMonth } from '../../utils/workingTimeHelper';
import { calculateTaxesUoP, calculateTaxesContractOfMandate, calculateTaxesUoD, SalaryCalculationError } from '../../utils/workTypeSalaryCalc';
import type { SalaryCalculationResult } from '../../utils/workTypeSalaryCalc';
import type { DateRange } from '../../components/DaysPicker';

// types
import { normalizeL4Ranges } from '../../types/salaryCalculator';
import type { L4PaymentType, SalaryCalculatorValues, WorkRate } from '../../types/salaryCalculator';
import type { WorkRelation } from '../../types/workRelation';
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

const getWorkRateTypeFromRelation = (
  relation: WorkRelation,
): WorkRate | null => {
  if (relation.contract_type === 'uop') {
    if (relation.payment_mode === 'monthly') return 'uop_monthly';
    if (relation.payment_mode === 'hourly') return 'uop_hourly';
    return null;
  }

  if (relation.contract_type === 'mandate') {
    return relation.payment_mode === 'hourly'
      ? 'mandate_hourly'
      : null;
  }

  if (relation.contract_type === 'uod') {
    return relation.payment_mode === 'fixed'
      ? 'uod_fixed'
      : null;
  }

  return null;
};

const getEffectiveEmploymentPeriod = (
  relation: WorkRelation,
  year: number,
  month: number,
) => {
  const monthStart = dayjs(
    `${year}-${String(month).padStart(2, '0')}-01`,
  );
  const monthEnd = monthStart.endOf('month');

  const relationStart = dayjs(relation.start_date);
  const relationEnd = relation.end_date
    ? dayjs(relation.end_date)
    : null;

  const effectiveStart = relationStart.isAfter(monthStart, 'day')
    ? relationStart
    : monthStart;

  const effectiveEnd = relationEnd && relationEnd.isBefore(monthEnd, 'day')
    ? relationEnd
    : monthEnd;

  return {
    start: effectiveStart.format('YYYY-MM-DD'),
    end: effectiveEnd.format('YYYY-MM-DD'),
    isPartialMonth:
      !effectiveStart.isSame(monthStart, 'day') ||
      !effectiveEnd.isSame(monthEnd, 'day'),
  };
};

type WorkRelationSelectorProps = {
  formMode: 'create' | 'update';
};

const WorkRelationSelector = ({ formMode }: WorkRelationSelectorProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { values, setFieldValue } = useFormikContext<SalaryCalculatorValues>();

  const [relations, setRelations] = useState<WorkRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const clearRelationContext = useCallback(() => {
    setFieldValue('workRelationId', null, false);
    setFieldValue('employmentStartDate', null, false);
    setFieldValue('employmentEndDate', null, false);
  }, [setFieldValue]);

  const applyRelation = useCallback((relation: WorkRelation) => {
    const workRateType = getWorkRateTypeFromRelation(relation);

    if (!workRateType) {
      setLoadError(true);
      clearRelationContext();
      return;
    }

    const period = getEffectiveEmploymentPeriod(
      relation,
      values.year,
      values.month,
    );

    setFieldValue('workRelationId', relation.id, false);
    setFieldValue('employmentStartDate', period.start, false);
    setFieldValue('employmentEndDate', period.end, false);
    if (workRateType !== values.workRateType) {
      setFieldValue(
        'sicknessBenefitEligible',
        workRateType === 'uop_monthly' || workRateType === 'uop_hourly',
        false,
      );
    }

    setFieldValue('workRateType', workRateType, false);
  }, [
    clearRelationContext,
    setFieldValue,
    values.month,
    values.workRateType,
    values.year,
  ]);

  useEffect(() => {
    if (formMode !== 'create' || authLoading) return;

    if (!user) {
      setRelations([]);
      setLoadError(false);
      clearRelationContext();
      return;
    }

    let active = true;

    const loadRelations = async () => {
      try {
        setLoading(true);
        setLoadError(false);

        const data = await getWorkRelationsForMonth(
          values.year,
          values.month,
        );

        if (!active) return;

        setRelations(data);

        if (data.length === 0) {
          clearRelationContext();
          return;
        }

        const currentRelation = data.find(
          relation => relation.id === values.workRelationId,
        );

        if (currentRelation) {
          applyRelation(currentRelation);
          return;
        }

        if (data.length === 1) {
          applyRelation(data[0]);
          return;
        }

        clearRelationContext();
      } catch (error) {
        console.error(error);

        if (!active) return;

        setRelations([]);
        setLoadError(true);
        clearRelationContext();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRelations();

    return () => {
      active = false;
    };
  }, [
    applyRelation,
    authLoading,
    clearRelationContext,
    formMode,
    user,
    values.month,
    values.workRelationId,
    values.year,
  ]);

  if (formMode !== 'create' || authLoading || !user) {
    return null;
  }

  const selectedRelation = relations.find(
    relation => relation.id === values.workRelationId,
  );

  const selectedPeriod = selectedRelation
    ? getEffectiveEmploymentPeriod(
        selectedRelation,
        values.year,
        values.month,
      )
    : null;

  return (
    <Stack
      spacing={1.5}
      sx={{
        mb: 3,
        width: '320px',
        maxWidth: '100%',
        minWidth: 0,
        mx: 'auto',
      }}
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && loadError && (
        <Alert severity="error">
          {intl.formatMessage({
            id: 'salary-work-relation-load-failed',
            defaultMessage: 'Nie udało się pobrać stosunków pracy dla wybranego miesiąca.',
          })}
        </Alert>
      )}

      {!loading && !loadError && relations.length === 0 && (
        <Alert
          severity="warning"
          sx={{
            width: '100%',
            minWidth: 0,
            '& .MuiAlert-message': {
              width: '100%',
              minWidth: 0,
              overflowWrap: 'anywhere',
            },
          }}
        >
          <Stack spacing={1.5} sx={{ width: '100%', minWidth: 0 }}>
            <Box>
              <Typography component="div" fontWeight={600} mb={0.5}>
                <FormattedMessage
                  id="salary-work-relation-missing-title"
                  defaultMessage="Brak stosunku pracy dla wybranego miesiąca"
                />
              </Typography>
              <FormattedMessage
                id="salary-work-relation-missing-description"
                defaultMessage="Możesz korzystać z kalkulatora, ale nie zapiszesz wynagrodzenia, dopóki nie dodasz stosunku pracy obejmującego wybrany miesiąc."
              />
            </Box>

            <Button
              variant="outlined"
              color="inherit"
              size="small"
              sx={{
                alignSelf: 'flex-start',
                maxWidth: '100%',
                whiteSpace: 'normal',
              }}
              onClick={() => navigate('/create-work-relation')}
            >
              <FormattedMessage
                id="salary-work-relation-create"
                defaultMessage="Dodaj stosunek pracy"
              />
            </Button>
          </Stack>
        </Alert>
      )}

      {!loading && !loadError && relations.length > 0 && (
        <>
          <TextField
            select
            fullWidth
            size="small"
            sx={{
              minWidth: 0,
              '& .MuiSelect-select': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
            label={intl.formatMessage({
              id: 'salary-work-relation-label',
              defaultMessage: 'Stosunek pracy',
            })}
            value={values.workRelationId ?? ''}
            onChange={(event) => {
              const relation = relations.find(
                item => item.id === event.target.value,
              );

              if (relation) {
                applyRelation(relation);
              } else {
                clearRelationContext();
              }
            }}
          >
            {relations.length > 1 && (
              <MenuItem value="">
                <FormattedMessage
                  id="salary-work-relation-placeholder"
                  defaultMessage="Wybierz stosunek pracy"
                />
              </MenuItem>
            )}

            {relations.map(relation => (
              <MenuItem
                key={relation.id}
                value={relation.id}
                sx={{ maxWidth: 320, minWidth: 0 }}
              >
                <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
                  <Typography
                    fontSize={14}
                    fontWeight={600}
                    noWrap
                  >
                    {relation.name}
                  </Typography>
                  {relation.employer_name && (
                    <Typography
                      fontSize={12}
                      color="text.secondary"
                      noWrap
                    >
                      {relation.employer_name}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {relations.length > 1 && !selectedRelation && (
            <Alert severity="info">
              <FormattedMessage
                id="salary-work-relation-select-to-save"
                defaultMessage="Wybierz stosunek pracy, aby móc zapisać to wynagrodzenie. Do tego czasu możesz nadal korzystać z kalkulatora."
              />
            </Alert>
          )}

          {selectedRelation && selectedPeriod?.isPartialMonth && (
            <Alert severity="info">
              {intl.formatMessage(
                {
                  id: 'salary-work-relation-partial-month',
                  defaultMessage:
                    'Wybrany stosunek pracy nie obejmuje całego miesiąca. Kalkulator uwzględni okres od {start} do {end}.',
                },
                {
                  start: dayjs(selectedPeriod.start).format('DD.MM.YYYY'),
                  end: dayjs(selectedPeriod.end).format('DD.MM.YYYY'),
                },
              )}
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
};

const normalizeSalaryValues = (
  values: SalaryCalculatorValues,
): SalaryCalculatorValues =>
  applySalaryFieldDefaults(
    {
      ...values,
      bonuses: Array.isArray(values.bonuses)
        ? values.bonuses
        : [],
      sicknessBenefitEligible:
        values.sicknessBenefitEligible
        ?? (values.workRateType === 'uop_monthly'
          || values.workRateType === 'uop_hourly'),
      l4: normalizeL4Ranges(values.l4),
    },
    metadataDrivenFieldConfigs,
  );

const relationAwareRateFieldConfigs = rateFieldConfigs.map((config) =>
  config.name === 'workRateType'
    ? {
        ...config,
        disabledWhen: (
          values: SalaryCalculatorValues,
          context: { formMode: 'create' | 'update' },
        ) => context.formMode === 'update' || Boolean(values.workRelationId),
      }
    : config,
);

type ValidationMessageFormatter = (
  id: string,
  values?: Record<string, string | number>,
) => string;

const positiveNumber = (formatMessage: ValidationMessageFormatter) =>
  Yup.number()
    .typeError(formatMessage('validation-number-invalid'))
    .required(formatMessage('validation-required'))
    .test(
      'positive',
      formatMessage('validation-number-min-zero'),
      (value) => typeof value === 'number' && !isNaN(value) && value >= 0,
    );

const getDisabledSalaryTabs = (
  values: SalaryCalculatorValues,
): number[] => {
  if (values.workRateType === 'uod_fixed') {
    return [3, 4, 5];
  }

  if (values.workRateType === 'mandate_hourly') {
    return values.mandateVoluntarySicknessInsurance
      ? [3, 5]
      : [3, 4, 5];
  }

  return [];
};

const SalaryTabAvailabilityGuard = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: number;
  setActiveTab: (value: number) => void;
}) => {
  const { values } = useFormikContext<SalaryCalculatorValues>();

  useEffect(() => {
    const disabledTabs = getDisabledSalaryTabs(values);

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

const buildSalarySchema = (formatMessage: ValidationMessageFormatter) =>
  Yup.object().shape({
    // All simple input validation is generated from the same metadata
    // that renders those fields.
    ...buildSalaryFieldValidationShape(metadataDrivenFieldConfigs, formatMessage),

    bonuses: Yup.array()
      .of(
        Yup.object().shape({
          id: Yup.string().required(formatMessage('validation-required')),
          name: Yup.string()
            .trim()
            .required(formatMessage('validation-bonus-name-required')),
          amount: Yup.number()
            .typeError(formatMessage('validation-number-invalid'))
            .min(0, formatMessage('validation-number-min-zero'))
            .required(formatMessage('validation-required')),
          frequency: Yup.mixed<'monthly' | 'quarterly' | 'annual' | 'oneOff'>()
            .oneOf(['monthly', 'quarterly', 'annual', 'oneOff'])
            .required(formatMessage('validation-required')),
          amountType: Yup.mixed<'fixed' | 'variable'>()
            .oneOf(['fixed', 'variable'])
            .notRequired(),
          sickLeaveTreatment: Yup.mixed<
            'paidInFull' | 'proportional' | 'nonProportional' | 'notPaid'
          >()
            .oneOf(['paidInFull', 'proportional', 'nonProportional', 'notPaid'])
            .notRequired(),
          vacationTreatment: Yup.mixed<
            'paidInFull' | 'variableBase' | 'excluded'
          >()
            .oneOf(['paidInFull', 'variableBase', 'excluded'])
            .notRequired(),
        }),
      )
      .required(formatMessage('validation-required')),

    year: Yup.number()
      .typeError(formatMessage('validation-number-invalid'))
      .required(formatMessage('validation-required'))
      .min(2000, formatMessage('validation-number-min', { min: 2000 })),
    month: Yup.number()
      .typeError(formatMessage('validation-number-invalid'))
      .required(formatMessage('validation-required'))
      .min(1, formatMessage('validation-number-min', { min: 1 }))
      .max(12, formatMessage('validation-number-max', { max: 12 })),
    workingHours: positiveNumber(formatMessage).min(
      1,
      formatMessage('validation-number-min', { min: 1 }),
    ),

    l4Base: positiveNumber(formatMessage),

    l4: Yup.array().of(
      Yup.object().shape({
        start: Yup.string().required(formatMessage('validation-required')),
        end: Yup.string().required(formatMessage('validation-required')),
        paymentType: Yup.mixed<L4PaymentType>()
          .oneOf(['standard80', 'full100', 'accident100'])
          .required(formatMessage('validation-required')),
      }),
    ).test(
      'l4-in-month',
      formatMessage('validation-l4-in-month'),
      function (ranges) {
        const { year, month } = this.parent;
        if (!ranges) return true;
        return ranges.every(r =>
          isInMonth(r.start, year, month) && isInMonth(r.end, year, month)
        );
      },
    ),

    leaveBase: positiveNumber(formatMessage),

    leave: Yup.array().of(
      Yup.object().shape({
        start: Yup.string().required(formatMessage('validation-required')),
        end: Yup.string().required(formatMessage('validation-required')),
      }),
    ).test(
      'leave-in-month',
      formatMessage('validation-leave-in-month'),
      function (ranges) {
        const { year, month } = this.parent;
        if (!ranges) return true;
        return ranges.every(r =>
          isInMonth(r.start, year, month) && isInMonth(r.end, year, month)
        );
      },
    ),

    holidays: Yup.array().of(
      Yup.object().shape({
        start: Yup.string().required(formatMessage('validation-required')),
        end: Yup.string().required(formatMessage('validation-required')),
      }),
    ).test(
      'holidays-in-month',
      formatMessage('validation-holidays-in-month'),
      function (ranges) {
        const { year, month } = this.parent;
        if (!ranges) return true;
        return ranges.every(r =>
          isInMonth(r.start, year, month) && isInMonth(r.end, year, month)
        );
      },
    ),

    netSalaryOverride: Yup.number()
      .nullable()
      .typeError(formatMessage('validation-number-invalid'))
      .min(0, formatMessage('validation-number-min-zero')),

    grossSalaryOverride: Yup.number()
      .nullable()
      .typeError(formatMessage('validation-number-invalid'))
      .min(0, formatMessage('validation-number-min-zero')),

    reason: Yup.string().nullable(),

  }).test('overtime-sum', function (values) {
    // The metadata-generated validation shape is dynamic, so Yup cannot infer
    // every SalaryCalculatorValues key in this object-level test.
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
        message: formatMessage('validation-total-overtime-limit'),
      });
    }

    return true;
  });

export default function SalaryForm({ initialValues, onSubmit, type, ...rest }: SalaryFormProps) {
  const intl = useIntl();
  const formatValidationMessage = useCallback<ValidationMessageFormatter>(
    (id, values) => intl.formatMessage({ id }, values),
    [intl],
  );
  const salarySchema = useMemo(
    () => buildSalarySchema(formatValidationMessage),
    [formatValidationMessage],
  );
  const { user, loading: authLoading } = useAuth();
  const normalizedInitialValues = normalizeSalaryValues(initialValues);
  const [value, setValue] = useState(0);

  const [editCalculationOpen, setEditCalculationOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);

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
        validationSchema={salarySchema}
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
            if (error instanceof SalaryCalculationError) {
              calculationError = intl.formatMessage(
                { id: error.id },
                error.values,
              );
            } else {
              calculationError = intl.formatMessage({
                id: 'salary-calculation-failed',
              });
            }
          }

          const disabledTabs = getDisabledSalaryTabs(values);

          return (
            <>
              <Form>
                <SalaryTabAvailabilityGuard activeTab={value} setActiveTab={setValue} />
                <WorkRelationSelector formMode={type} />
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
                            <DynamicSalaryFields
                              fields={relationAwareRateFieldConfigs}
                              values={values}
                              formMode={type}
                              setFieldValue={setFieldValue}
                            />

                            <SalaryBonusesEditor
                              bonuses={values.bonuses ?? []}
                              setFieldValue={setFieldValue}
                            />

                            {touched.bonuses && errors.bonuses && typeof errors.bonuses === 'string' && (
                              <FormHelperText error>
                                {errors.bonuses}
                              </FormHelperText>
                            )}
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
                                const newWorkingHours = getNominalWorkingHoursInMonth(newYear, month - 1, holidays);
                                form.setFieldValue("workingHours", newWorkingHours);
                              }}
                            />

                            <MonthPicker
                              value={values.month}
                              onChange={(val) => {
                                setFieldValue("month", val)
                                setFieldValue("workingHours", getNominalWorkingHoursInMonth(values.year, val - 1, values.holidays))
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
                                      setFieldValue("workingHours", getNominalWorkingHoursInMonth(values.year, values.month - 1, isoRanges))
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
                                  const nextL4 = ranges.map((range) => {
                                    const start = range.start.format("YYYY-MM-DD");
                                    const end = range.end.format("YYYY-MM-DD");

                                    const existingRange = values.l4.find(
                                      (existing) =>
                                        existing.start === start &&
                                        existing.end === end,
                                    );

                                    return {
                                      start,
                                      end,
                                      paymentType:
                                        existingRange?.paymentType ?? 'standard80',
                                    };
                                  });

                                  setFieldValue("l4", nextL4);
                                }}
                              />

                              {values.l4.length > 0 && (
                                <Stack spacing={1.5} sx={{ mt: 2 }}>
                                  {values.l4.map((range, index) => (
                                    <Box
                                      key={`${range.start}-${range.end}`}
                                      sx={{
                                        p: 1.5,
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        sx={{ mb: 1 }}
                                      >
                                        {dayjs(range.start).format('DD.MM.YYYY')}
                                        {' – '}
                                        {dayjs(range.end).format('DD.MM.YYYY')}
                                      </Typography>

                                      <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label={intl.formatMessage({
                                          id: 'l4-payment-type-label',
                                          defaultMessage: 'Rodzaj L4',
                                        })}
                                        value={range.paymentType ?? 'standard80'}
                                        onChange={(event) =>
                                          setFieldValue(
                                            `l4.${index}.paymentType`,
                                            event.target.value as L4PaymentType,
                                          )
                                        }
                                      >
                                        <MenuItem value="standard80">
                                          {intl.formatMessage({
                                            id: 'l4-payment-type-standard80',
                                            defaultMessage: '80% – standardowe',
                                          })}
                                        </MenuItem>

                                        <MenuItem value="full100">
                                          {intl.formatMessage({
                                            id: 'l4-payment-type-full100',
                                            defaultMessage:
                                              '100% – ciąża / wypadek w drodze / dawca',
                                          })}
                                        </MenuItem>

                                        <MenuItem value="accident100">
                                          {intl.formatMessage({
                                            id: 'l4-payment-type-accident100',
                                            defaultMessage:
                                              '100% – wypadek przy pracy / choroba zawodowa',
                                          })}
                                        </MenuItem>
                                      </TextField>
                                    </Box>
                                  ))}
                                </Stack>
                              )}

                              {typeof errors.l4 === 'string' && (
                                <FormHelperText error>{errors.l4}</FormHelperText>
                              )}
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
                        <Alert severity="warning" sx={{ maxWidth: 320, ml: isMidScreen ? 0 : 4, mt: isMidScreen ? 2 : 0 }}>
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
                        <Button
                          type="button"
                          variant="contained"
                          sx={{backgroundColor: 'rgb(7, 173, 82)'}}
                          disabled={
                            authLoading ||
                            (type === 'create' && Boolean(user) && !values.workRelationId)
                          }
                          onClick={() => {
                            if (!user) {
                              setAuthRequiredOpen(true);
                              return;
                            }

                            if (type === 'create' && !values.workRelationId) {
                              return;
                            }

                            setDialogType("save");
                          }}
                        >
                          <FormattedMessage id={"save"}/>
                        </Button>

                        <Button type="button" variant="contained" sx={{backgroundColor: 'rgb(149, 57, 4)'}} onClick={() => setDialogType('reset')} >
                          <FormattedMessage id={"reset"}/>
                        </Button>
                      </>
                    }

                    <Button type="button" variant="contained" onClick={() => setEditCalculationOpen(true)}>
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
                onConfirm={async () => {
                  if (!dialogType) return;

                  if (dialogType === 'save') {
                    await submitForm();
                    closeDialog();
                    return;
                  }

                  if (dialogType === 'reset') {
                    resetForm();
                    closeDialog();
                  }
                }}
                onCancel={closeDialog}
              />

              <AuthRequiredDialog
                open={authRequiredOpen}
                onClose={() => setAuthRequiredOpen(false)}
              />
            </>
          )
        }}
      </Formik>
    </Box>
  );
}
