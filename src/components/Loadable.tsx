import { Suspense } from 'react';
import React from 'react';

// project imports
import Loader from './Loader';

// mui
import { Button, Stack } from '@mui/material';

// types
import type { ElementType } from 'react';

class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack p={4} alignItems={'center'}>
          <Button
            variant="contained"
            sx={{
              px: 3,
              py: 1
            }}
            onClick={() => window.location.reload()}
          >
            Załaduj ponownie stronę
          </Button>
        </Stack>
      );
    }
    return this.props.children;
  }
}

const Loadable = (Component: ElementType) => (props: any) => (
  <ChunkErrorBoundary>
    <Suspense fallback={<Loader />}>
      <Component {...props} />
    </Suspense>
  </ChunkErrorBoundary>
);

export default Loadable;