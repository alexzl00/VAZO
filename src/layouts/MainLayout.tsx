import { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Navbar from '../components/NavBar';
import Header from '../components/Header';

const COLLAPSED_WIDTH = 80;
const EXPANDED_WIDTH = 250;

const HEADER_HEIGHT = 72;
const MOBILE_NAVBAR_HEIGHT = 100;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#DFDCFD',
      }}
    >
      {/* SIDEBAR WRAPPER */}
      <Box
        sx={{
          width: isMobile ? 0 : drawerWidth,
          flexShrink: 0,
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
        }}
      >
        <Navbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </Box>

      {/* DESKTOP HEADER */}
      {!isMobile && (
        <Header collapsed={collapsed} />
      )}

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,

          minHeight: '100vh',

          pt: isMobile
            ? `${MOBILE_NAVBAR_HEIGHT + 16}px`
            : `${HEADER_HEIGHT + 16}px`,

          pb: '30px',

          display: 'flex',
          justifyContent: 'center',

          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1200,
            px: 2,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}