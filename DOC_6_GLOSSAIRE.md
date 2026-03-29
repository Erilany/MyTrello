# 📖 D-ProjeT — Glossaire

> Dictionnaire de référence de tous les termes utilisés dans la documentation et le code du projet.
> En cas d'ambiguïté, ce document fait foi.

---

## A

**Action vocale**
Commande reconnue par le moteur vocal qui déclenche une opération dans D-ProjeT (création, déplacement, navigation, etc.). Distinct d'un *texte dicté* qui lui est inséré dans un champ de saisie.

**Archivage**
Action de masquer un élément (carte, catégorie ou sous-catégorie) du tableau principal sans le supprimer définitivement. Les éléments archivés sont accessibles via la vue "Archives" et peuvent être restaurés.

**Assignation**
Attribution d'un élément (carte, catégorie ou sous-catégorie) à un membre identifié par son nom. Champ textuel libre dans le MVP.

---

## B

**Badge**
Indicateur visuel affiché sur un élément pour communiquer une information (nombre d'enfants, priorité, date dépassée, emails liés). Toujours visible sans ouvrir l'élément.

**Board**
Voir *Tableau*.

**Bibliothèque**
Panel latéral permettant de sauvegarder des éléments D-ProjeT (cartes, catégories, sous-catégories) comme *modèles* réutilisables. Les modèles peuvent être glissés depuis la bibliothèque vers le tableau pour en créer des copies.

---

## C

**Canal IPC**
Identifiant unique d'un canal de communication entre le Main Process et le Renderer Process d'Electron. Format : `[domaine]:[entité]:[action]`. Exemple : `db:cards:create`.

**Carte / Card**
Élément de niveau 1 dans la hiérarchie D-ProjeT. Représente un projet. Contient des *catégories*. Appartient à une *colonne*.

**Catégorie / Category**
Élément de niveau 2 dans la hiérarchie D-ProjeT. Appartient à une *carte*. Contient des *sous-catégories*. Peut être déplacée vers une autre carte.

**Collapse / Réduire**
Action de masquer le contenu imbriqué d'un élément (ses enfants) sans les supprimer. L'élément reste visible mais réduit à son en-tête. État persisté en base de données.

**Colonne / Column**
Conteneur vertical dans un tableau, regroupant des cartes par état ou catégorie. Exemples : "À faire", "En cours", "Terminé".

**Commande vocale**
Phrase prononcée par l'utilisateur et reconnue par le moteur vocal pour déclencher une *action vocale*. Distincte d'une *dictée* (insertion de texte).

**Conventional Commits**
Convention de nommage des messages de commit Git adoptée dans ce projet. Format : `type(scope): description`. Voir `CONVENTIONS_CODE.md`.

**Copier / Coller vocal**
Mécanisme permettant de copier un email (Outlook ou Gmail) en mémoire tampon via une commande vocale, puis de le coller dans un élément D-ProjeT via une autre commande vocale.

---

## D

**Date d'échéance / Due date**
Date limite associée à un élément (carte, catégorie ou sous-catégorie). Affichée avec un indicateur coloré selon son état : rouge (dépassée), orange (proche), vert (lointaine).

**Dictée**
Saisie de texte par la voix dans un champ de formulaire. Différent d'une *commande vocale* qui déclenche une action.

**Drag & Drop**
Glisser-déposer. Action de déplacer un élément visuellement de sa position source vers une position cible en maintenant le clic enfoncé.

**Drop Zone**
Zone de dépôt mise en évidence lors d'un drag & drop pour indiquer où l'élément peut être déposé.

---

## E

**Electron**
Framework permettant de créer des applications desktop multiplateformes avec des technologies web (HTML, CSS, JavaScript). Utilisé comme base de D-ProjeT. Composé d'un *Main Process* et d'un *Renderer Process*.

**EWS (Exchange Web Services)**
Protocole d'API utilisé pour communiquer avec Microsoft Exchange Server on-premise. Fallback utilisé lorsque Microsoft Graph API n'est pas disponible (configuration Exchange on-premise).

**Exchange on-premise**
Serveur Microsoft Exchange installé et géré en interne par une entreprise, par opposition à Exchange Online (cloud). Nécessite l'utilisation d'EWS dans D-ProjeT.

**Exchange Online**
Service Exchange hébergé dans le cloud Microsoft, utilisé par Microsoft 365. Accessible via *Microsoft Graph API*.

---

## F

**Filtrage par tags**
Fonctionnalité du module *Calendrier* permettant d'afficher uniquement les événements associés à un ou plusieurs tags (catégories Outlook) sélectionnés.

---

## G

**Gmail API**
API Google permettant d'accéder aux emails Gmail. Utilisée dans le module *Messagerie* pour le panel Gmail.

**Graph API**
Voir *Microsoft Graph API*.

---

## H

**Hiérarchie à 3 niveaux**
Structure d'organisation des données dans D-ProjeT : *Carte* (niveau 1) → *Catégorie* (niveau 2) → *Sous-catégorie* (niveau 3). Chaque niveau peut contenir des éléments du niveau inférieur.

---

## I

**IPC (Inter-Process Communication)**
Mécanisme de communication entre le *Main Process* et le *Renderer Process* d'Electron. Dans D-ProjeT, tous les appels à la base de données et aux APIs externes passent par IPC.

**Indicateur RDV du jour**
Badge affiché dans le header de D-ProjeT indiquant le nombre de rendez-vous du jour dans le calendrier Outlook, filtré par les tags actifs.

---

## L

**Label**
Voir *Libellé*.

**Libellé / Label (Gmail)**
Équivalent des *dossiers* pour Gmail. Un email Gmail peut avoir plusieurs libellés simultanément, contrairement aux dossiers Outlook (un email appartient à un seul dossier à la fois).

**Lien email**
Association entre un email (Outlook ou Gmail) et un élément D-ProjeT (carte, catégorie ou sous-catégorie). Stocké dans la table `email_links`.

---

## M

**Main Process**
Processus principal d'Electron, qui a accès au système de fichiers, à la base de données SQLite, aux APIs externes et au stockage sécurisé. Communique avec le *Renderer Process* via *IPC*.

**Mapping tags**
Règle de correspondance entre un tag de messagerie (catégorie Outlook, libellé Gmail, tag calendrier) et une étiquette D-ProjeT. Configuré dans l'interface de synchronisation.

**Mémoire tampon email**
Stockage temporaire d'un email (ou son contenu) lors de l'opération *Copier / Coller vocal*. Persisté dans la table `settings` le temps de l'opération.

**Microsoft Graph API**
API REST de Microsoft permettant d'accéder aux services Microsoft 365 (Outlook, Exchange Online, Calendrier). Mode principal d'intégration Outlook dans D-ProjeT.

**Mode focus**
Mode d'affichage masquant tout le tableau sauf l'élément actif, pour une concentration maximale.

**Mode multi-tags**
Mode du sélecteur de tags du calendrier permettant d'activer plusieurs tags simultanément (par opposition au mode simple qui n'en autorise qu'un).

**Modèle**
Élément (carte, catégorie ou sous-catégorie) sauvegardé dans la *bibliothèque* et pouvant être réutilisé pour créer de nouvelles copies.

---

## N

**Niveau**
Position d'un élément dans la hiérarchie D-ProjeT. Niveau 1 = Carte, Niveau 2 = Catégorie, Niveau 3 = Sous-catégorie.

---

## O

**OAuth 2.0**
Protocole d'authentification et d'autorisation utilisé pour les connexions Outlook (Microsoft) et Gmail (Google). Permet à D-ProjeT d'accéder aux emails de l'utilisateur sans stocker son mot de passe.

**Onboarding**
Tour guidé interactif proposé aux nouveaux utilisateurs lors du premier lancement de l'application.

**Outlook 365**
Version d'Outlook incluse dans Microsoft 365 (abonnement), utilisant Exchange Online (cloud). Compatible Graph API.

**Outlook 2024**
Version d'Outlook à licence perpétuelle. Compatible *Graph API* si associée à un compte Microsoft 365 (cloud), ou nécessite *EWS* si connectée à un Exchange on-premise.

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
Token OAuth permettant d'obtenir un nouveau *Access Token* sans redemander les identifiants à l'utilisateur. Stocké de manière chiffrée via `electron-store`.

**Renderer Process**
Processus secondaire d'Electron gérant l'interface utilisateur React. N'a pas d'accès direct au système. Communique avec le *Main Process* via *IPC*.

---

## S

**Scope (Git)**
Domaine fonctionnel d'un commit dans la convention *Conventional Commits*. Exemple : `feat(card): ...`.

**Source (email_links)**
Champ identifiant la provenance d'un email lié : `'outlook'` ou `'gmail'`. Permet de différencier visuellement les emails des deux services.

**Sous-catégorie / SubCategory**
Élément de niveau 3 dans la hiérarchie D-ProjeT. Appartient à une *catégorie*. Peut être déplacée vers une autre catégorie.

**SQLite**
Base de données relationnelle légère stockée localement dans un fichier. Utilisée pour persister toutes les données D-ProjeT (tableau, cartes, paramètres, cache calendrier, etc.).

**Synchronisation bidirectionnelle**
Mécanisme de sync où les changements se propagent dans les deux sens : messagerie → D-ProjeT ET D-ProjeT → messagerie. Configuré par *mapping tags*.

---

## T

**Tableau / Board**
Espace de travail principal de D-ProjeT. Contient des *colonnes*, chacune contenant des *cartes*.

**Tag (calendrier Outlook)**
Catégorie Outlook associée à un événement calendrier. Utilisée pour filtrer les événements dans le module calendrier de D-ProjeT.

**Tag (messagerie)**
Terme générique désignant une *catégorie Outlook* ou un *libellé Gmail* selon le service concerné.

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

*D-ProjeT — Glossaire — 23 février 2026*
