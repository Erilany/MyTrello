# 📖 C-PRojeTs — Glossaire

> Dictionnaire de référence de tous les termes utilisés dans la documentation et le code du projet.
> En cas d'ambiguïté, ce document fait foi.

---

## A

**Action vocale**
Commande reconnue par le moteur vocal qui déclenche une opération dans C-PRojeTs (création, déplacement, navigation, etc.). Distinct d'un _texte dicté_ qui lui est inséré dans un champ de saisie.

**Archivage**
Action de masquer un élément (carte, catégorie ou sous-catégorie) du tableau principal sans le supprimer définitivement. Les éléments archivés sont accessibles via la vue "Archives" et peuvent être restaurés.

**Assignation**
Attribution d'un élément (carte, catégorie ou sous-catégorie) à un membre identifié par son nom. Champ textuel libre dans le MVP.

---

## B

**Badge**
Indicateur visuel affiché sur un élément pour communiquer une information (nombre d'enfants, priorité, date dépassée, emails liés). Toujours visible sans ouvrir l'élément.

**Board**
Voir _Tableau_.

**Bibliothèque**
Panel latéral permettant de sauvegarder des éléments C-PRojeTs (cartes, catégories, sous-catégories) comme _modèles_ réutilisables. Les modèles peuvent être glissés depuis la bibliothèque vers le tableau pour en créer des copies.

---

## C

**Canal IPC**
Identifiant unique d'un canal de communication entre le Main Process et le Renderer Process d'Electron. Format : `[domaine]:[entité]:[action]`. Exemple : `db:cards:create`.

**Carte / Card**
Élément de niveau 1 dans la hiérarchie C-PRojeTs. Représente un projet. Contient des _catégories_. Appartient à une _colonne_.

**Catégorie / Category**
Élément de niveau 2 dans la hiérarchie C-PRojeTs. Appartient à une _carte_. Contient des _sous-catégories_. Peut être déplacée vers une autre carte.

**Collapse / Réduire**
Action de masquer le contenu imbriqué d'un élément (ses enfants) sans les supprimer. L'élément reste visible mais réduit à son en-tête. État persisté en base de données.

**Colonne / Column**
Conteneur vertical dans un tableau, regroupant des cartes par état ou catégorie. Exemples : "À faire", "En cours", "Terminé".

**Commande vocale**
Phrase prononcée par l'utilisateur et reconnue par le moteur vocal pour déclencher une _action vocale_. Distincte d'une _dictée_ (insertion de texte).

**Conventional Commits**
Convention de nommage des messages de commit Git adoptée dans ce projet. Format : `type(scope): description`. Voir `CONVENTIONS_CODE.md`.

**Copier / Coller vocal**
Mécanisme permettant de copier un email (Outlook ou Gmail) en mémoire tampon via une commande vocale, puis de le coller dans un élément C-PRojeTs via une autre commande vocale.

---

## D

**Date d'échéance / Due date**
Date limite associée à un élément (carte, catégorie ou sous-catégorie). Affichée avec un indicateur coloré selon son état : rouge (dépassée), orange (proche), vert (lointaine).

**Dictée**
Saisie de texte par la voix dans un champ de formulaire. Différent d'une _commande vocale_ qui déclenche une action.

**Drag & Drop**
Glisser-déposer. Action de déplacer un élément visuellement de sa position source vers une position cible en maintenant le clic enfoncé.

**Drop Zone**
Zone de dépôt mise en évidence lors d'un drag & drop pour indiquer où l'élément peut être déposé.

---

## E

**Electron**
Framework permettant de créer des applications desktop multiplateformes avec des technologies web (HTML, CSS, JavaScript). Utilisé comme base de C-PRojeTs. Composé d'un _Main Process_ et d'un _Renderer Process_.

**EWS (Exchange Web Services)**
Protocole d'API utilisé pour communiquer avec Microsoft Exchange Server on-premise. Fallback utilisé lorsque Microsoft Graph API n'est pas disponible (configuration Exchange on-premise).

**Exchange on-premise**
Serveur Microsoft Exchange installé et géré en interne par une entreprise, par opposition à Exchange Online (cloud). Nécessite l'utilisation d'EWS dans C-PRojeTs.

**Exchange Online**
Service Exchange hébergé dans le cloud Microsoft, utilisé par Microsoft 365. Accessible via _Microsoft Graph API_.

---

## F

**Filtrage par tags**
Fonctionnalité du module _Calendrier_ permettant d'afficher uniquement les événements associés à un ou plusieurs tags (catégories Outlook) sélectionnés.

---

## G

**Gmail API**
API Google permettant d'accéder aux emails Gmail. Utilisée dans le module _Messagerie_ pour le panel Gmail.

**Graph API**
Voir _Microsoft Graph API_.

---

## H

**Hiérarchie à 3 niveaux**
Structure d'organisation des données dans C-PRojeTs : _Carte_ (niveau 1) → _Catégorie_ (niveau 2) → _Sous-catégorie_ (niveau 3). Chaque niveau peut contenir des éléments du niveau inférieur.

---

## I

**IPC (Inter-Process Communication)**
Mécanisme de communication entre le _Main Process_ et le _Renderer Process_ d'Electron. Dans C-PRojeTs, tous les appels à la base de données et aux APIs externes passent par IPC.

**Indicateur RDV du jour**
Badge affiché dans le header de C-PRojeTs indiquant le nombre de rendez-vous du jour dans le calendrier Outlook, filtré par les tags actifs.

---

## L

**Label**
Voir _Libellé_.

**Libellé / Label (Gmail)**
Équivalent des _dossiers_ pour Gmail. Un email Gmail peut avoir plusieurs libellés simultanément, contrairement aux dossiers Outlook (un email appartient à un seul dossier à la fois).

**Lien email**
Association entre un email (Outlook ou Gmail) et un élément C-PRojeTs (carte, catégorie ou sous-catégorie). Stocké dans la table `email_links`.

---

## M

**Main Process**
Processus principal d'Electron, qui a accès au système de fichiers, à la base de données SQLite, aux APIs externes et au stockage sécurisé. Communique avec le _Renderer Process_ via _IPC_.

**Mapping tags**
Règle de correspondance entre un tag de messagerie (catégorie Outlook, libellé Gmail, tag calendrier) et une étiquette C-PRojeTs. Configuré dans l'interface de synchronisation.

**Mémoire tampon email**
Stockage temporaire d'un email (ou son contenu) lors de l'opération _Copier / Coller vocal_. Persisté dans la table `settings` le temps de l'opération.

**Microsoft Graph API**
API REST de Microsoft permettant d'accéder aux services Microsoft 365 (Outlook, Exchange Online, Calendrier). Mode principal d'intégration Outlook dans C-PRojeTs.

**Mode focus**
Mode d'affichage masquant tout le tableau sauf l'élément actif, pour une concentration maximale.

**Mode multi-tags**
Mode du sélecteur de tags du calendrier permettant d'activer plusieurs tags simultanément (par opposition au mode simple qui n'en autorise qu'un).

**Modèle**
Élément (carte, catégorie ou sous-catégorie) sauvegardé dans la _bibliothèque_ et pouvant être réutilisé pour créer de nouvelles copies.

---

## N

**Niveau**
Position d'un élément dans la hiérarchie C-PRojeTs. Niveau 1 = Carte, Niveau 2 = Catégorie, Niveau 3 = Sous-catégorie.

---

## O

**OAuth 2.0**
Protocole d'authentification et d'autorisation utilisé pour les connexions Outlook (Microsoft) et Gmail (Google). Permet à C-PRojeTs d'accéder aux emails de l'utilisateur sans stocker son mot de passe.

**Onboarding**
Tour guidé interactif proposé aux nouveaux utilisateurs lors du premier lancement de l'application.

**Outlook 365**
Version d'Outlook incluse dans Microsoft 365 (abonnement), utilisant Exchange Online (cloud). Compatible Graph API.

**Outlook 2024**
Version d'Outlook à licence perpétuelle. Compatible _Graph API_ si associée à un compte Microsoft 365 (cloud), ou nécessite _EWS_ si connectée à un Exchange on-premise.

---

## P

**Panel**
Zone d'interface dédiée à un module spécifique (panel Outlook, panel Gmail, panel calendrier, panel bibliothèque). Généralement affiché en latéral ou en superposition du tableau principal.

**Position**
Ordre numérique d'un élément parmi ses frères (même niveau, même parent). Utilisé pour le tri et le réordonnancement lors du drag & drop.

**Priorité**
Niveau d'urgence d'un élément : `urgent`, `normal`, `waiting` (en attente), `done` (terminé). Représenté par une couleur dans l'interface.

---

## R

**Refresh Token**
Token OAuth permettant d'obtenir un nouveau _Access Token_ sans redemander les identifiants à l'utilisateur. Stocké de manière chiffrée via `electron-store`.

**Renderer Process**
Processus secondaire d'Electron gérant l'interface utilisateur React. N'a pas d'accès direct au système. Communique avec le _Main Process_ via _IPC_.

---

## S

**Scope (Git)**
Domaine fonctionnel d'un commit dans la convention _Conventional Commits_. Exemple : `feat(card): ...`.

**Source (email_links)**
Champ identifiant la provenance d'un email lié : `'outlook'` ou `'gmail'`. Permet de différencier visuellement les emails des deux services.

**Sous-catégorie / SubCategory**
Élément de niveau 3 dans la hiérarchie C-PRojeTs. Appartient à une _catégorie_. Peut être déplacée vers une autre catégorie.

**SQLite**
Base de données relationnelle légère stockée localement dans un fichier. Utilisée pour persister toutes les données C-PRojeTs (tableau, cartes, paramètres, cache calendrier, etc.).

**Synchronisation bidirectionnelle**
Mécanisme de sync où les changements se propagent dans les deux sens : messagerie → C-PRojeTs ET C-PRojeTs → messagerie. Configuré par _mapping tags_.

---

## T

**Tableau / Board**
Espace de travail principal de C-PRojeTs. Contient des _colonnes_, chacune contenant des _cartes_.

**Tag (calendrier Outlook)**
Catégorie Outlook associée à un événement calendrier. Utilisée pour filtrer les événements dans le module calendrier de C-PRojeTs.

**Tag (messagerie)**
Terme générique désignant une _catégorie Outlook_ ou un _libellé Gmail_ selon le service concerné.

**Toast**
Notification temporaire affichée brièvement en superposition de l'interface pour confirmer une action ou signaler une erreur. Disparaît automatiquement après quelques secondes.

**Token**
Clé d'accès temporaire obtenue après authentification OAuth, permettant d'effectuer des requêtes API au nom de l'utilisateur.

---

## V

**Vue calendrier**
Mode d'affichage du module calendrier. Trois vues disponibles : liste, semaine, mois.

**Vue liste (calendrier)**
Affichage des événements calendrier filtrés sous forme de liste chronologique, groupés par jour.

---

_C-PRojeTs — Glossaire — 23 février 2026_
