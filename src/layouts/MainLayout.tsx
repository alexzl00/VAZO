// src/layouts/MainLayout.tsx
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Navbar from '../components/NavBar';

const MainLayout = () => {
  return (
    <Box sx={{ minHeight: '100vh', width: '100%', bgcolor: '#DFDCFD', pt: 7, pb: 7, overscrollBehavior: 'none' }}>
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Navbar />
        <Outlet />
      </Container>
    </Box>
  );
};

export default MainLayout;