
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
import Button from '@mui/material/Button';

import EditIcon from '@mui/icons-material/Edit';

import { useTheme, useMediaQuery } from "@mui/material";

// project imports
import { formatMoneyPl } from '../../utils/money-format';
import SalariesTableHead from './SalariesTableHead';
import MobileSalaryList from './MobileSalaryList';
import ConfirmActionDialog from '../../components/ConfirmActionDialog';

// third-party
import { FormattedMessage, useIntl } from 'react-intl';
import { useSnackbar } from "notistack";

// types
import type { SalaryFilters, ContractType, SalaryRecord } from '../../api/Salaries';
import type { DialogConfig } from '../../components/ConfirmActionDialog';

// assets
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';

// api 
import { getSalaries } from '../../api/Salaries';
import { deleteSalaryContract } from '../../api/deleteSalaryContract';

type DialogType = 'delete' | null;

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { enqueueSnackbar } = useSnackbar();

  const [searchParams, setSearchParams] = useSearchParams();

  const now = new Date();

  const [loading, setLoading] = useState(true);

  const [salaryToDelete, setSalaryToDelete] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);

  //const [order, setOrder] = useState<ArrangementOrder>('desc');
  const [globalFilter, setGlobalFilter] = useState<SalaryFilters>({
    id: searchParams.get('id') || '',
    year: Number(searchParams.get('year')) || now.getFullYear(),
    monthFrom: Number(searchParams.get('monthFrom')) || 1,
    monthTo: Number(searchParams.get('monthTo')) || now.getMonth() + 1,
    contractType: asContractType(searchParams.get('contractType') || '')
  });

 // const [orderBy, setOrderBy] = useState(searchParams.get('sortBy') ?? 'created_at');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0);
  const [rowsPerPage, setRowsPerPage] = useState(Number(searchParams.get('limit')) || 15);
  const [dense] = useState(false);

  const [items, setItems] = useState<{data: SalaryRecord[], count: number}>({data: [], count: 0});


  const dialogMap: Record<string, DialogConfig> = {
    delete: {
      variant: 'danger' as const,
      title: <FormattedMessage id="dialog-delete-salary-title" />,
      message: <FormattedMessage id="dialog-delete-salary-message" />,
      confirmText: <FormattedMessage id="dialog-delete-salary-confirm" />,
      getAction: (closeDialog: () => void, deleteSalary: () => void) => () => {
        deleteSalary();
        closeDialog();
      },
    },
  };

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
      if (value !== '' && value !== undefined && value !== null) {
        params[key] = value;
      }
    });

    setSearchParams(params);
  }, [page, rowsPerPage, globalFilter]);


  const handleGlobalFilter = <K extends keyof SalaryFilters>(
    key: K,
    value: SalaryFilters[K]
  ) => {
    setGlobalFilter((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  };

  const openDialog = (type: DialogType) => {
    setDialogType(type);
  };

  const closeDialog = () => {
    setDialogType(null);
  };

  const deleteApproved = async (id: string) => {
    const error = await deleteSalaryContract(id)

    if (error) {
      console.error(error);
      enqueueSnackbar(intl.formatMessage({id: 'error'}), { variant: "error" });
      return;
    }

    setItems((prev) => ({
      ...prev,
      data: prev.data.filter((item) => item.id !== id),
      count: prev.count - 1,
    }));

    enqueueSnackbar(intl.formatMessage({id: 'salary-deleted'}), { variant: "success" });
  };

  const deleteSalary = (id: string) => {
    console.log(id)
    setDialogType("delete");
    setSalaryToDelete(id);
  }

  return (
    <>
      <Box
        sx={{
          mt: '2rem',
        }}
      >
        <MobileSalaryList
          items={items.data}
          loading={loading}
          editClick={editClick}
          deleteClick={deleteSalary}
          globalFilter={globalFilter}
          onFilterChange={handleGlobalFilter}
          setPage={setPage}
        />

        {items.data.length < items.count && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Load more
          </Button>
        )}
      </Box>

      <ConfirmActionDialog
        open={!!dialogType}
        form={false}
        extraContent={dialogType ? dialogMap[dialogType].extraContent : undefined}
        title={dialogType ? dialogMap[dialogType].title : ''}
        message={dialogType ? dialogMap[dialogType].message : ''}
        confirmText={dialogType ? dialogMap[dialogType].confirmText : ''}
        variant={dialogType ? dialogMap[dialogType].variant : 'default'}
        onConfirm={() => {
          if (!dialogType) return;

          if (dialogType === 'delete' && salaryToDelete) {
            const action = dialogMap["delete"].getAction(closeDialog, () => deleteApproved(salaryToDelete));
            action();
          }
        }}
        onCancel={closeDialog}
      />
    </>
  );
}