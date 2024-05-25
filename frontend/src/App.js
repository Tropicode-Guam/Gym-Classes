import React, { createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Landing from './components/Landing';
import Admin from './components/Admin';
import COLOR_PALETTE from './color_palette.json';
import theme from './theme';

const SUB_THEMES = {}
COLOR_PALETTE.forEach((color, index) => {
  SUB_THEMES[`${index}`] = createTheme({
    ...theme,
    palette: {
      ...theme.palette,
      primary: {
        ...theme.palette[`${index}`],
        main: theme.palette[`${index}`].light,
      }
    }
  })
})
export const SubThemeContext = createContext({subThemes: SUB_THEMES});

export function App() {
  return (
    <SubThemeContext.Provider value={{subThemes: SUB_THEMES}}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin" element={<Admin />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </Router>
    </SubThemeContext.Provider>
  );
}

