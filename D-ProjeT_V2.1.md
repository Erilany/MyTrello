# 📋 D-ProjeT — Version 2.1
> **Objectif** : Intégration Gmail + cohabitation Outlook / Gmail simultanés
> **Prérequis** : V2.0 validée et tous les tests V2.0 passés
> **Basé sur** : Phase 6 + Phase 7 (consolidation) + Phase 8 (complétion) du plan de développement

---

## 🎯 Périmètre V2.1

| Nouveautés V2.1 | Reporté |
|---|---|
| Activation Gmail par bouton paramètres | Synchronisation tags complète (V3.0) |
| Authentification OAuth 2.0 Google | Tests automatisés (V3.0) |
| Panel email Gmail dans l'interface | Performances avancées (V3.0) |
| Gestion des libellés Gmail (multi-libellés) | |
| Drag & drop Gmail → D-ProjeT | |
| Cohabitation Outlook + Gmail simultanés | |
| Basculement vocal entre les deux messageries | |
| Copier / Coller vocal Gmail → D-ProjeT | |
| Commandes vocales Gmail spécifiques | |
| Indicateur source email (Outlook / Gmail) | |
| Historique des liens email (Outlook + Gmail) | |

---

## 🏗️ Évolutions d'architecture V2.1

### Nouveaux composants

```
src/components/
└── Messaging/
    ├── OutlookPanel.jsx              (existant — inchangé)
    ├── GmailPanel.jsx                ← NOUVEAU
    ├── MessagingTabs.jsx             ← NOUVEAU (onglets Outlook / Gmail)
    ├── MessagingToggle.jsx           (existant — étendu pour Gmail)
    ├── EmailSourceBadge.jsx          ← NOUVEAU (badge Outlook / Gmail)
    └── EmailHistory.jsx              ← NOUVEAU (historique liens email)
```

### Nouveaux services

```
src/services/
├── messaging/
│   ├── outlook.js                    (existant — inchangé)
│   └── gmail.js                      ← NOUVEAU
└── auth/
    ├── microsoft.js                   (existant — inchangé)
    └── google.js                      ← NOUVEAU
```

### Nouvelles dépendances

```json
"googleapis":          "^128.0.0",
"google-auth-library": "^9.0.0"
```

---

## 🗄️ Évolutions base de données V2.1

```sql
-- Extension table email_links (ajout champ source déjà présent en V2.0)
-- Aucune modification de schéma nécessaire

-- Extension table settings
INSERT INTO settings (key, value) VALUES
  ('gmail_enabled',         'false'),
  ('gmail_refresh_min',     '5'),
  ('gmail_inbox_limit',     '50'),
  ('active_messaging_tab',  'outlook');  -- onglet actif par défaut
```

---

## 🔧 Tâches de développement V2.1

### ÉTAPE 1 — Configuration Google Gmail API

- [ ] Créer un projet dans Google Cloud Console
- [ ] Activer Gmail API
- [ ] Configurer les permissions nécessaires :
  - `gmail.readonly` — Lecture des emails
  - `gmail.modify` — Modification (libellés, archivage)
  - `gmail.send` — Envoi / réponse
- [ ] Implémenter le flux OAuth 2.0 avec `google-auth-library`
- [ ] Stocker les tokens Google chiffrés (`electron-store`)
- [ ] Gérer le rafraîchissement automatique des tokens Google
- [ ] Gérer la révocation (déconnexion Google)

### ÉTAPE 2 — Bouton d'activation Gmail (paramètres)

- [ ] Ajouter "Activer Gmail" dans l'onglet Messagerie des paramètres
- [ ] Les deux services (Outlook + Gmail) peuvent être cochés simultanément
- [ ] Au premier coche Gmail → lancer le flux OAuth Google
- [ ] Indicateur de statut Gmail : Non connecté / Connexion / Connecté
- [ ] Bouton "Se déconnecter de Gmail"
- [ ] Persistance de l'état activé/désactivé Gmail

### ÉTAPE 3 — Service Gmail (gmail.js)

- [ ] Lister les emails (boîte de réception, avec pagination)
- [ ] Lire le contenu complet d'un email (corps HTML + texte)
- [ ] Marquer un email comme lu / non lu
- [ ] Ajouter un libellé à un email
- [ ] Retirer un libellé d'un email
- [ ] Archiver un email (retirer le libellé INBOX)
- [ ] Supprimer un email (corbeille)
- [ ] Répondre à un email
- [ ] Transférer un email
- [ ] Lister les libellés disponibles
- [ ] Rafraîchissement automatique configurable

### ÉTAPE 4 — Panel Gmail dans l'interface

- [ ] Composant `GmailPanel` calqué sur `OutlookPanel`
- [ ] Liste des emails avec : expéditeur, sujet, date, libellés, indicateur lu/non lu
- [ ] Affichage multi-libellés par email (badges colorés)
- [ ] Email sélectionné → aperçu complet
- [ ] Barre d'actions adaptée Gmail : Répondre / Transférer / Ajouter libellé / Archiver / Supprimer
- [ ] Navigation clavier ↑ ↓
- [ ] Bouton Rafraîchir manuel
- [ ] Indicateur de connexion Gmail
- [ ] Badge emails non lus Gmail

### ÉTAPE 5 — Cohabitation Outlook + Gmail (onglets)

- [ ] Composant `MessagingTabs` avec onglets Outlook / Gmail
- [ ] Affichage conditionnel selon les services activés :
  - Seul Outlook activé → panel Outlook direct (sans onglets)
  - Seul Gmail activé → panel Gmail direct (sans onglets)
  - Les deux activés → onglets Outlook | Gmail
- [ ] Mémorisation de l'onglet actif (settings)
- [ ] Indicateur non lus sur chaque onglet
- [ ] Transition animée entre onglets

### ÉTAPE 6 — Drag & drop Gmail → D-ProjeT

- [ ] Rendre les emails Gmail draggables (même logique qu'Outlook)
- [ ] Mêmes zones de dépôt que V2.0 (Carte / Catégorie / Sous-catégorie)
- [ ] Badge source "Gmail" sur l'élément D-ProjeT créé
- [ ] Enregistrement dans `email_links` avec `source = 'gmail'`
- [ ] Différenciation visuelle Outlook (bleu) vs Gmail (rouge) dans D-ProjeT

### ÉTAPE 7 — Copier / Coller vocal Gmail → D-ProjeT

- [ ] Même logique que V2.0 pour Outlook
- [ ] La mémoire tampon indique la source (Outlook ou Gmail)
- [ ] *"Copie email dans D-ProjeT"* fonctionne depuis Gmail
- [ ] *"Colle l'email ici"* fonctionne quelle que soit la source

### ÉTAPE 8 — Commandes vocales Gmail spécifiques

- [ ] *"Ouvrir Gmail"* → Bascule vers le panel Gmail
- [ ] *"Basculer messagerie"* → Alterne entre Outlook et Gmail
- [ ] *"Email suivant"* / *"Email précédent"* → Navigation Gmail
- [ ] *"Ouvre l'email"* / *"Ferme l'email"* → Aperçu Gmail
- [ ] *"Répondre"* / *"Transférer à [nom]"* → Gmail
- [ ] *"Marquer comme lu"* / *"Marquer comme non lu"* → Gmail
- [ ] *"Supprimer l'email"* → Gmail (avec confirmation)
- [ ] *"Ajouter le libellé [nom]"* → Libellé Gmail
- [ ] *"Retirer le libellé [nom]"* → Retire libellé Gmail
- [ ] *"Archiver"* → Archive l'email Gmail
- [ ] *"Afficher emails de [projet]"* → Filtre Gmail
- [ ] *"Crée une carte"* → Depuis email Gmail
- [ ] *"Copie email dans D-ProjeT"* → Gmail vers mémoire tampon
- [ ] *"Colle l'email ici"* → Dans élément actif D-ProjeT

### ÉTAPE 9 — Historique des liens email

- [ ] Composant `EmailHistory` dans chaque carte / catégorie / sous-catégorie
- [ ] Liste des emails liés avec : source (Outlook/Gmail), sujet, expéditeur, date
- [ ] Clic sur un email lié → ouvre l'aperçu dans le panel messagerie correspondant
- [ ] Indicateur si l'email n'est plus accessible (supprimé côté serveur)
- [ ] Badge "N emails liés" visible sur chaque élément D-ProjeT

---

## 🧪 Tests de validation V2.1

### TEST V2.1-01 — Activation Gmail (Outlook déjà actif)
```
🧪 Dans Paramètres → Messagerie, cocher "Activer Gmail"
   (Outlook déjà connecté et actif)

✅ La fenêtre OAuth Google s'ouvre
✅ Après connexion, les onglets Outlook | Gmail apparaissent
✅ Les emails Gmail sont listés dans l'onglet Gmail
✅ Les deux panels fonctionnent simultanément
✅ L'activation de Gmail n'affecte pas le panel Outlook
❌ L'activation de Gmail déconnecte Outlook
❌ Les onglets n'apparaissent pas
```

### TEST V2.1-02 — Spécificités libellés Gmail
```
🧪 Ajouter deux libellés "Projets 400kV" et "Urgent" sur un même email Gmail

✅ L'email affiche les deux badges de libellés
✅ L'email apparaît dans la recherche par chacun des deux libellés

🧪 Retirer le libellé "Urgent"

✅ Le badge "Urgent" disparaît de l'email
✅ L'email reste accessible via "Projets 400kV"
✅ La modification est visible dans Gmail (vérification externe)
```

### TEST V2.1-03 — Basculement entre onglets
```
🧪 Cliquer sur l'onglet Outlook puis sur l'onglet Gmail

✅ La transition est animée et fluide
✅ L'onglet actif est mémorisé après redémarrage
✅ Les badges non lus sont affichés sur chaque onglet

🧪 Dire "Basculer messagerie"

✅ L'onglet bascule entre Outlook et Gmail
✅ Confirmation visuelle et vocale du basculement
```

### TEST V2.1-04 — Drag & drop Gmail → D-ProjeT
```
🧪 Glisser un email Gmail vers la carte "Poste 400kV Lyon-Est"

✅ Une catégorie est créée avec les données de l'email Gmail
✅ Un badge rouge "Gmail" est visible sur la catégorie
✅ Le lien est enregistré avec source = 'gmail'
✅ Le comportement est identique à celui d'Outlook

🧪 Glisser un email Outlook ET un email Gmail vers la même catégorie

✅ Deux sous-catégories sont créées
✅ Chacune affiche son badge source (bleu Outlook / rouge Gmail)
❌ Les deux sources sont confondues visuellement
```

### TEST V2.1-05 — Copier / Coller vocal Gmail
```
🧪 Panel Gmail actif, email ouvert, dire "Copie email dans D-ProjeT"

✅ L'indicateur affiche "Email Gmail en mémoire tampon"
✅ La source Gmail est indiquée dans l'indicateur

🧪 Naviguer vers D-ProjeT, dire "Colle l'email ici"

✅ L'élément est créé avec les données de l'email Gmail
✅ Badge Gmail visible sur l'élément créé
✅ La mémoire tampon est vidée
```

### TEST V2.1-06 — Commandes vocales Gmail
```
🧪 Panel Gmail actif, dire "Ajouter le libellé Projets 400kV"

✅ Le libellé est appliqué sur l'email actif
✅ Toast de confirmation "Libellé ajouté : Projets 400kV"
✅ Visible dans Gmail (vérification externe)

🧪 Dire "Retirer le libellé Urgent"

✅ Le libellé "Urgent" est retiré de l'email
✅ Le badge disparaît dans le panel D-ProjeT

🧪 Dire "Archiver"

✅ L'email disparaît de la boîte de réception Gmail
✅ L'email est accessible dans "Tous les messages" dans Gmail
```

### TEST V2.1-07 — Historique des liens email
```
🧪 Ouvrir la carte "Poste 400kV Lyon-Est" qui contient
   3 emails Outlook liés et 2 emails Gmail liés

✅ L'onglet "Emails liés (5)" est visible dans la carte
✅ Chaque email affiche : source (bleu/rouge), sujet, expéditeur, date
✅ Clic sur un email Outlook → ouvre l'aperçu dans le panel Outlook
✅ Clic sur un email Gmail → ouvre l'aperçu dans le panel Gmail

🧪 Supprimer un email côté Gmail, puis rouvrir la carte

✅ L'email lié est marqué "Email non disponible"
✅ Le lien reste visible mais indique l'indisponibilité
❌ L'application plante sur un email supprimé
```

### TEST V2.1-08 — Performances cohabitation
```
🧪 Outlook et Gmail tous deux actifs,
   Outlook avec 50 emails, Gmail avec 50 emails

✅ Les deux listes se chargent en moins de 8 secondes au total
✅ Le rafraîchissement automatique des deux services ne provoque pas de lag
✅ Le drag & drop D-ProjeT reste fluide en présence des deux panels
```

### TEST V2.1-09 — Déconnexion Gmail (Outlook reste actif)
```
🧪 Se déconnecter de Gmail dans les paramètres

✅ Le panel Gmail disparaît (onglets remplacés par panel Outlook direct)
✅ Le panel Outlook reste actif et fonctionnel
✅ Les liens Gmail dans D-ProjeT restent visibles (données locales conservées)
✅ Les tokens Google sont supprimés de manière sécurisée
```

### TEST V2.1-10 — Régression V2.0
```
🧪 Rejouer les 10 tests V2.0 + 10 tests V1.2 + 10 tests V1.1 + 10 tests MVP

✅ Tous les tests passent toujours
✅ L'ajout de Gmail n'affecte pas le comportement Outlook
✅ Les fonctionnalités D-ProjeT de base sont intactes
❌ Une fonctionnalité V2.0 ou antérieure est cassée
```

---

## 📊 Récapitulatif V2.1

| Critère | Détail |
|---|---|
| **Phases couvertes** | Phase 6 + Phase 7 + Phase 8 complète |
| **Tâches de développement** | 42 tâches |
| **Tests de validation** | 10 tests (+ 40 tests régression) |
| **Drag & drop** | ✅ Email Outlook ET Gmail → D-ProjeT |
| **Commandes vocales** | ✅ Outlook + Gmail complets |
| **Outlook** | ✅ Complet (inchangé) |
| **Gmail** | ✅ Complet |
| **Cohabitation** | ✅ Les deux simultanément |
| **Connexion internet** | ✅ Requise pour messagerie uniquement |

---

## ➡️ Prochaine version : V3.0
Synchronisation complète + performances + tests automatisés + sécurité + version finale

---
*D-ProjeT — Version 2.1 — 23 février 2026*
