# 📐 MyTrello — Conventions de code

---

## 1. Nommage des fichiers

| Type | Convention | Exemple |
|---|---|---|
| Composant React | PascalCase | `CardModal.jsx` |
| Service / utilitaire | camelCase | `database.js`, `voice.js` |
| Context React | PascalCase + Context | `BoardContext.js` |
| Hook personnalisé | camelCase + use | `useVoice.js`, `useDragDrop.js` |
| Test unitaire | même nom + `.test` | `database.test.js` |
| Test composant | même nom + `.test` | `Card.test.jsx` |
| Test e2e | sujet + `.spec` | `dragdrop.spec.js` |
| Style CSS module | même nom + `.module.css` | `Card.module.css` |
| Constantes | SCREAMING_SNAKE_CASE | `VOICE_COMMANDS.js` |

---

## 2. Nommage dans le code

### 2.1 Variables et fonctions

```javascript
// ✅ Correct — camelCase pour variables et fonctions
const cardTitle = 'Poste 400kV';
const isArchived = false;
function createCategory(cardId, title) { }
const handleDragEnd = (result) => { };

// ❌ Incorrect
const card_title = '...';
const CardTitle = '...';
function Create_Category() { }
```

### 2.2 Composants React

```javascript
// ✅ Correct — PascalCase pour les composants
function CardModal({ card, onClose }) { }
const CategoryHeader = ({ category }) => { };

// ❌ Incorrect
function card_modal() { }
function cardModal() { }
```

### 2.3 Constantes

```javascript
// ✅ Correct — SCREAMING_SNAKE_CASE pour les constantes globales
const PRIORITIES = { URGENT: 'urgent', NORMAL: 'normal' };
const MAX_VOICE_HISTORY = 20;
const IPC_CHANNELS = { DB_CARDS_CREATE: 'db:cards:create' };

// ❌ Incorrect
const priorities = { urgent: 'urgent' };
const maxVoiceHistory = 20;
```

### 2.4 Props de composants

```javascript
// ✅ Correct — camelCase, booléens préfixés is/has/can/should
<Card
  cardData={card}
  isArchived={false}
  hasComments={true}
  canEdit={true}
  onCardUpdate={handleUpdate}
  onCardDelete={handleDelete}
/>
```

### 2.5 Canaux IPC

```javascript
// ✅ Format : [domaine]:[entité]:[action]
'db:cards:create'
'db:cards:getAll'
'outlook:emails:list'
'outlook:emails:move'
'calendar:events:getByTags'
'voice:commands:history'
```

---

## 3. Structure d'un composant React

```jsx
// ✅ Ordre recommandé dans un composant
import React, { useState, useEffect, useCallback } from 'react';  // 1. React
import PropTypes from 'prop-types';                                 // 2. PropTypes
import { useBoardContext } from '../../context/BoardContext';       // 3. Contextes
import { useVoice } from '../../hooks/useVoice';                   // 4. Hooks custom
import CategoryHeader from './CategoryHeader';                      // 5. Composants enfants
import { formatDate, generateId } from '../../utils';              // 6. Utilitaires
import styles from './Category.module.css';                         // 7. Styles

// 8. Constantes locales au composant
const DEFAULT_COLOR = '#F5F5F5';

// 9. Définition du composant
function Category({ category, onUpdate, onDelete }) {
  // 10. State local
  const [isCollapsed, setIsCollapsed] = useState(category.collapsed);
  const [isEditing, setIsEditing] = useState(false);

  // 11. Contextes
  const { updateCategory } = useBoardContext();

  // 12. Hooks custom
  const { registerCommand } = useVoice();

  // 13. Effets
  useEffect(() => {
    registerCommand(`ouvrir catégorie ${category.title}`, handleOpen);
    return () => { /* cleanup */ };
  }, [category.title]);

  // 14. Handlers
  const handleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleUpdate = useCallback(async (newData) => {
    const result = await updateCategory(category.id, newData);
    if (result.success) onUpdate?.(result.data);
  }, [category.id, updateCategory, onUpdate]);

  // 15. Rendu
  return (
    <div className={styles.category}>
      <CategoryHeader
        category={category}
        isCollapsed={isCollapsed}
        onCollapse={handleCollapse}
      />
      {!isCollapsed && (
        <div className={styles.content}>
          {/* sous-catégories */}
        </div>
      )}
    </div>
  );
}

// 16. PropTypes
Category.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    collapsed: PropTypes.bool,
  }).isRequired,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};

// 17. Valeurs par défaut
Category.defaultProps = {
  onUpdate: null,
  onDelete: null,
};

export default Category;
```

---

## 4. Structure d'un service

```javascript
// ✅ Tous les services retournent { success, data, error }
class DatabaseService {
  async createCard(cardData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO cards (column_id, title, priority, position)
        VALUES (@column_id, @title, @priority, @position)
      `);
      const result = stmt.run(cardData);
      return {
        success: true,
        data: { id: result.lastInsertRowid, ...cardData },
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: {
          code: 'DB_INSERT_FAILED',
          message: 'Impossible de créer la carte',
          details: err.message,
        },
      };
    }
  }
}
```

---

## 5. Conventions Git

### 5.1 Messages de commit (Conventional Commits)

```
<type>(<scope>): <description courte>

[corps optionnel]

[footer optionnel]
```

#### Types autorisés

| Type | Utilisation |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement de comportement |
| `style` | Formatage, espaces, points-virgules |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation uniquement |
| `chore` | Tâches de maintenance (dépendances, config) |
| `perf` | Amélioration de performance |
| `ci` | Configuration CI/CD |

#### Scopes courants

```
board, card, category, subcategory, library, voice,
outlook, gmail, calendar, sync, db, auth, ui, settings
```

#### Exemples

```bash
feat(card): ajouter le drag & drop entre colonnes
fix(voice): corriger la reconnaissance de "créer catégorie"
refactor(db): extraire la logique de réordonnancement
test(outlook): ajouter les tests de connexion EWS
docs(readme): mettre à jour les instructions d'installation
chore(deps): mettre à jour react-beautiful-dnd vers 13.1.1
```

### 5.2 Branches

```bash
# Nouvelle fonctionnalité
git checkout -b feature/drag-drop-categories

# Correction de bug
git checkout -b fix/voice-recognition-fr

# Release
git checkout -b release/v1.1.0
```

### 5.3 Pull Requests

Le titre d'une PR doit suivre le format Conventional Commits.
La description doit inclure :
- Ce qui a été fait
- Comment tester
- Screenshots si changement visuel
- Référence à la phase/version concernée (ex: `Phase 2 — V1.1`)

---

## 6. Configuration ESLint (`.eslintrc.js`)

```javascript
module.exports = {
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/prop-types': 'error',
    'react/jsx-key': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

## 7. Configuration Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

---

## 8. Règles à ne jamais enfreindre

```
❌ Ne jamais committer le fichier .env
❌ Ne jamais committer de token, clé API ou mot de passe
❌ Ne jamais utiliser console.log en production (uniquement console.warn/error)
❌ Ne jamais faire de requête SQL sans paramètres préparés (risque injection)
❌ Ne jamais stocker de données sensibles dans localStorage
❌ Ne jamais merger sur main directement (passer par develop + PR)
❌ Ne jamais committer du code avec des tests en échec
```

---

*MyTrello — Conventions de code — 23 février 2026*
