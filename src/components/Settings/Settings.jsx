import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Save, Info } from 'lucide-react';

function Settings() {
  const { boards, currentBoard, updateBoard } = useApp();
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Only update form when currentBoard changes
    if (currentBoard) {
      setBoardTitle(currentBoard.title || '');
      setBoardDescription(currentBoard.description || '');
    }
  }, [currentBoard]);

  const handleSave = async () => {
    console.log('handleSave called', { currentBoard, boardTitle, boardDescription });
    if (currentBoard) {
      console.log('Updating board...', currentBoard.id);
      await updateBoard(currentBoard.id, boardTitle, boardDescription);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      console.log('No currentBoard!');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres</h1>

      {!currentBoard ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-gray-500">Sélectionnez un tableau dans la sidebar pour voir ses paramètres.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tableau actuel</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du tableau</label>
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={boardDescription}
              onChange={(e) => setBoardDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              console.log('Button clicked!');
              handleSave();
            }}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Save size={16} className="mr-2" />
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
        </div>
        )}

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">À propos</h2>
        
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium">MyTrello v0.1.0</p>
            <p className="text-sm text-gray-500 mt-1">
              Application de gestion de projets à 3 niveaux avec intégration Outlook, Gmail et commandes vocales.
            </p>
            <p className="text-sm text-gray-400 mt-3">
              Développé avec Electron + React
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Raccourcis clavier</h2>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Nouveau tableau</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + N</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Recharger</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + R</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Plein écran</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F11</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Outils de développement</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F12</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
