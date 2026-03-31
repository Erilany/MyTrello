# 🔒 C-PRojeTs — Guide de sécurité

---

## 1. Principes fondamentaux

```
1. Ne jamais stocker de données sensibles en clair
2. Ne jamais exposer les tokens ou clés dans les logs
3. Ne jamais faire confiance aux données venant du Renderer Process
4. Toutes les opérations sensibles passent par le Main Process
5. Valider et assainir toutes les entrées utilisateur
```

---

## 2. Stockage sécurisé des tokens

### 2.1 Librairie utilisée

`electron-store` avec chiffrement AES-256.
Les tokens ne sont **jamais** stockés dans SQLite, localStorage ou en fichier texte.

```javascript
// src/services/auth/secureStore.js
const Store = require('electron-store');

const store = new Store({
  name: 'c-projets-auth',
  encryptionKey: process.env.ENCRYPTION_KEY, // Clé 32 bytes depuis .env
  clearInvalidConfig: true,
});

// Écriture
store.set('microsoft.accessToken', accessToken);
store.set('microsoft.refreshToken', refreshToken);
store.set('microsoft.expiresAt', expiresAt);

// Lecture
const token = store.get('microsoft.accessToken');

// Suppression (déconnexion)
store.delete('microsoft.accessToken');
store.delete('microsoft.refreshToken');
store.delete('microsoft.expiresAt');
```

### 2.2 Données stockées dans electron-store (chiffré)

| Clé                      | Contenu                          | Sensibilité |
| ------------------------ | -------------------------------- | ----------- |
| `microsoft.accessToken`  | Token d'accès Graph API          | 🔴 Critique |
| `microsoft.refreshToken` | Token de refresh Microsoft       | 🔴 Critique |
| `microsoft.expiresAt`    | Date d'expiration du token       | 🟡 Faible   |
| `google.accessToken`     | Token d'accès Gmail API          | 🔴 Critique |
| `google.refreshToken`    | Token de refresh Google          | 🔴 Critique |
| `google.expiresAt`       | Date d'expiration du token       | 🟡 Faible   |
| `ews.password`           | Mot de passe Exchange on-premise | 🔴 Critique |
| `ews.username`           | Nom d'utilisateur Exchange       | 🟠 Moyen    |
| `ews.serverUrl`          | URL serveur Exchange             | 🟠 Moyen    |

### 2.3 Génération de la clé de chiffrement

```bash
# À exécuter UNE SEULE FOIS — stocker le résultat dans .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ La clé `ENCRYPTION_KEY` ne doit jamais être committée dans Git.
> Elle doit être régénérée si elle est compromise.

---

## 3. Variables d'environnement

### 3.1 Règles absolues

```
❌ Ne JAMAIS committer .env dans Git
❌ Ne JAMAIS partager .env par email ou messagerie
❌ Ne JAMAIS afficher les valeurs de .env dans les logs
✅ Utiliser uniquement .env.example (sans valeurs réelles) dans Git
✅ Transmettre les valeurs réelles uniquement via canal sécurisé
```

### 3.2 .gitignore obligatoire

```gitignore
# Variables d'environnement — NE JAMAIS COMMITTER
.env
.env.local
.env.production

# Secrets et clés
*.pem
*.key
*.p12

# Base de données
*.db
*.sqlite

# Logs
logs/
*.log

# Token stores
electron-store/
```

### 3.3 Validation des variables au démarrage

```javascript
// electron.js — Vérification au lancement
const REQUIRED_ENV_VARS = ['ENCRYPTION_KEY', 'DB_PATH'];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.ENCRYPTION_KEY.length < 64) {
    console.error('ENCRYPTION_KEY trop courte (minimum 64 caractères hex)');
    process.exit(1);
  }
}
```

---

## 4. Sécurité Electron (IPC)

### 4.1 Content Security Policy (CSP)

```javascript
// electron.js — Appliquer le CSP dans la fenêtre principale
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self';" +
          "script-src 'self';" +
          "style-src 'self' 'unsafe-inline';" + // TailwindCSS nécessite unsafe-inline
          "img-src 'self' data: https:;" +
          "connect-src 'self' https://graph.microsoft.com https://www.googleapis.com;" +
          "font-src 'self';",
      ],
    },
  });
});
```

### 4.2 Configuration sécurisée de la fenêtre Electron

```javascript
// electron.js
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // ❌ Désactivé — sécurité
    contextIsolation: true, // ✅ Activé — isolation contexte
    enableRemoteModule: false, // ❌ Désactivé — déprécié et risqué
    sandbox: true, // ✅ Activé — sandbox renderer
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

### 4.3 Liste blanche des canaux IPC (preload.js)

```javascript
// preload.js — Seuls les canaux listés ici sont accessibles depuis React
const ALLOWED_CHANNELS = [
  // Base de données
  'db:boards:getAll',
  'db:boards:create',
  'db:boards:update',
  'db:boards:delete',
  'db:columns:getAll',
  'db:columns:create',
  'db:columns:update',
  'db:columns:delete',
  'db:cards:getAll',
  'db:cards:create',
  'db:cards:update',
  'db:cards:delete',
  'db:cards:move',
  'db:cards:archive',
  'db:categories:getAll',
  'db:categories:create',
  'db:categories:update',
  'db:categories:delete',
  'db:categories:move',
  'db:subcategories:getAll',
  'db:subcategories:create',
  'db:subcategories:update',
  'db:subcategories:delete',
  'db:subcategories:move',
  'db:library:getAll',
  'db:library:save',
  'db:library:delete',
  'db:settings:get',
  'db:settings:set',
  // Outlook
  'outlook:auth:connect',
  'outlook:auth:disconnect',
  'outlook:auth:status',
  'outlook:emails:list',
  'outlook:emails:get',
  'outlook:emails:move',
  'outlook:emails:category',
  'outlook:emails:markRead',
  'outlook:emails:delete',
  'outlook:emails:reply',
  'outlook:emails:forward',
  'outlook:folders:list',
  'outlook:categories:list',
  // Calendrier
  'calendar:tags:list',
  'calendar:events:getByTags',
  'calendar:events:getForPeriod',
  // Gmail
  'gmail:auth:connect',
  'gmail:auth:disconnect',
  'gmail:auth:status',
  'gmail:emails:list',
  'gmail:emails:get',
  'gmail:emails:addLabel',
  'gmail:emails:removeLabel',
  'gmail:emails:archive',
  'gmail:emails:delete',
  'gmail:emails:reply',
  'gmail:emails:forward',
  'gmail:labels:list',
  // Sync
  'sync:run',
  'sync:history:get',
  'sync:mapping:getAll',
  'sync:mapping:create',
  'sync:mapping:delete',
  // Export/Import
  'data:export',
  'data:import',
];

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, data) => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
      throw new Error(`Canal IPC non autorisé : ${channel}`);
    }
    return ipcRenderer.invoke(channel, data);
  },
});
```

---

## 5. Protection contre les injections SQL

### 5.1 Règle absolue : requêtes préparées uniquement

```javascript
// ✅ Correct — paramètres liés (prepared statement)
const stmt = db.prepare('SELECT * FROM cards WHERE column_id = ? AND is_archived = ?');
const cards = stmt.all(columnId, 0);

// ✅ Correct — named parameters
const stmt = db.prepare('INSERT INTO cards (title, column_id) VALUES (@title, @column_id)');
stmt.run({ title: cardTitle, column_id: columnId });

// ❌ INTERDIT — concaténation de chaîne
const cards = db.exec(`SELECT * FROM cards WHERE title = '${userInput}'`);
```

### 5.2 Validation des types avant requête

```javascript
// utils/validators.js
function validateCardData(data) {
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error('VALIDATION_FAILED: title doit être une chaîne non vide');
  }
  if (!Number.isInteger(data.column_id) || data.column_id <= 0) {
    throw new Error('VALIDATION_FAILED: column_id doit être un entier positif');
  }
  const VALID_PRIORITIES = ['urgent', 'normal', 'waiting', 'done'];
  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    throw new Error('VALIDATION_FAILED: priority invalide');
  }
  return {
    title: data.title.trim().substring(0, 500), // Limiter la longueur
    column_id: data.column_id,
    priority: data.priority || 'normal',
  };
}
```

---

## 6. Protection des données utilisateur

### 6.1 Données ne devant jamais quitter l'application

```
- Contenu des emails Outlook et Gmail
- Contenu des événements calendrier
- Contenu des cartes, catégories et sous-catégories
- Tokens OAuth (Microsoft et Google)
- Identifiants EWS (Exchange on-premise)
- Clé de chiffrement ENCRYPTION_KEY
```

### 6.2 Anonymisation dans les logs

```javascript
// ✅ Logger des données anonymisées
logger.info('Email reçu', {
  source: 'outlook',
  emailId: hashId(email.id), // Hash — jamais l'ID réel
  hasAttachments: email.attachments.length > 0, // Booléen — jamais le contenu
});

// ❌ Ne jamais logger
logger.info('Email reçu', {
  subject: email.subject, // ❌ Contenu potentiellement sensible
  body: email.body, // ❌ Contenu privé
  token: accessToken, // ❌ Token d'accès
});
```

---

## 7. Audit de sécurité des dépendances

### 7.1 Vérification régulière

```bash
# Vérifier les vulnérabilités
npm audit

# Corriger automatiquement les vulnérabilités non bloquantes
npm audit fix

# Rapport détaillé
npm audit --json > audit-report.json
```

### 7.2 Seuils acceptables

| Niveau       | Action requise                                 |
| ------------ | ---------------------------------------------- |
| **Critical** | Corriger immédiatement avant tout commit       |
| **High**     | Corriger dans les 48h                          |
| **Moderate** | Documenter et corriger dans le sprint en cours |
| **Low**      | Documenter et planifier                        |

### 7.3 Dépendances à surveiller en priorité

```
@azure/msal-node              → Auth Microsoft
@microsoft/microsoft-graph-client → API Graph
googleapis                    → API Google
google-auth-library           → Auth Google
electron-store                → Stockage chiffré
better-sqlite3                → Base de données
ews-javascript-api            → EWS on-premise
electron                      → Framework desktop
```

---

## 8. Checklist de sécurité avant chaque release

```
☐ npm audit — 0 vulnérabilité critique ou haute
☐ .env absent du commit (vérifier git status)
☐ Aucun token ou mot de passe dans le code source (grep -r "token\|password\|secret")
☐ CSP configuré et testé
☐ contextIsolation: true dans electron.js
☐ nodeIntegration: false dans electron.js
☐ Liste blanche IPC à jour dans preload.js
☐ Toutes les requêtes SQL utilisent des paramètres préparés
☐ Validation des entrées en place pour tous les formulaires
☐ Logs vérifiés — aucune donnée sensible
☐ ENCRYPTION_KEY non committée
```

---

_C-PRojeTs — Sécurité — 23 février 2026_
