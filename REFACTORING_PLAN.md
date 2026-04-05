# Plan de Refactoring - MyTrello

## État d'avancement (mis à jour le 2026-04-05)

### ✅ Terminé

| Étape | Description                                        | Status     |
| ----- | -------------------------------------------------- | ---------- |
| 1.1   | Marqueurs sections Board2 + structure dossiers     | ✅ Terminé |
| 2     | Extraction PaiementsForm + corrections sauvegardes | ✅ Terminé |
| 4     | Marqueurs LibraryPanel                             | ✅ Terminé |
| 5     | Suppression code dupliqué (contacts externes)      | ✅ Terminé |
| 3.1   | Extraction useTimer (~70 lignes)                   | ✅ Terminé |
| 3.2   | Extraction useSettings (~40 lignes)                | ✅ Terminé |
| 3.3   | Extraction useHiddenMilestones (~15 lignes)        | ✅ Terminé |
| 3.4   | Extraction useUserSettings                         | ✅ Terminé |
| 3.5   | Extraction useProjectTime                          | ✅ Terminé |
| 3.6   | Extraction useInternalContacts                     | ✅ Terminé |
| 3.7   | Extraction useUI (intégré)                         | ✅ Terminé |
| 3.8   | Extraction useOrders                               | ✅ Terminé |
| 3.9   | Extraction useBoardCrud                            | ✅ Terminé |
| 3.10  | Extraction useCardCrud                             | ✅ Terminé |
| 3.11  | Extraction useCategorySubcategoryCrud              | ✅ Terminé |
| 3.12  | Extraction useArchived (intégré)                   | ✅ Terminé |
| 3.13  | Extraction useSubcategoryEmails                    | ✅ Terminé |

### 📁 Fichiers créés

```
src/hooks/
├── useTimer.jsx              (gestion timer/chronomètre)
├── useSettings.jsx           (theme + couleurs cartes)
├── useHiddenMilestones.jsx   (jalons cachés)
├── useUserSettings.jsx       (username/userRole)
├── useProjectTime.jsx        (gestion temps projet)
├── useInternalContacts.jsx   (contacts internes)
├── useUI.jsx                 (état UI) - INTÉGRÉ
├── useOrders.jsx             (commandes/avenants)
├── useBoardCrud.jsx          (boards/colonnes)
├── useCardCrud.jsx           (cartes)
├── useCategorySubcategoryCrud.jsx (catégories/sous-catégories)
├── useArchived.jsx           (archives) - INTÉGRÉ
├── useSubcategoryEmails.jsx  (emails sous-catégories)
├── useLibrary.jsx            (bibliothèque)
├── useLibraryCrud.jsx        (CRUD bibliothèque)
└── useMessages.jsx           (messages)

src/components/Board/forms/
└── PaiementsForm.jsx        (suivi des paiements)
```

### 📊 Réduction

- **AppContext.jsx** : ~2400 → ~2323 lignes
- **Board2.jsx** : 3644 lignes, marqueurs sections ajoutés

---

## Étapes restantes

### Priorité 1 (extraire)

- Extraction de `useBoardData` - gestion boards/columns/cards/categories
- Extraction de `useSubcategories` - gestion sous-catégories et jalons

### Priorité 2 (refonte)

- Refonte complète de AppContext (complexe, à faire en plusieurs sessions)

---

## Vue d'ensemble (original)

| Étape | Fichier cible                       | Durée estimée | Risque régression      |
| ----- | ----------------------------------- | ------------- | ---------------------- |
| 1     | Board2.jsx - Extraction onglets     | 2-3h          | Moyen                  |
| 2     | Board2.jsx - Extraction formulaires | 1-2h          | Moyen                  |
| 3     | AppContext.jsx - Séparation hooks   | 1-2h          | Élevé (DERNIÈRE ÉTAPE) |
| 4     | LibraryPanel.jsx - Décomposition    | 2h            | Faible                 |
| 5     | Code dupliqué - Contacts externes   | 30min         | Faible                 |

---

## Étape 1: Extraction des onglets de Board2.jsx

### Objectif

Créer des fichiers distincts pour chaque onglet afin de réduire Board2.jsx de 3827 à ~800 lignes.

### Sous-étapes

#### 1.1 Créer la structure de dossiers

```
src/components/Board/tabs/
├── TachesTab.jsx       (~500 lignes - extraire de 1380-1897)
├── CommandesTab.jsx    (~800 lignes - extraire de 1899-2942)
├── PlanningTab.jsx     (~50 lignes - extraire de 2944-2978)
├── EchangesTab.jsx    (~50 lignes - extraire de 2980)
└── InformationsTab.jsx (~750 lignes - extraire de 2982-3733)
```

#### 1.2 Extraire TachesTab.jsx

**Contient** : Affichage des colonnes, cartes, catégories, sous-catégories, statut des tâches

**Points de vérification affichage** :

- [ ] Les colonnes s'affichent correctement
- [ ] Les cartes sont visibles avec leurs catégories
- [ ] Le Drag & Drop fonctionne
- [ ] Les filtres (chapitre, membre) fonctionnent
- [ ] L'ouverture/fermeture des cartes fonctionne

#### 1.3 Extraire CommandesTab.jsx

**Contient** : Gestion commandes, avenants, décomptes, autres lignes, groupes marchandises

**Points de vérification affichage** :

- [ ] La liste des commandes s'affiche
- [ ] La sélection d'une commande ouvre le panneau de détail
- [ ] Les onglets affectation/commande/décompte fonctionnent
- [ ] Les formulaires de saisie sont fonctionnels

#### 1.4 Extraire InformationsTab.jsx

**Contient** : Paramètres projet, liens, EOTP, contacts internes/externes

**Points de vérification affichage** :

- [ ] Les onglets Paramètres/Liens/EOTP/Contacts s'affichent
- [ ] Les formulaires sont éditables
- [ ] Les contacts s'ajoutent/se modifient

#### 1.5 Intégration dans Board2.jsx

```javascript
// Nouveau Board2.jsx simplifié
import TachesTab from './tabs/TachesTab';
import CommandesTab from './tabs/CommandesTab';
import InformationsTab from './tabs/InformationsTab';
// ...
{
  activeTab === 'taches' && <TachesTab />;
}
{
  activeTab === 'commandes' && <CommandesTab />;
}
{
  activeTab === 'informations' && <InformationsTab />;
}
```

---

## Étape 2: Extraction des formulaires de Board2.jsx

### Objectif

Créer des composants réutilisables pour les formulaires complexes.

### Sous-étapes

#### 2.1 Créer la structure

```
src/components/Board/forms/
├── CommandeForm.jsx     (Affectation, commande, autres lignes)
├── MarchandisesForm.jsx (Groupes de marchandises)
└── PaiementsForm.jsx    (Suivi des paiements)
```

#### 2.2 Extraire PaiementsForm.jsx

Le code des paiements est dans Board2:2727-2900
**Action** : Compléter l'extraction en composant autonome

**Points de vérification affichage** :

- [ ] Ajout de paiement fonctionnel
- [ ] Modification date/montant/pourcentage fonctionne
- [ ] Calcul automatique fonctionne dans les deux sens

#### 2.3 Extraire CommandeForm.jsx

**Contient** : Formulaire de création/modification de commande avec :

- Affectation (date, client, commercial)
- Commande (numéro, date, objet)
- Autres lignes (designation, quantité, prix)

---

## Étape 3: Séparation AppContext.jsx (DERNIÈRE ÉTAPE)

### Objectif

Extraire les hooks personnalisés pour isoler la logique métier.

### Sous-étapes

#### 3.1 Créer la structure

```
src/hooks/
├── useBoardData.js      (boards, columns, cards, categories)
├── useSubcategories.js (sous-catégories, jalons, emails)
├── useCommandes.js     (gestion commandes)
├── useStorage.js       (persistance localStorage)
└── useTimer.js         (gestion du timer - déjà quasi séparé)
```

#### 3.2 Extraire useStorage.js

**Action** : Isoler les fonctions de sauvegarde/chargement localStorage

**Points de vérification** :

- [ ] Sauvegarde automatique fonctionne
- [ ] Chargement au démarrage OK
- [ ] Persistence après refresh navigateur

#### 3.3 Refactoriser AppContext.jsx

**Objectif** : Passer de 40+ callbacks useCallback à une simple composition de hooks

```javascript
// Nouveau AppContext.jsx (pseudo-code)
export function AppProvider({ children }) {
  const boards = useBoardData();
  const subcategories = useSubcategories();
  const storage = useStorage();

  const value = useMemo(
    () => ({
      ...boards,
      ...subcategories,
      ...storage,
    }),
    [...boards, ...subcategories, ...storage]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
```

**Points de vérification** :

- [ ] Toutes les fonctionnalités CRUD fonctionnent
- [ ] Import/Export fonctionne
- [ ] Library fonctionne

---

## Étape 4: Décomposition LibraryPanel.jsx

### Objectif

Réduire LibraryPanel.jsx de 2928 à ~600 lignes.

### Sous-étapes

#### 4.1 Créer la structure

```
src/components/Library/
├── LibraryPanel.jsx     (Conteneur principal ~500 lignes)
├── LibraryFilters.jsx  (Filtres, recherche, tri)
├── LibraryFavorites.jsx (Gestion des favoris - EXTRAIRE DE LibraryFavorites.jsx existant)
├── LibraryTemplates.jsx (Import/export templates)
└── LibraryPreview.jsx  (Prévisualisation des éléments)
```

#### 4.2 Vérifications

**Points de vérification affichage** :

- [ ] Vue cards fonctionne
- [ ] Vue liste fonctionne
- [ ] Les filtres (type, favori, recherche) fonctionnent
- [ ] L'utilisation d'un template fonctionne

---

## Étape 5: Suppression code dupliqué

### Objectif

Éliminer les duplications pour faciliter la maintenance.

### Sous-étapes

#### 5.1 Harmoniser la gestion des contacts externes

**Localisation** : Board2.jsx:3635-3705

**Action** : Créer un composant `ExternalContactForm.jsx` réutilisable

#### 5.2 Ajouter safeJSONParse

**Localisation** : Partout où JSON.parse est utilisé

```javascript
// utils/safeParse.js
export const safeJSONParse = (str, fallback = []) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
};
```

---

## Stratégie de test et commit

### Avant chaque session de refactoring

1. **Sauvegarde** : Exporter les données via la fonctionnalité d'export
2. **Vérification** : Constater que l'application fonctionne avant les modifications

### Après chaque étape modifiée

1. **Tests** : Lancer l'application et vérifier le bon fonctionnement
2. **Affichage** : Demander à l'utilisateur de vérifier les points d'affichage
3. **Commit** : Proposer un commit avec nom et commentaire

### Format des commits

**Nom** : `refactor(board): extraire onglet X vers composant autonome`

**Commentaire** :

- Décrire ce qui a été extrait
- Lister les points de vérification testés
- Mentionner les points restants à vérifier par l'utilisateur

---

## Ordre recommandé pour l'implémentation

1. **Étape 1.1** : Créer la structure de dossiers (pas de risque)
2. **Étapes 1.2-1.4** : Extraire les onglets un par un (vérifier après chaque)
3. **Étape 2** : Extraire les formulaires (dépend de l'étape 1)
4. **Étape 5** : Supprimer le code dupliqué (facultatif)
5. **Étape 4** : LibraryPanel (indépendant)
6. **Étape 3** : AppContext (le plus risqué, à faire en dernier)
