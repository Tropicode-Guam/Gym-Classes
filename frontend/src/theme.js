// src/theme.js
import { createTheme } from '@mui/material/styles';
import COLOR_PALETTE from 'settings/color_palette.json';

// https://mui.com/material-ui/customization/palette/#generate-tokens-using-augmentcolor-utility
// create theme from our color choices
// automatically creates light, dark, contrastText colors
let palette = {
    tonalOffset: {light: 0.5, dark: 0.2},
    primary: {
        main: '#3f51b5',
    },
    secondary: {
        main: '#f50057',
    },
};
COLOR_PALETTE.forEach((color, index) => {
  palette[`${index}`] = {main: color}
})

let theme = createTheme({palette});

palette = {}
COLOR_PALETTE.forEach((color, index) => {
  palette[`${index}`] = theme.palette.augmentColor({
    color: {
      main: color
    },
    name: `${index}`
  })
})
theme = createTheme({
  palette,
  typography: {
    h1: {
      fontWeight: 'bold',
      fontSize: '2rem'
    },
    h2: {
      fontWeight: 'bold'
    },
    h3: {
      fontWeight: 'bold'
    },
    h4: {
      fontWeight: 'bold'
    },
  }
})

export default theme;
