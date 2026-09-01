import {
  useState,
  type SubmitEventHandler
} from "react";

// mui

import {
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Divider
} from "@mui/material";

// third-party

import {
  FormattedMessage,
  useIntl
} from "react-intl";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";

// components

import ConfirmActionDialog, {
  type DialogConfig
} from "../../components/Modals/ConfirmActionDialog";

// api

import { createWorkRelation } from "../../api/work_relations";

import type {
  WorkContract,
  WorkRelationPayload
} from "../../types/workRelation";

type DialogType = "save";

const INITIAL_FORM: WorkRelationPayload = {
  name: "",
  employerName: "",
  contractType: "uop",
  startDate: "",
  endDate: null
};

export default function CreateWorkRelation() {
  const [form, setForm] =
    useState<WorkRelationPayload>(INITIAL_FORM);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [dialogType, setDialogType] =
    useState<DialogType | null>(null);

  const intl = useIntl();
  const navigate = useNavigate();

  const closeDialog = () => {
    setDialogType(null);
  };

  const updateField = <K extends keyof WorkRelationPayload>(
    key: K,
    value: WorkRelationPayload[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));

    if (error) {
      setError(null);
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return intl.formatMessage({
        id: "work-relations-name-required"
      });
    }

    if (!form.startDate.trim()) {
      return intl.formatMessage({
        id: "work-relations-start-date-required"
      });
    }

    if (
      form.endDate &&
      form.endDate < form.startDate
    ) {
      return intl.formatMessage({
        id: "work-relations-invalid-date-range"
      });
    }

    return null;
  };

  const createRelation = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload: WorkRelationPayload = {
        name: form.name.trim(),
        employerName:
          form.employerName?.trim() || null,
        contractType: form.contractType,
        startDate: form.startDate,
        endDate: form.endDate || null
      };

      const createdRelation =
        await createWorkRelation(payload);

      enqueueSnackbar(
        intl.formatMessage({
          id: "work-relations-created"
        }),
        {
          variant: "success"
        }
      );

      navigate(
        `/view-work-relation/${createdRelation.id}`
      );
    } catch (e) {
      console.error(e);

      enqueueSnackbar(
        intl.formatMessage({
          id: "work-relations-create-error"
        }),
        {
          variant: "error"
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (
    e
  ) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setDialogType("save");
  };

  const dialogMap: Record<DialogType, DialogConfig> = {
    save: {
      variant: "success" as const,
      title: (
        <FormattedMessage id="dialog-create-work-relation-title" />
      ),
      message: (
        <FormattedMessage id="dialog-create-work-relation-message" />
      ),
      confirmText: (
        <FormattedMessage id="work-relations-create" />
      ),
      getAction: (
        closeDialog: () => void,
        createRelation: () => void
      ) => () => {
        createRelation();
        closeDialog();
      }
    }
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 900,
            bgcolor: "#FFFFFF",
            borderRadius: 5,
            boxShadow:
              "0 10px 30px rgba(47, 42, 74, 0.10)",
            overflow: "hidden"
          }}
        >
          {/* HEADER */}

          <Box
            sx={{
              px: {
                xs: 2.5,
                sm: 4
              },
              py: {
                xs: 2.5,
                sm: 3
              },
              background:
                "linear-gradient(135deg, #F7F6FF 0%, #FFFFFF 100%)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "#2F2A4A",
                fontWeight: 700,
                mb: 0.75
              }}
            >
              {intl.formatMessage({
                id: "work-relations-create-title"
              })}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#77728D",
                maxWidth: 600
              }}
            >
              {intl.formatMessage({
                id: "work-relations-create-description"
              })}
            </Typography>
          </Box>

          <Divider />

          {/* CONTENT */}

          <Box
            sx={{
              p: {
                xs: 2.5,
                sm: 4
              }
            }}
          >
            <Stack spacing={3}>
              {/* BASIC INFO */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#2F2A4A",
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-basic-info"
                  })}
                </Typography>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row"
                  }}
                  spacing={2}
                >
                  <TextField
                    label={intl.formatMessage({
                      id: "work-relations-name"
                    })}
                    value={form.name}
                    onChange={(e) =>
                      updateField(
                        "name",
                        e.target.value
                      )
                    }
                    disabled={loading}
                    fullWidth
                    required
                  />

                  <TextField
                    label={intl.formatMessage({
                      id: "work-relations-employer-name"
                    })}
                    value={form.employerName ?? ""}
                    onChange={(e) =>
                      updateField(
                        "employerName",
                        e.target.value
                      )
                    }
                    disabled={loading}
                    fullWidth
                  />
                </Stack>
              </Box>

              {/* CONTRACT */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#2F2A4A",
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-contract-details"
                  })}
                </Typography>

                <TextField
                  select
                  label={intl.formatMessage({
                    id: "work-relations-contract-type"
                  })}
                  value={form.contractType}
                  onChange={(e) =>
                    updateField(
                      "contractType",
                      e.target.value as WorkContract
                    )
                  }
                  disabled={loading}
                  fullWidth
                  required
                >
                  <MenuItem value="uop">
                    {intl.formatMessage({
                      id: "salaries-contract-uop"
                    })}
                  </MenuItem>

                  <MenuItem value="mandate">
                    {intl.formatMessage({
                      id: "salaries-contract-mandate"
                    })}
                  </MenuItem>

                  <MenuItem value="uod">
                    {intl.formatMessage({
                      id: "salaries-contract-uod"
                    })}
                  </MenuItem>
                </TextField>
              </Box>

              {/* DATES */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#2F2A4A",
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-employment-period"
                  })}
                </Typography>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row"
                  }}
                  spacing={2}
                >
                  <TextField
                    label={intl.formatMessage({
                      id: "work-relations-start-date"
                    })}
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      updateField(
                        "startDate",
                        e.target.value
                      )
                    }
                    disabled={loading}
                    fullWidth
                    required
                    slotProps={{
                      inputLabel: {
                        shrink: true
                      }
                    }}
                  />

                  <TextField
                    label={intl.formatMessage({
                      id: "work-relations-end-date"
                    })}
                    type="date"
                    value={form.endDate ?? ""}
                    onChange={(e) =>
                      updateField(
                        "endDate",
                        e.target.value || null
                      )
                    }
                    disabled={loading}
                    fullWidth
                    slotProps={{
                      inputLabel: {
                        shrink: true
                      },
                      htmlInput: {
                        min:
                          form.startDate || undefined
                      }
                    }}
                  />
                </Stack>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#77728D"
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-end-date-hint"
                  })}
                </Typography>
              </Box>

              {/* ERROR */}

              {error && (
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: "#FFF1F1",
                    borderRadius: 2
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#D32F2F",
                      fontWeight: 500
                    }}
                  >
                    {error}
                  </Typography>
                </Box>
              )}

              {/* ACTIONS */}

              <Stack
                direction={{
                  xs: "column-reverse",
                  sm: "row"
                }}
                spacing={1.5}
                justifyContent="flex-end"
              >
                <Button
                  type="button"
                  variant="outlined"
                  disabled={loading}
                  onClick={() =>
                    navigate("/work-relations")
                  }
                  sx={{
                    minWidth: 130,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 600
                  }}
                >
                  {intl.formatMessage({
                    id: "salaries-cancel"
                  })}
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    minWidth: 170,
                    minHeight: 42,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none"
                  }}
                >
                  {loading ? (
                    <CircularProgress
                      size={22}
                      sx={{
                        color: "inherit"
                      }}
                    />
                  ) : (
                    intl.formatMessage({
                      id: "work-relations-create"
                    })
                  )}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

      <ConfirmActionDialog
        open={!!dialogType}
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
          if (!dialogType) {
            return;
          }

          dialogMap.save.getAction(
            closeDialog,
            () => {
              void createRelation();
            }
          )();
        }}
        onCancel={closeDialog}
      />
    </>
  );
}