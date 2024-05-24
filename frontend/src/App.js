import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Landing from './components/Landing';
import Admin from './components/Admin';
import COLOR_PALETTE from './color_palette.json';

// https://mui.com/material-ui/customization/palette/#generate-tokens-using-augmentcolor-utility
// create theme from our color choices
// automatically creates light, dark, contrastText colors
let palette = {tonalOffset: 0.5};
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
      fontWeight: 'bold'
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin" element={<Admin />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
