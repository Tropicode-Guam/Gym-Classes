import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './components/Landing';
import Admin from './components/Admin';
import { AppBar, Toolbar, Checkbox, Box, Tooltip, FormControlLabel, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { OnlyOngoingContext } from './Contexts';

const PUBLIC_URL = process.env.PUBLIC_URL || '';

export function App() {
  const [onlyOngoing, setOnlyOngoing] = useState(true);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.only('sm'));

  return (
    <Router basename={PUBLIC_URL}>
      <div className="App">
        <AppBar position="sticky">
          <Toolbar>
            <img
              src="hilton-logo.png"
              alt='Hilton Logo'
              height="60px"
              style={{
                filter: "invert(100%)",
                WebkitFilter: "invert(100%)"
              }}
            ></img>
            <Box sx={{flexGrow: 1}}></Box>
            <Tooltip 
              title="Only show ongoing classes"
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={onlyOngoing}
                    onChange={(e) => {setOnlyOngoing(e.target.checked)}}
                    sx={{
                      color: 'white',
                      '&.Mui-checked': {
                        color: 'white',
                      }
                    }}>
                      {/* TODO: Add label on mobile? */}
                  </Checkbox>
                }
                label={matches && "Only ongoing classes"}
                sx={{
                  display: { xs: 'none', sm: 'inline' }
                }}
              />
            </Tooltip>
          </Toolbar>
        </AppBar>
        <OnlyOngoingContext.Provider value={onlyOngoing}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin" element={<Admin />} />
            {/* Add more routes as needed */}
          </Routes>
        </OnlyOngoingContext.Provider>
      </div>
    </Router >
  );
}

