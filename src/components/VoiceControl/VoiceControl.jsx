import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import VoiceService from '../../services/voice';
import { Mic, MicOff, Volume2, X } from 'lucide-react';

function VoiceControl() {
  const { 
    createCard, 
    createCategory, 
    createSubcategory, 
    cards, 
    columns, 
    currentBoard,
    addComment,
    dbRun,
    setLibraryOpen
  } = useApp();
  
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState(null);
  const voiceServiceRef = useRef(null);

  useEffect(() => {
    voiceServiceRef.current = new VoiceService();
    
    voiceServiceRef.current.setOnListeningChange((listening) => {
      setIsListening(listening);
    });

    voiceServiceRef.current.setOnResult((result) => {
      setLastCommand(result);
      handleVoiceCommand(result);
    });

    voiceServiceRef.current.setOnError((error) => {
      console.error('Voice error:', error);
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

  const handleVoiceCommand = useCallback(async (command) => {
    if (!voiceServiceRef.current) return;

    const { action, params, original } = command;

    try {
      switch (action) {
        case 'activate':
          showNotification('En écoute...', 'info');
          break;

        case 'stop':
          voiceServiceRef.current.stop();
          showNotification('Arrêt de l\'écoute', 'info');
          break;

        case 'createCard':
          if (params.title && currentBoard) {
            const activeColumn = columns[0];
            if (activeColumn) {
              await createCard(activeColumn.id, params.title);
              showNotification(`Carte créée : ${params.title}`, 'success');
              voiceServiceRef.current.playSuccessSound();
            }
          }
          break;

        case 'createCategory':
          if (params.title && cards.length > 0) {
            const activeCard = cards[0];
            if (activeCard) {
              await createCategory(activeCard.id, params.title);
              showNotification(`Catégorie créée : ${params.title}`, 'success');
              voiceServiceRef.current.playSuccessSound();
            }
          }
          break;

        case 'createSubcategory':
          if (params.title) {
            showNotification('Veuillez sélectionner une catégorie d\'abord', 'info');
          }
          break;

        case 'openCard':
          showNotification(`Ouverture de "${params.name}"`, 'info');
          break;

        case 'setPriority':
          if (params.priority) {
            showNotification(`Priorité "${params.priority}" appliquée`, 'info');
          }
          break;

        case 'setAssignee':
          if (params.name) {
            showNotification(`Assigné à "${params.name}"`, 'info');
          }
          break;

        case 'archiveCard':
          showNotification('Carte archivée', 'info');
          break;

        case 'addComment':
          if (params.text && cards.length > 0) {
            await addComment('card', cards[0].id, params.text);
            showNotification('Commentaire ajouté', 'success');
            voiceServiceRef.current.playSuccessSound();
          }
          break;

        case 'openLibrary':
          setLibraryOpen(true);
          showNotification('Bibliothèque ouverte', 'info');
          break;

        case 'help':
          setShowHelp(true);
          break;

        case 'cancel':
          showNotification('Action annulée', 'info');
          break;

        case 'repeat':
          if (lastCommand) {
            handleVoiceCommand(lastCommand);
          }
          break;

        case 'unknown':
        default:
          showNotification('Commande non reconnue', 'error');
          break;
      }

      await dbRun(
        'INSERT INTO voice_history (command, action, status) VALUES (?, ?, ?)',
        [original, action, action === 'unknown' ? 'unknown' : 'success']
      );
    } catch (error) {
      console.error('Error executing command:', error);
      showNotification('Erreur lors de l\'exécution', 'error');
    }
  }, [cards, columns, currentBoard, createCard, createCategory, createSubcategory, addComment, dbRun, lastCommand, setLibraryOpen, showNotification]);

  const toggleListening = () => {
    if (!voiceServiceRef.current) return;

    if (isListening) {
      voiceServiceRef.current.stop();
    } else {
      voiceServiceRef.current.start();
    }
  };

  const helpCommands = [
    { cmd: 'Hey MyTrello / Écoute', desc: 'Activer l\'écoute' },
    { cmd: 'Stop / Pause', desc: 'Désactiver l\'écoute' },
    { cmd: 'Créer une carte [nom]', desc: 'Créer une carte' },
    { cmd: 'Créer une catégorie [nom]', desc: 'Créer une catégorie' },
    { cmd: 'Ouvrir carte [nom]', desc: 'Ouvrir une carte' },
    { cmd: 'Fermer carte', desc: 'Fermer la modal' },
    { cmd: 'Taguer [priorité]', desc: 'Définir la priorité' },
    { cmd: 'Assigner à [nom]', desc: 'Assigner la tâche' },
    { cmd: 'Archiver carte', desc: 'Archiver la carte' },
    { cmd: 'Ajouter commentaire [texte]', desc: 'Ajouter un commentaire' },
    { cmd: 'Ouvrir la bibliothèque', desc: 'Ouvrir la bibliothèque' },
    { cmd: 'Aide', desc: 'Afficher les commandes' },
    { cmd: 'Annuler', desc: 'Annuler l\'action' },
  ];

  return (
    <>
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex flex-col items-end space-y-2">
          {isListening && (
            <div className="bg-white rounded-lg shadow-lg p-3 animate-pulse">
              <p className="text-sm text-blue-600 font-medium">En écoute...</p>
              {lastCommand && (
                <p className="text-xs text-gray-500 mt-1">"{lastCommand.original}"</p>
              )}
            </div>
          )}

          {showHelp && (
            <div className="bg-white rounded-lg shadow-lg p-4 w-72 max-h-80 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">Commandes vocales</h3>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <ul className="space-y-1">
                {helpCommands.map((item, index) => (
                  <li key={index} className="text-xs">
                    <span className="font-medium text-blue-600">{item.cmd}</span>
                    <span className="text-gray-500"> - {item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-2 rounded-full ${showHelp ? 'bg-blue-100' : 'bg-gray-100'} hover:bg-gray-200 transition-colors`}
            title="Aide"
          >
            <Volume2 size={20} className="text-gray-600" />
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
