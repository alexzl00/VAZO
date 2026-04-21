import { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/NavBar';

const COLLAPSED_WIDTH = 80;
const EXPANDED_WIDTH = 250;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#DFDCFD' }}>
      
      {/* SIDEBAR WRAPPER (controls width!) */}
      <Box
        sx={{
          width: isMobile ? 0 : drawerWidth,
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          flexShrink: 0,
        }}
      >
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
      </Box>

      {/* MAIN CONTENT (no margin-left EVER) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          mt: isMobile ? '70px' : '15px',

          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1200, px: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}