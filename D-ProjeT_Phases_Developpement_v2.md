# 📋 D-ProjeT — Plan de développement détaillé avec tests de validation

> Ce document détaille les opérations à réaliser pour chaque phase de développement ainsi que les tests de validation associés.

---

## 📐 Conventions utilisées

| Symbole | Signification |
|---|---|
| 🔧 | Tâche de développement |
| 🧪 | Test de validation |
| ✅ | Critère de succès |
| ❌ | Critère d'échec |
| 📁 | Fichier / composant concerné |

---

## PHASE 1 — Structure de base
> Tableau, colonnes, cartes niveau 1

---

### 🔧 Tâches de développement

#### 1.1 Initialisation du projet
- [ ] Initialiser le projet Electron + React
- [ ] Configurer TailwindCSS
- [ ] Configurer ESLint et Prettier
- [ ] Mettre en place la structure de dossiers du projet
- [ ] Configurer la base de données SQLite locale
- [ ] Mettre en place le système de routage React

```
📁 Fichiers concernés :
├── package.json
├── electron.js
├── src/App.js
├── src/index.js
├── tailwind.config.js
└── database/schema.sql
```

#### 1.2 Modèle de données — Tableau et Cartes
- [ ] Créer la table `boards` (tableaux)
- [ ] Créer la table `columns` (colonnes)
- [ ] Créer la table `cards` (cartes projet niveau 1)
- [ ] Créer les relations entre tables
- [ ] Créer les fonctions CRUD pour chaque entité

```sql
-- Schéma attendu
boards    : id, title, description, created_at, updated_at
columns   : id, board_id, title, position, color, created_at
cards     : id, column_id, title, description, priority, 
            due_date, assignee, position, color, created_at
```

#### 1.3 Composant Board (Tableau principal)
- [ ] Créer le composant `Board`
- [ ] Afficher la liste des colonnes
- [ ] Bouton "Ajouter une colonne"
- [ ] Renommer une colonne (double-clic)
- [ ] Supprimer une colonne
- [ ] Persistance des colonnes en base de données

```
📁 src/components/Board/
├── Board.jsx
├── Board.css
└── BoardHeader.jsx
```

#### 1.4 Composant Column (Colonne)
- [ ] Créer le composant `Column`
- [ ] Afficher la liste des cartes de la colonne
- [ ] Bouton "Ajouter une carte"
- [ ] Afficher le nombre de cartes (badge)
- [ ] Bouton réduire/développer la colonne

```
📁 src/components/Column/
├── Column.jsx
└── ColumnHeader.jsx
```

#### 1.5 Composant Card niveau 1 (Carte Projet)
- [ ] Créer le composant `Card`
- [ ] Afficher titre, description, priorité, date d'échéance
- [ ] Afficher l'assignation membre
- [ ] Bouton éditer la carte (modal ou panneau latéral)
- [ ] Bouton supprimer la carte
- [ ] Bouton archiver la carte
- [ ] Système d'étiquettes de priorité colorées (urgent, normal, en attente, terminé)

```
📁 src/components/Card/
├── Card.jsx
├── CardHeader.jsx
├── CardModal.jsx
└── CardBadge.jsx
```

#### 1.6 Drag & Drop — Niveau 1
- [ ] Installer et configurer `react-beautiful-dnd`
- [ ] Drag & drop des cartes entre colonnes
- [ ] Drag & drop des colonnes entre elles
- [ ] Persistance des positions après déplacement

```
📁 src/components/Board/
└── DragDropContext.jsx
```

---

### 🧪 Tests de validation — Phase 1

#### TEST 1.1 — Initialisation
```
🧪 Lancer l'application
✅ L'application Electron s'ouvre sans erreur
✅ L'interface React s'affiche correctement
✅ La base de données SQLite est créée automatiquement
✅ Les styles TailwindCSS sont appliqués
❌ Message d'erreur au démarrage
❌ Écran blanc ou crash
```

#### TEST 1.2 — Gestion des tableaux
```
🧪 Créer un nouveau tableau
✅ Le tableau apparaît dans la liste
✅ Le titre est modifiable
✅ Le tableau est persisté après redémarrage de l'app
❌ Le tableau disparaît après redémarrage
❌ Impossible de renommer le tableau
```

#### TEST 1.3 — Gestion des colonnes
```
🧪 Ajouter 3 colonnes : "À faire", "En cours", "Terminé"
✅ Les 3 colonnes s'affichent dans l'ordre de création
✅ Chaque colonne est renommable par double-clic
✅ La suppression d'une colonne vide fonctionne
✅ Les colonnes sont persistées après redémarrage
❌ L'ordre des colonnes n'est pas conservé
❌ La suppression efface des données non souhaitées
```

#### TEST 1.4 — Gestion des cartes niveau 1
```
🧪 Créer une carte "Poste 400kV Saint-Étienne-du-Rouvray"
✅ La carte apparaît dans la colonne choisie
✅ Le titre est modifiable
✅ La description accepte du texte long
✅ La priorité peut être définie (urgent / normal / en attente)
✅ La date d'échéance est sélectionnable
✅ L'assignation membre fonctionne
✅ La carte est persistée après redémarrage
❌ Les données de la carte sont perdues
❌ La modal d'édition ne s'ouvre pas
```

#### TEST 1.5 — Drag & Drop niveau 1
```
🧪 Déplacer une carte de "À faire" vers "En cours"
✅ La carte se déplace visuellement en temps réel
✅ La carte est bien dans la nouvelle colonne après dépôt
✅ La position est persistée après redémarrage
✅ Le déplacement entre colonnes non adjacentes fonctionne

🧪 Déplacer une colonne
✅ La colonne se déplace avec toutes ses cartes
✅ L'ordre est conservé après redémarrage
❌ Les cartes disparaissent après déplacement de colonne
❌ La position n'est pas sauvegardée
```

#### TEST 1.6 — Archivage et suppression
```
🧪 Archiver une carte
✅ La carte disparaît du tableau principal
✅ La carte est accessible dans une vue "Archives"
✅ La carte peut être restaurée depuis les archives

🧪 Supprimer une carte
✅ Une confirmation est demandée avant suppression
✅ La carte est définitivement supprimée
✅ La suppression est irréversible (pas de restauration)
❌ Suppression sans confirmation
❌ La carte reste visible après suppression
```

---

## PHASE 2 — Catégories et Sous-catégories
> Niveaux 2 et 3 avec drag & drop imbriqué

---

### 🔧 Tâches de développement

#### 2.1 Modèle de données — Catégories et Sous-catégories
- [ ] Créer la table `categories` (niveau 2)
- [ ] Créer la table `subcategories` (niveau 3)
- [ ] Créer les relations avec la table `cards`
- [ ] Créer les fonctions CRUD pour chaque entité

```sql
-- Schéma attendu
categories    : id, card_id, title, description, position, 
                color, priority, due_date, assignee, created_at
subcategories : id, category_id, title, description, position,
                color, priority, due_date, assignee, created_at
```

#### 2.2 Composant Category (Niveau 2)
- [ ] Créer le composant `Category`
- [ ] Intégrer dans la carte projet (Card)
- [ ] Afficher la liste des sous-catégories
- [ ] Bouton "Ajouter une sous-catégorie"
- [ ] Bouton réduire/développer la catégorie
- [ ] Badge nombre de sous-catégories
- [ ] Style visuel distinct du niveau 1

```
📁 src/components/Category/
├── Category.jsx
├── CategoryHeader.jsx
└── CategoryModal.jsx
```

#### 2.3 Composant SubCategory (Niveau 3)
- [ ] Créer le composant `SubCategory`
- [ ] Intégrer dans la catégorie (Category)
- [ ] Afficher titre, priorité, date d'échéance
- [ ] Bouton éditer (modal)
- [ ] Bouton supprimer
- [ ] Style visuel distinct des niveaux 1 et 2

```
📁 src/components/SubCategory/
├── SubCategory.jsx
├── SubCategoryHeader.jsx
└── SubCategoryModal.jsx
```

#### 2.4 Drag & Drop imbriqué — Niveau 2
- [ ] Drag & drop des catégories au sein d'une même carte
- [ ] Drag & drop des catégories vers une autre carte projet
- [ ] Persistance des positions

#### 2.5 Drag & Drop imbriqué — Niveau 3
- [ ] Drag & drop des sous-catégories au sein d'une même catégorie
- [ ] Drag & drop des sous-catégories vers une autre catégorie (même carte ou autre)
- [ ] Persistance des positions

#### 2.6 Comportement collapse général
- [ ] Collapse/expand de la carte projet (masque toutes ses catégories)
- [ ] Collapse/expand d'une catégorie (masque toutes ses sous-catégories)
- [ ] Mémorisation de l'état collapse en base de données

---

### 🧪 Tests de validation — Phase 2

#### TEST 2.1 — Création des catégories
```
🧪 Ouvrir la carte "Poste 400kV Saint-Étienne-du-Rouvray"
   Créer les catégories : "Études GC", "Études Électriques HTB",
   "Réalisation GC", "Réalisation Électrique", "Suivi administratif"

✅ Les 5 catégories s'affichent dans la carte
✅ Chaque catégorie a un style visuel distinct de la carte projet
✅ Les catégories sont persistées après redémarrage
✅ Le badge de la carte indique "5 catégories"
❌ Les catégories ne s'affichent pas dans la bonne carte
❌ Le style est identique au niveau 1
```

#### TEST 2.2 — Création des sous-catégories
```
🧪 Dans la catégorie "Études GC", créer :
   "Terrassements", "Fondations", "Dallage", "Clôture", "Réseaux enterrés"

✅ Les 5 sous-catégories s'affichent dans la catégorie
✅ Le style est distinct des niveaux 1 et 2
✅ Le badge de la catégorie indique "5 éléments"
✅ Les sous-catégories sont persistées après redémarrage
❌ Les sous-catégories apparaissent dans la mauvaise catégorie
```

#### TEST 2.3 — Drag & Drop catégories (niveau 2)
```
🧪 Déplacer "Études Électriques HTB" avant "Études GC" dans la même carte
✅ Le déplacement s'effectue visuellement
✅ L'ordre est conservé après redémarrage

🧪 Déplacer "Suivi administratif" vers la carte "Poste Bordeaux-Nord"
✅ La catégorie (avec ses sous-catégories) arrive dans la carte cible
✅ La catégorie a disparu de la carte source
✅ Les sous-catégories sont intactes après déplacement
❌ Les sous-catégories sont perdues lors du déplacement inter-cartes
```

#### TEST 2.4 — Drag & Drop sous-catégories (niveau 3)
```
🧪 Déplacer "Fondations" avant "Terrassements" dans "Études GC"
✅ Le déplacement s'effectue visuellement
✅ L'ordre est conservé après redémarrage

🧪 Déplacer "Fondations" vers la catégorie "Réalisation GC"
✅ La sous-catégorie arrive dans la catégorie cible
✅ La sous-catégorie a disparu de la catégorie source
❌ La sous-catégorie est dupliquée dans les deux catégories
```

#### TEST 2.5 — Collapse / Expand
```
🧪 Réduire la carte "Poste 400kV Saint-Étienne-du-Rouvray"
✅ Toutes les catégories sont masquées
✅ Le badge indique toujours le nombre de catégories
✅ Un clic "expand" restaure l'affichage complet

🧪 Réduire la catégorie "Études GC"
✅ Toutes les sous-catégories sont masquées
✅ L'état collapse est mémorisé après redémarrage
❌ L'état collapse est perdu après redémarrage
```

---

## PHASE 3 — Bibliothèque de modèles
> Drag & drop bidirectionnel

---

### 🔧 Tâches de développement

#### 3.1 Modèle de données — Bibliothèque
- [ ] Créer la table `library_items`
- [ ] Stocker le type d'élément (card / category / subcategory)
- [ ] Stocker le contenu complet de l'élément (JSON imbriqué)
- [ ] Gestion des métadonnées (nom, date de création, tags)

```sql
library_items : id, type, title, content_json, tags, 
                created_at, updated_at
```

#### 3.2 Composant Library (Bibliothèque)
- [ ] Créer le panel bibliothèque (panneau latéral rétractable)
- [ ] Afficher la liste des modèles par type
- [ ] Barre de recherche dans la bibliothèque
- [ ] Filtres par type (carte / catégorie / sous-catégorie)
- [ ] Bouton supprimer un modèle
- [ ] Bouton renommer un modèle
- [ ] Aperçu du modèle au survol

```
📁 src/components/Library/
├── Library.jsx
├── LibraryPanel.jsx
├── LibraryItem.jsx
└── LibrarySearch.jsx
```

#### 3.3 Drag & Drop vers la bibliothèque
- [ ] Rendre la bibliothèque une zone de dépôt (drop zone)
- [ ] Détecter le type d'élément déposé
- [ ] Sauvegarder l'élément avec son contenu complet imbriqué
- [ ] Confirmation visuelle après sauvegarde

#### 3.4 Drag & Drop depuis la bibliothèque
- [ ] Rendre les éléments de la bibliothèque draggables
- [ ] Détecter la zone de dépôt cible
- [ ] Dupliquer l'élément dans la cible (sans modifier le modèle)
- [ ] Adapter le type selon la cible :
  - Tableau → Carte Projet
  - Carte → Catégorie
  - Catégorie → Sous-catégorie

---

### 🧪 Tests de validation — Phase 3

#### TEST 3.1 — Sauvegarde en bibliothèque
```
🧪 Glisser la carte "Poste 400kV Saint-Étienne-du-Rouvray"
   (avec ses 5 catégories et toutes ses sous-catégories) vers la bibliothèque

✅ Le modèle apparaît dans la bibliothèque avec le bon titre
✅ Le type est identifié comme "Carte Projet"
✅ Le contenu imbriqué complet est sauvegardé
✅ La carte originale est toujours présente dans le tableau
✅ Le modèle est persisté après redémarrage
❌ La carte originale disparaît après sauvegarde en bibliothèque
❌ Les catégories imbriquées sont perdues dans le modèle
```

#### TEST 3.2 — Sauvegarde catégorie en bibliothèque
```
🧪 Glisser la catégorie "Études GC" (avec ses 5 sous-catégories)
   vers la bibliothèque

✅ Le modèle apparaît avec le type "Catégorie"
✅ Les 5 sous-catégories sont incluses dans le modèle
✅ La catégorie originale est toujours présente
❌ Les sous-catégories sont perdues dans le modèle
```

#### TEST 3.3 — Utilisation d'un modèle depuis la bibliothèque
```
🧪 Glisser le modèle "Poste 400kV" depuis la bibliothèque
   vers le tableau principal

✅ Une nouvelle carte est créée avec toutes ses catégories et sous-catégories
✅ Le modèle original en bibliothèque est intact
✅ Les données de la nouvelle carte sont indépendantes du modèle

🧪 Glisser le modèle "Études GC" depuis la bibliothèque
   vers une carte projet existante

✅ Une nouvelle catégorie est créée avec toutes ses sous-catégories
✅ Le modèle original est intact
❌ Le modèle est consommé (disparaît de la bibliothèque)
❌ Les données sont partagées (modification de la copie = modification du modèle)
```

#### TEST 3.4 — Recherche et filtres bibliothèque
```
🧪 Rechercher "Études" dans la bibliothèque
✅ Seuls les modèles contenant "Études" dans leur titre apparaissent
✅ La recherche est insensible à la casse

🧪 Filtrer par type "Catégorie"
✅ Seuls les modèles de type Catégorie sont affichés
❌ Des modèles d'autres types apparaissent dans le filtre
```

---

## PHASE 4 — Commandes vocales D-ProjeT de base

---

### 🔧 Tâches de développement

#### 4.1 Service de reconnaissance vocale
- [ ] Intégrer la Web Speech API
- [ ] Créer le service `voice.js`
- [ ] Système d'activation/désactivation de l'écoute
- [ ] Indicateur visuel d'écoute active (micro animé)
- [ ] Gestion des erreurs de reconnaissance
- [ ] Gestion du timeout (arrêt auto après silence)

```
📁 src/services/
└── voice.js

📁 src/components/VoiceControl/
├── VoiceControl.jsx
├── VoiceIndicator.jsx
└── VoiceCommandList.jsx
```

#### 4.2 Moteur de correspondance des commandes
- [ ] Créer un dictionnaire de commandes et leurs actions associées
- [ ] Gestion des commandes avec paramètres variables (ex: "Créer une carte [nom]")
- [ ] Gestion des synonymes et variations linguistiques
- [ ] Retour vocal ou visuel de confirmation de la commande reconnue
- [ ] Historique des commandes vocales exécutées

#### 4.3 Implémentation des commandes D-ProjeT
- [ ] *"Écoute"* / *"Hey D-ProjeT"* → Activation
- [ ] *"Stop"* / *"Pause"* → Désactivation
- [ ] *"Créer une carte [nom]"* → Création carte
- [ ] *"Créer catégorie [nom]"* → Création catégorie
- [ ] *"Créer sous-catégorie [nom]"* → Création sous-catégorie
- [ ] *"Déplacer carte vers [colonne]"* → Déplacement carte
- [ ] *"Taguer [priorité]"* → Étiquette priorité
- [ ] *"Ouvrir carte [nom]"* → Ouverture carte
- [ ] *"Fermer carte"* → Fermeture carte
- [ ] *"Archiver carte"* → Archivage
- [ ] *"Assigner à [nom]"* → Assignation
- [ ] *"Ajouter commentaire [texte]"* → Commentaire
- [ ] *"Date d'échéance [date]"* → Deadline
- [ ] *"Afficher tableau [nom]"* → Navigation
- [ ] *"Mode focus"* → Mode focus
- [ ] *"Annuler"* → Annulation dernière action
- [ ] *"Aide"* → Affichage liste commandes
- [ ] *"Sauvegarder comme modèle"* → Bibliothèque
- [ ] *"Utiliser le modèle [nom]"* → Depuis bibliothèque
- [ ] *"Ouvrir la bibliothèque"* → Affichage bibliothèque

---

### 🧪 Tests de validation — Phase 4

#### TEST 4.1 — Activation vocale
```
🧪 Dire "Hey D-ProjeT"
✅ L'indicateur de micro s'anime
✅ Un son ou message confirme l'activation
✅ L'application est en écoute active

🧪 Dire "Stop"
✅ L'indicateur de micro s'arrête
✅ L'application n'interprète plus les sons
❌ L'application reste en écoute après "Stop"
```

#### TEST 4.2 — Commandes de création
```
🧪 Dire "Créer une carte Poste Lyon-Est"
✅ Une carte "Poste Lyon-Est" est créée dans la colonne active
✅ Un retour visuel confirme la création
✅ La carte est persistée

🧪 Dire "Créer catégorie Études Génie Civil"
✅ Une catégorie "Études Génie Civil" est créée dans la carte active
❌ La catégorie est créée dans la mauvaise carte
```

#### TEST 4.3 — Commandes de navigation
```
🧪 Dire "Afficher tableau Postes 400kV"
✅ Le tableau correspondant s'affiche
✅ Si le nom est ambigu, une liste de choix est proposée

🧪 Dire "Ouvrir carte Poste Lyon-Est"
✅ La carte s'ouvre en modal ou panneau
❌ Aucune réaction si la carte n'existe pas
```

#### TEST 4.4 — Commande Aide
```
🧪 Dire "Aide"
✅ La liste complète des commandes disponibles s'affiche
✅ La liste est scrollable et lisible
✅ La liste se ferme avec "Fermer" ou clic extérieur
```

#### TEST 4.5 — Robustesse
```
🧪 Prononcer une commande inconnue
✅ Un message "Commande non reconnue" s'affiche
✅ L'application reste en écoute

🧪 Prononcer une commande avec bruit de fond
✅ La commande est quand même reconnue (tolérance au bruit)
❌ Faux positifs sur des mots courants non intentionnels
```

---

## PHASE 5 — Module Messagerie : Intégration Outlook
> Compatible **Microsoft 365**, **Outlook 2024 cloud** (Graph API) et **Outlook 2024 on-premise** (EWS fallback)

---

### 🔧 Tâches de développement

#### 5.0 Détection automatique de la configuration Outlook
- [ ] Tentative de connexion OAuth 2.0 + Microsoft Graph API
- [ ] Si succès → activer le mode **Graph API** (cloud)
- [ ] Si échec → proposer le mode **Exchange on-premise (EWS)**
  - Formulaire : URL serveur Exchange, domaine, identifiants
  - Stocker les identifiants EWS de manière chiffrée
- [ ] Indicateur visuel du mode actif dans l'interface :
  - ☁️ "Mode Microsoft 365 / Cloud"
  - 🏢 "Mode Exchange on-premise"
- [ ] Possibilité de changer de mode dans les paramètres

```
📁 src/services/messaging/
├── outlookDetect.js     → Détection automatique du mode
├── outlook.js           → Service Graph API (cloud)
└── outlookEWS.js        → Service EWS (on-premise fallback)
```

#### 5.1 Configuration Microsoft Graph API (cloud)
- [ ] Créer une application dans Azure Active Directory
- [ ] Configurer les permissions (Mail.Read, Mail.ReadWrite, Mail.Send)
- [ ] Implémenter le flux OAuth 2.0 avec `@azure/msal-node`
- [ ] Stocker les tokens de manière sécurisée (`electron-store`)
- [ ] Gérer le rafraîchissement automatique des tokens

#### 5.1b Configuration EWS — Exchange on-premise (fallback)
- [ ] Installer et configurer `ews-javascript-api`
- [ ] Authentification NTLM ou Basic Auth selon la config du serveur
- [ ] Stocker les identifiants EWS chiffrés
- [ ] Tester la connectivité au serveur Exchange
- [ ] Gestion du timeout et des erreurs réseau on-premise

#### 5.2 Service Outlook (interface commune Graph API + EWS)
- [ ] Créer une interface commune `IOutlookService` utilisée par les deux modes
- [ ] Implémenter dans `outlook.js` (Graph API) :
  - Lister les emails, lire contenu, déplacer, catégoriser, supprimer, envoyer
- [ ] Implémenter dans `outlookEWS.js` (EWS) les mêmes méthodes
- [ ] Lister les dossiers disponibles
- [ ] Lister les catégories disponibles

```
📁 src/services/messaging/
├── IOutlookService.js   → Interface commune
├── outlook.js           → Implémentation Graph API
└── outlookEWS.js        → Implémentation EWS
```

#### 5.3 Composant OutlookPanel
- [ ] Panel latéral affichant la liste des emails
- [ ] Aperçu de l'email sélectionné
- [ ] Bouton activer/désactiver le panel (paramètres)
- [ ] Rafraîchissement automatique toutes les X minutes
- [ ] Indicateur de connexion Outlook + badge mode (cloud / on-premise)

```
📁 src/components/Messaging/
├── OutlookPanel.jsx
├── EmailList.jsx
├── EmailPreview.jsx
└── EmailActions.jsx
```

#### 5.4 Drag & Drop Email → D-ProjeT
- [ ] Rendre les emails draggables
- [ ] Détecter la zone de dépôt (carte, catégorie, sous-catégorie)
- [ ] Créer l'élément D-ProjeT correspondant avec les données de l'email
- [ ] Conserver le lien entre l'élément D-ProjeT et l'email source

---

### 🧪 Tests de validation — Phase 5

#### TEST 5.0 — Détection automatique du mode Outlook
```
🧪 Activer Outlook avec un compte Microsoft 365 (cloud)

✅ La fenêtre OAuth Microsoft s'ouvre
✅ Après connexion, le badge "☁️ Mode Microsoft 365 / Cloud" apparaît
✅ Le panel Outlook affiche les emails
✅ Toutes les fonctionnalités sont disponibles

🧪 Activer Outlook avec un compte Exchange on-premise

✅ L'OAuth échoue (normal pour on-premise)
✅ D-ProjeT propose automatiquement le formulaire "Mode Exchange on-premise"
✅ Après saisie URL/domaine/identifiants, le badge "🏢 Mode Exchange on-premise" apparaît
✅ Les emails sont listés depuis Exchange on-premise via EWS
❌ L'application plante si l'OAuth échoue sans proposer le mode EWS
```

#### TEST 5.1 — Connexion Outlook (mode cloud)
```
🧪 Activer Outlook dans les paramètres (compte Microsoft 365)

✅ La fenêtre OAuth Microsoft s'ouvre
✅ Après connexion, le panel Outlook apparaît
✅ Les emails de la boîte de réception sont listés
✅ Le token est conservé après redémarrage (pas de re-connexion)
❌ Erreur d'authentification
❌ Les emails ne se chargent pas
```

#### TEST 5.1b — Connexion Outlook (mode Exchange on-premise)
```
🧪 Configurer le mode EWS avec URL serveur Exchange interne

✅ La connexion EWS s'établit avec les identifiants fournis
✅ Les emails de la boîte de réception sont listés
✅ Les identifiants sont conservés de manière chiffrée après redémarrage
✅ Un indicateur distingue clairement le mode on-premise du mode cloud
❌ Les identifiants sont stockés en clair
❌ Erreur de connexion non explicite pour l'utilisateur
```

#### TEST 5.2 — Lecture et navigation emails
```
🧪 Cliquer sur un email dans le panel (cloud ET on-premise)

✅ L'aperçu de l'email s'affiche (expéditeur, sujet, corps, pièces jointes)
✅ L'email est marqué comme lu automatiquement
✅ Le comportement est identique en mode cloud et on-premise

🧪 Marquer un email comme non lu

✅ L'indicateur "non lu" réapparaît dans le panel
```

#### TEST 5.3 — Actions sur les emails
```
🧪 Déplacer un email dans le dossier "Projets 400kV" (cloud ET on-premise)

✅ L'email disparaît de la boîte de réception
✅ L'email est bien dans le dossier cible dans Outlook

🧪 Appliquer la catégorie "Urgent" sur un email

✅ La catégorie est visible dans le panel D-ProjeT
✅ La catégorie est également visible dans Outlook
✅ Fonctionne en mode cloud ET on-premise
```

#### TEST 5.4 — Drag & Drop Email → D-ProjeT
```
🧪 Glisser un email vers la carte "Poste Lyon-Est"

✅ Une catégorie est créée avec : titre = sujet email,
   description = corps email, lien vers l'email source
✅ Les pièces jointes sont référencées
✅ Fonctionne depuis un email cloud ET on-premise

🧪 Glisser un email vers la catégorie "Études GC"

✅ Une sous-catégorie est créée avec les données de l'email
❌ Les données de l'email sont perdues lors du drag
```

---

## PHASE 6 — Module Messagerie : Intégration Gmail

---

### 🔧 Tâches de développement

#### 6.1 Configuration Google Gmail API
- [ ] Créer un projet dans Google Cloud Console
- [ ] Activer Gmail API
- [ ] Configurer les permissions (gmail.readonly, gmail.modify, gmail.send)
- [ ] Implémenter le flux OAuth 2.0 Google
- [ ] Stocker les tokens de manière sécurisée
- [ ] Gérer le rafraîchissement automatique des tokens

#### 6.2 Service Gmail
- [ ] Créer le service `gmail.js`
- [ ] Lister les emails
- [ ] Lire le contenu d'un email
- [ ] Ajouter / retirer un libellé (label)
- [ ] Marquer comme lu / non lu
- [ ] Archiver un email
- [ ] Supprimer un email
- [ ] Envoyer / Répondre / Transférer
- [ ] Lister les libellés disponibles

```
📁 src/services/messaging/
└── gmail.js
```

#### 6.3 Composant GmailPanel
- [ ] Panel latéral identique à Outlook mais adapté Gmail
- [ ] Affichage des libellés au lieu des dossiers
- [ ] Gestion multi-libellés par email
- [ ] Indicateur de connexion Gmail

```
📁 src/components/Messaging/
└── GmailPanel.jsx
```

#### 6.4 Cohabitation Outlook + Gmail
- [ ] Affichage simultané des deux panels (onglets ou côte à côte)
- [ ] Commande vocale *"Basculer messagerie"*
- [ ] Drag & drop depuis Gmail vers D-ProjeT (même logique qu'Outlook)

---

### 🧪 Tests de validation — Phase 6

#### TEST 6.1 — Connexion Gmail
```
🧪 Activer Gmail dans les paramètres (Outlook déjà actif)
✅ La fenêtre OAuth Google s'ouvre
✅ Après connexion, le panel Gmail apparaît (aux côtés d'Outlook)
✅ Les emails Gmail sont listés
✅ Les deux panels fonctionnent simultanément
❌ L'activation de Gmail désactive Outlook
```

#### TEST 6.2 — Spécificités Gmail
```
🧪 Ajouter deux libellés sur un même email Gmail
✅ L'email apparaît dans les deux libellés
✅ Les deux libellés sont visibles dans l'aperçu

🧪 Retirer un libellé
✅ L'email n'apparaît plus dans ce libellé
✅ L'email reste accessible via ses autres libellés
```

#### TEST 6.3 — Drag & Drop Gmail → D-ProjeT
```
🧪 Glisser un email Gmail vers une carte D-ProjeT
✅ Même comportement qu'avec Outlook
✅ La source de l'email (Gmail) est indiquée dans la carte
❌ Confusion entre emails Outlook et Gmail dans la carte
```

---

## PHASE 7 — Drag & Drop emails vers D-ProjeT (consolidation)

---

### 🔧 Tâches de développement

#### 7.1 Consolidation du système de drop
- [ ] Unifier la logique de drop pour Outlook et Gmail
- [ ] Créer le composant `EmailCard` commun aux deux sources
- [ ] Indicateur visuel de la source (icône Outlook / Gmail)
- [ ] Historique des emails liés à chaque élément D-ProjeT

#### 7.2 Copier / Coller vocal inter-applications
- [ ] Implémenter la mémoire tampon email
- [ ] Commande *"Copie email dans D-ProjeT"*
- [ ] Commande *"Colle l'email ici"*
- [ ] Indicateur visuel de l'email en mémoire tampon
- [ ] Vider la mémoire tampon après collage ou sur commande

---

### 🧪 Tests de validation — Phase 7

#### TEST 7.1 — Copier / Coller vocal
```
🧪 Dans Outlook, dire "Copie email dans D-ProjeT"
✅ Un indicateur montre l'email en mémoire tampon
✅ Le titre de l'email est affiché dans l'indicateur

🧪 Naviguer vers une catégorie, dire "Colle l'email ici"
✅ Une sous-catégorie est créée avec les données de l'email
✅ La mémoire tampon est vidée après collage
✅ L'opération fonctionne aussi depuis Gmail
❌ L'email est collé dans le mauvais élément
```

#### TEST 7.2 — Historique des liens email
```
🧪 Ouvrir une carte contenant des emails liés
✅ La liste des emails liés est visible
✅ Un clic sur un email lié ouvre l'aperçu dans le panel messagerie
✅ Les emails Outlook et Gmail sont différenciés visuellement
```

---

## PHASE 8 — Commandes vocales messagerie

---

### 🔧 Tâches de développement

#### 8.1 Extension du moteur vocal pour la messagerie
- [ ] Ajouter les commandes vocales Outlook
- [ ] Ajouter les commandes vocales Gmail
- [ ] Ajouter les commandes de navigation inter-panels
- [ ] Adapter les commandes selon le service actif

#### 8.2 Commandes à implémenter
- [ ] *"Email suivant"* / *"Email précédent"*
- [ ] *"Ouvre l'email"* / *"Ferme l'email"*
- [ ] *"Répondre"* / *"Transférer à [nom]"*
- [ ] *"Marquer comme lu"* / *"Marquer comme non lu"*
- [ ] *"Supprimer l'email"*
- [ ] *"Déplacer dans [dossier]"* (Outlook)
- [ ] *"Ajouter le libellé [nom]"* (Gmail)
- [ ] *"Retirer le libellé [nom]"* (Gmail)
- [ ] *"Taguer [catégorie]"* (Outlook)
- [ ] *"Basculer sur Gmail"* / *"Basculer sur Outlook"*
- [ ] *"Afficher emails de [projet]"*
- [ ] *"Crée une carte"* (depuis email)
- [ ] *"Copie email dans D-ProjeT"*
- [ ] *"Colle l'email ici"*
- [ ] *"Lier à la carte [nom]"*

---

### 🧪 Tests de validation — Phase 8

#### TEST 8.1 — Navigation vocale emails
```
🧪 Dire "Email suivant" 5 fois de suite
✅ L'application parcourt les 5 emails suivants
✅ Chaque changement est confirmé visuellement

🧪 Dire "Email précédent"
✅ L'email précédent est sélectionné
❌ La navigation dépasse les limites de la liste
```

#### TEST 8.2 — Actions vocales sur emails
```
🧪 Dire "Ouvre l'email"
✅ L'email sélectionné s'ouvre en aperçu complet

🧪 Dire "Déplacer dans Projets 400kV" (Outlook)
✅ L'email est déplacé dans le dossier Outlook correspondant
✅ Un retour vocal confirme "Email déplacé dans Projets 400kV"

🧪 Dire "Ajouter le libellé Urgent" (Gmail)
✅ Le libellé est appliqué sur l'email Gmail
```

#### TEST 8.3 — Création vocale depuis email
```
🧪 Email ouvert, dire "Crée une carte"
✅ Une carte est créée dans D-ProjeT avec les données de l'email
✅ L'application bascule automatiquement vers D-ProjeT
✅ La nouvelle carte est visible et sélectionnée
```

---

## PHASE 8b — Module Calendrier Outlook avec filtrage par tags
> Compatible **Microsoft 365**, **Outlook 2024 cloud** (Graph API) et **Outlook 2024 on-premise** (EWS)

---

### 🔧 Tâches de développement

#### 8b.1 Extension des services Outlook (calendrier)
- [ ] Ajouter la permission `Calendars.Read` dans Azure AD (mode cloud)
  > ⚠️ Nécessite un nouveau consentement OAuth de l'utilisateur
- [ ] Méthode `getCalendarTags()` → récupère les catégories des événements
  - Via Graph API en mode cloud
  - Via EWS en mode on-premise
- [ ] Méthode `getEventsByTags(tags[], dateFrom, dateTo)`
- [ ] Méthode `getEventsForPeriod(dateFrom, dateTo)`
- [ ] Mise en cache locale des événements (`calendar_events_cache`)
- [ ] Rafraîchissement automatique configurable

```
📁 src/services/messaging/
└── outlookCalendar.js   → Interface commune Graph API + EWS pour calendrier
```

#### 8b.2 Bouton d'activation calendrier (paramètres)
- [ ] Section "Calendrier" dans l'onglet Messagerie des paramètres
- [ ] Bouton "Activer le calendrier Outlook"
- [ ] Message si Outlook non connecté : "Connectez d'abord Outlook"
- [ ] Configuration fenêtre de chargement (7 / 14 / 30 / 90 jours)
- [ ] Configuration intervalle de rafraîchissement

#### 8b.3 Sélecteur de tags (CalendarTagSelector)
- [ ] Récupération des tags disponibles au chargement
- [ ] Affichage sous forme de badges colorés cliquables
- [ ] **Mode simple** : un seul tag actif à la fois
- [ ] **Mode multiple** : plusieurs tags simultanément
- [ ] Bascule entre les deux modes
- [ ] Option "Tous les tags" et "Aucun filtre"
- [ ] Barre de recherche dans les tags
- [ ] Persistance des filtres sélectionnés

#### 8b.4 Vue liste (CalendarListView)
- [ ] Liste chronologique des événements filtrés
- [ ] Groupement par jour avec séparateurs
- [ ] Affichage : badge tag, date/heure, titre, lieu, durée, aperçu
- [ ] Indicateur "Aujourd'hui", "Dans X jours", événements passés grisés
- [ ] Modal de détail complet au clic

#### 8b.5 Vue calendrier visuel (semaine + mois)
- [ ] Intégrer `react-big-calendar` avec `date-fns`
- [ ] Vue semaine : grille 7 colonnes, événements colorés par tag
- [ ] Vue mois : grille mensuelle, badges colorés, indicateur "+N autres"
- [ ] Navigation entre semaines/mois
- [ ] Bouton "Aujourd'hui"
- [ ] Clic événement → modal de détail

#### 8b.6 Indicateur RDV du jour (header D-ProjeT)
- [ ] Badge dans le header indiquant le nombre de RDV du jour (tags actifs)
- [ ] Tooltip au survol listant les RDV du jour
- [ ] Clic → ouvre le calendrier sur la vue liste du jour
- [ ] Mise à jour automatique à minuit

#### 8b.7 Commandes vocales calendrier
- [ ] *"Ouvrir le calendrier"* / *"Fermer le calendrier"*
- [ ] *"Vue semaine"* / *"Vue mois"* / *"Vue liste"*
- [ ] *"Semaine suivante"* / *"Semaine précédente"*
- [ ] *"Mois suivant"* / *"Mois précédent"*
- [ ] *"Aujourd'hui"*
- [ ] *"Filtrer par [tag]"* / *"Ajouter le tag [tag]"* / *"Retirer le tag [tag]"*
- [ ] *"Tous les tags"* / *"Aucun filtre"*
- [ ] *"Mes rendez-vous aujourd'hui"*

---

### 🧪 Tests de validation — Phase 8b

#### TEST 8b.1 — Activation calendrier
```
🧪 Activer le calendrier (Outlook déjà connecté en mode cloud)

✅ Le panel calendrier apparaît
✅ Les catégories Outlook sont listées dans le sélecteur de tags
✅ L'indicateur RDV du jour apparaît dans le header

🧪 Activer le calendrier (Outlook connecté en mode EWS on-premise)

✅ Le calendrier se charge depuis Exchange on-premise via EWS
✅ Les catégories sont récupérées correctement
✅ Le badge "🏢 Mode on-premise" est visible
❌ Message d'erreur si Outlook n'est pas préalablement connecté
   → Le message "Connectez d'abord Outlook" s'affiche
```

#### TEST 8b.2 — Sélecteur de tags (mode simple)
```
🧪 Cliquer sur le tag "Projets 400kV"

✅ Seuls les RDV "Projets 400kV" sont affichés
✅ Le filtre est persisté après fermeture/réouverture du panel
✅ Un seul tag actif à la fois en mode simple
```

#### TEST 8b.3 — Sélecteur de tags (mode multiple)
```
🧪 Activer le mode multi-tags, sélectionner "Projets 400kV" ET "Réunions Direction"

✅ Les RDV des deux tags s'affichent simultanément
✅ Badge compteur "2 tags sélectionnés" affiché
✅ "Tout désélectionner" → calendrier vide + message informatif
```

#### TEST 8b.4 — Vues et navigation
```
🧪 Vue liste, tag "Projets 400kV" actif

✅ RDV en ordre chronologique, groupés par jour
✅ Jour courant mis en évidence
✅ RDV passés grisés, RDV en cours en surbrillance

🧪 Vue semaine + vue mois

✅ Navigation semaine/mois fonctionne
✅ Le filtre de tags est conservé lors des bascules de vue
✅ Fonctionne identiquement en mode cloud et on-premise
```

#### TEST 8b.5 — Commandes vocales calendrier
```
🧪 Dire "Filtrer par Projets 400kV"

✅ Le tag est activé, le calendrier filtre instantanément
✅ Toast "Filtre actif : Projets 400kV"

🧪 Dire "Mes rendez-vous aujourd'hui"

✅ Vue liste sur le jour courant, filtres actifs conservés
```

---

## PHASE 9 — Synchronisation tags messagerie + calendrier ↔ D-ProjeT

---

### 🔧 Tâches de développement

#### 9.1 Mapping catégories Outlook ↔ étiquettes D-ProjeT
- [ ] Créer la table de mapping `tag_sync`
- [ ] Interface de configuration du mapping
- [ ] Synchronisation bidirectionnelle automatique
- [ ] Gestion des conflits (priorité D-ProjeT ou messagerie ?)
- [ ] Support du mode cloud (Graph API) ET on-premise (EWS)

#### 9.2 Mapping libellés Gmail ↔ étiquettes D-ProjeT
- [ ] Même logique que pour Outlook
- [ ] Gestion des libellés multiples Gmail

#### 9.3 Mapping tags calendrier Outlook ↔ étiquettes D-ProjeT
- [ ] Même logique que pour les emails Outlook
- [ ] Un tag calendrier peut alimenter les étiquettes D-ProjeT
- [ ] Support cloud ET on-premise (EWS)

#### 9.4 Synchronisation automatique
- [ ] Sync au démarrage de l'application
- [ ] Sync périodique (configurable : 5 / 10 / 30 minutes)
- [ ] Sync manuelle via bouton

---

### 🧪 Tests de validation — Phase 9

#### TEST 9.1 — Synchronisation Outlook → D-ProjeT
```
🧪 Appliquer la catégorie "Urgent" sur un email dans Outlook (cloud)
✅ L'étiquette "Urgent" apparaît sur la carte D-ProjeT liée
✅ La sync s'effectue dans le délai configuré

🧪 Même test en mode Exchange on-premise (EWS)
✅ La sync fonctionne également en mode on-premise
⚠️ Délai potentiellement plus long (polling vs webhooks)
```

#### TEST 9.2 — Synchronisation D-ProjeT → Outlook
```
🧪 Changer la priorité d'une carte en "Urgent" dans D-ProjeT
✅ La catégorie "Urgent" est appliquée sur l'email Outlook lié
✅ La sync s'effectue sans délai perceptible
❌ Boucle infinie de synchronisation (A→B→A→B...)
```

#### TEST 9.3 — Synchronisation calendrier → D-ProjeT
```
🧪 Modifier le tag d'un événement calendrier lié à une carte D-ProjeT

✅ L'étiquette de la carte D-ProjeT se met à jour
✅ Fonctionne en mode cloud ET on-premise
✅ Pas de boucle infinie de synchronisation
```

---

## PHASE 10 — Finitions UI, performances et tests globaux

---

### 🔧 Tâches de développement

#### 10.1 Finitions interface utilisateur
- [ ] Thème clair / thème sombre
- [ ] Personnalisation des couleurs par tableau
- [ ] Animations de transition fluides
- [ ] Responsive design (adaptation taille de fenêtre)
- [ ] Tour guidé pour les nouveaux utilisateurs (onboarding)
- [ ] Page de paramètres complète

#### 10.2 Performances
- [ ] Virtualisation des listes longues (react-window)
- [ ] Lazy loading des emails
- [ ] Mise en cache des données fréquentes
- [ ] Optimisation des requêtes SQLite
- [ ] Réduction du bundle size (code splitting)

#### 10.3 Tests automatisés
- [ ] Tests unitaires (Jest) sur les services
- [ ] Tests de composants (React Testing Library)
- [ ] Tests end-to-end (Playwright ou Cypress)
- [ ] Tests de performance (Lighthouse)

#### 10.4 Sécurité
- [ ] Chiffrement des tokens OAuth en local
- [ ] Validation des entrées vocales
- [ ] Protection contre les injections SQL
- [ ] Audit de sécurité des dépendances (npm audit)

---

### 🧪 Tests de validation — Phase 10

#### TEST 10.1 — Performance générale
```
🧪 Charger un tableau avec 50 cartes, 10 catégories par carte,
   5 sous-catégories par catégorie (2500 éléments au total)

✅ Temps de chargement initial < 3 secondes
✅ Le drag & drop reste fluide (60fps)
✅ La recherche vocale reste réactive
❌ Lag perceptible lors du scroll ou du drag
```

#### TEST 10.2 — Test de charge messagerie
```
🧪 Charger une boîte avec 1000 emails
✅ La liste se charge en moins de 5 secondes
✅ Le scroll est fluide
✅ La recherche dans les emails est réactive
```

#### TEST 10.3 — Test de robustesse globale
```
🧪 Utiliser l'application pendant 8h en continu
✅ Pas de fuite mémoire (RAM stable)
✅ Pas de crash
✅ La synchronisation messagerie reste stable

🧪 Couper la connexion internet en cours d'utilisation
✅ D-ProjeT de base continue de fonctionner (mode hors ligne)
✅ Un indicateur signale la perte de connexion messagerie
✅ La reconnexion est automatique au retour de la connexion
```

#### TEST 10.4 — Test d'accessibilité
```
🧪 Utiliser l'application uniquement avec les commandes vocales
✅ Toutes les fonctionnalités principales sont accessibles vocalement
✅ Aucune action nécessite obligatoirement la souris
```

#### TEST 10.5 — Test de régression global
```
🧪 Exécuter l'ensemble des tests des phases 1 à 9 (y compris 8b)
✅ Tous les tests passent en version finale
✅ Aucune régression introduite lors des finitions
✅ Le mode cloud ET le mode on-premise fonctionnent toujours
❌ Un test de phase précédente échoue suite aux finitions
```

---

## 📊 Tableau de suivi global

| Phase | Description | Compatibilité Outlook | Statut | Tests |
|---|---|---|---|---|
| Phase 1 | Structure de base | — | ⬜ À faire | 6 tests |
| Phase 2 | Catégories et sous-catégories | — | ⬜ À faire | 5 tests |
| Phase 3 | Bibliothèque de modèles | — | ⬜ À faire | 4 tests |
| Phase 4 | Commandes vocales de base | — | ⬜ À faire | 5 tests |
| Phase 5 | Intégration Outlook | ✅ 365 + ✅ 2024 cloud + ✅ 2024 on-premise | ⬜ À faire | 5 tests |
| Phase 6 | Intégration Gmail | — | ⬜ À faire | 3 tests |
| Phase 7 | Drag & Drop emails (consolidation) | ✅ 365 + ✅ 2024 cloud + ✅ 2024 on-premise | ⬜ À faire | 2 tests |
| Phase 8 | Commandes vocales messagerie | ✅ 365 + ✅ 2024 cloud + ✅ 2024 on-premise | ⬜ À faire | 3 tests |
| Phase 8b | Calendrier Outlook + filtrage par tags | ✅ 365 + ✅ 2024 cloud + ✅ 2024 on-premise | ⬜ À faire | 5 tests |
| Phase 9 | Synchronisation tags (emails + calendrier) | ✅ 365 + ✅ 2024 cloud + ⚠️ 2024 on-premise | ⬜ À faire | 3 tests |
| Phase 10 | Finitions et tests globaux | Toutes configurations | ⬜ À faire | 5 tests |

**Total : 46 tests de validation**

### ⚠️ Légende compatibilité Outlook

| Symbole | Signification |
|---|---|
| ✅ 365 | Fonctionne avec Microsoft 365 (Exchange Online) |
| ✅ 2024 cloud | Fonctionne avec Outlook 2024 + compte Microsoft 365 |
| ✅ 2024 on-premise | Fonctionne avec Outlook 2024 + Exchange Server interne (via EWS) |
| ⚠️ 2024 on-premise | Fonctionne partiellement (délais polling, synchro limitée) |

---

*Document généré le 23 février 2026 — Version 2.0 (compatibilité Outlook étendue + Calendrier)*
