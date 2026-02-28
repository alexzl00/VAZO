import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#F7F6FF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ccc', // normal border
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ccc', // disable focus color change
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: '#F7F6FF',
          '&:focus .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ccc', // keep border neutral
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      }
    }
  },
});

export default theme;