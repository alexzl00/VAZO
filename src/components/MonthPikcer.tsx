import React from "react";
import { Stack, FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";
import { useIntl } from "react-intl";

interface MonthPickerProps {
  value: number | "";
  onChange: (value: number) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange, label, error, helperText }) => {
  const intl = useIntl();

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Stack spacing={1}>
      {label && <InputLabel>{label}</InputLabel>}
      <FormControl fullWidth error={error}>
        <Select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          displayEmpty
        >
          <MenuItem value="">
            {intl.formatMessage({ id: "month-picker-placeholder", defaultMessage: "Select month" })}
          </MenuItem>
          {months.map((month) => (
            <MenuItem key={month} value={month}>
              {intl.formatMessage({ id: `month-picker-name-${month}`, defaultMessage: `Month ${month}` })}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </Stack>
  );
};

export default MonthPicker;
