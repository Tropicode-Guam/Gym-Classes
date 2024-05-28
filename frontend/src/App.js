import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './components/Landing';
import Admin from './components/Admin';
import { AppBar, Toolbar } from '@mui/material';

const PUBLIC_URL = process.env.PUBLIC_URL || '';

export function App() {
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
          </Toolbar>
        </AppBar>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<Admin />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router >
  );
}

