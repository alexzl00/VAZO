import {
  TableHead as MuiTableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TextField,
  Select,
  MenuItem
} from '@mui/material';
import { useTheme, useMediaQuery } from "@mui/material";

import { contractTypes } from './SalariesTable';
import type { SalaryFilters } from '../../api/Salaries';

interface HeadProps {
  globalFilter: SalaryFilters;
  onFilterChange: (key: keyof SalaryFilters, value: string) => void;
}

export default function SalariesTableHead({ globalFilter, onFilterChange }: HeadProps) {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  console.log(isMobile)
  return (
    <>
      <MuiTableHead>
        {/* Header row */}
        <TableRow
          sx={{
            backgroundColor: "rgba(196, 156, 220, 0.8)",
            "th": {borderBottom: "none"}
          }}
        >
          <TableCell align="center">Contract</TableCell>
          {!isMobile && <TableCell align="center">Payment</TableCell>}
          <TableCell align="center">Year</TableCell>
          <TableCell align="center">Month</TableCell>
          {!isMobile && <TableCell align="center">Gross</TableCell>}
          <TableCell align="center">Net</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      {/* </MuiTableHead>

      <MuiTableHead> */}
        {/* Filters row */}
        <TableRow
          sx={{
            backgroundColor: "rgba(196, 156, 220, 0.8)",
          }}
        >
          {/* Contract */}
          <TableCell>
            <Select
              fullWidth
              size="small"
              value={globalFilter.contractType || ''}
              sx={{width: '130px'}}
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
          {!isMobile && <TableCell />}

          {/* Year */}
          <TableCell>
            <TextField
              size="small"
              type="number"
              fullWidth
              sx={{width: '130px'}}
              value={globalFilter.year || ''}
              onChange={(e) => onFilterChange('year', e.target.value)}
            />
          </TableCell>

          {/* Month */}
          {/* <TableCell>
            <TextField
              size="small"
              type="number"
              fullWidth
              sx={{width: '130px'}}
              value={globalFilter.month || ''}
              onChange={(e) => onFilterChange('month', e.target.value)}
            />
          </TableCell> */}

          {/* Gross */}
          {!isMobile && <TableCell />}

          {/* Net */}
          <TableCell />

          {/* Actions */}
          <TableCell />
        </TableRow>
      </MuiTableHead>
    </>
  );
}