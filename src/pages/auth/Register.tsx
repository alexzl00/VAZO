import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import {useNavigate} from "react-router-dom";
import { useIntl } from 'react-intl';

// thord party
import { useSnackbar } from "notistack";

// auth 
import { supabase } from '../../lib/supabase'

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const intl = useIntl();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // console.log({
    //   email,
    //   password,
    // });

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      enqueueSnackbar(
        intl.formatMessage({ id: 'sign-up-failed' }),
        { variant: 'error' }
      );

      return;
    }

    enqueueSnackbar(
      intl.formatMessage({ id: 'sign-up-success' }),
      { variant: 'success' }
    );

    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 450,
          p: {
            xs: 3,
            sm: 5,
          },
          borderRadius: 4,
          bgcolor: '#FFFFFF',
          border: '1px solid rgba(90, 70, 180, 0.12)',
        }}
      >
        {/* Header */}
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
            {intl.formatMessage({id: 'sign-up-header'})}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#77728D',
            }}
          >
            {intl.formatMessage({id: 'sign-up-subheader'})}
          </Typography>
        </Box>

        {/* Form */}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,

                '&.Mui-focused fieldset': {
                  borderColor: '#7567D8',
                },
              },

              '& .MuiInputLabel-root.Mui-focused': {
                color: '#7567D8',
              },
            }}
          />

          <TextField
            label={intl.formatMessage({id: 'login-password'})}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,

                '&.Mui-focused fieldset': {
                  borderColor: '#7567D8',
                },
              },

              '& .MuiInputLabel-root.Mui-focused': {
                color: '#7567D8',
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
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
            }}
          >
            {intl.formatMessage({id: 'sign-up-confirm'})}
          </Button>
        </Box>

        {/* Login link */}
        <Typography
          variant="body2"
          sx={{
            mt: 3,
            textAlign: 'center',
            color: '#77728D',
          }}
        >
          {intl.formatMessage({id: 'sign-up-already-account'})}{' '}
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            sx={{
              color: '#6557C7',
              fontWeight: 600,
            }}
          >
            {intl.formatMessage({id: 'sign-up-login'})}
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}