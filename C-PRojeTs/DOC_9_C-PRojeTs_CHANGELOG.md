# 📋 C-PRojeTs — Changelog

> Toutes les modifications notables de ce projet sont documentées dans ce fichier.
> Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
> Ce projet suit la [gestion sémantique de version](https://semver.org/lang/fr/).

---

## Format des entrées

```
## [VERSION] — AAAA-MM-JJ

### ✨ Nouveautés
- Description d'une nouvelle fonctionnalité

### 🔧 Améliorations
- Description d'une amélioration d'une fonctionnalité existante

### 🐛 Corrections
- Description d'un bug corrigé

### ⚠️ Breaking Changes
- Description d'un changement incompatible avec la version précédente

### 🗑️ Suppressions
- Description d'une fonctionnalité retirée

### 🔒 Sécurité
- Description d'une correction de sécurité
```

---

## [Non publié] — En cours de développement

### ✨ Nouveautés

- Initialisation du projet C-PRojeTs

---

## Roadmap des versions

| Version   | Objectif                                                                     | Date cible |
| --------- | ---------------------------------------------------------------------------- | ---------- |
| **0.1.0** | MVP — Structure 3 niveaux + bibliothèque + persistance SQLite                | À définir  |
| **1.1.0** | Drag & drop complet + commandes vocales de base                              | À définir  |
| **1.2.0** | Bibliothèque avancée + thèmes + raccourcis clavier + onboarding              | À définir  |
| **2.0.0** | Intégration Outlook (Graph API + EWS fallback)                               | À définir  |
| **2.1.0** | Intégration Gmail + cohabitation Outlook/Gmail                               | À définir  |
| **2.2.0** | Calendrier Outlook avec filtrage par tags                                    | À définir  |
| **3.0.0** | Synchronisation tags + performances + tests automatisés + sécurité renforcée | À définir  |

---

## [0.1.0] — À venir (MVP)

### ✨ Nouveautés

**Structure 3 niveaux**

- Tableau avec colonnes personnalisables (ajout, renommage, suppression)
- Cartes projet (niveau 1) : titre, description, priorité, date d'échéance, assignation
- Catégories (niveau 2) : idem cartes, imbriquées dans une carte
- Sous-catégories (niveau 3) : idem catégories, imbriquées dans une catégorie
- Déplacement des cartes entre colonnes (boutons ← →)
- Déplacement des catégories (boutons ↑ ↓, menu contextuel inter-cartes)
- Déplacement des sous-catégories (boutons ↑ ↓, menu contextuel inter-catégories)
- Collapse / expand à chaque niveau
- Badges (nombre d'enfants, priorité, date)

**Bibliothèque de modèles**

- Sauvegarde d'une carte/catégorie/sous-catégorie comme modèle (bouton)
- Sauvegarde du contenu imbriqué complet (JSON)
- Panel bibliothèque avec liste des modèles par type
- Application d'un modèle par bouton "Utiliser"
- Renommage et suppression d'un modèle

**Données et persistance**

- Base de données SQLite locale
- Persistance complète de toutes les données
- Gestion des commentaires (tous niveaux)
- Archivage et vue archives avec restauration
- Pièces jointes locales

**Interface**

- Interface React avec TailwindCSS
- Application Electron desktop

---

## [1.1.0] — À venir

### ✨ Nouveautés

**Drag & drop**

- Drag & drop des cartes entre colonnes
- Drag & drop des colonnes dans le tableau
- Drag & drop des catégories au sein d'une carte
- Drag & drop des catégories entre cartes (avec sous-catégories)
- Drag & drop des sous-catégories au sein d'une catégorie
- Drag & drop des sous-catégories entre catégories
- Animations visuelles et zones de dépôt

**Commandes vocales**

- Activation vocale : "Hey C-PRojeTs" / "Écoute"
- Création : carte, catégorie, sous-catégorie
- Navigation : ouvrir/fermer carte, afficher tableau, mode focus
- Actions : taguer, assigner, date d'échéance, archiver, commenter
- Bibliothèque : sauvegarder, utiliser, ouvrir
- Historique des 20 dernières commandes
- Annulation de la dernière action

### 🔧 Améliorations

- Remplacement des boutons ↑↓←→ par le drag & drop (menus contextuels conservés)

---

## [1.2.0] — À venir

### ✨ Nouveautés

**Bibliothèque avancée**

- Drag & drop depuis le tableau vers la bibliothèque
- Drag & drop depuis la bibliothèque vers le tableau
- Adaptation automatique du type selon la zone de dépôt
- Recherche et filtres dans la bibliothèque
- Tags sur les modèles
- Compteur d'utilisation des modèles
- Aperçu du modèle au survol (tooltip)

**Apparence et UI**

- Thème clair / thème sombre (bascule + commande vocale)
- Personnalisation des couleurs (tableau, colonne, carte)
- Animations framer-motion (modals, transitions, drag & drop)
- Option désactivation des animations (accessibilité)

**Indicateurs visuels avancés**

- Badge deadline coloré (rouge/orange/vert)
- Barre de progression sur les cartes
- Indicateur "commentaires non lus"

**Ergonomie**

- Raccourcis clavier globaux (Ctrl+N, Ctrl+B, Ctrl+F, Échap, F1…)
- Page de paramètres complète (apparence, voix, clavier, données)
- Tour guidé nouvel utilisateur (onboarding)

---

## [2.0.0] — À venir

### ✨ Nouveautés

**Module Messagerie — Outlook**

- Activation par bouton dans les paramètres
- Détection automatique du mode : Microsoft Graph API (cloud) ou EWS (on-premise)
- Panel Outlook : liste des emails, aperçu, navigation clavier
- Actions sur les emails : déplacer dossier, appliquer catégorie, marquer lu/non lu, supprimer, répondre, transférer
- Drag & drop email → Carte (crée une catégorie)
- Drag & drop email → Catégorie (crée une sous-catégorie)
- Drag & drop email → Sous-catégorie (attache comme lien)
- Copier / Coller vocal Outlook → C-PRojeTs
- Création de carte depuis email (vocal)
- Historique des liens email par élément C-PRojeTs
- Commandes vocales Outlook complètes (15 commandes)
- Rafraîchissement automatique configurable
- Indicateur de connexion et de mode (cloud / on-premise)

---

## [2.1.0] — À venir

### ✨ Nouveautés

**Module Messagerie — Gmail**

- Activation par bouton dans les paramètres
- Authentification OAuth 2.0 Google
- Panel Gmail : liste des emails, libellés multiples, aperçu
- Actions : ajouter/retirer libellé, archiver, supprimer, répondre, transférer
- Drag & drop email Gmail → C-PRojeTs (même logique qu'Outlook)
- Copier / Coller vocal Gmail → C-PRojeTs
- Commandes vocales Gmail complètes

**Cohabitation Outlook + Gmail**

- Onglets Outlook | Gmail (si les deux activés)
- Badge non lus par onglet
- Indicateur source (bleu Outlook / rouge Gmail) sur les éléments C-PRojeTs
- Commande vocale "Basculer messagerie"

---

## [2.2.0] — À venir

### ✨ Nouveautés

**Module Calendrier Outlook**

- Activation par bouton dans les paramètres (requiert Outlook connecté)
- Compatible Microsoft 365, Outlook 2024 cloud et on-premise (EWS)
- Sélecteur de tags : mode simple (un tag) et multiple (plusieurs tags)
- Bascule rapide entre mode simple et multiple
- Recherche dans les tags, persistance des filtres
- Vue liste : chronologique, groupée par jour, indicateurs (aujourd'hui, passé, en cours)
- Vue semaine : grille horaire, événements colorés par tag
- Vue mois : grille mensuelle, badges colorés, indicateur "+N autres"
- Navigation entre semaines/mois, bouton "Aujourd'hui"
- Modal de détail d'un événement
- Indicateur RDV du jour dans le header C-PRojeTs
- Rafraîchissement automatique
- 15 commandes vocales dédiées (navigation + filtrage)

---

## [3.0.0] — À venir

### ✨ Nouveautés

**Synchronisation tags**

- Interface de mapping tags : messagerie/calendrier ↔ étiquettes C-PRojeTs
- Synchronisation bidirectionnelle Outlook ↔ C-PRojeTs
- Synchronisation bidirectionnelle Gmail ↔ C-PRojeTs
- Synchronisation calendrier Outlook → C-PRojeTs
- Règles de résolution de conflits configurables
- Sync périodique automatique (intervalle configurable)
- Historique des synchronisations

**Export / Import**

- Export complet des données en JSON
- Import depuis un fichier JSON exporté
- Validation des fichiers importés
- Gestion des conflits à l'import

**Tests automatisés**

- Suite de tests unitaires Jest (couverture ≥ 80%)
- Tests de composants React Testing Library
- Tests end-to-end Playwright (5 scénarios)

### 🔧 Améliorations

**Performances**

- Virtualisation des listes longues (react-window)
- Lazy loading des emails et corps d'événements
- Mise en cache intelligente avec TTL configurable
- Optimisation des requêtes SQLite (index, requêtes préparées)

**Sécurité renforcée**

- Audit complet des dépendances (0 vulnérabilité critique/haute)
- Validation et assainissement de toutes les entrées
- CSP Electron renforcé
- Logs anonymisés vérifiés

**UI**

- Changelog accessible depuis le menu "À propos"
- Relancer le tutoriel depuis les paramètres

---

_C-PRojeTs — Changelog — 23 février 2026_
