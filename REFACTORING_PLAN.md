# Plan de refactorisation D-ProjeT

## Objectif

Améliorer la maintenabilité du projet sans régression fonctionnelle.

## État des lieux

### Fichiers volumineux

| Fichier        | Lignes | Problème                |
| -------------- | ------ | ----------------------- |
| Board2.jsx     | ~2800  | Trop de responsabilités |
| AppContext.jsx | 1780   | Contexte trop gros      |

### Résumé Phase déjà effectuée (Un seul formulaire)

- ✅ SubCategoryModal enrichi avec statut + jalons
- ✅ Board2 utilise SubCategoryModal via setSelectedSubcategory
- ✅ Un seul formulaire pour Kanban, Tâches et Planning

---

## Phase 1: Extraction des utilitaires

### Fichiers à créer

```
src/utils/
├── dateUtils.js
├── ganttUtils.js
└── xmlUtils.js
```

### Contenu

#### src/utils/dateUtils.js

```javascript
export function addBusinessDays(startDate, days) { ... }
export function subtractBusinessDays(endDate, days) { ... }
export function getWeekNumber(date) { ... }
```

#### src/utils/ganttUtils.js

```javascript
export function getGanttDateRange(tasks) { ... }
export function getGanttDays(startDate, endDate) { ... }
export function getTaskBarPosition(task, days) { ... }
```

#### src/utils/xmlUtils.js

```javascript
export function formatDuration(days) { ... }
export function formatMSProjectDuration(days) { ... }
export function formatDateForMSP(date) { ... }
export function generateMSProjectXML(projectName, tasks) { ... }
```

### Tests à effectuer

- [ ] Vérifier que `addBusinessDays` fonctionne pour les dates de début/fin
- [ ] Vérifier que `getWeekNumber` retourne les bonnes semaines
- [ ] Vérifier que `generateMSProjectXML` produit un fichier valide
- [ ] Tester les cas limites (dates nulles, durées 0, etc.)

---

## Phase 2: Hooks personnalisés

### Fichiers à créer

```
src/hooks/
├── useLocalStorage.js
└── usePlanning.js
```

### Contenu

#### src/hooks/useLocalStorage.js

```javascript
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => { ... });
  const setValue = (value) => { ... };
  return [storedValue, setValue];
}
```

#### src/hooks/usePlanning.js

```javascript
export function usePlanning(currentBoard, getProjectTasks) {
  const [planningSelectedTasks, setPlanningSelectedTasks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // ... fonctions de sauvegarde localStorage
  // ... fonctions de regroupement hiérarchique

  return {
    planningSelectedTasks,
    expandedChapters,
    expandedCards,
    expandedCategories,
    getGroupedTasks,
    getPlanningFlatList,
    // ...
  };
}
```

### Tests à effectuer

- [ ] Vérifier que le hook charge les données depuis localStorage
- [ ] Vérifier que le hook sauvegarde automatiquement
- [ ] Vérifier que chaque projet a son propre espace de stockage

---

## Phase 3: Extraire les composants Planning

### Fichiers à créer

```
src/components/Planning/
├── PlanningView.jsx        # Titre, filtres, boutons export
├── PlanningSidebar.jsx    # Liste hiérarchique (gauche)
├── PlanningGantt.jsx      # Barres Gantt (droite)
├── PlanningTaskSelector.jsx  # Modal sélection tâches
└── index.jsx             # Export centralisé
```

### Contenu

#### PlanningView.jsx

- Titre "Planning"
- Filtres (tâches sélectionnées)
- Boutons (export MS Project, dates)
- Délègue à PlanningSidebar et PlanningGantt

#### PlanningSidebar.jsx

- Affiche la hiérarchie chapitres → cartes → catégories → tâches
- Gère les dépliages/repliages
- Affiche les compteurs

#### PlanningGantt.jsx

- En-tête semaines (défilant)
- Barres de tâches alignées avec sidebar
- Gestion du scroll synchrone

#### PlanningTaskSelector.jsx

- Modal de sélection des tâches
- Regroupement par carte/catégorie

### Tests à effectuer

- [ ] Planning s'affiche correctement après extraction
- [ ] Dépliage/repliage fonctionne
- [ ] Scroll synchronisé entre sidebar et Gantt
- [ ] Export MS Project fonctionne
- [ ] Sélection des tâches fonctionne
- [ ] Persistance localStorage fonctionne

---

## Phase 4: Simplifier Board2.jsx

### Objectif

Board2.jsx délègue aux sous-composants

### Structure cible

```javascript
function Board2() {
  const {
    /* states from useApp */
  } = useApp();

  // États locaux minimaux
  const [activeTab, setActiveTab] = useState('taches');

  // Sous-composants
  const renderTabContent = () => {
    switch (activeTab) {
      case 'taches':
        return <TasksView />;
      case 'planning':
        return <PlanningView />;
      case 'commandes':
        return <CommandesView />;
      case 'echanges':
        return <Exchange boardId={currentBoard.id} />;
      case 'informations':
        return <InformationsView />;
    }
  };

  return (
    <>
      <Tabs />
      {renderTabContent()}
    </>
  );
}
```

### Tests à effectuer

- [ ] Tous les onglets fonctionnent
- [ ] Navigation entre onglets OK
- [ ] Pas de régression fonctionnelle

---

## Phase 5: Organisation finale

### Structure de fichiers cible

```
src/
├── components/
│   ├── Board/
│   │   ├── Board.jsx           # Vue Kanban
│   │   └── Board2.jsx          # Simplifié
│   ├── Planning/               # NOUVEAU
│   │   ├── PlanningView.jsx
│   │   ├── PlanningSidebar.jsx
│   │   ├── PlanningGantt.jsx
│   │   ├── PlanningTaskSelector.jsx
│   │   └── index.jsx
│   ├── Exchange/
│   ├── Library/
│   └── ...
├── context/
│   └── AppContext.jsx          # Réduit
├── hooks/                      # NOUVEAU
│   ├── useLocalStorage.js
│   └── usePlanning.js
├── utils/                     # NOUVEAU
│   ├── dateUtils.js
│   ├── ganttUtils.js
│   └── xmlUtils.js
└── ...
```

---

## Ordre d'exécution recommandé

| Phase | Description         | Risque    | Durée estimé |
| ----- | ------------------- | --------- | ------------ |
| 1     | Utilitaires         | Faible    | 30 min       |
| 2     | Hooks               | Faible    | 1h           |
| 3     | Composants Planning | **Moyen** | 2h           |
| 4     | Simplifier Board2   | Faible    | 30 min       |

---

## Tests de non-régression globaux

### À effectuer après chaque phase

- [ ] L'application se charge sans erreur
- [ ] Tous les onglets sont accessibles
- [ ] Les tâches s'affichent correctement
- [ ] Les modifications sont sauvegardées
- [ ] La bibliothèque fonctionne
- [ ] Les favoris fonctionnent
- [ ] Le mode sombre/clair fonctionne
- [ ] Le responsive fonctionne

### Tests spécifiques Planning

- [ ] Les tâches s'affichent dans Planning
- [ ] Le Gantt se génère correctement
- [ ] Les barres sont alignées avec les libellés
- [ ] Le scroll est synchronisé
- [ ] Les dépliages/repliages fonctionnent
- [ ] La persistance fonctionne
- [ ] L'export MS Project fonctionne

---

## Notes

- Faire des commits fréquents pour pouvoir revenir en arrière
- Tester sur les deux thèmes (clair/sombre)
- Tester sur mobile si responsive
- Documenter les décisions dans le code
