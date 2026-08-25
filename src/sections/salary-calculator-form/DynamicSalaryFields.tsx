import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import { useIntl } from 'react-intl';

import {
  FormikNumberField,
  FomrikSelectField,
} from '../../components/FormikFields';

import type { SalaryCalculatorValues } from '../../types/salaryCalculator';
import type {
  SalaryFieldConfig,
  SalaryFormMode,
} from './metadata/salaryFieldMetadata';

import {
  isSalaryFieldVisible,
  resolveSalaryFieldUnit,
} from './metadata/salaryFieldMetadata';

type DynamicSalaryFieldsProps = {
  fields: SalaryFieldConfig[];
  values: SalaryCalculatorValues;
  formMode: SalaryFormMode;
  setFieldValue: (
    field: string,
    value: unknown,
    shouldValidate?: boolean,
  ) => void;
};

export default function DynamicSalaryFields({
  fields,
  values,
  formMode,
  setFieldValue,
}: DynamicSalaryFieldsProps) {
  const intl = useIntl();

  const runOnChange = (
    config: SalaryFieldConfig,
    nextValue: unknown,
  ) => {
    const nextValues = {
      ...values,
      [config.name]: nextValue,
    } as SalaryCalculatorValues;

    config.onChange?.(nextValue, {
      values: nextValues,
      setFieldValue,
    });
  };

  return (
    <Stack spacing={2}>
      {fields.map((config) => {
        if (!isSalaryFieldVisible(config, values)) {
          return null;
        }

        const disabled =
          config.disabledWhen?.(values, { formMode }) ?? false;

        if (config.type === 'checkbox') {
          return (
            <FormControlLabel
              key={String(config.name)}
              control={
                <Checkbox
                  name={String(config.name)}
                  checked={Boolean(values[config.name])}
                  disabled={disabled}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setFieldValue(String(config.name), nextValue);
                    runOnChange(config, nextValue);
                  }}
                />
              }
              label={intl.formatMessage({ id: config.labelId })}
            />
          );
        }

        if (config.type === 'number') {
          return (
            <FormikNumberField
              key={String(config.name)}
              name={String(config.name)}
              labelId={config.labelId}
              unit={resolveSalaryFieldUnit(config, values)}
              disabled={disabled}
              onChange={(nextValue) => {
                runOnChange(config, nextValue);
              }}
            />
          );
        }

        return (
          <FomrikSelectField
            key={String(config.name)}
            name={String(config.name)}
            inputLabel={config.labelId}
            disabled={disabled}
            menuItems={
              config.options?.map((option) => ({
                value: option.value,
                text: option.labelId
                  ? intl.formatMessage({ id: option.labelId })
                  : option.label ?? String(option.value),
              })) ?? []
            }
            onChange={(event) => {
              const nextValue = event.target.value;
              setFieldValue(String(config.name), nextValue);
              runOnChange(config, nextValue);
            }}
          />
        );
      })}
    </Stack>
  );
}
