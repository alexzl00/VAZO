import {
  useEffect,
  useState
} from "react";

// mui

import {
  Box,
  Stack,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Button
} from "@mui/material";

import Grid from "@mui/material/Grid";

import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

import {
  deleteWorkRelation,
  getWorkRelations
} from "../../api/work_relations";

import type {
  WorkRelation
} from "../../types/workRelation";

type DialogType = "delete";

export default function WorkRelations() {
  const [items, setItems] =
    useState<WorkRelation[]>([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  const [dialogType, setDialogType] =
    useState<DialogType | null>(null);

  const intl = useIntl();
  const navigate = useNavigate();

  const closeDialog = () => {
    setDialogType(null);
  };

  useEffect(() => {
    let cancelled = false;

    const loadWorkRelations = async () => {
      try {
        setLoading(true);

        const data =
          await getWorkRelations();

        if (!cancelled) {
          setItems(data);
        }
      } catch (e) {
        console.error(e);

        if (!cancelled) {
          enqueueSnackbar(
            intl.formatMessage({
              id: "work-relations-load-all-failed"
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

    void loadWorkRelations();

    return () => {
      cancelled = true;
    };
  }, [intl]);

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

  const getContractLabel = (
    contractType: WorkRelation["contract_type"]
  ) => {
    return intl.formatMessage({
      id: `salaries-contract-${contractType}`
    });
  };

  const requestDelete = (id: string) => {
    setDeleteId(id);
    setDialogType("delete");
  };

  const deleteRelation = async () => {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);

      const deleted =
        await deleteWorkRelation(deleteId);

      if (!deleted) {
        throw new Error(
          "Failed to delete work relation"
        );
      }

      setItems((prev) =>
        prev.filter(
          (item) => item.id !== deleteId
        )
      );

      enqueueSnackbar(
        intl.formatMessage({
          id: "work-relations-deleted"
        }),
        {
          variant: "success"
        }
      );

      setDeleteId(null);
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

  return (
    <>
      <Box>
        {/* HEADER */}

        <Stack
          direction={{
            xs: "column",
            sm: "row"
          }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            sm: "center"
          }}
          sx={{
            mb: 3
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#2F2A4A",
                fontWeight: 700,
                mb: 0.5
              }}
            >
              {intl.formatMessage({
                id: "work-relations-title"
              })}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#77728D"
              }}
            >
              {intl.formatMessage({
                id: "work-relations-description"
              })}
            </Typography>
          </Box>

          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() =>
              navigate("/create-work-relation")
            }
            sx={{
              minWidth: 190,
              minHeight: 44,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none"
            }}
          >
            {intl.formatMessage({
              id: "work-relations-add"
            })}
          </Button>
        </Stack>

        {/* CONTENT */}

        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              minHeight: 300
            }}
          >
            <CircularProgress />
          </Stack>
        ) : items.length === 0 ? (
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: 5,
              py: {
                xs: 5,
                sm: 7
              },
              px: 3,
              textAlign: "center"
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#2F2A4A",
                fontWeight: 600,
                mb: 1
              }}
            >
              {intl.formatMessage({
                id: "work-relations-no-results"
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
                id: "work-relations-no-results-description"
              })}
            </Typography>

            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() =>
                navigate(
                  "/create-work-relation"
                )
              }
            >
              {intl.formatMessage({
                id: "work-relations-add-first"
              })}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {items.map((item) => {
              const {
                id,
                name,
                employer_name,
                contract_type,
                start_date,
                end_date
              } = item;

              return (
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                    lg: 4
                  }}
                  key={id}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      p: 2.5,
                      borderRadius: 5,
                      background:
                        "linear-gradient(135deg, #F7F6FF 0%, #FFFFFF 100%)",
                      boxShadow:
                        "0 6px 16px rgba(47, 42, 74, 0.10)"
                    }}
                  >
                    {/* HEADER */}

                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box
                        sx={{
                          minWidth: 0
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: "#2F2A4A",
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {name}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "#77728D"
                          }}
                        >
                          {employer_name ||
                            intl.formatMessage({
                              id: "work-relations-not-provided"
                            })}
                        </Typography>
                      </Box>

                      <Chip
                        label={getContractLabel(
                          contract_type
                        )}
                        size="small"
                        sx={{
                          flexShrink: 0,
                          fontWeight: 600,
                          bgcolor: "#E6E4FF",
                          color: "#4A3AFF"
                        }}
                      />
                    </Stack>

                    {/* PERIOD */}

                    <Box
                      sx={{
                        mt: 2.5,
                        p: 2,
                        bgcolor:
                          "rgba(255, 255, 255, 0.70)",
                        borderRadius: 3
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {intl.formatMessage({
                              id: "work-relations-start-date"
                            })}
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {formatDate(start_date)}
                          </Typography>
                        </Box>

                        <Box textAlign="right">
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {intl.formatMessage({
                              id: "work-relations-end-date"
                            })}
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {end_date
                              ? formatDate(end_date)
                              : intl.formatMessage({
                                  id: "work-relations-indefinite"
                                })}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* ACTIONS */}

                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.75}
                      sx={{
                        mt: 2
                      }}
                    >
                      <IconButton
                        onClick={() =>
                          navigate(
                            `/view-work-relation/${id}`
                          )
                        }
                      >
                        <VisibilityIcon />
                      </IconButton>

                      <IconButton
                        onClick={() =>
                          navigate(
                            `/edit-work-relation/${id}`
                          )
                        }
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        disabled={deleting}
                        onClick={() =>
                          requestDelete(id)
                        }
                      >
                        <DeleteIcon
                          sx={{
                            color:
                              "rgb(250, 70, 70)"
                          }}
                        />
                      </IconButton>
                    </Stack>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
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

          dialogMap.delete.getAction(
            closeDialog,
            () => {
              void deleteRelation();
            }
          )();
        }}
        onCancel={() => {
          setDeleteId(null);
          closeDialog();
        }}
      />
    </>
  );
}