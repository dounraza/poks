const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.post('/register', async (req, res) => {
  const { pseudo, email, password } = req.body;

  if (!pseudo || !email || !password) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { pseudo }
      }
    });

    if (error) {
      throw error;
    }

    console.log('Compte créé avec succès via Supabase Auth', data);
    res.json({ success: true, message: 'Compte créé avec succès', user: data.user });
  } catch (err) {
    console.error('Erreur lors de l inscription:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

router.post('/set-session', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token requis' });

    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ success: true });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Définir le cookie sécurisé
    res.cookie('auth_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true,
      message: 'Connexion réussie',
      user: { id: data.user.id, email: data.user.email, pseudo: data.user.user_metadata.pseudo } 
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(401).json({ success: false, message: 'Identifiants invalides' });
  }
});

router.get('/me', async (req, res) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        pseudo: user.user_metadata.pseudo || 'Joueur'
      }
    });
  } catch (err) {
    console.error('Erreur lors de la récupération de la session:', err);
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
});

module.exports = router;
