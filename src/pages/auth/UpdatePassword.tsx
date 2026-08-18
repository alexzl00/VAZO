import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import { useNavigate } from 'react-router-dom';

// third party
import { useSnackbar } from 'notistack';
import { useIntl } from 'react-intl';

// auth
import { supabase } from '../../lib/supabase';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const intl = useIntl();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      enqueueSnackbar(
        intl.formatMessage({ id: 'update-password-not-match' }),
        { variant: 'error' }
      );

      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      enqueueSnackbar(
        intl.formatMessage({ id: 'update-password-failed' }),
        { variant: 'error' }
      );

      return;
    }

    enqueueSnackbar(
      intl.formatMessage({ id: 'update-password-success' }),
      { variant: 'success' }
    );

    navigate('/login');
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 450,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 3,
            sm: 5,
          },
          borderRadius: 4,
          bgcolor: '#FFFFFF',
          border: '1px solid rgba(90, 70, 180, 0.12)',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            sx={{
              color: '#2F2A4A',
              mb: 1,
            }}
          >
            {intl.formatMessage({ id: 'update-password-header' })}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#77728D',
            }}
          >
            {intl.formatMessage({ id: 'update-password-subheader' })}
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <TextField
            label={intl.formatMessage({
              id: 'update-password-new-password',
            })}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            sx={textFieldStyles}
          />

          <TextField
            label={intl.formatMessage({
              id: 'update-password-confirm-password',
            })}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            sx={textFieldStyles}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={buttonStyles}
          >
            {loading
              ? intl.formatMessage({ id: 'update-password-loading' })
              : intl.formatMessage({ id: 'update-password-button' })}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,

    '&.Mui-focused fieldset': {
      borderColor: '#7567D8',
    },
  },

  '& .MuiInputLabel-root.Mui-focused': {
    color: '#7567D8',
  },
};

const buttonStyles = {
  mt: 1,
  py: 1.4,
  borderRadius: 3,
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  bgcolor: '#7567D8',

  '&:hover': {
    bgcolor: '#6557C7',
  },
};