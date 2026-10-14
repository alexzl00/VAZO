import type { ReactNode } from 'react';

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

import {
  Close,
  InfoOutlined,
} from '@mui/icons-material';

type InfoDialogProps = {
  open: boolean;
  info: ReactNode;
  onClose: () => void;
  title?: ReactNode;
};

const InfoDialog = ({
  open,
  info,
  onClose,
  title = 'Info',
}: InfoDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pr: 6,
          fontWeight: 700,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            bgcolor: 'info.main',
            color: 'info.contrastText',
          }}
        >
          <InfoOutlined />
        </Box>

        <Typography
          component="span"
          fontSize={18}
          fontWeight={700}
        >
          {title}
        </Typography>

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          py: 2.5,
          color: 'text.secondary',
        }}
      >
        {info}
      </DialogContent>
    </Dialog>
  );
};

export default InfoDialog;
