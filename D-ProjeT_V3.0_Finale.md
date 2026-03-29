# 📋 D-ProjeT — Version 3.0 (Version Finale)

> **Objectif** : Synchronisation complète + performances + sécurité + tests automatisés
> **Prérequis** : V2.2 validée et tous les tests V2.2 passés
> **Basé sur** : Phase 9 + Phase 10 complète du plan de développement

---

## 🎯 Périmètre V3.0

| Nouveautés V3.0                                               | Statut               |
| ------------------------------------------------------------- | -------------------- |
| Synchronisation tags Outlook ↔ étiquettes D-ProjeT            | ✅ Inclus            |
| Synchronisation libellés Gmail ↔ étiquettes D-ProjeT          | ✅ Inclus            |
| Synchronisation tags calendrier Outlook ↔ étiquettes D-ProjeT | ✅ Inclus            |
| Configuration du mapping tags (interface dédiée)              | ✅ Inclus            |
| Synchronisation périodique configurable                       | ✅ Inclus            |
| Virtualisation des listes longues                             | ✅ Inclus            |
| Lazy loading des emails                                       | ✅ Inclus            |
| Mise en cache intelligente                                    | ✅ Inclus            |
| Optimisation des requêtes SQLite                              | ✅ Inclus            |
| Tests unitaires automatisés (Jest)                            | ✅ Inclus            |
| Tests de composants (React Testing Library)                   | ✅ Inclus            |
| Tests end-to-end (Playwright)                                 | ✅ Inclus            |
| Chiffrement des tokens OAuth                                  | ✅ Inclus (renforcé) |
| Audit et validation des entrées                               | ✅ Inclus            |
| Export / Import des données complètes                         | ✅ Inclus            |
| Changelog intégré à l'application                             | ✅ Inclus            |

---

## 🏗️ Évolutions d'architecture V3.0

### Nouveaux composants

```
src/components/
├── Settings/
│   ├── SettingsSync.jsx              ← NOUVEAU (mapping tags)
│   └── SettingsData.jsx              ← NOUVEAU (export/import)
├── UI/
│   └── Changelog.jsx                 ← NOUVEAU
└── Messaging/
    └── SyncIndicator.jsx             ← NOUVEAU (indicateur sync)
```

### Nouveaux services

```
src/services/
├── sync.js                           ← NOUVEAU (synchronisation tags)
├── cache.js                          ← NOUVEAU (mise en cache)
├── security.js                       ← NOUVEAU (validation entrées)
└── export.js                         ← NOUVEAU (export/import données)
```

### Infrastructure tests

```
tests/
├── unit/                             ← NOUVEAU
│   ├── services/
│   │   ├── database.test.js
│   │   ├── voice.test.js
│   │   ├── outlook.test.js
│   │   ├── gmail.test.js
│   │   └── sync.test.js
│   └── utils/
├── components/                       ← NOUVEAU
│   ├── Board.test.jsx
│   ├── Card.test.jsx
│   ├── Category.test.jsx
│   ├── Library.test.jsx
│   └── VoiceControl.test.jsx
└── e2e/                              ← NOUVEAU
    ├── mvp.spec.js
    ├── dragdrop.spec.js
    ├── voice.spec.js
    ├── outlook.spec.js
    └── gmail.spec.js
```

### Nouvelles dépendances

```json
"jest":                      "^29.7.0",
"@testing-library/react":    "^14.1.0",
"@playwright/test":          "^1.40.0",
"react-window":              "^1.8.10",
"node-cache":                "^5.1.2"
```

---

## 🗄️ Évolutions base de données V3.0

```sql
-- Nouvelle table : mapping tags messagerie ↔ D-ProjeT
CREATE TABLE tag_mapping (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  source          TEXT NOT NULL,    -- 'outlook' | 'gmail'
  source_tag      TEXT NOT NULL,    -- nom tag côté messagerie
  d_projet_label  TEXT NOT NULL,    -- étiquette D-ProjeT correspondante
  priority        TEXT,             -- priorité D-ProjeT associée
  direction       TEXT DEFAULT 'both', -- 'to_d_projet' | 'to_messaging' | 'both'
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nouvelle table : historique synchronisation
CREATE TABLE sync_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source      TEXT NOT NULL,
  direction   TEXT NOT NULL,
  tag_from    TEXT NOT NULL,
  tag_to      TEXT NOT NULL,
  ref_type    TEXT,
  ref_id      INTEGER,
  status      TEXT NOT NULL,   -- 'success' | 'conflict' | 'error'
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extension table tag_mapping (ajout source 'calendar')
-- La colonne source accepte désormais : 'outlook' | 'gmail' | 'calendar'
-- Aucune modification de schéma nécessaire

-- Extension table sync_history (idem — source 'calendar' supportée)

-- Extension table settings
INSERT INTO settings (key, value) VALUES
  ('sync_enabled',          'true'),
  ('sync_interval_min',     '10'),
  ('sync_conflict_rule',    'd-projet'), -- 'd-projet' | 'messaging'
  ('sync_calendar_enabled', 'true'),     -- sync calendrier activée
  ('cache_ttl_min',         '5'),
  ('last_sync_outlook',     ''),
  ('last_sync_gmail',       ''),
  ('last_sync_calendar',    '');
```

---

## 🔧 Tâches de développement V3.0

### ÉTAPE 1 — Interface de mapping tags

- [ ] Onglet **Synchronisation** dans les paramètres
- [ ] Tableau de mapping : Tag messagerie ↔ Étiquette D-ProjeT
- [ ] Sélecteur de direction de sync (→ D-ProjeT / ← Messagerie / Bidirectionnel)
- [ ] Bouton "Ajouter une règle de mapping"
- [ ] Bouton "Supprimer une règle"
- [ ] Bouton "Tester la règle" (simulation sans modification)
- [ ] Règles de résolution de conflits :
  - D-ProjeT a la priorité
  - Messagerie a la priorité
  - Demander à l'utilisateur
- [ ] Affichage de l'historique des 20 dernières synchronisations

### ÉTAPE 2 — Service de synchronisation (sync.js)

- [ ] Synchronisation Outlook → D-ProjeT (catégories → étiquettes)
- [ ] Synchronisation D-ProjeT → Outlook (étiquettes → catégories)
- [ ] Synchronisation Gmail → D-ProjeT (libellés → étiquettes)
- [ ] Synchronisation D-ProjeT → Gmail (étiquettes → libellés)
- [ ] Synchronisation calendrier Outlook → D-ProjeT :
  - Les tags des événements calendrier alimentent les étiquettes D-ProjeT
  - Un événement calendrier lié à une carte met à jour son étiquette
- [ ] Détection et résolution des conflits
- [ ] Synchronisation au démarrage de l'application
- [ ] Synchronisation périodique automatique (intervalle configurable)
- [ ] Synchronisation manuelle (bouton dans l'interface)
- [ ] Prévention des boucles infinies (A→B→A→B)
- [ ] Journalisation dans `sync_history`

### ÉTAPE 3 — Optimisation des performances

- [ ] Installer `react-window` pour la virtualisation des listes
- [ ] Virtualiser la liste des emails (Outlook + Gmail)
- [ ] Virtualiser la liste des cartes si > 50 éléments
- [ ] Virtualiser la bibliothèque si > 100 modèles
- [ ] Lazy loading des corps d'emails (chargé à l'ouverture uniquement)
- [ ] Lazy loading des pièces jointes
- [ ] Mise en cache des données fréquentes (`node-cache`) :
  - Liste des dossiers Outlook (TTL : 30 min)
  - Liste des libellés Gmail (TTL : 30 min)
  - Emails récents (TTL : 5 min)
- [ ] Optimisation des requêtes SQLite :
  - Ajout d'index sur les colonnes fréquemment filtrées
  - Utilisation de requêtes préparées
  - Pagination des résultats
- [ ] Profiling et correction des re-renders React inutiles

### ÉTAPE 4 — Renforcement de la sécurité

- [ ] Audit complet des dépendances (`npm audit`)
- [ ] Correction de toutes les vulnérabilités critiques et hautes
- [ ] Validation et assainissement de toutes les entrées utilisateur
- [ ] Protection contre les injections SQL (requêtes préparées systématiques)
- [ ] Chiffrement renforcé des tokens OAuth (AES-256 via `electron-store`)
- [ ] Vérification d'intégrité des données importées (JSON)
- [ ] Pas de logs sensibles (tokens, emails) dans les fichiers de log
- [ ] Politique de Content Security Policy (CSP) Electron

### ÉTAPE 5 — Export / Import des données

- [ ] Export complet en JSON (tableaux, cartes, catégories, sous-catégories, bibliothèque)
- [ ] Export filtré (un tableau, une carte, un projet)
- [ ] Import depuis un fichier JSON exporté
- [ ] Validation du fichier importé avant import
- [ ] Gestion des conflits lors de l'import (écraser / ignorer / renommer)
- [ ] Export des données de synchronisation (mapping tags)
- [ ] Vider les archives (avec confirmation)
- [ ] Réinitialisation complète (avec double confirmation)

### ÉTAPE 6 — Tests unitaires (Jest)

- [ ] Tests du service `database.js` :
  - CRUD boards, columns, cards, categories, subcategories
  - Intégrité référentielle (CASCADE delete)
  - Gestion des positions (réordonnancement)
- [ ] Tests du service `voice.js` :
  - Correspondance commandes connues
  - Gestion synonymes
  - Commandes inconnues
  - Extraction des paramètres variables
- [ ] Tests du service `outlook.js` (avec mocks API)
- [ ] Tests du service `gmail.js` (avec mocks API)
- [ ] Tests du service `sync.js` :
  - Sync unidirectionnelle
  - Sync bidirectionnelle
  - Résolution de conflits
  - Prévention boucles infinies
- [ ] Tests du service `export.js` :
  - Export complet
  - Import valide
  - Import avec données corrompues

### ÉTAPE 7 — Tests de composants (React Testing Library)

- [ ] Tests composant `Board` : rendu, ajout colonne, suppression
- [ ] Tests composant `Card` : rendu, édition, archivage, collapse
- [ ] Tests composant `Category` : rendu, édition, collapse
- [ ] Tests composant `SubCategory` : rendu, édition
- [ ] Tests composant `Library` : sauvegarde, utilisation, recherche
- [ ] Tests composant `VoiceControl` : activation, commandes, historique
- [ ] Tests composant `OutlookPanel` : rendu, navigation, actions
- [ ] Tests composant `GmailPanel` : rendu, libellés, navigation

### ÉTAPE 8 — Tests end-to-end (Playwright)

- [ ] Scénario `mvp.spec.js` :
  - Créer tableau → colonnes → carte → catégories → sous-catégories
  - Sauvegarder et utiliser un modèle bibliothèque
- [ ] Scénario `dragdrop.spec.js` :
  - Drag & drop carte entre colonnes
  - Drag & drop catégorie inter-cartes
  - Drag & drop sous-catégorie inter-catégories
  - Drag & drop vers/depuis bibliothèque
- [ ] Scénario `voice.spec.js` :
  - Activation / désactivation vocale
  - Création par voix
  - Navigation par voix
  - Commande inconnue
- [ ] Scénario `outlook.spec.js` (avec compte test dédié) :
  - Connexion OAuth
  - Lecture emails
  - Drag & drop email → carte
  - Copier / Coller vocal
- [ ] Scénario `gmail.spec.js` (avec compte test dédié) :
  - Connexion OAuth Google
  - Gestion libellés
  - Drag & drop email → carte
  - Cohabitation Outlook + Gmail

### ÉTAPE 9 — Changelog et version

- [ ] Composant `Changelog` accessible depuis le menu "À propos"
- [ ] Rédiger le changelog complet (MVP → V3.0)
- [ ] Numérotation sémantique des versions (semver)
- [ ] Notification au démarrage si nouvelle version disponible (optionnel)

---

## 🧪 Tests de validation V3.0

### TEST V3.0-01 — Configuration mapping tags

```
🧪 Créer la règle : Catégorie Outlook "Urgent" ↔ Étiquette D-ProjeT "Urgent" (bidirectionnel)

✅ La règle apparaît dans le tableau de mapping
✅ La direction "bidirectionnel" est sélectionnée
✅ Le test de la règle (simulation) n'effectue aucune modification réelle

🧪 Créer la règle : Libellé Gmail "400kV" → Étiquette D-ProjeT "400kV" (sens unique)

✅ La règle est créée avec la bonne direction
✅ La règle inverse n'est pas créée
```

### TEST V3.0-02 — Synchronisation Outlook → D-ProjeT

```
🧪 Appliquer la catégorie "Urgent" sur un email dans Outlook
   (email déjà lié à une carte D-ProjeT)

✅ L'étiquette "Urgent" apparaît sur la carte D-ProjeT liée
✅ La sync s'effectue dans l'intervalle configuré (10 min)
✅ La sync est journalisée dans sync_history avec statut "success"
```

### TEST V3.0-02b — Synchronisation Calendrier → D-ProjeT

```
🧪 Créer dans Outlook un événement calendrier avec le tag "Projets 400kV"
   et le lier à la carte "Poste 400kV Lyon-Est" dans D-ProjeT

✅ L'étiquette "Projets 400kV" est appliquée sur la carte D-ProjeT liée
✅ La sync calendrier est journalisée dans sync_history (source = 'calendar')
✅ Le changement de tag sur l'événement calendrier met à jour l'étiquette D-ProjeT
✅ Pas de boucle infinie de synchronisation
```

### TEST V3.0-03 — Synchronisation D-ProjeT → Outlook

```
🧪 Changer l'étiquette d'une carte en "Urgent" dans D-ProjeT
   (carte liée à un email Outlook)

✅ La catégorie "Urgent" est appliquée sur l'email Outlook lié
✅ La sync s'effectue dans l'intervalle configuré
✅ Pas de boucle infinie de synchronisation (vérifier sync_history)
❌ La sync tourne en boucle (entrée répétée dans sync_history)
```

### TEST V3.0-04 — Résolution de conflits

```
🧪 Configurer "D-ProjeT a la priorité"
   Modifier simultanément une étiquette dans D-ProjeT ET dans Outlook

✅ Après sync, c'est l'étiquette D-ProjeT qui est conservée
✅ L'email Outlook adopte l'étiquette D-ProjeT
✅ Le conflit est journalisé dans sync_history avec statut "conflict"
```

### TEST V3.0-05 — Performances listes longues

```
🧪 Charger un tableau avec 100 cartes,
   chaque carte avec 10 catégories et 5 sous-catégories (5000 éléments)

✅ Temps de chargement initial < 3 secondes
✅ Le scroll est fluide (60fps)
✅ Le drag & drop reste réactif
✅ La recherche vocale reste immédiate

🧪 Charger 200 emails dans chaque panel (Outlook + Gmail)

✅ Les deux listes se chargent en moins de 5 secondes
✅ Le scroll dans la liste est fluide grâce à la virtualisation
✅ Le lazy loading des corps d'emails fonctionne
```

### TEST V3.0-06 — Tests automatisés (couverture)

```
🧪 Lancer la suite de tests Jest

✅ Couverture de code ≥ 80% pour les services critiques
✅ 0 test en échec
✅ Temps d'exécution < 2 minutes

🧪 Lancer les tests React Testing Library

✅ Tous les composants testés passent
✅ 0 warning critique dans les tests

🧪 Lancer les tests Playwright (e2e)

✅ Tous les scénarios passent sur l'environnement de test
✅ Temps d'exécution < 10 minutes
```

### TEST V3.0-07 — Sécurité

```
🧪 Lancer npm audit

✅ 0 vulnérabilité critique
✅ 0 vulnérabilité haute
✅ Les vulnérabilités moyennes documentées et acceptées

🧪 Tenter une injection SQL via un champ texte

✅ L'entrée est assainie et ne provoque aucune erreur SQL
✅ Les données de la base restent intactes

🧪 Inspecter les fichiers de log

✅ Aucun token, email ou donnée sensible présent dans les logs
```

### TEST V3.0-08 — Export / Import des données

```
🧪 Exporter l'intégralité des données en JSON

✅ Le fichier JSON est généré sans erreur
✅ Le fichier contient tableaux, cartes, catégories, sous-catégories, bibliothèque
✅ La taille du fichier est cohérente avec le volume de données

🧪 Réinitialiser l'application, importer le fichier JSON exporté

✅ Toutes les données sont restaurées à l'identique
✅ Les positions et relations sont correctes
✅ La bibliothèque est restaurée complètement

🧪 Tenter d'importer un fichier JSON corrompu

✅ L'application détecte l'erreur et affiche un message explicite
✅ Aucune donnée existante n'est modifiée
```

### TEST V3.0-09 — Test de robustesse longue durée

```
🧪 Utiliser l'application pendant 8 heures en continu
   (D-ProjeT + Outlook + Gmail actifs)

✅ Pas de fuite mémoire (RAM stable, variation < 10%)
✅ Pas de crash
✅ La synchronisation messagerie reste stable
✅ Les commandes vocales restent réactives
✅ Le drag & drop reste fluide

🧪 Couper et rétablir internet 10 fois en 1 heure

✅ L'application ne crash pas lors des coupures
✅ Les reconnexions sont automatiques
✅ Les données D-ProjeT locales ne sont jamais affectées
```

### TEST V3.0-10 — Test de régression finale

```
🧪 Rejouer TOUS les tests des versions précédentes :
   10 tests MVP + 10 tests V1.1 + 10 tests V1.2 +
   10 tests V2.0 + 10 tests V2.1 + 11 tests V2.2 = 61 tests au total

✅ Les 61 tests passent tous sans exception
✅ Aucune régression introduite par les optimisations V3.0
✅ L'application est prête pour une utilisation en production
❌ Un seul test d'une version précédente échoue → correction obligatoire avant release
```

---

## 📊 Récapitulatif V3.0 — Version Finale

| Critère                     | Détail                                         |
| --------------------------- | ---------------------------------------------- |
| **Phases couvertes**        | Phase 9 + Phase 10 complètes                   |
| **Tâches de développement** | 58 tâches                                      |
| **Tests de validation**     | 10 tests V3.0 + 50 tests régression            |
| **Synchronisation**         | ✅ Outlook + Gmail ↔ D-ProjeT (bidirectionnel) |
| **Performances**            | ✅ Virtualisées + mises en cache               |
| **Tests automatisés**       | ✅ Unitaires + composants + e2e                |
| **Sécurité**                | ✅ Renforcée                                   |
| **Export / Import**         | ✅ JSON complet                                |
| **Connexion internet**      | ✅ Requise pour messagerie uniquement          |
| **Plateforme**              | Desktop (Electron) + Web (React)               |

---

## 🏁 Récapitulatif global du projet D-ProjeT

| Version     | Objectif principal                     | Tâches         | Tests                                  |
| ----------- | -------------------------------------- | -------------- | -------------------------------------- |
| **MVP 0.1** | Utilisation personnelle immédiate      | 35             | 10                                     |
| **V1.1**    | Drag & drop + voix de base             | 38             | 10 + 10 régression                     |
| **V1.2**    | Bibliothèque + voix avancée + UI       | 52             | 10 + 20 régression                     |
| **V2.0**    | Intégration Outlook                    | 44             | 10 + 30 régression                     |
| **V2.1**    | Intégration Gmail + cohabitation       | 42             | 10 + 40 régression                     |
| **V2.2**    | Calendrier Outlook + filtrage par tags | 48             | 11 + 50 régression                     |
| **V3.0**    | Sync + perf + tests + sécurité         | 60             | 10 + 61 régression                     |
| **TOTAL**   |                                        | **319 tâches** | **71 tests nouveaux + 211 régression** |

---

_D-ProjeT — Version 3.0 Finale — 23 février 2026_
