# 📋 MyTrello — Plan de développement détaillé avec tests de validation

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

## PHASE 4 — Commandes vocales MyTrello de base

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

#### 4.3 Implémentation des commandes MyTrello
- [ ] *"Écoute"* / *"Hey MyTrello"* → Activation
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
🧪 Dire "Hey MyTrello"
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

---

### 🔧 Tâches de développement

#### 5.1 Configuration Microsoft Graph API
- [ ] Créer une application dans Azure Active Directory
- [ ] Configurer les permissions (Mail.Read, Mail.ReadWrite, Mail.Send)
- [ ] Implémenter le flux OAuth 2.0
- [ ] Stocker les tokens de manière sécurisée
- [ ] Gérer le rafraîchissement automatique des tokens

#### 5.2 Service Outlook
- [ ] Créer le service `outlook.js`
- [ ] Lister les emails (inbox)
- [ ] Lire le contenu d'un email
- [ ] Déplacer un email dans un dossier
- [ ] Appliquer une catégorie Outlook
- [ ] Marquer comme lu / non lu
- [ ] Supprimer un email
- [ ] Envoyer / Répondre / Transférer
- [ ] Lister les dossiers disponibles
- [ ] Lister les catégories disponibles

```
📁 src/services/messaging/
└── outlook.js
```

#### 5.3 Composant OutlookPanel
- [ ] Panel latéral affichant la liste des emails
- [ ] Aperçu de l'email sélectionné
- [ ] Bouton activer/désactiver le panel (paramètres)
- [ ] Rafraîchissement automatique toutes les X minutes
- [ ] Indicateur de connexion Outlook

```
📁 src/components/Messaging/
├── OutlookPanel.jsx
├── EmailList.jsx
├── EmailPreview.jsx
└── EmailActions.jsx
```

#### 5.4 Drag & Drop Email → MyTrello
- [ ] Rendre les emails draggables
- [ ] Détecter la zone de dépôt (carte, catégorie, sous-catégorie)
- [ ] Créer l'élément MyTrello correspondant avec les données de l'email
- [ ] Conserver le lien entre l'élément MyTrello et l'email source

---

### 🧪 Tests de validation — Phase 5

#### TEST 5.1 — Connexion Outlook
```
🧪 Activer Outlook dans les paramètres
✅ La fenêtre OAuth Microsoft s'ouvre
✅ Après connexion, le panel Outlook apparaît
✅ Les emails de la boîte de réception sont listés
✅ Le token est conservé après redémarrage (pas de re-connexion)
❌ Erreur d'authentification
❌ Les emails ne se chargent pas
```

#### TEST 5.2 — Lecture et navigation emails
```
🧪 Cliquer sur un email dans le panel
✅ L'aperçu de l'email s'affiche (expéditeur, sujet, corps, pièces jointes)
✅ L'email est marqué comme lu automatiquement

🧪 Marquer un email comme non lu
✅ L'indicateur "non lu" réapparaît dans le panel
```

#### TEST 5.3 — Actions sur les emails
```
🧪 Déplacer un email dans le dossier "Projets 400kV"
✅ L'email disparaît de la boîte de réception
✅ L'email est bien dans le dossier cible dans Outlook

🧪 Appliquer la catégorie "Urgent" sur un email
✅ La catégorie est visible dans le panel MyTrello
✅ La catégorie est également visible dans Outlook
```

#### TEST 5.4 — Drag & Drop Email → MyTrello
```
🧪 Glisser un email vers la carte "Poste Lyon-Est"
✅ Une catégorie est créée avec : titre = sujet email,
   description = corps email, lien vers l'email source
✅ Les pièces jointes sont référencées

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
- [ ] Drag & drop depuis Gmail vers MyTrello (même logique qu'Outlook)

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

#### TEST 6.3 — Drag & Drop Gmail → MyTrello
```
🧪 Glisser un email Gmail vers une carte MyTrello
✅ Même comportement qu'avec Outlook
✅ La source de l'email (Gmail) est indiquée dans la carte
❌ Confusion entre emails Outlook et Gmail dans la carte
```

---

## PHASE 7 — Drag & Drop emails vers MyTrello (consolidation)

---

### 🔧 Tâches de développement

#### 7.1 Consolidation du système de drop
- [ ] Unifier la logique de drop pour Outlook et Gmail
- [ ] Créer le composant `EmailCard` commun aux deux sources
- [ ] Indicateur visuel de la source (icône Outlook / Gmail)
- [ ] Historique des emails liés à chaque élément MyTrello

#### 7.2 Copier / Coller vocal inter-applications
- [ ] Implémenter la mémoire tampon email
- [ ] Commande *"Copie email dans MyTrello"*
- [ ] Commande *"Colle l'email ici"*
- [ ] Indicateur visuel de l'email en mémoire tampon
- [ ] Vider la mémoire tampon après collage ou sur commande

---

### 🧪 Tests de validation — Phase 7

#### TEST 7.1 — Copier / Coller vocal
```
🧪 Dans Outlook, dire "Copie email dans MyTrello"
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
- [ ] *"Copie email dans MyTrello"*
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
✅ Une carte est créée dans MyTrello avec les données de l'email
✅ L'application bascule automatiquement vers MyTrello
✅ La nouvelle carte est visible et sélectionnée
```

---

## PHASE 9 — Synchronisation tags messagerie ↔ MyTrello

---

### 🔧 Tâches de développement

#### 9.1 Mapping catégories Outlook ↔ étiquettes MyTrello
- [ ] Créer la table de mapping `tag_sync`
- [ ] Interface de configuration du mapping
- [ ] Synchronisation bidirectionnelle automatique
- [ ] Gestion des conflits (priorité MyTrello ou messagerie ?)

#### 9.2 Mapping libellés Gmail ↔ étiquettes MyTrello
- [ ] Même logique que pour Outlook
- [ ] Gestion des libellés multiples Gmail

#### 9.3 Synchronisation automatique
- [ ] Sync au démarrage de l'application
- [ ] Sync périodique (configurable : 5 / 10 / 30 minutes)
- [ ] Sync manuelle via bouton

---

### 🧪 Tests de validation — Phase 9

#### TEST 9.1 — Synchronisation Outlook → MyTrello
```
🧪 Appliquer la catégorie "Urgent" sur un email dans Outlook
✅ L'étiquette "Urgent" apparaît sur la carte MyTrello liée
✅ La sync s'effectue dans le délai configuré
```

#### TEST 9.2 — Synchronisation MyTrello → Outlook
```
🧪 Changer la priorité d'une carte en "Urgent" dans MyTrello
✅ La catégorie "Urgent" est appliquée sur l'email Outlook lié
✅ La sync s'effectue sans délai perceptible
❌ Boucle infinie de synchronisation (A→B→A→B...)
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
✅ MyTrello de base continue de fonctionner (mode hors ligne)
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
🧪 Exécuter l'ensemble des tests des phases 1 à 9
✅ Tous les tests passent en version finale
✅ Aucune régression introduite lors des finitions
❌ Un test de phase précédente échoue suite aux finitions
```

---

## 📊 Tableau de suivi global

| Phase | Description | Statut | Tests |
|---|---|---|---|
| Phase 1 | Structure de base | ⬜ À faire | 6 tests |
| Phase 2 | Catégories et sous-catégories | ⬜ À faire | 5 tests |
| Phase 3 | Bibliothèque de modèles | ⬜ À faire | 4 tests |
| Phase 4 | Commandes vocales de base | ⬜ À faire | 5 tests |
| Phase 5 | Intégration Outlook | ⬜ À faire | 4 tests |
| Phase 6 | Intégration Gmail | ⬜ À faire | 3 tests |
| Phase 7 | Drag & Drop emails (consolidation) | ⬜ À faire | 2 tests |
| Phase 8 | Commandes vocales messagerie | ⬜ À faire | 3 tests |
| Phase 9 | Synchronisation tags | ⬜ À faire | 2 tests |
| Phase 10 | Finitions et tests globaux | ⬜ À faire | 5 tests |

**Total : 39 tests de validation**

---

*Document généré le 23 février 2026 — Version 1.0*
