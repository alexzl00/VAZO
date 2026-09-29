import type { ReactNode } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useIntl } from 'react-intl';

import type {
  BonusAmountType,
  SalaryBonus,
  SalaryCalculatorValues,
  SickLeaveTreatment,
  VacationTreatment,
} from '../../types/salaryCalculator';
import DynamicSalaryFields from './DynamicSalaryFields';
import { advancedTaxFieldConfigs } from './metadata/salaryFieldConfigs';
import {
  isSalaryFieldVisible,
  type AdvancedSalaryFieldGroup,
  type SalaryFormMode,
} from './metadata/salaryFieldMetadata';

type AdvancedSalarySettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  values: SalaryCalculatorValues;
  formMode: SalaryFormMode;
  setFieldValue: (
    field: string,
    value: unknown,
    shouldValidate?: boolean,
  ) => void;
};

type SettingsSectionProps = {
  title: string;
  backgroundColor: string;
  accentColor: string;
  children: ReactNode;
  description?: string;
};

const COLORS = {
  indigo: '#3B4DB3',
  indigoDark: '#23326D',

  bonusBg: '#F3F5FF',
  bonusAccent: '#3B4DB3',

  l4Bg: '#FFF5ED',
  l4Accent: '#B85C1E',

  vacationBg: '#EFF9F3',
  vacationAccent: '#16794A',

  taxesBg: '#EEF6FF',
  taxesAccent: '#2B67A9',

  additionalBg: '#F7F2FC',
  additionalAccent: '#76529C',
} as const;

const neutralFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fff',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.55)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.75)',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'text.primary',
  },
} as const;

const SettingsSection = ({
  title,
  backgroundColor,
  accentColor,
  description,
  children,
}: SettingsSectionProps) => (
  <Box
    sx={{
      borderRadius: 2,
      backgroundColor,
      p: { xs: 2, sm: 2.5 },
      boxShadow: '0 3px 14px rgba(25, 35, 70, 0.055)',
      border: '1px solid rgba(0, 0, 0, 0.045)',
    }}
  >
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="h6"
        sx={{
          color: accentColor,
          fontWeight: 700,
          lineHeight: 1.25,
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.55,
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>

    {children}
  </Box>
);


export default function AdvancedSalarySettingsDialog({
  open,
  onClose,
  values,
  formMode,
  setFieldValue,
}: AdvancedSalarySettingsDialogProps) {
  const intl = useIntl();

  const isUop =
    values.workRateType === 'uop_monthly'
    || values.workRateType === 'uop_hourly';

  const formatBonusFrequency = (frequency: SalaryBonus['frequency']) => {
    switch (frequency) {
      case 'monthly':
        return intl.formatMessage({
          id: 'bonus-frequency-monthly',
          defaultMessage: 'Miesięczna',
        });
      case 'quarterly':
        return intl.formatMessage({
          id: 'bonus-frequency-quarterly',
          defaultMessage: 'Kwartalna',
        });
      case 'annual':
        return intl.formatMessage({
          id: 'bonus-frequency-annual',
          defaultMessage: 'Roczna',
        });
      case 'oneOff':
        return intl.formatMessage({
          id: 'bonus-frequency-one-off',
          defaultMessage: 'Jednorazowa',
        });
    }
  };

  const updateBonus = (
    bonusId: string,
    patch: Partial<SalaryBonus>,
  ) => {
    const nextBonuses = (values.bonuses ?? []).map((bonus) =>
      bonus.id === bonusId
        ? { ...bonus, ...patch }
        : bonus,
    );

    setFieldValue('bonuses', nextBonuses);
  };

  const getAdvancedFields = (
    group: AdvancedSalaryFieldGroup,
  ) =>
    advancedTaxFieldConfigs.filter(
      (field) =>
        field.advancedGroup === group
        && isSalaryFieldVisible(field, values),
    );

  const l4Fields = getAdvancedFields('l4');
  const vacationFields = getAdvancedFields('vacation');
  const taxesFields = getAdvancedFields('taxes');
  const additionalFields = getAdvancedFields('additional');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.2,
          backgroundColor: '#F3F5FF',
          color: COLORS.indigoDark,
          fontWeight: 700,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {intl.formatMessage({ id: 'advanced-settings-title' })}
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          py: 3,
          backgroundColor: '#FBFBFD',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            maxWidth: 720,
            lineHeight: 1.65,
          }}
        >
          {intl.formatMessage({ id: 'advanced-settings-description' })}
        </Typography>

        <Stack spacing={2.5}>
          {/* BONUSES */}
          <SettingsSection
            title={intl.formatMessage({
              id: 'advanced-settings-bonuses-title',
              defaultMessage: 'Ustawienia premii',
            })}
            description={intl.formatMessage({
              id: 'advanced-settings-bonuses-description',
              defaultMessage:
                'Określ, jak każda premia jest rozliczana podczas L4 i urlopu.',
            })}
            backgroundColor={COLORS.bonusBg}
            accentColor={COLORS.bonusAccent}
          >
            {(values.bonuses ?? []).length === 0 ? (
              <Box
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                  p: 2,
                  boxShadow: '0 2px 8px rgba(35, 50, 109, 0.045)',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {intl.formatMessage({
                    id: 'advanced-settings-bonuses-empty',
                    defaultMessage:
                      'Nie dodano żadnych premii. Najpierw dodaj premię w zakładce „Stawka i premie”.',
                  })}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {(values.bonuses ?? []).map((bonus) => (
                  <Box
                    key={bonus.id}
                    sx={{
                      backgroundColor: '#fff',
                      borderRadius: 1.6,
                      p: 2,
                      boxShadow: '0 2px 9px rgba(35, 50, 109, 0.055)',
                    }}
                  >
                    <Stack spacing={1.75}>
                      <Box>
                        <Typography
                          sx={{
                            color: COLORS.indigoDark,
                            fontWeight: 700,
                          }}
                        >
                          {bonus.name ||
                            intl.formatMessage({
                              id: 'bonus-unnamed',
                              defaultMessage: 'Premia bez nazwy',
                            })}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.25 }}
                        >
                          {bonus.amount.toLocaleString('pl-PL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          zł · {formatBonusFrequency(bonus.frequency)}
                        </Typography>
                      </Box>

                      <FormControl fullWidth size="small" sx={neutralFieldSx}>
                        <InputLabel>
                          {intl.formatMessage({
                            id: 'advanced-settings-bonus-amount-type',
                            defaultMessage: 'Rodzaj kwoty',
                          })}
                        </InputLabel>

                        <Select
                          value={bonus.amountType ?? ''}
                          label={intl.formatMessage({
                            id: 'advanced-settings-bonus-amount-type',
                            defaultMessage: 'Rodzaj kwoty',
                          })}
                          onChange={(event) => {
                            const value =
                              event.target.value as '' | BonusAmountType;

                            updateBonus(bonus.id, {
                              amountType:
                                value === ''
                                  ? undefined
                                  : value,
                            });
                          }}
                        >
                          <MenuItem value="">
                            {intl.formatMessage({
                              id: 'bonus-setting-not-configured',
                              defaultMessage: 'Nie skonfigurowano',
                            })}
                          </MenuItem>

                          <MenuItem value="fixed">
                            {intl.formatMessage({
                              id: 'bonus-amount-type-fixed',
                              defaultMessage: 'Stała',
                            })}
                          </MenuItem>

                          <MenuItem value="variable">
                            {intl.formatMessage({
                              id: 'bonus-amount-type-variable',
                              defaultMessage: 'Zmienna',
                            })}
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small" sx={neutralFieldSx}>
                        <InputLabel>
                          {intl.formatMessage({
                            id: 'advanced-settings-bonus-sick-leave-treatment',
                            defaultMessage: 'Sposób rozliczania podczas L4',
                          })}
                        </InputLabel>

                        <Select
                          value={bonus.sickLeaveTreatment ?? ''}
                          label={intl.formatMessage({
                            id: 'advanced-settings-bonus-sick-leave-treatment',
                            defaultMessage: 'Sposób rozliczania podczas L4',
                          })}
                          onChange={(event) => {
                            const value =
                              event.target.value as '' | SickLeaveTreatment;

                            updateBonus(bonus.id, {
                              sickLeaveTreatment:
                                value === ''
                                  ? undefined
                                  : value,
                            });
                          }}
                        >
                          <MenuItem value="">
                            {intl.formatMessage({
                              id: 'bonus-setting-not-configured',
                              defaultMessage: 'Nie skonfigurowano',
                            })}
                          </MenuItem>

                          <MenuItem value="paidInFull">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-paid-in-full',
                              defaultMessage: 'Wypłacana w pełnej wysokości',
                            })}
                          </MenuItem>

                          <MenuItem value="proportional">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-proportional',
                              defaultMessage: 'Pomniejszana proporcjonalnie',
                            })}
                          </MenuItem>

                          <MenuItem value="nonProportional">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-non-proportional',
                              defaultMessage:
                                'Pomniejszana według zasad firmy',
                            })}
                          </MenuItem>

                          <MenuItem value="notPaid">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-not-paid',
                              defaultMessage: 'Niewypłacana za okres L4',
                            })}
                          </MenuItem>
                        </Select>
                      </FormControl>

                      {isUop && (
                        <FormControl
                          fullWidth
                          size="small"
                          sx={neutralFieldSx}
                        >
                          <InputLabel>
                            {intl.formatMessage({
                              id: 'advanced-settings-bonus-vacation-treatment',
                              defaultMessage:
                                'Sposób rozliczania podczas urlopu',
                            })}
                          </InputLabel>

                          <Select
                            value={bonus.vacationTreatment ?? ''}
                            label={intl.formatMessage({
                              id: 'advanced-settings-bonus-vacation-treatment',
                              defaultMessage:
                                'Sposób rozliczania podczas urlopu',
                            })}
                            onChange={(event) => {
                              const value =
                                event.target.value as '' | VacationTreatment;

                              updateBonus(bonus.id, {
                                vacationTreatment:
                                  value === ''
                                    ? undefined
                                    : value,
                              });
                            }}
                          >
                            <MenuItem value="">
                              {intl.formatMessage({
                                id: 'bonus-setting-not-configured',
                                defaultMessage: 'Nie skonfigurowano',
                              })}
                            </MenuItem>

                            <MenuItem value="paidInFull">
                              {intl.formatMessage({
                                id: 'bonus-vacation-paid-in-full',
                                defaultMessage:
                                  'Wypłacana w pełnej wysokości',
                              })}
                            </MenuItem>

                            <MenuItem value="variableBase">
                              {intl.formatMessage({
                                id: 'bonus-vacation-variable-base',
                                defaultMessage:
                                  'Uwzględniana w zmiennej podstawie urlopowej',
                              })}
                            </MenuItem>

                            <MenuItem value="excluded">
                              {intl.formatMessage({
                                id: 'bonus-vacation-excluded',
                                defaultMessage:
                                  'Wyłączona z wynagrodzenia urlopowego',
                              })}
                            </MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </SettingsSection>

          {/* L4 */}
          {l4Fields.length > 0 && (
            <SettingsSection
              title={intl.formatMessage({
                id: 'advanced-settings-section-l4',
                defaultMessage: 'L4',
              })}
              backgroundColor={COLORS.l4Bg}
              accentColor={COLORS.l4Accent}
            >
              <Box
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                  p: 2,
                  '& .MuiOutlinedInput-root fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '& .MuiOutlinedInput-root:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.55)',
                  },
                  '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.75)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'text.primary',
                  },
                  '& .MuiCheckbox-root.Mui-checked': {
                    color: COLORS.l4Accent,
                  },
                }}
              >
                <DynamicSalaryFields
                  fields={l4Fields}
                  values={values}
                  formMode={formMode}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </SettingsSection>
          )}

          {/* VACATION */}
          {vacationFields.length > 0 && (
            <SettingsSection
              title={intl.formatMessage({
                id: 'advanced-settings-section-vacation',
                defaultMessage: 'Urlop',
              })}
              backgroundColor={COLORS.vacationBg}
              accentColor={COLORS.vacationAccent}
            >
              <Box
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                  p: 2,
                  '& .MuiOutlinedInput-root fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '& .MuiOutlinedInput-root:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.55)',
                  },
                  '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.75)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'text.primary',
                  },
                  '& .MuiCheckbox-root.Mui-checked': {
                    color: COLORS.vacationAccent,
                  },
                }}
              >
                <DynamicSalaryFields
                  fields={vacationFields}
                  values={values}
                  formMode={formMode}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </SettingsSection>
          )}

          {/* TAXES / INSURANCE */}
          {taxesFields.length > 0 && (
            <SettingsSection
              title={intl.formatMessage({
                id: 'advanced-settings-section-taxes',
                defaultMessage: 'Podatki i składki',
              })}
              backgroundColor={COLORS.taxesBg}
              accentColor={COLORS.taxesAccent}
            >
              <Box
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                  p: 2,
                  '& .MuiOutlinedInput-root fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '& .MuiOutlinedInput-root:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.55)',
                  },
                  '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.75)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'text.primary',
                  },
                  '& .MuiCheckbox-root.Mui-checked': {
                    color: COLORS.taxesAccent,
                  },
                }}
              >
                <DynamicSalaryFields
                  fields={taxesFields}
                  values={values}
                  formMode={formMode}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </SettingsSection>
          )}

          {/* ADDITIONAL */}
          {additionalFields.length > 0 && (
            <SettingsSection
              title={intl.formatMessage({
                id: 'advanced-settings-section-additional',
                defaultMessage: 'Dodatkowe',
              })}
              backgroundColor={COLORS.additionalBg}
              accentColor={COLORS.additionalAccent}
            >
              <Box
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                  p: 2,
                  '& .MuiOutlinedInput-root fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '& .MuiOutlinedInput-root:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.55)',
                  },
                  '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.75)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'text.primary',
                  },
                  '& .MuiCheckbox-root.Mui-checked': {
                    color: COLORS.additionalAccent,
                  },
                }}
              >
                <DynamicSalaryFields
                  fields={additionalFields}
                  values={values}
                  formMode={formMode}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </SettingsSection>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 1.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#fff',
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: COLORS.indigo,
            '&:hover': {
              backgroundColor: COLORS.indigoDark,
            },
          }}
        >
          {intl.formatMessage({ id: 'close' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
