import {
  TableHead as MuiTableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TextField,
  Select,
  MenuItem
} from '@mui/material';

import { contractTypes } from './SalariesTable';
import type { SalaryFilters } from '../../api/Salaries';

interface HeadProps {
  globalFilter: SalaryFilters;
  onFilterChange: (key: keyof SalaryFilters, value: string) => void;
}

export default function SalariesTableHead({ globalFilter, onFilterChange }: HeadProps) {
  return (
    <MuiTableHead>
      {/* Header row */}
      <TableRow>
        <TableCell align="center">Contract</TableCell>
        <TableCell align="center">Payment</TableCell>
        <TableCell align="center">Year</TableCell>
        <TableCell align="center">Month</TableCell>
        <TableCell align="center">Gross</TableCell>
        <TableCell align="center">Net</TableCell>
        <TableCell align="center">Actions</TableCell>
      </TableRow>

      {/* Filters row */}
      <TableRow>
        {/* Contract */}
        <TableCell>
          <Select
            fullWidth
            size="small"
            value={globalFilter.contractType || ''}
            onChange={(e) => onFilterChange('contractType', e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {contractTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </TableCell>

        {/* Payment (EMPTY but REQUIRED) */}
        <TableCell />

        {/* Year */}
        <TableCell>
          <TextField
            size="small"
            type="number"
            fullWidth
            value={globalFilter.year || ''}
            onChange={(e) => onFilterChange('year', e.target.value)}
          />
        </TableCell>

        {/* Month */}
        <TableCell>
          <TextField
            size="small"
            type="number"
            fullWidth
            value={globalFilter.month || ''}
            onChange={(e) => onFilterChange('month', e.target.value)}
          />
        </TableCell>

        {/* Gross */}
        <TableCell />

        {/* Net */}
        <TableCell />

        {/* Actions */}
        <TableCell />
      </TableRow>
    </MuiTableHead>
  );
}