# 🏗️ D-ProjeT — Architecture Technique

---

## 1. Vue d'ensemble

D-ProjeT repose sur **Electron**, qui combine deux processus distincts :

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON APP                         │
│                                                         │
│  ┌──────────────────┐        ┌──────────────────────┐  │
│  │   MAIN PROCESS   │◄──IPC──►  RENDERER PROCESS    │  │
│  │   (electron.js)  │        │  (React / src/)       │  │
│  │                  │        │                       │  │
│  │ - SQLite         │        │ - Composants UI       │  │
│  │ - Auth OAuth     │        │ - Drag & Drop         │  │
│  │ - Graph API      │        │ - Commandes vocales   │  │
│  │ - EWS            │        │ - État global         │  │
│  │ - Gmail API      │        │ - Calendrier          │  │
│  │ - electron-store │        │                       │  │
│  └──────────────────┘        └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Main Process** → accès système, base de données, APIs externes, stockage sécurisé
**Renderer Process** → interface utilisateur React, interactions utilisateur
**IPC (Inter-Process Communication)** → canal de communication entre les deux

---

## 2. Communication IPC (Main ↔ Renderer)

Toutes les opérations sensibles (BDD, APIs externes) passent par IPC.

### 2.1 Convention de nommage des canaux IPC

```
[domaine]:[entité]:[action]

Exemples :
  db:cards:getAll
  db:cards:create
  db:cards:update
  db:cards:delete
  outlook:emails:list
  outlook:emails:move
  gmail:labels:add
  calendar:events:getByTags
  voice:commands:execute
```

### 2.2 Structure d'un appel IPC

```javascript
// Renderer → Main (appel)
const result = await window.electron.invoke('db:cards:create', {
  column_id: 1,
  title: 'Poste 400kV Lyon-Est',
  priority: 'urgent'
});

// Main → Renderer (réponse standardisée)
{
  success: true,
  data: { id: 42, title: 'Poste 400kV Lyon-Est', ... },
  error: null
}

// En cas d'erreur
{
  success: false,
  data: null,
  error: { code: 'DB_INSERT_FAILED', message: '...', details: '...' }
}
```

### 2.3 Exposition sécurisée via preload.js

```javascript
// preload.js — expose uniquement les canaux autorisés
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, data) => {
    const allowedChannels = [
      'db:boards:getAll', 'db:boards:create', /* ... */
      'outlook:emails:list', 'outlook:emails:move', /* ... */
      'gmail:labels:add', /* ... */
      'calendar:events:getByTags', /* ... */
    ];
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Canal IPC non autorisé : ${channel}`);
  }
});
```

---

## 3. Gestion de l'état global (React)

### 3.1 Choix : React Context API

Pour le MVP et les premières versions, **React Context API** est suffisant.
Redux sera envisagé uniquement si la complexité le justifie (V2.x+).

### 3.2 Structure des contextes

```
src/context/
├── AppContext.js          → État global de l'application (thème, paramètres)
├── BoardContext.js        → État du tableau actif (colonnes, cartes)
├── VoiceContext.js        → État de la reconnaissance vocale
├── MessagingContext.js    → État des panels messagerie (Outlook, Gmail)
└── CalendarContext.js     → État du calendrier (tags actifs, vue)
```

### 3.3 Flux de données

```
                    ┌─────────────────┐
                    │   AppContext    │
                    │  (thème, settings)│
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
    │BoardContext │  │VoiceContext  │  │MessagingCtx │
    │colonnes     │  │commandes     │  │emails       │
    │cartes       │  │historique    │  │calendrier   │
    └──────┬──────┘  └──────────────┘  └─────────────┘
           │
    ┌──────▼──────┐
    │  Composants │
    │  UI React   │
    └─────────────┘
```

---

## 4. Architecture des services

### 4.1 Service Base de données (`database.js`)

```javascript
// Pattern : toutes les fonctions retournent { success, data, error }
class DatabaseService {
  // CRUD générique
  getAll(table, filters)
  getById(table, id)
  create(table, data)
  update(table, id, data)
  delete(table, id)

  // Fonctions spécifiques
  reorderItems(table, items)     // Mise à jour des positions
  archiveCard(cardId)            // Archive récursive (catégories + sous-catégories)
  getCardWithChildren(cardId)    // Carte avec toute sa hiérarchie
  saveLibraryItem(element)       // Sérialise en JSON imbriqué
  restoreLibraryItem(itemId, targetType, targetId)
}
```

### 4.2 Interface Outlook (`IOutlookService.js`)

```javascript
// Interface commune — implémentée par outlook.js ET outlookEWS.js
class IOutlookService {
  // Détection
  detectMode()                              // 'graph' | 'ews'

  // Emails
  listEmails(folder, limit, offset)
  getEmail(emailId)
  markAsRead(emailId, isRead)
  moveEmail(emailId, targetFolder)
  applyCategory(emailId, categoryName)
  deleteEmail(emailId)
  sendReply(emailId, body)
  forwardEmail(emailId, to, body)
  listFolders()
  listCategories()

  // Calendrier
  listCalendarTags()
  getEventsByTags(tags, dateFrom, dateTo)
  getEventsForPeriod(dateFrom, dateTo)
}
```

### 4.3 Sélection automatique du service Outlook

```javascript
// outlookDetect.js
async function createOutlookService() {
  try {
    const graphService = new OutlookGraphService();
    await graphService.testConnection();
    return graphService;                    // ✅ Mode cloud
  } catch (e) {
    return new OutlookEWSService();         // 🏢 Mode on-premise
  }
}
```

---

## 5. Flux de données — Drag & Drop

### 5.1 Drag & Drop interne D-ProjeT

```
Utilisateur drag une carte
        │
        ▼
react-beautiful-dnd (onDragEnd)
        │
        ▼
BoardContext.moveItem(source, destination, type)
        │
        ▼
window.electron.invoke('db:cards:move', { id, newColumnId, newPosition })
        │
        ▼
Main Process → DatabaseService.reorderItems()
        │
        ▼
Réponse IPC → BoardContext met à jour l'état local
        │
        ▼
React re-render des composants concernés
```

### 5.2 Drag & Drop email → D-ProjeT

```
Utilisateur drag un email depuis le panel Outlook/Gmail
        │
        ▼
EmailDraggable → données email mises dans le drag payload
        │
        ▼
Drop sur une zone D-ProjeT (Carte / Catégorie / Sous-catégorie)
        │
        ▼
Détection du type de zone cible
        │
        ├── Zone Carte     → createCategoryFromEmail(email, cardId)
        ├── Zone Catégorie → createSubCategoryFromEmail(email, categoryId)
        └── Zone SubCat    → attachEmailLink(email, subCategoryId)
                │
                ▼
        DatabaseService.create() + email_links.create()
```

---

## 6. Flux de données — Commandes vocales

```
Microphone → Web Speech API (SpeechRecognition)
        │
        ▼
voice.js → normalizeText(transcript)
        │
        ▼
commandMatcher.findMatch(normalizedText)
        │
        ├── Match trouvé  → extractParams(command, text)
        │                         │
        │                         ▼
        │                 commandExecutor.execute(command, params)
        │                         │
        │                         ▼
        │                 Action sur BoardContext / IPC / etc.
        │                         │
        │                         ▼
        │                 Toast de confirmation + VoiceHistory.log()
        │
        └── Pas de match → Toast "Commande non reconnue" + VoiceHistory.log()
```

---

## 7. Gestion du mode hors ligne

```
Connexion internet disponible ?
        │
        ├── OUI → Mode normal
        │         - Toutes les fonctionnalités disponibles
        │         - Sync en temps réel ou périodique
        │
        └── NON → Mode hors ligne
                  - D-ProjeT de base : ✅ 100% fonctionnel (SQLite local)
                  - Outlook / Gmail : ❌ Indisponible
                  - Calendrier      : ✅ Données en cache (TTL 5 min)
                  - Commandes vocales : ✅ Fonctionnel (Web Speech API locale)
                  - Indicateur "Hors ligne" dans le header
                  - Reconnexion automatique détectée via navigator.onLine
```

---

## 8. Stratégie de cache

```javascript
// cache.js — Cache en mémoire avec TTL configurable
class CacheService {
  set(key, data, ttlMinutes)
  get(key)              // null si expiré
  invalidate(key)
  invalidatePrefix(prefix)   // ex: invalidatePrefix('outlook:emails')
}

// Clés de cache utilisées
'outlook:emails:inbox'          TTL: 5 min
'outlook:folders'               TTL: 30 min
'outlook:categories'            TTL: 30 min
'gmail:labels'                  TTL: 30 min
'calendar:events:YYYY-MM'       TTL: 15 min
'calendar:tags'                 TTL: 30 min
```

---

## 9. Décisions d'architecture — Justifications

| Décision | Alternative rejetée | Raison du choix |
|---|---|---|
| Electron + React | Tauri, NW.js | Maturité, écosystème npm complet, IPC bien documenté |
| Context API | Redux, Zustand | Suffisant pour ce volume de données, moins de boilerplate |
| SQLite (better-sqlite3) | IndexedDB, PouchDB | Synchrone, performant, SQL standard, pas de serveur |
| react-beautiful-dnd | dnd-kit, react-dnd | API simple, supporte les listes imbriquées |
| framer-motion | CSS transitions, GSAP | Intégration React native, API déclarative |
| Interface IOutlookService | Deux services indépendants | Code UI identique quel que soit le mode Outlook |
| electron-store chiffré | localStorage, fichier JSON | Chiffrement natif, adapté aux tokens OAuth |

---

*D-ProjeT — Architecture Technique — 23 février 2026*
