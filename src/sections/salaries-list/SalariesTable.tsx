import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// material-ui
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// project imports
import MobileSalaryList from "./MobileSalaryList";
import ConfirmActionDialog from "../../components/Modals/ConfirmActionDialog";

// third-party
import { FormattedMessage, useIntl } from "react-intl";
import { useSnackbar } from "notistack";

// types
import type { SalaryFilters, SalaryRecord } from "../../api/Salaries";
import type { WorkContract } from "../../types/workRelation";
import type { DialogConfig } from "../../components/Modals/ConfirmActionDialog";

// api
import { getSalaries } from "../../api/Salaries";
import { deleteSalaryContract } from "../../api/deleteSalaryContract";

type DialogType = "delete" | null;

export const contractTypes: WorkContract[] = [
  "uop",
  "mandate",
  "uod"
];

const asContractType = (
  value: string | null
): WorkContract | "" => {
  return value && contractTypes.includes(value as WorkContract)
    ? (value as WorkContract)
    : "";
};

interface TableProps {
  editClick: (id: string) => void;
}

export default function SalariesTable({ editClick }: TableProps) {
  const intl = useIntl();
  const { enqueueSnackbar } = useSnackbar();

  const [searchParams, setSearchParams] = useSearchParams();

  const now = new Date();

  const initialRequestedPage = useRef(
    Math.max(Number(searchParams.get("page")) || 1, 1)
  );

  const firstLoad = useRef(true);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [salaryToDelete, setSalaryToDelete] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType>(null);

  const [globalFilter, setGlobalFilter] =
    useState<SalaryFilters>({
      id: searchParams.get("id") || "",
      startYear:
        Number(searchParams.get("startYear")) ||
        now.getFullYear(),
      startMonth:
        Number(searchParams.get("startMonth")) || 1,
      endYear:
        Number(searchParams.get("endYear")) ||
        now.getFullYear(),
      endMonth:
        Number(searchParams.get("endMonth")) ||
        now.getMonth() + 1,
      contractType: asContractType(
        searchParams.get("contractType")
      )
    });

  const [page, setPage] = useState(
    initialRequestedPage.current
  );

  const [rowsPerPage] = useState(
    Math.max(Number(searchParams.get("limit")) || 9, 1)
  );

  const [items, setItems] = useState<SalaryRecord[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const dialogMap: Record<string, DialogConfig> = {
    delete: {
      variant: "danger",
      title: (
        <FormattedMessage id="dialog-delete-salary-title" />
      ),
      message: (
        <FormattedMessage id="dialog-delete-salary-message" />
      ),
      confirmText: (
        <FormattedMessage id="dialog-delete-salary-confirm" />
      ),
      getAction: (
        closeDialog: () => void,
        deleteSalary: () => void
      ) => () => {
        deleteSalary();
        closeDialog();
      }
    }
  };

  const loadSinglePage = async (
    targetPage: number,
    mode: "replace" | "append"
  ) => {
    if (mode === "replace") {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await getSalaries(
        globalFilter,
        targetPage,
        rowsPerPage
      );

      setItems((prev) =>
        mode === "replace"
          ? result.res
          : [...prev, ...result.res]
      );

      setHasMore(result.hasMore);
      setPage(targetPage);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };

  const loadThroughPage = async (targetPage: number) => {
    setInitialLoading(true);

    try {
      const loaded: SalaryRecord[] = [];
      let actualPage = 1;
      let more = false;

      for (
        let currentPage = 1;
        currentPage <= targetPage;
        currentPage += 1
      ) {
        const result = await getSalaries(
          globalFilter,
          currentPage,
          rowsPerPage
        );

        loaded.push(...result.res);
        actualPage = currentPage;
        more = result.hasMore;

        if (!result.hasMore) break;
      }

      setItems(loaded);
      setHasMore(more);
      setPage(actualPage);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      loadThroughPage(initialRequestedPage.current);
      return;
    }

    loadSinglePage(1, "replace");
  }, [globalFilter, rowsPerPage]);

  useEffect(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(rowsPerPage)
    };

    Object.entries(globalFilter).forEach(([key, value]) => {
      if (
        value !== "" &&
        value !== undefined &&
        value !== null
      ) {
        params[key] = String(value);
      }
    });

    setSearchParams(params, { replace: true });
  }, [
    page,
    rowsPerPage,
    globalFilter,
    setSearchParams
  ]);

  const handleGlobalFilter = <
    K extends keyof SalaryFilters
  >(
    key: K,
    value: SalaryFilters[K]
  ) => {
    setGlobalFilter((prev) => {
      if (prev[key] === value) return prev;

      return {
        ...prev,
        [key]: value
      };
    });
  };

  const closeDialog = () => {
    setDialogType(null);
    setSalaryToDelete(null);
  };

  const deleteApproved = async (id: string) => {
    const error = await deleteSalaryContract(id);

    if (error) {
      console.error(error);

      enqueueSnackbar(
        intl.formatMessage({ id: "error" }),
        { variant: "error" }
      );

      return;
    }

    setItems((prev) =>
      prev.filter((item) => item.id !== id)
    );

    enqueueSnackbar(
      intl.formatMessage({ id: "salary-deleted" }),
      { variant: "success" }
    );
  };

  const deleteSalary = (id: string) => {
    setDialogType("delete");
    setSalaryToDelete(id);
  };

  const handleLoadMore = () => {
    if (
      initialLoading ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    loadSinglePage(page + 1, "append");
  };

  return (
    <>
      <Box sx={{ mt: "2rem" }}>
        <MobileSalaryList
          items={items}
          loading={initialLoading}
          editClick={editClick}
          deleteClick={deleteSalary}
          globalFilter={globalFilter}
          onFilterChange={handleGlobalFilter}
        />

        {hasMore && items.length > 0 && (
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              disabled={loadingMore}
              endIcon={
                loadingMore ? (
                  <CircularProgress size={18} />
                ) : (
                  <KeyboardArrowDownIcon />
                )
              }
              sx={{
                minWidth: 180,
                px: 3,
                py: 1.1,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 700,
                letterSpacing: 0.2,
                borderColor:
                  "rgba(74, 58, 255, 0.35)",
                color: "#4A3AFF",
                backgroundColor:
                  "rgba(74, 58, 255, 0.04)",
                boxShadow:
                  "0 8px 20px rgba(74, 58, 255, 0.08)",
                "&:hover": {
                  borderColor: "#4A3AFF",
                  backgroundColor:
                    "rgba(74, 58, 255, 0.08)",
                  boxShadow:
                    "0 10px 24px rgba(74, 58, 255, 0.12)"
                },
                "&.Mui-disabled": {
                  borderColor:
                    "rgba(0, 0, 0, 0.12)",
                  color: "text.disabled",
                  backgroundColor:
                    "rgba(0, 0, 0, 0.03)",
                  boxShadow: "none"
                }
              }}
            >
              {loadingMore
                ? "Loading salaries"
                : "Load more"}
            </Button>
          </Stack>
        )}
      </Box>

      <ConfirmActionDialog
        open={Boolean(dialogType)}
        form={false}
        extraContent={
          dialogType
            ? dialogMap[dialogType].extraContent
            : undefined
        }
        title={
          dialogType
            ? dialogMap[dialogType].title
            : ""
        }
        message={
          dialogType
            ? dialogMap[dialogType].message
            : ""
        }
        confirmText={
          dialogType
            ? dialogMap[dialogType].confirmText
            : ""
        }
        variant={
          dialogType
            ? dialogMap[dialogType].variant
            : "default"
        }
        onConfirm={() => {
          if (
            dialogType === "delete" &&
            salaryToDelete
          ) {
            const action =
              dialogMap.delete.getAction(
                closeDialog,
                () =>
                  deleteApproved(salaryToDelete)
              );

            action();
          }
        }}
        onCancel={closeDialog}
      />
    </>
  );
}
