# Afripoks — Module d'inscription/authentification

## Installation

```bash
npm install
cp .env.example .env
# puis remplis .env avec tes vraies infos (base de données, secrets JWT)
```

## Base de données

Exécute le script `db/schema.sql` sur ta base PostgreSQL existante pour créer les tables nécessaires (si elles n'existent pas déjà) :

```bash
psql -U ton_utilisateur -d afripoks -f db/schema.sql
```

## Démarrage

```bash
npm run dev   # avec rechargement automatique (nodemon)
# ou
npm start
```

## Routes disponibles

| Méthode | Route | Description |
|---|---|---|
| POST | /api/auth/register | Inscription d'un nouveau joueur |
| GET | /api/auth/verify-email/:token | Vérification de l'email |
| POST | /api/auth/login | Connexion (retourne un token JWT) |
| GET | /api/auth/me | Profil du joueur connecté (protégé) |

## Points importants pour un site d'argent réel

- **Vérification d'âge (18+)** : déjà intégrée à l'inscription.
- **Email non vérifié à la création** : le compte existe mais `email_verifie = false` tant que le lien n'est pas cliqué. Pense à restreindre les dépôts/retraits aux comptes vérifiés.
- **Envoi d'email** : le code prévoit l'emplacement (`TODO` dans `routes/auth.js`) mais n'envoie rien pour l'instant — il faut brancher un service (SendGrid, Amazon SES, Mailgun...).
- **KYC (vérification d'identité)** : ce module ne couvre que l'inscription de base. Pour un site d'argent réel, la réglementation impose généralement une vérification d'identité (pièce d'identité) avant les retraits — à prévoir dans un module séparé.
- **Rate limiting** : déjà en place sur inscription/connexion pour limiter les abus.
- **Mots de passe** : hashés avec bcrypt (jamais stockés en clair).

## Prochaines étapes suggérées

- Module de dépôt/retrait (portefeuille, intégration paiement)
- Moteur de tables cash game (WebSocket, gestion du rake à 5%)
- Moteur de tournois
