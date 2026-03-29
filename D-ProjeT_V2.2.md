# 📋 D-ProjeT — Version 2.2
> **Objectif** : Intégration du calendrier Outlook avec filtrage par tags
> **Prérequis** : V2.1 validée et tous les tests V2.1 passés
> **Basé sur** : Extension de la Phase 5 (Microsoft Graph API — Calendar)

---

## 🎯 Périmètre V2.2

| Nouveautés V2.2 | Reporté |
|---|---|
| Récupération du calendrier Outlook dans D-ProjeT | Calendrier Gmail (hors périmètre) |
| Sélecteur de tags (filtre simple ou multiple) | Synchronisation calendrier ↔ D-ProjeT (V3.0) |
| Vue liste des RDV filtrés par tag | Création de RDV depuis D-ProjeT (hors périmètre) |
| Vue calendrier visuel semaine / mois | |
| Bascule rapide liste ↔ calendrier | |
| Rafraîchissement automatique du calendrier | |
| Indicateur RDV du jour dans le header D-ProjeT | |
| Commandes vocales calendrier | |

---

## 🏗️ Évolutions d'architecture V2.2

### Nouveaux composants

```
src/components/
└── Calendar/                          ← NOUVEAU (dossier complet)
    ├── CalendarPanel.jsx              → Panel principal calendrier
    ├── CalendarTagSelector.jsx        → Sélecteur de tags (filtre)
    ├── CalendarListView.jsx           → Vue liste des RDV filtrés
    ├── CalendarMonthView.jsx          → Vue calendrier mensuelle
    ├── CalendarWeekView.jsx           → Vue calendrier hebdomadaire
    ├── CalendarEventCard.jsx          → Carte d'un rendez-vous
    ├── CalendarDayIndicator.jsx       → Indicateur RDV du jour (header)
    └── CalendarToggle.jsx             → Bouton activation dans paramètres
```

### Extension des services existants

```
src/services/
└── messaging/
    └── outlook.js                     → Ajout des méthodes calendrier :
                                         getCalendarTags()
                                         getEventsByTags()
                                         getEventsForPeriod()
```

### Nouvelles dépendances

```json
"react-big-calendar": "^1.8.7",
"date-fns":           "^3.3.1"
```

---

## 🗄️ Évolutions base de données V2.2

```sql
-- Nouvelle table : tags calendrier sélectionnés (persistance filtres)
CREATE TABLE calendar_filters (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name   TEXT NOT NULL UNIQUE,
  color      TEXT DEFAULT '#4A90D9',
  is_active  INTEGER DEFAULT 1,
  position   INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nouvelle table : cache local des événements calendrier
CREATE TABLE calendar_events_cache (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  outlook_id     TEXT NOT NULL UNIQUE,
  subject        TEXT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime   DATETIME NOT NULL,
  location       TEXT,
  body_preview   TEXT,
  organizer      TEXT,
  tags           TEXT,        -- JSON array des catégories Outlook
  is_all_day     INTEGER DEFAULT 0,
  cached_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extension table settings
INSERT INTO settings (key, value) VALUES
  ('calendar_enabled',       'false'),
  ('calendar_view',          'week'),    -- 'list' | 'week' | 'month'
  ('calendar_refresh_min',   '15'),
  ('calendar_show_indicator','true'),    -- indicateur RDV du jour dans header
  ('calendar_days_ahead',    '30'),      -- fenêtre de chargement (jours)
  ('calendar_multi_tag',     'false');   -- mode multi-tag actif
```

---

## 🔧 Tâches de développement V2.2

### ÉTAPE 1 — Extension Microsoft Graph API (Calendrier)

- [ ] Vérifier que la permission `Calendars.Read` est ajoutée dans Azure AD
  > ⚠️ Nécessite une mise à jour du consentement OAuth (l'utilisateur devra
  > se reconnecter une fois pour accepter la nouvelle permission)
- [ ] Méthode `getCalendarTags()` → récupère toutes les catégories Outlook
  utilisées dans les événements du calendrier
- [ ] Méthode `getEventsByTags(tags[], dateFrom, dateTo)` → récupère les
  événements filtrés par un ou plusieurs tags sur une période donnée
- [ ] Méthode `getEventsForPeriod(dateFrom, dateTo)` → récupère tous les
  événements sans filtre (pour la vue calendrier complète)
- [ ] Mise en cache locale des événements dans `calendar_events_cache`
- [ ] Rafraîchissement automatique du cache toutes les X minutes (configurable)
- [ ] Gestion des événements récurrents (affichage des occurrences)
- [ ] Gestion des événements sur toute la journée (all-day)

### ÉTAPE 2 — Bouton d'activation Calendrier (paramètres)

- [ ] Ajouter la section **Calendrier** dans l'onglet Messagerie des paramètres
- [ ] Bouton à cocher "Activer le calendrier Outlook"
  > Le calendrier utilise la connexion Outlook déjà établie
  > Si Outlook n'est pas connecté → message "Connectez d'abord Outlook"
- [ ] Configuration de la fenêtre de chargement (7 / 14 / 30 / 90 jours)
- [ ] Configuration de l'intervalle de rafraîchissement (5 / 15 / 30 min)
- [ ] Option "Afficher l'indicateur de RDV du jour dans le header"
- [ ] Persistance de tous les paramètres

### ÉTAPE 3 — Sélecteur de tags (CalendarTagSelector)

C'est le composant central de la fonctionnalité. Il permet de choisir
quels tags/catégories Outlook afficher dans le calendrier.

- [ ] Au premier chargement : récupérer tous les tags disponibles via
  `getCalendarTags()` et les afficher dans le sélecteur
- [ ] Affichage des tags sous forme de **badges colorés cliquables**
  (couleur = couleur de la catégorie Outlook correspondante)
- [ ] **Mode sélection simple** (un seul tag actif à la fois) :
  - Clic sur un tag → l'active et désactive le précédent
  - Le calendrier se filtre immédiatement
- [ ] **Mode sélection multiple** (plusieurs tags simultanément) :
  - Bouton bascule "Mode multi-tags" (ou raccourci `Ctrl + clic`)
  - Clic sur chaque tag → l'ajoute/retire de la sélection active
  - Badge compteur "N tags sélectionnés"
  - Bouton "Tout sélectionner" / "Tout désélectionner"
- [ ] Bascule rapide entre mode simple et mode multiple
- [ ] Option "Tous les tags" → affiche tous les événements sans filtre
- [ ] Barre de recherche rapide dans la liste des tags
  (utile si beaucoup de catégories Outlook)
- [ ] Persistance des tags sélectionnés (table `calendar_filters`)
- [ ] Bouton "Rafraîchir les tags" (re-synchronise depuis Outlook)

### ÉTAPE 4 — Vue liste des RDV (CalendarListView)

- [ ] Affichage en liste chronologique des événements filtrés
- [ ] Groupement par jour (séparateur de date entre chaque jour)
- [ ] Pour chaque événement afficher :
  - 🏷️ Badge(s) tag(s) coloré(s)
  - 📅 Date et heure (début → fin)
  - 📌 Titre de l'événement
  - 📍 Lieu (si renseigné)
  - 👤 Organisateur
  - 🕐 Durée calculée automatiquement
  - 📝 Aperçu du corps (2 lignes max)
- [ ] Indicateur "Aujourd'hui" sur le jour courant
- [ ] Indicateur "Dans X jours" sur les événements futurs
- [ ] Événements passés affichés en grisé
- [ ] Événement en cours affiché en surbrillance
- [ ] Clic sur un événement → ouvre le détail complet (modal)
- [ ] Scroll infini ou pagination (configurable)

### ÉTAPE 5 — Vue calendrier visuel (CalendarWeekView + CalendarMonthView)

- [ ] Intégrer `react-big-calendar` avec `date-fns` comme localizer
- [ ] **Vue semaine** :
  - Grille 7 colonnes (lun → dim)
  - Plages horaires de 7h à 21h par défaut
  - Événements colorés selon leur tag
  - Événements all-day affichés en haut de la grille
  - Navigation semaine précédente / suivante
  - Bouton "Aujourd'hui" pour revenir à la semaine courante
- [ ] **Vue mois** :
  - Grille mensuelle classique
  - Événements affichés avec badge coloré du tag
  - Si trop d'événements par jour → indicateur "+N autres"
  - Navigation mois précédent / suivant
  - Bouton "Aujourd'hui"
- [ ] Clic sur un événement → modal de détail
- [ ] Survol d'un événement → tooltip avec résumé
- [ ] Les événements filtrés par tags sont appliqués en temps réel
  (changer le tag → les événements disparaissent/apparaissent instantanément)
- [ ] Événements multi-jours affichés en bandeau continu

### ÉTAPE 6 — Bascule vue liste ↔ calendrier

- [ ] Boutons de bascule dans le header du panel calendrier :
  - 📋 Liste
  - 📅 Semaine
  - 🗓️ Mois
- [ ] Mémorisation de la vue active (settings)
- [ ] Transition animée entre les vues
- [ ] Raccourci clavier :
  - `L` → Vue liste
  - `W` (week) → Vue semaine
  - `M` (month) → Vue mois

### ÉTAPE 7 — Indicateur RDV du jour (header D-ProjeT)

- [ ] Badge dans le header principal de D-ProjeT indiquant le nombre
  de RDV du jour correspondant aux tags sélectionnés
- [ ] Survol du badge → tooltip listant les RDV du jour
- [ ] Clic sur le badge → ouvre le panel calendrier sur la vue liste du jour
- [ ] Le badge est vide (masqué) si aucun RDV du jour
- [ ] Mise à jour automatique à minuit (passage au jour suivant)

### ÉTAPE 8 — Modal de détail d'un événement

- [ ] Afficher toutes les informations de l'événement :
  - Titre, date/heure, durée, lieu, organisateur
  - Participants (liste avec statut accepté/refusé/en attente)
  - Corps complet de l'événement
  - Badge(s) tag(s) coloré(s)
  - Lien "Ouvrir dans Outlook" (deep link)
- [ ] Bouton fermer la modal

### ÉTAPE 9 — Commandes vocales calendrier

- [ ] *"Ouvrir le calendrier"* → Bascule vers le panel calendrier
- [ ] *"Fermer le calendrier"* → Ferme le panel
- [ ] *"Vue semaine"* → Bascule sur la vue hebdomadaire
- [ ] *"Vue mois"* → Bascule sur la vue mensuelle
- [ ] *"Vue liste"* → Bascule sur la vue liste
- [ ] *"Semaine suivante"* → Navigation semaine suivante
- [ ] *"Semaine précédente"* → Navigation semaine précédente
- [ ] *"Mois suivant"* → Navigation mois suivant
- [ ] *"Mois précédent"* → Navigation mois précédent
- [ ] *"Aujourd'hui"* → Revient à la date du jour
- [ ] *"Filtrer par [tag]"* → Active le tag dans le sélecteur
- [ ] *"Ajouter le tag [tag]"* → Ajoute un tag en mode multi
- [ ] *"Retirer le tag [tag]"* → Retire un tag en mode multi
- [ ] *"Tous les tags"* → Sélectionne tous les tags
- [ ] *"Aucun filtre"* → Désactive tous les filtres
- [ ] *"Mes rendez-vous aujourd'hui"* → Vue liste filtrée sur le jour

---

## 🧪 Tests de validation V2.2

### TEST V2.2-01 — Activation du calendrier
```
🧪 Dans Paramètres → Messagerie → Calendrier,
   cocher "Activer le calendrier Outlook"
   (Outlook déjà connecté)

✅ Le panel calendrier apparaît dans l'interface
✅ Les catégories Outlook sont récupérées et affichées dans le sélecteur
✅ Le calendrier se charge avec les événements de la période configurée
✅ L'indicateur RDV du jour apparaît dans le header
❌ Message d'erreur si Outlook n'est pas connecté
   → Le message "Connectez d'abord Outlook" s'affiche
❌ Le calendrier n'apparaît pas après activation
```

### TEST V2.2-02 — Sélecteur de tags (mode simple)
```
🧪 Cliquer sur le tag "Projets 400kV" dans le sélecteur

✅ Seuls les RDV catégorisés "Projets 400kV" sont affichés
✅ Les autres événements disparaissent instantanément
✅ Le tag actif est mis en évidence (bordure, couleur)
✅ Le filtre est persisté après fermeture et réouverture du panel

🧪 Cliquer sur un autre tag "Réunions Direction"

✅ Le tag "Projets 400kV" se désactive
✅ Seuls les RDV "Réunions Direction" s'affichent
✅ Un seul tag peut être actif à la fois en mode simple
```

### TEST V2.2-03 — Sélecteur de tags (mode multiple)
```
🧪 Activer le mode multi-tags, sélectionner
   "Projets 400kV" ET "Réunions Direction"

✅ Les RDV des deux tags s'affichent simultanément
✅ Chaque événement affiche le badge de son tag (couleur distincte)
✅ Le badge compteur indique "2 tags sélectionnés"

🧪 Cliquer sur "Tout sélectionner"

✅ Tous les tags sont activés
✅ Tous les événements s'affichent

🧪 Cliquer sur "Tout désélectionner"

✅ Tous les tags sont désactivés
✅ Le calendrier est vide (aucun événement)
✅ Un message "Sélectionnez au moins un tag" est affiché
```

### TEST V2.2-04 — Vue liste des RDV
```
🧪 Tag "Projets 400kV" sélectionné, vue liste active

✅ Les RDV sont affichés en ordre chronologique
✅ Chaque RDV affiche : tag, date/heure, titre, lieu, durée, aperçu
✅ Les jours sont séparés par un en-tête de date
✅ Le jour courant est mis en évidence avec l'indicateur "Aujourd'hui"
✅ L'événement en cours est affiché en surbrillance
✅ Les événements passés sont grisés

🧪 Cliquer sur un événement dans la liste

✅ La modal de détail s'ouvre avec toutes les informations
✅ Le lien "Ouvrir dans Outlook" fonctionne (ouvre Outlook sur cet événement)
```

### TEST V2.2-05 — Vue semaine
```
🧪 Basculer sur la vue semaine, tag "Projets 400kV" actif

✅ La grille hebdomadaire s'affiche correctement
✅ Seuls les événements "Projets 400kV" sont visibles
✅ Les événements sont colorés avec la couleur du tag
✅ Les événements all-day apparaissent en haut de la grille
✅ Les événements multi-jours s'affichent en bandeau continu

🧪 Naviguer semaine suivante / précédente

✅ La navigation fonctionne
✅ Le filtre de tags reste actif après navigation
✅ Bouton "Aujourd'hui" ramène à la semaine courante
```

### TEST V2.2-06 — Vue mois
```
🧪 Basculer sur la vue mois, deux tags actifs simultanément

✅ La grille mensuelle s'affiche correctement
✅ Les événements des deux tags sont visibles avec leurs couleurs respectives
✅ Si un jour a plus de 3 événements → indicateur "+N autres" affiché
✅ Clic sur "+N autres" → affiche tous les événements du jour

🧪 Naviguer mois suivant / précédent

✅ La navigation fonctionne correctement
✅ Le filtre de tags reste actif
```

### TEST V2.2-07 — Bascule entre vues
```
🧪 Basculer entre Liste → Semaine → Mois plusieurs fois

✅ Chaque bascule est animée et fluide
✅ Le filtre de tags est conservé lors des bascules
✅ La position (date courante) est conservée lors des bascules
✅ La vue active est mémorisée après redémarrage

🧪 Utiliser les raccourcis clavier L / W / M

✅ Les bascules de vue fonctionnent par raccourci
✅ La vue change immédiatement sans rechargement
```

### TEST V2.2-08 — Indicateur RDV du jour
```
🧪 Journée avec 3 RDV "Projets 400kV" dans le calendrier Outlook

✅ Le badge dans le header affiche "3"
✅ Survol → tooltip listant les 3 RDV avec heure et titre
✅ Clic sur le badge → ouvre le calendrier en vue liste du jour

🧪 Changer le filtre de tags (passer à "Réunions Direction")
   qui a 1 RDV aujourd'hui

✅ Le badge passe de "3" à "1" instantanément
✅ Le tooltip se met à jour

🧪 Journée sans RDV pour le tag sélectionné

✅ Le badge n'est pas affiché (ou affiche 0 avec style discret)
```

### TEST V2.2-09 — Commandes vocales calendrier
```
🧪 Dire "Ouvrir le calendrier"

✅ Le panel calendrier s'affiche
✅ Confirmation visuelle

🧪 Dire "Filtrer par Projets 400kV"

✅ Le tag "Projets 400kV" est activé dans le sélecteur
✅ Le calendrier se filtre instantanément
✅ Toast de confirmation "Filtre actif : Projets 400kV"

🧪 Dire "Ajouter le tag Réunions Direction"

✅ Le tag s'ajoute à la sélection (mode multi activé automatiquement)
✅ Les deux tags sont maintenant actifs

🧪 Dire "Vue semaine"

✅ La vue bascule sur la semaine
✅ Le filtre actif est conservé

🧪 Dire "Mes rendez-vous aujourd'hui"

✅ La vue liste s'affiche filtrée sur le jour courant
✅ Seuls les RDV des tags actifs apparaissent

🧪 Dire "Semaine suivante" 3 fois

✅ Le calendrier avance de 3 semaines
✅ Chaque navigation est confirmée visuellement
```

### TEST V2.2-10 — Rafraîchissement et performances
```
🧪 Attendre l'intervalle de rafraîchissement automatique (15 min)

✅ Le calendrier se met à jour silencieusement (sans interruption)
✅ Un indicateur discret signale le dernier rafraîchissement
✅ Les nouveaux RDV apparaissent sans action manuelle

🧪 Couper internet puis rétablir la connexion

✅ Le calendrier affiche les données en cache pendant la coupure
✅ Un indicateur "Données en cache" est affiché
✅ Le calendrier se rafraîchit automatiquement au retour de la connexion

🧪 Charger un calendrier avec 500 événements sur 90 jours

✅ Le chargement initial s'effectue en moins de 5 secondes
✅ La navigation entre semaines/mois est fluide (< 300ms)
✅ Le filtrage par tags est instantané (< 100ms)
```

### TEST V2.2-11 — Régression V2.1
```
🧪 Rejouer les 10 tests V2.1 + 10 tests V2.0 + 10 tests V1.2
   + 10 tests V1.1 + 10 tests MVP

✅ Les 50 tests passent tous
✅ L'activation du calendrier n'affecte pas les panels Outlook/Gmail
✅ Les commandes vocales existantes sont toujours fonctionnelles
✅ Les performances D-ProjeT de base ne sont pas dégradées
❌ Une fonctionnalité d'une version précédente est cassée
```

---

## 📊 Récapitulatif V2.2

| Critère | Détail |
|---|---|
| **Phases couvertes** | Extension Phase 5 (Graph API Calendar) |
| **Tâches de développement** | 48 tâches |
| **Tests de validation** | 11 tests (+ 50 tests régression) |
| **Vue liste RDV** | ✅ Filtrée par tag(s) |
| **Vue calendrier** | ✅ Semaine + Mois |
| **Filtre tags** | ✅ Simple ET multiple |
| **Commandes vocales** | ✅ Navigation + filtrage vocal |
| **Indicateur header** | ✅ RDV du jour |
| **Drag & drop RDV** | ❌ Non (hors périmètre) |
| **Création RDV** | ❌ Non (hors périmètre) |
| **Calendrier Gmail** | ❌ Non (hors périmètre) |
| **Connexion internet** | ✅ Requise pour Outlook uniquement |

---

## ➡️ Intégration dans le plan global

Ce document s'insère entre V2.1 et V3.0 :

```
MVP 0.1 → V1.1 → V1.2 → V2.0 → V2.1 → V2.2 → V3.0
```

La V3.0 devra intégrer la **synchronisation des événements calendrier**
dans son plan de synchronisation global (tags calendrier ↔ étiquettes D-ProjeT).

---
*D-ProjeT — Version 2.2 — 23 février 2026*
