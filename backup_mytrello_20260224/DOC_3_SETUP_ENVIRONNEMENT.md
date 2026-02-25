# ⚙️ MyTrello — Guide de configuration de l'environnement

---

## 1. Prérequis

### 1.1 Installer Node.js 20 LTS

```bash
# Télécharger depuis https://nodejs.org (version LTS)
# Vérifier l'installation
node --version   # doit afficher v20.x.x
npm --version    # doit afficher 10.x.x
```

### 1.2 Installer Git

```bash
# Télécharger depuis https://git-scm.com
git --version    # doit afficher 2.40+
```

### 1.3 Éditeur recommandé

**Visual Studio Code** avec les extensions suivantes :
- ESLint
- Prettier — Code formatter
- Tailwind CSS IntelliSense
- SQLite Viewer
- GitLens

---

## 2. Variables d'environnement

Copier `.env.example` en `.env` à la racine du projet et remplir chaque variable.

```bash
cp .env.example .env
```

### 2.1 Contenu du fichier `.env.example`

```env
# ─────────────────────────────────────────────
# ENVIRONNEMENT
# ─────────────────────────────────────────────
NODE_ENV=development
APP_VERSION=0.1.0

# ─────────────────────────────────────────────
# BASE DE DONNÉES
# ─────────────────────────────────────────────
DB_PATH=./database/mytrello.db
DB_MIGRATIONS_PATH=./database/migrations

# ─────────────────────────────────────────────
# MICROSOFT GRAPH API (Outlook 365 / cloud)
# Obtenir depuis : https://portal.azure.com
# ─────────────────────────────────────────────
MICROSOFT_CLIENT_ID=your_azure_client_id_here
MICROSOFT_TENANT_ID=your_azure_tenant_id_here
MICROSOFT_REDIRECT_URI=mytrello://auth/microsoft/callback

# ─────────────────────────────────────────────
# GOOGLE GMAIL API
# Obtenir depuis : https://console.cloud.google.com
# ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=mytrello://auth/google/callback

# ─────────────────────────────────────────────
# CHIFFREMENT (electron-store)
# Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# ─────────────────────────────────────────────
ENCRYPTION_KEY=your_32_bytes_hex_key_here

# ─────────────────────────────────────────────
# LOGS
# ─────────────────────────────────────────────
LOG_LEVEL=debug       # debug | info | warn | error
LOG_FILE=./logs/mytrello.log
```

> ⚠️ **Le fichier `.env` ne doit JAMAIS être commité dans Git.**
> Il est déjà listé dans `.gitignore`.

---

## 3. Configuration Microsoft Graph API (Outlook 365 / cloud)

### 3.1 Créer l'application dans Azure Active Directory

1. Se connecter sur [https://portal.azure.com](https://portal.azure.com)
2. Aller dans **Azure Active Directory → Inscriptions d'applications**
3. Cliquer **Nouvelle inscription**
4. Remplir :
   - **Nom** : `MyTrello`
   - **Types de comptes pris en charge** : `Comptes dans n'importe quel annuaire organisationnel et comptes Microsoft personnels`
   - **URI de redirection** : `mytrello://auth/microsoft/callback` (type : Public client/natif)
5. Cliquer **S'inscrire**
6. Noter le **ID d'application (client)** → c'est votre `MICROSOFT_CLIENT_ID`
7. Noter le **ID de l'annuaire (locataire)** → c'est votre `MICROSOFT_TENANT_ID`

### 3.2 Configurer les permissions API

Dans votre application Azure :
1. Aller dans **Autorisations d'API → Ajouter une autorisation → Microsoft Graph**
2. Sélectionner **Autorisations déléguées** et ajouter :

| Permission | Utilisation |
|---|---|
| `Mail.Read` | Lire les emails |
| `Mail.ReadWrite` | Déplacer, catégoriser les emails |
| `Mail.Send` | Répondre, transférer |
| `MailboxSettings.Read` | Lire les paramètres de la boîte |
| `Calendars.Read` | Lire le calendrier (V2.2+) |
| `offline_access` | Refresh token (reconnexion silencieuse) |

3. Cliquer **Accorder le consentement administrateur** (si vous avez les droits)

### 3.3 Activer le flux de périphérique public

Dans **Authentification** :
- Activer **Autoriser les flux de clients publics** → OUI

---

## 4. Configuration Google Gmail API

### 4.1 Créer le projet Google Cloud

1. Se connecter sur [https://console.cloud.google.com](https://console.cloud.google.com)
2. Créer un nouveau projet : `MyTrello`
3. Aller dans **APIs et services → Bibliothèque**
4. Rechercher et activer **Gmail API**

### 4.2 Configurer l'écran de consentement OAuth

1. Aller dans **APIs et services → Écran de consentement OAuth**
2. Sélectionner **Externe**
3. Remplir :
   - Nom de l'application : `MyTrello`
   - Email d'assistance : votre email
4. Dans **Champs d'application**, ajouter :

| Champ d'application | Utilisation |
|---|---|
| `https://www.googleapis.com/auth/gmail.readonly` | Lire les emails |
| `https://www.googleapis.com/auth/gmail.modify` | Modifier (libellés, archivage) |
| `https://www.googleapis.com/auth/gmail.send` | Envoyer / Répondre |

5. Dans **Utilisateurs test**, ajouter votre email (mode développement)

### 4.3 Créer les identifiants OAuth

1. Aller dans **APIs et services → Identifiants → Créer des identifiants → ID client OAuth 2.0**
2. Sélectionner **Application de bureau**
3. Nom : `MyTrello Desktop`
4. Télécharger le fichier JSON → extraire `client_id` et `client_secret`
5. Renseigner dans `.env` :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## 5. Configuration Exchange on-premise (EWS) — Optionnel

Si vous devez tester avec un serveur Exchange on-premise :

```env
# Ajouter dans .env pour les tests EWS
EWS_SERVER_URL=https://mail.votre-entreprise.com/EWS/Exchange.asmx
EWS_DOMAIN=VOTRE_DOMAINE
EWS_USERNAME=votre.compte@votre-entreprise.com
EWS_PASSWORD=votre_mot_de_passe
```

> ⚠️ Ces informations sont sensibles. Ne jamais les committer.
> En production, elles seront saisies par l'utilisateur dans l'interface.

---

## 6. Génération de la clé de chiffrement

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copier le résultat dans `ENCRYPTION_KEY` de votre `.env`.

---

## 7. Vérification de la configuration

```bash
# Vérifier que toutes les variables sont définies
npm run env:check

# Tester la connexion Microsoft Graph API
npm run test:outlook

# Tester la connexion Gmail API
npm run test:gmail

# Tester la base de données
npm run test:db
```

---

## 8. Configuration VSCode recommandée

Créer le fichier `.vscode/settings.json` :

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.exclude": {
    "node_modules": true,
    "dist": true,
    ".env": false
  }
}
```

---

## 9. Problèmes fréquents

| Problème | Solution |
|---|---|
| `Error: Cannot find module 'better-sqlite3'` | `npm rebuild better-sqlite3` |
| Electron ne démarre pas | Vérifier Node.js 20 LTS, `npm install` relancé |
| Erreur OAuth Microsoft | Vérifier `MICROSOFT_CLIENT_ID` et `MICROSOFT_TENANT_ID` dans `.env` |
| Erreur OAuth Google | Vérifier que votre email est dans les utilisateurs test |
| `ENCRYPTION_KEY` manquante | Générer avec la commande Section 6 |
| Port déjà utilisé | Changer `PORT` dans `.env` (défaut : 3000) |
| Accès refusé à la BDD SQLite | Vérifier les droits d'écriture sur `DB_PATH` |

---

*MyTrello — Setup Environnement — 23 février 2026*
