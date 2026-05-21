# 📋 C-PRojeTs — Version 2.0

> **Objectif** : Intégration Outlook 365 native — Module messagerie avec drag & drop et commandes vocales
> **Prérequis** : V1.2 validée
> **Scope** : Microsoft 365 / Outlook 365 uniquement (Graph API). EWS on-premise et Gmail non supportés.

---

## 🎯 Périmètre V2.0

| Nouveautés V2.0                                        | Hors périmètre                       |
| ------------------------------------------------------ | ------------------------------------ |
| Activation Outlook par bouton paramètres               | Gmail (abandonné)                    |
| Authentification OAuth 2.0 Microsoft (MSAL.js browser) | EWS on-premise (abandonné)           |
| Panel email Outlook dans l'interface                   | Calendrier Outlook (hors périmètre)  |
| Navigation emails (suivant / précédent)                | Synchronisation tags (V3.0)          |
| Actions sur emails (lire, déplacer, taguer, supprimer) | Tests automatisés (V3.0)             |
| Drag & drop email → Carte / Catégorie / Sous-catégorie |                                      |
| Copier / Coller vocal Outlook → C-PRojeTs              |                                      |
| Création de carte depuis email                         |                                      |
| Commandes vocales Outlook complètes                    |                                      |
| Rafraîchissement automatique des emails                |                                      |
| Indicateur de connexion Outlook                        |                                      |

---

## 🏗️ Évolutions d'architecture V2.0

### Nouveaux composants

```
src/components/
└── Messaging/                         ← NOUVEAU (dossier complet)
    ├── MessagingToggle.jsx            → Bouton activation dans paramètres
    ├── OutlookPanel.jsx               → Panel principal Outlook
    ├── EmailList.jsx                  → Liste des emails
    ├── EmailPreview.jsx               → Aperçu email sélectionné
    ├── EmailActions.jsx               → Barre d'actions (répondre, déplacer...)
    ├── EmailDraggable.jsx             → Email draggable vers C-PRojeTs
    ├── EmailClipboard.jsx             → Indicateur email en mémoire tampon
    └── ConnectionStatus.jsx          → Indicateur connexion Outlook
```

### Nouveaux services

```
src/services/
├── messaging/                         ← NOUVEAU
│   └── outlook.js                     → Microsoft Graph API (fetch navigateur)
└── auth/                              ← NOUVEAU
    └── microsoft.js                   → OAuth 2.0 via MSAL.js browser
```

### Dépendances à ajouter

```json
"@azure/msal-browser": "^3.x"
```

> **Note** : utiliser `@azure/msal-browser` (et non `msal-node`),
> car l'app est une SPA web sans backend Node.

---

## 🗄️ Évolutions stockage V2.0

Les liens email sont stockés dans **Dexie (IndexedDB)**, table `email_links` à ajouter
via une migration de version Dexie :

```javascript
// storage.js — migration vers DB_VERSION 2
this.version(2).stores({
  boards:        '++id, title',
  columns:       '++id, board_id, position',
  cards:         '++id, board_id, title',
  categories:    '++id, card_id, title',
  subcategories: '++id, category_id, title',
  library:       '++id, type, title, tags',
  email_links:   '++id, ref_type, ref_id, source, email_id',  // ← NOUVEAU
});
```

Structure d'un `email_link` :

```javascript
{
  id:          number,     // auto-incrémenté
  ref_type:    string,     // 'card' | 'category' | 'subcategory'
  ref_id:      number,     // ID de l'élément C-PRojeTs
  source:      'outlook',
  email_id:    string,     // ID email côté Graph API
  subject:     string,
  sender:      string,
  received_at: string,     // ISO date
  linked_at:   string,     // ISO date
}
```

Les tokens OAuth sont gérés par **MSAL.js** (cache browser en sessionStorage/localStorage),
pas dans Dexie.

---

## 🔧 Tâches de développement V2.0

### ÉTAPE 1 — Configuration Microsoft Graph API

- [ ] Enregistrer l'application dans Azure Active Directory (portail Azure)
- [ ] Configurer le type d'application : **SPA** (Single Page Application)
- [ ] Configurer les permissions déléguées :
  - `Mail.Read` — Lecture des emails
  - `Mail.ReadWrite` — Modification / déplacement
  - `Mail.Send` — Envoi / réponse
  - `MailboxSettings.Read` — Paramètres boîte mail
- [ ] Configurer l'URL de redirection OAuth (ex: `http://localhost:5173/auth`)
- [ ] Implémenter le flux OAuth 2.0 avec `@azure/msal-browser`
- [ ] Gérer le rafraîchissement automatique des tokens (MSAL s'en charge)
- [ ] Gérer la révocation (déconnexion)

### ÉTAPE 2 — Bouton d'activation Outlook (paramètres)

- [ ] Ajouter l'onglet **Messagerie** dans les paramètres
- [ ] Bouton à cocher "Activer Microsoft Outlook"
- [ ] Au premier coche → lancer le flux OAuth Microsoft (popup ou redirect)
- [ ] Indicateur de statut : Non connecté / Connexion en cours / Connecté
- [ ] Bouton "Se déconnecter" (révoque la session MSAL)
- [ ] Persistance de l'état activé/désactivé (localStorage)

### ÉTAPE 3 — Service Outlook (outlook.js)

- [ ] Lister les emails de la boîte de réception (pagination)
- [ ] Lire le contenu complet d'un email (corps HTML + texte)
- [ ] Marquer un email comme lu / non lu
- [ ] Déplacer un email dans un dossier
- [ ] Appliquer une catégorie Outlook sur un email
- [ ] Supprimer un email (corbeille)
- [ ] Répondre à un email
- [ ] Transférer un email
- [ ] Lister les dossiers disponibles
- [ ] Lister les catégories disponibles
- [ ] Rafraîchissement automatique toutes les X minutes (configurable)

### ÉTAPE 4 — Panel Outlook dans l'interface

- [ ] Panel latéral (configurable gauche ou droit)
- [ ] Liste des emails : expéditeur, sujet, date, indicateur lu/non lu
- [ ] Email sélectionné → aperçu complet dans un panneau dédié
- [ ] Barre d'actions : Répondre / Transférer / Déplacer / Supprimer / Taguer
- [ ] Navigation clavier dans la liste (touches ↑ ↓)
- [ ] Bouton Rafraîchir manuel
- [ ] Indicateur de connexion en temps réel
- [ ] Badge nombre d'emails non lus

### ÉTAPE 5 — Drag & Drop email → C-PRojeTs

- [ ] Rendre chaque email draggable (`EmailDraggable`)
- [ ] Zones de dépôt sur Cartes, Catégories, Sous-catégories
- [ ] Mise en évidence de la zone de dépôt au survol
- [ ] À la dépose sur une **Carte** → créer une Catégorie avec les données email
- [ ] À la dépose sur une **Catégorie** → créer une Sous-catégorie
- [ ] À la dépose sur une **Sous-catégorie** → attacher comme note/lien
- [ ] Enregistrer le lien dans la table `email_links` (Dexie)
- [ ] Indicateur visuel sur l'élément C-PRojeTs "Email lié"

### ÉTAPE 6 — Copier / Coller vocal Outlook → C-PRojeTs

- [ ] Mémoire tampon email (state AppContext ou localStorage)
- [ ] Commande _"Copie email dans C-PRojeTs"_ → stocke l'email en mémoire tampon
- [ ] Indicateur visuel persistant de l'email en mémoire tampon
- [ ] Commande _"Colle l'email ici"_ → crée l'élément dans la cible active
- [ ] Bouton "Vider le presse-papier email" dans l'indicateur
- [ ] Vidage automatique après collage

### ÉTAPE 7 — Commandes vocales Outlook

#### Navigation emails
- [ ] _"Ouvrir Outlook"_ → Bascule vers le panel Outlook
- [ ] _"Email suivant"_ / _"Email précédent"_ → Navigation dans la liste
- [ ] _"Ouvre l'email"_ / _"Ferme l'email"_

#### Actions sur emails
- [ ] _"Répondre"_, _"Transférer à [nom]"_
- [ ] _"Marquer comme lu"_ / _"Marquer comme non lu"_
- [ ] _"Supprimer l'email"_ (avec confirmation)
- [ ] _"Déplacer dans [dossier]"_
- [ ] _"Taguer [catégorie]"_
- [ ] _"Afficher emails de [projet]"_

#### Liaison Outlook → C-PRojeTs
- [ ] _"Crée une carte"_ → Crée une carte depuis l'email ouvert
- [ ] _"Copie email dans C-PRojeTs"_ → Met en mémoire tampon
- [ ] _"Colle l'email ici"_ → Colle dans l'élément actif C-PRojeTs
- [ ] _"Lier à la carte [nom]"_

---

## 🧪 Tests de validation V2.0

### TEST V2.0-01 — Activation Outlook
```
✅ La popup OAuth Microsoft s'ouvre
✅ Après connexion, le panel Outlook apparaît
✅ Les emails de la boîte de réception sont listés (50 max)
✅ Le token est conservé après rechargement de page (MSAL cache)
✅ L'indicateur de connexion affiche "Connecté"
```

### TEST V2.0-02 — Navigation et lecture emails
```
✅ Cliquer sur un email → aperçu complet affiché
✅ L'email est marqué comme lu automatiquement
✅ Navigation ↑ ↓ clavier fonctionne
```

### TEST V2.0-03 — Actions sur les emails
```
✅ Déplacement dans un dossier → l'email disparaît de la réception
✅ Application d'une catégorie Outlook → visible dans C-PRojeTs ET dans Outlook
✅ Rafraîchissement automatique toutes les 5 min
```

### TEST V2.0-04 — Drag & drop email → Carte
```
✅ Une catégorie est créée avec titre = sujet, description = corps email
✅ L'icône "Email lié" apparaît sur la catégorie
✅ Le lien est enregistré dans Dexie (email_links)
```

### TEST V2.0-05 — Drag & drop email → Catégorie / Sous-catégorie
```
✅ Drop sur catégorie → sous-catégorie créée
✅ Drop sur sous-catégorie → email attaché comme lien
```

### TEST V2.0-06 — Copier / Coller vocal
```
✅ "Copie email dans C-PRojeTs" → indicateur tampon visible
✅ "Colle l'email ici" → élément créé, tampon vidé
✅ Sans email ouvert → message "Aucun email sélectionné"
```

### TEST V2.0-07 — Déconnexion et hors ligne
```
✅ Se déconnecter → panel Outlook disparaît, session MSAL révoquée
✅ Perte de connexion internet → indicateur hors ligne, C-PRojeTs continue
✅ Les liens email dans C-PRojeTs restent visibles (données locales Dexie)
```

### TEST V2.0-08 — Régression V1.2
```
✅ Tous les tests précédents passent
✅ L'activation Outlook n'affecte pas les performances générales
✅ Le drag & drop C-PRojeTs fonctionne normalement avec le panel Outlook ouvert
```

---

## 📊 Récapitulatif V2.0

| Critère                     | Détail                                 |
| --------------------------- | -------------------------------------- |
| **Plateforme**              | Web browser uniquement                 |
| **Auth Outlook**            | MSAL.js browser — OAuth 2.0            |
| **API**                     | Microsoft Graph API                    |
| **Scope Outlook**           | Microsoft 365 / Outlook 365 uniquement |
| **EWS on-premise**          | ❌ Non supporté                        |
| **Gmail**                   | ❌ Abandonné                           |
| **Stockage liens email**    | Dexie (IndexedDB)                      |
| **Drag & drop**             | ✅ Email → C-PRojeTs (tous niveaux)    |
| **Commandes vocales**       | ✅ Outlook complet                     |
| **Connexion internet**      | ✅ Requise pour Outlook uniquement     |

---

_C-PRojeTs — Version 2.0 — mise à jour mai 2026_
