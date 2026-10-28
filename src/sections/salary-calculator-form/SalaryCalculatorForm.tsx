import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

// mui
import {
  Box,
  Button,
  Stack,
  Alert,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';

import FormHelperText from '@mui/material/FormHelperText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { InfoOutlined, WarningAmberRounded } from '@mui/icons-material';

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
import WarningDialog from '../../components/Modals/WarningDialog';
import InfoDialog from '../../components/Modals/InfoDialog';
import AdvancedSalarySettingsDialog from './AdvancedSalarySettingsDialog';
import SalaryBonusesEditor from './SalaryBonusesEditor';

// auth
import { useAuth } from '../../auth/AuthContext';

// api
import { getWorkRelationsForMonth } from '../../api/work_relations';
import { getSalaryCarryForwardContext } from '../../api/getSalaryCarryForwardContext';
import type { SalaryCarryForwardHistory } from '../../api/getSalaryCarryForwardContext';
import { getUopSicknessBaseHistory } from '../../api/getUopSicknessBase';
import { getUopVacationBaseHistory } from '../../api/getUopVacationBase';
import { getMandateSicknessBaseHistory } from '../../api/getMandateSicknessBase';

// utils
import { MultiRangeMonthPicker } from '../../components/DaysPicker';
import { isInMonth, isoToDayjsRanges } from '../../utils/monthHelperFunc';
import { getNominalWorkingHoursInMonth } from '../../utils/workingTimeHelper';
import { calculateTaxesUoP, calculateTaxesContractOfMandate, calculateTaxesUoD, SalaryCalculationError } from '../../utils/workTypeSalaryCalc';
import type { SalaryCalculationResult } from '../../utils/workTypeSalaryCalc';

import { calculateUopSicknessBases, UopSicknessBaseError } from '../../utils/calculateUopSicknessBase';
import { calculateUopVacationBase, UopVacationBaseError } from '../../utils/calculateUopVacationBase';
import type { UopVacationBaseResult } from '../../types/uopVacationBase';
import { calculateMandateSicknessBases, MandateSicknessBaseError } from '../../utils/calculateMandateSicknessBase';
import type {
  UopSicknessBaseMessage,
  UopSicknessBaseResult,
  UopSicknessBasesResult,
} from '../../types/uopSicknessBase';
import type { DateRange } from '../../components/DaysPicker';
import type { MandateSicknessBasesResult } from '../../types/mandateSicknessBase';

// types
import { normalizeL4Ranges } from '../../types/salaryCalculator';
import type { L4PaymentType, SalaryCalculatorValues, WorkRate } from '../../types/salaryCalculator';
import type { WorkRelation } from '../../types/workRelation';
import type { DialogConfig } from '../../components/Modals/ConfirmActionDialog';


import DynamicSalaryFields from './DynamicSalaryFields';
import {
  metadataDrivenFieldConfigs,
  l4FieldConfigs,
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

type LegacySalaryBonusValues = {
  attendanceBonus?: number;
  discretionaryBonus?: number;
  otherBonus?: number;
};

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

  const { values, setFieldValue } =
    useFormikContext<SalaryCalculatorValues>();

  const [relations, setRelations] = useState<WorkRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [warningOpen, setWarningOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  /*
   * We need access to the currently selected relation while loading
   * relations, but changing the selected relation must NOT trigger
   * another fetch.
   */
  const selectedRelationIdRef = useRef<string | null>(
    values.workRelationId ?? null,
  );

  useEffect(() => {
    selectedRelationIdRef.current =
      values.workRelationId ?? null;
  }, [values.workRelationId]);

  const clearRelationContext = useCallback(() => {
    selectedRelationIdRef.current = null;

    setFieldValue('workRelationId', null, false);
    setFieldValue('employmentStartDate', null, false);
    setFieldValue('employmentEndDate', null, false);
  }, [setFieldValue]);

  const applyRelation = useCallback(
    (relation: WorkRelation) => {
      const workRateType =
        getWorkRateTypeFromRelation(relation);

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

      selectedRelationIdRef.current = relation.id;

      setFieldValue(
        'workRelationId',
        relation.id,
        false,
      );

      setFieldValue(
        'employmentStartDate',
        period.start,
        false,
      );

      setFieldValue(
        'employmentEndDate',
        period.end,
        false,
      );

      setFieldValue(
        'workRateType',
        workRateType,
        false,
      );
    },
    [
      clearRelationContext,
      setFieldValue,
      values.month,
      values.year,
    ],
  );

  /*
   * Load relations only when the context that determines
   * available relations changes.
   *
   * Selecting a work relation does NOT cause another request.
   */
  useEffect(() => {
    if (formMode !== 'create' || authLoading) {
      return;
    }

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

        if (!active) {
          return;
        }

        setRelations(data);

        /*
         * No available relation.
         */
        if (data.length === 0) {
          clearRelationContext();
          return;
        }

        /*
         * Preserve the currently selected relation if it is still
         * available for the newly loaded month.
         */
        const currentRelation = data.find(
          relation =>
            relation.id ===
            selectedRelationIdRef.current,
        );

        if (currentRelation) {
          applyRelation(currentRelation);
          return;
        }

        /*
         * If there is exactly one relation, select it automatically.
         */
        if (data.length === 1) {
          applyRelation(data[0]);
          return;
        }

        /*
         * Multiple relations exist and none is selected.
         */
        clearRelationContext();
      } catch (error) {
        console.error(error);

        if (!active) {
          return;
        }

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
    values.year,
  ]);

  const selectedRelation = relations.find(
    relation =>
      relation.id === values.workRelationId,
  );

  const selectedPeriod = selectedRelation
    ? getEffectiveEmploymentPeriod(
        selectedRelation,
        values.year,
        values.month,
      )
    : null;

  /*
   * WARNING
   */
  const hasWarning = Boolean(
    !loading &&
      !loadError &&
      relations.length === 0,
  );

  /*
   * INFO
   */
  const infoType =
    !loading &&
    !loadError &&
    relations.length > 1 &&
    !selectedRelation
      ? 'selectionRequired'
      : !loading &&
          !loadError &&
          selectedRelation &&
          selectedPeriod?.isPartialMonth
        ? 'partialMonth'
        : null;

  const hasInfo = Boolean(infoType);

  /*
   * Close dialogs automatically when their condition disappears.
   */
  useEffect(() => {
    if (!hasWarning) {
      setWarningOpen(false);
    }
  }, [hasWarning]);

  useEffect(() => {
    if (!hasInfo) {
      setInfoOpen(false);
    }
  }, [hasInfo]);

  if (
    formMode !== 'create' ||
    authLoading ||
    !user
  ) {
    return null;
  }

  const warning = (
    <Stack spacing={1.5}>
      <Typography variant="body2">
        {intl.formatMessage({
          id: 'salary-work-relation-missing-description',
          defaultMessage:
            'Możesz korzystać z kalkulatora, ale nie zapiszesz wynagrodzenia, dopóki nie dodasz stosunku pracy obejmującego wybrany miesiąc.',
        })}
      </Typography>

      <Button
        variant="outlined"
        color="inherit"
        size="small"
        sx={{
          alignSelf: 'flex-start',
          maxWidth: '100%',
          whiteSpace: 'normal',
        }}
        onClick={() =>
          navigate('/create-work-relation')
        }
      >
        {intl.formatMessage({
          id: 'salary-work-relation-create',
          defaultMessage: 'Dodaj stosunek pracy',
        })}
      </Button>
    </Stack>
  );

  const info =
    infoType === 'selectionRequired' ? (
      <Typography variant="body2">
        {intl.formatMessage({
          id: 'salary-work-relation-select-to-save',
          defaultMessage:
            'Wybierz stosunek pracy, aby móc zapisać to wynagrodzenie. Do tego czasu możesz nadal korzystać z kalkulatora.',
        })}
      </Typography>
    ) : infoType === 'partialMonth' &&
      selectedPeriod ? (
      <Typography variant="body2">
        {intl.formatMessage(
          {
            id: 'salary-work-relation-partial-month',
            defaultMessage:
              'Wybrany stosunek pracy nie obejmuje całego miesiąca. Kalkulator uwzględni okres od {start} do {end}.',
          },
          {
            start: dayjs(
              selectedPeriod.start,
            ).format('DD.MM.YYYY'),

            end: dayjs(
              selectedPeriod.end,
            ).format('DD.MM.YYYY'),
          },
        )}
      </Typography>
    ) : null;

  const infoTitle =
    infoType === 'selectionRequired'
      ? intl.formatMessage({
          id: 'salary-work-relation-select-info-title',
          defaultMessage: 'Wybierz stosunek pracy',
        })
      : intl.formatMessage({
          id: 'salary-work-relation-partial-month-info-title',
          defaultMessage:
            'Stosunek pracy obejmuje część miesiąca',
        });

  return (
    <Stack
      spacing={1.5}
      sx={{
        width: '320px',
        maxWidth: '100%',
        minWidth: 0,
        mx: 'auto',
      }}
    >
      {/* Real loading error remains directly visible */}
      {!loading && loadError && (
        <Alert severity="error">
          {intl.formatMessage({
            id: 'salary-work-relation-load-failed',
            defaultMessage:
              'Nie udało się pobrać stosunków pracy dla wybranego miesiąca.',
          })}
        </Alert>
      )}

      {!loadError && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            width: '100%',
            minWidth: 0,
          }}
        >
          {/* LOADING */}
          {loading ? (
            <TextField
              select
              fullWidth
              disabled
              size="small"
              value="__loading__"
              label={intl.formatMessage({
                id: 'salary-work-relation-label',
                defaultMessage: 'Stosunek pracy',
              })}
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <MenuItem
                value="__loading__"
                disabled
              >
              </MenuItem>
            </TextField>
          ) : (
            /*
             * Keep the selector mounted even when there are
             * no available relations.
             */
            <TextField
              select
              fullWidth
              size="small"
              disabled={relations.length === 0}
              sx={{
                minWidth: 0,
                flex: 1,

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
              value={
                relations.length > 0
                  ? values.workRelationId ?? ''
                  : ''
              }
              onChange={(event) => {
                const relation = relations.find(
                  item =>
                    item.id === event.target.value,
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
                  {intl.formatMessage({
                    id: 'salary-work-relation-placeholder',
                    defaultMessage:
                      'Wybierz stosunek pracy',
                  })}
                </MenuItem>
              )}

              {relations.map(relation => (
                <MenuItem
                  key={relation.id}
                  value={relation.id}
                  sx={{
                    maxWidth: 320,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 0,
                      maxWidth: '100%',
                    }}
                  >
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
          )}

          {/* WARNING */}
          {hasWarning && (
            <IconButton
              type="button"
              aria-label={intl.formatMessage({
                id: 'salary-work-relation-warning-open',
                defaultMessage:
                  'Pokaż ostrzeżenie dotyczące stosunku pracy',
              })}
              onClick={() =>
                setWarningOpen(true)
              }
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                boxShadow: 1,

                '&:hover': {
                  bgcolor: 'warning.dark',
                },
              }}
            >
              <WarningAmberRounded />
            </IconButton>
          )}

          {/* INFO */}
          {hasInfo && (
            <IconButton
              type="button"
              aria-label={intl.formatMessage({
                id: 'salary-work-relation-info-open',
                defaultMessage:
                  'Pokaż informację dotyczącą stosunku pracy',
              })}
              onClick={() =>
                setInfoOpen(true)
              }
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'info.main',
                color: 'info.contrastText',
                boxShadow: 1,

                '&:hover': {
                  bgcolor: 'info.dark',
                },
              }}
            >
              <InfoOutlined />
            </IconButton>
          )}
        </Box>
      )}

      <WarningDialog
        open={warningOpen}
        warning={warning}
        title={intl.formatMessage({
          id: 'salary-work-relation-missing-title',
          defaultMessage:
            'Brak stosunku pracy dla wybranego miesiąca',
        })}
        onClose={() =>
          setWarningOpen(false)
        }
      />

      {info && (
        <InfoDialog
          open={infoOpen}
          info={info}
          title={infoTitle}
          onClose={() =>
            setInfoOpen(false)
          }
        />
      )}
    </Stack>
  );
};

type CarryForwardContextLoaderProps = {
  formMode: 'create' | 'update';
};

const CarryForwardContextLoader = ({
  formMode,
}: CarryForwardContextLoaderProps) => {
  const intl = useIntl();
  const { values, setFieldValue } = useFormikContext<SalaryCalculatorValues>();

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [history, setHistory] = useState<SalaryCarryForwardHistory | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);

  const resetCarryForwardFields = useCallback(() => {
    setFieldValue('previousTaxableIncome', 0, false);
    setFieldValue('previousPit0Revenue', 0, false);
    setFieldValue('previousPensionDisabilityBase', 0, false);
    setFieldValue('previousUopKupUsed', 0, false);
  }, [setFieldValue]);

  const employmentPeriodReady = (() => {
    if (!values.workRelationId || !values.employmentStartDate) {
      return false;
    }

    const effectiveStart = dayjs(values.employmentStartDate);

    return (
      effectiveStart.isValid()
      && effectiveStart.year() === values.year
      && effectiveStart.month() + 1 === values.month
    );
  })();

  useEffect(() => {
    if (formMode !== 'create') return;

    let active = true;

    // WorkRelationSelector updates the effective employment period after a
    // month/relation change. Do not request carry-forward data until that
    // context belongs to the currently selected month; otherwise a request
    // for the previous relation can briefly populate stale history warnings.
    if (!values.workRelationId || !employmentPeriodReady) {
      resetCarryForwardFields();
      setLoading(false);
      setLoadError(false);
      setHistory(null);

      return () => {
        active = false;
      };
    }

    const loadContext = async () => {
      // A changed work relation / year / month starts a new context.
      // Clear old values immediately so a failed request cannot leave stale
      // carry-forward values from the previously selected context.
      resetCarryForwardFields();
      setLoading(true);
      setLoadError(false);
      setHistory(null);

      try {
        const context = await getSalaryCarryForwardContext(
          values.workRelationId!,
          values.year,
          values.month,
        );

        if (!active) return;

        setFieldValue(
          'previousTaxableIncome',
          context.previousTaxableIncome,
          false,
        );
        setFieldValue(
          'previousPit0Revenue',
          context.previousPit0Revenue,
          false,
        );
        setFieldValue(
          'previousPensionDisabilityBase',
          context.previousPensionDisabilityBase,
          false,
        );
        setFieldValue(
          'previousUopKupUsed',
          context.previousUopKupUsed,
          false,
        );

        setHistory(context.history);
      } catch (error) {
        console.error(error);

        if (!active) return;

        setLoadError(true);
        setHistory(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadContext();

    return () => {
      active = false;
    };
  }, [
    formMode,
    resetCarryForwardFields,
    setFieldValue,
    values.employmentStartDate,
    values.month,
    values.workRelationId,
    values.year,
    employmentPeriodReady,
  ]);

  const hasWarning = Boolean(
    !loading
    && (loadError || (history && !history.complete)),
  );

  useEffect(() => {
    if (!hasWarning) {
      setWarningOpen(false);
    }
  }, [hasWarning]);

  if (
    formMode !== 'create'
    || !values.workRelationId
    || !employmentPeriodReady
    || !hasWarning
  ) {
    return null;
  }

  const warning = loadError ? (
    <Typography variant="body2">
      {intl.formatMessage({
        id: 'salary-carry-forward-load-failed',
        defaultMessage:
          'Nie udało się pobrać danych z wcześniejszych wynagrodzeń. Wartości historyczne pozostają edytowalne i możesz uzupełnić je ręcznie.',
      })}
    </Typography>
  ) : (
    <Stack spacing={1}>
      <Typography variant="body2">
        {intl.formatMessage({
          id: 'salary-carry-forward-incomplete',
          defaultMessage:
            'Nie udało się ustalić wszystkich wartości na podstawie zapisanej historii wynagrodzeń. Sprawdź je przed zapisaniem wynagrodzenia.',
        })}
      </Typography>

      {history && history.missingPeriods.length > 0 && (
        <Typography variant="body2">
          {intl.formatMessage(
            {
              id: 'salary-carry-forward-missing-periods',
              defaultMessage: 'Brak zapisanych wynagrodzeń za: {periods}.',
            },
            {
              periods: history.missingPeriods.join(', '),
            },
          )}
        </Typography>
      )}

      {history && history.unknownFactPeriods.length > 0 && (
        <Typography variant="body2">
          {intl.formatMessage(
            {
              id: 'salary-carry-forward-unknown-facts',
              defaultMessage:
                'Niektóre wcześniejsze wynagrodzenia nie zawierają pełnych danych potrzebnych do automatycznego wyliczenia za: {periods}. Sprawdź wartości lub zapisz te miesiące ponownie.',
            },
            {
              periods: history.unknownFactPeriods.join(', '),
            },
          )}
        </Typography>
      )}
    </Stack>
  );

  return (
    <>
      <IconButton
        type="button"
        aria-label={intl.formatMessage({
          id: 'salary-carry-forward-warning-open',
          defaultMessage: 'Pokaż ostrzeżenie dotyczące danych historycznych',
        })}
        onClick={() => setWarningOpen(true)}
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 2,
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          boxShadow: 1,
          '&:hover': {
            bgcolor: 'warning.dark',
          },
        }}
      >
        <WarningAmberRounded />
      </IconButton>

      <WarningDialog
        open={warningOpen}
        warning={warning}
        title={intl.formatMessage({
          id: 'salary-carry-forward-warning-title',
          defaultMessage: 'Dane historyczne wymagają uwagi',
        })}
        onClose={() => setWarningOpen(false)}
      />
    </>
  );
};

const getL4BaseMessageDefault = (id: string) => {
  switch (id) {
    case 'l4-base-warning-missing-history':
      return 'Brakuje zapisanych wynagrodzeń w części okresu potrzebnego do wyliczenia podstawy L4: {periods}. Wynik sprawdź przed zapisaniem.';
    case 'l4-base-warning-bonus-treatment-missing':
      return 'Premia „{bonus}” za {period} nie ma ustawionego sposobu rozliczania podczas L4. Została uwzględniona, ale wynik może wymagać ręcznej weryfikacji.';
    case 'l4-base-warning-current-bonus-treatment-missing':
      return 'Premia „{bonus}” nie ma ustawionego sposobu rozliczania podczas L4. Sprawdź ją w ustawieniach zaawansowanych.';
    case 'l4-base-warning-unsupported-historical-minimum-wage':
      return 'Nie udało się ustalić minimalnego wynagrodzenia dla {period}. Dodatek nocny w podstawie L4 wymaga weryfikacji.';
    case 'l4-base-warning-unsupported-historical-zus-cap':
      return 'Dla {period} przyjęto standardowe pomniejszenie o składki pracownika (13,71%). Zweryfikuj wynik, jeśli osiągnięto roczny limit składek emerytalno-rentowych.';
    case 'l4-base-warning-minimum-base-not-applied':
      return 'Nie udało się ustalić minimalnej podstawy L4 dla {period}. Sprawdź wynik.';
    case 'l4-base-warning-history-social-base-mismatch':
      return 'Dane składkowe zapisane dla {period} różnią się od podstawy odtworzonej z zapisanych składników wynagrodzenia. Sprawdź ten miesiąc.';
    case 'l4-base-warning-long-period-bonus-without-definition':
      return 'Składnik „{bonus}” za {period} jest kwartalny lub roczny, ale nie ma stabilnego powiązania z definicją premii. Wynik został obliczony ze snapshotu miesiąca, lecz warto go zweryfikować.';
    default:
      return id;
  }
};

const UopL4BaseCalculator = () => {
  const intl = useIntl();
  const { values, setFieldValue } = useFormikContext<SalaryCalculatorValues>();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<UopSicknessBasesResult | null>(null);
  const [calculatedForSignature, setCalculatedForSignature] = useState<string | null>(null);

  const isUop =
    values.workRateType === 'uop_monthly'
    || values.workRateType === 'uop_hourly';

  const calculationSignature = JSON.stringify({
    workRelationId: values.workRelationId ?? null,
    year: values.year,
    month: values.month,
    workRateType: values.workRateType,
    rate: values.rate,
    workingHours: values.workingHours,
    employmentStartDate: values.employmentStartDate ?? null,
    employmentEndDate: values.employmentEndDate ?? null,
    l4: values.l4,
    holidays: values.holidays ?? [],
    leave: values.leave ?? [],
    leaveBase: values.leaveBase ?? 0,
    dailyOvertime: values.dailyOvertime ?? 0,
    weekendHolidayOvertime: values.weekendHolidayOvertime ?? 0,
    nightOvertime: values.nightOvertime ?? 0,
    nightHours: values.nightHours ?? 0,
    turnOfDayHours: values.turnOfDayHours ?? 0,
    hourlyRateCalculationMode:
      values.hourlyRateCalculationMode ?? 'roundedTo2',
    functionalAllowance: values.functionalAllowance ?? 0,
    functionalAllowanceRetainedDuringSickness:
      values.functionalAllowanceRetainedDuringSickness ?? false,
    bonuses: values.bonuses ?? [],
  });

  const stale = Boolean(
    result
    && calculatedForSignature
    && calculatedForSignature !== calculationSignature,
  );

  if (!isUop) return null;

  const formatMessage = (message: UopSicknessBaseMessage) =>
    intl.formatMessage(
      {
        id: message.id,
        defaultMessage: getL4BaseMessageDefault(message.id),
      },
      message.values,
    );

  const calculateBase = async () => {
    if (!values.workRelationId) {
      setErrorMessage(
        intl.formatMessage({
          id: 'l4-base-error-work-relation-required',
          defaultMessage: 'Wybierz stosunek pracy przed obliczeniem podstawy L4.',
        }),
      );
      return;
    }

    if (!values.l4 || values.l4.length === 0) {
      setErrorMessage(
        intl.formatMessage({
          id: 'l4-base-error-no-l4',
          defaultMessage: 'Najpierw zaznacz okres L4, aby ustalić właściwy kontekst podstawy.',
        }),
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const history = await getUopSicknessBaseHistory(
        values.workRelationId,
        values.year,
        values.month,
      );

      const nextResult = calculateUopSicknessBases({
        history,
        target: {
          year: values.year,
          month: values.month,
          paymentMode:
            values.workRateType === 'uop_hourly'
              ? 'hourly'
              : 'monthly',
          rate: values.rate,
          workingHours: values.workingHours,
          employmentStartDate: values.employmentStartDate,
          employmentEndDate: values.employmentEndDate,
          l4: values.l4,
          holidays: values.holidays ?? [],
          leave: values.leave ?? [],
          leaveBase: values.leaveBase ?? 0,
          dailyOvertime: values.dailyOvertime ?? 0,
          weekendHolidayOvertime: values.weekendHolidayOvertime ?? 0,
          nightOvertime: values.nightOvertime ?? 0,
          nightHours: values.nightHours ?? 0,
          turnOfDayHours: values.turnOfDayHours ?? 0,
          hourlyRateCalculationMode:
            values.hourlyRateCalculationMode ?? 'roundedTo2',
          functionalAllowance: values.functionalAllowance ?? 0,
          functionalAllowanceRetainedDuringSickness:
            values.functionalAllowanceRetainedDuringSickness ?? false,
          bonuses: (values.bonuses ?? []).map((bonus) => ({
            id: bonus.id,
            name: bonus.name,
            amount: bonus.amount,
            frequency: bonus.frequency,
            sickLeaveTreatment: bonus.sickLeaveTreatment,
          })),
        },
      });

      if (nextResult.duringEmployment) {
        await setFieldValue('l4Base', nextResult.duringEmployment.base, false);
      }
      if (nextResult.afterEmployment) {
        await setFieldValue('l4BaseAfterTermination', nextResult.afterEmployment.base, false);
      }
      setResult(nextResult);
      setCalculatedForSignature(calculationSignature);
    } catch (error) {
      console.error(error);

      if (error instanceof UopSicknessBaseError) {
        setErrorMessage(
          intl.formatMessage(
            {
              id: error.id,
              defaultMessage:
                error.id === 'l4-base-error-no-usable-history'
                  ? 'Brak wystarczającej zapisanej historii do automatycznego wyliczenia podstawy L4.'
                  : 'Nie udało się automatycznie wyliczyć podstawy L4.',
            },
            error.values,
          ),
        );
      } else {
        setErrorMessage(
          intl.formatMessage({
            id: 'l4-base-calculation-failed',
            defaultMessage: 'Nie udało się obliczyć podstawy L4 na podstawie historii wynagrodzeń.',
          }),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Button
        type="button"
        variant="outlined"
        disabled={loading || !values.workRelationId}
        onClick={calculateBase}
      >
        {intl.formatMessage({
          id: 'l4-base-calculate-button',
          defaultMessage: 'Oblicz podstawę L4',
        })}
      </Button>

      {errorMessage && (
        <Alert severity="warning">
          {errorMessage}
        </Alert>
      )}

      {result && (['duringEmployment', 'afterEmployment'] as const).map((context) => {
        const baseResult: UopSicknessBaseResult | null = result[context];
        if (!baseResult) return null;

        return (
          <Alert key={context} severity={baseResult.warnings.length > 0 ? 'warning' : 'success'}>
            <Stack spacing={0.75}>
              <Typography variant="body2" fontWeight={700}>
                {intl.formatMessage(
                  {
                    id: context === 'duringEmployment'
                      ? 'l4-base-result-during'
                      : 'l4-base-result-after',
                    defaultMessage: context === 'duringEmployment'
                      ? 'Podstawa L4 podczas zatrudnienia: {amount} zł'
                      : 'Podstawa L4 po ustaniu zatrudnienia: {amount} zł',
                  },
                  { amount: baseResult.base.toFixed(2) },
                )}
              </Typography>

              {baseResult.source === 'reusedPreviousBase' && (
                <Typography variant="body2">
                  {intl.formatMessage(
                    { id: 'l4-base-reused-previous' },
                    { period: baseResult.reusedFromPeriod ?? '—' },
                  )}
                </Typography>
              )}

              {baseResult.source === 'history' && (
                <Typography variant="body2">
                  {intl.formatMessage(
                    { id: 'l4-base-reference-period' },
                    {
                      start: baseResult.referencePeriod.monthlyStart ?? '—',
                      end: baseResult.referencePeriod.monthlyEnd ?? '—',
                      used: baseResult.usedPeriods.length > 0
                        ? baseResult.usedPeriods.join(', ')
                        : '—',
                    },
                  )}
                </Typography>
              )}

              {baseResult.source === 'currentMonthFallback' && (
                <Typography variant="body2">
                  {intl.formatMessage({ id: 'l4-base-current-month-fallback' })}
                </Typography>
              )}

              {baseResult.excludedPeriods.length > 0 && (
                <Typography variant="body2">
                  {intl.formatMessage(
                    { id: 'l4-base-excluded-periods' },
                    { periods: baseResult.excludedPeriods.join(', ') },
                  )}
                </Typography>
              )}

              {baseResult.minimumApplied && baseResult.minimumBase != null && (
                <Typography variant="body2">
                  {intl.formatMessage(
                    { id: 'l4-base-minimum-applied' },
                    { amount: baseResult.minimumBase.toFixed(2) },
                  )}
                </Typography>
              )}

              {baseResult.warnings.map((warning, index) => (
                <Typography key={`${warning.id}-${index}`} variant="body2">
                  {formatMessage(warning)}
                </Typography>
              ))}

              {stale && (
                <Typography variant="body2" fontWeight={600}>
                  {intl.formatMessage({ id: 'l4-base-result-stale' })}
                </Typography>
              )}
            </Stack>
          </Alert>
        );
      })}
    </Stack>
  );
};

/** Same Formik/MUI async calculator pattern as UopL4BaseCalculator.
 * Historical pay averaging exists only in calculateUopVacationBase().
 */
const UopVacationBaseCalculator = () => {
  const intl = useIntl();
  const { values, setFieldValue } = useFormikContext<SalaryCalculatorValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UopVacationBaseResult | null>(null);
  const [calculatedForSignature, setCalculatedForSignature] = useState<string | null>(null);

  const isUop = values.workRateType === 'uop_monthly'
    || values.workRateType === 'uop_hourly';
  const signature = JSON.stringify({
    workRelationId: values.workRelationId,
    year: values.year,
    month: values.month,
    workRateType: values.workRateType,
    rate: values.rate,
    workingHours: values.workingHours,
    employmentStartDate: values.employmentStartDate,
    employmentEndDate: values.employmentEndDate,
    holidays: values.holidays,
    l4: values.l4,
    leave: values.leave,
    vacationBaseMonths: values.vacationBaseMonths ?? 3,
  });

  if (!isUop) return null;
  const stale = Boolean(result && (
    signature !== calculatedForSignature || values.leaveBase !== result.monthlyBase
  ));

  const calculateBase = async () => {
    if (!values.workRelationId) {
      setError(intl.formatMessage({ id: 'vacation-base-error-work-relation' }));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const history = await getUopVacationBaseHistory(
        values.workRelationId, values.year, values.month,
      );
      const next = calculateUopVacationBase({
        history,
        target: {
          year: values.year,
          month: values.month,
          workRateType: values.workRateType as 'uop_monthly' | 'uop_hourly',
          rate: values.rate,
          workingHours: values.workingHours,
          leave: values.leave ?? [],
          l4: values.l4 ?? [],
          holidays: values.holidays ?? [],
          employmentStartDate: values.employmentStartDate,
          employmentEndDate: values.employmentEndDate,
          vacationBaseMonths: values.vacationBaseMonths ?? 3,
        },
      });
      await setFieldValue('leaveBase', next.monthlyBase, false);
      setCalculatedForSignature(signature);
      setResult(next);
    } catch (cause) {
      if (cause instanceof UopVacationBaseError) {
        setError(intl.formatMessage({ id: cause.id }, cause.values));
      } else {
        console.error(cause);
        setError(intl.formatMessage({ id: 'vacation-base-error-fetch' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Button
        type="button"
        variant="outlined"
        disabled={loading || !values.workRelationId}
        onClick={calculateBase}
      >
        {intl.formatMessage({ id: 'vacation-base-calculate' })}
      </Button>
      {error && <Alert severity="warning">{error}</Alert>}
      {result && (
        <Alert severity={stale ? 'warning' : 'success'}>
          <Stack spacing={0.75}>
            <Typography variant="body2" fontWeight={700}>
              {intl.formatMessage(
                { id: 'vacation-base-result' },
                { amount: result.monthlyBase.toFixed(2) },
              )}
            </Typography>
            <Typography variant="body2">
              {intl.formatMessage({ id: 'vacation-base-hourly-rate' }, {
                rate: result.vacationHourlyRate.toFixed(2),
                hours: result.leaveHours,
              })}
            </Typography>
            <Typography variant="body2">
              {intl.formatMessage({ id: 'vacation-base-history-details' }, {
                periods: result.referencePeriods.join(', ') || '—',
                gross: result.variableGrossTotal.toFixed(2),
                hours: result.actualHoursTotal,
              })}
            </Typography>
            {result.notes.map(note => (
              <Typography key={note.id} variant="body2">
                {intl.formatMessage({ id: note.id }, note.values)}
              </Typography>
            ))}
            {stale && (
              <Typography variant="body2" fontWeight={600}>
                {intl.formatMessage({ id: 'vacation-base-result-stale' })}
              </Typography>
            )}
          </Stack>
        </Alert>
      )}
    </Stack>
  );
};

/** Shares the existing L4 Formik fields and MUI presentation conventions. */
const MandateL4BaseCalculator = () => {
  const intl = useIntl();
  const { values, setFieldValue } = useFormikContext<SalaryCalculatorValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MandateSicknessBasesResult | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const signature = JSON.stringify({
    workRelationId: values.workRelationId,
    year: values.year, month: values.month,
    rate: values.rate, workingHours: values.workingHours,
    employmentStartDate: values.employmentStartDate,
    employmentEndDate: values.employmentEndDate,
    l4: values.l4,
    bonuses: values.bonuses,
    isStudent: values.isStudent, isUnder26: values.isUnder26,
    mandateVoluntarySicknessInsurance: values.mandateVoluntarySicknessInsurance,
    sicknessBenefitEligible: values.sicknessBenefitEligible,
    mandateHasOtherUopAtLeastMinimumBase: values.mandateHasOtherUopAtLeastMinimumBase,
    mandateOtherSocialBaseBeforeThisContract: values.mandateOtherSocialBaseBeforeThisContract,
    isOwnEmployerContract: values.isOwnEmployerContract,
    performedForOwnEmployer: values.performedForOwnEmployer,
  });

  if (values.workRateType !== 'mandate_hourly') return null;

  const calculateBase = async () => {
    if (!values.workRelationId) {
      setError(intl.formatMessage({ id: 'l4-base-error-work-relation-required' }));
      return;
    }
    if (values.l4.length === 0) {
      setError(intl.formatMessage({ id: 'l4-base-error-no-l4' }));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const history = await getMandateSicknessBaseHistory(
        values.workRelationId, values.year, values.month,
      );
      const next = calculateMandateSicknessBases({
        history,
        target: {
          year: values.year,
          month: values.month,
          rate: values.rate,
          workingHours: values.workingHours,
          l4: values.l4,
          holidays: values.holidays ?? [],
          employmentStartDate: values.employmentStartDate,
          employmentEndDate: values.employmentEndDate,
          isStudent: values.isStudent,
          isUnder26: values.isUnder26,
          mandateVoluntarySicknessInsurance: values.mandateVoluntarySicknessInsurance,
          sicknessBenefitEligible: values.sicknessBenefitEligible,
          mandateHasOtherUopAtLeastMinimumBase: values.mandateHasOtherUopAtLeastMinimumBase,
          mandateOtherSocialBaseBeforeThisContract: values.mandateOtherSocialBaseBeforeThisContract,
          isOwnEmployerContract: values.isOwnEmployerContract,
          performedForOwnEmployer: values.performedForOwnEmployer,
          previousPensionDisabilityBase: values.previousPensionDisabilityBase,
          bonuses: values.bonuses ?? [],
        },
      });
      if (next.duringEmployment) {
        await setFieldValue('l4Base', next.duringEmployment.base, false);
      }
      if (next.afterEmployment) {
        await setFieldValue('l4BaseAfterTermination', next.afterEmployment.base, false);
      }
      setLastSignature(signature);
      setResult(next);
    } catch (cause) {
      if (cause instanceof MandateSicknessBaseError) {
        setError(intl.formatMessage({ id: cause.id }, cause.values));
      } else {
        console.error(cause);
        setError(intl.formatMessage({ id: 'l4-base-calculation-failed' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Button
        variant="outlined" type="button"
        disabled={loading || !values.workRelationId}
        onClick={calculateBase}
      >
        {intl.formatMessage({ id: 'l4-base-calculate-button' })}
      </Button>
      {error && <Alert severity="warning">{error}</Alert>}
      {result && (['duringEmployment', 'afterEmployment'] as const).map(context => {
        const item = result[context];
        if (!item) return null;
        return (
          <Alert key={context} severity="success">
            <Stack spacing={0.75}>
              <Typography variant="body2" fontWeight={700}>
                {intl.formatMessage(
                  { id: context === 'duringEmployment' ? 'l4-base-result-during' : 'l4-base-result-after' },
                  { amount: item.base.toFixed(2) },
                )}
              </Typography>
              {item.source === 'reusedPreviousBase' && (
                <Typography variant="body2">
                  {intl.formatMessage(
                    { id: 'l4-base-reused-previous' },
                    { period: item.reusedFromPeriod ?? '—' },
                  )}
                </Typography>
              )}
              {item.source === 'history' && (
                <Typography variant="body2">
                  {intl.formatMessage({ id: 'l4-base-reference-period' }, {
                    start: item.referencePeriod.start,
                    end: item.referencePeriod.end,
                    used: item.usedPeriods.join(', '),
                  })}
                </Typography>
              )}
              {lastSignature !== signature && (
                <Typography variant="body2" fontWeight={600}>
                  {intl.formatMessage({ id: 'l4-base-result-stale' })}
                </Typography>
              )}
            </Stack>
          </Alert>
        );
      })}
    </Stack>
  );
};

const normalizeSalaryValues = (
  values: SalaryCalculatorValues,
): SalaryCalculatorValues => {
  const legacyValues = values as SalaryCalculatorValues & LegacySalaryBonusValues;

  let bonuses = Array.isArray(legacyValues.bonuses)
    ? legacyValues.bonuses
    : [];

  // Temporary read compatibility for salary records created before bonuses[]
  // was introduced. New calculations and new UI never write these old fields.
  if (bonuses.length === 0) {
    const legacyBonusTotal =
      (legacyValues.attendanceBonus ?? 0) +
      (legacyValues.discretionaryBonus ?? 0) +
      (legacyValues.otherBonus ?? 0);

    if (legacyBonusTotal > 0) {
      bonuses = [
        {
          id: 'legacy-bonus-total',
          name: 'Legacy bonuses',
          amount: legacyBonusTotal,
          frequency: 'monthly',
        },
      ];
    }
  }

  return applySalaryFieldDefaults(
    {
      ...values,
      bonuses,
      l4: normalizeL4Ranges(values.l4),
    },
    metadataDrivenFieldConfigs,
  );
};


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

const SalaryTabAvailabilityGuard = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: number;
  setActiveTab: (value: number) => void;
}) => {
  const { values } = useFormikContext<SalaryCalculatorValues>();

  useEffect(() => {
    const disabledTabs =
      values.workRateType === 'uod_fixed'
        ? [3, 4, 5]
        : values.workRateType === 'mandate_hourly'
          ? [3, 5]
          : [];

    if (disabledTabs.includes(activeTab)) {
      setActiveTab(1);
    }
  }, [
    activeTab,
    setActiveTab,
    values.workRateType,
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

          const disabledTabs =
            values.workRateType === 'uod_fixed'
              ? [3, 4, 5]
              : values.workRateType === 'mandate_hourly'
                ? [3, 5]
                : [];

          return (
            <>
              <Form>
                <SalaryTabAvailabilityGuard activeTab={value} setActiveTab={setValue} />

                {type === 'create' && !authLoading && user && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      width: '100%',
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        width: '320px',
                        maxWidth: '100%',
                        minWidth: 0,
                        flexShrink: 1,
                      }}
                    >
                      <WorkRelationSelector formMode={type} />
                    </Box>

                    <CarryForwardContextLoader formMode={type} />
                  </Box>
                )}

                <CardTabs value={value} labels={labels} onChange={changeTab} disabledTabs={disabledTabs}/>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    mt: 3,
                  }}
                >
                  <Stack
                    direction={isMidScreen ? 'column' : 'row'}
                    spacing={isMidScreen ? 2 : 0}
                    justifyContent={isMidScreen ? 'center' : 'space-between'}
                    alignItems={isMidScreen ? 'center' : 'stretch'}
                    sx={{
                      width: '100%',
                      maxWidth: isMidScreen ? '400px' : 'none',
                      mx: 'auto',
                    }}
                  >
                    <Box
                      sx={{
                        mt: 3,
                        width: '320px',
                        maxWidth: '100%',
                        mx: isMidScreen ? 'auto' : 0,
                      }}
                    >
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
                              workRelationId={values.workRelationId}
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
                            <Stack spacing={1.5} width={'320px'} maxWidth={'100%'}>
                              <FormikNumberField name="l4Base" labelId="l4-base"/>
                              <DynamicSalaryFields
                                fields={l4FieldConfigs}
                                values={values}
                                formMode={type}
                                setFieldValue={setFieldValue}
                              />
                              <UopL4BaseCalculator />
                              <MandateL4BaseCalculator />
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
                                    const start = range.start.format("YYYY-MM-DD");const end = range.end.format("YYYY-MM-DD");

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
                            <UopVacationBaseCalculator />
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
                    <Box
                      sx={{
                        mt: isMidScreen ? 3 : 7,
                        width: isMidScreen ? '100%' : 'auto',
                        maxWidth: isMidScreen ? '400px' : 'none',
                        mx: isMidScreen ? 'auto' : 0,
                      }}
                    >
                      {calculation ? (
                        <TaxChart calculation={calculation}/>
                      ) : (
                        <Alert
                          severity="warning"
                          sx={{
                            maxWidth: isMidScreen ? '400px' : 320,
                            mx: isMidScreen ? 'auto' : 0,
                            ml: isMidScreen ? 0 : 4,
                            mt: isMidScreen ? 2 : 0,
                          }}
                        >
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