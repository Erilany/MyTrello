# 📋 D-ProjeT — MVP (Version 0.1)
> **Objectif** : Utilisation personnelle immédiate — Gestion de projets 3 niveaux sans dépendance externe
> **Basé sur** : Phases 1, 2 et 3 (partielle) du plan de développement

---

## 🎯 Périmètre du MVP

| Inclus | Exclu |
|---|---|
| Tableau + colonnes + cartes niveau 1 | Drag & drop (prévu V1.1) |
| Catégories (niveau 2) | Commandes vocales (prévu V1.1) |
| Sous-catégories (niveau 3) | Bibliothèque avancée (prévu V1.2) |
| Bibliothèque de modèles simple | Intégration messagerie (prévu V2.0) |
| Étiquettes de priorité | Thèmes clair/sombre (prévu V1.2) |
| Dates d'échéance | Synchronisation (prévu V3.0) |
| Commentaires et assignations | Tests automatisés (prévu V3.0) |
| Persistance locale (SQLite) | Mode collaboratif |
| Navigation clic / clavier | |

---

## 🏗️ Architecture MVP

```
D-ProjeT-MVP/
├── src/
│   ├── components/
│   │   ├── Board/
│   │   │   ├── Board.jsx
│   │   │   └── BoardHeader.jsx
│   │   ├── Column/
│   │   │   ├── Column.jsx
│   │   │   └── ColumnHeader.jsx
│   │   ├── Card/
│   │   │   ├── Card.jsx
│   │   │   ├── CardModal.jsx
│   │   │   └── CardBadge.jsx
│   │   ├── Category/
│   │   │   ├── Category.jsx
│   │   │   └── CategoryModal.jsx
│   │   ├── SubCategory/
│   │   │   ├── SubCategory.jsx
│   │   │   └── SubCategoryModal.jsx
│   │   └── Library/
│   │       ├── Library.jsx
│   │       └── LibraryItem.jsx
│   ├── services/
│   │   └── database.js
│   └── App.js
├── database/
│   └── schema.sql
├── electron.js
└── package.json
```

---

## 🗄️ Modèle de données MVP

```sql
-- Tableaux
CREATE TABLE boards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Colonnes
CREATE TABLE columns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id   INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  position   INTEGER NOT NULL,
  color      TEXT DEFAULT '#4A90D9',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cartes Projet (niveau 1)
CREATE TABLE cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER REFERENCES columns(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  color       TEXT DEFAULT '#FFFFFF',
  is_archived INTEGER DEFAULT 0,
  collapsed   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Catégories (niveau 2)
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id     INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  color       TEXT DEFAULT '#F5F5F5',
  collapsed   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sous-catégories (niveau 3)
CREATE TABLE subcategories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Commentaires (tous niveaux)
CREATE TABLE comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type   TEXT NOT NULL, -- 'card' | 'category' | 'subcategory'
  ref_id     INTEGER NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bibliothèque de modèles
CREATE TABLE library_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT NOT NULL, -- 'card' | 'category' | 'subcategory'
  title        TEXT NOT NULL,
  content_json TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Tâches de développement MVP

### ÉTAPE 1 — Initialisation projet
- [ ] Initialiser Electron + React
- [ ] Configurer TailwindCSS
- [ ] Configurer ESLint / Prettier
- [ ] Mettre en place la structure de dossiers
- [ ] Créer et initialiser la base SQLite
- [ ] Configurer le routage React de base

### ÉTAPE 2 — Tableau et colonnes
- [ ] Composant `Board` — affichage et gestion des colonnes
- [ ] Création / renommage / suppression de colonne
- [ ] Persistance des colonnes en base
- [ ] Interface de sélection et création de tableau

### ÉTAPE 3 — Cartes niveau 1
- [ ] Composant `Card` — affichage titre, priorité, date, assignée
- [ ] Modal d'édition complète de la carte
- [ ] Étiquettes de priorité colorées (urgent / normal / en attente / terminé)
- [ ] Bouton archiver / supprimer avec confirmation
- [ ] Collapse / expand de la carte
- [ ] Badge nombre de catégories
- [ ] Déplacement par boutons ← → entre colonnes (sans drag & drop)

### ÉTAPE 4 — Catégories (niveau 2)
- [ ] Composant `Category` intégré dans Card
- [ ] Création / édition / suppression de catégorie
- [ ] Collapse / expand de la catégorie
- [ ] Badge nombre de sous-catégories
- [ ] Déplacement ↑ ↓ au sein de la carte (boutons)
- [ ] Déplacement vers une autre carte (menu contextuel)

### ÉTAPE 5 — Sous-catégories (niveau 3)
- [ ] Composant `SubCategory` intégré dans Category
- [ ] Création / édition / suppression de sous-catégorie
- [ ] Déplacement ↑ ↓ au sein de la catégorie (boutons)
- [ ] Déplacement vers une autre catégorie (menu contextuel)

### ÉTAPE 6 — Bibliothèque de modèles (version simple)
- [ ] Panel bibliothèque (panneau latéral rétractable)
- [ ] Bouton "Sauvegarder comme modèle" sur chaque élément
- [ ] Sauvegarde du contenu imbriqué complet en JSON
- [ ] Affichage de la liste des modèles par type
- [ ] Bouton "Utiliser ce modèle" → duplication dans le projet actif
- [ ] Renommer / supprimer un modèle

### ÉTAPE 7 — Finalisation MVP
- [ ] Gestion des commentaires (tous niveaux)
- [ ] Date d'échéance avec indicateur visuel (dépassé / proche / ok)
- [ ] Page de paramètres minimale
- [ ] Vue Archives (liste + restauration)
- [ ] Tests manuels complets

---

## 🧪 Tests de validation MVP

### TEST MVP-01 — Démarrage application
```
✅ L'application Electron s'ouvre sans erreur
✅ La base de données est créée automatiquement au premier lancement
✅ Un tableau vide par défaut est affiché
✅ L'interface est lisible et utilisable
❌ Écran blanc, crash ou message d'erreur au démarrage
```

### TEST MVP-02 — Tableaux et colonnes
```
🧪 Créer le tableau "Postes 400kV — 2026"
   Ajouter les colonnes : "Études", "En cours", "Réalisé", "Archivé"

✅ Les 4 colonnes s'affichent dans le bon ordre
✅ Chaque colonne est renommable par double-clic
✅ La suppression d'une colonne vide fonctionne
✅ Tout est persisté après redémarrage
❌ L'ordre des colonnes n'est pas conservé après redémarrage
```

### TEST MVP-03 — Cartes niveau 1
```
🧪 Créer la carte "Poste 400kV Saint-Étienne-du-Rouvray"
   Priorité = Urgent | Date = 30/06/2026 | Assigné = "Chef de projet"

✅ La carte apparaît dans la colonne "Études"
✅ La priorité est affichée avec la bonne couleur
✅ La date d'échéance est visible sur la carte
✅ Le badge indique "0 catégorie"
✅ La carte est persistée après redémarrage
❌ Les données sont perdues après redémarrage
```

### TEST MVP-04 — Déplacement des cartes
```
🧪 Déplacer "Poste 400kV Saint-Étienne-du-Rouvray" vers "En cours"

✅ La carte se retrouve dans la colonne "En cours"
✅ La position est persistée après redémarrage
✅ Le déplacement vers une colonne non adjacente fonctionne
❌ La carte disparaît lors du déplacement
```

### TEST MVP-05 — Catégories niveau 2
```
🧪 Dans la carte créée, ajouter :
   "Études GC" | "Études Électriques HTB" | "Réalisation GC"
   "Réalisation Électrique HTB" | "Suivi administratif"

✅ Les 5 catégories s'affichent dans la carte
✅ Le badge de la carte indique "5 catégories"
✅ Style visuel distinct du niveau 1
✅ Le collapse masque toutes les catégories
✅ Persistance après redémarrage
❌ Les catégories apparaissent dans la mauvaise carte
```

### TEST MVP-06 — Déplacement des catégories
```
🧪 Remonter "Suivi administratif" en première position

✅ La catégorie remonte en tête de liste
✅ L'ordre est conservé après redémarrage

🧪 Déplacer "Études GC" vers une autre carte projet

✅ La catégorie et ses sous-catégories arrivent dans la carte cible
✅ La catégorie a disparu de la carte source
❌ Les sous-catégories sont perdues lors du déplacement inter-cartes
```

### TEST MVP-07 — Sous-catégories niveau 3
```
🧪 Dans "Études GC", créer :
   "Terrassements" | "Fondations bâtiment de commande"
   "Dallage et voiries" | "Clôture et portails" | "Réseaux enterrés"

✅ Les 5 sous-catégories s'affichent dans la catégorie
✅ Badge catégorie indique "5 éléments"
✅ Style distinct des niveaux 1 et 2
✅ Collapse de la catégorie fonctionne
✅ Persistance après redémarrage
```

### TEST MVP-08 — Déplacement des sous-catégories
```
🧪 Déplacer "Fondations bâtiment de commande" vers "Réalisation GC"

✅ La sous-catégorie arrive dans la catégorie cible
✅ Elle a disparu de "Études GC"
✅ Ses données sont intactes
❌ La sous-catégorie est dupliquée dans les deux catégories
```

### TEST MVP-09 — Bibliothèque de modèles
```
🧪 Sauvegarder la carte "Poste 400kV Saint-Étienne-du-Rouvray" en bibliothèque

✅ Le modèle apparaît en bibliothèque (type "Carte Projet")
✅ Contenu imbriqué complet sauvegardé (catégories + sous-catégories)
✅ La carte originale est toujours dans le tableau
✅ Persistance après redémarrage

🧪 Utiliser ce modèle pour créer "Poste 400kV Lyon-Est"

✅ Nouvelle carte créée avec toutes ses catégories et sous-catégories
✅ Le modèle original est intact en bibliothèque
✅ Les données de la copie sont indépendantes du modèle
❌ Le modèle disparaît après utilisation
❌ Modifier la copie modifie le modèle original
```

### TEST MVP-10 — Commentaires et archivage
```
🧪 Ajouter un commentaire sur la sous-catégorie "Fondations" :
   "RDV bureau d'études le 15/03/2026 — attente plan de coffrage"

✅ Le commentaire s'affiche avec la date de création
✅ Persistance après redémarrage

🧪 Archiver la carte "Poste 400kV Saint-Étienne-du-Rouvray"

✅ La carte disparaît du tableau principal
✅ Accessible dans la vue "Archives"
✅ Restauration possible depuis les archives
✅ Confirmation demandée avant archivage
```

---

## 📊 Récapitulatif MVP

| Critère | Détail |
|---|---|
| **Phases couvertes** | Phase 1, Phase 2, Phase 3 partielle |
| **Tâches de développement** | 35 tâches |
| **Tests de validation** | 10 tests |
| **Drag & drop** | ❌ Boutons ↑↓ ←→ et menus contextuels |
| **Commandes vocales** | ❌ Non |
| **Messagerie** | ❌ Non |
| **Connexion internet** | ❌ Non requise |
| **Plateforme** | Desktop (Electron) |

---

## ➡️ Prochaine version : V1.1
Drag & drop aux 3 niveaux + commandes vocales de base

---
*D-ProjeT — Version MVP 0.1 — 23 février 2026*
