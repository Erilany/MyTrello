# 📋 C-PRojeTs — Version 3.0 (Version Finale)

> **Objectif** : Synchronisation Outlook 365 + performances + sécurité + tests automatisés + export/import
> **Prérequis** : V2.0 validée
> **Scope** : Outlook 365 uniquement. Gmail et Calendrier Outlook hors périmètre.

---

## 🎯 Périmètre V3.0

| Nouveautés V3.0                                             | Statut    |
| ----------------------------------------------------------- | --------- |
| Synchronisation tags Outlook 365 ↔ étiquettes C-PRojeTs    | ✅ Inclus |
| Configuration du mapping tags (interface dédiée)            | ✅ Inclus |
| Synchronisation périodique configurable                     | ✅ Inclus |
| Virtualisation des listes longues (react-window)            | ✅ Inclus |
| Lazy loading des emails                                     | ✅ Inclus |
| Mise en cache intelligente                                  | ✅ Inclus |
| Tests unitaires automatisés (Jest)                          | ✅ Inclus |
| Tests de composants (React Testing Library)                 | ✅ Inclus |
| Tests end-to-end (Playwright)                               | ✅ Inclus |
| Audit et validation des entrées                             | ✅ Inclus |
| Export / Import des données complètes                       | ✅ Inclus |
| Changelog intégré à l'application                           | ✅ Inclus |
| Synchronisation libellés Gmail ↔ C-PRojeTs                  | ❌ Hors périmètre (Gmail abandonné) |
| Synchronisation tags calendrier Outlook                     | ❌ Hors périmètre (Calendrier abandonné) |

---

## 🏗️ Évolutions d'architecture V3.0

### Nouveaux composants

```
src/components/
├── Settings/
│   ├── SettingsSync.jsx              ← NOUVEAU (mapping tags Outlook)
│   └── SettingsData.jsx              ← NOUVEAU (export/import)
├── UI/
│   └── Changelog.jsx                 ← NOUVEAU
└── Messaging/
    └── SyncIndicator.jsx             ← NOUVEAU (indicateur sync)
```

### Nouveaux services

```
src/services/
├── sync.js                           ← NOUVEAU (synchronisation tags Outlook)
├── cache.js                          ← NOUVEAU (mise en cache)
├── security.js                       ← NOUVEAU (validation entrées)
└── export.js                         ← NOUVEAU (export/import données)
```

### Infrastructure tests

```
tests/
├── unit/
│   ├── services/
│   │   ├── storage.test.js
│   │   ├── voice.test.js
│   │   ├── outlook.test.js
│   │   └── sync.test.js
│   └── utils/
│       ├── sanitize.test.js
│       └── importSchema.test.js
├── components/
│   ├── Board.test.jsx
│   ├── Card.test.jsx
│   ├── Category.test.jsx
│   ├── Library.test.jsx
│   └── VoiceControl.test.jsx
└── e2e/
    ├── mvp.spec.js
    ├── dragdrop.spec.js
    ├── voice.spec.js
    └── outlook.spec.js
```

### Dépendances à ajouter

```json
"jest":                      "^29.7.0",
"@testing-library/react":    "^14.1.0",
"@playwright/test":          "^1.40.0",
"react-window":              "^1.8.10"
```

---

## 🗄️ Évolutions stockage V3.0

Migration Dexie vers la version 3 :

```javascript
this.version(3).stores({
  boards:        '++id, title',
  columns:       '++id, board_id, position',
  cards:         '++id, board_id, title',
  categories:    '++id, card_id, title',
  subcategories: '++id, category_id, title',
  library:       '++id, type, title, tags',
  email_links:   '++id, ref_type, ref_id, source, email_id',
  tag_mapping:   '++id, source, source_tag',        // ← NOUVEAU
  sync_history:  '++id, source, status, created_at', // ← NOUVEAU
});
```

---

## 🔧 Tâches de développement V3.0

### ÉTAPE 1 — Interface de mapping tags

- [ ] Onglet **Synchronisation** dans les paramètres
- [ ] Tableau de mapping : Tag Outlook ↔ Étiquette C-PRojeTs
- [ ] Sélecteur de direction : → C-PRojeTs / ← Outlook / Bidirectionnel
- [ ] Bouton "Ajouter une règle" / "Supprimer une règle"
- [ ] Bouton "Tester la règle" (simulation sans modification)
- [ ] Règles de résolution de conflits (C-PRojeTs / Outlook prioritaire)
- [ ] Affichage de l'historique des 20 dernières synchronisations

### ÉTAPE 2 — Service de synchronisation (sync.js)

- [ ] Synchronisation Outlook → C-PRojeTs (catégories → étiquettes)
- [ ] Synchronisation C-PRojeTs → Outlook (étiquettes → catégories)
- [ ] Détection et résolution des conflits
- [ ] Synchronisation au démarrage de l'application
- [ ] Synchronisation périodique automatique (intervalle configurable)
- [ ] Synchronisation manuelle (bouton dans l'interface)
- [ ] Prévention des boucles infinies
- [ ] Journalisation dans `sync_history` (Dexie)

### ÉTAPE 3 — Optimisation des performances

- [ ] Installer `react-window` pour la virtualisation des listes
- [ ] Virtualiser la liste des emails Outlook
- [ ] Virtualiser la liste des cartes si > 50 éléments
- [ ] Virtualiser la bibliothèque si > 100 modèles
- [ ] Lazy loading des corps d'emails (chargé à l'ouverture uniquement)
- [ ] Mise en cache des données fréquentes :
  - Liste des dossiers Outlook (TTL : 30 min)
  - Emails récents (TTL : 5 min)
- [ ] Profiling et correction des re-renders React inutiles

### ÉTAPE 4 — Renforcement de la sécurité

- [ ] Audit complet des dépendances (`npm audit`)
- [ ] Correction de toutes les vulnérabilités critiques et hautes
- [ ] Validation et assainissement de toutes les entrées utilisateur
- [ ] Vérification d'intégrité des données importées (Zod)
- [ ] Pas de logs sensibles (tokens, emails) dans la console

### ÉTAPE 5 — Export / Import des données

- [ ] Export complet en JSON (tableaux, cartes, catégories, sous-catégories, bibliothèque)
- [ ] Export filtré (un tableau, une carte, un projet)
- [ ] Import depuis un fichier JSON exporté
- [ ] Validation du fichier importé (Zod) avant import
- [ ] Gestion des conflits lors de l'import (écraser / ignorer / renommer)
- [ ] Vider les archives (avec confirmation)
- [ ] Réinitialisation complète (avec double confirmation)

### ÉTAPE 6 — Tests unitaires (Jest)

- [ ] Tests du service `storage.js` : lecture/écriture localStorage + Dexie
- [ ] Tests du service `voice.js` : correspondances commandes, synonymes, paramètres
- [ ] Tests du service `outlook.js` (avec mocks fetch)
- [ ] Tests du service `sync.js` : sync unidirectionnelle, bidirectionnelle, conflits
- [ ] Tests du service `export.js` : export complet, import valide, import corrompu
- [ ] Tests `utils/sanitize.js` : DOMPurify config
- [ ] Tests `utils/importSchema.js` : validation Zod

### ÉTAPE 7 — Tests de composants (React Testing Library)

- [ ] Tests `Board` : rendu, ajout colonne, suppression
- [ ] Tests `Card` : rendu, édition, archivage, collapse
- [ ] Tests `Category` / `SubCategory` : rendu, édition
- [ ] Tests `Library` : sauvegarde, utilisation, recherche
- [ ] Tests `VoiceControl` : activation, commandes, historique
- [ ] Tests `OutlookPanel` : rendu, navigation, actions

### ÉTAPE 8 — Tests end-to-end (Playwright)

- [ ] `mvp.spec.js` : créer tableau → cartes → catégories → sous-catégories, bibliothèque
- [ ] `dragdrop.spec.js` : drag & drop cartes, catégories, sous-catégories, bibliothèque
- [ ] `voice.spec.js` : activation/désactivation, création, navigation, commande inconnue
- [ ] `outlook.spec.js` (compte test dédié) : connexion OAuth, lecture emails, drag & drop

### ÉTAPE 9 — Changelog et version

- [ ] Composant `Changelog` accessible depuis le menu "À propos"
- [ ] Rédiger le changelog complet (MVP → V3.0)
- [ ] Numérotation sémantique des versions (semver)

---

## 🧪 Tests de validation V3.0

### TEST V3.0-01 — Configuration mapping tags
```
✅ Créer règle Catégorie Outlook "Urgent" ↔ Étiquette C-PRojeTs "Urgent" (bidirectionnel)
✅ La simulation ne modifie aucune donnée réelle
✅ La règle est persistée dans Dexie (tag_mapping)
```

### TEST V3.0-02 — Synchronisation Outlook → C-PRojeTs
```
✅ Catégorie "Urgent" appliquée dans Outlook sur un email lié à une carte
   → l'étiquette "Urgent" apparaît sur la carte C-PRojeTs
✅ Sync journalisée dans sync_history (statut "success")
✅ Pas de boucle infinie (vérifier sync_history)
```

### TEST V3.0-03 — Synchronisation C-PRojeTs → Outlook
```
✅ Étiquette changée dans C-PRojeTs → catégorie mise à jour dans Outlook
✅ Résolution de conflit selon la règle configurée
```

### TEST V3.0-04 — Performances listes longues
```
✅ 100 cartes avec catégories → chargement < 3 secondes, scroll 60fps
✅ 200 emails Outlook → liste virtualisée, scroll fluide
✅ Lazy loading des corps d'emails fonctionne
```

### TEST V3.0-05 — Tests automatisés
```
✅ Jest : couverture ≥ 80% sur les services critiques, 0 test en échec
✅ React Testing Library : tous les composants testés passent
✅ Playwright : tous les scénarios passent en < 10 minutes
```

### TEST V3.0-06 — Sécurité
```
✅ npm audit → 0 vulnérabilité critique / haute
✅ Import fichier JSON corrompu → erreur détectée, aucune donnée modifiée
✅ Aucun token dans les logs console
```

### TEST V3.0-07 — Export / Import
```
✅ Export JSON complet généré sans erreur
✅ Import du fichier → toutes les données restaurées à l'identique
✅ Import fichier corrompu → message d'erreur explicite, données intactes
```

### TEST V3.0-08 — Régression finale
```
✅ Tous les tests V1.x et V2.0 passent toujours
✅ Aucune régression introduite par les optimisations V3.0
```

---

## 📊 Récapitulatif V3.0

| Critère                     | Détail                                          |
| --------------------------- | ----------------------------------------------- |
| **Plateforme**              | Web browser uniquement                          |
| **Synchronisation**         | ✅ Outlook 365 ↔ C-PRojeTs (bidirectionnel)     |
| **Gmail / Calendrier**      | ❌ Hors périmètre                               |
| **Performances**            | ✅ Virtualisées + mises en cache                |
| **Tests automatisés**       | ✅ Unitaires + composants + e2e                 |
| **Sécurité**                | ✅ Audit + validation + DOMPurify + Zod         |
| **Export / Import**         | ✅ JSON complet avec validation Zod             |
| **Base de données**         | Dexie (IndexedDB) version 3                     |

---

_C-PRojeTs — Version 3.0 Finale — mise à jour mai 2026_
