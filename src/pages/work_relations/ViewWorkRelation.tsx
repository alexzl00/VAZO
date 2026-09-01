import {
  useEffect,
  useState
} from "react";

// mui

import {
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Chip
} from "@mui/material";

import Grid from "@mui/material/Grid";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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
  deleteWorkRelation,
  getWorkRelation
} from "../../api/work_relations";

// types

import type {
  WorkRelation
} from "../../types/workRelation";

type DialogType = "delete";

export default function ViewWorkRelation() {
  const [workRelation, setWorkRelation] =
    useState<WorkRelation | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState(false);

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

        const data =
          await getWorkRelation(id);

        if (!cancelled) {
          setWorkRelation(data);
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

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(
      intl.locale,
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    ).format(
      new Date(`${date}T00:00:00`)
    );
  };

  const formatDateTime = (date: string) => {
    return new Intl.DateTimeFormat(
      intl.locale,
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    ).format(new Date(date));
  };

  const getContractLabel = (
    contractType: WorkRelation["contract_type"]
  ) => {
    return intl.formatMessage({
      id: `salaries-contract-${contractType}`
    });
  };

  const getPaymentModeLabel = (
    paymentMode: WorkRelation["payment_mode"]
  ) => {
    return intl.formatMessage({
      id: `salaries-payment-mode-${paymentMode}`
    });
  };

  const deleteRelation = async () => {
    if (!id) {
      return;
    }

    try {
      setDeleting(true);

      const deleted =
        await deleteWorkRelation(id);

      if (!deleted) {
        throw new Error(
          "Failed to delete work relation"
        );
      }

      enqueueSnackbar(
        intl.formatMessage({
          id: "work-relations-deleted"
        }),
        {
          variant: "success"
        }
      );

      navigate("/work-relations");
    } catch (e) {
      console.error(e);

      enqueueSnackbar(
        intl.formatMessage({
          id: "work-relations-delete-failed"
        }),
        {
          variant: "error"
        }
      );
    } finally {
      setDeleting(false);
    }
  };

  const dialogMap: Record<
    DialogType,
    DialogConfig
  > = {
    delete: {
      variant: "danger" as const,
      title: (
        <FormattedMessage id="dialog-delete-work-relation-title" />
      ),
      message: (
        <FormattedMessage id="dialog-delete-work-relation-message" />
      ),
      confirmText: (
        <FormattedMessage id="work-relations-delete" />
      ),
      getAction: (
        closeDialog: () => void,
        deleteRelation: () => void
      ) => () => {
        deleteRelation();
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

  if (loadError || !workRelation) {
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
            p: 4,
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
            <Stack
              direction={{
                xs: "column",
                sm: "row"
              }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                sm: "center"
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    color: "#2F2A4A",
                    fontWeight: 700,
                    mb: 0.75
                  }}
                >
                  {workRelation.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "#77728D"
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-view-description"
                  })}
                </Typography>
              </Box>

              <Chip
                label={getContractLabel(
                  workRelation.contract_type
                )}
                sx={{
                  minWidth: 130,
                  fontWeight: 600,
                  bgcolor: "#E6E4FF",
                  color: "#4A3AFF"
                }}
              />
            </Stack>
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
            <Stack spacing={4}>
              {/* BASIC INFO */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#2F2A4A",
                    fontWeight: 700,
                    mb: 2
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-basic-info"
                  })}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "work-relations-name"
                        })}
                      </Typography>

                      <Typography fontWeight={600}>
                        {workRelation.name}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "work-relations-employer-name"
                        })}
                      </Typography>

                      <Typography fontWeight={600}>
                        {workRelation.employer_name ||
                          intl.formatMessage({
                            id: "work-relations-not-provided"
                          })}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "work-relations-contract-type"
                        })}
                      </Typography>

                      <Typography fontWeight={600}>
                        {getContractLabel(
                          workRelation.contract_type
                        )}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "salaries-payment-mode"
                        })}
                      </Typography>

                      <Typography fontWeight={600}>
                        {getPaymentModeLabel(
                          workRelation.payment_mode
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* PERIOD */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#2F2A4A",
                    fontWeight: 700,
                    mb: 2
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-employment-period"
                  })}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "work-relations-start-date"
                        })}
                      </Typography>

                      <Typography fontWeight={600}>
                        {formatDate(
                          workRelation.start_date
                        )}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "work-relations-end-date"
                        })}
                      </Typography>

                      <Typography fontWeight={600}>
                        {workRelation.end_date
                          ? formatDate(
                              workRelation.end_date
                            )
                          : intl.formatMessage({
                              id: "work-relations-indefinite"
                            })}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* ADDITIONAL INFO */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#2F2A4A",
                    fontWeight: 700,
                    mb: 2
                  }}
                >
                  {intl.formatMessage({
                    id: "work-relations-additional-info"
                  })}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "work-relations-created-at"
                        })}
                      </Typography>

                      <Typography fontWeight={500}>
                        {formatDateTime(
                          workRelation.created_at
                        )}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#F8F7FF",
                        borderRadius: 3
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {intl.formatMessage({
                          id: "work-relations-updated-at"
                        })}
                      </Typography>

                      <Typography fontWeight={500}>
                        {formatDateTime(
                          workRelation.updated_at
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* ACTIONS */}

              <Stack
                direction={{
                  xs: "column",
                  sm: "row"
                }}
                spacing={1.5}
                justifyContent="space-between"
              >
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() =>
                    navigate("/work-relations")
                  }
                >
                  {intl.formatMessage({
                    id: "work-relations-back"
                  })}
                </Button>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row"
                  }}
                  spacing={1.5}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    disabled={deleting}
                    onClick={() =>
                      setDialogType("delete")
                    }
                  >
                    {intl.formatMessage({
                      id: "work-relations-delete"
                    })}
                  </Button>

                  <Button
                    type="button"
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() =>
                      navigate(
                        `/edit-work-relation/${workRelation.id}`
                      )
                    }
                  >
                    {intl.formatMessage({
                      id: "work-relations-edit"
                    })}
                  </Button>
                </Stack>
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
          if (!dialogType) return;

          dialogMap.delete.getAction(
            closeDialog,
            () => {
              void deleteRelation();
            }
          )();
        }}
        onCancel={closeDialog}
      />
    </>
  );
}