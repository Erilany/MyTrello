# 📋 C-PRojeTs — Version 1.1

> **Objectif** : Confort d'utilisation — Drag & drop complet + commandes vocales de base
> **Prérequis** : MVP (Version 0.1) validé et tous les tests MVP passés
> **Basé sur** : Phase 2 (finalisation) + Phase 4 du plan de développement

---

## 🎯 Périmètre V1.1

| Nouveautés V1.1                                                 | Reporté                       |
| --------------------------------------------------------------- | ----------------------------- |
| Drag & drop cartes entre colonnes                               | Bibliothèque avancée (V1.2)   |
| Drag & drop catégories (intra et inter-cartes)                  | Thèmes clair/sombre (V1.2)    |
| Drag & drop sous-catégories (intra et inter-catégories)         | Intégration messagerie (V2.0) |
| Drag & drop colonnes                                            |                               |
| Commande vocale — activation / désactivation                    |                               |
| Commandes vocales — création (carte, catégorie, sous-catégorie) |                               |
| Commandes vocales — navigation (ouvrir, fermer, afficher)       |                               |
| Commandes vocales — actions (taguer, assigner, archiver)        |                               |
| Retour visuel et sonore des commandes vocales                   |                               |
| Historique des commandes vocales                                |                               |

> ⚠️ Les boutons ↑↓ ←→ et menus contextuels du MVP restent disponibles en complément du drag & drop.

---

## 🏗️ Évolutions d'architecture V1.1

### Nouveaux composants

```
src/components/
├── Board/
│   └── DragDropContext.jsx        ← NOUVEAU
├── VoiceControl/                  ← NOUVEAU (dossier complet)
│   ├── VoiceControl.jsx
│   ├── VoiceIndicator.jsx
│   ├── VoiceCommandList.jsx
│   └── VoiceHistory.jsx
```

### Nouveaux services

```
src/services/
├── database.js                    (existant — inchangé)
└── voice.js                       ← NOUVEAU
```

### Nouvelle dépendance

```json
"react-beautiful-dnd": "^13.1.1"
```

---

## 🗄️ Évolutions base de données V1.1

```sql
-- Nouvelle table : historique commandes vocales
CREATE TABLE voice_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  command    TEXT NOT NULL,
  action     TEXT NOT NULL,
  status     TEXT NOT NULL, -- 'success' | 'unknown' | 'error'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> Aucune modification des tables existantes du MVP.

---

## 🔧 Tâches de développement V1.1

### ÉTAPE 1 — Drag & Drop niveau 1 (cartes et colonnes)

- [ ] Installer et configurer `react-beautiful-dnd`
- [ ] Créer le composant `DragDropContext` englobant le tableau
- [ ] Drag & drop des cartes entre colonnes
- [ ] Drag & drop des colonnes entre elles
- [ ] Animation visuelle pendant le drag (carte fantôme)
- [ ] Zone de dépôt mise en évidence au survol
- [ ] Persistance des positions après déplacement
- [ ] Supprimer les boutons ← → de déplacement (remplacés par drag & drop)
  > ⚠️ Garder le menu contextuel comme alternative clavier

### ÉTAPE 2 — Drag & Drop niveau 2 (catégories)

- [ ] Rendre les catégories draggables au sein d'une carte
- [ ] Drag & drop de catégories vers une autre carte projet
- [ ] Animation et zone de dépôt distincte du niveau 1
- [ ] Transfert complet du contenu imbriqué (sous-catégories incluses)
- [ ] Persistance des positions
- [ ] Supprimer les boutons ↑ ↓ de catégorie
  > ⚠️ Garder le menu contextuel comme alternative clavier

### ÉTAPE 3 — Drag & Drop niveau 3 (sous-catégories)

- [ ] Rendre les sous-catégories draggables au sein d'une catégorie
- [ ] Drag & drop de sous-catégories vers une autre catégorie (même carte ou autre)
- [ ] Animation et zone de dépôt distincte des niveaux 1 et 2
- [ ] Persistance des positions
- [ ] Supprimer les boutons ↑ ↓ de sous-catégorie
  > ⚠️ Garder le menu contextuel comme alternative clavier

### ÉTAPE 4 — Service de reconnaissance vocale

- [ ] Intégrer la Web Speech API dans `voice.js`
- [ ] Système d'activation / désactivation de l'écoute
- [ ] Indicateur visuel d'écoute active (icône micro animée)
- [ ] Indicateur sonore d'activation (bip discret)
- [ ] Timeout automatique après 10 secondes de silence
- [ ] Gestion des erreurs de reconnaissance
- [ ] Normalisation du texte reconnu (minuscules, accents)

### ÉTAPE 5 — Moteur de correspondance des commandes

- [ ] Créer le dictionnaire de commandes et actions associées
- [ ] Gestion des paramètres variables : _"Créer une carte [nom]"_
- [ ] Gestion des synonymes : _"Écoute"_ = _"Hey C-PRojeTs"_ = _"Activer"_
- [ ] Score de confiance minimum (ignorer si < 70%)
- [ ] Retour visuel de la commande reconnue (toast notification)
- [ ] Message "Commande non reconnue" si aucun match
- [ ] Historique des 20 dernières commandes (table `voice_history`)

### ÉTAPE 6 — Implémentation des commandes vocales

#### Activation / Contrôle

- [ ] _"Écoute"_ / _"Hey C-PRojeTs"_ → Activation écoute
- [ ] _"Stop"_ / _"Pause"_ → Désactivation écoute
- [ ] _"Annuler"_ → Annule la dernière action
- [ ] _"Aide"_ → Affiche la liste des commandes
- [ ] _"Répète"_ → Rejoue la dernière action

#### Création

- [ ] _"Créer une carte [nom]"_ → Nouvelle carte dans colonne active
- [ ] _"Créer catégorie [nom]"_ → Nouvelle catégorie dans carte active
- [ ] _"Créer sous-catégorie [nom]"_ → Nouvelle sous-catégorie dans catégorie active

#### Navigation

- [ ] _"Ouvrir carte [nom]"_ → Ouvre la carte (modal)
- [ ] _"Fermer carte"_ → Ferme la modal active
- [ ] _"Afficher tableau [nom]"_ → Bascule vers le tableau
- [ ] _"Mode focus"_ → Masque tout sauf l'élément actif

#### Actions

- [ ] _"Taguer [priorité]"_ → Applique une étiquette
- [ ] _"Assigner à [nom]"_ → Assigne l'élément actif
- [ ] _"Date d'échéance [date]"_ → Définit la deadline
- [ ] _"Archiver carte"_ → Archive la carte active
- [ ] _"Ajouter commentaire [texte]"_ → Ajoute un commentaire

#### Bibliothèque

- [ ] _"Sauvegarder comme modèle"_ → Sauvegarde en bibliothèque
- [ ] _"Utiliser le modèle [nom]"_ → Applique un modèle
- [ ] _"Ouvrir la bibliothèque"_ → Affiche le panel

---

## 🧪 Tests de validation V1.1

### TEST V1.1-01 — Drag & drop cartes (niveau 1)

```
🧪 Glisser "Poste 400kV Saint-Étienne-du-Rouvray" de "Études" vers "En cours"

✅ La carte se déplace visuellement en temps réel pendant le drag
✅ La zone de dépôt est mise en évidence au survol
✅ La carte est bien dans "En cours" après dépôt
✅ La position est persistée après redémarrage
✅ Les catégories et sous-catégories sont intactes après déplacement
❌ La carte disparaît pendant ou après le drag
❌ Les catégories imbriquées sont perdues
```

### TEST V1.1-02 — Drag & drop colonnes

```
🧪 Glisser la colonne "Archivé" en deuxième position

✅ La colonne se déplace avec toutes ses cartes
✅ L'ordre est conservé après redémarrage
❌ Les cartes de la colonne disparaissent lors du déplacement
```

### TEST V1.1-03 — Drag & drop catégories (niveau 2)

```
🧪 Glisser "Études Électriques HTB" avant "Études GC" dans la même carte

✅ La catégorie se déplace visuellement
✅ L'ordre est persisté après redémarrage

🧪 Glisser "Suivi administratif" (avec ses sous-catégories)
   vers la carte "Poste 400kV Lyon-Est"

✅ La catégorie arrive dans la carte cible avec toutes ses sous-catégories
✅ La catégorie a disparu de la carte source
✅ L'animation de drag est distincte du niveau 1
❌ Les sous-catégories sont perdues lors du déplacement inter-cartes
```

### TEST V1.1-04 — Drag & drop sous-catégories (niveau 3)

```
🧪 Glisser "Fondations bâtiment de commande" avant "Terrassements"
   dans la catégorie "Études GC"

✅ La sous-catégorie se déplace dans la catégorie
✅ L'ordre est persisté

🧪 Glisser "Réseaux enterrés" vers la catégorie "Réalisation GC"

✅ La sous-catégorie arrive dans la catégorie cible
✅ Elle a disparu de "Études GC"
✅ L'animation est distincte des niveaux 1 et 2
❌ La sous-catégorie est dupliquée dans les deux catégories
```

### TEST V1.1-05 — Activation vocale

```
🧪 Dire "Hey C-PRojeTs"

✅ L'icône micro s'anime
✅ Un bip discret confirme l'activation
✅ Un indicateur textuel "En écoute..." apparaît

🧪 Laisser 10 secondes de silence

✅ L'écoute se désactive automatiquement
✅ L'indicateur disparaît

🧪 Dire "Stop"

✅ L'écoute se désactive immédiatement
❌ L'application reste en écoute après "Stop"
```

### TEST V1.1-06 — Commandes de création vocale

```
🧪 Activer l'écoute, dire "Créer une carte Poste Marseille Sud"

✅ Une carte "Poste Marseille Sud" est créée dans la colonne active
✅ Un toast confirme "Carte créée : Poste Marseille Sud"
✅ La carte est persistée

🧪 Carte ouverte, dire "Créer catégorie Études Génie Civil"

✅ La catégorie est créée dans la carte active
✅ Confirmation visuelle affichée
❌ La catégorie est créée dans la mauvaise carte
```

### TEST V1.1-07 — Commandes de navigation vocale

```
🧪 Dire "Ouvrir carte Poste Lyon-Est"

✅ La carte s'ouvre en modal
✅ Si nom ambigu, une liste de choix est proposée

🧪 Dire "Mode focus"

✅ Tout est masqué sauf l'élément actif
✅ "Annuler" ou "Mode focus" désactive le mode
```

### TEST V1.1-08 — Commandes d'action vocale

```
🧪 Carte active, dire "Taguer urgent"

✅ L'étiquette "Urgent" est appliquée sur la carte
✅ La couleur change immédiatement

🧪 Dire "Ajouter commentaire En attente du plan de masse RTE"

✅ Le commentaire "En attente du plan de masse RTE" est ajouté
✅ Horodatage correct
```

### TEST V1.1-09 — Robustesse vocale

```
🧪 Dire une commande inconnue "Faire le café"

✅ Message "Commande non reconnue" affiché
✅ L'écoute reste active

🧪 Vérifier l'historique vocal

✅ Les 20 dernières commandes sont listées avec statut (succès / inconnu)
✅ La date et l'heure de chaque commande sont affichées

🧪 Dire "Annuler" après une création de carte

✅ La dernière carte créée est supprimée
✅ Toast de confirmation "Action annulée"
```

### TEST V1.1-10 — Régression MVP

```
🧪 Rejouer les 10 tests du MVP

✅ Tous les tests MVP passent toujours
✅ Aucune fonctionnalité MVP n'est cassée par le drag & drop
✅ Les menus contextuels de déplacement sont toujours fonctionnels
❌ Une fonctionnalité MVP ne fonctionne plus
```

---

## 📊 Récapitulatif V1.1

| Critère                     | Détail                                  |
| --------------------------- | --------------------------------------- |
| **Phases couvertes**        | Phase 2 (finalisation) + Phase 4        |
| **Tâches de développement** | 38 tâches                               |
| **Tests de validation**     | 10 tests (+ 10 tests régression MVP)    |
| **Drag & drop**             | ✅ Aux 3 niveaux + colonnes             |
| **Commandes vocales**       | ✅ Base (création, navigation, actions) |
| **Messagerie**              | ❌ Non                                  |
| **Connexion internet**      | ❌ Non requise                          |

---

## ➡️ Prochaine version : V1.2

Bibliothèque avancée + commandes vocales enrichies + finitions UI

---

_C-PRojeTs — Version 1.1 — 23 février 2026_
