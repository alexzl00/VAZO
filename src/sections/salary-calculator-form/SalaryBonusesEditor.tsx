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
  `bonus-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createEmptyBonus = (): SalaryBonus => ({
  id: createBonusId(),
  name: '',
  amount: 0,
  frequency: 'monthly',
});

export default function SalaryBonusesEditor({
  bonuses,
  setFieldValue,
}: SalaryBonusesEditorProps) {
  const intl = useIntl();

  const updateBonus = (
    index: number,
    patch: Partial<SalaryBonus>,
  ) => {
    const next = bonuses.map((bonus, bonusIndex) =>
      bonusIndex === index
        ? { ...bonus, ...patch }
        : bonus,
    );

    setFieldValue('bonuses', next);
  };

  const removeBonus = (index: number) => {
    setFieldValue(
      'bonuses',
      bonuses.filter((_, bonusIndex) => bonusIndex !== index),
    );
  };

  const addBonus = () => {
    setFieldValue('bonuses', [
      ...bonuses,
      createEmptyBonus(),
    ]);
  };

  return (
    <Stack spacing={2}>
      {bonuses.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {intl.formatMessage({
            id: 'rate-and-bonuses-empty',
            defaultMessage: 'No bonuses added.',
          })}
        </Typography>
      )}

      {bonuses.map((bonus, index) => (
        <Box
          key={bonus.id}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label={intl.formatMessage({
                id: 'rate-and-bonuses-bonus-name',
                defaultMessage: 'Bonus name',
              })}
              value={bonus.name}
              onChange={(event) => {
                updateBonus(index, {
                  name: event.target.value,
                });
              }}
            />

            <TextField
              fullWidth
              size="small"
              type="number"
              label={intl.formatMessage({
                id: 'rate-and-bonuses-bonus-amount',
                defaultMessage: 'Amount',
              })}
              value={bonus.amount}
              inputProps={{
                min: 0,
                step: 0.01,
              }}
              onChange={(event) => {
                const value = Number(event.target.value);

                updateBonus(index, {
                  amount: Number.isFinite(value)
                    ? Math.max(0, value)
                    : 0,
                });
              }}
              InputProps={{
                endAdornment: (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    zł
                  </Typography>
                ),
              }}
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
                onChange={(event) => {
                  updateBonus(index, {
                    frequency: event.target.value as BonusFrequency,
                  });
                }}
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

            <Button
              type="button"
              color="error"
              variant="text"
              onClick={() => removeBonus(index)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {intl.formatMessage({
                id: 'rate-and-bonuses-remove-bonus',
                defaultMessage: 'Remove bonus',
              })}
            </Button>
          </Stack>
        </Box>
      ))}

      <Button
        type="button"
        variant="outlined"
        onClick={addBonus}
      >
        {intl.formatMessage({
          id: 'rate-and-bonuses-add-bonus',
          defaultMessage: 'Add bonus',
        })}
      </Button>
    </Stack>
  );
}
