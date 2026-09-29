import * as Yup from 'yup';

import type {
  SalaryCalculatorValues,
  WorkRate,
} from '../../../types/salaryCalculator';

export type SalaryFieldType = 'number' | 'checkbox' | 'select';

export type SalaryFieldOption = {
  value: string | number;
  label?: string;
  labelId?: string;
};

export type SalaryFormMode = 'create' | 'update';

export type AdvancedSalaryFieldGroup =
  | 'l4'
  | 'vacation'
  | 'taxes'
  | 'additional';

export type SalaryFieldRuntimeContext = {
  formMode: SalaryFormMode;
};

export type SalaryFieldChangeContext = {
  values: SalaryCalculatorValues;
  setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
};

export type SalaryFieldValidation = {
  required?: boolean;
  min?: number;
  max?: number;
  maxField?: keyof SalaryCalculatorValues;
  typeErrorId?: string;
  requiredMessageId?: string;
  minMessageId?: string;
  maxMessageId?: string;
  maxFieldMessageId?: string;
};

export type SalaryFieldValue =
  SalaryCalculatorValues[keyof SalaryCalculatorValues];

export type SalaryFieldDefaultValue =
  | SalaryFieldValue
  | ((values: SalaryCalculatorValues) => SalaryFieldValue);

export type SalaryFieldConfig = {
  name: keyof SalaryCalculatorValues;
  type: SalaryFieldType;
  labelId: string;
  helperTextId?: string;

  contracts?: WorkRate[];
  options?: SalaryFieldOption[];

  unit?: string | ((values: SalaryCalculatorValues) => string | undefined);

  defaultValue?: SalaryFieldDefaultValue;

  visibleWhen?: (values: SalaryCalculatorValues) => boolean;
  disabledWhen?: (
    values: SalaryCalculatorValues,
    context: SalaryFieldRuntimeContext,
  ) => boolean;

  onChange?: (
    value: unknown,
    context: SalaryFieldChangeContext,
  ) => void;

  validation?: SalaryFieldValidation;
};

export type AdvancedSalaryFieldConfig = SalaryFieldConfig & {
  advancedGroup: AdvancedSalaryFieldGroup;
};

export type SalaryValidationMessageFormatter = (
  id: string,
  values?: Record<string, string | number>,
) => string;

export const isSalaryFieldVisible = (
  config: SalaryFieldConfig,
  values: SalaryCalculatorValues,
) => {
  if (
    config.contracts &&
    !config.contracts.includes(values.workRateType)
  ) {
    return false;
  }

  if (config.visibleWhen && !config.visibleWhen(values)) {
    return false;
  }

  return true;
};

export const resolveSalaryFieldUnit = (
  config: SalaryFieldConfig,
  values: SalaryCalculatorValues,
) => {
  if (!config.unit) return undefined;

  return typeof config.unit === 'function'
    ? config.unit(values)
    : config.unit;
};

export const applySalaryFieldDefaults = (
  values: SalaryCalculatorValues,
  configs: SalaryFieldConfig[],
): SalaryCalculatorValues => {
  const normalized = { ...values } as SalaryCalculatorValues;

  for (const config of configs) {
    const currentValue = normalized[config.name];

    if (
      currentValue !== undefined &&
      currentValue !== null
    ) {
      continue;
    }

    if (config.defaultValue === undefined) {
      continue;
    }

    const nextValue =
      typeof config.defaultValue === 'function'
        ? (config.defaultValue as (values: SalaryCalculatorValues) => unknown)(normalized)
        : config.defaultValue;

    (normalized as Record<string, unknown>)[config.name] = nextValue;
  }

  return normalized;
};

const buildFieldSchema = (
  config: SalaryFieldConfig,
  formatMessage: SalaryValidationMessageFormatter,
): Yup.AnySchema => {
  const validation = config.validation ?? {};
  const required = validation.required ?? false;

  const requiredMessage = () =>
    formatMessage(validation.requiredMessageId ?? 'validation-required');

  if (config.type === 'checkbox') {
    let schema = Yup.boolean();

    if (required) {
      schema = schema.required(requiredMessage());
    }

    return schema;
  }

  if (config.type === 'number') {
    let schema = Yup.number().typeError(
      formatMessage(validation.typeErrorId ?? 'validation-number-invalid'),
    );

    if (validation.min !== undefined) {
      schema = schema.min(
        validation.min,
        formatMessage(
          validation.minMessageId ?? 'validation-number-min',
          { min: validation.min },
        ),
      );
    }

    if (validation.max !== undefined) {
      schema = schema.max(
        validation.max,
        formatMessage(
          validation.maxMessageId ?? 'validation-number-max',
          { max: validation.max },
        ),
      );
    }

    if (validation.maxField !== undefined) {
      schema = schema.max(
        Yup.ref(String(validation.maxField)),
        formatMessage(
          validation.maxFieldMessageId ?? 'validation-number-max-field',
          { field: String(validation.maxField) },
        ),
      );
    }

    if (required) {
      schema = schema.required(requiredMessage());
    }

    return schema;
  }

  const allowedValues = config.options?.map((option) => option.value) ?? [];
  let schema = Yup.mixed();

  if (allowedValues.length > 0) {
    schema = schema.oneOf(allowedValues);
  }

  if (required) {
    schema = schema.required(requiredMessage());
  }

  return schema;
};

export const buildSalaryFieldValidationShape = (
  configs: SalaryFieldConfig[],
  formatMessage: SalaryValidationMessageFormatter,
): Partial<Record<keyof SalaryCalculatorValues, Yup.AnySchema>> => {
  return configs.reduce<Partial<Record<keyof SalaryCalculatorValues, Yup.AnySchema>>>(
    (shape, config) => {
      shape[config.name] = buildFieldSchema(config, formatMessage);
      return shape;
    },
    {},
  );
};
