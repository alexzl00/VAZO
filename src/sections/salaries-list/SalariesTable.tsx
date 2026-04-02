
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// material-ui
import CircularProgress from '@mui/material/CircularProgress';
import MUITable from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import EditIcon from '@mui/icons-material/Edit';

// project imports
import { formatMoneyPl } from '../../utils/money-format';
import SalariesTableHead from './SalariesTableHead';

// third-party
import { FormattedMessage, useIntl } from 'react-intl';

// types
import type { SalaryFilters, ContractType, SalaryRecord } from '../../api/Salaries';

// assets
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';

// api 
import { getSalaries } from '../../api/Salaries';

export const contractTypes: ContractType[] = ['uop', 'mandate'] as const;

const asContractType = (v: string | null): ContractType | '' => {
  return v && v in contractTypes ? (v as ContractType) : '';
};

interface TableProps {
  editClick: (id: string) => void;
}

// ==============================|| MUI TABLE ||============================== //

export default function SalariesTable({ editClick }: TableProps) {
  const intl = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();

  const now = new Date();

  const [loading, setLoading] = useState(true);

  //const [order, setOrder] = useState<ArrangementOrder>('desc');
  const [globalFilter, setGlobalFilter] = useState<SalaryFilters>({
    id: searchParams.get('id') || '',
    year: Number(searchParams.get('year')) || now.getFullYear(),
    month: Number(searchParams.get('month')) || now.getMonth(),
    contractType: asContractType(searchParams.get('contractType') || '')
  });

 // const [orderBy, setOrderBy] = useState(searchParams.get('sortBy') ?? 'created_at');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0);
  const [rowsPerPage, setRowsPerPage] = useState(Number(searchParams.get('limit')) || 15);
  const [dense] = useState(false);

  const [items, setItems] = useState<{data: SalaryRecord[], count: number}>({data: [], count: 0});

  useEffect(()=> {
    setLoading(true);

    const fetchSalaries = async () => {
      const res = await getSalaries(globalFilter, page + 1, rowsPerPage);
      setItems({data: res.res, count: res.count ?? 0});

      setLoading(false);
    }

    fetchSalaries();
  }, [globalFilter, page, rowsPerPage])
  
  useEffect(() => {
    const params: any = {
      page: page,
      limit: rowsPerPage,
    };

    Object.entries(globalFilter).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    setSearchParams(params);
  }, [page, rowsPerPage, globalFilter]);

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined) => {
    setRowsPerPage(parseInt(event?.target.value!, 10));
    setPage(0);
  };

  const deleteApproved = async () => {
  };

  const handleGlobalFilter = <K extends keyof SalaryFilters>(
    key: K,
    value: SalaryFilters[K]
  ) => {
    setGlobalFilter((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  };

  return (
    <Box>
      {/* table */}
      <TableContainer>
        <MUITable sx={{ minWidth: 750, '& .MuiTableRow-root .MuiTableCell-root:first-of-type': {paddingLeft: '12px'} }} aria-labelledby="tableTitle" size={dense ? 'small' : 'medium'}>
          <SalariesTableHead globalFilter={globalFilter} onFilterChange={handleGlobalFilter}/>
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7}>
                  <Stack alignItems={'center'}>
                    <CircularProgress />
                  </Stack>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {items.data.map((
                { id, year, month, contractType, paymentMode, 
                  grossSalaryCalculated, netSalaryCalculated,
                  grossSalaryActual, netSalaryActual, 
                  isOverridden
                }) => { 
                return (
                  <TableRow
                    tabIndex={-1}
                    key={id}
                    sx={{
                      backgroundColor: 'inherit',
                      boxShadow: '0px 2px 2px 0px rgba(0, 0, 0, 0.21)',
                      borderBottom: null
                    }}
                  >
                    <TableCell align="center"> {contractType}</TableCell>
                    <TableCell align="center"> {paymentMode}</TableCell>
                    <TableCell scope="row" padding="none" align="center">
                      {year}
                    </TableCell>
                    <TableCell align="center"> {month}</TableCell>
                    <TableCell align="center">
                      { formatMoneyPl(isOverridden ? grossSalaryActual ?? grossSalaryCalculated : grossSalaryCalculated ) }
                    </TableCell>
                    <TableCell align="center">
                      { formatMoneyPl(isOverridden ? netSalaryActual ?? netSalaryCalculated : netSalaryCalculated) }
                    </TableCell>
                    <TableCell align="center">
                      <Stack flexDirection={'row'} justifyContent="center" alignItems="center">
                        <Tooltip title={<FormattedMessage id={'salary-edit'} />}>
                          <IconButton
                            color="secondary"
                            sx={{ color: 'text.primary', bgcolor: 'transparent', padding: 0 }}
                            onClick={() => editClick(id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </MUITable>
      </TableContainer>
      {/* <Divider /> */}

      {/* table pagination */}
      <TablePagination
        labelRowsPerPage={<FormattedMessage id={'rows-per-page'} />}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${intl.formatMessage({ id: 'of' })} ${count}`}
        rowsPerPageOptions={[15, 25, 50]}
        component="div"
        count={items.count}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}