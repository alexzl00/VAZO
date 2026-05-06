import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  Modal,
  Button
} from "@mui/material";
import Grid from '@mui/material/Grid';

import FilterListIcon from "@mui/icons-material/FilterList";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from '@mui/icons-material/Delete';

import { formatMoneyPl } from "../../utils/money-format";

import type { SalaryRecord, SalaryFilters } from "../../api/Salaries";
import { FormattedMessage } from "react-intl";

interface Props {
  items: SalaryRecord[];
  loading: boolean;
  editClick: (id: string) => void;
  deleteClick: (id: string) => void;
  globalFilter: SalaryFilters;
  onFilterChange: <K extends keyof SalaryFilters>(
    key: K,
    value: SalaryFilters[K]
  ) => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function MobileSalaryList({
  items,
  loading,
  editClick,
  deleteClick,
  globalFilter,
  onFilterChange,
  setPage
}: Props) {
  const [openFilters, setOpenFilters] = useState(false);
  const [draft, setDraft] = useState<SalaryFilters>(globalFilter);

  useEffect(() => {
    if (openFilters) {
      setDraft(globalFilter);
    }
  }, [openFilters, globalFilter]);

  return (
    <Box>
      {/* FILTER BUTTON */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setOpenFilters(true)}
          sx={{ width: 100 }}
        >
          Filters
        </Button>
      </Box>

      {/* FILTER MODAL */}
      <Modal open={openFilters} onClose={() => setOpenFilters(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 420,
            bgcolor: "background.paper",
            borderRadius: 4,
            boxShadow: 24,
            p: 3
          }}
        >
          <Typography variant="h6" mb={2}>
            Filters
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Year"
              type="number"
              value={draft.year || ""}
              onChange={(e) =>
                setDraft((p) => ({ ...p, year: Number(e.target.value) }))
              }
              fullWidth
            />

            <Stack direction={'row'} spacing={1}>
              <TextField
                label="From month"
                type="number"
                value={draft.monthFrom || ""}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, monthFrom: Number(e.target.value) }))
                }
                fullWidth
              />

              <TextField
                label="To month"
                type="number"
                value={draft.monthTo || ""}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, monthTo: Number(e.target.value) }))
                }
                fullWidth
              />
            </Stack>

            <TextField
              select
              label="Contract type"
              value={draft.contractType}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  contractType: e.target.value as any
                }))
              }
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="uop">UoP</MenuItem>
              <MenuItem value="mandate">Mandate</MenuItem>
              <MenuItem value="uod">UoD</MenuItem>
            </TextField>

            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setOpenFilters(false)}
              >
                Cancel
              </Button>

              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  onFilterChange("year", draft.year);
                  onFilterChange("monthFrom", draft.monthFrom);
                  onFilterChange("monthTo", draft.monthTo);
                  onFilterChange("contractType", draft.contractType);

                  setPage(0);
                  setOpenFilters(false);
                }}
              >
                Apply
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      {/* CONTENT */}
      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : items.length === 0 ? (
        <Box textAlign="center" mt={4}>
          No data
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => {
            const {
              id,
              year,
              month,
              contractType,
              paymentMode,

              grossSalaryCalculated,
              netSalaryCalculated,

              isOverridden,
              grossSalaryOverride,
              netSalaryOverride,
              
              overrideReason,
              overrideCreatedAt,

              createdAt,
              updatedAt
            } = item;

            const net = isOverridden
              ? netSalaryOverride ?? netSalaryCalculated
              : netSalaryCalculated;

            const gross = isOverridden
              ? grossSalaryOverride ?? grossSalaryCalculated
              : grossSalaryCalculated;

            return (
              <Grid 
                size={{ xs: 12, md: 6, lg: 4 }} 
                key={id}
              >
                <Box
                  key={id}
                  sx={{
                    width: "100%",
                    p: 2.5,
                    borderRadius: 5,
                    background:
                      "linear-gradient(135deg, #F7F6FF 0%, #FFFFFF 100%)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.1)"
                  }}
                >
                  {/* HEADER */}
                  <Stack
                    spacing={2}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Chip
                      label={contractType.toUpperCase()}
                      sx={{
                        minWidth: 100,
                        fontWeight: 600,
                        backgroundColor: "#E6E4FF",
                        color: "#4A3AFF"
                      }}
                    />

                    <Typography variant="body2" color="text.secondary">
                      {month}/{year}
                    </Typography>

                    <Stack direction={'row'} spacing={0.5}>
                      <IconButton
                        onClick={() => editClick(id)}
                        sx={{ p: 1, backgroundColor: "#EFEFFF" }}
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => deleteClick(id)}
                        sx={{ p: 1, backgroundColor: "#EFEFFF" }}
                      >
                        <DeleteIcon sx={{ color: "rgb(250, 70, 70)" }} />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* SALARY */}
                  <Stack direction="row" justifyContent="space-between" mt={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Net
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatMoneyPl(net)}
                      </Typography>
                    </Box>

                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">
                        Gross
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatMoneyPl(gross)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* FOOTER */}
                  <Stack direction="row" justifyContent="space-between" mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Payment mode: {paymentMode}
                    </Typography>

                    {isOverridden && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#D32F2F", fontWeight: 600, fontSize: 14 }}
                      >
                        <FormattedMessage id="salaries-is-overridden" />
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}