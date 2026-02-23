# 📋 MyTrello — Version 2.0
> **Objectif** : Intégration Outlook native — Module messagerie Outlook complet avec drag & drop et commandes vocales
> **Prérequis** : V1.2 validée et tous les tests V1.2 passés
> **Basé sur** : Phase 5 + Phase 7 + Phase 8 (partielle) du plan de développement

---

## 🎯 Périmètre V2.0

| Nouveautés V2.0 | Reporté |
|---|---|
| Activation Outlook par bouton paramètres | Intégration Gmail (V2.1) |
| Authentification OAuth 2.0 Microsoft | Synchronisation tags complète (V3.0) |
| Panel email Outlook dans l'interface | Tests automatisés (V3.0) |
| Navigation emails (suivant / précédent) | |
| Actions sur emails (lire, déplacer, taguer, supprimer) | |
| Drag & drop email → Carte / Catégorie / Sous-catégorie | |
| Copier / Coller vocal Outlook → MyTrello | |
| Création de carte depuis email | |
| Commandes vocales Outlook complètes | |
| Rafraîchissement automatique des emails | |
| Indicateur de connexion Outlook | |

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
    ├── EmailDraggable.jsx             → Email draggable vers MyTrello
    ├── EmailClipboard.jsx             → Indicateur email en mémoire tampon
    └── ConnectionStatus.jsx          → Indicateur connexion Outlook
```

### Nouveaux services

```
src/services/
├── messaging/                         ← NOUVEAU (dossier)
│   └── outlook.js                     → Microsoft Graph API
└── auth/                              ← NOUVEAU
    └── microsoft.js                   → OAuth 2.0 Microsoft
```

### Nouvelles dépendances

```json
"@azure/msal-node":       "^2.6.0",
"@microsoft/microsoft-graph-client": "^3.0.7",
"electron-store":         "^8.1.0"
```

---

## 🗄️ Évolutions base de données V2.0

```sql
-- Tokens OAuth Microsoft (chiffrés via electron-store)
-- Stockage hors SQLite pour raisons de sécurité

-- Nouvelle table : emails liés aux éléments MyTrello
CREATE TABLE email_links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type    TEXT NOT NULL,    -- 'card' | 'category' | 'subcategory'
  ref_id      INTEGER NOT NULL,
  source      TEXT NOT NULL,    -- 'outlook' | 'gmail'
  email_id    TEXT NOT NULL,    -- ID email côté serveur
  subject     TEXT,
  sender      TEXT,
  received_at DATETIME,
  linked_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extension table settings
INSERT INTO settings (key, value) VALUES
  ('outlook_enabled',       'false'),
  ('outlook_refresh_min',   '5'),
  ('outlook_inbox_limit',   '50'),
  ('email_clipboard',       '');   -- email en mémoire tampon (JSON)
```

---

## 🔧 Tâches de développement V2.0

### ÉTAPE 1 — Configuration Microsoft Graph API

- [ ] Créer l'application dans Azure Active Directory
- [ ] Configurer les permissions nécessaires :
  - `Mail.Read` — Lecture des emails
  - `Mail.ReadWrite` — Modification / déplacement
  - `Mail.Send` — Envoi / réponse
  - `MailboxSettings.Read` — Paramètres boîte mail
- [ ] Implémenter le flux OAuth 2.0 avec `@azure/msal-node`
- [ ] Stocker les tokens de manière chiffrée (`electron-store`)
- [ ] Gérer le rafraîchissement automatique des tokens (refresh_token)
- [ ] Gérer la révocation (déconnexion)

### ÉTAPE 2 — Bouton d'activation Outlook (paramètres)

- [ ] Ajouter l'onglet **Messagerie** dans les paramètres
- [ ] Bouton à cocher "Activer Microsoft Outlook"
- [ ] Au premier coche → lancer le flux OAuth Microsoft
- [ ] Indicateur de statut : Non connecté / Connexion en cours / Connecté
- [ ] Bouton "Se déconnecter" (révoque les tokens)
- [ ] Persistance de l'état activé/désactivé

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

- [ ] Panel latéral gauche ou droit (configurable)
- [ ] Liste des emails avec : expéditeur, sujet, date, indicateur lu/non lu
- [ ] Email sélectionné → aperçu complet dans un panneau dédié
- [ ] Barre d'actions : Répondre / Transférer / Déplacer / Supprimer / Taguer
- [ ] Navigation clavier dans la liste (touches ↑ ↓)
- [ ] Bouton Rafraîchir manuel
- [ ] Indicateur de connexion en temps réel
- [ ] Badge nombre d'emails non lus

### ÉTAPE 5 — Drag & Drop email → MyTrello

- [ ] Rendre chaque email draggable (`EmailDraggable`)
- [ ] Zones de dépôt sur Cartes, Catégories, Sous-catégories
- [ ] Mise en évidence de la zone de dépôt au survol
- [ ] À la dépose sur une **Carte** → créer une Catégorie avec les données email
- [ ] À la dépose sur une **Catégorie** → créer une Sous-catégorie
- [ ] À la dépose sur une **Sous-catégorie** → attacher comme note/lien
- [ ] L'email créé contient : titre = sujet, description = corps, expéditeur, date
- [ ] Enregistrer le lien dans la table `email_links`
- [ ] Indicateur visuel sur l'élément MyTrello "Email lié"

### ÉTAPE 6 — Copier / Coller vocal Outlook → MyTrello

- [ ] Implémenter la mémoire tampon email (table settings, clé `email_clipboard`)
- [ ] Commande *"Copie email dans MyTrello"* → stocke l'email en mémoire tampon
- [ ] Indicateur visuel persistant de l'email en mémoire tampon (barre supérieure)
- [ ] Commande *"Colle l'email ici"* → crée l'élément dans la cible active
- [ ] Bouton "Vider le presse-papier email" dans l'indicateur
- [ ] Vidage automatique de la mémoire tampon après collage

### ÉTAPE 7 — Commandes vocales Outlook

#### Navigation emails
- [ ] *"Ouvrir Outlook"* → Bascule vers le panel Outlook
- [ ] *"Email suivant"* → Email suivant dans la liste
- [ ] *"Email précédent"* → Email précédent dans la liste
- [ ] *"Ouvre l'email"* → Ouvre l'aperçu complet
- [ ] *"Ferme l'email"* → Ferme l'aperçu

#### Actions sur emails
- [ ] *"Répondre"* → Ouvre la fenêtre de réponse
- [ ] *"Transférer à [nom]"* → Transfert de l'email
- [ ] *"Marquer comme lu"* → Marque comme lu
- [ ] *"Marquer comme non lu"* → Marque comme non lu
- [ ] *"Supprimer l'email"* → Supprime l'email (avec confirmation)
- [ ] *"Déplacer dans [dossier]"* → Déplace dans le dossier dit
- [ ] *"Taguer [catégorie]"* → Applique une catégorie Outlook
- [ ] *"Afficher emails de [projet]"* → Filtre les emails liés au projet

#### Liaison Outlook → MyTrello
- [ ] *"Crée une carte"* → Crée une carte depuis l'email ouvert
- [ ] *"Copie email dans MyTrello"* → Met en mémoire tampon
- [ ] *"Colle l'email ici"* → Colle dans l'élément actif MyTrello
- [ ] *"Lier à la carte [nom]"* → Associe à une carte existante

---

## 🧪 Tests de validation V2.0

### TEST V2.0-01 — Activation Outlook
```
🧪 Dans Paramètres → Messagerie, cocher "Activer Microsoft Outlook"

✅ La fenêtre OAuth Microsoft s'ouvre dans le navigateur système
✅ Après connexion, le panel Outlook apparaît dans MyTrello
✅ Les emails de la boîte de réception sont listés (50 max)
✅ Le token est conservé après redémarrage (pas de re-connexion)
✅ L'indicateur de connexion affiche "Connecté"
❌ Erreur d'authentification
❌ La fenêtre OAuth ne s'ouvre pas
```

### TEST V2.0-02 — Navigation et lecture emails
```
🧪 Cliquer sur un email dans le panel Outlook

✅ L'aperçu complet s'affiche (expéditeur, sujet, date, corps, pièces jointes)
✅ L'email est marqué comme lu automatiquement
✅ Le badge "non lu" disparaît dans la liste

🧪 Naviguer avec les touches ↑ ↓ dans la liste

✅ L'email suivant / précédent est sélectionné et affiché
```

### TEST V2.0-03 — Actions sur les emails
```
🧪 Déplacer un email dans le dossier "Projets 400kV"

✅ L'email disparaît de la boîte de réception
✅ L'email est bien dans "Projets 400kV" dans Outlook

🧪 Appliquer la catégorie "Urgent" sur un email

✅ La catégorie est visible dans le panel MyTrello
✅ La catégorie est également visible dans Outlook (vérification externe)

🧪 Rafraîchissement automatique après 5 minutes

✅ Les nouveaux emails apparaissent sans action manuelle
✅ Le badge "non lus" se met à jour
```

### TEST V2.0-04 — Drag & drop email → Carte
```
🧪 Glisser l'email "RE: Plan de masse poste Lyon-Est" vers la carte "Poste 400kV Lyon-Est"

✅ Une catégorie est créée avec :
   - Titre = "RE: Plan de masse poste Lyon-Est"
   - Description = corps de l'email
   - Expéditeur et date visibles
✅ L'icône "Email lié" apparaît sur la catégorie
✅ Le lien est enregistré dans email_links
✅ La zone de dépôt est mise en évidence pendant le drag
❌ Les données de l'email sont perdues lors du drag
```

### TEST V2.0-05 — Drag & drop email → Catégorie / Sous-catégorie
```
🧪 Glisser un email vers la catégorie "Études Électriques HTB"

✅ Une sous-catégorie est créée avec les données de l'email

🧪 Glisser un email vers une sous-catégorie existante

✅ L'email est attaché comme note/lien à la sous-catégorie
✅ Le lien est accessible depuis la sous-catégorie
❌ Une nouvelle sous-catégorie est créée au lieu d'un lien
```

### TEST V2.0-06 — Copier / Coller vocal
```
🧪 Email ouvert, dire "Copie email dans MyTrello"

✅ L'indicateur "Email en mémoire tampon" apparaît (barre supérieure)
✅ Le titre de l'email est affiché dans l'indicateur
✅ L'écoute reste active

🧪 Naviguer vers la catégorie "Réalisation GC", dire "Colle l'email ici"

✅ Une sous-catégorie est créée avec les données de l'email
✅ L'indicateur de mémoire tampon disparaît
✅ Le lien email est enregistré

🧪 Dire "Copie email dans MyTrello" sans email ouvert

✅ Message "Aucun email sélectionné" affiché
❌ L'application plante ou crée un élément vide
```

### TEST V2.0-07 — Commandes vocales navigation Outlook
```
🧪 Dire "Email suivant" 3 fois de suite

✅ Les 3 emails suivants sont parcourus l'un après l'autre
✅ Chaque changement est confirmé visuellement et vocalement

🧪 Dire "Ouvre l'email"

✅ L'email sélectionné s'ouvre en aperçu complet

🧪 Dire "Ferme l'email"

✅ L'aperçu se ferme, la liste est active
```

### TEST V2.0-08 — Commandes vocales actions Outlook
```
🧪 Dire "Déplacer dans Projets 400kV"

✅ L'email actif est déplacé dans le dossier "Projets 400kV" d'Outlook
✅ Toast de confirmation "Email déplacé dans Projets 400kV"
✅ Vérification possible : l'email n'est plus dans la boîte de réception

🧪 Dire "Taguer Urgent"

✅ La catégorie "Urgent" est appliquée sur l'email dans Outlook
✅ La couleur de la catégorie apparaît dans le panel MyTrello

🧪 Dire "Crée une carte"

✅ Une carte est créée dans MyTrello avec les données de l'email ouvert
✅ L'application bascule vers MyTrello et sélectionne la nouvelle carte
```

### TEST V2.0-09 — Sécurité et déconnexion
```
🧪 Couper la connexion internet pendant l'utilisation d'Outlook

✅ Un indicateur "Hors ligne" apparaît dans le panel Outlook
✅ MyTrello de base continue de fonctionner normalement
✅ La reconnexion est automatique au retour de la connexion

🧪 Se déconnecter du compte Outlook (Paramètres → Messagerie)

✅ Le panel Outlook disparaît
✅ Les tokens sont supprimés de manière sécurisée
✅ Les liens email dans MyTrello restent visibles (données locales conservées)
```

### TEST V2.0-10 — Régression V1.2
```
🧪 Rejouer les 10 tests V1.2 + 10 tests V1.1 + 10 tests MVP

✅ Tous les tests passent toujours
✅ L'activation d'Outlook n'affecte pas les performances générales
✅ Le drag & drop MyTrello fonctionne normalement en présence du panel Outlook
❌ Une fonctionnalité précédente est cassée
```

---

## 📊 Récapitulatif V2.0

| Critère | Détail |
|---|---|
| **Phases couvertes** | Phase 5 + Phase 7 + Phase 8 partielle |
| **Tâches de développement** | 44 tâches |
| **Tests de validation** | 10 tests (+ 30 tests régression) |
| **Drag & drop** | ✅ Email → MyTrello (tous niveaux) |
| **Commandes vocales** | ✅ Outlook complet |
| **Outlook** | ✅ Complet |
| **Gmail** | ❌ Non (prévu V2.1) |
| **Connexion internet** | ✅ Requise pour Outlook uniquement |

---

## ➡️ Prochaine version : V2.1
Intégration Gmail + cohabitation Outlook / Gmail simultanés

---
*MyTrello — Version 2.0 — 23 février 2026*
