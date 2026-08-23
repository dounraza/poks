// =========================================
// AFRIPOKS - Serveur principal
// =========================================
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const supabase = require('./supabaseClient');

const app = express();

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
app.use(express.static(require('path').join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Afripoks API en ligne' });
});

// --- Alias pour compatibilité ---
app.get(["/api/session", "/api/me", "/me", "/auth/me"], async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ success: false, message: 'Non authentifié' });

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) throw error;
        res.json({ success: true, user: { id: user.id, email: user.email, pseudo: user.user_metadata.pseudo } });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token invalide' });
    }
});

// --- Afripoks : session + compte ---
app.post("/api/logout", (req, res) => {
  if (req.session && typeof req.session.destroy === 'function') req.session.destroy(() => res.json({ ok: true }));
  else res.json({ ok: true });
});
app.post("/api/account", (req, res) => {
  if (!req.session) return res.status(401).json({ ok: false });
  req.session.user = Object.assign({}, req.session.user || req.session.joueur || {}, req.body || {});
  res.json({ ok: true, user: req.session.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur Afripoks démarré sur le port ${PORT}`);
});
