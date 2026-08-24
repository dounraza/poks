// =========================================
// AFRIPOKS - Serveur principal
// =========================================
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const fs = require('fs');

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const db = require('./db');

const app = express();

const frontendDist = path.join(__dirname, '../frontend/dist');
const localDist = path.join(__dirname, 'dist');
const distPath = fs.existsSync(frontendDist) ? frontendDist : localDist;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Servir les fichiers statiques de l'application React
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const jwt = require('jsonwebtoken');
const User = require('./models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'afripoks_secret_jwt_key_2026';

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, message: 'Afripoks API en ligne', database: 'MySQL Railway Connecté' });
  } catch (err) {
    res.json({ success: true, message: 'Afripoks API en ligne', database_warning: err.message });
  }
});

// --- Alias pour compatibilité (/api/me, /api/session, /me) via MySQL ---
app.get(['/api/session', '/api/me', '/me', '/auth/me'], async (req, res) => {
  let token = req.cookies.auth_token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return res.status(401).json({ success: false, message: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });

    res.json({
      success: true,
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        pseudo: user.name,
        email: user.email,
        solde: user.solde,
        chips: user.solde,
        avatar_url: user.avatar_url,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
});

// --- Afripoks : session + compte ---
app.post(['/api/logout', '/logout'], (req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ success: true, ok: true, message: 'Déconnexion réussie' });
});

app.post('/api/account', async (req, res) => {
  let token = req.cookies.auth_token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ ok: false, message: 'Non authentifié' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.json({ ok: true, user });
  } catch (e) {
    res.status(401).json({ ok: false, message: 'Session invalide' });
  }
});

// Toutes les autres requêtes sont redirigées vers l'index.html de React si disponible
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route not found' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({ success: true, message: 'Afripoks Backend API en ligne. En développement, utilisez le frontend sur http://localhost:5173' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur Afripoks démarré sur le port ${PORT}`);
});
