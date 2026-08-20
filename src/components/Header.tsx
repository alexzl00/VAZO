import {
  alpha,
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";

import {
  KeyboardArrowDownRounded,
  LoginOutlined,
  LogoutOutlined,
  PersonAddAltOutlined,
  PersonOutline,
} from "@mui/icons-material";

import {
  useState,
  type MouseEvent,
} from "react";

import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";

// auth
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";

const palette = {
  accent: "#5ddfcc",
  textDark: "#1e2a47",
  pageBackground: "#DFDCFD",
  headerBackground: "#D5D1F2",
};

interface HeaderProps {
  collapsed: boolean;
}

const Header = ({
  collapsed,
}: HeaderProps) => {
  const navigate = useNavigate();

  const { session } = useAuth();

  const [anchorEl, setAnchorEl] =
    useState<null | HTMLElement>(null);

  const menuOpen = Boolean(anchorEl);

  const drawerWidth = collapsed ? 80 : 250;

  const isAuthenticated = !!session;

  const displayName =
    session?.user.user_metadata?.full_name ||
    session?.user.email ||
    "";

  const email =
    session?.user.email || "";

  const avatarLetter = displayName
    ? displayName.charAt(0).toUpperCase()
    : "?";

  const openProfileMenu = (
    event: MouseEvent<HTMLElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const closeProfileMenu = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    closeProfileMenu();
    navigate("/profile");
  };

  const logout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(error.message);
      return;
    }

    closeProfileMenu();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        display: {
          xs: "none",
          sm: "block",
        },

        width: `calc(100% - ${drawerWidth}px)`,

        ml: `${drawerWidth}px`,

        bgcolor: alpha(
          palette.headerBackground,
          0.96
        ),

        color: palette.textDark,

        borderBottom: `1px solid ${alpha(
          palette.textDark,
          0.08
        )}`,

        backdropFilter: "blur(12px)",

        boxShadow:
          "0 4px 16px rgba(30, 42, 71, 0.04)",

        transition: (theme) =>
          theme.transitions.create(
            ["width", "margin-left"],
            {
              easing:
                theme.transitions.easing.sharp,

              duration:
                theme.transitions.duration.standard,
            }
          ),
      }}
    >
      <Toolbar
        sx={{
          minHeight: "72px !important",

          px: {
            sm: 2.5,
            md: 4,
          },

          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          gap: 2,
        }}
      >
        {/* PAGE / PRODUCT CONTEXT */}
        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily:
                "Montserrat, sans-serif",

              fontWeight: 700,

              fontSize: {
                sm: 18,
                md: 20,
              },

              lineHeight: 1.2,

              color: palette.textDark,
            }}
          >
            <FormattedMessage id="header-title" />
          </Typography>

          <Typography
            sx={{
              fontFamily:
                "Montserrat, sans-serif",

              fontWeight: 400,

              fontSize: 12.5,

              lineHeight: 1.4,

              mt: 0.4,

              color: alpha(
                palette.textDark,
                0.55
              ),
            }}
          >
            <FormattedMessage id="header-subtitle" />
          </Typography>
        </Box>

        {/* ACCOUNT AREA */}
        {isAuthenticated ? (
          <>
            <Button
              onClick={openProfileMenu}
              disableRipple
              sx={{
                minWidth: 0,

                p: 0.7,
                pl: 0.8,
                pr: 1.2,

                borderRadius: "28px",

                border: `1px solid ${alpha(
                  palette.textDark,
                  0.1
                )}`,

                bgcolor: alpha(
                  palette.textDark,
                  0.04
                ),

                color: palette.textDark,

                textTransform: "none",

                boxShadow:
                  "0 2px 8px rgba(30, 42, 71, 0.04)",

                "&:hover": {
                  bgcolor: alpha(
                    palette.accent,
                    0.16
                  ),

                  borderColor: alpha(
                    palette.accent,
                    0.8
                  ),
                },
              }}
            >
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,

                    bgcolor: alpha(
                      palette.accent,
                      0.22
                    ),

                    color:
                      palette.textDark,

                    border: `2px solid ${alpha(
                      palette.accent,
                      0.9
                    )}`,

                    fontFamily:
                      "Montserrat, sans-serif",

                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {avatarLetter}
                </Avatar>

                <Box
                  sx={{
                    textAlign: "left",

                    minWidth: 0,
                    maxWidth: 190,

                    display: {
                      sm: "none",
                      md: "block",
                    },
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontFamily:
                        "Montserrat, sans-serif",

                      fontWeight: 700,

                      fontSize: 13.5,

                      lineHeight: 1.25,

                      color:
                        palette.textDark,
                    }}
                  >
                    {displayName}
                  </Typography>

                  {email &&
                    displayName !== email && (
                      <Typography
                        noWrap
                        sx={{
                          fontFamily:
                            "Montserrat, sans-serif",

                          fontWeight: 400,

                          fontSize: 11,

                          lineHeight: 1.3,

                          mt: 0.2,

                          color: alpha(
                            palette.textDark,
                            0.52
                          ),
                        }}
                      >
                        {email}
                      </Typography>
                    )}
                </Box>

                <KeyboardArrowDownRounded
                  sx={{
                    fontSize: 20,

                    color: alpha(
                      palette.textDark,
                      0.55
                    ),

                    transform: menuOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",

                    transition:
                      "transform 0.2s ease",
                  }}
                />
              </Stack>
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={closeProfileMenu}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1.2,

                    minWidth: 215,

                    borderRadius: 3,

                    bgcolor: "#F2F0FC",

                    border: `1px solid ${alpha(
                      palette.textDark,
                      0.08
                    )}`,

                    boxShadow:
                      "0 10px 28px rgba(0,0,0,0.16)",

                    "& .MuiMenu-list": {
                      py: 1,
                    },

                    "& .MuiMenuItem-root":
                      {
                        mx: 1,

                        px: 1.5,
                        py: 1.2,

                        borderRadius: 2,

                        gap: 1.2,

                        fontFamily:
                          "Montserrat, sans-serif",

                        fontSize: 14,

                        fontWeight: 500,
                      },
                  },
                },
              }}
            >
              <MenuItem
                onClick={handleProfile}
                sx={{
                  color:
                    palette.textDark,

                  "&:hover": {
                    bgcolor: alpha(
                      palette.accent,
                      0.14
                    ),
                  },
                }}
              >
                <PersonOutline />

                <FormattedMessage id="header-profile" />
              </MenuItem>

              <Divider
                sx={{
                  my: 0.5,
                  mx: 1.5,
                }}
              />

              <MenuItem
                onClick={logout}
                sx={{
                  color: "#d84b4b",

                  "&:hover": {
                    bgcolor: alpha(
                      "#d84b4b",
                      0.08
                    ),
                  },
                }}
              >
                <LogoutOutlined />

                <FormattedMessage id="header-logout" />
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <Button
              variant="outlined"
              startIcon={
                <LoginOutlined />
              }
              onClick={() =>
                navigate("/login")
              }
              sx={{
                height: 40,

                px: 2,

                border: `2px solid ${alpha(
                  palette.accent,
                  0.75
                )}`,

                color:
                  palette.textDark,

                borderRadius: "24px",

                fontFamily:
                  "Montserrat, sans-serif",

                fontSize: 13.5,

                fontWeight: 700,

                textTransform: "none",

                "&:hover": {
                  border: `2px solid ${palette.accent}`,

                  bgcolor: alpha(
                    palette.accent,
                    0.1
                  ),
                },
              }}
            >
              <FormattedMessage id="header-login" />
            </Button>

            <Button
              variant="contained"
              startIcon={
                <PersonAddAltOutlined />
              }
              onClick={() =>
                navigate("/signup")
              }
              sx={{
                height: 40,

                px: 2,

                bgcolor: alpha(
                  palette.accent,
                  0.25
                ),

                color:
                  palette.textDark,

                border: `2px solid ${palette.accent}`,

                borderRadius: "24px",

                fontFamily:
                  "Montserrat, sans-serif",

                fontSize: 13.5,

                fontWeight: 700,

                textTransform: "none",

                boxShadow: "none",

                "&:hover": {
                  bgcolor:
                    palette.accent,

                  boxShadow: "none",
                },
              }}
            >
              <FormattedMessage id="header-sign-up" />
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;