# 📋 D-ProjeT — Cahier des charges complet v3.0

> Application de gestion de projets inspirée de Trello, enrichie d'une gestion de cartes imbriquées à 3 niveaux, d'une bibliothèque de modèles, d'une intégration optionnelle aux services de messagerie (Outlook et/ou Gmail), d'un calendrier Outlook filtrable par tags, et de commandes vocales avancées.

---

## 1. 🛠️ Stack technique recommandée

| Composant | Technologie |
|---|---|
| Framework Desktop + Web | **Electron** |
| Interface utilisateur | **React** |
| Styles | **TailwindCSS** |
| Drag & Drop | **react-beautiful-dnd** |
| Commandes vocales | **Web Speech API** |
| Base de données locale | **SQLite** / **IndexedDB** |
| Backend / Services | **Node.js** |
| Calendrier visuel | **react-big-calendar** + **date-fns** |
| Intégration Outlook *(optionnel)* | **Microsoft Graph API** (cloud) + **EWS** (on-premise fallback) |
| Intégration Gmail *(optionnel)* | **Google Gmail API** |

---

## 2. ⚠️ Compatibilité Outlook — Point critique

D-ProjeT doit fonctionner avec **deux configurations Outlook** aux comportements distincts :

### 2.1 Matrice de compatibilité

| Configuration | Description | API utilisée | Fonctionnalités |
|---|---|---|---|
| **Microsoft 365 (Outlook 365)** | Boîte mail hébergée dans Exchange Online (cloud Microsoft) | Microsoft Graph API | ✅ Complètes |
| **Outlook 2024 — compte cloud** | Licence perpétuelle + compte Microsoft 365 associé (Exchange Online) | Microsoft Graph API | ✅ Complètes |
| **Outlook 2024 — Exchange on-premise** | Licence perpétuelle + serveur Exchange interne d'entreprise | EWS (Exchange Web Services) | ⚠️ Partielles (voir tableau) |

### 2.2 Fonctionnalités selon la configuration

| Fonctionnalité | Microsoft 365 | Outlook 2024 cloud | Outlook 2024 on-premise |
|---|---|---|---|
| Lecture emails | ✅ | ✅ | ✅ via EWS |
| Déplacement dossiers | ✅ | ✅ | ✅ via EWS |
| Catégories Outlook | ✅ | ✅ | ✅ via EWS |
| Envoi / Réponse | ✅ | ✅ | ✅ via EWS |
| Calendrier (lecture) | ✅ | ✅ | ✅ via EWS |
| Filtrage calendrier par tags | ✅ | ✅ | ✅ via EWS |
| Synchronisation tags | ✅ | ✅ | ⚠️ Limitée |
| OAuth 2.0 moderne | ✅ | ✅ | ⚠️ NTLM/Basic Auth |
| Notifications temps réel | ✅ webhooks | ✅ webhooks | ❌ Polling uniquement |

### 2.3 Détection automatique de la configuration

Au moment de la connexion Outlook, D-ProjeT détecte automatiquement la configuration :

```
Connexion Outlook → Tentative OAuth 2.0 + Microsoft Graph API
│
├── ✅ Succès → Mode "Microsoft Graph API" (cloud)
│   Toutes les fonctionnalités disponibles
│
└── ❌ Échec → Proposition du mode "Exchange on-premise (EWS)"
    → Saisie manuelle : URL serveur Exchange, domaine, identifiants
    → Mode "EWS" activé avec fonctionnalités adaptées
    → Indicateur visuel "Mode Exchange on-premise" dans l'interface
```

### 2.4 Librairies requises selon le mode

```json
// Mode Microsoft Graph API (cloud — Microsoft 365 et Outlook 2024 cloud)
"@azure/msal-node":                    "^2.6.0",
"@microsoft/microsoft-graph-client":   "^3.0.7",

// Mode EWS — fallback Exchange on-premise (Outlook 2024 on-premise uniquement)
"ews-javascript-api":                  "^0.11.1"
```

> ⚠️ **Note EWS** : Microsoft a déprécié EWS pour Exchange Online depuis octobre 2026.
> EWS reste cependant la seule option viable pour les déploiements Exchange Server on-premise.
> Pour les comptes cloud (Microsoft 365), **Graph API est obligatoire**.

---

## 3. 🏗️ Architecture du projet

```
D-ProjeT/
├── src/
│   ├── components/
│   │   ├── Board/              → Tableau principal
│   │   ├── Card/               → Cartes de projet (niveau 1)
│   │   ├── Category/           → Catégories (niveau 2)
│   │   ├── SubCategory/        → Sous-catégories (niveau 3)
│   │   ├── Library/            → Bibliothèque de modèles
│   │   ├── VoiceControl/       → Commandes vocales
│   │   ├── Calendar/           → Module calendrier (optionnel)
│   │   │   ├── CalendarPanel.jsx
│   │   │   ├── CalendarTagSelector.jsx
│   │   │   ├── CalendarListView.jsx
│   │   │   ├── CalendarWeekView.jsx
│   │   │   └── CalendarMonthView.jsx
│   │   └── Messaging/          → Module messagerie (optionnel)
│   │       ├── OutlookPanel/   → Panel Outlook
│   │       └── GmailPanel/     → Panel Gmail
│   ├── services/
│   │   ├── voice.js            → Reconnaissance vocale
│   │   ├── database.js         → Gestion des données
│   │   ├── sync.js             → Synchronisation tags
│   │   └── messaging/          → Services messagerie (optionnels)
│   │       ├── outlook.js      → Intégration Outlook (Graph API)
│   │       ├── outlookEWS.js   → Intégration Outlook (EWS fallback)
│   │       ├── outlookCalendar.js → Calendrier Outlook
│   │       └── gmail.js        → Intégration Gmail
│   └── App.js
```

---

## 4. 🟢 D-ProjeT — Version de base (sans messagerie)

### 4.1 Structure imbriquée à 3 niveaux

```
TABLEAU (Board)
│
├── 📋 CARTE PROJET (niveau 1)
│   ├── Drag & drop entre colonnes du tableau
│   │
│   ├── 📁 CATEGORIE (niveau 2)
│   │   ├── Drag & drop au sein de la même carte projet
│   │   ├── Drag & drop vers une autre carte projet
│   │   │
│   │   ├── 📄 SOUS-CATEGORIE (niveau 3)
│   │   │   ├── Drag & drop au sein de la même catégorie
│   │   │   └── Drag & drop vers une autre catégorie
│   │   └── 📄 SOUS-CATEGORIE ...
│   │
│   └── 📁 CATEGORIE ...
│
└── 📋 CARTE PROJET ...
```

### 4.2 Règles de déplacement

| Élément | Peut être déplacé vers |
|---|---|
| **Carte Projet** | N'importe quelle colonne du tableau |
| **Catégorie** | Au sein de la même carte OU vers une autre carte projet |
| **Sous-catégorie** | Au sein de la même catégorie OU vers une autre catégorie |

### 4.3 Comportement visuel par niveau

| Niveau | Style visuel |
|---|---|
| Carte Projet | Grande carte avec header coloré, clic pour ouvrir/réduire |
| Catégorie | Carte moyenne avec son propre header coloré |
| Sous-catégorie | Petite carte à l'intérieur de la catégorie |

Chaque niveau dispose de :
- Sa propre **couleur/style** distinctif
- Une **icône de drag** (⠿) visible au survol
- Un **badge** indiquant le nombre d'éléments enfants
- Un bouton **réduire/développer** (collapse)
- La possibilité d'ajouter des **étiquettes de priorité** (urgent, normal, en attente…)
- Un champ **date d'échéance**
- Un champ **assignation membre**
- Un champ **commentaires**
- Des **pièces jointes** (fichiers locaux)

---

### 4.4 🏗️ Exemple concret — Projet Poste Électrique 400kV

```
TABLEAU — Études et Réalisation Poste 400kV
│
├── 📋 POSTE DE TRANSFORMATION — SAINT-ÉTIENNE-DU-ROUVRAY
│   │
│   ├── 📁 Études Génie Civil
│   │   ├── 📄 Terrassements généraux
│   │   ├── 📄 Fondations bâtiment de commande
│   │   ├── 📄 Dallage et voiries internes
│   │   ├── 📄 Clôture et portails d'accès
│   │   └── 📄 Réseaux enterrés (eaux pluviales, câbles)
│   │
│   ├── 📁 Études Électriques HTB
│   │   ├── 📄 Schémas unifilaires 400kV
│   │   ├── 📄 Plan de câblage jeux de barres
│   │   ├── 📄 Calculs de court-circuit
│   │   ├── 📄 Études de protection et automatismes
│   │   └── 📄 Mise à la terre du poste
│   │
│   ├── 📁 Réalisation Génie Civil
│   │   ├── 📄 Préparation de chantier
│   │   ├── 📄 Travaux de terrassement
│   │   ├── 📄 Coulage des fondations
│   │   ├── 📄 Construction bâtiment de commande
│   │   └── 📄 Réception travaux GC
│   │
│   ├── 📁 Réalisation Électrique HTB
│   │   ├── 📄 Pose des équipements (transformateurs, disjoncteurs)
│   │   ├── 📄 Câblage jeux de barres 400kV
│   │   ├── 📄 Installation des protections
│   │   ├── 📄 Essais et mise en service
│   │   └── 📄 Réception électrique
│   │
│   └── 📁 Suivi administratif et contractuel
│       ├── 📄 Marché et avenants
│       ├── 📄 Situations de travaux
│       ├── 📄 PV de réunions de chantier
│       └── 📄 DOE — Dossier Ouvrages Exécutés
│
├── 📋 POSTE DE TRANSFORMATION — BORDEAUX-NORD (RENOVATION)
│   ├── 📁 Diagnostic et état des lieux
│   ├── 📁 Études de rénovation GC
│   ├── 📁 Études de rénovation Électrique
│   └── 📁 Planning et coordination
│
└── 📋 APPELS D'OFFRES EN COURS
    ├── 📁 Poste 400kV — Lyon-Est (Création)
    └── 📁 Poste 400kV — Marseille-Sud (Rénovation)
```

---

### 4.5 📚 Bibliothèque de modèles

#### Fonctionnement drag & drop vers la bibliothèque

```
1. L'utilisateur sélectionne un élément (carte, catégorie, sous-catégorie)
2. Il le glisse vers le panel "Bibliothèque"
3. L'élément est sauvegardé comme modèle avec son contenu complet
4. Il peut ensuite être glissé depuis la bibliothèque vers n'importe quel projet
```

#### Fonctionnement drag & drop depuis la bibliothèque

```
1. L'utilisateur ouvre la bibliothèque
2. Il glisse un modèle vers :
   - Le tableau        → crée une nouvelle Carte Projet
   - Une Carte Projet  → crée une nouvelle Catégorie
   - Une Catégorie     → crée une nouvelle Sous-catégorie
3. Le contenu est dupliqué (le modèle original reste intact)
```

---

### 4.6 🎙️ Commandes vocales — D-ProjeT de base

#### Activation

| Commande | Action |
|---|---|
| *"Écoute"* / *"Hey D-ProjeT"* | Active l'écoute vocale |
| *"Stop"* / *"Pause"* | Désactive l'écoute |
| *"Aide"* | Liste les commandes disponibles |
| *"Répète"* | Répète la dernière action effectuée |
| *"Annuler"* | Annule la dernière action |

#### Gestion des cartes et navigation

| Commande | Action |
|---|---|
| *"Créer une carte [nom]"* | Crée une nouvelle carte projet |
| *"Déplacer carte vers [colonne]"* | Déplace la carte sélectionnée |
| *"Taguer [priorité]"* | Applique une étiquette |
| *"Créer catégorie [nom]"* | Crée une catégorie dans la carte active |
| *"Créer sous-catégorie [nom]"* | Crée une sous-catégorie |
| *"Ouvrir carte [nom]"* | Ouvre une carte spécifique |
| *"Fermer carte"* | Ferme la carte ouverte |
| *"Archiver carte"* | Archive la carte sélectionnée |
| *"Assigner à [nom]"* | Assigne la carte à un membre |
| *"Ajouter commentaire [texte]"* | Ajoute un commentaire vocal |
| *"Date d'échéance [date]"* | Définit une deadline |
| *"Afficher tableau [nom]"* | Ouvre un tableau spécifique |
| *"Mode focus"* | Masque tout sauf la carte active |

#### Bibliothèque

| Commande | Action |
|---|---|
| *"Ouvrir la bibliothèque"* | Affiche le panel bibliothèque |
| *"Sauvegarder comme modèle"* | Envoie l'élément sélectionné en bibliothèque |
| *"Utiliser le modèle [nom]"* | Colle le modèle dans l'emplacement actif |
| *"Supprimer le modèle [nom]"* | Supprime un modèle de la bibliothèque |

---

## 5. 📨 Module Messagerie — Activation optionnelle

> Le module messagerie est **désactivé par défaut**. L'utilisateur peut activer un ou plusieurs services via les **paramètres de D-ProjeT** (boutons à cocher).

### 5.1 Activation des services

```
⚙️ Paramètres D-ProjeT → Intégrations Messagerie
│
├── ☐ Activer Microsoft Outlook
│     → Détection automatique : Microsoft Graph API (cloud) ou EWS (on-premise)
│     → Activation du panel Outlook dans l'interface
│     → Activation du module calendrier (optionnel, bouton séparé)
│
└── ☐ Activer Gmail
      → Connexion compte Google (OAuth 2.0)
      → Activation du panel Gmail dans l'interface
```

Les deux services peuvent être activés **simultanément**.

---

### 5.2 Comparaison des deux intégrations

| Fonctionnalité | Outlook 365 / cloud | Outlook 2024 on-premise | Gmail |
|---|---|---|---|
| API utilisée | Microsoft Graph API | EWS | Google Gmail API |
| Authentification | OAuth 2.0 | NTLM / Basic Auth | OAuth 2.0 Google |
| Lecture emails | ✅ | ✅ | ✅ |
| Organisation | Dossiers | Dossiers | Libellés (Labels) |
| Tags / Catégories | Catégories Outlook | Catégories Outlook | Libellés Gmail |
| Drag & drop → D-ProjeT | ✅ | ✅ | ✅ |
| Copier/Coller vocal | ✅ | ✅ | ✅ |
| Envoi depuis D-ProjeT | ✅ | ✅ | ✅ |
| Pièces jointes | ✅ | ✅ | ✅ |
| Synchro tags ↔ D-ProjeT | ✅ Complète | ⚠️ Limitée | ✅ Complète |
| Calendrier filtrable | ✅ | ✅ | ❌ |
| Notifications temps réel | ✅ webhooks | ❌ Polling | ✅ |

---

### 5.3 Lien email → D-ProjeT (commun aux deux services)

| Action | Résultat dans D-ProjeT |
|---|---|
| Email glissé sur une **Carte Projet** | Devient une catégorie automatiquement |
| Email glissé sur une **Catégorie** | Devient une sous-catégorie |
| Email glissé sur une **Sous-catégorie** | S'attache comme note/pièce jointe |

### 5.4 Principe Copier / Coller vocal

```
Étape 1 — Dans le panel messagerie (Outlook ou Gmail)
→ "Copie email dans D-ProjeT"
→ L'email est mis en mémoire tampon
  (titre, expéditeur, date, contenu, pièces jointes)

Étape 2 — Bascule vers D-ProjeT
→ "Ouvrir D-ProjeT"
→ L'utilisateur navigue vers la carte ou catégorie souhaitée

Étape 3 — Dans D-ProjeT
→ "Colle l'email ici"
→ L'email est collé dans l'élément actif
```

---

### 5.5 🎙️ Commandes vocales — Module Messagerie

> Ces commandes ne sont disponibles que si au moins un service de messagerie est activé.

#### Navigation messagerie

| Commande | Action |
|---|---|
| *"Ouvrir Outlook"* | Bascule vers le panel Outlook |
| *"Ouvrir Gmail"* | Bascule vers le panel Gmail |
| *"Ouvrir D-ProjeT"* | Bascule vers le tableau D-ProjeT |
| *"Basculer messagerie"* | Alterne entre Outlook et Gmail |

#### Gestion des emails

| Commande | Action |
|---|---|
| *"Email suivant"* | Passe à l'email suivant |
| *"Email précédent"* | Revient à l'email précédent |
| *"Ouvre l'email"* | Ouvre l'email sélectionné |
| *"Ferme l'email"* | Ferme l'email ouvert |
| *"Répondre"* | Ouvre la fenêtre de réponse |
| *"Transférer à [nom]"* | Transfère l'email |
| *"Marquer comme lu"* | Marque l'email comme lu |
| *"Marquer comme non lu"* | Marque l'email comme non lu |
| *"Supprimer l'email"* | Supprime l'email |

#### Commandes spécifiques Outlook

| Commande | Action |
|---|---|
| *"Déplacer dans [dossier]"* | Déplace l'email dans le dossier Outlook |
| *"Taguer [catégorie]"* | Applique une catégorie Outlook |
| *"Afficher emails de [projet]"* | Filtre les emails liés au projet |

#### Commandes spécifiques Gmail

| Commande | Action |
|---|---|
| *"Ajouter le libellé [nom]"* | Applique un libellé Gmail |
| *"Retirer le libellé [nom]"* | Retire un libellé Gmail |
| *"Archiver"* | Archive l'email Gmail |
| *"Afficher emails de [projet]"* | Filtre les emails liés au projet |

#### Liaison messagerie → D-ProjeT

| Commande | Action |
|---|---|
| *"Crée une carte"* | Crée une carte D-ProjeT depuis l'email ouvert |
| *"Copie email dans D-ProjeT"* | Copie l'email en mémoire tampon |
| *"Colle l'email ici"* | Colle l'email dans l'élément actif de D-ProjeT |
| *"Lier à la carte [nom]"* | Associe l'email à une carte existante |
| *"Créer sous-tâche depuis email"* | Crée une sous-catégorie dans la carte active |

---

## 6. 📅 Module Calendrier Outlook — Activation optionnelle

> Le module calendrier est **désactivé par défaut** et nécessite qu'Outlook soit préalablement connecté.
> Disponible pour **Microsoft 365**, **Outlook 2024 cloud** et **Outlook 2024 on-premise**.

### 6.1 Activation

```
⚙️ Paramètres D-ProjeT → Intégrations Messagerie → Calendrier
│
└── ☐ Activer le calendrier Outlook
      → Requiert : Outlook connecté (Graph API ou EWS)
      → Permission supplémentaire : Calendars.Read
      → Activation du panel calendrier dans l'interface
```

### 6.2 Fonctionnement du sélecteur de tags

Le **sélecteur de tags** est le cœur de la fonctionnalité calendrier.
Il filtre les rendez-vous selon les catégories Outlook associées.

```
Mode simple  → Un seul tag actif à la fois
               Clic sur un tag → active et désactive le précédent

Mode multiple → Plusieurs tags simultanément
                Bascule via bouton "Mode multi-tags" ou Ctrl + clic
                Bouton "Tout sélectionner" / "Tout désélectionner"

Option "Tous les tags" → Affiche tous les événements sans filtre
Barre de recherche    → Filtre rapide dans la liste des tags
```

### 6.3 Vues disponibles

| Vue | Description |
|---|---|
| 📋 **Liste** | Événements filtrés en ordre chronologique, groupés par jour |
| 📅 **Semaine** | Grille 7 colonnes avec plages horaires, événements colorés par tag |
| 🗓️ **Mois** | Grille mensuelle avec badges colorés par tag |

### 6.4 🎙️ Commandes vocales — Calendrier

| Commande | Action |
|---|---|
| *"Ouvrir le calendrier"* | Affiche le panel calendrier |
| *"Vue semaine"* / *"Vue mois"* / *"Vue liste"* | Bascule de vue |
| *"Semaine suivante"* / *"Semaine précédente"* | Navigation |
| *"Mois suivant"* / *"Mois précédent"* | Navigation |
| *"Aujourd'hui"* | Revient à la date du jour |
| *"Filtrer par [tag]"* | Active un tag (mode simple) |
| *"Ajouter le tag [tag]"* | Ajoute un tag (mode multiple) |
| *"Retirer le tag [tag]"* | Retire un tag |
| *"Tous les tags"* | Sélectionne tous les tags |
| *"Aucun filtre"* | Désactive tous les filtres |
| *"Mes rendez-vous aujourd'hui"* | Vue liste filtrée sur le jour |

---

## 7. 🚀 Plan de développement (Phases)

| Phase | Contenu | Priorité |
|---|---|---|
| **Phase 1** | Structure de base — tableau, colonnes, cartes niveau 1 | 🔴 Critique |
| **Phase 2** | Catégories et sous-catégories (niveaux 2 et 3) avec drag & drop imbriqué | 🔴 Critique |
| **Phase 3** | Bibliothèque de modèles avec drag & drop bidirectionnel | 🟠 Haute |
| **Phase 4** | Commandes vocales D-ProjeT de base | 🟠 Haute |
| **Phase 5** | Module Messagerie — Intégration Outlook (Graph API + EWS fallback) | 🟡 Moyenne |
| **Phase 6** | Module Messagerie — Intégration Gmail | 🟡 Moyenne |
| **Phase 7** | Drag & drop emails → cartes/catégories/sous-catégories | 🟡 Moyenne |
| **Phase 8** | Commandes vocales messagerie | 🟡 Moyenne |
| **Phase 8b** | Module Calendrier Outlook avec filtrage par tags | 🟡 Moyenne |
| **Phase 9** | Synchronisation tags messagerie + calendrier ↔ D-ProjeT | 🟢 Basse |
| **Phase 10** | Finitions UI, performances, tests | 🟢 Basse |

---

## 8. 📌 Récapitulatif des fonctionnalités

### D-ProjeT — Base (toujours disponible)
- ✅ Tableau de bord style Trello avec colonnes personnalisables
- ✅ Cartes imbriquées à 3 niveaux (Projet → Catégorie → Sous-catégorie)
- ✅ Drag & drop à chaque niveau (intra et inter éléments)
- ✅ Bibliothèque de modèles avec drag & drop bidirectionnel
- ✅ Commandes vocales de base (navigation, création, déplacement, tags)
- ✅ Étiquettes de priorité, dates d'échéance, assignations, commentaires
- ✅ Pièces jointes (fichiers locaux)
- ✅ Disponible Desktop (Electron) et Web (React)

### Module Messagerie — Optionnel (activation par bouton)
- ☐ **Outlook 365 / cloud** : Graph API, fonctionnalités complètes
- ☐ **Outlook 2024 on-premise** : EWS, fonctionnalités adaptées
- ☐ **Gmail** : Google API, libellés multiples
- ✅ Les deux services peuvent être actifs simultanément
- ✅ Copier/Coller vocal entre messagerie et D-ProjeT
- ✅ Création de cartes/catégories/sous-catégories depuis un email

### Module Calendrier Outlook — Optionnel (activation par bouton)
- ☐ Requiert Outlook connecté (Graph API ou EWS)
- ✅ Vue liste des RDV filtrés par tag(s)
- ✅ Vue calendrier visuelle (semaine + mois)
- ✅ Sélecteur de tags simple et multiple
- ✅ Indicateur RDV du jour dans le header
- ✅ Commandes vocales de navigation et filtrage
- ✅ Compatible Microsoft 365, Outlook 2024 cloud et on-premise

---

*Document généré le 23 février 2026 — Version 3.0*
