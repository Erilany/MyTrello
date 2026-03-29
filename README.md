# D-ProjeT

Application de gestion de projet type Kanban.

## Lancement rapide

### Sur PC avec droits admin

```bash
npm install
npm run dev
```

### Sur PC sans droits admin (utilisation autonome)

1. Double-cliquez sur `launch.bat`
2. Attendez le téléchargement de Node.js (première fois seulement)
3. L'application s'ouvre automatiquement dans votre navigateur

## Fonctionnalités

### Gestion de projets

- Tableaux Kanban multiples
- Gestion des chapitres (tags)
  -priorités (urgent, normal, en attente, terminé)
- Dates d'échéance et assignation

### Structure hiérarchique

- **Projets** → **Chapitres** → **Cartes** → **Catégories** → **Sous-catégories**
- Chaque niveau peut avoir ses propres propriétés (titre, description, priorité, échéance, responsable)

### Bibliothèque de modèles

- Sauvegarder des cartes, catégories et sous-catégories comme modèles
- **Templates** : créer des ensembles personnalisés de modèles
- **Importer/Exporter** : échanger des templates entre utilisateurs via fichier JSON
- **Favoris** : marquer des éléments favoris visibles depuis Paramètres

### Import/Export

- **Templates** : Import/export de modèles personnalisés via JSON (`d-projet-templates.json`)
- Sauvegarde automatique dans localStorage

### Interface utilisateur

- Thème clair/sombre
- Navigation par onglets avec surbrillance du projet actif
- Design système personnalisé

### Autres fonctionnalités

- Archivage de projets
- Comments et historique
- Recherche
- Gestion des erreurs

## Base de données

### Structure

L'application utilise **localStorage** pour stocker les données en JSON. Voici la structure :

```javascript
{
  boards: [
    {
      id: 1,
      title: "Nom du projet",
      description: "",
      color: "#4A90D9",
      position: 0,
      is_archived: 0,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z"
    }
  ],
  columns: [
    {
      id: 1,
      board_id: 1,
      title: "À faire",
      position: 0,
      color: "#4A90D9",
      collapsed: 0
    }
  ],
  cards: [
    {
      id: 1,
      column_id: 1,
      title: "Titre de la carte",
      description: "",
      priority: "normal",  // urgent | normal | waiting | done
      due_date: null,
      assignee: "",
      position: 0,
      color: "#FFFFFF",
      is_archived: 0,
      collapsed: 0,
      chapter: "Chapitre1",  // Tag/Chapitre associé
      start_date: null,
      duration_days: 1,
      parent_id: null,
      predecessor_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z"
    }
  ],
  categories: [
    {
      id: 1,
      card_id: 1,
      title: "Nom de la catégorie",
      description: "",
      priority: "normal",
      due_date: null,
      assignee: "",
      position: 0,
      color: "#F5F5F5",
      collapsed: 0,
      start_date: null,
      duration_days: 1,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z"
    }
  ],
  subcategories: [
    {
      id: 1,
      category_id: 1,
      title: "Nom de la sous-catégorie",
      description: "",
      priority: "normal",
      due_date: null,
      assignee: "",
      position: 0,
      start_date: null,
      duration_days: 1,
      predecessors: [],
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z"
    }
  ],
  comments: [...],
  libraryItems: [...],  // Modèles sauvegardés
  nextIds: {
    board: 1,
    column: 1,
    card: 1,
    category: 1,
    subcategory: 1,
    comment: 1,
    libraryItem: 1
  }
}
```

### Clés de stockage localStorage

| Clé                          | Description                    |
| ---------------------------- | ------------------------------ |
| `mytrello_db`                | Base de données principale     |
| `mytrello_theme`             | Thème sélectionné (light/dark) |
| `mytrello_library_favorites` | Favoris de la bibliothèque     |
| `mytrello_templates`         | Templates personnalisés        |

## Import / Export de templates

### Fichiers et fonctions

| Fichier            | Fonction                   | Description                                     |
| ------------------ | -------------------------- | ----------------------------------------------- |
| `LibraryPanel.jsx` | `handleExportTemplates()`  | Exporte tous les templates vers un fichier JSON |
| `LibraryPanel.jsx` | `handleImportFileSelect()` | Lit le fichier JSON importé                     |
| `LibraryPanel.jsx` | `handleConfirmImport()`    | Importe les templates sélectionnés              |

### Format du fichier JSON

```json
{
  "templates": [
    {
      "id": 1,
      "name": "Template RH",
      "created_at": "2024-01-01T00:00:00.000Z",
      "cards": [
        {
          "id": 1,
          "title": "Carte 1",
          "tags": "tag1,tag2",
          "content_json": "{...}"
        }
      ],
      "categories": [
        {
          "title": "Catégorie 1",
          "cardTitle": "Carte 1",
          "content_json": "{...}"
        }
      ],
      "subcategories": [
        {
          "title": "Sous-catégorie 1",
          "categoryTitle": "Catégorie 1",
          "cardTitle": "Carte 1",
          "content_json": "{...}"
        }
      ]
    }
  ]
}
```

### Utilisation

1. **Exporter** : Bouton "Exporter" → Télécharge `d-projet-templates.json`
2. **Importer** : Bouton "Importer" → Sélectionne un fichier → Coche les templatesdesired → "Importer la sélection"

## Gestion des doublons

L'application empêche la création de doublons :

- **Cartes** : Vérification du titre de carte dans le projet
- **Catégories** : Vérification du titre de catégorie pour une carte
- **Sous-catégories** : Vérification du titre de sous-catégorie pour une catégorie

Un message d'erreur est affiché si un doublon est détecté.

## Problèmes courants

### "node: command not found"

Relancez `launch.bat` - il téléchargera Node.js automatiquement.

### L'application ne s'affiche pas

Vérifiez que le port 5173 est disponible, ou modifiez `vite.config.js`

## Commandes npm

```bash
npm install      # Installe les dépendances
npm run dev      # Lance le serveur de développement
npm run build    # Build pour production
npm run preview  # Prévisualise le build
```

## Architecture des composants

```
src/
├── components/
│   ├── Board/
│   │   └── Board2.jsx          # Vue principale Kanban
│   ├── Library/
│   │   ├── Library.jsx        # Page bibliothèque (non utilisée)
│   │   └── LibraryPanel.jsx    # Panneau bibliothèque + Templates
│   ├── Settings/
│   │   ├── Settings.jsx       # Paramètres utilisateur
│   │   ├── LibraryFavorites.jsx # Gestion favoris bibliothèque
│   │   └── SystemSettings.jsx  # Paramètres système
│   ├── Sidebar/
│   │   └── Sidebar.jsx       # Navigation latérale
│   ├── Header/
│   │   └── Header.jsx         # En-tête
│   └── ...
├── context/
│   └── AppContext.jsx         # Contexte global + fonctions DB
├── App.jsx                    # Routeur principal
└── main.jsx                   # Point d'entrée
```
