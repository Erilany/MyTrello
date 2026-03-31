# 📋 C-PRojeTs — Version 1.2

> **Objectif** : Puissance métier — Bibliothèque complète + commandes vocales avancées + finitions UI
> **Prérequis** : V1.1 validée et tous les tests V1.1 passés
> **Basé sur** : Phase 3 (complète) + Phase 4 (enrichissement) + Phase 10 (partielle)

---

## 🎯 Périmètre V1.2

| Nouveautés V1.2                                 | Reporté                       |
| ----------------------------------------------- | ----------------------------- |
| Drag & drop bidirectionnel bibliothèque         | Intégration messagerie (V2.0) |
| Recherche et filtres dans la bibliothèque       | Synchronisation tags (V3.0)   |
| Thème clair / thème sombre                      | Tests automatisés (V3.0)      |
| Personnalisation couleurs par tableau           |                               |
| Animations de transition fluides                |                               |
| Commandes vocales bibliothèque enrichies        |                               |
| Indicateurs visuels avancés (deadlines, badges) |                               |
| Raccourcis clavier globaux                      |                               |
| Mode focus amélioré                             |                               |
| Page de paramètres complète                     |                               |
| Tour guidé nouvel utilisateur (onboarding)      |                               |

---

## 🏗️ Évolutions d'architecture V1.2

### Nouveaux composants

```
src/components/
├── Library/
│   ├── Library.jsx                (existant — refonte complète)
│   ├── LibraryPanel.jsx           ← NOUVEAU
│   ├── LibraryItem.jsx            (existant — enrichi)
│   ├── LibrarySearch.jsx          ← NOUVEAU
│   └── LibraryDropZone.jsx        ← NOUVEAU
├── UI/                            ← NOUVEAU (dossier complet)
│   ├── ThemeToggle.jsx
│   ├── ToastNotification.jsx
│   ├── ProgressBar.jsx
│   ├── Tooltip.jsx
│   └── ConfirmDialog.jsx
├── Settings/                      ← NOUVEAU
│   ├── Settings.jsx
│   ├── SettingsTheme.jsx
│   ├── SettingsVoice.jsx
│   └── SettingsKeyboard.jsx
└── Onboarding/                    ← NOUVEAU
    ├── OnboardingTour.jsx
    └── OnboardingStep.jsx
```

### Nouvelles dépendances

```json
"react-hot-toast":    "^2.4.1",
"framer-motion":      "^10.16.0",
"react-hotkeys-hook": "^4.4.1"
```

---

## 🗄️ Évolutions base de données V1.2

```sql
-- Extension table library_items
ALTER TABLE library_items ADD COLUMN tags TEXT DEFAULT '';
ALTER TABLE library_items ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE library_items ADD COLUMN last_used DATETIME;

-- Nouvelle table : paramètres utilisateur
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Données initiales paramètres
INSERT INTO settings (key, value) VALUES
  ('theme',              'light'),
  ('voice_language',     'fr-FR'),
  ('voice_confidence',   '0.70'),
  ('voice_timeout',      '10'),
  ('onboarding_done',    'false'),
  ('drag_animation',     'true');
```

---

## 🔧 Tâches de développement V1.2

### ÉTAPE 1 — Bibliothèque de modèles (version complète)

- [ ] Refonte du panel bibliothèque (design amélioré)
- [ ] Zone de dépôt (`LibraryDropZone`) clairement identifiée
- [ ] Drag & drop depuis le tableau vers la bibliothèque (tous niveaux)
- [ ] Drag & drop depuis la bibliothèque vers le tableau (tous niveaux)
- [ ] Adaptation automatique du type selon la zone de dépôt cible :
  - Vers le tableau → Carte Projet
  - Vers une Carte → Catégorie
  - Vers une Catégorie → Sous-catégorie
- [ ] Aperçu du modèle au survol (tooltip avec contenu imbriqué)
- [ ] Barre de recherche dans la bibliothèque
- [ ] Filtres par type (Carte / Catégorie / Sous-catégorie)
- [ ] Tri par date / nom / utilisation
- [ ] Compteur d'utilisation de chaque modèle
- [ ] Renommer un modèle (double-clic)
- [ ] Tags sur les modèles (ex: "400kV", "GC", "Électrique")
- [ ] Recherche par tag
- [ ] Confirmation avant suppression d'un modèle

### ÉTAPE 2 — Commandes vocales bibliothèque

- [ ] _"Ouvrir la bibliothèque"_ → Affiche le panel
- [ ] _"Fermer la bibliothèque"_ → Masque le panel
- [ ] _"Sauvegarder comme modèle"_ → Sauvegarde l'élément actif
- [ ] _"Sauvegarder comme modèle [nom]"_ → Avec nom personnalisé
- [ ] _"Utiliser le modèle [nom]"_ → Applique dans l'emplacement actif
- [ ] _"Supprimer le modèle [nom]"_ → Supprime avec confirmation vocale
- [ ] _"Rechercher modèle [terme]"_ → Filtre la bibliothèque

### ÉTAPE 3 — Thèmes et personnalisation UI

- [ ] Thème clair (défaut)
- [ ] Thème sombre
- [ ] Bascule thème (bouton dans header + commande vocale _"Thème sombre"_)
- [ ] Mémorisation du thème choisi (table `settings`)
- [ ] Personnalisation couleur de chaque tableau (palette de 12 couleurs)
- [ ] Personnalisation couleur de chaque colonne
- [ ] Personnalisation couleur de chaque carte projet

### ÉTAPE 4 — Animations et transitions

- [ ] Intégrer `framer-motion`
- [ ] Animation d'ouverture / fermeture des modals
- [ ] Animation collapse / expand des cartes et catégories
- [ ] Animation d'apparition des nouvelles cartes
- [ ] Animation de déplacement après drag & drop
- [ ] Transition fluide lors du changement de thème
- [ ] Option désactivation des animations (accessibilité)

### ÉTAPE 5 — Indicateurs visuels avancés

- [ ] Badge deadline sur les cartes :
  - 🔴 Rouge → Date dépassée
  - 🟠 Orange → Échéance dans moins de 3 jours
  - 🟢 Vert → Échéance lointaine
- [ ] Barre de progression sur les cartes (sous-catégories terminées / total)
- [ ] Badge nombre d'éléments à chaque niveau (mis à jour en temps réel)
- [ ] Indicateur de priorité visible sans ouvrir la carte
- [ ] Indicateur "commentaires non lus"

### ÉTAPE 6 — Raccourcis clavier globaux

- [ ] Intégrer `react-hotkeys-hook`
- [ ] `Ctrl + N` → Nouvelle carte dans colonne active
- [ ] `Ctrl + Shift + N` → Nouvelle catégorie dans carte active
- [ ] `Ctrl + F` → Recherche globale
- [ ] `Ctrl + B` → Ouvrir / Fermer bibliothèque
- [ ] `Ctrl + Z` → Annuler dernière action
- [ ] `Espace` → Activer / Désactiver écoute vocale
- [ ] `Échap` → Fermer modal / panel actif
- [ ] `F1` → Afficher aide et raccourcis
- [ ] Page de référence des raccourcis accessible via `F1`

### ÉTAPE 7 — Page de paramètres complète

- [ ] Onglet **Apparence** : thème, couleurs, animations
- [ ] Onglet **Voix** : langue, seuil confiance, timeout, test micro
- [ ] Onglet **Clavier** : liste des raccourcis, personnalisation
- [ ] Onglet **Données** : export JSON, import JSON, vider archives
- [ ] Onglet **À propos** : version, changelog

### ÉTAPE 8 — Tour guidé (onboarding)

- [ ] Déclenchement automatique au premier lancement
- [ ] Étape 1 : Créer un tableau
- [ ] Étape 2 : Ajouter des colonnes
- [ ] Étape 3 : Créer une carte
- [ ] Étape 4 : Ajouter catégories et sous-catégories
- [ ] Étape 5 : Utiliser le drag & drop
- [ ] Étape 6 : Sauvegarder un modèle en bibliothèque
- [ ] Étape 7 : Activer les commandes vocales
- [ ] Bouton "Passer le tutoriel"
- [ ] Bouton "Rejouer le tutoriel" dans les paramètres

---

## 🧪 Tests de validation V1.2

### TEST V1.2-01 — Drag & drop vers la bibliothèque

```
🧪 Glisser la carte "Poste 400kV Saint-Étienne-du-Rouvray"
   (avec ses 5 catégories et toutes ses sous-catégories)
   vers le panel bibliothèque

✅ Le modèle apparaît en bibliothèque (type "Carte Projet")
✅ Le contenu imbriqué complet est sauvegardé
✅ La carte originale reste dans le tableau
✅ Le compteur d'utilisation affiche 0
✅ Persistance après redémarrage
❌ La carte originale disparaît de la bibliothèque
❌ Les catégories imbriquées sont perdues dans le modèle
```

### TEST V1.2-02 — Drag & drop depuis la bibliothèque

```
🧪 Glisser le modèle "Poste 400kV" depuis la bibliothèque vers le tableau

✅ Une nouvelle carte est créée avec toutes ses catégories et sous-catégories
✅ Le modèle original est intact
✅ Le compteur d'utilisation passe à 1
✅ Les données de la copie sont indépendantes du modèle

🧪 Glisser un modèle "Études GC" vers une carte existante

✅ Une nouvelle catégorie est créée avec ses sous-catégories
✅ L'adaptation de type est automatique selon la zone de dépôt
❌ La copie et le modèle partagent les mêmes données
```

### TEST V1.2-03 — Recherche et filtres bibliothèque

```
🧪 Saisir "400kV" dans la barre de recherche

✅ Seuls les modèles contenant "400kV" apparaissent
✅ La recherche est insensible à la casse et aux accents

🧪 Filtrer par type "Catégorie"

✅ Seuls les modèles de type Catégorie s'affichent
✅ Les filtres type et recherche sont cumulables

🧪 Trier par "Utilisation"

✅ Les modèles les plus utilisés apparaissent en premier
```

### TEST V1.2-04 — Commandes vocales bibliothèque

```
🧪 Dire "Sauvegarder comme modèle Poste Standard 400kV"

✅ L'élément actif est sauvegardé avec le nom "Poste Standard 400kV"
✅ Toast de confirmation affiché

🧪 Dire "Utiliser le modèle Poste Standard 400kV"

✅ Le modèle est appliqué dans l'emplacement actif
✅ Confirmation vocale et visuelle

🧪 Dire "Rechercher modèle Électrique"

✅ La bibliothèque filtre et affiche les modèles "Électrique"
```

### TEST V1.2-05 — Thèmes

```
🧪 Basculer en thème sombre via le bouton header

✅ Tous les composants adoptent les couleurs sombres
✅ Le thème est mémorisé après redémarrage
✅ La lisibilité est correcte (contrastes suffisants)

🧪 Dire "Thème sombre" puis "Thème clair"

✅ Les bascules vocales fonctionnent
✅ La transition est animée et fluide
❌ Certains composants restent en thème clair dans le thème sombre
```

### TEST V1.2-06 — Animations

```
🧪 Ouvrir et fermer une modal de carte

✅ L'animation d'ouverture/fermeture est fluide (< 300ms)
✅ Pas de saccade ou de clignotement

🧪 Désactiver les animations dans les paramètres

✅ Les modals s'ouvrent instantanément (sans animation)
✅ Le drag & drop reste fonctionnel sans animations
```

### TEST V1.2-07 — Indicateurs visuels

```
🧪 Créer une carte avec date d'échéance dépassée

✅ Badge rouge affiché sur la carte
✅ Badge orange si échéance dans 2 jours
✅ Badge vert si échéance dans 3 semaines

🧪 Marquer 3 sous-catégories sur 5 comme "terminé"

✅ La barre de progression affiche 60% sur la catégorie parente
✅ La carte parente affiche la progression globale
```

### TEST V1.2-08 — Raccourcis clavier

```
🧪 Appuyer sur Ctrl + N (colonne active = "Études")

✅ Une nouvelle carte est créée dans "Études"
✅ Le champ titre est immédiatement en focus

🧪 Appuyer sur Ctrl + B

✅ Le panel bibliothèque s'ouvre ou se ferme
✅ Le raccourci fonctionne depuis n'importe quel contexte

🧪 Appuyer sur F1

✅ La liste complète des raccourcis s'affiche
✅ Fermeture par Échap ou clic extérieur
```

### TEST V1.2-09 — Onboarding

```
🧪 Réinitialiser l'état onboarding, redémarrer l'application

✅ Le tour guidé démarre automatiquement
✅ Chaque étape met en évidence le bon élément
✅ "Passer le tutoriel" stoppe le tour immédiatement
✅ L'onboarding n'apparaît plus au redémarrage suivant

🧪 Relancer le tutoriel depuis les paramètres

✅ Le tour redémarre depuis le début
```

### TEST V1.2-10 — Régression V1.1

```
🧪 Rejouer les 10 tests V1.1 + 10 tests MVP

✅ Tous les tests passent toujours
✅ Le drag & drop n'est pas affecté par les animations framer-motion
✅ Les commandes vocales de base fonctionnent toujours
❌ Une fonctionnalité V1.1 ou MVP est cassée
```

---

## 📊 Récapitulatif V1.2

| Critère                     | Détail                                                  |
| --------------------------- | ------------------------------------------------------- |
| **Phases couvertes**        | Phase 3 complète + Phase 4 enrichi + Phase 10 partielle |
| **Tâches de développement** | 52 tâches                                               |
| **Tests de validation**     | 10 tests (+ 20 tests régression)                        |
| **Bibliothèque**            | ✅ Complète avec drag & drop bidirectionnel             |
| **Commandes vocales**       | ✅ Complètes (base + bibliothèque)                      |
| **Thèmes**                  | ✅ Clair / Sombre                                       |
| **Messagerie**              | ❌ Non                                                  |
| **Connexion internet**      | ❌ Non requise                                          |

---

## ➡️ Prochaine version : V2.0

Intégration Outlook native — Module messagerie complet

---

_C-PRojeTs — Version 1.2 — 23 février 2026_
