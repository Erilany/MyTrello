import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import VoiceService from '../../services/voice';
import { Mic, MicOff, Volume2, X } from 'lucide-react';

function VoiceControl() {
  const navigate = useNavigate();
  const {
    createCard,
    createCategory,
    createSubcategory,
    cards,
    columns,
    currentBoard,
    addComment,
    setLibraryOpen,
    archiveCard,
    updateCard,
    setSelectedCard,
    deleteCard,
    deleteCategory,
    updateCategory,
    deleteSubcategory,
    setSelectedSubcategory,
    setActiveTab,
    categories,
    setSearchOpen,
    searchOpen,
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [displayedTranscript, setDisplayedTranscript] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState(null);
  const displayTimeoutRef = useRef(null);
  const voiceServiceRef = useRef(null);

  useEffect(() => {
    voiceServiceRef.current = new VoiceService();

    voiceServiceRef.current.setOnListeningChange(listening => {
      setIsListening(listening);
    });

    voiceServiceRef.current.setOnResult(result => {
      setLastCommand(result);
      setDisplayedTranscript(result.original || '');
      if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = setTimeout(() => setDisplayedTranscript(''), 3000);
      handleVoiceCommand(result);
    });

    voiceServiceRef.current.setOnError(error => {
      console.error('Voice error:', error);
      let message = 'Erreur de reconnaissance vocale';
      if (error === 'network') {
        message = 'Erreur réseau - Vérifiez votre connexion internet';
      } else if (error === 'not-allowed') {
        message = 'Microphone non autorisé - Vérifiez les permissions';
      } else if (error === 'no-speech') {
        message = 'Aucune parole détectée';
      }
      showNotification(message, 'error');
    });

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
    };
  }, []);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Fonction pour trouver une carte par son nom
  const findCardByName = useCallback(
    name => {
      const searchTerm = name.toLowerCase();
      return cards.find(card => card.title && card.title.toLowerCase().includes(searchTerm));
    },
    [cards]
  );

  // Fonction pour trouver une catégorie par son nom
  const findCategoryByName = useCallback(
    name => {
      const searchTerm = name.toLowerCase();
      return categories.find(cat => cat.title && cat.title.toLowerCase().includes(searchTerm));
    },
    [categories]
  );

  // Fonction pour trouver une colonne par son nom
  const findColumnByName = useCallback(
    name => {
      const searchTerm = name.toLowerCase();
      // Essayer de trouver une colonne correspondante
      if (searchTerm.includes('attente') || searchTerm.includes('en attente')) {
        return columns.find(col => col.title.toLowerCase().includes('attente'));
      }
      if (searchTerm.includes('cours') || searchTerm.includes('en cours')) {
        return columns.find(col => col.title.toLowerCase().includes('cours'));
      }
      if (searchTerm.includes('termine') || searchTerm.includes('terminé')) {
        return columns.find(col => col.title.toLowerCase().includes('termine'));
      }
      return columns[0]; // Par défaut, retourne la première colonne
    },
    [columns]
  );

  const handleVoiceCommand = useCallback(
    async command => {
      if (!voiceServiceRef.current) return;

      const { action, params, original } = command;

      try {
        switch (action) {
          case 'activate':
            if (!isListening) {
              voiceServiceRef.current.start();
              showNotification('En écoute...', 'info');
            }
            break;

          case 'stop':
            voiceServiceRef.current.stop();
            showNotification("Arrêt de l'écoute", 'info');
            break;

          // CRÉER UNE CARTE - Implémenté correctement
          case 'createCard':
            if (params.title && currentBoard) {
              let targetColumn = columns[0];

              // Si l'utilisateur a mentionné une colonne
              if (params.column) {
                const foundColumn = findColumnByName(params.column);
                if (foundColumn) targetColumn = foundColumn;
              }

              if (targetColumn) {
                await createCard(targetColumn.id, params.title);
                showNotification(`Carte créée : ${params.title}`, 'success');
                voiceServiceRef.current.playSuccessSound();
              } else {
                showNotification('Aucune colonne trouvée', 'error');
              }
            } else if (!currentBoard) {
              showNotification('Aucun projet sélectionné', 'error');
            }
            break;

          // CRÉER UNE CATÉGORIE - Implémenté correctement
          case 'createCategory':
            if (params.title && cards.length > 0) {
              let targetCard = cards[0];

              // Si l'utilisateur a mentionné une carte
              if (params.cardName) {
                const foundCard = findCardByName(params.cardName);
                if (foundCard) targetCard = foundCard;
              }

              if (targetCard) {
                await createCategory(targetCard.id, params.title);
                showNotification(`Catégorie créée : ${params.title}`, 'success');
                voiceServiceRef.current.playSuccessSound();
              }
            } else if (cards.length === 0) {
              showNotification('Aucune carte dans ce projet', 'error');
            }
            break;

          // OUVRIR UNE CARTE - Implémenté correctement
          case 'openCard':
            if (params.name) {
              const card = findCardByName(params.name);
              if (card) {
                setSelectedCard(card);
                showNotification(`Carte "${card.title}" ouverte`, 'success');
                voiceServiceRef.current.playSuccessSound();
              } else {
                showNotification(`Carte "${params.name}" non trouvée`, 'error');
              }
            }
            break;

          // FERMER - Ferme la modal actuellement ouverte
          case 'close':
            setSelectedCard(null);
            setSelectedSubcategory(null);
            showNotification('Fermé', 'info');
            break;

          // DÉFINIR PRIORITÉ - Implémenté correctement
          case 'setPriority':
            if (params.priority) {
              let targetCard = cards[0];
              if (params.cardName) {
                const foundCard = findCardByName(params.cardName);
                if (foundCard) targetCard = foundCard;
              }

              // Mapper les priorités parlées vers les valeurs attendues
              const priorityMap = {
                urgent: 'urgent',
                haute: 'high',
                basse: 'low',
                normal: 'normal',
                terminé: 'done',
                termine: 'done',
              };
              const priorityValue = priorityMap[params.priority.toLowerCase()] || params.priority;

              if (targetCard) {
                await updateCard(targetCard.id, { priority: priorityValue });
                showNotification(
                  `Priorité "${params.priority}" appliquée à "${targetCard.title}"`,
                  'success'
                );
                voiceServiceRef.current.playSuccessSound();
              }
            }
            break;

          // ASSIGNE - Implémenté correctement
          case 'setAssignee':
            if (params.name) {
              let targetCard = cards[0];
              if (params.cardName) {
                const foundCard = findCardByName(params.cardName);
                if (foundCard) targetCard = foundCard;
              }

              if (targetCard) {
                await updateCard(targetCard.id, { assignee: params.name });
                showNotification(`Assigné à "${params.name}" sur "${targetCard.title}"`, 'success');
                voiceServiceRef.current.playSuccessSound();
              }
            }
            break;

          // ARCHIVER - Implémenté correctement
          case 'archiveCard':
            let cardToArchive = cards[0];
            if (params.cardName) {
              const foundCard = findCardByName(params.cardName);
              if (foundCard) cardToArchive = foundCard;
            }

            if (cardToArchive) {
              await archiveCard(cardToArchive.id);
              showNotification(`Carte "${cardToArchive.title}" archivée`, 'success');
              voiceServiceRef.current.playSuccessSound();
            }
            break;

          // SUPPRIMER - Supprime une carte ou catégorie
          case 'delete':
            if (params.target === 'card' && params.name) {
              const cardToDelete = findCardByName(params.name);
              if (cardToDelete) {
                await deleteCard(cardToDelete.id);
                showNotification(`Carte "${cardToDelete.title}" supprimée`, 'success');
                voiceServiceRef.current.playSuccessSound();
              }
            } else if (params.target === 'categorie' && params.name) {
              const categoryToDelete = findCategoryByName(params.name);
              if (categoryToDelete) {
                await deleteCategory(categoryToDelete.id);
                showNotification(`Catégorie "${categoryToDelete.title}" supprimée`, 'success');
                voiceServiceRef.current.playSuccessSound();
              }
            }
            break;

          // AJOUTER UN COMMENTAIRE - Fonctionne
          case 'addComment':
            if (params.text) {
              let targetCard = cards[0];
              if (params.cardName) {
                const foundCard = findCardByName(params.cardName);
                if (foundCard) targetCard = foundCard;
              }

              if (targetCard) {
                await addComment('card', targetCard.id, params.text);
                showNotification('Commentaire ajouté', 'success');
                voiceServiceRef.current.playSuccessSound();
              }
            }
            break;

          // OUVRIR LA BIBLIOTHÈQUE - Fonctionne
          case 'openLibrary':
            setLibraryOpen(true);
            navigate('/library');
            showNotification('Bibliothèque ouverte', 'info');
            break;

          // NAVIGATION - Avec ou sans onglet
          case 'navigate': {
            const dest = params.destination?.toLowerCase() || '';
            const tabId = params.tab;


            if (dest.includes('dashboard') || dest === 'accueil') {
              navigate('/');
              if (tabId) setActiveTab(tabId);
              showNotification(tabId ? `Dashboard onglet ${tabId}` : 'Dashboard ouvert', 'info');
            } else if (dest.includes('projet') || dest.includes('board')) {
              const targetPath = currentBoard ? `/board/${currentBoard.id}` : '/board';
              navigate(targetPath);
              if (tabId) setActiveTab(tabId);
              showNotification(tabId ? `Board onglet ${tabId}` : 'Board ouvert', 'info');
            } else if (dest.includes('bibliothèque') || dest.includes('library')) {
              navigate('/library');
              setLibraryOpen(true);
              showNotification('Bibliothèque ouverte', 'info');
            } else if (dest.includes('archive')) {
              navigate('/archives');
              showNotification('Archives ouvertes', 'info');
            } else if (dest.includes('paramètre') || dest.includes('setting')) {
              navigate('/settings');
              showNotification('Paramètres ouverts', 'info');
            }
            break;
          }

          case 'navigateWithTab':
            break;

          // AIDE
          case 'help':
            setShowHelp(true);
            break;

          // ANNULER
          case 'cancel':
            showNotification('Action annulée', 'info');
            break;

          // RÉPÉTER
          case 'repeat':
            if (lastCommand) {
              handleVoiceCommand(lastCommand);
            }
            break;

          // OUVRIR SOUS-CATÉGORIE
          case 'openSubcategory':
            if (params.name) {
              // Chercher dans les catégories et sous-catégories
              const cats = categories.filter(
                c => c.title && c.title.toLowerCase().includes(params.name.toLowerCase())
              );
              if (cats.length > 0) {
                setSelectedCategory(cats[0]);
                showNotification(`Catégorie "${cats[0].title}" sélectionnée`, 'info');
              }
            }
            break;

          // RECHERCHE - Phase 3: Commandes de recherche
          case 'search':
            if (params.query) {
              setSearchOpen(true);
              showNotification(`Recherche: "${params.query}"`, 'info');
              // La recherche sera effectuée via le panneau de recherche
            }
            break;

          // PLANNING - Phase 3: Commandes Planning
          case 'planningCommand':
            if (params.action) {
              const action = params.action.toLowerCase();
              setActiveTab('planning');

              if (action.includes('semaine') || action.includes('semain')) {
                showNotification('Vue semaine activée - Utilisez le panneau pour naviguer', 'info');
              } else if (action.includes('mois') || action.includes('moi')) {
                showNotification('Vue mois activée - Utilisez le panneau pour naviguer', 'info');
              } else if (action.includes('aujourd') || action.includes('jour')) {
                showNotification("Aller à aujourd'hui", 'info');
              } else if (action.includes('zoom') || action.includes('zoom avant')) {
                showNotification('Zoom avant', 'info');
              } else if (action.includes('zoom arrière') || action.includes('dézoom')) {
                showNotification('Zoom arrière', 'info');
              } else {
                showNotification(`Planning: ${params.action}`, 'info');
              }
            }
            break;

          // SETTINGS - Phase 3: Commandes Paramètres
          case 'settingsCommand':
            if (params.section) {
              const section = params.section.toLowerCase();
              navigate('/settings');

              if (section.includes('utilisateur') || section.includes('user')) {
                showNotification('Paramètres utilisateur', 'info');
              } else if (section.includes('projet') || section.includes('board')) {
                showNotification('Paramètres des projets', 'info');
              } else if (section.includes('couleur') || section.includes('color')) {
                showNotification('Paramètres des couleurs', 'info');
              } else if (section.includes('système') || section.includes('system')) {
                navigate('/system-settings');
                showNotification('Paramètres système', 'info');
              } else {
                showNotification(`Paramètres: ${params.section}`, 'info');
              }
            }
            break;

          // DASHBOARD - Phase 3: Commandes Dashboard
          case 'dashboardCommand':
            if (params.filter) {
              const filter = params.filter.toLowerCase();

              if (filter.includes('jalon') || filter.includes('milestone')) {
                setActiveTab('taches');
                showNotification('Filtrer sur les jalons', 'info');
              } else if (filter.includes('tâche') || filter.includes('task')) {
                showNotification('Filtrer sur les tâches', 'info');
              } else if (filter.includes('temps')) {
                showNotification('Afficher le temps passé', 'info');
              } else if (filter.includes('tout') || filter.includes('tout afficher')) {
                showNotification('Afficher tout', 'info');
              } else {
                showNotification(`Filtre Dashboard: ${params.filter}`, 'info');
              }
            }
            break;

          // OUVRIR PARAMÈTRES
          case 'openSettings':
            navigate('/settings');
            showNotification('Paramètres ouverts', 'info');
            break;

          // OUVRIR RECHERCHE
          case 'openSearch':
            setSearchOpen(true);
            showNotification('Panneau de recherche ouvert', 'info');
            break;

          // COMMANDES INCONNUES
          case 'unknown':
          default:
            showNotification('Commande non reconnue', 'error');
            break;
        }
      } catch (error) {
        console.error('Error executing command:', error);
        showNotification("Erreur lors de l'exécution: " + error.message, 'error');
      }
    },
    [
      cards,
      columns,
      currentBoard,
      createCard,
      createCategory,
      createSubcategory,
      addComment,
      lastCommand,
      setLibraryOpen,
      archiveCard,
      updateCard,
      setSelectedCard,
      deleteCard,
      deleteCategory,
      findCardByName,
      findCategoryByName,
      findColumnByName,
      navigate,
      setSelectedSubcategory,
      setActiveTab,
      categories,
      setSearchOpen,
    ]
  );

  const toggleListening = () => {
    if (!voiceServiceRef.current) return;

    if (isListening) {
      voiceServiceRef.current.stop();
    } else {
      voiceServiceRef.current.start();
    }
  };

  const helpCommands = [
    // Commandes de base
    { cmd: 'Hey C-PROJETS / Écoute', desc: "Activer l'écoute" },
    { cmd: 'Stop / Pause', desc: "Désactiver l'écoute" },
    { cmd: 'Aide', desc: 'Afficher les commandes' },
    { cmd: 'Annule', desc: "Annuler l'action" },
    { cmd: 'Répète', desc: 'Répéter la dernière commande' },

    // Gestion des cartes
    { cmd: 'Crée une carte [nom]', desc: 'Créer une carte' },
    { cmd: 'Crée une carte [nom] colonne [colonne]', desc: 'Créer dans une colonne spécifique' },
    { cmd: 'Ouvre [nom de la carte]', desc: 'Ouvrir une carte' },
    { cmd: 'Ferme', desc: 'Fermer la modal' },
    { cmd: 'Archive', desc: 'Archiver la carte active' },
    { cmd: 'Supprime [carte/catégorie] [nom]', desc: 'Supprimer un élément' },

    // Catégories et sous-catégories
    { cmd: 'Crée une catégorie [nom]', desc: 'Créer une catégorie' },
    { cmd: 'Ouvre [nom de la catégorie]', desc: 'Ouvrir une sous-catégorie' },

    // Propriétés des tâches
    { cmd: 'Priorité [urgent/haute/basse/normal]', desc: 'Définir la priorité' },
    { cmd: 'Assigne à [nom]', desc: 'Assigner la tâche' },
    { cmd: 'Ajoute un commentaire [texte]', desc: 'Ajouter un commentaire' },

    // Navigation
    { cmd: 'Ouvre le dashboard', desc: 'Ouvrir le Dashboard' },
    { cmd: 'Ouvre revue activité', desc: 'Revue activité' },
    { cmd: 'Ouvre mes tâches', desc: 'Mes tâches' },
    { cmd: 'Ouvre temps passé', desc: 'Temps passé' },
    { cmd: 'Ouvre le projet', desc: 'Ouvrir le Board projet' },
    { cmd: 'Ouvre les tâches', desc: 'Onglet Tâches du Board' },
    { cmd: 'Ouvre les commandes', desc: 'Onglet Commandes du Board' },
    { cmd: 'Ouvre le planning', desc: 'Ouvrir le Planning' },
    { cmd: 'Ouvre les échanges', desc: 'Onglet Échanges du Board' },
    { cmd: 'Ouvre les informations', desc: 'Onglet Informations du Board' },
    { cmd: 'Ouvre la bibliothèque', desc: 'Ouvrir la Bibliothèque' },
    { cmd: 'Ouvre les archives', desc: 'Ouvrir les Archives' },
    { cmd: 'Ouvre les paramètres', desc: 'Ouvrir les Paramètres' },

    // Recherche
    { cmd: 'Recherche [terme]', desc: 'Effectuer une recherche' },
    { cmd: 'Ouvre la recherche', desc: 'Ouvrir le panneau de recherche' },

    // Bibliothèque
    { cmd: 'Ouvre la bibliothèque', desc: 'Ouvrir la bibliothèque' },

    // Planning (Phase 3)
    { cmd: 'Planning semaine', desc: 'Basculer en vue semaine' },
    { cmd: 'Planning mois', desc: 'Basculer en vue mois' },
    { cmd: "Va à aujourd'hui", desc: 'Aller à la date du jour' },
    { cmd: 'Zoom avant', desc: 'Zoomer sur le planning' },
    { cmd: 'Zoom arrière', desc: 'Dézoomer sur le planning' },

    // Paramètres (Phase 3)
    { cmd: 'Paramètres utilisateur', desc: 'Ouvrir les paramètres utilisateur' },
    { cmd: 'Paramètres couleurs', desc: 'Ouvrir les paramètres de couleurs' },
    { cmd: 'Paramètres système', desc: 'Ouvrir les paramètres système' },

    // Dashboard (Phase 3)
    { cmd: 'Dashboard jalons', desc: 'Afficher les jalons' },
    { cmd: 'Dashboard tâches', desc: 'Afficher les tâches' },
    { cmd: 'Dashboard temps', desc: 'Afficher le temps passé' },
    { cmd: 'Dashboard tout', desc: 'Afficher tout' },
  ];

  return (
    <>
      {notification && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500'
              : notification.type === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex flex-col items-end space-y-2">
          {isListening && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 animate-pulse border dark:border-gray-700">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">En écoute...</p>
              {displayedTranscript && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  "{displayedTranscript}"
                </p>
              )}
            </div>
          )}

          {showHelp && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto border dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm dark:text-white">Commandes vocales</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="space-y-1">
                {helpCommands.map((item, index) => (
                  <li key={index} className="text-xs">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{item.cmd}</span>
                    <span className="text-gray-500 dark:text-gray-400"> - {item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-2 rounded-full ${showHelp ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'} hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
            title="Aide"
          >
            <Volume2 size={20} className="text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={toggleListening}
            className={`p-3 rounded-full shadow-lg transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            title={isListening ? 'Désactiver' : 'Activer'}
          >
            {isListening ? (
              <Mic size={24} className="text-white" />
            ) : (
              <MicOff size={24} className="text-white" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default VoiceControl;
