# Afripoks — Structure du projet

Le projet est maintenant divisé en deux modules distincts : **Backend** et **Frontend**.

---

## 📁 Structure des dossiers

```
poks/
├── backend/                  # Serveur API Express & Supabase
│   ├── .env                  # Variables d'environnement backend
│   ├── models/               # Modèles de données
│   ├── routes/               # Routes API (auth, wallet, etc.)
│   ├── package.json          # Dépendances et scripts backend
│   ├── server.js             # Point d'entrée du serveur Express
│   ├── supabaseClient.js     # Client Supabase
│   └── test-supabase.js      # Script de test de connexion Supabase
│
├── frontend/                 # Application Client React + Vite
│   ├── src/                  # Code source React (pages, composants, styles)
│   │   ├── pages/            # Pages (Index, Connexion, Inscription)
│   │   ├── App.jsx           # Composant racine avec React Router
│   │   ├── main.jsx          # Point d'entrée React
│   │   └── index.html        # Page HTML principale
│   ├── package.json          # Dépendances et scripts frontend
│   └── vite.config.js        # Configuration Vite (avec proxy API vers localhost:3000)
│
└── package.json              # Scripts d'orchestration à la racine
```

---

## 🚀 Démarrage rapide

### 1. Installation des dépendances

À la racine du projet :
```bash
npm run install:all
```
*(ou individuellement avec `npm run install:backend` et `npm run install:frontend`)*

---

### 2. Lancer en mode Développement

Ouvrez deux terminaux :

**Terminal 1 — Backend (API Express sur le port 3000) :**
```bash
npm run dev:backend
# ou dans le dossier backend : cd backend && npm run dev
```

**Terminal 2 — Frontend (Vite sur le port 5173 avec proxy API) :**
```bash
npm run dev:frontend
# ou dans le dossier frontend : cd frontend && npm run dev
```

---

### 3. Commandes utiles à la racine

| Commande | Description |
|---|---|
| `npm run dev:backend` | Démarre le serveur backend avec nodemon |
| `npm run start:backend` | Démarre le serveur backend en mode production |
| `npm --prefix backend run test:mysql` | Teste la connexion à la base de données MySQL |
| `npm run dev:frontend` | Démarre le serveur de développement Vite |
| `npm run build:frontend` | Compile le frontend React pour la production |
| `npm run preview:frontend` | Prévisualise le build du frontend |
| `npm run install:all` | Installe les dépendances du backend et du frontend |

---

## 🔌 Routes API disponibles (Backend)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Vérification de l'état du serveur |
| `POST` | `/api/auth/register` | Inscription d'un nouveau joueur |
| `POST` | `/api/auth/login` | Connexion utilisateur (cookie sécurisé) |
| `GET` | `/api/auth/me` | Profil du joueur connecté (protégé) |
| `GET` | `/api/wallet/balance` | Solde du joueur |
