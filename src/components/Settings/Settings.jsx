import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Save, Info, Palette, RotateCcw, Download, Upload } from 'lucide-react';

function Settings() {
  const {
    boards,
    currentBoard,
    updateBoard,
    cardColors,
    updateCardColors,
    resetCardColors,
    exportData,
    importData,
  } = useApp();
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [localColors, setLocalColors] = useState(cardColors);

  useEffect(() => {
    setLocalColors(cardColors);
  }, [cardColors]);

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

  const handleColorChange = (key, colorIndex, newColor) => {
    const newColors = {
      ...localColors,
      [key]: {
        ...localColors[key],
        gradient: [
          ...localColors[key].gradient.slice(0, colorIndex),
          newColor,
          ...localColors[key].gradient.slice(colorIndex + 1),
        ],
      },
    };
    setLocalColors(newColors);
  };

  const handleSaveColors = async () => {
    await updateCardColors(localColors);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetColors = async () => {
    await resetCardColors();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    exportData();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async event => {
          const result = importData(event.target.result);
          if (result.success) {
            alert('Données importées avec succès !');
            window.location.reload();
          } else {
            alert("Erreur lors de l'importation: " + result.error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const colorTypes = [
    { key: 'etudes', label: 'Études', keywords: localColors.etudes?.keywords?.join(', ') || '' },
    {
      key: 'enCours',
      label: 'En cours',
      keywords: localColors.enCours?.keywords?.join(', ') || '',
    },
    { key: 'realise', label: 'Réalisé', keywords: localColors.realise?.keywords?.join(', ') || '' },
    { key: 'archive', label: 'Archivé', keywords: localColors.archive?.keywords?.join(', ') || '' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-primary mb-6">Paramètres utilisateurs</h1>

      <div className="bg-card rounded-lg border border-std p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Sauvegarde</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1.5 text-sm bg-accent text-white rounded hover:opacity-90"
            >
              <Download size={14} className="mr-2" />
              Exporter
            </button>
            <button
              onClick={handleImport}
              className="flex items-center px-3 py-1.5 text-sm bg-card hover:bg-card-hover border border-std rounded"
            >
              <Upload size={14} className="mr-2" />
              Importer
            </button>
          </div>
        </div>
        <p className="text-sm text-secondary">
          Exporter vos données en fichier JSON pour sauvegarder ou transférer votre projet. Importer
          un fichier JSON pour restaurer vos données.
        </p>
      </div>

      {!currentBoard ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-500 dark:text-gray-400">
            Sélectionnez un projet dans la sidebar pour voir ses paramètres.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Projet actuel
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du projet
              </label>
              <input
                type="text"
                value={boardTitle}
                onChange={e => setBoardTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={boardDescription}
                onChange={e => setBoardDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={e => {
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Couleurs des cartes
          </h2>
          <button
            onClick={handleResetColors}
            className="flex items-center px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Réinitialiser
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Les couleurs des cartes dépendent du <strong>nom de la colonne</strong>. Modifier un
          mot-clé changera la couleur de toutes les cartes dans les colonnes contenant ce mot.
        </p>

        <div className="space-y-4">
          {colorTypes.map(({ key, label, keywords }) => (
            <div key={key} className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </span>
              </div>
              <div
                className="w-8 h-8 rounded-md flex-shrink-0"
                style={{
                  background: `linear-gradient(90deg, ${localColors[key]?.gradient?.[0]}, ${localColors[key]?.gradient?.[1]})`,
                }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localColors[key]?.gradient?.[0] || '#000000'}
                  onChange={e => handleColorChange(key, 0, e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded border-0"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="color"
                  value={localColors[key]?.gradient?.[1] || '#000000'}
                  onChange={e => handleColorChange(key, 1, e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded border-0"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={keywords}
                  onChange={e =>
                    setLocalColors({
                      ...localColors,
                      [key]: {
                        ...localColors[key],
                        keywords: e.target.value
                          .split(',')
                          .map(k => k.trim())
                          .filter(k => k),
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                  placeholder="mot-clé1, mot-clé2"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveColors}
          className="flex items-center px-4 py-2 mt-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Save size={16} className="mr-2" />
          {saved ? 'Enregistré !' : 'Enregistrer les couleurs'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">À propos</h2>

        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium dark:text-white">MyTrello v0.1.0</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Application de gestion de projets à 3 niveaux avec intégration Outlook, Gmail et
              commandes vocales.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
              Développé avec Electron + React
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Raccourcis clavier
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Nouveau projet</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
              Ctrl + N
            </kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Recharger</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
              Ctrl + R
            </kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Plein écran</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
              F11
            </kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Outils de développement</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
              F12
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
