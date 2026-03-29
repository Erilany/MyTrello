# Guide Utilisateur - D-ProjeT

## Table des matières

1. [Introduction](#introduction)
2. [Dashboard - Tableau de bord](#dashboard--tableau-de-bord)
   - [Temps passé](#temps-passé)
   - [Mes tâches](#mes-tâches)
   - [Revue d'activité](#revue-dactivité)
3. [Projets](#projets)
   - [Onglet Informations](#onglet-informations)
   - [Onglet Tâches](#onglet-tâches)
   - [Onglet Commandes](#onglet-commandes)
   - [Onglet Planning](#onglet-planning)
   - [Onglet Échanges](#onglet-échanges)
4. [Bibliothèque](#bibliothèque)
5. [Archives](#archives)
6. [Paramètres utilisateurs](#paramètres-utilisateurs)
7. [Paramètres système](#paramètres-système)
8. [Concepts clés et relations](#concepts-clés-et-relations)

---

## Introduction

D-ProjeT est une application de gestion de projets similaire à Trello, adaptée aux besoins de gestion de projets d'études techniques. Elle permet de:

- **Organiser les projets** en boards avec colonnes et cartes
- **Gérer les tâches** avec catégories et sous-catégories
- **Planifier** avec un diagramme de Gantt
- **Collaborer** via un système de messagerie
- **Suivre l'activité** et la charge de travail

### Navigation principale

La barre latérale gauche donne accès à:

- **Tableau de bord** (icône maison) - Vue d'ensemble
- **Projets** (icône dossier) - Liste des projets
- **Bibliothèque** (icône livre) - Templates réutilisables
- **Archives** (icône archive) - Projets archivés
- **Paramètres** (icône engrenage) - Configuration

---

## Dashboard - Tableau de bord

Accessible depuis la page d'accueil (`/`), le tableau de bord offre une vue synthétisée de vos projets et tâches.

### Temps passé

Cet onglet affiche le temps passé sur chaque projet.

**Fonctionnalités:**

- Liste des projets avec pourcentage de temps
- Visualisation de la répartition du temps
- Suivi hebdomadaire

**Utilisation:**

- Sélectionnez une semaine via le sélecteur de semaine
- Les pourcentages se mettent à jour automatiquement selon le temps enregistré

### Mes tâches

Cet onglet liste toutes les tâches qui vous sont assignées.

**Fonctionnalités:**

- Liste filtrée des tâches personnelles
- Affichage par projet
- Filtrage par statut (À faire, En cours, Terminée)
- Recherche de tâches
- Affichage des dates d'échéance et priorités

**Comment une tâche vous est-elle assignée?**

1. Dans l'onglet **Tâches** d'un projet
2. Ouvrez une sous-catégorie (tâche)
3. Dans le champ "Assigné à", sélectionnez votre nom
4. La tâche apparaît dans "Mes tâches"

**Relations avec les autres pages:**

- Les tâches affichées viennent des **sous-catégories** des projets
- Cliquez sur une tâche pour l'ouvrir et voir ses détails

### Revue d'activité

Cet onglet affiche une vue synthétique de l'activité sur une timeline trimestrielle.

**Fonctionnalités:**

- Timeline divisée par trimestres (T1, T2, T3, T4)
- Affichage des éléments tagués "Revue d'activité"
- Bandeaux colorés selon le type de tag (À valider, Urgente, etc.)
- Suivi de la charge ressentie par trimestre
- Bouton "Mes éléments" / "Tous les tags" pour filtrer

**Configuration requise:**

1. Définir les tags dans **Paramètres système > Base de données > Tags**
2. Attribuer les tags aux éléments dans **Paramètres système > Modèles Bibliothèque**
3. Synchroniser les tags via le bouton **"Sync tags bibliothèque"**

**Relations:**

- Les bandeaux représentent les éléments (catégories/sous-catégories) ayant un tag
- La largeur du bandeau correspond à la durée entre date de début et date de fin
- Les couleurs sont définies dans la configuration des tags

---

## Projets

Chaque projet dispose d'un board avec plusieurs onglets. Accédez aux projets via la barre latérale.

### Créer un projet

1. Cliquez sur **"+"** dans la section Projets de la barre latérale
2. Nommez le projet
3. Le projet apparaît dans la liste

### Onglet Informations

Cet onglet centralise toutes les informations administratives du projet.

**Sections disponibles:**

#### Liens

- Gestion des liens externes (documents, sites web)
- Ajoutez, modifiez ou supprimez des liens
- Chaque lien peut avoir un titre et une URL

#### Interlocuteurs Internes

- **Important**: Ce sont les personnes impliquées dans le projet avec leurs rôles
- **Fonctionnalité clé**: Le nom assigné à un rôle se PropAGE automatiquement à toutes les tâches
- Exemple: Si "Chargé(e) d'Etudes Poste HT" a le nom "Dupont Jean", toutes les tâches assignées à ce rôle afficheront "Dupont Jean"
- Pour modifier: Ajoutez ou modifiez le nom dans le champ prévu
- Les changements sont automatiquement appliqués aux tâches existantes

#### Interlocuteurs Externes

- Contacts externes au projet
- Même fonctionnement que les interlocuteurs internes

#### GMR (Gestion des Maîtrises d'Ouvrage)

- Liste des lignes GMR associées au projet
- Chaque ligne a un numéro RUO
- Utilisé pour le suivi budgétaire

#### Priorité

- Indicateur de priorité du projet (basse, normale, haute, urgente)

#### Zone

- Zone géographique du projet
- Permet le regroupement dans la Revue d'activité

**Relations:**

- Les interlocuteurs internes définissent les rôles disponibles pour les assignations
- Le GMR et la zone sont affichés dans la Revue d'activité

### Onglet Tâches

Cet onglet est le cœur de la gestion de projet.

**Structure hiérarchique:**

```
Projet > Chapitre > Carte > Catégorie > Sous-catégorie (Tâche)
```

#### Chapitres

- Regroupements de haut niveau (ex: "CONCERTATION", "ÉTUDES")
- Créés automatiquement depuis la bibliothèque ou manuellement
- Les boutons de chapitre montrent:
  - **Grisé**: Aucun élément dans ce chapitre
  - **Actif**: Des éléments existent

#### Cartes

- Représentent les grandes phases du projet (ex: "MCPO - EDD", "Préconcertation")
- Chaque carte peut contenir plusieurs catégories

#### Catégories

- Représentent les grandes catégories de tâches (ex: "Etude V1", "Contrôle DTT")
- Peuvent avoir un **tag** (pour la Revue d'activité)
- Peuvent être assignées à un rôle

#### Sous-catégories (Tâches)

- Les tâches individuelles
- **Champs importants:**
  - **Assigné à**: Sélection du rôle ou nom (hérité du rôle si configuré)
  - **Date de début**: Date de commencement
  - **Date d'échéance**: Date butoir
  - **Durée (j)**: Nombre de jours (calcule automatiquement l'autre date)
  - **Priorité**: Basse, Normale, Haute, Urgente
  - **Tag**: Pour la Revue d'activité

**Fonctionnalités spéciales:**

##### Création rapide de tâche

- Bouton "Créer une tâche {nom de la catégorie}" pour créer rapidement
- Si une tâche avec ce nom existe déjà, elle est sélectionnée

##### Dates et durée

- Sélectionnez quelle date est la référence (début ou fin)
- La modification de la durée recalcule automatiquement l'autre date
- Exemple: Si vous fixez la date de début et modifiez la durée, la date de fin est recalculée

### Onglet Commandes

Gestion des commandes et avenants.

**Sections:**

#### Affectation

- Liste des commandes associées au projet
- Chaque commande a un numéro, désignation, quantité, prix

#### Ajout de commande

1. Cliquez sur le bouton d'ajout
2. Remplissez les informations (numéro, désignation, etc.)
3. Validez pour l'ajouter

#### Avenants

- Suivi des modifications de commandes
- Même fonctionnement que les commandes

**Relations:**

- Les commandes peuvent être liées à des interlocuteurs externes

### Onglet Planning

Vue Gantt pour la planification visuelle.

**Fonctionnalités:**

- Timeline horizontale par mois/trimèstre
- Affichage des tâches sous forme de barres
- Les barres commencent à la date de début et finissent à la date d'échéance
- Sélection multiple de tâches avec Ctrl+clic
- Drag & drop pour déplacer les tâches

### Onglet Échanges

Système de messagerie temps réel.

**Fonctionnalités:**

- Fil de discussion par projet
- Mention d'utilisateurs avec @
- Attachement de fichiers
- Messages timestampés
- Indicateur de messages non lus

**Pour envoyer un message:**

1. Tapez votre message dans le champ de texte
2. Utilisez @ pour mentionner quelqu'un
3. Cliquez sur envoyer ou appuyez sur Entrée

---

## Bibliothèque

Accès via la barre latérale ou directement via `/library`.

### Qu'est-ce que la bibliothèque?

La bibliothèque contient des **templates réutilisables** pour accélérer la création de projets. Au lieu de créer chaque élément manuellement, vous pouvez:

1. Créer un template dans la bibliothèque
2. L'utiliser dans un projet
3. Toutes les catégories et sous-catégories sont copiées automatiquement

### Organisation

La bibliothèque peut contenir:

- **Cartes templates**: Modèles de cartes entières avec leurs catégories
- **Catégories templates**: Modèles de catégories individuels
- **Sous-catégories templates**: Modèles de tâches individuels

### Utiliser un template

1. Ouvrez la bibliothèque
2. Naviguez entre Cards, Catégories ou Sous-catégories
3. Cliquez sur **"Utiliser"** sur un template
4. Sélectionnez le projet et le chapitre cible
5. Les éléments sont créés dans le projet

### Tags dans la bibliothèque

**Important pour la Revue d'activité:**

1. Ouvrez **Paramètres système > Modèles Bibliothèque**
2. Pour chaque élément, vous pouvez définir un **tag système**
3. Ces tags seront attribués automatiquement lors de l'utilisation du template
4. Cliquez sur **"Sync tags bibliothèque"** dans la Revue d'activité pour mettre à jour les tags des éléments existants

---

## Archives

Les projets archivés sont accessibles ici. Un projet peut être archivé pour:

- Réduire l'encombrement dans la liste principale
- Conserver les données pour référence future

**Actions disponibles:**

- **Restaurer**: Remet le projet dans la liste principale
- **Supprimer définitivement**: Efface le projet et toutes ses données

---

## Paramètres utilisateurs

Accessible via l'icône engrenage > "Paramètres".

### Profil

**Configuration:**

- **Nom d'utilisateur**: Votre nom tel qu'il apparaîtra dans les assignations
- **Rôle**: Votre fonction dans l'organisation

Ces informations sont utilisées pour:

- Filtrer les tâches qui vous sont assignées
- Déterminer vos droits d'accès
- Afficher dans la Revue d'activité

### Favoris Bibliothèque

Marquez vos templates préférés pour un accès rapide.

**Utilisation:**

- Ajoutez/supprimez des favoris depuis la bibliothèque
- Filtrez par "Favoris" pour ne voir que vos templates

### Sauvegarde

**Exporter vos données:**

- Cliquez sur **"Exporter les données"**
- Un fichier JSON est téléchargé contenant:
  - Tous vos projets
  - Toutes les tâches et catégories
  - La configuration de la bibliothèque
  - Les paramètres de base de données (GMR, zones, tags)

**Importer des données:**

- Cliquez sur **"Importer un backup"**
- Sélectionnez un fichier JSON précédemment exporté
- Les données sont fusionnées avec l'existant

**Quand utiliser:**

- Avant une mise à jour importante
- Pour transférer vos données sur un autre poste
- Régulièrement pour sécuriser vos données

---

## Paramètres système

Accessible via l'icône engrenage > "Paramètres système". Réservé aux administrateurs.

### Base de données

Configuration des référentiels de l'organisation.

#### Chapitres

- Liste des chapitres disponibles
- Ordre de tri pour l'affichage
- Créer, modifier, supprimer des chapitres

#### GMR

- Gestion des codes GMR
- Chaque code a un numéro et une description

#### Catégories de projet

- Catégories par défaut pour les nouveaux projets

#### Zones

- Zones géographiques pour le regroupement
- Utilisées dans la Revue d'activité

#### Tags

- **Crucial pour la Revue d'activité**
- Définit les types de tags disponibles
- Chaque tag a:
  - **Nom**: Ex: "À valider", "Urgente"
  - **Couleur**: Couleur d'affichage dans le Gantt
  - **Fonctions**: Rôles autorisés (optionnel)

### Modèles Bibliothèque

Éditeur visuel pour créer et modifier les templates.

**Interface:**

- Vue en arbre avec drag & drop
- Organisation hiérarchique: Chapitre > Carte > Catégorie > Sous-catégorie

**Pour chaque élément:**

- Titre
- Description
- Temps estimé
- **Tag système**: Attribue automatiquement ce tag aux éléments créés

**Attribution d'un tag:**

1. Sélectionnez un nœud dans l'arbre
2. Dans le panneau latéral, choisissez le tag dans "Tag Revue d'activité"
3. Enregistrez

### Sauvegarde auto

Configuration de la sauvegarde automatique (en développement).

---

## Concepts clés et relations

### Hiérarchie des données

```
Organisation
└── Projet (Board)
    ├── Chapitre
    │   └── Carte
    │       ├── Catégorie
    │       │   ├── Tag (optionnel)
    │       │   ├── Assignation (optionnel)
    │       │   └── Sous-catégorie (Tâche)
    │       │       ├── Date de début
    │       │       ├── Date d'échéance
    │       │       ├── Durée
    │       │       ├── Assignation
    │       │       └── Tag (hérité de la catégorie)
    │       └── Sous-catégorie
    └── ...
```

### Flux de données principales

#### Création d'une tâche tagguée

1. Définir le tag dans **Paramètres système > Base de données**
2. Attribuer le tag dans **Paramètres système > Modèles Bibliothèque**
3. Utiliser le template dans un projet
4. Synchroniser via **"Sync tags bibliothèque"** si le projet existait déjà
5. La tâche apparaît dans la **Revue d'activité**

#### Assignation automatique par rôle

1. Dans **Informations du projet**, configurez les interlocuteurs internes
2. Assignez le nom à chaque rôle
3. Dans les tâches, sélectionnez le rôle
4. Le nom s'affiche automatiquement (ou le rôle si pas de nom)

#### Suivi de la charge

1. Les éléments tagués apparaissent dans la **Revue d'activité**
2. Chaque projet montre ses éléments sur la timeline
3. Utilisez la "Charge ressentie" pour indiquer la surcharge/undercharge par trimestre

### Bonnes pratiques

1. **Avant de commencer un projet:**
   - Configurez les interlocuteurs internes
   - Préparez les templates dans la bibliothèque

2. **Pour le suivi d'activité:**
   - Assurez-vous que les tags sont configurés
   - Utilisez "Sync tags bibliothèque" régulièrement

3. **Pour la sauvegarde:**
   - Exportez avant chaque mise à jour
   - Gardez des backups réguliers

4. **Pour les dates:**
   - Utilisez toujours des dates de début ET de fin
   - Laissez le système calculer la durée ou vice versa

---

## Support et dépannage

### Problèmes courants

**Mes tâches n'apparaissent pas:**

- Vérifiez que vous êtes bien assigné aux tâches
- Vérifiez votre nom dans le profil

**La Revue d'activité est vide:**

- Assurez-vous que les éléments ont des tags
- Cliquez sur "Sync tags bibliothèque"
- Vérifiez que les éléments ont des dates

**Les noms ne se propagent pas:**

- Vérifiez que le nom est bien assigné au rôle dans les interlocuteurs internes
- Les tâches doivent avoir le rôle (pas le nom) pour hériter

---

_Document créé pour D-ProjeT - Version 1.0_
