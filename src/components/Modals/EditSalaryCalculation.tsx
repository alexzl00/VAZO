import { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormHelperText,
  InputLabel
} from '@mui/material';
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAlt from "@mui/icons-material/RestartAlt";

import { alpha } from '@mui/material/styles';
import { CheckCircleOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Field } from 'formik';
import type { FieldProps, FormikErrors } from 'formik';
import { FormattedMessage } from 'react-intl';

import { FormikNumberField } from '../FormikFields';
import type { SalaryCalculatorValues } from '../../types/salaryCalculator';

const palette = {
  accent: '#5ddfcc',
  textDark: '#1e2a47',
};

interface Props {
  open: boolean;
  onClose: () => void;
  setFieldValue: 
    (field: string, value: any, shouldValidate?: boolean | undefined) 
    => Promise<void | FormikErrors<SalaryCalculatorValues>>
  isInitiallyOverride: boolean;
  deleteOverride?: () => void;
  values: {
    netSalaryOverride: number | null;
    grossSalaryOverride: number | null;
    reason: string | null;
  };
  initialValues: {
    netSalaryOverride: number | null;
    grossSalaryOverride: number | null;
    reason: string | null;
  };
}

const EditSalaryCalculation: React.FC<Props> = ({ open, onClose, setFieldValue, isInitiallyOverride, deleteOverride, values, initialValues }) => {
  const [overrides, setOverrides] = useState({
    netSalaryOverride: values.netSalaryOverride ?? null,
    grossSalaryOverride: values.grossSalaryOverride ?? null,
    reason: values.reason ?? null,
  });

  const hasChanges = 
    overrides.netSalaryOverride !== initialValues.netSalaryOverride ||
    overrides.grossSalaryOverride !== initialValues.grossSalaryOverride ||
    overrides.reason !== initialValues.reason;

  console.log("Initial values:", initialValues);
  console.log("Current override values:", overrides);
  console.log("Has changes:", hasChanges);

  useEffect(() => {
      if (!values) return;

      setOverrides({
        netSalaryOverride: values.netSalaryOverride ?? null,
        grossSalaryOverride: values.grossSalaryOverride ?? null,
        reason: values.reason ?? null,
      });
    }, [values]);

  const handleOverrideChange = (field: string, value: number | string | null) => {
    setOverrides(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setFieldValue('netSalaryOverride', overrides.netSalaryOverride);
    setFieldValue('grossSalaryOverride', overrides.grossSalaryOverride);
    setFieldValue('reason', overrides.reason);
    onClose();
  };

  const clearOverrides = () => {
    setOverrides({
      netSalaryOverride: null,
      grossSalaryOverride: null,
      reason: null,
    });
    setFieldValue('netSalaryOverride', null);
    setFieldValue('grossSalaryOverride', null);
    setFieldValue('reason', null);
  };

  const resetToInitialValues = () => {
    setOverrides({
      netSalaryOverride: initialValues.netSalaryOverride,
      grossSalaryOverride: initialValues.grossSalaryOverride,
      reason: initialValues.reason,
    });
    setFieldValue('netSalaryOverride', initialValues.netSalaryOverride);
    setFieldValue('grossSalaryOverride', initialValues.grossSalaryOverride);
    setFieldValue('reason', initialValues.reason);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          borderRadius: 4,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          backgroundColor: alpha('#ffffff', 0.95),
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          fontWeight: 800,
          color: palette.textDark,
        }}
      >
        <ExclamationCircleOutlined style={{ color: palette.accent, fontSize: 22 }} />
        <FormattedMessage id={"calculation-edit-title"} />
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>

          <Stack spacing={1}>
            <InputLabel>
              <FormattedMessage id={"calculation-edit-net-salary-override"}/>
            </InputLabel>
            <TextField
              fullWidth
              type="number"
              value={overrides.netSalaryOverride ?? ""}
              onChange={(e) =>
                handleOverrideChange(
                  "netSalaryOverride",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />
          </Stack>

          <Stack spacing={1}>
            <InputLabel>
              <FormattedMessage id={"calculation-edit-gross-salary-override"}/>
            </InputLabel>
            <TextField
              fullWidth
              type="number"
              value={overrides.grossSalaryOverride ?? ""}
              onChange={(e) =>
                handleOverrideChange(
                  "grossSalaryOverride",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />
          </Stack>

          <Stack spacing={1}>
            <InputLabel>
              <FormattedMessage id={"calculation-edit-reason"}/>
            </InputLabel>
            <TextField
              fullWidth
              multiline
              value={overrides.reason ?? ""}
              minRows={4}
              onChange={(e) =>
                handleOverrideChange(
                  "reason",
                  e.target.value === "" ? null : e.target.value
                )
              }
            />
          </Stack>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack direction={'row'} spacing={2} sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        
          <Stack direction={'row'} spacing={1} alignItems={'center'} height={'48px'}>
            {isInitiallyOverride &&
              (
                <Tooltip
                  title={<FormattedMessage id="calculation-edit-delete-override" />}
                >
                  <IconButton 
                    onClick={
                      () => {
                        if (!deleteOverride) return;
                        clearOverrides();
                        deleteOverride();
                      }
                  }
                  >
                    <DeleteIcon 
                      fontSize="small" 
                      sx={{ fontSize: 32, color: "rgb(250, 70, 70)", padding: 0 }} 
                    />
                  </IconButton>
                </Tooltip>
              )
            }

            {hasChanges &&
              (
                <Tooltip
                  title={<FormattedMessage id="calculation-edit-reset-override" />}
                >
                  <IconButton 
                    onClick={
                      () => {
                        resetToInitialValues();
                      }
                  }
                  >
                    <RestartAlt 
                      fontSize="small"
                      sx={{ fontSize: 32, color: "grey", padding: 0 }} 
                    />
                  </IconButton>
                </Tooltip>
              )
            }
          </Stack>

          <Stack direction={'row'} spacing={1} height={'40px'}>
            <Button
              variant="outlined"
              onClick={onClose}
              startIcon={<CloseOutlined />}
              sx={{
                border: `2px solid ${alpha(palette.accent, 0.7)}`,
                color: palette.accent,
                borderRadius: '24px',
                fontWeight: 700,
              }}
            >
              <FormattedMessage id="no" />
            </Button>

            <Button
              variant="contained"
              startIcon={<CheckCircleOutlined />}
              sx={{
                backgroundColor: alpha(palette.accent, 0.25),
                color: palette.textDark,
                border: `2px solid ${palette.accent}`,
                borderRadius: '24px',
                fontWeight: 700,
                ':hover': {
                  backgroundColor: palette.accent,
                },
              }}
              onClick={handleSave}
            >
              <FormattedMessage id="save" />
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default EditSalaryCalculation;