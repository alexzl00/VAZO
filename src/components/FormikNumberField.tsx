import { Field } from 'formik';
import { Stack, TextField, InputLabel, FormHelperText } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import type { FieldProps } from 'formik';

type NumberFieldProps = {
  name: string;
  labelId: string;
  unit?: string;
  disabled?: boolean;
};

const FormikNumberField = ({ name, labelId, unit, disabled }: NumberFieldProps) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps<number>) => {
        const errorText =
          form.touched[name] && form.errors[name] ? String(form.errors[name]) : '';
        const hasError = Boolean(errorText);

        return (
          <Stack spacing={1}>
            <InputLabel>
              <FormattedMessage id={labelId} /> {unit && `(${unit})`}
            </InputLabel>
            <TextField
              {...field}
              type="number"
              disabled={disabled}
              error={hasError}
            />
            {hasError && <FormHelperText error>{errorText}</FormHelperText>}
          </Stack>
        );
      }}
    </Field>
  );
};

export default FormikNumberField;