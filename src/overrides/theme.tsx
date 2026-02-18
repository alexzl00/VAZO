import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
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
          backgroundColor: '#fff',
          '&:focus .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ccc', // keep border neutral
          },
        },
      },
    },
  },
});

export default theme;