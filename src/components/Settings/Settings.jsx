import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Save,
  Info,
  Palette,
  RotateCcw,
  Download,
  Upload,
  User,
  Star,
  Settings as SettingsIcon,
} from 'lucide-react';
import LibraryFavorites from './LibraryFavorites';

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
    currentUsername,
    setUsername,
  } = useApp();
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [localColors, setLocalColors] = useState(cardColors);
  const [username, setUsernameLocal] = useState(currentUsername || '');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    setLocalColors(cardColors);
  }, [cardColors]);

  useEffect(() => {
    if (currentBoard) {
      setBoardTitle(currentBoard.title || '');
      setBoardDescription(currentBoard.description || '');
    }
  }, [currentBoard]);

  const handleSave = async () => {
    if (currentBoard) {
      await updateBoard(currentBoard.id, boardTitle, boardDescription);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'favorites', label: 'Favoris Bibliothèque', icon: Star },
    { id: 'colors', label: 'Couleurs', icon: Palette },
    { id: 'backup', label: 'Sauvegarde', icon: Download },
    { id: 'about', label: 'À propos', icon: Info },
  ];

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-bold text-primary mb-6 flex items-center">
        <SettingsIcon size={28} className="mr-2" />
        Paramètres utilisateurs
      </h1>

      <div className="bg-card rounded-lg border border-std min-h-[calc(100vh-180px)]">
        <div className="flex border-b border-std">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 transition-std ${
                  isActive
                    ? 'bg-card border-b-2 border-b-accent text-accent'
                    : 'text-secondary hover:bg-card-hover'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <>
              <div className="bg-card rounded-lg border border-std p-6 mb-6">
                <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <User size={20} className="mr-2" />
                  Profil
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Votre nom (pour les échanges)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsernameLocal(e.target.value)}
                    placeholder="Entrez votre nom"
                    className="w-full px-4 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  onClick={() => {
                    setUsername(username);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                  className="flex items-center px-4 py-2 text-sm bg-accent text-white rounded hover:opacity-90"
                >
                  <Save size={14} className="mr-2" />
                  Enregistrer
                </button>
              </div>

              <div className="bg-card rounded-lg border border-std p-6 mb-6">
                <h2 className="text-lg font-semibold text-primary mb-4">Projet actuel</h2>
                {!currentBoard ? (
                  <p className="text-secondary">
                    Sélectionnez un projet dans la sidebar pour voir ses paramètres.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">
                        Nom du projet
                      </label>
                      <input
                        type="text"
                        value={boardTitle}
                        onChange={e => setBoardTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">
                        Description
                      </label>
                      <textarea
                        value={boardDescription}
                        onChange={e => setBoardDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                    >
                      <Save size={16} className="mr-2" />
                      {saved ? 'Enregistré !' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'favorites' && <LibraryFavorites />}

          {activeTab === 'colors' && (
            <div className="bg-card rounded-lg border border-std p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary">Couleurs des cartes</h2>
                <button
                  onClick={handleResetColors}
                  className="flex items-center px-3 py-1.5 text-sm text-secondary hover:bg-card-hover rounded-lg transition-colors"
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  Réinitialiser
                </button>
              </div>
              <p className="text-sm text-secondary mb-4">
                Les couleurs des cartes dépendent du <strong>nom de la colonne</strong>.
              </p>
              <div className="space-y-4">
                {colorTypes.map(({ key, label, keywords }) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="text-sm font-medium text-primary">{label}</span>
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
                      <span className="text-secondary">→</span>
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
                        className="w-full px-2 py-1 text-xs bg-input border border-std rounded text-primary"
                        placeholder="mot-clé1, mot-clé2"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSaveColors}
                className="flex items-center px-4 py-2 mt-4 bg-accent text-white rounded-lg hover:opacity-90"
              >
                <Save size={16} className="mr-2" />
                {saved ? 'Enregistré !' : 'Enregistrer les couleurs'}
              </button>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="bg-card rounded-lg border border-std p-6">
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
                Exporter vos données en fichier JSON pour sauvegarder ou transférer votre projet.
              </p>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-card rounded-lg border border-std p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">À propos</h2>
              <div className="flex items-start gap-3">
                <Info size={20} className="text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-primary">MyTrello</p>
                  <p className="text-sm text-secondary mt-1">
                    Application de gestion de projets à 3 niveaux avec intégration Outlook, Gmail et
                    commandes vocales.
                  </p>
                  <p className="text-sm text-secondary mt-3">Développé avec Electron + React</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
