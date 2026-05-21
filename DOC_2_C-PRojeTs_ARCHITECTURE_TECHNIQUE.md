# 🏗️ C-PRojeTs — Architecture Technique

> **Version actuelle** : application **web browser uniquement** (React + Vite).
> Aucun processus Electron, aucun IPC, aucun backend Node en production.

---

## 1. Vue d'ensemble

```
┌──────────────────────────────────────────────────────────┐
│                     NAVIGATEUR WEB                       │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │               React Application                   │   │
│  │                                                   │   │
│  │   AppContext (données)   UIContext (UI)            │   │
│  │        │                      │                   │   │
│  │        └──── useApp() facade ─┘                   │   │
│  │                                                   │   │
│  │   Board2   Card   Category   SubCategory   ...    │   │
│  └───────────────────────────────────────────────────┘   │
│                        │                                 │
│          ┌─────────────┴─────────────┐                   │
│          │                           │                   │
│  ┌───────▼──────┐         ┌──────────▼────────┐          │
│  │ localStorage │         │  Dexie (IndexedDB) │          │
│  │ (écriture    │         │  (stockage principal│          │
│  │  immédiate)  │         │   grand volume)    │          │
│  └──────────────┘         └───────────────────┘          │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  Microsoft Graph API (Outlook 365)                │   │
│  │  OAuth 2.0 via MSAL.js (browser)                  │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Stack technique

| Composant              | Technologie                              |
| ---------------------- | ---------------------------------------- |
| Interface utilisateur  | **React 18** + Vite                      |
| Styles                 | **TailwindCSS**                          |
| Drag & Drop            | **@hello-pangea/dnd**                    |
| Commandes vocales      | **Web Speech API** (navigateur natif)    |
| Stockage local         | **Dexie (IndexedDB)** + localStorage     |
| Messagerie             | **Microsoft Graph API** (Outlook 365)    |
| Auth messagerie        | **MSAL.js** (`@azure/msal-browser`)      |
| Sanitisation HTML      | **DOMPurify**                            |
| Validation imports     | **Zod**                                  |
| Éditeur riche          | **react-quill**                          |

---

## 3. Gestion de l'état global (React Context)

### 3.1 Structure des contextes

```
src/context/
├── AppContext.jsx    → Données métier (boards, columns, cards, categories,
│                       subcategories, library, messages, emails)
│                       + toutes les fonctions CRUD
└── UIContext.jsx     → État UI pur (theme, cardColors, modals ouverts,
                        panels, activeTab, settings)
```

### 3.2 Pattern useApp()

`useApp()` est une **façade** qui fusionne les deux contextes :

```javascript
export function useApp() {
  const appContext = useContext(AppContext);
  const uiContext = useUIContext();
  return { ...appContext, ...uiContext };
}
```

Tous les composants utilisent `useApp()` — pas de changement d'import nécessaire.

### 3.3 Optimisations

- `useMemo` sur la valeur du `AppContext.Provider` (re-renders réduits)
- `React.memo` sur Card, Category, SubCategory
- `useCallback` sur toutes les fonctions CRUD
- `pendingSaveRef` + debounce 16ms pour éviter le double-save en StrictMode

---

## 4. Stratégie de stockage

### 4.1 Double couche localStorage + IndexedDB

```
Action CRUD
    │
    ▼
saveDb(newDb)
    │
    ├── Écriture IMMÉDIATE → localStorage
    │   (JSON sérialisé, ~5-10 MB, sécurité des données)
    │
    └── Écriture DEBOUNCÉE (800ms) → Dexie / IndexedDB
        (capacité GB, tables structurées)
```

**Pourquoi deux couches ?**
- `localStorage` : écriture synchrone immédiate — garantit qu'aucune donnée n'est perdue
  si l'utilisateur ferme l'onglet dans le délai de debounce
- `Dexie / IndexedDB` : supporte les volumes importants (plusieurs GB vs 5-10 MB localStorage)

### 4.2 Schéma Dexie

```javascript
this.version(1).stores({
  boards:        '++id, title',
  columns:       '++id, board_id, position',
  cards:         '++id, board_id, title',
  categories:    '++id, card_id, title',
  subcategories: '++id, category_id, title',
  library:       '++id, type, title, tags',
});
```

### 4.3 Stockage complémentaire (localStorage direct)

| Clé                    | Contenu                              |
| ---------------------- | ------------------------------------ |
| `c-projets_gmr`        | Items GMR (zones géographiques)      |
| `c-projets_zones`      | Zones du projet                      |
| `c-projets_tags`       | Tags personnalisés                   |
| `c-projets_contracts`  | Contrats/marchés                     |
| `board-{id}-{key}`     | Données spécifiques à un projet      |

---

## 5. Flux de données — Drag & Drop

```
Utilisateur drag une carte
    │
    ▼
@hello-pangea/dnd (onDragEnd)
    │
    ▼
AppContext.moveCard(source, destination)
    │
    ▼
saveDb(newDb) → localStorage + IndexedDB (debounce)
    │
    ▼
React re-render des composants concernés
```

---

## 6. Flux de données — Commandes vocales

```
Microphone → Web Speech API (SpeechRecognition)
    │
    ▼
VoiceControl → normalisation du transcript
    │
    ▼
Correspondance de commande
    │
    ├── Match → action sur AppContext (createCard, updateCard, etc.)
    │           → Toast de confirmation
    │
    └── Pas de match → Toast "Commande non reconnue"
```

---

## 7. Module Messagerie — Outlook 365

> **Scope** : Microsoft 365 uniquement (Graph API).
> EWS on-premise et Gmail ne sont pas supportés.

```
Paramètres → Activer Outlook
    │
    ▼
MSAL.js (browser) → OAuth 2.0 Microsoft
    │
    ▼
Token stocké en mémoire (MSAL cache) ou sessionStorage
    │
    ▼
Appels Microsoft Graph API (fetch depuis le navigateur)
    │
    ├── Liste emails
    ├── Actions (déplacer, taguer, répondre)
    └── Liaison email → Carte/Catégorie/Sous-catégorie
```

**Différence avec l'architecture Electron précédente** : les appels Graph API sont
effectués directement depuis le navigateur (fetch), sans processus backend.
Les tokens ne sont pas chiffrés dans electron-store mais gérés par MSAL.js browser.

---

## 8. Mode hors ligne

```
Connexion internet disponible ?
    │
    ├── OUI → Mode normal
    │         - C-PRojeTs : 100% fonctionnel
    │         - Outlook : fonctionnel si token valide
    │
    └── NON → Mode hors ligne
              - C-PRojeTs de base : ✅ 100% fonctionnel (données locales)
              - Outlook : ❌ Indisponible (API distante)
              - Commandes vocales : ✅ Fonctionnel (Web Speech API locale)
```

---

## 9. Décisions d'architecture

| Décision                       | Alternative rejetée          | Raison                                                     |
| ------------------------------ | ---------------------------- | ---------------------------------------------------------- |
| Web browser uniquement         | Electron desktop             | Simplification du déploiement et de la maintenance         |
| Dexie (IndexedDB)              | SQLite (WASM), PouchDB       | Natif browser, grande capacité, API async simple           |
| Double couche localStorage+IDB | IndexedDB seul               | localStorage garantit la donnée en cas de fermeture rapide |
| Context API (AppContext+UI)     | Redux, Zustand               | Suffisant pour ce volume, moins de boilerplate             |
| MSAL.js browser                | msal-node + backend proxy    | Pas de backend Node nécessaire pour l'auth                 |
| Outlook 365 (Graph API) seul   | EWS on-premise, Gmail        | Périmètre réduit au besoin réel                            |
| @hello-pangea/dnd              | dnd-kit, react-dnd           | Fork maintenu de react-beautiful-dnd, API stable           |

---

_C-PRojeTs — Architecture Technique — mise à jour mai 2026_
