import {
  alpha,
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  AccountCircleOutlined,
  BarChartOutlined,
  CalculateOutlined,
  ChevronLeft,
  ChevronRight,
  LockOutlined,
  LoginOutlined,
  LogoutOutlined,
  PersonAddAltOutlined,
  PersonOutline,
  ReceiptLongOutlined,
} from "@mui/icons-material";

import { useState, type MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

// auth
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";

// components
import AuthRequiredDialog from "./Modals/AuthRequiredDialog";

// assets
import Logo from "../assets/images/VAZO-logo.png";

const palette = {
  accent: "#5ddfcc",
  textDark: "#1e2a47",
  drawer: "#211331",
  pageBackground: "#DFDCFD",
  headerBackground: "#D5D1F2",
};

const navbarItems = [
  {
    id: "navbar-calculator",
    path: "/salary-calculator",
    Icon: CalculateOutlined,
    requiresAuth: false,
  },
  {
    id: "navbar-salaries",
    path: "/salaries",
    Icon: ReceiptLongOutlined,
    requiresAuth: true,
  },
  {
    id: "navbar-statistics",
    path: "/salaries-statistics",
    Icon: BarChartOutlined,
    requiresAuth: true,
  },
];

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Navbar = ({
  collapsed,
  setCollapsed,
}: NavbarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();

  const { session } = useAuth();

  const [authDialogOpen, setAuthDialogOpen] =
    useState(false);

  const [accountAnchorEl, setAccountAnchorEl] =
    useState<null | HTMLElement>(null);

  const drawerWidth = collapsed ? 80 : 250;

  const isAuthenticated = !!session;

  const accountMenuOpen = Boolean(accountAnchorEl);

  const displayName =
    session?.user.user_metadata?.full_name ||
    session?.user.email ||
    "";

  const avatarLetter = displayName
    ? displayName.charAt(0).toUpperCase()
    : "?";

  const openAccountMenu = (
    event: MouseEvent<HTMLElement>
  ) => {
    setAccountAnchorEl(event.currentTarget);
  };

  const closeAccountMenu = () => {
    setAccountAnchorEl(null);
  };

  const handleProtectedNavigation = (
    event: MouseEvent,
    requiresAuth: boolean
  ) => {
    if (requiresAuth && !isAuthenticated) {
      event.preventDefault();
      setAuthDialogOpen(true);
    }
  };

  const handleMobileNavigation = (
    path: string,
    requiresAuth: boolean
  ) => {
    if (requiresAuth && !isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    navigate(path);
  };

  const handleProfile = () => {
    closeAccountMenu();
    navigate("/profile");
  };

  const handleLogin = () => {
    closeAccountMenu();
    navigate("/login");
  };

  const handleSignUp = () => {
    closeAccountMenu();
    navigate("/signup");
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error.message);
      return;
    }

    closeAccountMenu();
    navigate("/login");
  };

  const getCurrentMobileSection = () => {
    if (
      location.pathname.startsWith(
        "/salaries-statistics"
      )
    ) {
      return "/salaries-statistics";
    }

    if (
      location.pathname.startsWith("/salaries") ||
      location.pathname.startsWith("/update-salary")
    ) {
      return "/salaries";
    }

    return "/salary-calculator";
  };

  return (
    <>
      {!isMobile ? (
        /*
         * DESKTOP DRAWER
         */
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: drawerWidth,
            flexShrink: 0,

            "& .MuiDrawer-paper": {
              width: drawerWidth,
              bgcolor: palette.drawer,
              color: "#fff",
              fontFamily: "Montserrat",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",

              transition: (theme) =>
                theme.transitions.create("width", {
                  easing:
                    theme.transitions.easing.sharp,
                  duration:
                    theme.transitions.duration.standard,
                }),
            },
          }}
        >
          {/* LOGO */}
          <Toolbar
            sx={{
              mt: 3,
              gap: collapsed ? 0 : 1,
              justifyContent: collapsed
                ? "center"
                : "flex-start",
              userSelect: "none",
            }}
          >
            <Box
              component="img"
              src={Logo}
              width={collapsed ? 40 : 58}
            />

            {!collapsed && (
              <Typography
                sx={{
                  fontFamily: "Poppins",
                  fontSize: 28,
                }}
              >
                Life&Work
              </Typography>
            )}
          </Toolbar>

          {/* NAVIGATION */}
          <List sx={{ mt: 1 }}>
            {navbarItems.map((item) => {
              const isLocked =
                item.requiresAuth &&
                !isAuthenticated;

              const Icon = item.Icon;

              return (
                <ListItem
                  key={item.id}
                  sx={{ px: 1 }}
                >
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    onClick={(event) =>
                      handleProtectedNavigation(
                        event,
                        item.requiresAuth
                      )
                    }
                    sx={{
                      position: "relative",

                      borderRadius: 2,
                      p: 1.6,

                      justifyContent: collapsed
                        ? "center"
                        : "flex-start",

                      opacity: isLocked ? 0.5 : 1,

                      "&:hover": {
                        bgcolor: "#3a2b4c",
                        opacity: isLocked ? 0.75 : 1,
                      },

                      "&.active": {
                        bgcolor: isLocked
                          ? "transparent"
                          : "#667291",

                        fontWeight: 600,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,

                        mr: collapsed ? 0 : 2,

                        justifyContent: "center",

                        color: "inherit",
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 24,
                        }}
                      />
                    </ListItemIcon>

                    {!collapsed && (
                      <>
                        <ListItemText
                          primary={intl.formatMessage({
                            id: item.id,
                          })}
                          primaryTypographyProps={{
                            fontFamily:
                              "Montserrat, sans-serif",

                            fontWeight: 400,
                            fontSize: 17,
                          }}
                        />

                        {isLocked && (
                          <LockOutlined
                            sx={{
                              fontSize: 17,
                              ml: 1,
                            }}
                          />
                        )}
                      </>
                    )}

                    {collapsed && isLocked && (
                      <LockOutlined
                        sx={{
                          position: "absolute",

                          right: 7,
                          bottom: 7,

                          fontSize: 11,
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* COLLAPSE BUTTON */}
          <IconButton
            onClick={() =>
              setCollapsed(!collapsed)
            }
            sx={{
              position: "absolute",

              top: "50%",

              right: collapsed ? 25 : 4,

              bgcolor: "#3E3B59",
              color: "#fff",

              width: 32,
              height: 32,

              "&:hover": {
                bgcolor: "#3a2b4c",
              },

              boxShadow: 3,
            }}
          >
            {collapsed ? (
              <ChevronRight />
            ) : (
              <ChevronLeft />
            )}
          </IconButton>
        </Drawer>
      ) : (
        /*
         * MOBILE NAVIGATION
         */
        <>
          {/* MOBILE TOP BAR */}
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              bgcolor: palette.drawer,
              color: "#fff",

              boxShadow:
                "0 3px 14px rgba(0,0,0,0.16)",
            }}
          >
            <Toolbar
              sx={{
                minHeight: "64px !important",

                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",

                px: 2,
              }}
            >
              {/* BRAND */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                }}
              >
                <Box
                  component="img"
                  src={Logo}
                  width={38}
                />

                <Typography
                  sx={{
                    fontFamily: "Poppins",
                    fontSize: 20,
                    fontWeight: 500,
                  }}
                >
                  Life&Work
                </Typography>
              </Box>

              {/* ACCOUNT */}
              <IconButton
                onClick={openAccountMenu}
                sx={{
                  p: 0.3,
                  color: "#fff",
                }}
              >
                {isAuthenticated ? (
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,

                      bgcolor: alpha(
                        palette.accent,
                        0.22
                      ),

                      color: "#fff",

                      border: `2px solid ${palette.accent}`,

                      fontFamily:
                        "Montserrat, sans-serif",

                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    {avatarLetter}
                  </Avatar>
                ) : (
                  <AccountCircleOutlined
                    sx={{
                      fontSize: 36,
                      color: palette.accent,
                    }}
                  />
                )}
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* MOBILE ACCOUNT MENU */}
          <Menu
            anchorEl={accountAnchorEl}
            open={accountMenuOpen}
            onClose={closeAccountMenu}
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
                  mt: 1,

                  minWidth: 205,

                  borderRadius: 3,

                  bgcolor: "#F2F0FC",

                  border: `1px solid ${alpha(
                    palette.textDark,
                    0.08
                  )}`,

                  boxShadow:
                    "0 10px 28px rgba(0,0,0,0.18)",

                  "& .MuiMenu-list": {
                    py: 1,
                  },

                  "& .MuiMenuItem-root": {
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
            {isAuthenticated ? (
              <>
                <MenuItem
                  onClick={handleProfile}
                  sx={{
                    color: palette.textDark,

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
              </>
            ) : (
              <>
                <MenuItem
                  onClick={handleLogin}
                  sx={{
                    color: palette.textDark,

                    "&:hover": {
                      bgcolor: alpha(
                        palette.accent,
                        0.14
                      ),
                    },
                  }}
                >
                  <LoginOutlined />

                  <FormattedMessage id="header-login" />
                </MenuItem>

                <MenuItem
                  onClick={handleSignUp}
                  sx={{
                    color: palette.textDark,

                    "&:hover": {
                      bgcolor: alpha(
                        palette.accent,
                        0.14
                      ),
                    },
                  }}
                >
                  <PersonAddAltOutlined />

                  <FormattedMessage id="header-sign-up" />
                </MenuItem>
              </>
            )}
          </Menu>

          {/* MOBILE BOTTOM NAVIGATION */}
          <BottomNavigation
            value={getCurrentMobileSection()}
            showLabels
            sx={{
              position: "fixed",

              bottom: 0,
              left: 0,
              right: 0,

              height: 68,

              zIndex: (theme) =>
                theme.zIndex.appBar,

              bgcolor: alpha(
                palette.headerBackground,
                0.98
              ),

              borderTop: `1px solid ${alpha(
                palette.textDark,
                0.1
              )}`,

              boxShadow:
                "0 -4px 16px rgba(30,42,71,0.08)",

              "& .MuiBottomNavigationAction-root":
                {
                  minWidth: 0,

                  color: alpha(
                    palette.textDark,
                    0.58
                  ),

                  fontFamily:
                    "Montserrat, sans-serif",

                  "&.Mui-selected": {
                    color: palette.textDark,
                  },
                },

              "& .MuiBottomNavigationAction-label":
                {
                  fontFamily:
                    "Montserrat, sans-serif",

                  fontSize: "0.68rem",

                  "&.Mui-selected": {
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  },
                },
            }}
          >
            {navbarItems.map((item) => {
              const isLocked =
                item.requiresAuth &&
                !isAuthenticated;

              const Icon = item.Icon;

              return (
                <BottomNavigationAction
                  key={item.id}
                  value={item.path}
                  label={intl.formatMessage({
                    id: item.id,
                  })}
                  onClick={() =>
                    handleMobileNavigation(
                      item.path,
                      item.requiresAuth
                    )
                  }
                  icon={
                    <Box
                      sx={{
                        position: "relative",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        opacity: isLocked
                          ? 0.48
                          : 1,
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 24,
                        }}
                      />

                      {isLocked && (
                        <LockOutlined
                          sx={{
                            position: "absolute",

                            top: -5,
                            right: -8,

                            fontSize: 12,

                            color:
                              palette.textDark,
                          }}
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    opacity: isLocked ? 0.65 : 1,

                    "&.Mui-selected": {
                      "& svg": {
                        color: isLocked
                          ? undefined
                          : palette.accent,
                      },
                    },
                  }}
                />
              );
            })}
          </BottomNavigation>
        </>
      )}

      <AuthRequiredDialog
        open={authDialogOpen}
        onClose={() =>
          setAuthDialogOpen(false)
        }
      />
    </>
  );
};

export default Navbar;