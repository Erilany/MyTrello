# 📋 C-PRojeTs — Cahier des charges complet v3.0

> Application de gestion de projets inspirée de Trello, enrichie d'une gestion de cartes imbriquées à 3 niveaux, d'une bibliothèque de modèles, d'une intégration optionnelle à Outlook 365, et de commandes vocales avancées.
>
> **Architecture** : application web browser uniquement (React + Vite). Pas de backend Electron.
> **Messagerie** : Outlook 365 / Microsoft 365 uniquement (Graph API). Gmail et EWS on-premise non supportés.

---

## 1. 🛠️ Stack technique

| Composant                         | Technologie                                    |
| --------------------------------- | ---------------------------------------------- |
| Interface utilisateur             | **React 18** + Vite                            |
| Styles                            | **TailwindCSS**                                |
| Drag & Drop                       | **@hello-pangea/dnd**                          |
| Commandes vocales                 | **Web Speech API**                             |
| Base de données locale            | **Dexie (IndexedDB)** + localStorage (fallback)|
| Intégration Outlook 365           | **Microsoft Graph API** + **MSAL.js browser**  |
| Sanitisation HTML                 | **DOMPurify**                                  |
| Validation données                | **Zod**                                        |
| Éditeur riche                     | **react-quill**                                |

---

## 2. 🗄️ Base de données locale — Dexie (IndexedDB)

C-PRojeTs utilise **Dexie** (wrapper IndexedDB) comme base de données principale.
Le choix d'IndexedDB vs SQLite est délibéré : l'app est web-only (pas de backend Node),
et IndexedDB offre une capacité de plusieurs GB — bien au-delà des besoins du projet.

### Stratégie de double couche

| Couche | Technologie | Capacité | Rôle |
|---|---|---|---|
| Écriture immédiate | localStorage | ~5-10 MB | Sécurité des données (fermture onglet rapide) |
| Stockage principal | Dexie / IndexedDB | Plusieurs GB | Volume réel des données |

### Schéma évolutif

```javascript
// Version 1 — Base
this.version(1).stores({
  boards, columns, cards, categories, subcategories, library
});

// Version 2 — V2.0 : liens email Outlook
this.version(2).stores({
  ..., email_links: '++id, ref_type, ref_id, source, email_id'
});

// Version 3 — V3.0 : synchronisation tags
this.version(3).stores({
  ..., tag_mapping: '++id, source, source_tag',
       sync_history: '++id, source, status, created_at'
});
```

---

## 3. 🏗️ Architecture du projet

```
src/
├── components/
│   ├── Board/              → Tableau principal (Board2.jsx + BoardCommandesTab.jsx)
│   ├── Card/               → Cartes de projet (niveau 1)
│   ├── Category/           → Catégories (niveau 2)
│   ├── SubCategory/        → Sous-catégories (niveau 3)
│   ├── Library/            → Bibliothèque de modèles
│   ├── VoiceControl/       → Commandes vocales
│   ├── Dashboard/          → Tableau de bord global
│   ├── Planning/           → Vue planning / Gantt
│   └── Messaging/          → Module Outlook (optionnel, V2.0+)
│       ├── OutlookPanel/
│       └── ...
├── context/
│   ├── AppContext.jsx      → Données métier + CRUD
│   └── UIContext.jsx       → État UI (thème, modals, panels)
├── services/
│   ├── storage.js          → Dexie + localStorage
│   ├── messaging/
│   │   └── outlook.js      → Microsoft Graph API
│   └── auth/
│       └── microsoft.js    → MSAL.js browser
├── utils/
│   ├── sanitize.js         → DOMPurify
│   └── importSchema.js     → Zod schemas
└── hooks/
    ├── useUI.jsx
    └── useSettings.jsx
```

---

## 4. 🟢 C-PRojeTs — Version de base

### 4.1 Structure imbriquée à 3 niveaux

```
TABLEAU (Board)
│
├── 📋 CARTE PROJET (niveau 1)
│   ├── 📁 CATEGORIE (niveau 2)
│   │   ├── 📄 SOUS-CATEGORIE (niveau 3)
│   │   └── 📄 SOUS-CATEGORIE ...
│   └── 📁 CATEGORIE ...
└── 📋 CARTE PROJET ...
```

### 4.2 Règles de déplacement

| Élément            | Peut être déplacé vers                                   |
| ------------------ | -------------------------------------------------------- |
| **Carte Projet**   | N'importe quelle colonne du tableau                      |
| **Catégorie**      | Au sein de la même carte OU vers une autre carte projet  |
| **Sous-catégorie** | Au sein de la même catégorie OU vers une autre catégorie |

### 4.3 Attributs de chaque niveau

Chaque niveau (Carte, Catégorie, Sous-catégorie) dispose de :

- Titre + description riche (Quill)
- Priorité (urgent, haute, normale, basse, terminé)
- Date d'échéance + date de début
- Durée en jours
- Assignation membre
- Statut personnalisé
- Badge indiquant le nombre d'éléments enfants
- Collapse / expand
- Commandes vocales

### 4.4 Onglets de Board2

| Onglet       | Contenu                                     |
| ------------ | ------------------------------------------- |
| Tâches       | Vue Kanban avec colonnes et cartes           |
| Planning     | Vue Gantt des sous-catégories               |
| Commandes    | Marchés, avenants, situations de travaux    |
| Échanges     | Messagerie interne / emails liés            |
| Informations | Données projet (EOTP, contacts, zones…)     |

---

## 5. 📚 Bibliothèque de modèles

- Sauvegarde d'une carte/catégorie/sous-catégorie comme modèle
- Sauvegarde du contenu imbriqué complet (JSON)
- Panel bibliothèque : liste des modèles par type, recherche, tags
- Application d'un modèle par bouton "Utiliser"
- Drag & drop depuis la bibliothèque vers le tableau
- Drag & drop depuis le tableau vers la bibliothèque

---

## 6. 🎙️ Commandes vocales — C-PRojeTs de base

#### Activation

| Commande                       | Action                          |
| ------------------------------ | ------------------------------- |
| _"Écoute"_ / _"Hey C-PRojeTs"_ | Active l'écoute vocale          |
| _"Stop"_ / _"Pause"_           | Désactive l'écoute              |
| _"Aide"_                       | Liste les commandes disponibles |
| _"Annuler"_                    | Annule la dernière action       |

#### Gestion des éléments

| Commande                          | Action                                  |
| --------------------------------- | --------------------------------------- |
| _"Créer une carte [nom]"_         | Crée une nouvelle carte projet          |
| _"Créer catégorie [nom]"_         | Crée une catégorie dans la carte active |
| _"Créer sous-catégorie [nom]"_    | Crée une sous-catégorie                 |
| _"Taguer [priorité]"_             | Applique une étiquette                  |
| _"Assigner à [nom]"_              | Assigne à un membre                     |
| _"Date d'échéance [date]"_        | Définit une deadline                    |
| _"Archiver carte"_                | Archive la carte sélectionnée           |

#### Bibliothèque

| Commande                      | Action                                       |
| ----------------------------- | -------------------------------------------- |
| _"Ouvrir la bibliothèque"_    | Affiche le panel bibliothèque                |
| _"Sauvegarder comme modèle"_  | Envoie l'élément sélectionné en bibliothèque |
| _"Utiliser le modèle [nom]"_  | Colle le modèle dans l'emplacement actif     |

---

## 7. 📨 Module Messagerie Outlook — Activation optionnelle

> **Scope** : Microsoft 365 / Outlook 365 uniquement.
> Authentification via MSAL.js (browser OAuth 2.0). Pas de backend serveur.

### 7.1 Activation

```
⚙️ Paramètres C-PRojeTs → Intégrations → Messagerie
└── ☐ Activer Microsoft Outlook 365
      → Connexion OAuth 2.0 via MSAL.js (popup browser)
      → Activation du panel Outlook dans l'interface
```

### 7.2 Fonctionnalités

| Fonctionnalité           | Outlook 365    |
| ------------------------ | -------------- |
| API utilisée             | Graph API      |
| Authentification         | OAuth 2.0      |
| Lecture emails           | ✅             |
| Organisation             | Dossiers       |
| Tags / Catégories        | Catégories Outlook |
| Drag & drop → C-PRojeTs  | ✅             |
| Copier/Coller vocal      | ✅             |
| Envoi depuis C-PRojeTs   | ✅             |
| Synchro tags ↔ C-PRojeTs | ✅ (V3.0)      |
| Calendrier filtrable     | ❌ Hors périmètre |

### 7.3 Lien email → C-PRojeTs

| Action                                  | Résultat dans C-PRojeTs               |
| --------------------------------------- | ------------------------------------- |
| Email glissé sur une **Carte Projet**   | Devient une catégorie automatiquement |
| Email glissé sur une **Catégorie**      | Devient une sous-catégorie            |
| Email glissé sur une **Sous-catégorie** | S'attache comme note/pièce jointe     |

### 7.4 Commandes vocales Outlook

| Commande                        | Action                                  |
| ------------------------------- | --------------------------------------- |
| _"Ouvrir Outlook"_              | Bascule vers le panel Outlook           |
| _"Email suivant / précédent"_   | Navigation dans la liste                |
| _"Répondre"_                    | Ouvre la fenêtre de réponse             |
| _"Déplacer dans [dossier]"_     | Déplace l'email dans le dossier Outlook |
| _"Taguer [catégorie]"_          | Applique une catégorie Outlook          |
| _"Crée une carte"_              | Crée une carte C-PRojeTs depuis l'email |
| _"Copie email dans C-PRojeTs"_  | Met l'email en mémoire tampon           |
| _"Colle l'email ici"_           | Colle dans l'élément actif C-PRojeTs   |

---

## 8. 🚀 Plan de développement (Phases)

| Phase        | Contenu                                                                  | Priorité    |
| ------------ | ------------------------------------------------------------------------ | ----------- |
| **Phase 1**  | Structure de base — tableau, colonnes, cartes niveau 1                   | 🔴 Critique |
| **Phase 2**  | Catégories et sous-catégories (niveaux 2 et 3) avec drag & drop imbriqué | 🔴 Critique |
| **Phase 3**  | Bibliothèque de modèles avec drag & drop bidirectionnel                  | 🟠 Haute    |
| **Phase 4**  | Commandes vocales C-PRojeTs de base                                      | 🟠 Haute    |
| **Phase 5**  | Module Messagerie — Intégration Outlook 365 (Graph API)                  | 🟡 Moyenne  |
| **Phase 6**  | Drag & drop emails → cartes/catégories/sous-catégories                   | 🟡 Moyenne  |
| **Phase 7**  | Commandes vocales messagerie Outlook                                     | 🟡 Moyenne  |
| **Phase 8**  | Synchronisation tags Outlook ↔ C-PRojeTs + performances + tests          | 🟢 Basse    |

---

## 9. 📌 Récapitulatif des fonctionnalités

### C-PRojeTs — Base (toujours disponible)

- ✅ Tableau de bord style Trello avec colonnes personnalisables
- ✅ Cartes imbriquées à 3 niveaux (Projet → Catégorie → Sous-catégorie)
- ✅ Drag & drop à chaque niveau (intra et inter éléments)
- ✅ Bibliothèque de modèles avec drag & drop bidirectionnel
- ✅ Commandes vocales de base (navigation, création, déplacement, tags)
- ✅ Planning / Gantt, onglet Commandes, onglet Échanges, onglet Informations
- ✅ Étiquettes de priorité, dates d'échéance, assignations
- ✅ Mode sombre / mode clair
- ✅ Données stockées localement (Dexie / IndexedDB + localStorage)
- ✅ Application web — accessible depuis n'importe quel navigateur

### Module Messagerie Outlook 365 — Optionnel (V2.0+)

- ☐ Authentification OAuth 2.0 Microsoft (MSAL.js browser)
- ☐ Panel email Outlook dans l'interface
- ☐ Actions sur les emails (lire, déplacer, taguer, répondre, transférer)
- ☐ Drag & drop email → C-PRojeTs (tous niveaux)
- ☐ Copier/Coller vocal entre Outlook et C-PRojeTs
- ☐ Commandes vocales Outlook complètes
- ☐ Synchronisation tags Outlook ↔ C-PRojeTs (V3.0)

---

_C-PRojeTs — Cahier des charges v3.0 — mise à jour mai 2026_
