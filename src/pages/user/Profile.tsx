import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  ArrowForwardOutlined,
  CheckCircleOutline,
  EditOutlined,
  SaveOutlined,
  WorkspacePremiumOutlined,
  DeleteOutlineOutlined
} from "@mui/icons-material";

import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";

import ConfirmActionDialog from "../../components/Modals/ConfirmActionDialog";

// third party
import { enqueueSnackbar } from "notistack";

// auth
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../lib/supabase";

// types
import type { SubscriptionPlan } from "../../types/user/subscription";
import type { ProfileData } from "../../types/user/profile";

// api
import {
  getProfile,
  updateProfile,
  deleteAccount
} from "../../api/user/profile";

const palette = {
  accent: "#5ddfcc",
  textDark: "#1e2a47",
  pageBackground: "#DFDCFD",
  cardBackground: "#F2F0FC",
  proBackground: "#211331",
};


const Profile = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  const { session } = useAuth();

  const userId = session?.user.id;
  const email = session?.user.email ?? "";

  const avatarLetter = email
    ? email.charAt(0).toUpperCase()
    : "?";

  const [profile, setProfile] =
    useState<ProfileData | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        setLoading(true);

        const data = await getProfile(userId);

        setProfile(data);

        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleCancelEdit = () => {
    if (!profile) return;

    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
    });

    setEditing(false);
  };

  const handleSave = async () => {
    if (!profile || !userId) return;

    try {
      setSaving(true);

      const updatedProfile = await updateProfile(
        userId,
        {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        }
      );

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: updatedProfile.first_name,
              last_name: updatedProfile.last_name,
            }
          : prev
      );

      enqueueSnackbar(
        intl.formatMessage({
          id: "profile-update-account-success",
        }),
        {
          variant: "success",
        }
      );

      setEditing(false);
    } catch (error) {
      console.error(error);

      enqueueSnackbar(
        intl.formatMessage({
          id: "profile-update-account-error",
        }),
        {
          variant: "success",
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();

      await supabase.auth.signOut();

      navigate("/");

      enqueueSnackbar(
        intl.formatMessage({
          id: "profile-delete-account-success",
        }),
        {
          variant: "success",
        }
      );
    } catch (error) {
      enqueueSnackbar(
        intl.formatMessage({
          id: "profile-delete-account-error",
        }),
        {
          variant: "error",
        }
      );
    }
  };

  const deleteAccountHandler = () => {
    setDeleteDialogOpen(true);
  };

  const formatExpirationDate = (
    value: string | null
  ) => {
    if (!value) {
      return intl.formatMessage({
        id: "profile-subscription-no-expiration",
      });
    }

    return new Intl.DateTimeFormat(
      intl.locale,
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(new Date(value));
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }


  if (!profile) {
    return (
      <Box>
        <Typography
          sx={{
            color: palette.textDark,
          }}
        >
          <FormattedMessage id="profile-load-error" />
        </Typography>
      </Box>
    );
  }

  const isPro =
    profile.subscription_plan === "pro";

  return (
    <Stack
      spacing={3}
      sx={{
        width: "100%",
        maxWidth: 900,
        mx: "auto",
        pb: 4,
      }}
    >
      {/* TITLE */}
      <Box>
        <Typography
          sx={{
            fontSize: {
              xs: 24,
              md: 30,
            },
            fontWeight: 800,
            color: palette.textDark,
          }}
        >
          <FormattedMessage id="profile-title" />
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 14,
            color: alpha(
              palette.textDark,
              0.6
            ),
          }}
        >
          <FormattedMessage id="profile-subtitle" />
        </Typography>
      </Box>

      {/* PERSONAL DATA */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          bgcolor: palette.cardBackground,
          border: `1px solid ${alpha(
            palette.textDark,
            0.08
          )}`,
          boxShadow:
            "0 8px 24px rgba(30, 42, 71, 0.06)",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3.5,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                md: 3.5,
              },
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={3}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
          >
            <Avatar
              sx={{
                width: 82,
                height: 82,

                bgcolor: alpha(
                  palette.accent,
                  0.25
                ),

                color: palette.textDark,

                border: `3px solid ${palette.accent}`,

                fontWeight: 800,
                fontSize: 30,
              }}
            >
              {avatarLetter}
            </Avatar>

            <Box
              sx={{
                flexGrow: 1,
                width: "100%",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 20,
                    color: palette.textDark,
                  }}
                >
                  <FormattedMessage id="profile-personal-data" />
                </Typography>

                {!editing && (
                  <Button
                    startIcon={<EditOutlined />}
                    onClick={() =>
                      setEditing(true)
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      color: palette.textDark,
                      borderRadius: "24px",
                      px: 2,

                      "&:hover": {
                        bgcolor: alpha(
                          palette.accent,
                          0.15
                        ),
                      },
                    }}
                  >
                    <FormattedMessage id="profile-edit" />
                  </Button>
                )}
              </Stack>

              <Divider
                sx={{
                  my: 2.5,
                  borderColor: alpha(
                    palette.textDark,
                    0.08
                  ),
                }}
              />

              <Stack spacing={2}>
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={2}
                >
                  <TextField
                    fullWidth
                    label={intl.formatMessage({
                      id: "profile-first-name",
                    })}
                    value={form.first_name}
                    disabled={!editing}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        first_name:
                          event.target.value,
                      }))
                    }
                  />

                  <TextField
                    fullWidth
                    label={intl.formatMessage({
                      id: "profile-last-name",
                    })}
                    value={form.last_name}
                    disabled={!editing}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        last_name:
                          event.target.value,
                      }))
                    }
                  />
                </Stack>

                <TextField
                  fullWidth
                  label={intl.formatMessage({
                    id: "profile-email",
                  })}
                  value={email}
                  disabled
                />

                {editing && (
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                  >
                    <Button
                      onClick={handleCancelEdit}
                      sx={{
                        borderRadius: "24px",
                        textTransform: "none",
                        fontWeight: 700,
                        color: alpha(
                          palette.textDark,
                          0.65
                        ),
                      }}
                    >
                      <FormattedMessage id="profile-cancel" />
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<SaveOutlined />}
                      disabled={
                        saving ||
                        !form.first_name.trim() ||
                        !form.last_name.trim()
                      }
                      onClick={handleSave}
                      sx={{
                        bgcolor: alpha(
                          palette.accent,
                          0.3
                        ),

                        color:
                          palette.textDark,

                        border: `2px solid ${palette.accent}`,

                        borderRadius: "24px",

                        boxShadow: "none",

                        textTransform: "none",

                        fontWeight: 700,

                        "&:hover": {
                          bgcolor:
                            palette.accent,
                          boxShadow: "none",
                        },
                      }}
                    >
                      <FormattedMessage id="profile-save" />
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* SUBSCRIPTION */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",

          bgcolor: palette.cardBackground,

          border: `1px solid ${alpha(
            palette.textDark,
            0.08
          )}`,

          boxShadow:
            "0 8px 24px rgba(30, 42, 71, 0.06)",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3.5,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                md: 3.5,
              },
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 20,
              color: palette.textDark,
            }}
          >
            <FormattedMessage id="profile-subscription-title" />
          </Typography>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2.5}
            mt={2.5}
          >
            {/* CURRENT PLAN */}
            <Box
              sx={{
                flex: 1,

                p: 2.5,

                borderRadius: 3,

                bgcolor: alpha(
                  palette.textDark,
                  0.04
                ),

                border: `1px solid ${alpha(
                  palette.textDark,
                  0.08
                )}`,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform:
                        "uppercase",
                      letterSpacing: 0.6,
                      color: alpha(
                        palette.textDark,
                        0.55
                      ),
                    }}
                  >
                    <FormattedMessage id="profile-current-plan" />
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontWeight: 800,
                      fontSize: 26,
                      color: palette.textDark,
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {profile.subscription_plan}
                  </Typography>
                </Box>

                <WorkspacePremiumOutlined
                  sx={{
                    fontSize: 38,
                    color: isPro
                      ? palette.accent
                      : alpha(
                          palette.textDark,
                          0.3
                        ),
                  }}
                />
              </Stack>

              <Divider
                sx={{
                  my: 2,
                  borderColor: alpha(
                    palette.textDark,
                    0.08
                  ),
                }}
              />

              <Typography
                sx={{
                  fontFamily: "Montserrat",
                  fontSize: 13,
                  color: alpha(
                    palette.textDark,
                    0.55
                  ),
                }}
              >
                <FormattedMessage id="profile-subscription-expiration" />
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontWeight: 700,
                  fontSize: 15,
                  color: palette.textDark,
                }}
              >
                {formatExpirationDate(
                  profile.subscription_expires_at
                )}
              </Typography>
            </Box>

            {/* PRO OFFER */}
            {!isPro && (
              <Box
                sx={{
                  flex: 1,

                  p: 2.5,

                  borderRadius: 3,

                  bgcolor:
                    palette.proBackground,

                  color: "#fff",

                  position: "relative",

                  overflow: "hidden",

                  "&::after": {
                    content: '""',

                    position: "absolute",

                    width: 150,
                    height: 150,

                    borderRadius: "50%",

                    bgcolor: alpha(
                      palette.accent,
                      0.12
                    ),

                    right: -50,
                    top: -60,
                  },
                }}
              >
                <WorkspacePremiumOutlined
                  sx={{
                    fontSize: 32,
                    color: palette.accent,
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  <FormattedMessage id="profile-pro-title" />
                </Typography>

                <Typography
                  sx={{
                    mt: 0.8,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: alpha(
                      "#ffffff",
                      0.7
                    ),
                  }}
                >
                  <FormattedMessage id="profile-pro-description" />
                </Typography>

                <Stack
                  spacing={0.8}
                  mt={2}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <CheckCircleOutline
                      sx={{
                        fontSize: 18,
                        color:
                          palette.accent,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: 13,
                      }}
                    >
                      <FormattedMessage id="profile-pro-feature-history" />
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <CheckCircleOutline
                      sx={{
                        fontSize: 18,
                        color:
                          palette.accent,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: 13,
                      }}
                    >
                      <FormattedMessage id="profile-pro-feature-statistics" />
                    </Typography>
                  </Stack>
                </Stack>

                <Button
                  disabled
                  sx={{
                    mt: 2.5,
                    px: 2,
                    borderRadius: "24px",
                    bgcolor: palette.accent,
                    color: palette.textDark,
                    fontWeight: 800,
                    textTransform: "none",
                    "&.Mui-disabled": {
                      bgcolor: alpha(
                        palette.accent,
                        0.55
                      ),

                      color: alpha(
                        palette.textDark,
                        0.65
                      ),
                    },
                  }}
                >
                  <FormattedMessage id="profile-pro-coming-soon" />
                </Button>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* PAYMENTS */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,

          bgcolor: palette.cardBackground,

          border: `1px solid ${alpha(
            palette.textDark,
            0.08
          )}`,

          boxShadow:
            "0 8px 24px rgba(30, 42, 71, 0.06)",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                md: 3,
              },
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            justifyContent="space-between"
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,

                  fontSize: 18,

                  color:
                    palette.textDark,
                }}
              >
                <FormattedMessage id="profile-payments-title" />
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  fontFamily:
                    "Montserrat",

                  fontSize: 13,

                  color: alpha(
                    palette.textDark,
                    0.55
                  ),
                }}
              >
                <FormattedMessage id="profile-payments-description" />
              </Typography>
            </Box>

            <Button
              endIcon={
                <ArrowForwardOutlined />
              }
              onClick={() =>
                navigate("/payments")
              }
              sx={{
                px: 2,

                borderRadius: "24px",

                color:
                  palette.textDark,

                bgcolor: alpha(
                  palette.accent,
                  0.18
                ),

                border: `1px solid ${alpha(
                  palette.accent,
                  0.8
                )}`,

                fontWeight: 700,

                textTransform: "none",

                "&:hover": {
                  bgcolor: alpha(
                    palette.accent,
                    0.35
                  ),
                },
              }}
            >
              <FormattedMessage id="profile-payments-open" />
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pt: 1,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<DeleteOutlineOutlined />}
          onClick={deleteAccountHandler}
          sx={{
            px: 2.5,
            py: 1,

            borderRadius: "24px",

            border: `2px solid ${alpha("#d84b4b", 0.65)}`,

            color: "#d84b4b",

            fontWeight: 700,
            fontSize: 13.5,

            textTransform: "none",

            backgroundColor: alpha("#d84b4b", 0.03),

            "&:hover": {
              border: "2px solid #d84b4b",
              backgroundColor: alpha("#d84b4b", 0.09),
            },
          }}
        >
          <FormattedMessage id="profile-delete-account" />
        </Button>
      </Box>


      <ConfirmActionDialog
        open={deleteDialogOpen}
        form={false}
        title={
          <FormattedMessage id="profile-dialog-delete-account-title" />
        }
        message={
          <FormattedMessage id="profile-dialog-delete-account-message" />
        }
        confirmText={
          <FormattedMessage id="profile-dialog-delete-account-confirm" />
        }
        variant="danger"
        onConfirm={async () => {
          await handleDeleteAccount();
          setDeleteDialogOpen(false);
        }}
        onCancel={() => setDeleteDialogOpen(false)}
      />

    </Stack>
  );
};

export default Profile;