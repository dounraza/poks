import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inscription from './pages/Inscription';
import Connexion from './pages/Connexion';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<h1>Lobby (Accueil)</h1>} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/login" element={<h1>Login</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
