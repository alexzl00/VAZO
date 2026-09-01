import {
  useEffect,
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
import {
  useNavigate,
  useParams
} from "react-router-dom";

// components

import ConfirmActionDialog, {
  type DialogConfig
} from "../../components/Modals/ConfirmActionDialog";

// api

import {
  getWorkRelation,
  updateWorkRelation
} from "../../api/work_relations";

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

export default function EditWorkRelation() {
  const [form, setForm] =
    useState<WorkRelationPayload>(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType | null>(null);

  const intl = useIntl();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const closeDialog = () => {
    setDialogType(null);
  };

  useEffect(() => {
    let cancelled = false;

    const loadWorkRelation = async () => {
      if (!id) {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setLoadError(false);

        const relation =
          await getWorkRelation(id);

        if (!cancelled) {
          setForm({
            name: relation.name,
            employerName:
              relation.employer_name ?? "",
            contractType:
              relation.contract_type,
            startDate:
              relation.start_date,
            endDate:
              relation.end_date
          });
        }
      } catch (e) {
        console.error(e);

        if (!cancelled) {
          setLoadError(true);

          enqueueSnackbar(
            intl.formatMessage({
              id: "work-relations-load-failed"
            }),
            {
              variant: "error"
            }
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWorkRelation();

    return () => {
      cancelled = true;
    };
  }, [id, intl]);

  const updateField = <K extends keyof WorkRelationPayload>(
    key: K,
    value: WorkRelationPayload[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));

    if (validationError) {
      setValidationError(null);
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

  const saveRelation = async () => {
    if (!id) {
      return;
    }

    try {
      setSaving(true);
      setValidationError(null);

      const payload: WorkRelationPayload = {
        name: form.name.trim(),
        employerName:
          form.employerName?.trim() || null,
        contractType: form.contractType,
        startDate: form.startDate,
        endDate: form.endDate || null
      };

      const updatedRelation =
        await updateWorkRelation(id, payload);

      enqueueSnackbar(
        intl.formatMessage({
          id: "work-relations-updated"
        }),
        {
          variant: "success"
        }
      );

      navigate(
        `/view-work-relation/${updatedRelation.id}`
      );
    } catch (e) {
      console.error(e);

      enqueueSnackbar(
        intl.formatMessage({
          id: "work-relations-update-failed"
        }),
        {
          variant: "error"
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (
    e
  ) => {
    e.preventDefault();

    const error = validateForm();

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setDialogType("save");
  };

  const dialogMap: Record<DialogType, DialogConfig> = {
    save: {
      variant: "success" as const,
      title: (
        <FormattedMessage id="dialog-update-work-relation-title" />
      ),
      message: (
        <FormattedMessage id="dialog-update-work-relation-message" />
      ),
      confirmText: (
        <FormattedMessage id="work-relations-save" />
      ),
      getAction: (
        closeDialog: () => void,
        saveRelation: () => void
      ) => () => {
        saveRelation();
        closeDialog();
      }
    }
  };

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          minHeight: 400
        }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (loadError || !id) {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 900,
            bgcolor: "#FFFFFF",
            borderRadius: 5,
            boxShadow:
              "0 10px 30px rgba(47, 42, 74, 0.10)",
            p: {
              xs: 3,
              sm: 4
            },
            textAlign: "center"
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#2F2A4A",
              fontWeight: 700,
              mb: 1
            }}
          >
            {intl.formatMessage({
              id: "work-relations-not-found"
            })}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#77728D",
              mb: 3
            }}
          >
            {intl.formatMessage({
              id: "work-relations-not-found-description"
            })}
          </Typography>

          <Button
            type="button"
            variant="contained"
            onClick={() =>
              navigate("/work-relations")
            }
          >
            {intl.formatMessage({
              id: "work-relations-back"
            })}
          </Button>
        </Box>
      </Box>
    );
  }

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
                id: "work-relations-update-title"
              })}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#77728D"
              }}
            >
              {intl.formatMessage({
                id: "work-relations-update-description"
              })}
            </Typography>
          </Box>

          <Divider />

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
                    disabled={saving}
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
                    disabled={saving}
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
                  disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
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

              {validationError && (
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
                    {validationError}
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
                  disabled={saving}
                  onClick={() =>
                    navigate(
                      `/view-work-relation/${id}`
                    )
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
                  disabled={saving}
                  sx={{
                    minWidth: 170,
                    minHeight: 42,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none"
                  }}
                >
                  {saving ? (
                    <CircularProgress
                      size={22}
                      sx={{
                        color: "inherit"
                      }}
                    />
                  ) : (
                    intl.formatMessage({
                      id: "work-relations-save"
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
              void saveRelation();
            }
          )();
        }}
        onCancel={closeDialog}
      />
    </>
  );
}