import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Exchange from '../Exchange/Exchange';
import {
  Archive,
  ListTodo,
  Calendar,
  MessageSquare,
  ShoppingCart,
  Info,
  ExternalLink,
  FolderOpen,
  Trash2,
  User,
  Building,
  PlusCircle,
} from 'lucide-react';

function Board2() {
  const { currentBoard, archiveBoard, canArchiveBoard, getUnreadCount } = useApp();
  const [activeTab, setActiveTab] = useState('taches');

  const tabs = [
    { id: 'informations', label: 'Informations', icon: Info },
    { id: 'taches', label: 'Tâches', icon: ListTodo },
    { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'echanges', label: 'Échanges', icon: MessageSquare },
  ];

  const [links, setLinks] = useState([
    { id: 1, title: 'Site Web', url: '', type: 'web', color: '#3B82F6' },
    { id: 2, title: 'Dossier Projet', url: '', type: 'folder', color: '#F59E0B' },
  ]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'web', color: '#22C55E' });

  const [eotpLines, setEotpLines] = useState([{ id: 1, numero: '', ruo: '', libelle: '' }]);
  const [internalContacts, setInternalContacts] = useState([
    { id: 1, title: 'Manager de projets' },
    { id: 2, title: 'Chargé(e) de Concertation' },
    { id: 3, title: "Chargé(e) d'Etudes LA" },
    { id: 4, title: "Chargé(e) d'Etudes LS" },
    { id: 5, title: "Chargé(e) d'Etudes Poste HT" },
    { id: 6, title: "Chargé(e) d'Etudes Poste BT et CC" },
    { id: 7, title: "Chargé(e) d'Etudes SPC" },
    { id: 8, title: 'Contrôleur Travaux' },
    { id: 9, title: 'Assistant(e) Etudes' },
  ]);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [newInternalTitle, setNewInternalTitle] = useState('');
  const [externalContacts, setExternalContacts] = useState([]);

  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedAvenant, setSelectedAvenant] = useState(null);
  const [showAddCommande, setShowAddCommande] = useState(false);
  const [newCommandeTitle, setNewCommandeTitle] = useState('');
  const [activeTabCommande, setActiveTabCommande] = useState('commande');

  const handleArchiveBoard = () => {
    const { canArchive, reason } = canArchiveBoard(currentBoard.id);
    if (!canArchive) {
      alert(reason);
      return;
    }
    if (window.confirm(`Voulez-vous archiver le projet "${currentBoard.title}" ?`)) {
      archiveBoard(currentBoard.id);
    }
  };

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-secondary">Sélectionnez un projet</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          {currentBoard.description && (
            <p className="text-sm text-secondary mb-2">{currentBoard.description}</p>
          )}
        </div>
        <button
          onClick={handleArchiveBoard}
          className="flex items-center px-3 py-1.5 text-sm bg-card hover:bg-card-hover border border-std rounded transition-std text-secondary"
          title="Archiver le projet (toutes les cartes doivent être dans la colonne Archiver)"
        >
          <Archive size={14} className="mr-2" />
          Archiver
        </button>
      </div>

      <div className="flex border-b border-std mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const unreadCount =
            tab.id === 'echanges' && currentBoard ? getUnreadCount(currentBoard.id) : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-std ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary hover:border-std'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {tab.label}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-urgent text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'taches' && (
        <div className="flex-1 flex items-center justify-center text-secondary">
          <div className="text-center">
            <ListTodo size={48} className="mx-auto mb-4 text-muted" />
            <p>Page Tâches à développer</p>
          </div>
        </div>
      )}

      {activeTab === 'commandes' && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-std p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-primary mb-4">Liste des commandes</h3>
            {commandes.length === 0 ? (
              <p className="text-sm text-muted">Aucune commande</p>
            ) : (
              <div className="space-y-2">
                {commandes.map(cmd => (
                  <div key={cmd.id}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCommande(cmd);
                          setSelectedAvenant(null);
                        }}
                        className={`flex-1 text-left p-2 rounded border text-sm ${
                          selectedCommande?.id === cmd.id && !selectedAvenant
                            ? 'border-accent bg-accent-soft'
                            : 'border-std bg-card hover:bg-card-hover'
                        }`}
                      >
                        {cmd.title}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Êtes-vous sûr de vouloir supprimer "${cmd.title}" ? Cette action est irréversible.`
                            )
                          ) {
                            if (
                              window.confirm(
                                `Confirmer définitivement la suppression de "${cmd.title}" et de tous ses avenants ?`
                              )
                            ) {
                              setCommandes(commandes.filter(c => c.id !== cmd.id));
                              if (selectedCommande?.id === cmd.id) {
                                setSelectedCommande(null);
                                setSelectedAvenant(null);
                              }
                            }
                          }
                        }}
                        className="p-1 text-muted hover:text-urgent"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {cmd.avenants?.map(av => (
                      <div key={av.id} className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedCommande(cmd);
                            setSelectedAvenant(av);
                          }}
                          className={`flex-1 text-left p-2 rounded border text-sm ${
                            selectedAvenant?.id === av.id
                              ? 'border-accent bg-accent-soft'
                              : 'border-std bg-card hover:bg-card-hover'
                          }`}
                        >
                          {av.title}
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(`Êtes-vous sûr de vouloir supprimer "${av.title}" ?`)
                            ) {
                              const updatedCommandes = commandes.map(c =>
                                c.id === cmd.id
                                  ? {
                                      ...c,
                                      avenants: c.avenants?.filter(a => a.id !== av.id) || [],
                                    }
                                  : c
                              );
                              setCommandes(updatedCommandes);
                              if (selectedAvenant?.id === av.id) {
                                setSelectedAvenant(null);
                              }
                            }
                          }}
                          className="p-1 text-muted hover:text-urgent"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const avenantNumber = (cmd.avenants?.length || 0) + 1;
                        const newAvenant = {
                          id: Date.now(),
                          title: `Avenant ${avenantNumber}`,
                          numero: avenantNumber,
                          donnees: { ...cmd.donnees },
                        };
                        const updatedCommandes = commandes.map(c =>
                          c.id === cmd.id
                            ? { ...c, avenants: [...(c.avenants || []), newAvenant] }
                            : c
                        );
                        setCommandes(updatedCommandes);
                        setSelectedAvenant(newAvenant);
                      }}
                      className="ml-8 mt-1 text-xs text-accent hover:underline"
                    >
                      + Créer un Avenant
                    </button>
                  </div>
                ))}
              </div>
            )}
            {showAddCommande ? (
              <div className="mt-4 p-3 bg-card rounded border border-std">
                <input
                  type="text"
                  placeholder="Nom de la commande"
                  value={newCommandeTitle}
                  onChange={e => setNewCommandeTitle(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-input border border-std rounded mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newCommandeTitle.trim()) {
                        const newCmd = {
                          id: Date.now(),
                          title: newCommandeTitle.trim(),
                          donnees: { numero: '', date: '', objet: '', estimation: '' },
                        };
                        setCommandes([...commandes, newCmd]);
                        setSelectedCommande(newCmd);
                        setNewCommandeTitle('');
                        setShowAddCommande(false);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-accent text-white rounded"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCommande(false);
                      setNewCommandeTitle('');
                    }}
                    className="px-2 py-1 text-xs text-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCommande(true)}
                className="w-full mt-4 p-2 text-sm text-accent border border-dashed border-accent rounded hover:bg-accent-soft"
              >
                + Nouvelle commande
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedCommande ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-primary">{selectedCommande.title}</h2>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setActiveTabCommande('affectation')}
                        className={`px-3 py-1 text-xs rounded ${
                          activeTabCommande === 'affectation'
                            ? 'bg-accent text-white'
                            : 'border border-accent text-accent hover:bg-accent-soft'
                        }`}
                      >
                        Affectation
                      </button>
                      <button
                        onClick={() => setActiveTabCommande('commande')}
                        className={`px-3 py-1 text-xs rounded ${
                          activeTabCommande === 'commande'
                            ? 'bg-accent text-white'
                            : 'border border-accent text-accent hover:bg-accent-soft'
                        }`}
                      >
                        Commande
                      </button>
                    </div>
                  </div>
                </div>

                {activeTabCommande === 'commande' && (
                  <div className="p-4 bg-card rounded-lg border border-std">
                    <h3 className="text-sm font-semibold text-primary mb-4">Données commandes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-medium text-secondary uppercase border-b border-std pb-1">
                          Demandeur
                        </h4>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Nom rédacteur / Interlocuteur
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Responsable Projet
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTabCommande === 'affectation' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">RENSEIGNEMENTS</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">N° Affaire</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Date de réception
                          </label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted">
                <p>Sélectionnez ou créez une commande</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="flex-1 flex items-center justify-center text-secondary">
          <div className="text-center">
            <Calendar size={48} className="mx-auto mb-4 text-muted" />
            <p>Page Planning à développer</p>
          </div>
        </div>
      )}

      {activeTab === 'echanges' && currentBoard && <Exchange boardId={currentBoard.id} />}

      {activeTab === 'informations' && (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
              <ExternalLink size={16} className="mr-2" />
              Liens
            </h3>
            <div className="flex flex-wrap gap-2">
              {links.map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    if (!link.url) {
                      const url = prompt("Entrez l'URL :", 'https://');
                      if (url) {
                        setLinks(links.map(l => (l.id === link.id ? { ...l, url } : l)));
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
                  className="flex items-center px-3 py-2 bg-card hover:bg-card-hover border border-std rounded text-sm text-primary transition-std"
                  style={{ borderLeftColor: link.color, borderLeftWidth: '3px' }}
                >
                  {link.type === 'web' ? (
                    <ExternalLink size={14} className="mr-2" style={{ color: link.color }} />
                  ) : (
                    <FolderOpen size={14} className="mr-2" style={{ color: link.color }} />
                  )}
                  {link.title}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const color = prompt('Couleur (hex) :', link.color);
                      if (color) {
                        setLinks(links.map(l => (l.id === link.id ? { ...l, color } : l)));
                      }
                    }}
                    className="ml-2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: link.color }}
                  />
                </button>
              ))}
              {showAddLink ? (
                <div className="flex items-center gap-2 p-2 bg-card border border-std rounded">
                  <select
                    value={newLink.type}
                    onChange={e => setNewLink({ ...newLink, type: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary"
                  >
                    <option value="web">Internet</option>
                    <option value="folder">Dossier</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newLink.title}
                    onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary w-32"
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={newLink.url}
                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary w-40"
                  />
                  <input
                    type="color"
                    value={newLink.color}
                    onChange={e => setNewLink({ ...newLink, color: e.target.value })}
                    className="w-8 h-8 cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      if (newLink.title.trim()) {
                        setLinks([...links, { ...newLink, id: Date.now() }]);
                        setNewLink({ title: '', url: '', type: 'web', color: '#22C55E' });
                        setShowAddLink(false);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-accent text-white rounded"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setShowAddLink(false)}
                    className="px-2 py-1 text-xs text-secondary"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddLink(true)}
                  className="flex items-center px-3 py-2 bg-card hover:bg-card-hover border border-dashed border-std rounded text-sm text-secondary transition-std"
                >
                  <PlusCircle size={14} className="mr-2" />
                  Ajouter
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-card rounded-lg border border-std">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">EOTP</h3>
              <button
                onClick={() =>
                  setEotpLines([...eotpLines, { id: Date.now(), numero: '', ruo: '', libelle: '' }])
                }
                className="flex items-center px-2 py-1 text-xs text-accent hover:bg-card-hover rounded"
              >
                <PlusCircle size={12} className="mr-1" />
                Ajouter une ligne
              </button>
            </div>
            <div className="space-y-3">
              {eotpLines.map((eotp, idx) => (
                <div key={eotp.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="N°EOTP"
                      value={eotp.numero}
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
                    value={eotp.ruo}
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
                      value={eotp.libelle}
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
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
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
                  <input
                    type="text"
                    placeholder="Nom et prénom"
                    value={contact.name || ''}
                    onChange={e => {
                      const updated = internalContacts.map(c =>
                        c.id === contact.id ? { ...c, name: e.target.value } : c
                      );
                      setInternalContacts(updated);
                    }}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                </div>
              ))}
              {showAddInternal ? (
                <div className="p-3 bg-card rounded-lg border border-std">
                  <input
                    type="text"
                    placeholder="Fonction"
                    value={newInternalTitle}
                    onChange={e => setNewInternalTitle(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary mb-2 focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newInternalTitle.trim()) {
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

          <div>
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
              <Building size={16} className="mr-2" />
              Interlocuteurs externes
            </h3>
            <div className="space-y-3">
              {externalContacts.map((contact, idx) => (
                <div key={idx} className="p-4 bg-card rounded-lg border border-std">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-primary">
                      {contact.entreprise || 'Nouveau contact'}
                    </span>
                    <button
                      onClick={() =>
                        setExternalContacts(externalContacts.filter((_, i) => i !== idx))
                      }
                      className="text-muted hover:text-urgent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Entreprise"
                      value={contact.entreprise}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].entreprise = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Fonction"
                      value={contact.fonction}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].fonction = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={contact.nom}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].nom = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={contact.prenom}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].prenom = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={contact.email}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].email = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Tél. bureau"
                      value={contact.telBureau}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].telBureau = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Portable"
                      value={contact.telPortable}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].telPortable = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Adresse"
                      value={contact.adresse}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].adresse = e.target.value;
                        setExternalContacts(updated);
                      }}
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
      )}
    </div>
  );
}

export default Board2;
