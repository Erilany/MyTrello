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

const DEFAULT_ROLES = [
  'Manager de projets',
  'Chargé(e) de Concertation',
  "Chargé(e) d'Etudes LA",
  "Chargé(e) d'Etudes LS",
  "Chargé(e) d'Etudes Poste HT",
  "Chargé(e) d'Etudes Poste BT et CC",
  "Chargé(e) d'Etudes SPC",
  'Contrôleur Travaux',
  'Assistant(e) Etudes',
];

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
  const [userRole, setUserRole] = useState(() => localStorage.getItem('mytrello-user-role') || '');
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
    { id: 'backup', label: 'Sauvegarde', icon: Download },
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Votre fonction
                  </label>
                  <select
                    value={userRole}
                    onChange={e => {
                      setUserRole(e.target.value);
                      localStorage.setItem('mytrello-user-role', e.target.value);
                    }}
                    className="w-full px-4 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">Sélectionner votre fonction...</option>
                    {DEFAULT_ROLES.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
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
            </>
          )}

          {activeTab === 'favorites' && <LibraryFavorites />}

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
        </div>
      </div>
    </div>
  );
}

export default Settings;
