import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useIntl } from 'react-intl';

import type { SalaryCalculatorValues } from '../../types/salaryCalculator';
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {intl.formatMessage({ id: 'advanced-settings-title' })}
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {intl.formatMessage({ id: 'advanced-settings-description' })}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <DynamicSalaryFields
            fields={advancedTaxFieldConfigs}
            values={values}
            formMode={formMode}
            setFieldValue={setFieldValue}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {intl.formatMessage({ id: 'close' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
