# 📋 C-PRojeTs — Cahier des charges complet v3.0

> Application de gestion de projets inspirée de Trello, enrichie d'une gestion de cartes imbriquées à 3 niveaux, d'une bibliothèque de modèles, d'une intégration optionnelle aux services de messagerie (Outlook et/ou Gmail), d'un calendrier Outlook filtrable par tags, et de commandes vocales avancées.

---

## 1. 🛠️ Stack technique recommandée

| Composant                         | Technologie                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| Framework Desktop + Web           | **Electron**                                                    |
| Interface utilisateur             | **React**                                                       |
| Styles                            | **TailwindCSS**                                                 |
| Drag & Drop                       | **react-beautiful-dnd**                                         |
| Commandes vocales                 | **Web Speech API**                                              |
| Base de données locale            | **SQLite** / **IndexedDB**                                      |
| Backend / Services                | **Node.js**                                                     |
| Calendrier visuel                 | **react-big-calendar** + **date-fns**                           |
| Intégration Outlook _(optionnel)_ | **Microsoft Graph API** (cloud) + **EWS** (on-premise fallback) |
| Intégration Gmail _(optionnel)_   | **Google Gmail API**                                            |

---

## 2. ⚠️ Compatibilité Outlook — Point critique

C-PRojeTs doit fonctionner avec **deux configurations Outlook** aux comportements distincts :

### 2.1 Matrice de compatibilité

| Configuration                          | Description                                                          | API utilisée                | Fonctionnalités              |
| -------------------------------------- | -------------------------------------------------------------------- | --------------------------- | ---------------------------- |
| **Microsoft 365 (Outlook 365)**        | Boîte mail hébergée dans Exchange Online (cloud Microsoft)           | Microsoft Graph API         | ✅ Complètes                 |
| **Outlook 2024 — compte cloud**        | Licence perpétuelle + compte Microsoft 365 associé (Exchange Online) | Microsoft Graph API         | ✅ Complètes                 |
| **Outlook 2024 — Exchange on-premise** | Licence perpétuelle + serveur Exchange interne d'entreprise          | EWS (Exchange Web Services) | ⚠️ Partielles (voir tableau) |

### 2.2 Fonctionnalités selon la configuration

| Fonctionnalité               | Microsoft 365 | Outlook 2024 cloud | Outlook 2024 on-premise |
| ---------------------------- | ------------- | ------------------ | ----------------------- |
| Lecture emails               | ✅            | ✅                 | ✅ via EWS              |
| Déplacement dossiers         | ✅            | ✅                 | ✅ via EWS              |
| Catégories Outlook           | ✅            | ✅                 | ✅ via EWS              |
| Envoi / Réponse              | ✅            | ✅                 | ✅ via EWS              |
| Calendrier (lecture)         | ✅            | ✅                 | ✅ via EWS              |
| Filtrage calendrier par tags | ✅            | ✅                 | ✅ via EWS              |
| Synchronisation tags         | ✅            | ✅                 | ⚠️ Limitée              |
| OAuth 2.0 moderne            | ✅            | ✅                 | ⚠️ NTLM/Basic Auth      |
| Notifications temps réel     | ✅ webhooks   | ✅ webhooks        | ❌ Polling uniquement   |

### 2.3 Détection automatique de la configuration

Au moment de la connexion Outlook, C-PRojeTs détecte automatiquement la configuration :

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
C-PRojeTs/
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

## 4. 🟢 C-PRojeTs — Version de base (sans messagerie)

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

| Élément            | Peut être déplacé vers                                   |
| ------------------ | -------------------------------------------------------- |
| **Carte Projet**   | N'importe quelle colonne du tableau                      |
| **Catégorie**      | Au sein de la même carte OU vers une autre carte projet  |
| **Sous-catégorie** | Au sein de la même catégorie OU vers une autre catégorie |

### 4.3 Comportement visuel par niveau

| Niveau         | Style visuel                                              |
| -------------- | --------------------------------------------------------- |
| Carte Projet   | Grande carte avec header coloré, clic pour ouvrir/réduire |
| Catégorie      | Carte moyenne avec son propre header coloré               |
| Sous-catégorie | Petite carte à l'intérieur de la catégorie                |

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

### 4.6 🎙️ Commandes vocales — C-PRojeTs de base

#### Activation

| Commande                       | Action                              |
| ------------------------------ | ----------------------------------- |
| _"Écoute"_ / _"Hey C-PRojeTs"_ | Active l'écoute vocale              |
| _"Stop"_ / _"Pause"_           | Désactive l'écoute                  |
| _"Aide"_                       | Liste les commandes disponibles     |
| _"Répète"_                     | Répète la dernière action effectuée |
| _"Annuler"_                    | Annule la dernière action           |

#### Gestion des cartes et navigation

| Commande                          | Action                                  |
| --------------------------------- | --------------------------------------- |
| _"Créer une carte [nom]"_         | Crée une nouvelle carte projet          |
| _"Déplacer carte vers [colonne]"_ | Déplace la carte sélectionnée           |
| _"Taguer [priorité]"_             | Applique une étiquette                  |
| _"Créer catégorie [nom]"_         | Crée une catégorie dans la carte active |
| _"Créer sous-catégorie [nom]"_    | Crée une sous-catégorie                 |
| _"Ouvrir carte [nom]"_            | Ouvre une carte spécifique              |
| _"Fermer carte"_                  | Ferme la carte ouverte                  |
| _"Archiver carte"_                | Archive la carte sélectionnée           |
| _"Assigner à [nom]"_              | Assigne la carte à un membre            |
| _"Ajouter commentaire [texte]"_   | Ajoute un commentaire vocal             |
| _"Date d'échéance [date]"_        | Définit une deadline                    |
| _"Afficher tableau [nom]"_        | Ouvre un tableau spécifique             |
| _"Mode focus"_                    | Masque tout sauf la carte active        |

#### Bibliothèque

| Commande                      | Action                                       |
| ----------------------------- | -------------------------------------------- |
| _"Ouvrir la bibliothèque"_    | Affiche le panel bibliothèque                |
| _"Sauvegarder comme modèle"_  | Envoie l'élément sélectionné en bibliothèque |
| _"Utiliser le modèle [nom]"_  | Colle le modèle dans l'emplacement actif     |
| _"Supprimer le modèle [nom]"_ | Supprime un modèle de la bibliothèque        |

---

## 5. 📨 Module Messagerie — Activation optionnelle

> Le module messagerie est **désactivé par défaut**. L'utilisateur peut activer un ou plusieurs services via les **paramètres de C-PRojeTs** (boutons à cocher).

### 5.1 Activation des services

```
⚙️ Paramètres C-PRojeTs → Intégrations Messagerie
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

| Fonctionnalité           | Outlook 365 / cloud | Outlook 2024 on-premise | Gmail             |
| ------------------------ | ------------------- | ----------------------- | ----------------- |
| API utilisée             | Microsoft Graph API | EWS                     | Google Gmail API  |
| Authentification         | OAuth 2.0           | NTLM / Basic Auth       | OAuth 2.0 Google  |
| Lecture emails           | ✅                  | ✅                      | ✅                |
| Organisation             | Dossiers            | Dossiers                | Libellés (Labels) |
| Tags / Catégories        | Catégories Outlook  | Catégories Outlook      | Libellés Gmail    |
| Drag & drop → C-PRojeTs  | ✅                  | ✅                      | ✅                |
| Copier/Coller vocal      | ✅                  | ✅                      | ✅                |
| Envoi depuis C-PRojeTs   | ✅                  | ✅                      | ✅                |
| Pièces jointes           | ✅                  | ✅                      | ✅                |
| Synchro tags ↔ C-PRojeTs | ✅ Complète         | ⚠️ Limitée              | ✅ Complète       |
| Calendrier filtrable     | ✅                  | ✅                      | ❌                |
| Notifications temps réel | ✅ webhooks         | ❌ Polling              | ✅                |

---

### 5.3 Lien email → C-PRojeTs (commun aux deux services)

| Action                                  | Résultat dans C-PRojeTs               |
| --------------------------------------- | ------------------------------------- |
| Email glissé sur une **Carte Projet**   | Devient une catégorie automatiquement |
| Email glissé sur une **Catégorie**      | Devient une sous-catégorie            |
| Email glissé sur une **Sous-catégorie** | S'attache comme note/pièce jointe     |

### 5.4 Principe Copier / Coller vocal

```
Étape 1 — Dans le panel messagerie (Outlook ou Gmail)
→ "Copie email dans C-PRojeTs"
→ L'email est mis en mémoire tampon
  (titre, expéditeur, date, contenu, pièces jointes)

Étape 2 — Bascule vers C-PRojeTs
→ "Ouvrir C-PRojeTs"
→ L'utilisateur navigue vers la carte ou catégorie souhaitée

Étape 3 — Dans C-PRojeTs
→ "Colle l'email ici"
→ L'email est collé dans l'élément actif
```

---

### 5.5 🎙️ Commandes vocales — Module Messagerie

> Ces commandes ne sont disponibles que si au moins un service de messagerie est activé.

#### Navigation messagerie

| Commande                | Action                            |
| ----------------------- | --------------------------------- |
| _"Ouvrir Outlook"_      | Bascule vers le panel Outlook     |
| _"Ouvrir Gmail"_        | Bascule vers le panel Gmail       |
| _"Ouvrir C-PRojeTs"_    | Bascule vers le tableau C-PRojeTs |
| _"Basculer messagerie"_ | Alterne entre Outlook et Gmail    |

#### Gestion des emails

| Commande                 | Action                      |
| ------------------------ | --------------------------- |
| _"Email suivant"_        | Passe à l'email suivant     |
| _"Email précédent"_      | Revient à l'email précédent |
| _"Ouvre l'email"_        | Ouvre l'email sélectionné   |
| _"Ferme l'email"_        | Ferme l'email ouvert        |
| _"Répondre"_             | Ouvre la fenêtre de réponse |
| _"Transférer à [nom]"_   | Transfère l'email           |
| _"Marquer comme lu"_     | Marque l'email comme lu     |
| _"Marquer comme non lu"_ | Marque l'email comme non lu |
| _"Supprimer l'email"_    | Supprime l'email            |

#### Commandes spécifiques Outlook

| Commande                        | Action                                  |
| ------------------------------- | --------------------------------------- |
| _"Déplacer dans [dossier]"_     | Déplace l'email dans le dossier Outlook |
| _"Taguer [catégorie]"_          | Applique une catégorie Outlook          |
| _"Afficher emails de [projet]"_ | Filtre les emails liés au projet        |

#### Commandes spécifiques Gmail

| Commande                        | Action                           |
| ------------------------------- | -------------------------------- |
| _"Ajouter le libellé [nom]"_    | Applique un libellé Gmail        |
| _"Retirer le libellé [nom]"_    | Retire un libellé Gmail          |
| _"Archiver"_                    | Archive l'email Gmail            |
| _"Afficher emails de [projet]"_ | Filtre les emails liés au projet |

#### Liaison messagerie → C-PRojeTs

| Commande                          | Action                                          |
| --------------------------------- | ----------------------------------------------- |
| _"Crée une carte"_                | Crée une carte C-PRojeTs depuis l'email ouvert  |
| _"Copie email dans C-PRojeTs"_    | Copie l'email en mémoire tampon                 |
| _"Colle l'email ici"_             | Colle l'email dans l'élément actif de C-PRojeTs |
| _"Lier à la carte [nom]"_         | Associe l'email à une carte existante           |
| _"Créer sous-tâche depuis email"_ | Crée une sous-catégorie dans la carte active    |

---

## 6. 📅 Module Calendrier Outlook — Activation optionnelle

> Le module calendrier est **désactivé par défaut** et nécessite qu'Outlook soit préalablement connecté.
> Disponible pour **Microsoft 365**, **Outlook 2024 cloud** et **Outlook 2024 on-premise**.

### 6.1 Activation

```
⚙️ Paramètres C-PRojeTs → Intégrations Messagerie → Calendrier
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

| Vue            | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| 📋 **Liste**   | Événements filtrés en ordre chronologique, groupés par jour        |
| 📅 **Semaine** | Grille 7 colonnes avec plages horaires, événements colorés par tag |
| 🗓️ **Mois**    | Grille mensuelle avec badges colorés par tag                       |

### 6.4 🎙️ Commandes vocales — Calendrier

| Commande                                       | Action                        |
| ---------------------------------------------- | ----------------------------- |
| _"Ouvrir le calendrier"_                       | Affiche le panel calendrier   |
| _"Vue semaine"_ / _"Vue mois"_ / _"Vue liste"_ | Bascule de vue                |
| _"Semaine suivante"_ / _"Semaine précédente"_  | Navigation                    |
| _"Mois suivant"_ / _"Mois précédent"_          | Navigation                    |
| _"Aujourd'hui"_                                | Revient à la date du jour     |
| _"Filtrer par [tag]"_                          | Active un tag (mode simple)   |
| _"Ajouter le tag [tag]"_                       | Ajoute un tag (mode multiple) |
| _"Retirer le tag [tag]"_                       | Retire un tag                 |
| _"Tous les tags"_                              | Sélectionne tous les tags     |
| _"Aucun filtre"_                               | Désactive tous les filtres    |
| _"Mes rendez-vous aujourd'hui"_                | Vue liste filtrée sur le jour |

---

## 7. 🚀 Plan de développement (Phases)

| Phase        | Contenu                                                                  | Priorité    |
| ------------ | ------------------------------------------------------------------------ | ----------- |
| **Phase 1**  | Structure de base — tableau, colonnes, cartes niveau 1                   | 🔴 Critique |
| **Phase 2**  | Catégories et sous-catégories (niveaux 2 et 3) avec drag & drop imbriqué | 🔴 Critique |
| **Phase 3**  | Bibliothèque de modèles avec drag & drop bidirectionnel                  | 🟠 Haute    |
| **Phase 4**  | Commandes vocales C-PRojeTs de base                                      | 🟠 Haute    |
| **Phase 5**  | Module Messagerie — Intégration Outlook (Graph API + EWS fallback)       | 🟡 Moyenne  |
| **Phase 6**  | Module Messagerie — Intégration Gmail                                    | 🟡 Moyenne  |
| **Phase 7**  | Drag & drop emails → cartes/catégories/sous-catégories                   | 🟡 Moyenne  |
| **Phase 8**  | Commandes vocales messagerie                                             | 🟡 Moyenne  |
| **Phase 8b** | Module Calendrier Outlook avec filtrage par tags                         | 🟡 Moyenne  |
| **Phase 9**  | Synchronisation tags messagerie + calendrier ↔ C-PRojeTs                 | 🟢 Basse    |
| **Phase 10** | Finitions UI, performances, tests                                        | 🟢 Basse    |

---

## 8. 📌 Récapitulatif des fonctionnalités

### C-PRojeTs — Base (toujours disponible)

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
- ✅ Copier/Coller vocal entre messagerie et C-PRojeTs
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

_Document généré le 23 février 2026 — Version 3.0_
