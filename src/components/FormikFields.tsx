import { Field } from 'formik';
import { Stack, TextField, InputLabel, FormHelperText, FormControl, Select, MenuItem } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import type { FieldProps } from 'formik';

interface NumberFieldProps {
  name: string;
  labelId: string;
  unit?: string;
  disabled?: boolean;
  onChange?: (value: number, form: any) => void; // add this
}

export const FormikNumberField = ({ name, labelId, unit, disabled, onChange }: NumberFieldProps) => {
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
              onChange={(e) => {
                const newValue = Number(e.target.value);
                form.setFieldValue(name, newValue);
                if (onChange) onChange(newValue, form);
              }}
            />
            {hasError && <FormHelperText error>{errorText}</FormHelperText>}
          </Stack>
        );
      }}
    </Field>
  );
};

type menuItemsT = {
  value: string | number;
  text: string | React.ReactNode;
}

type SelectFieldProps = {
  name: string;
  inputLabel: string;
  menuItems: menuItemsT[];
  onChange: (e: any) => void;
}

export const FomrikSelectField = ({ name, inputLabel, menuItems, onChange } : SelectFieldProps) => {
  const MenuItems = menuItems.map((item) => (
    <MenuItem value={item.value}>{item.text}</MenuItem>    
  ))

  return (
    <Stack spacing={1}>
      <InputLabel>
        <FormattedMessage id={inputLabel}/>
      </InputLabel>
      <Field name={name}>
        {({ field, form }: FieldProps<number>) => {
          const errorText =
            form.touched[name] && form.errors[name] ? String(form.errors[name]) : '';
          const hasError = Boolean(errorText);
          return (
            <>
              <FormControl fullWidth error={Boolean(form.touched[name] && form.errors[name])}>
                <Select
                  {...field}
                  sx={{ backgroundColor: 'white' }}
                  value={form.values[name]}
                  onChange={(e) => onChange(e)}
                >
                  {MenuItems}
                </Select>
              </FormControl>
              {hasError && (
                <FormHelperText error>{errorText}</FormHelperText>
              )}
            </>
          )
        }}
      </Field>
    </Stack>
  )
}