# 🗂️ C-PRojeTs — README

> Application de gestion de projets à 3 niveaux avec intégration Outlook, Gmail et commandes vocales.

---

## 📋 Prérequis système

| Outil        | Version minimale                  | Vérification     |
| ------------ | --------------------------------- | ---------------- |
| **Node.js**  | 20.x LTS                          | `node --version` |
| **npm**      | 10.x                              | `npm --version`  |
| **Git**      | 2.40+                             | `git --version`  |
| **Windows**  | 10 / 11 (64 bits)                 | —                |
| **Electron** | Installé via npm                  | —                |
| **SQLite**   | Installé via npm (better-sqlite3) | —                |

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-org/C-PRojeTs.git
cd C-PRojeTs
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Remplir le fichier `.env` avec vos valeurs (voir `SETUP_ENVIRONNEMENT.md`).

### 4. Initialiser la base de données

```bash
npm run db:init
```

### 5. Lancer en mode développement

```bash
npm run dev
```

---

## 📦 Scripts disponibles

| Commande                | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Lance Electron + React en mode développement (hot reload)        |
| `npm run build`         | Compile React pour la production                                 |
| `npm run electron`      | Lance uniquement Electron (sans hot reload)                      |
| `npm run db:init`       | Initialise la base de données SQLite                             |
| `npm run db:reset`      | Réinitialise la base de données (⚠️ supprime toutes les données) |
| `npm run db:migrate`    | Applique les migrations en attente                               |
| `npm test`              | Lance les tests unitaires (Jest)                                 |
| `npm run test:watch`    | Tests unitaires en mode watch                                    |
| `npm run test:e2e`      | Lance les tests end-to-end (Playwright)                          |
| `npm run test:coverage` | Rapport de couverture de tests                                   |
| `npm run lint`          | Vérifie le code (ESLint)                                         |
| `npm run lint:fix`      | Corrige automatiquement les erreurs ESLint                       |
| `npm run format`        | Formate le code (Prettier)                                       |

---

## 🏗️ Structure du projet

```
C-PRojeTs/
├── .env.example              → Template variables d'environnement
├── .eslintrc.js              → Configuration ESLint
├── .prettierrc               → Configuration Prettier
├── electron.js               → Point d'entrée Electron (main process)
├── package.json
├── tailwind.config.js
├── database/
│   ├── schema.sql            → Schéma complet de la base de données
│   ├── migrations/           → Fichiers de migration par version
│   └── seeds/                → Données initiales de test
├── src/                      → Code React (renderer process)
│   ├── App.js
│   ├── index.js
│   ├── components/           → Composants React
│   │   ├── Board/
│   │   ├── Card/
│   │   ├── Category/
│   │   ├── SubCategory/
│   │   ├── Library/
│   │   ├── Calendar/
│   │   ├── Messaging/
│   │   ├── VoiceControl/
│   │   ├── Settings/
│   │   ├── UI/
│   │   └── Onboarding/
│   ├── services/             → Logique métier et APIs
│   │   ├── database.js
│   │   ├── voice.js
│   │   ├── sync.js
│   │   ├── cache.js
│   │   ├── security.js
│   │   ├── export.js
│   │   └── messaging/
│   │       ├── IOutlookService.js
│   │       ├── outlook.js
│   │       ├── outlookEWS.js
│   │       ├── outlookCalendar.js
│   │       └── gmail.js
│   ├── hooks/                → Custom React hooks
│   ├── context/              → React Context (état global)
│   ├── utils/                → Fonctions utilitaires
│   └── styles/               → Fichiers CSS globaux
├── tests/
│   ├── unit/                 → Tests Jest
│   ├── components/           → Tests React Testing Library
│   └── e2e/                  → Tests Playwright
└── docs/                     → Documentation projet
    ├── README.md             (ce fichier)
    ├── ARCHITECTURE_TECHNIQUE.md
    ├── SETUP_ENVIRONNEMENT.md
    ├── SCHEMA_BDD_COMPLET.md
    ├── CONVENTIONS_CODE.md
    ├── GLOSSAIRE.md
    ├── GESTION_ERREURS.md
    ├── SECURITE.md
    └── CHANGELOG.md
```

---

## 🔧 Stack technique

| Couche            | Technologie                       | Version |
| ----------------- | --------------------------------- | ------- |
| Desktop           | Electron                          | ^28.x   |
| UI                | React                             | ^18.x   |
| Styles            | TailwindCSS                       | ^3.x    |
| Drag & Drop       | react-beautiful-dnd               | ^13.x   |
| Calendrier        | react-big-calendar                | ^1.x    |
| Dates             | date-fns                          | ^3.x    |
| Animations        | framer-motion                     | ^10.x   |
| Voix              | Web Speech API                    | Native  |
| Base de données   | better-sqlite3                    | ^9.x    |
| Auth Microsoft    | @azure/msal-node                  | ^2.x    |
| Graph API         | @microsoft/microsoft-graph-client | ^3.x    |
| EWS (fallback)    | ews-javascript-api                | ^0.11.x |
| Auth Google       | google-auth-library               | ^9.x    |
| Gmail API         | googleapis                        | ^128.x  |
| Stockage sécurisé | electron-store                    | ^8.x    |
| Tests unitaires   | Jest                              | ^29.x   |
| Tests composants  | @testing-library/react            | ^14.x   |
| Tests e2e         | Playwright                        | ^1.x    |

---

## 🌿 Branches Git

| Branche        | Rôle                               |
| -------------- | ---------------------------------- |
| `main`         | Code stable — releases uniquement  |
| `develop`      | Branche d'intégration principale   |
| `feature/xxx`  | Développement d'une fonctionnalité |
| `fix/xxx`      | Correction de bug                  |
| `release/vX.X` | Préparation d'une release          |

---

## 🤝 Contribuer

1. Créer une branche depuis `develop` : `git checkout -b feature/ma-fonctionnalite`
2. Coder en respectant les conventions (voir `CONVENTIONS_CODE.md`)
3. Lancer les tests : `npm test`
4. Committer selon les conventions (voir `CONVENTIONS_CODE.md`)
5. Ouvrir une Pull Request vers `develop`

---

## 📞 Support

En cas de problème d'installation ou de configuration, consulter `SETUP_ENVIRONNEMENT.md` et `GESTION_ERREURS.md`.

---

_C-PRojeTs — README — 23 février 2026_
