import { useState } from 'react';
import {
  Box,
  Button,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';

// third party
import { useSnackbar } from 'notistack';
import { useIntl } from 'react-intl';

// auth
import { supabase } from '../../lib/supabase'


export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const intl = useIntl();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // console.log({
    //   email,
    // });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      enqueueSnackbar(
        intl.formatMessage({ id: 'reset-password-failed' }),
        { variant: 'error' }
      );

      return;
    }

    enqueueSnackbar(
      intl.formatMessage({ id: 'reset-password-success' }),
      { variant: 'success' }
    );

    setSubmitted(true);
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
        {!submitted ? (
          <>
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
                {intl.formatMessage({id: 'reset-password-header'})}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#77728D',
                }}
              >
                {intl.formatMessage({id: 'reset-password-subheader'})}
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
                label={intl.formatMessage({id: 'login-email'})}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
                autoComplete="email"
                sx={textFieldStyles}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={buttonStyles}
              >
                {intl.formatMessage({id: 'reset-password-button'})}
              </Button>
            </Box>
          </>
        ) : (
          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              sx={{
                color: '#2F2A4A',
                mb: 2,
              }}
            >
              {intl.formatMessage({id: 'reset-password-success-header'})}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#77728D',
                mb: 3,
              }}
            >
              {intl.formatMessage({id: 'reset-password-success-subheader'})}
            </Typography>

            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
              sx={buttonStyles}
            >
              {intl.formatMessage({id: 'reset-password-back-to-login'})}
            </Button>
          </Box>
        )}

        {!submitted && (
          <Typography
            variant="body2"
            sx={{
              mt: 3,
              textAlign: 'center',
              color: '#77728D',
            }}
          >
            {intl.formatMessage({id: 'reset-password-remember-password'})}{" "}
            <Link
              component={RouterLink}
              to="/login"
              underline="hover"
              sx={{
                color: '#6557C7',
                fontWeight: 600,
              }}
            >
              {intl.formatMessage({id: 'login-button'})}
            </Link>
          </Typography>
        )}
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