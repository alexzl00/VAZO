// src/layouts/MainLayout.tsx
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Navbar from '../components/NavBar';

const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex', width: '100%', bgcolor: '#DFDCFD', overscrollBehavior: 'none', fontFamily: "Montserrat" }}>
      <Navbar />
        <Box component="main" sx={{ height: '100vh', width: 'calc(100% - 260px)', flexGrow: 1 }}>
          <Box
            sx={{
              //mt: `${250}px`,
              //height: `calc(100% - ${250}px)`,
              overflowY: 'auto',
              //backgroundImage: `url(${bgPattern})`,
              bgcolor: '#DFDCFD',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'top',
              backgroundSize: { xs: 'cover', md: '120%' },
              transition: "width 0.3s ease"
            }}
          >
            <Container
              //maxWidth="md"
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Outlet />
            </Container>
          </Box>
        </Box>
    </Box>
  );
};

export default MainLayout;