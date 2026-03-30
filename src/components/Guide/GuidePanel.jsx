import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  X,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Users,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Layers,
  FileText,
  Link,
  AlertCircle,
} from 'lucide-react';

const pageGuides = {
  introduction: {
    title: 'Guide D-ProjeTs',
    sections: [
      {
        id: 'roles',
        title: "Rôles dans l'application",
        content: (
          <div className="space-y-4">
            <div className="p-3 bg-card-hover rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-blue-500" />
                <h4 className="font-semibold text-primary">Référents métiers</h4>
              </div>
              <ul className="space-y-1 text-sm text-muted ml-7">
                <li>
                  • Définissent les <strong>chapitres/carte/catégorie/tâche</strong> dans
                  Ressources/Bibliothèque
                </li>
                <li>
                  • Configurent les <strong>contacts</strong> (internes/externes)
                </li>
                <li>
                  • Créent les <strong>tags</strong> disponibles
                </li>
                <li>
                  • Gèrent la <strong>bibliothèque</strong> de modèles
                </li>
                <li>
                  • Définissent les <strong>temps repère</strong>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-card-hover rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-green-500" />
                <h4 className="font-semibold text-primary">Équipiers projets</h4>
              </div>
              <ul className="space-y-1 text-sm text-muted ml-7">
                <li>
                  • Naviguent dans le <strong>Projet</strong> (5 onglets)
                </li>
                <li>
                  • Modifient les <strong>tâches</strong>, <strong>jalons</strong>
                </li>
                <li>
                  • Consultent le <strong>Dashboard</strong>
                </li>
                <li>
                  • Suivent leur <strong>temps passé</strong>
                </li>
                <li>
                  • Assignent des <strong>contacts</strong> existants
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'navigation',
        title: 'Navigation rapide',
        content: (
          <div className="space-y-3 text-sm">
            <p className="text-muted">Le guide s'adapte selon votre position:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-card-hover rounded">
                <p className="font-medium text-primary text-xs">Dashboard</p>
                <p className="text-muted text-xs">3 onglets: Temps, Tâches, Activité</p>
              </div>
              <div className="p-2 bg-card-hover rounded">
                <p className="font-medium text-primary text-xs">Projet</p>
                <p className="text-muted text-xs">5 onglets</p>
              </div>
              <div className="p-2 bg-card-hover rounded">
                <p className="font-medium text-primary text-xs">Formulaire Tâche</p>
                <p className="text-muted text-xs">Détails, jalons, dates</p>
              </div>
              <div className="p-2 bg-card-hover rounded">
                <p className="font-medium text-primary text-xs">Formulaire Carte</p>
                <p className="text-muted text-xs">Projet</p>
              </div>
              <div className="p-2 bg-card-hover rounded">
                <p className="font-medium text-primary text-xs">Bibliothèque</p>
                <p className="text-muted text-xs">Modèles</p>
              </div>
              <div className="p-2 bg-card-hover rounded">
                <p className="font-medium text-primary text-xs">Paramètres</p>
                <p className="text-muted text-xs">Configuration</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'liens',
        title: 'Liens entre les pages',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Flux de navigation</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted text-xs">
                <li>
                  • <strong>Dashboard</strong> → Projet → Tâches
                </li>
                <li>
                  • <strong>Projet</strong> → Formulaire Carte → Formulaire Tâche
                </li>
                <li>
                  • <strong>Bibliothèque</strong> → Projet (via modèles)
                </li>
                <li>
                  • <strong>Paramètres</strong> → Bibliothèque, Projets
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <Link size={14} className="text-muted" />
                <span className="font-medium text-primary">Données partagées</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted text-xs">
                <li>
                  • <strong>Tags</strong>: Bibliothèque ↔ Paramètres ↔ Revue activité
                </li>
                <li>
                  • <strong>Chapitres</strong>: Bibliothèque ↔ Paramètres ↔ Projet
                </li>
                <li>
                  • <strong>Contrats</strong>: Paramètres → Bibliothèque → Projet
                </li>
                <li>
                  • <strong>Temps repère</strong>: Bibliothèque → Carte/Tâche
                </li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
  dashboard: {
    title: 'Dashboard',
    sections: [
      {
        id: 'utilisateurs',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Équipiers</span>
              <span className="text-muted">- Actions sur jalons, visualisation</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded">
              <span className="text-blue-500 font-medium">Référents</span>
              <span className="text-muted">- Consultation globale</span>
            </div>
          </div>
        ),
      },
      {
        id: 'onglets',
        title: '3 onglets du Dashboard',
        content: (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">1. Temps passé</p>
              <ul className="space-y-1 text-muted ml-4">
                <li>
                  • <strong>Graphique en barres</strong> empilées par projet (% temps)
                </li>
                <li>
                  • <strong>Sélection de semaine</strong> via menu déroulant
                </li>
                <li>
                  • <strong>Chrono automatique</strong> : démarre en sélectionnant un projet
                </li>
                <li>
                  • <strong>Bouton réinitialiser</strong> : remet le temps à 0 pour la semaine
                </li>
              </ul>
            </div>
            <div className="p-3 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">2. Mes tâches</p>
              <div className="space-y-2 ml-4">
                <div>
                  <p className="text-muted font-medium mb-1">Filtrage</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • Périodes : <strong>7j / 30j / 6 mois</strong>
                    </li>
                    <li>
                      • Bouton <strong>"Afficher autres"</strong> : voit les tâches d'autres projets
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted font-medium mb-1">Mes jalons</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • Tableau : <strong>Statut, Projet, Tâche, Jalon, Date</strong>
                    </li>
                    <li>
                      • <strong>Checkbox</strong> pour marquer comme fait (→ sync formulaire)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted font-medium mb-1">Tâches à terminer</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • Tableau :{' '}
                      <strong>Projet, Action, Tâche, État, Avancement, Priorité, Échéance</strong>
                    </li>
                    <li>
                      • Code couleur :{' '}
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded"></span>Terminé
                      </span>
                      ,{' '}
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded"></span>En attente
                      </span>
                      ,{' '}
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-500 rounded"></span>En cours
                      </span>
                      ,{' '}
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded"></span>À faire
                      </span>
                    </li>
                    <li>
                      • Priorités : <span className="text-red-500">Urgent</span>,{' '}
                      <span className="text-orange-500">Haute</span>, Normale
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted font-medium mb-1">Tâches terminées</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • Affichées avec <strong>opacité réduite</strong>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted font-medium mb-1">Interactions</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • <strong>Clic sur tâche</strong> → ouvre le formulaire
                    </li>
                    <li>
                      • <strong>Clic sur date</strong> → ouvre le Planning
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-3 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">3. Revue d'activité</p>
              <div className="space-y-2 ml-4">
                <div>
                  <p className="text-muted font-medium mb-1">Structure</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • <strong>Timeline</strong> : 8 trimestres (2 ans) en colonnes
                    </li>
                    <li>
                      • <strong>Regroupement</strong> par zone géographique
                    </li>
                    <li>
                      • <strong>Colonnes</strong> : Type (MP, SCET, LA...), GMR, Projet, Lien, puis
                      les 8 trimestres
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted font-medium mb-1">Fonctionnalités</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • <strong>Charge ressentie</strong> : boutons emoji (😊 😐 😰) par trimestre
                    </li>
                    <li>
                      • <strong>Filtrage</strong> : toggle "Mes éléments" / "Tous les tags"
                    </li>
                    <li>
                      • <strong>Tags</strong> : éléments colorés selon le tag (filtrés par fonction)
                    </li>
                    <li>
                      • <strong>Synchronisation</strong> : bouton pour sync les tags depuis la
                      bibliothèque
                    </li>
                    <li>
                      • <strong>Liens externes</strong> : icônes cliquables vers SharePoint
                    </li>
                    <li>
                      • <strong>Info-bulles</strong> : au survol des éléments tagués
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted font-medium mb-1">Données affichées</p>
                  <ul className="space-y-1 text-muted ml-2">
                    <li>
                      • Projets où l'utilisateur est assigné dans <strong>contacts internes</strong>
                    </li>
                    <li>
                      • Catégories/Sous-catégories{' '}
                      <strong>taguées avec date de début ET fin</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'impact',
        title: 'Liens avec le Projet',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft size={14} className="text-muted" />
                <span className="font-medium text-primary">Reçoit depuis le Projet</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Tâches assignées</strong> à l'utilisateur
                </li>
                <li>
                  • <strong>Jalons avec date</strong> des tâches assignées
                </li>
                <li>
                  • <strong>Temps passé</strong> enregistré par projet
                </li>
              </ul>
            </div>
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-accent">Envoie vers le Projet</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Cocher jalon</strong> → mis à jour dans le formulaire
                </li>
                <li>
                  • <strong>Clic sur tâche</strong> → ouvre le formulaire
                </li>
                <li>
                  • <strong>Clic sur date</strong> → ouvre le Planning
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'regles',
        title: 'Règles automatiques',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Jalons (Dashboard ↔ Formulaire Tâche)</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Jalon coché → <strong>synchronisé immédiatement</strong> dans le formulaire
                </li>
                <li>
                  • Jalon terminé → <strong>disparaît après 1 seconde</strong>
                </li>
                <li>• Synchronisation en temps réel</li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Temps passé</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Temps <strong>cumulé par semaine</strong>
                </li>
                <li>
                  • Comparaison avec <strong>temps repère</strong>
                </li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
  board: {
    title: 'Projet',
    sections: [
      {
        id: 'utilisateurs',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Équipiers</span>
              <span className="text-muted">- Navigation et modifications</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded">
              <span className="text-blue-500 font-medium">Référents</span>
              <span className="text-muted">- Préparation des modèles</span>
            </div>
          </div>
        ),
      },
      {
        id: 'onglets',
        title: '5 onglets',
        content: (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">1. Informations</p>
              <p className="text-muted">Liens, EOTP, interlocuteurs internes/externes.</p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">2. Tâches</p>
              <p className="text-muted">Chapitres, cartes, catégories, tâches.</p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">3. Commandes</p>
              <p className="text-muted">Gestion des commandes fournisseurs.</p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">4. Planning</p>
              <p className="text-muted">Vue Gantt chronologique.</p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">5. Échanges</p>
              <p className="text-muted">Messages et notifications.</p>
            </div>
          </div>
        ),
      },
      {
        id: 'informations',
        title: 'Onglet 1 - Informations',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Liens du projet</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Créés <strong>manuellement</strong> depuis SharePoint
                </li>
                <li>
                  • S'affichent en <strong>haut de tous les onglets</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">EOTP</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>N° EOTP</strong> récupéré sur Optimisco
                </li>
                <li>
                  • <strong>EOTP Niveau 2</strong> récupéré sur Optimisco
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Interlocuteurs internes</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Renseignés depuis <strong>Connaissance</strong> (SharePoint)
                </li>
                <li>
                  • Assignation par <strong>fonction</strong> possible (AOI, PMO...)
                </li>
                <li>
                  • <strong>Auto-réassignation</strong>: quand le nom devient connu, les tâches
                  passent de la fonction → nom
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Interlocuteurs externes</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Renseignés <strong>manuellement</strong>
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'taches',
        title: 'Onglet 2 - Tâches',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Chapitres</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Définition dans <strong>Ressources &gt; Bibliothèque &gt; Modèles</strong>
                </li>
                <li>
                  • <strong>Grisé</strong> si aucune carte disponible
                </li>
                <li>
                  • <strong>Filtrent</strong> les cartes affichées
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Types de cartes</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Avec catégorie</strong>: contient des catégories → sous-catégories →
                  tâches
                </li>
                <li>
                  • <strong>Sans catégorie</strong>: contient des tâches utilisables directement
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Fonctionnement</p>
              <ul className="space-y-1 text-muted">
                <li>• Chapitre cliqué → affiche les cartes disponibles</li>
                <li>• Sélection multiple de chapitres possible</li>
                <li>
                  • <strong>3 modes</strong>: Cartes, Catégories, Sous-catégories
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Code couleur des statuts</p>
              <div className="space-y-1 text-muted">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Terminé</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <span>En attente</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span>En cours</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span>À faire / Bloqué</span>
                </div>
              </div>
            </div>
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Jalons</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Créés dans le <strong>formulaire de tâche</strong>
                </li>
                <li>
                  • <strong>Sans date</strong>: triés par drag & drop en haut
                </li>
                <li>
                  • <strong>Avec date</strong>: triés chronologiquement en bas
                </li>
                <li>• Cochez un jalon → disparaît après 1 seconde</li>
                <li>
                  • <strong>Dashboard</strong>: affiche uniquement les jalons <em>non terminés</em>{' '}
                  de la période en cours
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Dates</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Jours ouvrés uniquement</strong> (weekends exclus)
                </li>
                <li>
                  • <strong>Ancrer sur début</strong>: modifier la date de début recalcule
                  automatiquement la date de fin
                </li>
                <li>
                  • <strong>Ancrer sur fin</strong>: modifier la date de fin recalcule
                  automatiquement la date de début
                </li>
                <li>
                  • <strong>Pas d'ancrage</strong>: les deux dates sont indépendantes
                </li>
                <li>
                  • La <strong>durée</strong> est exprimée en jours ouvrés
                </li>
                <li>
                  • <strong>Temps repère</strong>: durée indicative depuis la bibliothèque (non
                  modifiable)
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'commandes',
        title: 'Onglet 3 - Commandes',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Fonctionnement</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Gestion des <strong>commandes fournisseurs</strong>
                </li>
                <li>
                  • Intégration avec les <strong>EOTP</strong> du projet
                </li>
                <li>
                  • Suggestion <strong>marchés-cadres</strong> depuis contrats
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Import de données</p>
              <ul className="space-y-1 text-muted">
                <li>• Import depuis fichiers (Excel, CSV...)</li>
                <li>• Sauvegarde automatique</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'planning',
        title: 'Onglet 4 - Planning',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Vue Gantt</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Barres colorées</strong> selon statut
                </li>
                <li>
                  • <strong>Zoom</strong>: jour, semaine, mois
                </li>
                <li>
                  • <strong>Ligne rouge</strong> = date du jour
                </li>
                <li>
                  • <strong>Weekends grisés</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Filtres</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Par <strong>chapitre</strong>
                </li>
                <li>
                  • Par <strong>tâche</strong> sélectionnée
                </li>
                <li>
                  • <strong>Tri</strong>: par date ou par hiérarchie
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'echanges',
        title: 'Onglet 5 - Échanges',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Messages</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Messages texte avec <strong>mentions @utilisateur</strong>
                </li>
                <li>
                  • <strong>Pièces jointes</strong> (images, PDF...)
                </li>
                <li>
                  • <strong>Notifications</strong> pour messages non lus
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Intégration emails</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Drag & drop</strong> fichiers .msg (Outlook)
                </li>
                <li>• Parsing automatique des emails</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'impact',
        title: 'Liens avec le Dashboard',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Données envoyées au Dashboard</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Tâches assignées</strong> à l'utilisateur → "Mes tâches"
                </li>
                <li>
                  • <strong>Jalons avec date</strong> des tâches → "Mes jalons"
                </li>
                <li>
                  • <strong>Temps passé</strong> enregistré → "Temps passé"
                </li>
                <li>
                  • <strong>Statuts/Avancements</strong> → Mise à jour en temps réel
                </li>
              </ul>
            </div>
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft size={14} className="text-accent" />
                <span className="font-medium text-accent">Actions depuis le Dashboard</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Jalon coché</strong> dans Dashboard → mis à jour dans le formulaire
                </li>
                <li>
                  • <strong>Dashboard</strong> → affiche les tâches de tous les projets de
                  l'utilisateur
                </li>
                <li>
                  • <strong>Clic sur date</strong> dans Dashboard → ouvre le Planning du projet
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'regles',
        title: 'Règles automatiques',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Temps passé</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Temps <strong>cumulé par semaine</strong> pour chaque projet
                </li>
                <li>
                  • <strong>Comparaison</strong> avec temps repère de la bibliothèque
                </li>
                <li>
                  • Affiché dans le Dashboard avec <strong>pourcentage</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Chapitres et cartes</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Chapitres <strong>grisés</strong> si aucune carte disponible
                </li>
                <li>
                  • <strong>3 modes</strong> d'affichage : Cartes, Catégories, Sous-catégories
                </li>
                <li>• Sélection multiple de chapitres possible</li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Dates et ancrage</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Calcul automatique</strong> de la date de fin depuis le début + durée
                </li>
                <li>
                  • <strong>Jours ouvrés uniquement</strong> (weekends exclus)
                </li>
                <li>
                  • <strong>Temps repère</strong> récupéré depuis la bibliothèque (non modifiable)
                </li>
              </ul>
            </div>
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Jalons</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Synchronisation</strong> en temps réel avec le Dashboard
                </li>
                <li>• Synchronisation en temps réel</li>
                <li>
                  • Jalon <strong>terminé</strong> → disparaît après 1 seconde dans le Dashboard
                </li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
  subcategory: {
    title: 'Formulaire Tâche',
    sections: [
      {
        id: 'utilisateurs',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Équipiers</span>
              <span className="text-muted">- Modification des tâches</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded">
              <span className="text-blue-500 font-medium">Référents</span>
              <span className="text-muted">- Définition via Bibliothèque</span>
            </div>
          </div>
        ),
      },
      {
        id: 'impact',
        title: "Liens avec l'application",
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft size={14} className="text-muted" />
                <span className="font-medium text-primary">Données depuis</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Bibliothèque</strong>: temps repère (lecture)
                </li>
                <li>
                  • <strong>Paramètres</strong>: liste contacts
                </li>
                <li>
                  • <strong>Ressources</strong>: chapitres disponibles
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Vers</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Dashboard</strong>: apparaît dans "Mes tâches"
                </li>
                <li>
                  • <strong>Dashboard</strong>: jalon dans "Mes jalons"
                </li>
                <li>
                  • <strong>Dashboard</strong>: temps passé
                </li>
                <li>
                  • <strong>Planning</strong>: barre Gantt
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'ancrage',
        title: 'Boutons Ancrer (Dates)',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Jalons</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Créés dans le <strong>formulaire de tâche</strong>
                </li>
                <li>
                  • <strong>Sans date</strong>: triés par drag & drop en haut
                </li>
                <li>
                  • <strong>Avec date</strong>: triés chronologiquement en bas
                </li>
                <li>• Cochez un jalon → disparaît après 1 seconde</li>
                <li>
                  • <strong>Dashboard &gt; Mes tâches</strong>: affiche uniquement les jalons{' '}
                  <em>non terminés</em> de la période en cours
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Dates</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Jours ouvrés uniquement</strong> (weekends exclus)
                </li>
                <li>
                  • <strong>Ancrer sur début</strong>: modifier la date de début recalcule
                  automatiquement la date de fin
                </li>
                <li>
                  • <strong>Ancrer sur fin</strong>: modifier la date de fin recalcule
                  automatiquement la date de début
                </li>
                <li>
                  • <strong>Pas d'ancrage</strong>: les deux dates sont indépendantes
                </li>
                <li>
                  • La <strong>durée</strong> est exprimée en jours ouvrés
                </li>
                <li>
                  • <strong>Temps repère</strong>: durée indicative depuis la bibliothèque (non
                  modifiable)
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Mode 1: Ancrer sur DÉBUT</p>
              <p className="text-muted text-xs mb-1">La date de début est FIXE</p>
              <ul className="space-y-1 text-muted text-xs ml-2">
                <li>
                  • Modifier <strong>Durée</strong> → recalcule automatiquement la{' '}
                  <strong>Date d'échéance</strong>
                </li>
                <li>
                  • Modifier <strong>Date d'échéance</strong> → recalcule automatiquement la{' '}
                  <strong>Durée</strong>
                </li>
                <li>• La date de début ne bouge pas</li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Mode 2: Ancrer sur FIN</p>
              <p className="text-muted text-xs mb-1">La date d'échéance est FIXE</p>
              <ul className="space-y-1 text-muted text-xs ml-2">
                <li>
                  • Modifier <strong>Durée</strong> → recalcule automatiquement la{' '}
                  <strong>Date de début</strong>
                </li>
                <li>
                  • Modifier <strong>Date de début</strong> → recalcule automatiquement la{' '}
                  <strong>Durée</strong>
                </li>
                <li>• La date d'échéance ne bouge pas</li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Mode 3: SANS ancrage</p>
              <p className="text-muted text-xs mb-1">Dates gérées LIBREMENT</p>
              <ul className="space-y-1 text-muted text-xs ml-2">
                <li>
                  • Les 3 champs (<strong>Début, Durée, Fin</strong>) sont indépendants
                </li>
                <li>• Modifier l'un n'affecte pas les autres</li>
                <li>• À utiliser quand les dates sont imposées</li>
              </ul>
            </div>
            <div className="p-2 bg-orange-500/10 rounded">
              <p className="font-medium text-orange-500 mb-1">Important</p>
              <p className="text-muted text-xs">
                Les calculs utilisent les <strong>jours ouvrables</strong> (sam-dim exclus)
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'avancement',
        title: 'Avancement → Statut auto',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Règles automatiques</p>
              <ul className="space-y-2 text-muted">
                <li className="flex items-start gap-2">
                  <span className="font-medium">Slider à 100%</span>
                  <span>→ Statut = "Terminé"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">Slider 1-99%</span>
                  <span>→ Statut = "En cours"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">Slider à 0%</span>
                  <span>→ Statut = "À faire"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-orange-500">Exception</span>
                  <span>
                    Si statut = "En attente" → <strong>inchangé</strong>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'jalons',
        title: 'Jalons',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Qu'est-ce qu'un jalon ?</p>
              <p className="text-muted">
                Une <strong>étape clé</strong> à atteindre dans une tâche. Permet de suivre les
                points de validation.
              </p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Créer un jalon</p>
              <ul className="space-y-1 text-muted">
                <li>
                  1. Cliquez sur <strong>"+ Jalon"</strong>
                </li>
                <li>
                  2. Saisissez le <strong>nom</strong>
                </li>
                <li>
                  3. Optionally ajoutez une <strong>date</strong>
                </li>
                <li>
                  4. Validez avec <strong>Entrée</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Modifier</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Clic sur le <strong>nom</strong> → modification inline
                </li>
                <li>
                  • Clic sur la <strong>date</strong> → calendrier
                </li>
                <li>
                  • Icône poubelle → <strong>supprimer</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Terminer</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Cochez la <strong>case</strong> → texte barré
                </li>
                <li>
                  • Disparaît du Dashboard après <strong>1 seconde</strong>
                </li>
                <li>
                  • Synchronisé avec <strong>Dashboard</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Tri automatique</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Sans date</strong>: en haut, réorganisables par{' '}
                  <strong>drag & drop</strong>
                </li>
                <li>
                  • <strong>Avec date</strong>: en bas, triés par <strong>date croissante</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Lien Dashboard ↔ Tâche</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Cocher dans le <strong>Dashboard</strong> → synchronisé ici
                </li>
                <li>
                  • Cocher ici → <strong>synchronisé dans Dashboard</strong>
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'champs',
        title: 'Champs disponibles',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-green-500/10 rounded">
              <p className="font-medium text-green-500 mb-1">Modifiables par Équipiers</p>
              <div className="grid grid-cols-2 gap-1 text-muted text-xs">
                <span>• Titre</span>
                <span>• Avancement (slider)</span>
                <span>• Description (rich text)</span>
                <span>• Date début</span>
                <span>• Date échéance</span>
                <span>• Durée (jours)</span>
                <span>• Priorité</span>
                <span>• Statut</span>
                <span>• Assigné à</span>
                <span>• Jalons</span>
              </div>
            </div>
            <div className="p-2 bg-orange-500/10 rounded">
              <p className="font-medium text-orange-500 mb-1">Lecture seule</p>
              <div className="grid grid-cols-2 gap-1 text-muted text-xs">
                <span>• Temps repère (Bibliothèque)</span>
                <span>• Tag (admin)</span>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  card: {
    title: 'Formulaire Carte',
    sections: [
      {
        id: 'utilisateurs',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Équipiers</span>
              <span className="text-muted">- Modification des cartes</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded">
              <span className="text-blue-500 font-medium">Référents</span>
              <span className="text-muted">- Création de modèles</span>
            </div>
          </div>
        ),
      },
      {
        id: 'impact',
        title: "Liens avec l'application",
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft size={14} className="text-muted" />
                <span className="font-medium text-primary">Données depuis</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Bibliothèque</strong>: temps repère (lecture)
                </li>
                <li>
                  • <strong>Paramètres</strong>: contacts
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Vers</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Dashboard</strong>: visible dans projets
                </li>
                <li>
                  • <strong>Planning</strong>: barre Gantt
                </li>
                <li>
                  • <strong>Catégories</strong>: enfants
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'regles',
        title: 'Règles automatiques',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Calcul des dates</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Date début + Durée</strong> → Date échéance auto
                </li>
                <li>
                  • <strong>Date échéance + Durée</strong> → Date début auto
                </li>
                <li>
                  • Jours <strong>ouvrables uniquement</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Structure</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Chapitre</strong>: filtrage dans Tâches
                </li>
                <li>
                  • <strong>Tâche parente</strong>: hiérarchie MS Project
                </li>
                <li>
                  • <strong>Prédécesseur</strong>: dépendance Gantt
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'champs',
        title: 'Champs disponibles',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-green-500/10 rounded">
              <p className="font-medium text-green-500 mb-1">Modifiables</p>
              <div className="grid grid-cols-2 gap-1 text-muted text-xs">
                <span>• Titre</span>
                <span>• Description</span>
                <span>• Dates</span>
                <span>• Durée</span>
                <span>• Chapitre</span>
                <span>• Tâche parente</span>
                <span>• Prédécesseur</span>
              </div>
            </div>
            <div className="p-2 bg-orange-500/10 rounded">
              <p className="font-medium text-orange-500 mb-1">Lecture seule</p>
              <span className="text-muted text-xs">• Temps repère</span>
            </div>
          </div>
        ),
      },
    ],
  },
  category: {
    title: 'Formulaire Catégorie',
    sections: [
      {
        id: 'utilisateurs',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Équipiers</span>
              <span className="text-muted">- Modification</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded">
              <span className="text-blue-500 font-medium">Référents</span>
              <span className="text-muted">- Création de modèles</span>
            </div>
          </div>
        ),
      },
      {
        id: 'impact',
        title: "Liens avec l'application",
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft size={14} className="text-muted" />
                <span className="font-medium text-primary">Hérite de</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Carte parente</strong>: couleur, paramètres
                </li>
                <li>
                  • <strong>Bibliothèque</strong>: temps repère
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Vers</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Tâches</strong>: priorité, dates héritées
                </li>
                <li>
                  • <strong>Dashboard</strong>: visible si tâches assignées
                </li>
                <li>
                  • <strong>Planning</strong>: barre
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'champs',
        title: 'Champs disponibles',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-green-500/10 rounded">
              <p className="font-medium text-green-500 mb-1">Modifiables</p>
              <div className="grid grid-cols-2 gap-1 text-muted text-xs">
                <span>• Titre</span>
                <span>• Description</span>
                <span>• Couleur</span>
                <span>• Priorité</span>
                <span>• Date</span>
                <span>• Assigné à</span>
                <span>• Catégorie parente</span>
              </div>
            </div>
            <div className="p-2 bg-orange-500/10 rounded">
              <p className="font-medium text-orange-500 mb-1">Lecture seule</p>
              <div className="grid grid-cols-2 gap-1 text-muted text-xs">
                <span>• Tag (admin)</span>
                <span>• Temps repère</span>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  library: {
    title: 'Bibliothèque',
    sections: [
      {
        id: 'utilisateurs',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded">
              <span className="text-blue-500 font-medium">Référents</span>
              <span className="text-muted">- Création et gestion des modèles</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Équipiers</span>
              <span className="text-muted">- Utilisation des modèles</span>
            </div>
          </div>
        ),
      },
      {
        id: 'onglets',
        title: '2 onglets',
        content: (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">1. Bibliothèque</p>
              <p className="text-muted">
                Gestion des modèles réutilisables (cartes, catégories, tâches).
              </p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">2. Contrats</p>
              <p className="text-muted">
                Tableau des marchés avec liens DOKI (N° Marché, Fournisseur, Dates...).
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'bibliotheque-detail',
        title: 'Onglet 1 - Bibliothèque',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Recherche et filtres</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Recherche par <strong>nom</strong> ou <strong>tags</strong>
                </li>
                <li>
                  • Filtrer par type :{' '}
                  <strong>tout/cartes/catégories/sous-catégories/favoris</strong>
                </li>
                <li>
                  • Tri : <strong>date, nom, nombre d'utilisations</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Sélection multiple</p>
              <ul className="space-y-1 text-muted">
                <li>• Cocher cartes, catégories, sous-catégories</li>
                <li>
                  • Options : <strong>avec enfants</strong> ou <strong>éléments seuls</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Favoris</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • Marquer avec <strong>étoile</strong>
                </li>
                <li>• Cascade : carte favorite → ses catégories et sous-catégories</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'contrats-detail',
        title: 'Onglet 2 - Contrats',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Colonnes du tableau</p>
              <div className="grid grid-cols-2 gap-1 text-muted text-xs">
                <span>• N° Marché</span>
                <span>• Acheteur</span>
                <span>• Entité Achat</span>
                <span>• Type Marché</span>
                <span>• Fournisseur</span>
                <span>• Début</span>
                <span>• Fin</span>
                <span>• Segment</span>
                <span>• Lien DOKI</span>
              </div>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Fonctionnalités</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Recherche globale</strong> dans tous les champs
                </li>
                <li>
                  • <strong>Tri</strong> par colonne (clic sur en-tête)
                </li>
                <li>
                  • Lien cliquable vers <strong>DOKI</strong>
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'impact',
        title: 'Liens avec les Projets',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Fournit aux Projets</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Temps repère</strong> pour cartes/tâches (durée indicative)
                </li>
                <li>
                  • <strong>Chapitres/Cartes/Catégories/Tâches</strong>
                </li>
                <li>
                  • <strong>Tags</strong> vers Paramètres et Revue d'activité
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft size={14} className="text-muted" />
                <span className="font-medium text-primary">Reçoit des Projets</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Projets existants</strong>: sauvegarder comme modèle
                </li>
                <li>
                  • <strong>Fichiers JSON</strong>: import de modèles
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'regles',
        title: 'Règles automatiques',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Templates</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Créer</strong> template à partir de sélection
                </li>
                <li>
                  • <strong>Exporter</strong> en JSON
                </li>
                <li>
                  • <strong>Importer</strong> depuis JSON
                </li>
                <li>• Sauvegarde automatique</li>
              </ul>
            </div>
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Application d'un modèle</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Fusion</strong> : ajouter sans remplacer l'existant
                </li>
                <li>
                  • <strong>Remplacement</strong> : remplace l'existant
                </li>
                <li>• Temps repère mis à jour sur tâches existantes</li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Hiérarchie des modèles</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Chapitre</strong> : regroupement de cartes
                </li>
                <li>
                  • <strong>Carte</strong> : projet complet avec catégories et tâches
                </li>
                <li>
                  • <strong>Catégorie</strong> : section d'une carte
                </li>
                <li>
                  • <strong>Sous-catégorie</strong> : tâche avec jalons optionnels
                </li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
  archives: {
    title: 'Archives',
    sections: [
      {
        id: 'utilisateurs',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Équipiers</span>
              <span className="text-muted">- Archivage et restauration</span>
            </div>
          </div>
        ),
      },
      {
        id: 'impact',
        title: "Liens avec l'application",
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeft size={14} className="text-muted" />
                <span className="font-medium text-primary">Depuis le Projet</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • Projets <strong>inactifs</strong> archivés
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Restauration vers</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted">
                <li>
                  • <strong>Projet</strong>: réactivation
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'actions',
        title: 'Actions',
        content: (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Restaurer</p>
              <p className="text-muted">Cliquez sur une carte archivée.</p>
            </div>
            <div className="p-2 bg-urgent/10 border border-urgent/30 rounded">
              <p className="font-medium text-urgent mb-1">Supprimer</p>
              <p className="text-muted">
                Action <strong>irréversible</strong>.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  userSettings: {
    title: 'Paramètres Utilisateur',
    sections: [
      {
        id: 'util',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Tous les utilisateurs</span>
            </div>
          </div>
        ),
      },
      {
        id: 'onglets',
        title: '3 onglets',
        content: (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Profil</p>
              <p className="text-muted text-xs">
                Nom (pour les échanges) et Fonction (tags visibles)
              </p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Favoris Bibliothèque</p>
              <p className="text-muted text-xs">Gestion des favoris</p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Sauvegarde</p>
              <p className="text-muted text-xs">Exporter/Importer JSON</p>
            </div>
          </div>
        ),
      },
      {
        id: 'liens',
        title: 'Liens avec les Projets',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight size={14} className="text-accent" />
                <span className="font-medium text-primary">Impact sur l'application</span>
              </div>
              <ul className="ml-6 space-y-1 text-muted text-xs">
                <li>
                  • <strong>Fonction</strong> : filtrage des tags dans Revue d'activité
                </li>
                <li>
                  • <strong>Nom</strong> : identification dans les @mentions
                </li>
                <li>
                  • <strong>Favoris</strong> : accès rapide aux modèles
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'regles',
        title: 'Règles automatiques',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Sauvegarde</p>
              <ul className="space-y-1 text-muted text-xs">
                <li>• Sauvegarde automatique des paramètres utilisateur</li>
                <li>• Export manuel en JSON</li>
                <li>• Import depuis JSON</li>
              </ul>
            </div>
            <div className="p-2 bg-accent/10 border border-accent/30 rounded">
              <p className="font-medium text-accent mb-2">Favoris Bibliothèque</p>
              <ul className="space-y-1 text-muted text-xs">
                <li>• Synchronisation automatique avec le Dashboard</li>
                <li>• Affichage prioritaire dans la Bibliothèque</li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
  userSettings: {
    title: 'Paramètres',
    sections: [
      {
        id: 'util',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
              <span className="text-green-500 font-medium">Tous les utilisateurs</span>
            </div>
          </div>
        ),
      },
      {
        id: 'onglets',
        title: '3 onglets',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Profil</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Nom</strong> : utilisé pour les échanges (@mention)
                </li>
                <li>
                  • <strong>Fonction</strong> : définit les tags visibles
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Favoris Bibliothèque</p>
              <ul className="space-y-1 text-muted">
                <li>• Gestion des favoris</li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Sauvegarde</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Exporter</strong> en JSON
                </li>
                <li>
                  • <strong>Importer</strong> depuis JSON
                </li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
  systemSettings: {
    title: 'Paramètres Système',
    sections: [
      {
        id: 'util',
        title: 'Utilisateurs',
        content: (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded">
              <span className="text-blue-500 font-medium">Référents ONLY</span>
            </div>
          </div>
        ),
      },
      {
        id: 'onglets',
        title: '5 onglets',
        content: (
          <div className="space-y-3 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Base de données</p>
              <ul className="space-y-1 text-muted">
                <li>
                  • <strong>Chapitres</strong> : drag &amp; drop
                </li>
                <li>
                  • <strong>GMR</strong> : code 4 caractères
                </li>
                <li>
                  • <strong>Catégories projets</strong>
                </li>
                <li>
                  • <strong>Zones</strong>
                </li>
                <li>
                  • <strong>Tags Revue d'activité</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Stockage</p>
              <p className="text-muted text-xs">À venir</p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-1">Sauvegarde auto</p>
              <p className="text-muted text-xs">À venir</p>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Modèles Bibliothèque</p>
              <ul className="space-y-1 text-muted">
                <li>• Arborescence des modèles</li>
                <li>• Import/Export JSON</li>
              </ul>
            </div>
            <div className="p-2 bg-card-hover rounded">
              <p className="font-medium text-primary mb-2">Contrats</p>
              <ul className="space-y-1 text-muted">
                <li>• Import CSV</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'liens',
        title: 'Liens avec Ressources',
        content: (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <ul className="space-y-1 text-muted text-xs">
                <li>
                  • <strong>Chapitres</strong> → filtrage des cartes
                </li>
                <li>
                  • <strong>GMR</strong> → Revue d'activité
                </li>
                <li>
                  • <strong>Zones</strong> → regroupement géographique
                </li>
                <li>
                  • <strong>Tags</strong> → filtrage par fonction
                </li>
                <li>
                  • <strong>Modèles</strong> → Bibliothèque
                </li>
                <li>
                  • <strong>Contrats</strong> → Ressources → Contrats
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'regles',
        title: 'Règles automatiques',
        content: (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-card-hover rounded">
              <ul className="space-y-1 text-muted text-xs">
                <li>• Synchronisation automatique des données</li>
                <li>• Tags mis à jour depuis Bibliothèque</li>
                <li>• Chapitres synchronisés avec Bibliothèque</li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
};

function GuidePanel() {
  const { toggleGuide, selectedCard, selectedCategory, selectedSubcategory } = useApp();
  const location = useLocation();
  const [selectedGuide, setSelectedGuide] = React.useState(null);

  const getCurrentGuide = () => {
    if (selectedGuide) {
      return pageGuides[selectedGuide];
    }
    if (location.pathname === '/') {
      return pageGuides.introduction;
    }
    if (selectedSubcategory) {
      return pageGuides.subcategory;
    }
    if (selectedCategory) {
      return pageGuides.category;
    }
    if (selectedCard) {
      return pageGuides.card;
    }

    const path = location.pathname;
    if (path.startsWith('/board') || path.startsWith('/board2')) {
      return pageGuides.board;
    }
    if (path === '/library') {
      return pageGuides.library;
    }
    if (path === '/archives') {
      return pageGuides.archives;
    }
    if (path === '/system-settings') {
      return pageGuides.systemSettings;
    }
    if (path === '/settings') {
      return pageGuides.userSettings;
    }
    return pageGuides.dashboard;
  };

  const currentGuide = getCurrentGuide();
  const firstSectionId = currentGuide?.sections[0]?.id;
  const [expandedSection, setExpandedSection] = React.useState(firstSectionId);

  const toggleSection = section => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const guideOptions = [
    { key: 'introduction', label: 'Guide D-ProjeTs' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'board', label: 'Projet' },
    { key: 'library', label: 'Bibliothèque' },
    { key: 'archives', label: 'Archives' },
    { key: 'userSettings', label: 'Paramètres' },
    { key: 'systemSettings', label: 'Paramètres Système' },
  ];

  const handleGuideChange = key => {
    if (key === 'introduction') {
      setSelectedGuide('introduction');
    } else {
      setSelectedGuide(key);
    }
  };

  return (
    <div className="guide-panel absolute right-0 top-14 w-[320px] h-[calc(100%-3.5rem)] bg-card border-l border-std flex flex-col z-40">
      <div className="flex items-center justify-between p-4 border-b border-std bg-card-hover">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />
          <select
            value={
              selectedGuide ||
              (location.pathname === '/'
                ? 'introduction'
                : location.pathname.startsWith('/board')
                  ? 'board'
                  : location.pathname === '/library'
                    ? 'library'
                    : location.pathname === '/archives'
                      ? 'archives'
                      : location.pathname === '/settings'
                        ? 'userSettings'
                        : location.pathname === '/system-settings'
                          ? 'systemSettings'
                          : 'dashboard')
            }
            onChange={e => handleGuideChange(e.target.value)}
            className="bg-card text-primary font-semibold cursor-pointer focus:outline-none rounded px-2 py-1 border border-std"
          >
            {guideOptions.map(opt => (
              <option key={opt.key} value={opt.key} className="bg-card text-primary">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={toggleGuide}
          className="p-1 text-muted hover:text-primary rounded hover:bg-card transition-std"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {currentGuide.sections.map(section => (
            <div key={section.id} className="border border-std rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2 p-3 bg-card-hover hover:bg-card-hover/70 transition-std text-left"
              >
                <span className="flex-1 font-medium text-primary">{section.title}</span>
                {expandedSection === section.id ? (
                  <ChevronDown size={16} className="text-muted" />
                ) : (
                  <ChevronRight size={16} className="text-muted" />
                )}
              </button>
              {expandedSection === section.id && (
                <div className="p-3 bg-card border-t border-std">{section.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-std bg-card-hover">
        <p className="text-xs text-muted text-center">Guide contextuel - Cliquez pour agrandir</p>
      </div>
    </div>
  );
}

export default GuidePanel;
