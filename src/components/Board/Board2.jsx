import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Exchange from '../Exchange/Exchange';
import { libraryTemplates } from '../../data/libraryData';
import {
  Plus,
  Archive,
  ListTodo,
  Calendar,
  MessageSquare,
  ShoppingCart,
  Info,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  PlusCircle,
  User,
  Building,
} from 'lucide-react';

function Board2() {
  const {
    currentBoard,
    archiveBoard,
    canArchiveBoard,
    getUnreadCount,
    libraryItems,
    cards,
    categories,
    subcategories,
    setSelectedCard,
  } = useApp();
  const [activeTab, setActiveTab] = useState('taches');
  const [selectedChapter, setSelectedChapter] = useState(null);

  const tabs = [
    { id: 'informations', label: 'Informations', icon: Info },
    { id: 'taches', label: 'Tâches', icon: ListTodo },
    { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'echanges', label: 'Échanges', icon: MessageSquare },
  ];

  const [board2Data, setBoard2Data] = useState({
    cards: [],
  });

  const [newCardTitle, setNewCardTitle] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardTitle, setEditingCardTitle] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(null);
  const [newSubcategoryTitle, setNewSubcategoryTitle] = useState('');
  const [showAddSubcategory, setShowAddSubcategory] = useState(null);

  const [links, setLinks] = useState([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'web', color: '#22C55E' });

  const [eotpLines, setEotpLines] = useState([]);
  const [internalContacts, setInternalContacts] = useState([]);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [newInternalTitle, setNewInternalTitle] = useState('');
  const [externalContacts, setExternalContacts] = useState([]);

  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedAvenant, setSelectedAvenant] = useState(null);
  const [showAddCommande, setShowAddCommande] = useState(false);
  const [newCommandeTitle, setNewCommandeTitle] = useState('');
  const [activeTabCommande, setActiveTabCommande] = useState('affectation');

  useEffect(() => {
    if (currentBoard) {
      const savedLinks = localStorage.getItem(`board-${currentBoard.id}-links`);
      if (savedLinks) {
        setLinks(JSON.parse(savedLinks));
      }
      const savedCommandes = localStorage.getItem(`board-${currentBoard.id}-commandes`);
      if (savedCommandes) {
        setCommandes(JSON.parse(savedCommandes));
      }
      const savedEotp = localStorage.getItem(`board-${currentBoard.id}-eotp`);
      if (savedEotp) {
        setEotpLines(JSON.parse(savedEotp));
      }
      const savedInternal = localStorage.getItem(`board-${currentBoard.id}-internalContacts`);
      if (savedInternal) {
        setInternalContacts(JSON.parse(savedInternal));
      }
      const savedExternal = localStorage.getItem(`board-${currentBoard.id}-externalContacts`);
      if (savedExternal) {
        setExternalContacts(JSON.parse(savedExternal));
      }
    }
  }, [currentBoard]);

  useEffect(() => {
    if (currentBoard && links.length > 0) {
      localStorage.setItem(`board-${currentBoard.id}-links`, JSON.stringify(links));
    }
  }, [links, currentBoard]);

  useEffect(() => {
    if (currentBoard && commandes.length > 0) {
      localStorage.setItem(`board-${currentBoard.id}-commandes`, JSON.stringify(commandes));
    }
  }, [commandes, currentBoard]);

  useEffect(() => {
    if (currentBoard && eotpLines.length > 0) {
      localStorage.setItem(`board-${currentBoard.id}-eotp`, JSON.stringify(eotpLines));
    }
  }, [eotpLines, currentBoard]);

  useEffect(() => {
    if (currentBoard && internalContacts.length > 0) {
      localStorage.setItem(
        `board-${currentBoard.id}-internalContacts`,
        JSON.stringify(internalContacts)
      );
    }
  }, [internalContacts, currentBoard]);

  useEffect(() => {
    if (currentBoard && externalContacts.length > 0) {
      localStorage.setItem(
        `board-${currentBoard.id}-externalContacts`,
        JSON.stringify(externalContacts)
      );
    }
  }, [externalContacts, currentBoard]);

  const toggleCardExpanded = cardId => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const addCardToBoard2 = cardTitle => {
    const newCard = {
      id: `card-${Date.now()}`,
      title: cardTitle,
      categories: [],
    };
    setBoard2Data(prev => ({
      ...prev,
      cards: [...prev.cards, newCard],
    }));
    setNewCardTitle('');
    setShowAddCard(false);
  };

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      addCardToBoard2(newCardTitle.trim());
    }
  };

  const handleDeleteCard = cardId => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== cardId),
    }));
  };

  const handleRenameCard = (cardId, newTitle) => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => (c.id === cardId ? { ...c, title: newTitle } : c)),
    }));
    setEditingCardId(null);
  };

  const handleAddCategory = cardId => {
    if (!newCategoryTitle.trim()) return;
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: [
              ...(c.categories || []),
              { id: `cat-${Date.now()}`, title: newCategoryTitle.trim(), subcategories: [] },
            ],
          };
        }
        return c;
      }),
    }));
    setNewCategoryTitle('');
    setShowAddCategory(null);
  };

  const handleDeleteCategory = (cardId, categoryId) => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: (c.categories || []).filter(cat => cat.id !== categoryId),
          };
        }
        return c;
      }),
    }));
  };

  const handleAddSubcategory = (cardId, categoryId) => {
    if (!newSubcategoryTitle.trim()) return;
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: (c.categories || []).map(cat => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  subcategories: [
                    ...(cat.subcategories || []),
                    { id: `subcat-${Date.now()}`, title: newSubcategoryTitle.trim() },
                  ],
                };
              }
              return cat;
            }),
          };
        }
        return c;
      }),
    }));
    setNewSubcategoryTitle('');
    setShowAddSubcategory(null);
  };

  const handleDeleteSubcategory = (cardId, categoryId, subcategoryId) => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: (c.categories || []).map(cat => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  subcategories: (cat.subcategories || []).filter(sub => sub.id !== subcategoryId),
                };
              }
              return cat;
            }),
          };
        }
        return c;
      }),
    }));
  };

  const handleArchiveBoard = () => {
    if (!currentBoard) return;
    const { canArchive, reason } = canArchiveBoard(currentBoard.id);
    if (!canArchive) {
      alert(reason);
      return;
    }
    if (window.confirm(`Voulez-vous archiver le projet "${currentBoard.title}" ?`)) {
      archiveBoard(currentBoard.id);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          {currentBoard?.description && (
            <p className="text-sm text-secondary mb-2">{currentBoard.description}</p>
          )}
        </div>
        {currentBoard && (
          <button
            onClick={handleArchiveBoard}
            className="flex items-center px-3 py-1.5 text-sm bg-card hover:bg-card-hover border border-std rounded transition-std text-secondary"
          >
            <Archive size={14} className="mr-2" />
            Archiver
          </button>
        )}
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
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-full">
            <div className="mb-4 flex flex-wrap gap-2">
              {(() => {
                const chaptersFromTemplates = libraryTemplates
                  .map(item => {
                    const tagsStr = item.tags || '';
                    const tags = tagsStr.split(',');
                    return tags[0];
                  })
                  .filter(Boolean);
                const chaptersFromCards = cards.map(card => card.chapter).filter(Boolean);
                const allChapters = [
                  ...new Set([...chaptersFromTemplates, ...chaptersFromCards]),
                ].sort();
                return allChapters.map(chapter => (
                  <button
                    key={chapter}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedChapter === chapter
                        ? 'bg-accent text-white'
                        : 'bg-card border border-std text-secondary hover:bg-card-hover'
                    }`}
                  >
                    {chapter}
                  </button>
                ));
              })()}
            </div>

            {selectedChapter ? (
              <div className="bg-card rounded-lg border border-std p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-primary">{selectedChapter}</h2>
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="text-sm text-secondary hover:text-primary"
                  >
                    Fermer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards &&
                    cards
                      .filter(card => card.chapter === selectedChapter)
                      .map(card => {
                        const cardCategories = categories.filter(c => c.card_id === card.id);
                        const totalSubcats = cardCategories.reduce(
                          (acc, cat) =>
                            acc + subcategories.filter(s => s.category_id === cat.id).length,
                          0
                        );
                        return (
                          <div
                            key={card.id}
                            onClick={() => setSelectedCard(card)}
                            className="bg-card-hover rounded-lg border-2 border-std p-4 cursor-pointer hover:border-accent hover:ring-2 hover:ring-accent/30 transition-all"
                          >
                            <h3 className="font-semibold text-primary mb-3">{card.title}</h3>
                            <div className="space-y-2">
                              {cardCategories.map(cat => (
                                <div key={cat.id} className="pl-3 border-l-2 border-accent">
                                  <h4 className="text-sm font-medium text-secondary">
                                    {cat.title}
                                  </h4>
                                </div>
                              ))}
                              {cardCategories.length === 0 && (
                                <p className="text-sm text-muted">Aucune action</p>
                              )}
                              {totalSubcats > 0 && (
                                <p className="text-xs text-muted mt-2">
                                  {totalSubcats} tâche{totalSubcats > 1 ? 's' : ''} détaillée
                                  {totalSubcats > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  {(!cards ||
                    cards.filter(card => card.chapter === selectedChapter).length === 0) && (
                    <p className="text-sm text-muted col-span-full">
                      Aucune carte pour ce chapitre. Utilisez le bouton "Utiliser" dans la
                      Bibliothèque pour ajouter des cartes.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-primary">Tâches</h2>
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                  >
                    <Plus size={18} className="mr-2" />
                    Nouvelle tâche
                  </button>
                </div>

                {showAddCard && (
                  <div className="mb-6 bg-card rounded-lg border border-std p-4">
                    <input
                      type="text"
                      placeholder="Titre de la tâche..."
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddCard();
                        if (e.key === 'Escape') setShowAddCard(false);
                      }}
                      className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary mb-3"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCard}
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => setShowAddCard(false)}
                        className="px-4 py-2 text-secondary hover:text-primary"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {board2Data.cards.length === 0 ? (
                  <div className="text-center py-12 text-secondary">
                    <ListTodo size={48} className="mx-auto mb-4 text-muted" />
                    <p>Aucune tâche. Cliquez sur &quot;Nouvelle tâche&quot; pour commencer.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {board2Data.cards.map(card => (
                      <div key={card.id} className="bg-card rounded-lg border border-std p-4">
                        {editingCardId === card.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCardTitle}
                              onChange={e => setEditingCardTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameCard(card.id, editingCardTitle);
                                if (e.key === 'Escape') setEditingCardId(null);
                              }}
                              className="flex-1 px-3 py-2 bg-input border border-std rounded-lg text-primary"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameCard(card.id, editingCardTitle)}
                              className="p-2 text-accent"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingCardId(null)}
                              className="p-2 text-muted"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleCardExpanded(card.id)}
                                className="text-secondary hover:text-primary"
                              >
                                {expandedCards[card.id] ? (
                                  <ChevronDown size={20} />
                                ) : (
                                  <ChevronRight size={20} />
                                )}
                              </button>
                              <h3 className="font-semibold text-primary">{card.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingCardId(card.id);
                                  setEditingCardTitle(card.title);
                                }}
                                className="p-1.5 text-muted hover:text-primary rounded"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-1.5 text-muted hover:text-urgent rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}

                        {expandedCards[card.id] && (
                          <div className="ml-8 mt-4 space-y-3">
                            {(card.categories || []).map(cat => (
                              <div key={cat.id} className="bg-card-hover rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-primary">{cat.title}</h4>
                                  <button
                                    onClick={() => handleDeleteCategory(card.id, cat.id)}
                                    className="p-1 text-muted hover:text-urgent rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="space-y-1 ml-2">
                                  {(cat.subcategories || []).map(sub => (
                                    <div
                                      key={sub.id}
                                      className="flex items-center justify-between text-sm text-secondary"
                                    >
                                      <span>{sub.title}</span>
                                      <button
                                        onClick={() =>
                                          handleDeleteSubcategory(card.id, cat.id, sub.id)
                                        }
                                        className="p-1 text-muted hover:text-urgent rounded"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                {showAddSubcategory === cat.id ? (
                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Nouvelle sous-tâche..."
                                      value={newSubcategoryTitle}
                                      onChange={e => setNewSubcategoryTitle(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter')
                                          handleAddSubcategory(card.id, cat.id);
                                        if (e.key === 'Escape') setShowAddSubcategory(null);
                                      }}
                                      className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleAddSubcategory(card.id, cat.id)}
                                      className="px-2 py-1 text-sm bg-accent text-white rounded"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowAddSubcategory(cat.id)}
                                    className="text-xs text-accent hover:underline mt-2"
                                  >
                                    + Sous-tâche
                                  </button>
                                )}
                              </div>
                            ))}
                            {showAddCategory === card.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Nouvelle catégorie..."
                                  value={newCategoryTitle}
                                  onChange={e => setNewCategoryTitle(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleAddCategory(card.id);
                                    if (e.key === 'Escape') setShowAddCategory(null);
                                  }}
                                  className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleAddCategory(card.id)}
                                  className="px-2 py-1 text-sm bg-accent text-white rounded"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAddCategory(card.id)}
                                className="text-xs text-accent hover:underline mt-2"
                              >
                                + Catégorie
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                          donnees: { numero: '', date: '', objet: '', estimation: '' },
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
                        <div>
                          <label className="block text-xs text-secondary mb-1">Date limite</label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Interlocuteur</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">
                        GÉNÉRALITÉS SUR L'OUVRAGE
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">Désignation</label>
                          <textarea
                            rows={2}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Localisation</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Maître d'ouvrage
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">
                        TYPOLOGIE ET DÉTAILS DE CONSISTANCE
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Type d'intervention
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Description sommaire
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Surface / Volume
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

                {activeTabCommande === 'commande' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">DONNÉES COMMANDE</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">N° Commande</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Date</label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-secondary mb-1">Objet</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Estimation (€)
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted">
                <p>Sélectionnez une commande</p>
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
