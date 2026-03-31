# ⚠️ C-PRojeTs — Stratégie de gestion des erreurs

---

## 1. Principe général

Toute fonction de service retourne un objet standardisé :

```javascript
// Succès
{ success: true,  data: { ... }, error: null }

// Échec
{ success: false, data: null,   error: { code, message, details } }
```

Le code UI ne gère **jamais** d'erreurs brutes. Il consomme uniquement
cet objet standardisé et affiche un retour à l'utilisateur via un _toast_.

---

## 2. Codes d'erreur standardisés

### 2.1 Base de données

| Code                   | Déclencheur                     | Message utilisateur                                                  |
| ---------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `DB_INIT_FAILED`       | Impossible d'initialiser SQLite | "Impossible de démarrer l'application. Vérifiez les droits d'accès." |
| `DB_INSERT_FAILED`     | Échec d'insertion               | "Impossible de créer cet élément. Réessayez."                        |
| `DB_UPDATE_FAILED`     | Échec de mise à jour            | "Impossible de modifier cet élément. Réessayez."                     |
| `DB_DELETE_FAILED`     | Échec de suppression            | "Impossible de supprimer cet élément. Réessayez."                    |
| `DB_NOT_FOUND`         | Élément introuvable             | "Élément introuvable."                                               |
| `DB_CONSTRAINT_FAILED` | Contrainte d'intégrité violée   | "Opération impossible — données liées existantes."                   |
| `DB_MIGRATION_FAILED`  | Échec de migration              | "Mise à jour de la base de données échouée."                         |

### 2.2 Authentification

| Code                        | Déclencheur                   | Message utilisateur                                               |
| --------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `AUTH_MICROSOFT_FAILED`     | Échec OAuth Microsoft         | "Connexion Microsoft échouée. Vérifiez vos identifiants."         |
| `AUTH_GOOGLE_FAILED`        | Échec OAuth Google            | "Connexion Google échouée. Vérifiez vos identifiants."            |
| `AUTH_TOKEN_EXPIRED`        | Token expiré non renouvelable | "Session expirée. Reconnectez-vous."                              |
| `AUTH_TOKEN_REFRESH_FAILED` | Échec du refresh token        | "Session expirée. Reconnectez-vous."                              |
| `AUTH_EWS_FAILED`           | Échec connexion EWS           | "Connexion Exchange échouée. Vérifiez l'URL et vos identifiants." |
| `AUTH_EWS_UNREACHABLE`      | Serveur Exchange inaccessible | "Serveur Exchange inaccessible. Vérifiez la connexion réseau."    |
| `AUTH_PERMISSION_DENIED`    | Permission manquante          | "Permission manquante. Reconnectez-vous pour l'accorder."         |

### 2.3 Outlook / Gmail API

| Code                      | Déclencheur                          | Message utilisateur                                             |
| ------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| `OUTLOOK_FETCH_FAILED`    | Impossible de récupérer les emails   | "Impossible de charger les emails Outlook."                     |
| `OUTLOOK_MOVE_FAILED`     | Impossible de déplacer un email      | "Impossible de déplacer cet email."                             |
| `OUTLOOK_CATEGORY_FAILED` | Impossible d'appliquer une catégorie | "Impossible d'appliquer la catégorie."                          |
| `OUTLOOK_SEND_FAILED`     | Impossible d'envoyer / répondre      | "Impossible d'envoyer l'email."                                 |
| `GMAIL_FETCH_FAILED`      | Impossible de récupérer les emails   | "Impossible de charger les emails Gmail."                       |
| `GMAIL_LABEL_FAILED`      | Impossible d'appliquer un libellé    | "Impossible d'appliquer le libellé."                            |
| `GMAIL_SEND_FAILED`       | Impossible d'envoyer / répondre      | "Impossible d'envoyer l'email."                                 |
| `API_RATE_LIMIT`          | Limite de requêtes API atteinte      | "Trop de requêtes. Réessayez dans quelques secondes."           |
| `API_QUOTA_EXCEEDED`      | Quota API dépassé                    | "Quota API dépassé. Réessayez demain."                          |
| `API_OFFLINE`             | Pas de connexion internet            | "Pas de connexion internet. Fonctionnement en mode hors ligne." |

### 2.4 Calendrier

| Code                          | Déclencheur                            | Message utilisateur                                   |
| ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `CALENDAR_FETCH_FAILED`       | Impossible de récupérer les événements | "Impossible de charger le calendrier."                |
| `CALENDAR_TAGS_FAILED`        | Impossible de récupérer les tags       | "Impossible de charger les catégories du calendrier." |
| `CALENDAR_PERMISSION_MISSING` | Permission Calendars.Read absente      | "Permission calendrier manquante. Reconnectez-vous."  |

### 2.5 Synchronisation

| Code                 | Déclencheur                     | Message utilisateur                                        |
| -------------------- | ------------------------------- | ---------------------------------------------------------- |
| `SYNC_CONFLICT`      | Conflit détecté lors de la sync | "Conflit de synchronisation résolu selon vos préférences." |
| `SYNC_FAILED`        | Erreur générale de sync         | "Synchronisation échouée. Réessayez manuellement."         |
| `SYNC_LOOP_DETECTED` | Boucle infinie détectée         | "Synchronisation interrompue — boucle détectée."           |

### 2.6 Commandes vocales

| Code                      | Déclencheur                   | Message utilisateur                                          |
| ------------------------- | ----------------------------- | ------------------------------------------------------------ |
| `VOICE_NOT_SUPPORTED`     | Web Speech API non disponible | "Commandes vocales non disponibles sur ce système."          |
| `VOICE_PERMISSION_DENIED` | Microphone refusé             | "Accès microphone refusé. Autorisez-le dans les paramètres." |
| `VOICE_RECOGNITION_ERROR` | Erreur de reconnaissance      | "Erreur de reconnaissance vocale. Réessayez."                |
| `VOICE_COMMAND_UNKNOWN`   | Commande non reconnue         | "Commande non reconnue. Dites 'Aide' pour la liste."         |
| `VOICE_COMMAND_FAILED`    | Commande reconnue mais erreur | "Impossible d'exécuter cette commande. Réessayez."           |

### 2.7 Import / Export

| Code                      | Déclencheur                       | Message utilisateur                               |
| ------------------------- | --------------------------------- | ------------------------------------------------- |
| `EXPORT_FAILED`           | Erreur lors de l'export JSON      | "Impossible d'exporter les données."              |
| `IMPORT_INVALID_FORMAT`   | Fichier JSON invalide ou corrompu | "Format de fichier invalide."                     |
| `IMPORT_VERSION_MISMATCH` | Version incompatible              | "Ce fichier provient d'une version incompatible." |
| `IMPORT_FAILED`           | Erreur lors de l'import           | "Impossible d'importer les données."              |

---

## 3. Gestion dans le code

### 3.1 Niveau service — Capturer et standardiser

```javascript
// ✅ Toujours encapsuler dans try/catch et retourner le format standard
async function moveEmail(emailId, targetFolder) {
  try {
    await graphClient.api(`/messages/${emailId}/move`).post({ destinationId: targetFolder });
    return { success: true, data: { emailId, targetFolder }, error: null };
  } catch (err) {
    // Identifier le type d'erreur
    const code =
      err.statusCode === 429
        ? 'API_RATE_LIMIT'
        : err.statusCode === 401
          ? 'AUTH_TOKEN_EXPIRED'
          : 'OUTLOOK_MOVE_FAILED';

    return {
      success: false,
      data: null,
      error: { code, message: ERROR_MESSAGES[code], details: err.message },
    };
  }
}
```

### 3.2 Niveau composant — Afficher et logger

```javascript
// ✅ Le composant consomme le résultat et affiche un toast
const handleMoveEmail = async (emailId, folder) => {
  const result = await window.electron.invoke('outlook:emails:move', { emailId, folder });

  if (result.success) {
    toast.success(`Email déplacé dans "${folder}"`);
  } else {
    toast.error(result.error.message);
    // Logger pour le débogage (jamais en production en clair)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Outlook Move Error]', result.error);
    }
  }
};
```

### 3.3 Gestion globale des erreurs non capturées

```javascript
// electron.js — Main Process
process.on('uncaughtException', err => {
  console.error('[Main Process] Uncaught Exception:', err.message);
  // Ne pas exposer les détails à l'utilisateur
  // Logger dans le fichier de log
  logToFile('CRITICAL', err.message);
});

// src/index.js — Renderer Process
window.addEventListener('unhandledrejection', event => {
  console.error('[Renderer] Unhandled Promise Rejection:', event.reason);
  toast.error('Une erreur inattendue est survenue.');
  event.preventDefault();
});
```

---

## 4. Comportement selon le type d'erreur

### 4.1 Erreurs récupérables (retry automatique)

```javascript
// Erreurs API transitoires → retry automatique (max 3 tentatives)
const RETRYABLE_CODES = ['API_RATE_LIMIT', 'API_OFFLINE', 'OUTLOOK_FETCH_FAILED'];

async function withRetry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();
    if (result.success || !RETRYABLE_CODES.includes(result.error?.code)) {
      return result;
    }
    if (attempt < maxAttempts) {
      await delay(delayMs * attempt); // Backoff exponentiel
    }
  }
  return fn(); // Dernière tentative
}
```

### 4.2 Erreurs d'authentification (re-connexion)

```javascript
// Token expiré → tentative de refresh silencieux → re-connexion si échec
const AUTH_ERRORS = ['AUTH_TOKEN_EXPIRED', 'AUTH_TOKEN_REFRESH_FAILED'];

if (AUTH_ERRORS.includes(result.error?.code)) {
  const refreshed = await authService.refreshToken();
  if (refreshed.success) {
    return fn(); // Réessayer après refresh
  } else {
    // Déconnecter et demander une nouvelle connexion
    authStore.clear();
    toast.error('Session expirée. Reconnectez-vous dans les paramètres.');
  }
}
```

### 4.3 Mode hors ligne

```javascript
// Détecter la perte de connexion
window.addEventListener('offline', () => {
  setAppState({ isOffline: true });
  toast.warn('Connexion perdue — mode hors ligne activé');
});

window.addEventListener('online', () => {
  setAppState({ isOffline: false });
  toast.success('Connexion rétablie');
  syncService.triggerSync(); // Resynchroniser
});

// Bloquer les appels API si hors ligne
if (appState.isOffline && requiresNetwork(channel)) {
  return { success: false, data: null, error: { code: 'API_OFFLINE', message: '...' } };
}
```

---

## 5. Logs

### 5.1 Niveaux de log

| Niveau     | Utilisation                                          |
| ---------- | ---------------------------------------------------- |
| `DEBUG`    | Développement uniquement — détails techniques        |
| `INFO`     | Événements importants — connexions, syncs, créations |
| `WARN`     | Situations anormales mais récupérables               |
| `ERROR`    | Erreurs affectant une fonctionnalité                 |
| `CRITICAL` | Erreurs bloquantes — crash, corruption données       |

### 5.2 Ce qui est logué (et ce qui ne l'est JAMAIS)

```javascript
// ✅ Loguer
logger.info('Connexion Outlook établie', { mode: 'graph', userId: 'hash_anonyme' });
logger.warn('API rate limit atteinte', { retryAfter: 30 });
logger.error('DB_INSERT_FAILED', { table: 'cards', errorCode: 'SQLITE_CONSTRAINT' });

// ❌ Ne JAMAIS loguer
logger.info('Token OAuth', { token: accessToken }); // ❌ Token sensible
logger.info('Email content', { body: email.body }); // ❌ Contenu email
logger.info('EWS credentials', { password: '...' }); // ❌ Mot de passe
```

---

_C-PRojeTs — Gestion des erreurs — 23 février 2026_
