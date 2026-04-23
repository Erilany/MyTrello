import React, { useState, useEffect } from 'react';
import {
  Info,
  ExternalLink,
  FolderOpen,
  Plus,
  Trash2,
  Pencil,
  PlusCircle,
  User,
  Building,
  Mail,
  X,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-react';
import { loadGMRData } from '../../data/GMRData';
import { loadPriorityData } from '../../data/PriorityData';
import { loadZonesData } from '../../data/ZonesData';
import { addFunction as addFunctionToGlobal, loadFunctions } from '../../data/FunctionsData';
import { useApp } from '../../context/AppContext';

function saveToStorage(key, value) {
  localStorage.setItem(`c-projets_board_${key}`, value);
}

export function BoardInformations({
  boardGMR,
  setBoardGMR,
  boardPriority,
  setBoardPriority,
  boardZone,
  setBoardZone,
  links,
  setLinks,
  fallbackToBat,
  internalContacts,
  setInternalContacts,
  allFunctions = [],
  externalContacts,
  setExternalContacts,
  updateExternalContact,
  showAddInternal,
  setShowAddInternal,
  newInternalTitle,
  setNewInternalTitle,
  eotpLines,
  setEotpLines,
}) {
  const { searchUsers, addNewUser, formatUserName, getUsers } = useApp();
  const [userSearch, setUserSearch] = useState({});
  const [showDropdown, setShowDropdown] = useState({});
  const [newUserName, setNewUserName] = useState({});
  const [creatingUser, setCreatingUser] = useState({});

  const getUserSearch = id => userSearch[id] || '';
  const setUserSearchForContact = (id, value) => setUserSearch({ ...userSearch, [id]: value });

  const allUsers = getUsers();
  const sortedAllUsers = [...allUsers].sort((a, b) => formatUserName(a.name).localeCompare(formatUserName(b.name)));

  const getFilteredUsers = contactId => {
    const search = getUserSearch(contactId);
    if (!search) return sortedAllUsers;
    return searchUsers(search);
  };

  const isCreating = id => creatingUser[id] === true;

  const handleSelectUser = (contactId, user) => {
    const updated = internalContacts.map(c =>
      c.id === contactId ? { ...c, name: user.name } : c
    );
    setInternalContacts(updated);
    setShowDropdown({ ...showDropdown, [contactId]: false });
    setUserSearch({ ...userSearch, [contactId]: '' });
  };

  const handleCreateUser = contactId => {
    if (newUserName[contactId]?.trim()) {
      const formatted = formatUserName(newUserName[contactId]);
      addNewUser(formatted);
      const updated = internalContacts.map(c =>
        c.id === contactId ? { ...c, name: formatted } : c
      );
      setInternalContacts(updated);
      setNewUserName({ ...newUserName, [contactId]: '' });
      setCreatingUser({ ...creatingUser, [contactId]: false });
      setShowDropdown({ ...showDropdown, [contactId]: false });
      setUserSearch({ ...userSearch, [contactId]: '' });
    }
  };

  useEffect(() => {
    const handleClickOutside = e => {
      if (!e.target.closest('.user-dropdown')) {
        setShowDropdown({});
        setCreatingUser({});
        setNewUserName({});
        setUserSearch({});
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ============================================================================= */}
      {/* SECTION: PARAMÈTRES DU PROJET */}
      {/* ============================================================================= */}
      <div className="mb-6 p-4 bg-card rounded-lg border border-std">
        <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
          <Info size={16} className="mr-2" />
          Paramètres du projet
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-secondary mb-1">GMR</label>
            <select
              value={boardGMR}
              onChange={e => {
                setBoardGMR(e.target.value);
                saveToStorage('gmr', e.target.value);
              }}
              className="w-full px-3 py-2 text-sm bg-input border border-std rounded text-primary focus:outline-none focus:border-accent"
            >
              <option value="">-- Sélectionner --</option>
              {loadGMRData().map(gmr => (
                <option key={gmr.code} value={gmr.code}>
                  {gmr.code} - {gmr.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Catégorie du projet</label>
            <select
              value={boardPriority}
              onChange={e => {
                setBoardPriority(e.target.value);
                saveToStorage('priority', e.target.value);
              }}
              className="w-full px-3 py-2 text-sm bg-input border border-std rounded text-primary focus:outline-none focus:border-accent"
            >
              <option value="">-- Sélectionner --</option>
              {loadPriorityData().map(priority => (
                <option key={`priority-${priority.id}`} value={priority.label}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Zone</label>
            <select
              value={boardZone}
              onChange={e => {
                setBoardZone(e.target.value);
                saveToStorage('zone', e.target.value);
              }}
              className="w-full px-3 py-2 text-sm bg-input border border-std rounded text-primary focus:outline-none focus:border-accent"
            >
              <option value="">-- Sélectionner --</option>
              {loadZonesData().map(zone => (
                <option key={`zone-${zone.id}`} value={zone.label}>
                  {zone.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================================= */}
      {/* SECTION: EOTP */}
      {/* ============================================================================= */}
      <div className="mb-6 p-4 bg-card rounded-lg border border-std">
        <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
          <Info size={16} className="mr-2" />
          EOTP
        </h3>
        <div className="space-y-3">
          {eotpLines.map((eotp, idx) => (
            <div key={eotp.id || idx} className="border border-std rounded-lg p-3 bg-card-hover">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-6">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder="N°EOTP"
                    value={eotp.numero || ''}
                    onChange={e => {
                      const updated = eotpLines.map((l, i) =>
                        i === idx ? { ...l, numero: e.target.value } : l
                      );
                      setEotpLines(updated);
                    }}
                    className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <input
                  type="text"
                  placeholder="RUO"
                  value={eotp.ruo || ''}
                  onChange={e => {
                    const updated = eotpLines.map((l, i) =>
                      i === idx ? { ...l, ruo: e.target.value } : l
                    );
                    setEotpLines(updated);
                  }}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Libellé opération"
                    value={eotp.libelle || ''}
                    onChange={e => {
                      const updated = eotpLines.map((l, i) =>
                        i === idx ? { ...l, libelle: e.target.value } : l
                      );
                      setEotpLines(updated);
                    }}
                    className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                  {eotpLines.length > 1 && (
                    <button
                      onClick={() => setEotpLines(eotpLines.filter((_, i) => i !== idx))}
                      className="text-muted hover:text-urgent"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="ml-6 pl-3 border-l-2 border-accent/30">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => {
                      const updated = eotpLines.map((l, i) =>
                        i === idx
                          ? {
                              ...l,
                              subEotp: [
                                ...(l.subEotp || []),
                                { id: Date.now(), numero: '', libelle: '' },
                              ],
                            }
                          : l
                      );
                      setEotpLines(updated);
                    }}
                    className="flex items-center px-2 py-0.5 text-xs text-accent hover:bg-card rounded"
                  >
                    <PlusCircle size={10} className="mr-1" />
                    EOTP Niveau 2
                  </button>
                </div>
                {eotp.subEotp && eotp.subEotp.length > 0 && (
                  <div className="space-y-2">
                    {eotp.subEotp.map((sub, subIdx) => (
                      <div key={sub.id || subIdx} className="flex items-center gap-2">
                        <span className="text-xs text-muted w-4">{subIdx + 1}.</span>
                        <input
                          type="text"
                          placeholder="EOTP niveau 2"
                          value={sub.numero || ''}
                          onChange={e => {
                            const updated = eotpLines.map((l, i) =>
                              i === idx
                                ? {
                                    ...l,
                                    subEotp: l.subEotp.map((s, si) =>
                                      si === subIdx ? { ...s, numero: e.target.value } : s
                                    ),
                                  }
                                : l
                            );
                            setEotpLines(updated);
                          }}
                          className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                        />
                        <input
                          type="text"
                          placeholder="Libellé"
                          value={sub.libelle || ''}
                          onChange={e => {
                            const updated = eotpLines.map((l, i) =>
                              i === idx
                                ? {
                                    ...l,
                                    subEotp: l.subEotp.map((s, si) =>
                                      si === subIdx ? { ...s, libelle: e.target.value } : s
                                    ),
                                  }
                                : l
                            );
                            setEotpLines(updated);
                          }}
                          className="flex-[2] px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => {
                            const updated = eotpLines.map((l, i) =>
                              i === idx
                                ? { ...l, subEotp: l.subEotp.filter((_, si) => si !== subIdx) }
                                : l
                            );
                            setEotpLines(updated);
                          }}
                          className="text-muted hover:text-urgent p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setEotpLines([...eotpLines, { id: Date.now(), numero: '', ruo: '', libelle: '' }])
            }
            className="flex items-center px-3 py-2 text-sm text-secondary hover:text-primary"
          >
            <PlusCircle size={14} className="mr-2" />
            Ajouter un EOTP
          </button>
        </div>
      </div>

      {/* ============================================================================= */}
      {/* SECTION: LIENS */}
      {/* ============================================================================= */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
          <ExternalLink size={16} className="mr-2" />
          Liens
        </h3>
        <div className="flex flex-wrap gap-2">
          {links.map(link => (
            <div
              key={link.id}
              className="group relative flex items-center px-3 py-2 bg-card hover:bg-card-hover border border-std rounded text-sm text-primary transition-std"
              style={{ borderLeftColor: link.color, borderLeftWidth: '3px' }}
            >
              {link.type === 'web' ? (
                <ExternalLink size={14} className="mr-2" style={{ color: link.color }} />
              ) : (
                <FolderOpen size={14} className="mr-2" style={{ color: link.color }} />
              )}
              <span
                className="cursor-pointer"
                onClick={() => {
                  if (!link.url) {
                    const url = prompt(
                      "Entrez l'URL/dossier :",
                      link.type === 'folder' ? 'C:\\' : 'https://'
                    );
                    if (url) {
                      setLinks(links.map(l => (l.id === link.id ? { ...l, url } : l)));
                    }
                  } else if (link.type === 'folder') {
                    const folderPath = link.url;
                    if (window.electron && window.electron.invoke) {
                      window.electron
                        .invoke('shell:openFolder', folderPath)
                        .then(result => {
                          if (!result.success) {
                            console.error('Erreur ouverture dossier:', result.error);
                            alert("Impossible d'ouvrir le dossier: " + result.error);
                          }
                        })
                        .catch(err => {
                          console.error('Erreur IPC:', err);
                          fallbackToBat(folderPath);
                        });
                    } else {
                      fallbackToBat(folderPath);
                    }
                  } else {
                    window.open(link.url, '_blank');
                  }
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  const title = prompt('Nom du lien :', link.title);
                  if (title) {
                    setLinks(links.map(l => (l.id === link.id ? { ...l, title } : l)));
                  }
                }}
              >
                {link.title}
              </span>
              <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const newTitle = prompt('Modifier le nom :', link.title);
                    if (newTitle !== null) {
                      setLinks(links.map(l => (l.id === link.id ? { ...l, title: newTitle } : l)));
                    }
                  }}
                  className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
                >
                  <Pencil size={12} className="text-muted" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (window.confirm(`Supprimer le lien "${link.title}" ?`)) {
                      setLinks(links.filter(l => l.id !== link.id));
                    }
                  }}
                  className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
                >
                  <Trash2 size={12} className="text-muted" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setLinks([
                ...links,
                {
                  id: Date.now(),
                  title: 'Nouveau lien',
                  url: '',
                  type: 'web',
                  color: '#22C55E',
                },
              ])
            }
            className="flex items-center px-3 py-2 bg-card/50 rounded-lg border border-dashed border-std text-secondary hover:text-primary hover:border-accent transition-std"
          >
            <PlusCircle size={16} className="mr-2" />
            Ajouter un lien
          </button>
        </div>
      </div>

      {/* ============================================================================= */}
      {/* SECTION: CONTACTS INTERNES */}
      {/* ============================================================================= */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
          <User size={16} className="mr-2" />
          Interlocuteurs internes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {internalContacts.map(contact => (
            <div key={contact.id} className="p-3 bg-card rounded-lg border border-std">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">{contact.title}</span>
                <button
                  onClick={() =>
                    setInternalContacts(internalContacts.filter(c => c.id !== contact.id))
                  }
                  className="text-muted hover:text-urgent"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="relative user-dropdown">
                <input
                  type="text"
                  placeholder="Rechercher ou créer..."
                  value={showDropdown[contact.id] ? (newUserName[contact.id] !== undefined ? newUserName[contact.id] : getUserSearch(contact.id)) : (contact.name ? formatUserName(contact.name) : '')}
                  onChange={e => {
                    if (newUserName[contact.id] !== undefined) {
                      setNewUserName({ ...newUserName, [contact.id]: e.target.value });
                    } else {
                      setUserSearchForContact(contact.id, e.target.value);
                      setShowDropdown({ ...showDropdown, [contact.id]: true });
                    }
                  }}
                  onFocus={() => {
                    if (!showDropdown[contact.id]) {
                      setUserSearchForContact(contact.id, '');
                      setShowDropdown({ ...showDropdown, [contact.id]: true });
                    }
                  }}
                  className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent pr-8"
                />
                {!showDropdown[contact.id] && contact.name && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = internalContacts.map(c =>
                        c.id === contact.id ? { ...c, name: '' } : c
                      );
                      setInternalContacts(updated);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-urgent"
                    title="Supprimer l'interlocuteur"
                  >
                    <X size={14} />
                  </button>
                )}
                {!showDropdown[contact.id] && !contact.name && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown({ ...showDropdown, [contact.id]: true });
                      setUserSearch('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-accent"
                  >
                    <Search size={14} />
                  </button>
                )}
                {showDropdown[contact.id] && (
                  <>
                    {isCreating(contact.id) ? (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-std rounded-lg shadow-lg max-h-40 overflow-auto">
                        <div className="p-2 border-b border-std">
                          <p className="text-xs text-muted">
                            Créer: <strong>{formatUserName(newUserName[contact.id] || '') || '...'}</strong>
                          </p>
                          <button
                            onClick={() => handleCreateUser(contact.id)}
                            disabled={!newUserName[contact.id]?.trim()}
                            className="mt-1 w-full px-2 py-1 text-xs bg-accent text-white rounded disabled:opacity-50"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-std rounded-lg shadow-lg max-h-40 overflow-auto">
                        {contact.name && (
                          <button
                            onClick={() => {
                              const updated = internalContacts.map(c =>
                                c.id === contact.id ? { ...c, name: '' } : c
                              );
                              setInternalContacts(updated);
                              setShowDropdown({ ...showDropdown, [contact.id]: false });
                            }}
                            className="w-full px-2 py-1 text-left text-xs text-muted hover:bg-card-hover italic"
                          >
                            Aucun interlocuteur
                          </button>
                        )}
                        {getFilteredUsers(contact.id).map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(contact.id, user)}
                            className="w-full px-2 py-1 text-left text-xs hover:bg-card-hover text-primary"
                          >
                            {formatUserName(user.name)}
                          </button>
                        ))}
                        {getFilteredUsers(contact.id).length === 0 && getUserSearch(contact.id) && (
                          <button
                            onClick={() => {
                              setCreatingUser({ ...creatingUser, [contact.id]: true });
                              setNewUserName({ ...newUserName, [contact.id]: getUserSearch(contact.id) });
                            }}
                            className="w-full px-2 py-1 text-left text-xs text-accent hover:bg-card-hover"
                          >
                            + Créer "{getUserSearch(contact.id)}"
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {showAddInternal ? (
            <div className="p-3 bg-card rounded-lg border border-std">
              {newInternalTitle === '__NEW_FUNCTION__' ? (
                <>
                  <input
                    type="text"
                    placeholder="Nouvelle fonction"
                    value={newInternalTitle === '__NEW_FUNCTION__' ? '' : newInternalTitle}
                    onChange={e => setNewInternalTitle(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary mb-2 focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newInternalTitle.trim()) {
                          const updatedFunctions = addFunctionToGlobal(newInternalTitle.trim());
                          setInternalContacts([
                            ...internalContacts,
                            { id: Date.now(), title: newInternalTitle.trim() },
                          ]);
                          setNewInternalTitle('');
                          setShowAddInternal(false);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-accent text-white rounded"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setShowAddInternal(false);
                        setNewInternalTitle('');
                      }}
                      className="px-2 py-1 text-xs text-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <select
                    value={newInternalTitle}
                    onChange={e => setNewInternalTitle(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary mb-2 focus:outline-none focus:border-accent"
                    autoFocus
                  >
                    <option value="">Sélectionner une fonction...</option>
                    {allFunctions
                      .filter(func => !internalContacts.some(c => c.title === func))
                      .map((func, idx) => (
                        <option key={idx} value={func}>
                          {func}
                        </option>
                      ))}
                    <option value="__NEW_FUNCTION__">+ Ajouter une nouvelle fonction</option>
                  </select>
                  {newInternalTitle && newInternalTitle !== '__NEW_FUNCTION__' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setInternalContacts([
                            ...internalContacts,
                            { id: Date.now(), title: newInternalTitle },
                          ]);
                          setNewInternalTitle('');
                          setShowAddInternal(false);
                        }}
                        className="px-2 py-1 text-xs bg-accent text-white rounded"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => {
                          setShowAddInternal(false);
                          setNewInternalTitle('');
                        }}
                        className="px-2 py-1 text-xs text-secondary"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAddInternal(true)}
              className="p-3 bg-card/50 rounded-lg border border-dashed border-std text-secondary hover:text-primary hover:border-accent transition-std flex items-center justify-center"
            >
              <PlusCircle size={16} className="mr-2" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* ============================================================================= */}
      {/* SECTION: CONTACTS EXTERNES */}
      {/* ============================================================================= */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
          <Mail size={16} className="mr-2" />
          Contacts externes
        </h3>
        <div className="space-y-3">
          {externalContacts.map((contact, idx) => (
            <div key={idx} className="p-3 bg-card rounded border border-std">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Entreprise"
                  value={contact.entreprise}
                  onChange={e => updateExternalContact(idx, 'entreprise', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Fonction"
                  value={contact.fonction}
                  onChange={e => updateExternalContact(idx, 'fonction', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={contact.nom}
                  onChange={e => updateExternalContact(idx, 'nom', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={contact.prenom}
                  onChange={e => updateExternalContact(idx, 'prenom', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={contact.email}
                  onChange={e => updateExternalContact(idx, 'email', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Tél. bureau"
                  value={contact.telBureau}
                  onChange={e => updateExternalContact(idx, 'telBureau', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Portable"
                  value={contact.telPortable}
                  onChange={e => updateExternalContact(idx, 'telPortable', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Adresse"
                  value={contact.adresse}
                  onChange={e => updateExternalContact(idx, 'adresse', e.target.value)}
                  className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setExternalContacts([
                ...externalContacts,
                {
                  entreprise: '',
                  fonction: '',
                  nom: '',
                  prenom: '',
                  email: '',
                  telBureau: '',
                  telPortable: '',
                  adresse: '',
                },
              ])
            }
            className="w-full p-3 bg-card/50 rounded-lg border border-dashed border-std text-secondary hover:text-primary hover:border-accent transition-std flex items-center justify-center"
          >
            <PlusCircle size={16} className="mr-2" />
            Ajouter un contact externe
          </button>
        </div>
      </div>
    </div>
  );
}
