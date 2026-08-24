import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inscription from './pages/Inscription';
import Connexion from './pages/Connexion';
import Index from './pages/Index';
// 
import PokerTable from './u/App';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/login" element={<Connexion />} />
        <Route path="/table" element={<PokerTable />} />
      </Routes>
    </Router>
  );
}

export default App;
