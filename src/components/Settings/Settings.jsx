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
  GitMerge,
  Search,
  Plus,
  X,
  Users,
  Trash2,
} from 'lucide-react';
import LibraryFavorites from './LibraryFavorites';
import { useDataMerge } from '../../hooks/useDataMerge';
import { loadFunctionsFromAllProjects } from '../../data/FunctionsData';

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
    username,
    setUsername,
    filterMyProjects,
    setFilterMyProjects,
    showTagOnCard,
    setShowTagOnCard,
    searchUsers,
    addNewUser,
    formatUserName,
    usersList,
    setUsersList,
    getUsers,
  } = useApp();
  const [userRole, setUserRole] = useState(() => localStorage.getItem('c-projets-user-role') || '');
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [localColors, setLocalColors] = useState(cardColors);
  const [localUsername, setLocalUsername] = useState(username || '');
  const [activeTab, setActiveTab] = useState('profile');
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [showNewUserInput, setShowNewUserInput] = useState(false);
  const allRoles = loadFunctionsFromAllProjects();

  const getContactsForBoard = boardId => {
    const defaultContacts = [
      { id: 1, title: 'Manager de projets' },
      { id: 2, title: 'Chargé(e) de Concertation' },
      { id: 3, title: "Chargé(e) d'Etudes LA" },
      { id: 4, title: "Chargé(e) d'Etudes LS" },
      { id: 5, title: "Chargé(e) d'Etudes Poste HT" },
      { id: 6, title: "Chargé(e) d'Etudes Poste BT et CC" },
      { id: 7, title: "Chargé(e) d'Etudes SPC" },
      { id: 8, title: 'Contrôleur Travaux' },
      { id: 9, title: 'Assistant(e) Etudes' },
    ];
    const saved = localStorage.getItem(`board-${boardId}-internalContacts`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultContacts;
      }
    }
    return defaultContacts;
  };

  const allUsers = getUsers();
  const sortedUsers = [...allUsers].sort((a, b) =>
    formatUserName(a.name).localeCompare(formatUserName(b.name))
  );
  const filteredUsers = userSearch
    ? sortedUsers.filter(u =>
        formatUserName(u.name).toLowerCase().includes(userSearch.toLowerCase())
      )
    : sortedUsers;

  const handleSelectUser = user => {
    setLocalUsername(user.name);
    setUserSearch('');
    setShowUserDropdown(false);
    setShowNewUserInput(false);
  };

  const handleCreateUser = () => {
    if (newUserName.trim()) {
      const formatted = formatUserName(newUserName);
      const user = addNewUser(formatted);
      setLocalUsername(formatted);
      setNewUserName('');
      setShowNewUserInput(false);
      setShowUserDropdown(false);
      setUserSearch('');
    }
  };

  useEffect(() => {
    setLocalUsername(username || '');
  }, [username]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (showUserDropdown && !e.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserDropdown]);

  const { mergeState, handleMergeFileSelect, handleMerge, handleResolveConflict, handleDownloadMerged, handleResetMerge } = useDataMerge();

  useEffect(() => {
    setLocalColors(cardColors);
  }, [cardColors]);

  useEffect(() => {
    setLocalUsername(username);
  }, [username]);

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
    try {
      exportData(localUsername);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('[Export] Error:', err);
      alert("Erreur lors de l'export: " + (err.message || err));
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const result = await importData(event.target?.result);
          if (result.success) {
            alert('Données importées avec succès !');
            setTimeout(() => window.location.reload(), 500);
          } else {
            alert("Erreur lors de l'importation: " + (result.error || 'Erreur inconnue'));
          }
        } catch (err) {
          alert("Erreur lors de l'importation: " + (err.message || 'Erreur inconnue'));
        }
      };
      reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier');
      };
      reader.readAsText(file);
    };
    input.oncancel = () => {
      // User cancelled file selection
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
    { id: 'interlocuteurs', label: 'Interlocuteurs', icon: Users },
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
                  <div className="relative user-dropdown">
                    <div className="relative">
                      <input
                        type="text"
                        value={
                          showNewUserInput
                            ? newUserName
                            : localUsername
                              ? formatUserName(localUsername)
                              : ''
                        }
                        onChange={e => {
                          if (showNewUserInput) {
                            setNewUserName(e.target.value);
                          } else {
                            setLocalUsername(e.target.value);
                            setUserSearch(e.target.value);
                            setShowUserDropdown(true);
                          }
                        }}
                        onFocus={() => {
                          if (!showNewUserInput) {
                            setUserSearch(localUsername || '');
                            setShowUserDropdown(true);
                          }
                        }}
                        placeholder="Rechercher ou créer un utilisateur"
                        className="w-full px-4 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent pr-20"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {!showNewUserInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewUserInput(true);
                              setNewUserName(localUsername);
                            }}
                            className="p-1 text-muted hover:text-accent"
                            title="Créer un nouvel utilisateur"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                        {showNewUserInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewUserInput(false);
                              setNewUserName('');
                            }}
                            className="p-1 text-muted hover:text-urgent"
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    {showNewUserInput ? (
                      <div className="mt-2 p-3 bg-card-hover rounded-lg border border-std">
                        <p className="text-xs text-muted mb-2">
                          Le nom sera formaté:{' '}
                          <strong>{formatUserName(newUserName) || '...'}</strong>
                        </p>
                        <button
                          onClick={handleCreateUser}
                          disabled={!newUserName.trim()}
                          className="w-full px-3 py-1.5 text-sm bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Créer l'utilisateur
                        </button>
                      </div>
                    ) : showUserDropdown && filteredUsers.length > 0 ? (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-std rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover text-primary"
                          >
                            {formatUserName(user.name)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Votre fonction
                  </label>
                  <select
                    value={userRole}
                    onChange={e => {
                      setUserRole(e.target.value);
                      localStorage.setItem('c-projets-user-role', e.target.value);
                    }}
                    className="w-full px-4 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">Sélectionner votre fonction...</option>
                    {allRoles.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="filterMyProjects"
                    checked={filterMyProjects}
                    onChange={e => {
                      setFilterMyProjects(e.target.checked);
                      localStorage.setItem('c-projets-filter-my-projects', e.target.checked);
                    }}
                    className="w-4 h-4 accent-accent"
                  />
                  <label htmlFor="filterMyProjects" className="text-sm text-secondary">
                    Ne voir que les projets où je suis interlocuteur interne
                  </label>
                </div>
                <div className="mb-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showTagOnCard"
                    checked={showTagOnCard}
                    onChange={e => setShowTagOnCard(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                  <label htmlFor="showTagOnCard" className="text-sm text-secondary">
                    Afficher le tag Revue d'activité sur les cartes de tâches
                  </label>
                </div>
                <button
                  onClick={() => {
                    setUsername(localUsername);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 1000);
                  }}
                  className="flex items-center px-4 py-2 text-sm bg-accent text-white rounded hover:opacity-90"
                >
                  <Save size={14} className="mr-2" />
                  Enregistrer
                </button>
                {saved && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card border border-std rounded-lg p-6 max-w-sm mx-4">
                      <p className="text-lg font-semibold text-accent text-center">Enregistré !</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'interlocuteurs' && (
            <>
              <div className="bg-card rounded-lg border border-std p-6">
                <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <Users size={20} className="mr-2" />
                  Base des interlocuteurs
                </h2>
                <p className="text-sm text-muted mb-4">
                  Cette liste contient tous les interlocuteurs utilisés dans les projets. Elle est
                  automatiquement mise à jour lors de la création de nouveaux interlocuteurs.
                </p>
                {usersList.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">
                    Aucun interlocuteur dans la base
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 p-2 text-xs font-semibold text-muted border-b border-std">
                      <div className="col-span-4">Nom</div>
                      <div className="col-span-4">Fonction(s)</div>
                      <div className="col-span-3">Projet(s)</div>
                      <div className="col-span-1"></div>
                    </div>
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                      {[...usersList]
                        .sort((a, b) =>
                          formatUserName(a.name).localeCompare(formatUserName(b.name))
                        )
                        .map(user => {
                          const userProjects = [];
                          const userFunctions = new Set();
                          boards.forEach(board => {
                            const contacts = getContactsForBoard(board.id);
                            contacts.forEach(c => {
                              if (c.name && c.name.toLowerCase() === user.name.toLowerCase()) {
                                userProjects.push(board.title);
                                if (c.title) userFunctions.add(c.title);
                              }
                            });
                          });
                          const functionsList = Array.from(userFunctions);
                          const projectsList = userProjects;
                          return (
                            <div
                              key={user.id}
                              className="grid grid-cols-12 gap-2 p-2 bg-card-hover rounded-lg border border-std items-center"
                            >
                              <div className="col-span-4 text-sm font-medium text-primary">
                                {formatUserName(user.name)}
                              </div>
                              <div className="col-span-4 text-xs text-secondary">
                                {functionsList.length > 0 ? (
                                  <div className="max-h-16 overflow-y-auto">
                                    {functionsList.map((f, i) => (
                                      <div key={i} title={f}>
                                        {f}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </div>
                              <div className="col-span-3 text-xs text-muted">
                                {projectsList.length > 0 ? (
                                  <div className="max-h-16 overflow-y-auto">
                                    {projectsList.map((p, i) => (
                                      <div key={i} title={p}>
                                        {p}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </div>
                              <div className="col-span-1">
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Supprimer "${formatUserName(user.name)}" de la base ?`
                                      )
                                    ) {
                                      const newList = usersList.filter(u => u.id !== user.id);
                                      setUsersList(newList);
                                      localStorage.setItem(
                                        'c-projets-users',
                                        JSON.stringify(newList)
                                      );
                                    }
                                  }}
                                  className="text-muted hover:text-urgent"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === 'favorites' && <LibraryFavorites />}

          {activeTab === 'backup' && (
            <div className="space-y-6">
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

              <div className="bg-card rounded-lg border border-std p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary flex items-center">
                    <GitMerge size={20} className="mr-2" />
                    Fusionner deux utilisateurs
                  </h2>
                </div>
                <p className="text-sm text-secondary mb-4">
                  Sélectionnez les fichiers JSON de deux utilisateurs différents pour fusionner
                  leurs données.
                </p>

                {!mergeState.step && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Fichier utilisateur 1
                        </label>
                        <button
                          onClick={() => handleMergeFileSelect('A')}
                          className="w-full flex items-center px-4 py-2 bg-input border border-std rounded-lg text-primary hover:border-accent transition-std"
                        >
                          <Upload size={16} className="mr-2" />
                          {mergeState.userAFile || 'Sélectionner un fichier...'}
                        </button>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Fichier utilisateur 2
                        </label>
                        <button
                          onClick={() => handleMergeFileSelect('B')}
                          className="w-full flex items-center px-4 py-2 bg-input border border-std rounded-lg text-primary hover:border-accent transition-std"
                        >
                          <Upload size={16} className="mr-2" />
                          {mergeState.userBFile || 'Sélectionner un fichier...'}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleMerge}
                      disabled={!mergeState.userA || !mergeState.userB}
                      className="flex items-center px-4 py-2 text-sm bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <GitMerge size={14} className="mr-2" />
                      Fusionner
                    </button>
                  </div>
                )}

                {mergeState.step === 'resolve' && mergeState.conflicts.length > 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
                      <p className="text-sm font-medium text-yellow-500">
                        {mergeState.conflicts.length} conflit(s) détecté(s). Veuillez choisir quelle
                        version conserver :
                      </p>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {mergeState.conflicts.map((conflict, index) => (
                        <div key={index} className="p-3 bg-input border border-std rounded-lg">
                          <p className="text-sm font-medium text-primary mb-2">
                            {conflict.type} (ID: {conflict.id})
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveConflict(index, 'A')}
                              className={`flex-1 px-3 py-2 text-sm rounded border ${
                                mergeState.resolved[index] === 'A'
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-card border-std hover:border-accent'
                              }`}
                            >
                              {mergeState.userAName}
                            </button>
                            <button
                              onClick={() => handleResolveConflict(index, 'B')}
                              className={`flex-1 px-3 py-2 text-sm rounded border ${
                                mergeState.resolved[index] === 'B'
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-card border-std hover:border-accent'
                              }`}
                            >
                              {mergeState.userBName}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mergeState.step === 'resolve' && mergeState.conflicts.length === 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
                    <p className="text-sm font-medium text-green-500">
                      Fusion réussie ! Aucune incohérence détectée.
                    </p>
                  </div>
                )}

                {(mergeState.step === 'resolve' ||
                  (mergeState.userA && mergeState.userB && mergeState.step !== 'resolve')) && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleDownloadMerged}
                      className="flex items-center px-4 py-2 text-sm bg-accent text-white rounded hover:opacity-90"
                    >
                      <Download size={14} className="mr-2" />
                      Télécharger fichier fusionné
                    </button>
                    <button
                      onClick={handleResetMerge}
                      className="flex items-center px-4 py-2 text-sm bg-card hover:bg-card-hover border border-std rounded"
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
