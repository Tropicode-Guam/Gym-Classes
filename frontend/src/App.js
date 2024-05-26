import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './components/Landing';
import Admin from './components/Admin';

export function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<Admin />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

