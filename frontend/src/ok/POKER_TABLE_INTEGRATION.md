# Guide d'Intégration : Composant Table de Poker

Ce guide explique comment intégrer le composant `PokerTable` dans un projet React existant utilisant **Tailwind CSS** et **React Router**.

## 1. Structure des dossiers
Copiez les dossiers `components`, `types`, `utils` ainsi que le fichier `PokerTable.tsx` (anciennement `App.tsx`) du dossier source `src_mod/` vers votre dossier `src/` de destination.

La structure finale recommandée dans votre dossier `src/` :

```text
src/
├── components/
│   ├── ChairSVG.tsx
│   ├── Cards.tsx
│   └── PlayerSlot.tsx
├── types/
│   └── gameTypes.ts
├── utils/
│   ├── gameUtils.ts
│   └── gameData.ts
└── pages/
    └── PokerTable.tsx  (Renommez le fichier `App.tsx` du module en `PokerTable.tsx`)
```

## 2. Configuration des Styles (`index.css`)
Pour que les styles (effets de halo, rail, feutre) s'affichent correctement, ajoutez ces classes dans votre fichier `src/index.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.room-bg {
  background: radial-gradient(circle at 50% 50%, #1a3a2a 0%, #050505 100%);
}

.table-rail {
  background: #1e1e1e;
}

.table-felt {
  background: radial-gradient(circle, #2d5a3d 0%, #1a3a2a 100%);
  box-shadow: inset 0 0 50px rgba(0,0,0,0.5);
}

.card-face, .card-back {
  background: white;
}
.card-back {
  background: #2563eb; /* Bleu par défaut */
}
```

*Note : Assurez-vous que vos polices d'affichage (`var(--font-display)`) sont définies dans votre configuration Tailwind ou CSS global.*

## 3. Intégration dans le Routage (`App.jsx`)
Dans votre fichier principal de routage (généralement `src/App.jsx` ou `src/App.tsx`), importez et ajoutez la route :

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PokerTable from './pages/PokerTable'; // Import du nouveau composant

function App() {
  return (
    <Router>
      <Routes>
        {/* ... vos autres routes ... */}
        <Route path="/table" element={<PokerTable />} />
      </Routes>
    </Router>
  );
}
```

## 4. Vérification des Dépendances
Assurez-vous que votre projet possède les dépendances nécessaires dans `package.json` :
- `react`, `react-dom`
- `react-router-dom` (si utilisé pour le routage)
- `tailwindcss` (v4 recommandé)
