// src/layouts/MainLayout.tsx
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container
        maxWidth="md"
        sx={{
          mt: '40px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
};

export default MainLayout;