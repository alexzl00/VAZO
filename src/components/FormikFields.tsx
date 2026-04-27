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
          <Stack spacing={1} width={"320px"}>
            <InputLabel>
              <FormattedMessage id={labelId} /> {unit && `(${unit})`}
            </InputLabel>
            <TextField
              {...field}
              type="number"
              value={field.value === 0 ? '' : field.value}
              disabled={disabled}
              error={hasError}
              onFocus={() => {
                if (field.value === 0) {
                  form.setFieldValue(name, 0);
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  form.setFieldValue(name, 0);
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                
                if (!/^\d*\.?\d*$/.test(val)) return;

                form.setFieldValue(name, val === '' ? 0 : Number(val));

                if (onChange && val !== '') {
                  onChange(Number(val), form);
                }
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
  disabled?: boolean;
}

export const FomrikSelectField = ({ name, inputLabel, menuItems, onChange, disabled }: SelectFieldProps) => {
  const MenuItems = menuItems.map((item) => (
    <MenuItem value={item.value}>{item.text}</MenuItem>    
  ))

  return (
    <Stack spacing={1} width={"320px"}>
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
                  disabled={disabled}
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