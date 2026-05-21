# Modifications prioritaires — C-PRojeTs
_Date : 17 mai 2026 — Complément de AUDIT_IMPLEMENTATION.md_

---

## P0 — Correction 1 : Sanitisation XSS avec DOMPurify

### Contexte
react-quill génère du HTML. Sans sanitisation, du code JavaScript malicieux peut s'exécuter.

### Installation
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### Modification à appliquer dans chaque modal avec rich text

Fichiers concernés :
- `src/components/Card/CardModal.jsx`
- `src/components/SubCategory/SubCategoryModal.jsx`
- `src/components/Category/CategoryModal.jsx`

**Avant :**
```jsx
// Rendu direct du contenu Quill
<div dangerouslySetInnerHTML={{ __html: description }} />
```

**Après :**
```jsx
import DOMPurify from 'dompurify';

// Constante de config à définir une seule fois (ex: dans src/utils/sanitize.js)
const QUILL_ALLOWED = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li',
                 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'class', 'style'],
  ALLOWED_URI_REGEXP: /^(https?|mailto):/i,
};

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description, QUILL_ALLOWED) }} />
```

**Fichier utilitaire à créer** : `src/utils/sanitize.js`
```javascript
import DOMPurify from 'dompurify';

const QUILL_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li',
                 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'class', 'style'],
  ALLOWED_URI_REGEXP: /^(https?|mailto):/i,
};

export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, QUILL_CONFIG);
}
```

---

## P0 — Correction 2 : Error Boundaries

### Contexte
Sans Error Boundary, une exception JavaScript dans un composant fait crasher toute l'application.

### Fichier à créer : `src/components/ErrorBoundary.jsx`
```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Ici : envoyer à un service de monitoring (Sentry, etc.) si besoin
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Une erreur est survenue
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Modification `src/App.jsx`
```jsx
import { ErrorBoundary } from './components/ErrorBoundary';

// Entourer le routeur principal
function App() {
  return (
    <ErrorBoundary>
      <AppContext.Provider value={...}>
        {/* contenu actuel */}
      </AppContext.Provider>
    </ErrorBoundary>
  );
}
```

---

## P1 — Correction 3 : useMemo sur AppContext.Provider

### Contexte
Sans `useMemo`, l'objet `value` est recréé à chaque render, forçant tous les consommateurs à se re-rendre.

### Modification dans `src/context/AppContext.jsx`

Localiser la ligne du `Provider` (vers la fin du fichier) :

**Avant :**
```jsx
return (
  <AppContext.Provider value={{
    boards, currentBoard, columns, cards,
    updateCard, createCard, deleteCard,
    // ... toutes les autres valeurs
  }}>
    {children}
  </AppContext.Provider>
);
```

**Après :**
```jsx
import { useMemo } from 'react';

// Juste avant le return :
const contextValue = useMemo(() => ({
  boards, currentBoard, columns, cards,
  updateCard, createCard, deleteCard,
  // ... toutes les autres valeurs dans le même ordre qu'avant
}), [
  boards, currentBoard, columns, cards,
  updateCard, createCard, deleteCard,
  // ... lister toutes les dépendances
]);

return (
  <AppContext.Provider value={contextValue}>
    {children}
  </AppContext.Provider>
);
```

> **Note** : Les fonctions CRUD définies dans des hooks avec `useCallback` doivent aussi
> être enveloppées dans `useCallback` pour que `useMemo` soit efficace.

---

## P1 — Correction 4 : Validation du JSON importé

### Contexte
Les données importées peuvent corrompre l'état si leur structure est invalide.

### Installation
```bash
npm install zod
```

### Fichier à créer : `src/utils/importSchema.js`
```javascript
import { z } from 'zod';

const SubcategorySchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1).max(500),
  status: z.string().optional(),
  assignee: z.string().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  duration: z.number().nonnegative().optional(),
});

const CategorySchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1).max(500),
  subcategories: z.array(SubcategorySchema).default([]),
});

const CardSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1).max(500),
  priority: z.enum(['urgent', 'normal', 'waiting', 'done']).optional(),
  categories: z.array(CategorySchema).default([]),
});

const ColumnSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1).max(200),
  position: z.number().int().nonnegative().optional(),
  cards: z.array(CardSchema).default([]),
});

const BoardSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1).max(200),
  columns: z.array(ColumnSchema).default([]),
});

export const ImportDataSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  boards: z.array(BoardSchema),
});

export function validateImportData(raw) {
  const result = ImportDataSchema.safeParse(raw);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    };
  }
  return { valid: true, data: result.data, errors: [] };
}
```

### Modification dans `src/services/migration.js`
```javascript
import { validateImportData } from '../utils/importSchema';

// Remplacer la validation existante par :
export function validateImportData(data) {
  const result = validateImportData(data);
  if (!result.valid) {
    console.warn('Import invalide :', result.errors);
    return false;
  }
  return true;
}
```

---

## P2 — Correction 5 : Mémoïsation des composants feuilles

### Contexte
Card, Category, SubCategory se re-rendent inutilement quand une valeur non liée du contexte change.

### Modification `src/components/Card/Card.jsx`
```jsx
import { memo, useCallback } from 'react';

// Entourer l'export avec memo
const Card = memo(function Card({ card, columnId, ...props }) {
  // Contenu existant inchangé
});

export default Card;
```

Même pattern pour :
- `src/components/Category/Category.jsx`
- `src/components/SubCategory/SubCategory.jsx`

> **Important** : `memo` n'est efficace que si les props sont stables.
> Les handlers passés en prop doivent être déclarés avec `useCallback` dans le parent.

---

## P2 — Correction 6 : Découpage AppContext (plan)

### Contexte
AppContext (~1780 lignes) contient l'état de domaines très différents. Le découper réduit
les re-renders et améliore la lisibilité.

### Structure cible

```
src/context/
├── AppContext.jsx         → Fournisseur racine (compose les autres)
├── BoardContext.jsx       → boards, columns, cards, categories, subcategories
├── UIContext.jsx          → theme, modals, panels, activeTab
├── UserContext.jsx        → username, userRole, userSettings
├── LibraryContext.jsx     → libraryItems, favorites
└── MessageContext.jsx     → messages, subcategoryEmails, unreadMentions
```

### Stratégie de migration (sans régression)

**Étape 1** — Créer `UIContext.jsx` (états UI uniquement, pas de données métier) :
```jsx
// États à extraire de AppContext vers UIContext :
// - theme, cardColors
// - isSettingsOpen, isLibraryPanelOpen, isSearchOpen, isGuideOpen
// - activeBoard (ID uniquement, pas l'objet complet)
```

**Étape 2** — Créer `UserContext.jsx` :
```jsx
// États à extraire :
// - username, userRole
// - chapters, zones, gmrItems, functions
```

**Étape 3** — Créer `BoardContext.jsx` (le plus gros, à faire en dernier) :
```jsx
// États à extraire :
// - boards, currentBoard, columns, cards, categories, subcategories
// - Toutes les fonctions CRUD associées
```

**Étape 4** — Composer dans `AppContext.jsx` :
```jsx
export function AppProvider({ children }) {
  return (
    <UserProvider>
      <UIProvider>
        <LibraryProvider>
          <MessageProvider>
            <BoardProvider>
              {children}
            </BoardProvider>
          </MessageProvider>
        </LibraryProvider>
      </UIProvider>
    </UserProvider>
  );
}
```

---

## P3 — Correction 7 : Supprimer le code de migration mytrello_*

### Contexte
Le code de migration des clés localStorage `mytrello_*` → `c-projets_*` date de la v1.
Si tous les utilisateurs sont passés à v1.1+, ce code est inutile.

### Vérification avant suppression
Dans `src/context/AppContext.jsx`, chercher les occurrences de `mytrello` :
```bash
# Dans le terminal du projet :
grep -r "mytrello" src/
```

### Suppression
Supprimer les blocs de type :
```javascript
// À supprimer si présent :
const oldKey = localStorage.getItem('mytrello_boards');
if (oldKey) {
  localStorage.setItem('c-projets_boards', oldKey);
  localStorage.removeItem('mytrello_boards');
}
```

---

## P3 — Correction 8 : Nettoyer les console.log de production

### Vérification
```bash
grep -rn "console.log" src/ --include="*.jsx" --include="*.js"
```

### Option A — Suppression manuelle des logs non essentiels
Supprimer les `console.log` qui affichent des données métier.
Garder uniquement les `console.error` pour les vraies erreurs.

### Option B — Désactivation en production via Vite
Dans `vite.config.js` :
```javascript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,   // Supprime tous les console.* en prod
        drop_debugger: true,
      },
    },
  },
});
```

---

## P3 — Correction 9 : Audit des dépendances inutilisées

### Commande de vérification
```bash
npm install --save-dev depcheck
npx depcheck
```

### Dépendances suspectes à vérifier
| Package | Usage déclaré | À vérifier |
|---------|--------------|------------|
| `react-redux` | Optionnel | `grep -r "useSelector\|useDispatch\|redux" src/` |
| `sql.js` | database.js (Node) | Utilisé dans le renderer ? |
| `googleapis` | Google OAuth | Intégration complète ou partielle ? |
| `@azure/msal-node` | Microsoft OAuth | Intégration complète ou partielle ? |

### Si non utilisés
```bash
npm uninstall react-redux
npm uninstall sql.js
# etc.
```

---

## Ordre d'exécution recommandé

```
Semaine 1 (corrections rapides, pas de régression possible)
  ✅ P0-1 : Installer DOMPurify + créer sanitize.js + modifier les modals
  ✅ P0-2 : Créer ErrorBoundary + l'ajouter dans App.jsx
  ✅ P1-3 : Ajouter useMemo sur AppContext.Provider
  ✅ P3-8 : Configurer drop_console dans vite.config.js

Semaine 2 (validation + mémoïsation)
  ✅ P1-4 : Installer zod + créer importSchema.js + modifier migration.js
  ✅ P2-5 : Ajouter memo() sur Card, Category, SubCategory
  ✅ P3-7 : Supprimer code migration mytrello_* (après vérification)
  ✅ P3-9 : Auditer et nettoyer dépendances inutiles

Semaine 3+ (refactoring structurel)
  ✅ P2-6 : UIContext.jsx créé — theme, cardColors, modals, panels extraits d'AppContext
  ✅ P2   : Board2.jsx simplifié — tab "commandes" extraite dans BoardCommandesTab.jsx (−51% lignes)
```

---

## Tests de non-régression après chaque modification

- [ ] L'application démarre sans erreur console
- [ ] La création/modification/suppression de cartes fonctionne
- [ ] Le drag & drop fonctionne
- [ ] L'import/export de données fonctionne
- [ ] Le thème dark/light fonctionne
- [ ] Le Planning s'affiche correctement
- [ ] La bibliothèque et les favoris fonctionnent
- [ ] Les emails attachés aux tâches sont visibles

---

_Voir aussi : `AUDIT_IMPLEMENTATION.md` (analyse) et `C-PRojeTs_REFACTORING_PLAN.md` (plan structurel)_
