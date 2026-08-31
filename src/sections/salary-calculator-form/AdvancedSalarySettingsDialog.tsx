import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
} from '../../types/salaryCalculator';
import DynamicSalaryFields from './DynamicSalaryFields';
import { advancedTaxFieldConfigs } from './metadata/salaryFieldConfigs';
import type { SalaryFormMode } from './metadata/salaryFieldMetadata';

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

export default function AdvancedSalarySettingsDialog({
  open,
  onClose,
  values,
  formMode,
  setFieldValue,
}: AdvancedSalarySettingsDialogProps) {
  const intl = useIntl();

  const formatBonusFrequency = (frequency: SalaryBonus['frequency']) => {
    switch (frequency) {
      case 'monthly':
        return intl.formatMessage({
          id: 'bonus-frequency-monthly',
          defaultMessage: 'Monthly',
        });
      case 'quarterly':
        return intl.formatMessage({
          id: 'bonus-frequency-quarterly',
          defaultMessage: 'Quarterly',
        });
      case 'annual':
        return intl.formatMessage({
          id: 'bonus-frequency-annual',
          defaultMessage: 'Annual',
        });
      case 'oneOff':
        return intl.formatMessage({
          id: 'bonus-frequency-one-off',
          defaultMessage: 'One-off',
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {intl.formatMessage({ id: 'advanced-settings-title' })}
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {intl.formatMessage({ id: 'advanced-settings-description' })}
        </Typography>

        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {intl.formatMessage({
                id: 'advanced-settings-bonuses-title',
                defaultMessage: 'Bonus settings',
              })}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              {intl.formatMessage({
                id: 'advanced-settings-bonuses-description',
                defaultMessage:
                  'These settings describe how each bonus works in the company. The calculator can use them later when deriving sickness and vacation bases from salary history.',
              })}
            </Typography>

            {(values.bonuses ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {intl.formatMessage({
                  id: 'advanced-settings-bonuses-empty',
                  defaultMessage:
                    'No bonuses have been added. Add a bonus in the Rate and bonuses tab first.',
                })}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {(values.bonuses ?? []).map((bonus) => (
                  <Box
                    key={bonus.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Stack spacing={2}>
                      <Box>
                        <Typography fontWeight={600}>
                          {bonus.name ||
                            intl.formatMessage({
                              id: 'bonus-unnamed',
                              defaultMessage: 'Unnamed bonus',
                            })}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {bonus.amount.toLocaleString('pl-PL', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          zł ·{' '}
{formatBonusFrequency(bonus.frequency)}
                        </Typography>
                      </Box>

                      <FormControl fullWidth size="small">
                        <InputLabel>
                          {intl.formatMessage({
                            id: 'advanced-settings-bonus-amount-type',
                            defaultMessage: 'Amount type',
                          })}
                        </InputLabel>

                        <Select
                          value={bonus.amountType ?? ''}
                          label={intl.formatMessage({
                            id: 'advanced-settings-bonus-amount-type',
                            defaultMessage: 'Amount type',
                          })}
                          onChange={(event) => {
                            const value = event.target.value as '' | BonusAmountType;

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
                              defaultMessage: 'Not configured',
                            })}
                          </MenuItem>

                          <MenuItem value="fixed">
                            {intl.formatMessage({
                              id: 'bonus-amount-type-fixed',
                              defaultMessage: 'Fixed',
                            })}
                          </MenuItem>

                          <MenuItem value="variable">
                            {intl.formatMessage({
                              id: 'bonus-amount-type-variable',
                              defaultMessage: 'Variable',
                            })}
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small">
                        <InputLabel>
                          {intl.formatMessage({
                            id: 'advanced-settings-bonus-sick-leave-treatment',
                            defaultMessage: 'Treatment during sick leave',
                          })}
                        </InputLabel>

                        <Select
                          value={bonus.sickLeaveTreatment ?? ''}
                          label={intl.formatMessage({
                            id: 'advanced-settings-bonus-sick-leave-treatment',
                            defaultMessage: 'Treatment during sick leave',
                          })}
                          onChange={(event) => {
                            const value = event.target.value as '' | SickLeaveTreatment;

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
                              defaultMessage: 'Not configured',
                            })}
                          </MenuItem>

                          <MenuItem value="paidInFull">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-paid-in-full',
                              defaultMessage: 'Paid in full',
                            })}
                          </MenuItem>

                          <MenuItem value="proportional">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-proportional',
                              defaultMessage: 'Reduced proportionally',
                            })}
                          </MenuItem>

                          <MenuItem value="nonProportional">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-non-proportional',
                              defaultMessage:
                                'Reduced according to company rules',
                            })}
                          </MenuItem>

                          <MenuItem value="notPaid">
                            {intl.formatMessage({
                              id: 'bonus-sick-leave-not-paid',
                              defaultMessage: 'Not paid during sick leave',
                            })}
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {intl.formatMessage({
                id: 'advanced-settings-payroll-title',
                defaultMessage: 'Payroll and tax settings',
              })}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <DynamicSalaryFields
                fields={advancedTaxFieldConfigs}
                values={values}
                formMode={formMode}
                setFieldValue={setFieldValue}
              />
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {intl.formatMessage({ id: 'close' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
