import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useIntl } from 'react-intl';

import type {
  BonusFrequency,
  BonusPaymentType,
  SalaryBonus,
} from '../../types/salaryCalculator';

type SalaryBonusesEditorProps = {
  bonuses: SalaryBonus[];
  setFieldValue: (
    field: string,
    value: unknown,
    shouldValidate?: boolean,
  ) => void;
};

const createBonusId = () =>
  `bonus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function SalaryBonusesEditor({
  bonuses,
  setFieldValue,
}: SalaryBonusesEditorProps) {
  const intl = useIntl();

  const updateBonus = (
    bonusId: string,
    patch: Partial<SalaryBonus>,
  ) => {
    setFieldValue(
      'bonuses',
      bonuses.map((bonus) =>
        bonus.id === bonusId
          ? { ...bonus, ...patch }
          : bonus,
      ),
      true,
    );
  };

  const addBonus = () => {
    const nextBonus: SalaryBonus = {
      id: createBonusId(),
      name: '',
      amount: 0,
      frequency: 'monthly',
      paymentType: 'cash',
    };

    setFieldValue('bonuses', [...bonuses, nextBonus], true);
  };

  const removeBonus = (bonusId: string) => {
    setFieldValue(
      'bonuses',
      bonuses.filter((bonus) => bonus.id !== bonusId),
      true,
    );
  };

  return (
    <Stack spacing={2}>
      {bonuses.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {intl.formatMessage({
            id: 'rate-and-bonuses-empty',
            defaultMessage: 'No bonuses added.',
          })}
        </Typography>
      )}

      {bonuses.map((bonus) => (
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
            <TextField
              size="small"
              fullWidth
              label={intl.formatMessage({
                id: 'rate-and-bonuses-bonus-name',
                defaultMessage: 'Bonus name',
              })}
              value={bonus.name}
              onChange={(event) =>
                updateBonus(bonus.id, {
                  name: event.target.value,
                })
              }
            />

            <TextField
              size="small"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              label={intl.formatMessage({
                id: 'rate-and-bonuses-bonus-amount',
                defaultMessage: 'Amount',
              })}
              value={bonus.amount}
              onChange={(event) =>
                updateBonus(bonus.id, {
                  amount:
                    event.target.value === ''
                      ? 0
                      : Number(event.target.value),
                })
              }
            />

            <FormControl fullWidth size="small">
              <InputLabel>
                {intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-frequency',
                  defaultMessage: 'Frequency',
                })}
              </InputLabel>

              <Select
                value={bonus.frequency}
                label={intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-frequency',
                  defaultMessage: 'Frequency',
                })}
                onChange={(event) =>
                  updateBonus(bonus.id, {
                    frequency: event.target.value as BonusFrequency,
                  })
                }
              >
                <MenuItem value="monthly">
                  {intl.formatMessage({
                    id: 'bonus-frequency-monthly',
                    defaultMessage: 'Monthly',
                  })}
                </MenuItem>
                <MenuItem value="quarterly">
                  {intl.formatMessage({
                    id: 'bonus-frequency-quarterly',
                    defaultMessage: 'Quarterly',
                  })}
                </MenuItem>
                <MenuItem value="annual">
                  {intl.formatMessage({
                    id: 'bonus-frequency-annual',
                    defaultMessage: 'Annual',
                  })}
                </MenuItem>
                <MenuItem value="oneOff">
                  {intl.formatMessage({
                    id: 'bonus-frequency-one-off',
                    defaultMessage: 'One-off',
                  })}
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>
                {intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-payment-type',
                  defaultMessage: 'Payment type',
                })}
              </InputLabel>

              <Select
                value={bonus.paymentType ?? 'cash'}
                label={intl.formatMessage({
                  id: 'rate-and-bonuses-bonus-payment-type',
                  defaultMessage: 'Payment type',
                })}
                onChange={(event) =>
                  updateBonus(bonus.id, {
                    paymentType: event.target.value as BonusPaymentType,
                  })
                }
              >
                <MenuItem value="cash">
                  {intl.formatMessage({
                    id: 'bonus-payment-cash',
                    defaultMessage: 'Cash',
                  })}
                </MenuItem>
                <MenuItem value="nonCash">
                  {intl.formatMessage({
                    id: 'bonus-payment-non-cash',
                    defaultMessage: 'Non-cash',
                  })}
                </MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              color="error"
              onClick={() => removeBonus(bonus.id)}
            >
              {intl.formatMessage({
                id: 'rate-and-bonuses-remove-bonus',
                defaultMessage: 'Remove bonus',
              })}
            </Button>
          </Stack>
        </Box>
      ))}

      <Button variant="outlined" onClick={addBonus}>
        {intl.formatMessage({
          id: 'rate-and-bonuses-add-bonus',
          defaultMessage: 'Add bonus',
        })}
      </Button>
    </Stack>
  );
}
