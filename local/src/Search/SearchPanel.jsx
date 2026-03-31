import React, { useState, useEffect, useMemo } from 'react';

const searchInText = (text, query) => {
  if (!text || !query) return false;
  return text.toLowerCase().includes(query.toLowerCase());
};
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  X,
  Search,
  Folder,
  FileText,
  CheckSquare,
  Users,
  Tag,
  MapPin,
  Hash,
  Database,
  Library,
  Briefcase,
  ShoppingCart,
} from 'lucide-react';
import { loadChaptersOrder } from '../data/ChaptersData';
import { loadGMRData } from '../data/GMRData';
import { loadZonesData } from '../data/ZonesData';
import { loadTagsData } from '../data/TagsData';

function SearchPanel() {
  const {
    searchOpen,
    toggleSearch,
    setSelectedCard,
    setSelectedCategory,
    setSelectedSubcategory,
    setActiveTab,
    currentBoard,
    boards,
    cards,
    subcategories,
    categories,
    loadBoard,
    setSelectedCommande,
    setActiveTabCommande,
  } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [exitChecked, setExitChecked] = useState(false);

  const [chapters, setChapters] = useState(() => loadChaptersOrder());
  const [gmrs, setGmrs] = useState(() => loadGMRData());
  const [zones, setZones] = useState(() => loadZonesData());
  const [tags, setTags] = useState(() => loadTagsData());
  const [contracts, setContracts] = useState(() => {
    const saved = localStorage.getItem('c-projets_contracts');
    return saved ? JSON.parse(saved) : [];
  });

  const [commandes, setCommandes] = useState(() => {
    const allCommandes = [];
    const savedDb = localStorage.getItem('c-projets_db');
    if (savedDb) {
      const db = JSON.parse(savedDb);
      if (db.boards) {
        db.boards.forEach(board => {
          const boardCommandes = localStorage.getItem(`board-${board.id}-commandes`);
          if (boardCommandes) {
            const parsed = JSON.parse(boardCommandes);
            parsed.forEach(cmd => {
              allCommandes.push({ ...cmd, boardId: board.id, boardName: board.title });
            });
          }
        });
      }
    }
    return allCommandes;
  });

  const loadedRef = React.useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    setChapters(loadChaptersOrder());
    setGmrs(loadGMRData());
    setZones(loadZonesData());
    setTags(loadTagsData());
    const savedContracts = localStorage.getItem('c-projets_contracts');
    if (savedContracts) {
      setContracts(JSON.parse(savedContracts));
    }
    const allCommandes = [];
    const savedDb = localStorage.getItem('c-projets_db');
    if (savedDb) {
      const db = JSON.parse(savedDb);
      if (db.boards) {
        db.boards.forEach(board => {
          const boardCommandes = localStorage.getItem(`board-${board.id}-commandes`);
          if (boardCommandes) {
            const parsed = JSON.parse(boardCommandes);
            parsed.forEach(cmd => {
              allCommandes.push({ ...cmd, boardId: board.id, boardName: board.title });
            });
          }
        });
      }
    }
    setCommandes(allCommandes);
  }, []);

  const loadFromStorage = () => {
    const savedDb = localStorage.getItem('c-projets_db');
    if (savedDb) {
      const db = JSON.parse(savedDb);
      return {
        boards: db.boards || [],
        cards: db.cards || [],
        subcategories: db.subcategories || [],
        categories: db.categories || [],
      };
    }
    return {
      boards,
      cards,
      subcategories,
      categories: [],
    };
  };

  const [allBoards, setAllBoards] = useState(() => {
    const data = loadFromStorage();
    return data.boards;
  });
  const [allCardsData, setAllCardsData] = useState(() => {
    const data = loadFromStorage();
    return data.cards;
  });
  const [allSubcategoriesData, setAllSubcategoriesData] = useState(() => {
    const data = loadFromStorage();
    return data.subcategories;
  });
  const [allCategoriesData, setAllCategoriesData] = useState(() => {
    const data = loadFromStorage();
    return data.categories;
  });

  useEffect(() => {
    const data = loadFromStorage();
    setAllBoards(data.boards);
    setAllCardsData(data.cards);
    setAllSubcategoriesData(data.subcategories);
    setAllCategoriesData(data.categories);
  }, [boards, cards, subcategories, categories]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return {};

    const q = query.toLowerCase();
    const results = {
      projects: [],
      chapters: [],
      cards: [],
      tasks: [],
      contacts: [],
      tags: [],
      gmrs: [],
      zones: [],
      contracts: [],
      commandes: [],
    };

    allBoards.forEach(board => {
      if (searchInText(board.title, q) || searchInText(board.description, q)) {
        results.projects.push({ ...board, uniqueKey: `project-${board.id}` });
      }
    });

    chapters.forEach((chap, idx) => {
      if (searchInText(chap.name, q)) {
        results.chapters.push({ ...chap, uniqueKey: `chapter-${chap.id || idx}` });
      }
    });

    allCardsData.forEach((card, idx) => {
      if (searchInText(card.title, q) || searchInText(card.description, q)) {
        const board = allBoards.find(b => b.id === card.board_id);
        if (board) {
          results.cards.push({
            ...card,
            boardName: board.title,
            boardId: board.id,
            chapterName: card.chapter,
            uniqueKey: `card-${card.id || idx}`,
          });
        }
      }
    });

    allSubcategoriesData.forEach((sub, idx) => {
      if (searchInText(sub.title, q) || searchInText(sub.description, q)) {
        const category = allCategoriesData.find(cat => Number(cat.id) === Number(sub.category_id));
        const card = category
          ? allCardsData.find(c => Number(c.id) === Number(category.card_id))
          : null;
        // Find board via columns from db
        let boardName = 'Projet';
        let boardId = null;
        if (card) {
          const savedDb = localStorage.getItem('c-projets_db');
          if (savedDb) {
            const db = JSON.parse(savedDb);
            const columnData = db.columns?.find(col => Number(col.id) === Number(card.column_id));
            if (columnData) {
              const boardData = db.boards?.find(b => Number(b.id) === Number(columnData.board_id));
              if (boardData) {
                boardName = boardData.title;
                boardId = boardData.id;
              }
            }
          }
        }
        results.tasks.push({
          ...sub,
          cardTitle: card?.title,
          chapterName: card?.chapter,
          boardName: boardName,
          boardId: boardId,
          uniqueKey: `task-${sub.id || idx}`,
        });
      }
    });

    allBoards.forEach(board => {
      const savedContacts = localStorage.getItem(`board-${board.id}-internalContacts`);
      if (savedContacts && savedContacts !== '[]') {
        const contacts = JSON.parse(savedContacts);
        contacts.forEach((contact, idx) => {
          const name = contact.name || contact.title || '';
          const func = contact.function || '';
          if (name && (searchInText(name, q) || searchInText(func, q))) {
            results.contacts.push({
              ...contact,
              boardName: board.title,
              boardId: board.id,
              uniqueKey: `${board.id}-${contact.id || idx}`,
            });
          }
        });
      }
    });

    tags.forEach((tag, idx) => {
      if (searchInText(tag.name, q)) {
        results.tags.push({ ...tag, uniqueKey: `tag-${tag.id || idx}` });
      }
    });

    gmrs.forEach((gmr, idx) => {
      if (searchInText(gmr.code, q) || searchInText(gmr.label, q)) {
        results.gmrs.push({ ...gmr, uniqueKey: `gmr-${gmr.id || gmr.code || idx}` });
      }
    });

    zones.forEach((zone, idx) => {
      if (searchInText(zone.name, q)) {
        results.zones.push({ ...zone, uniqueKey: `zone-${zone.id || idx}` });
      }
    });

    contracts.forEach((contract, idx) => {
      if (
        searchInText(contract.numero, q) ||
        searchInText(contract.fournisseur, q) ||
        searchInText(contract.acheteur, q)
      ) {
        results.contracts.push({
          ...contract,
          uniqueKey: `contract-${contract.id || contract.numero || idx}`,
        });
      }
    });

    // Recherche dans les commandes
    console.log('[Search] Recherche commandes avec query:', q, 'total:', commandes.length);
    if (commandes[0]) {
      console.log('[Search] Sample full:', JSON.stringify(commandes[0]));
    }
    commandes.forEach((commande, idx) => {
      const donnees = commande.donnees || {};
      const detail = commande.detail || {};
      const commandeData = detail.commande || {};
      const numero =
        donnees.numeroCommande || donnees.numero || commandeData.numeroCommande || commande.title;
      const marche = donnees.marcheCadre || donnees.marche || commandeData.marcheCadre || '';
      const fournisseur = donnees.fournisseur || commandeData.fournisseur || '';
      const matchNumero = searchInText(numero, q);
      const matchMarche = searchInText(marche, q);
      const matchFournisseur = searchInText(fournisseur, q);
      if (idx === 0) {
        console.log('[Search] Test commande:', {
          numero,
          marche,
          fournisseur,
          match: matchNumero || matchMarche || matchFournisseur,
        });
      }
      if (matchNumero || matchMarche || matchFournisseur) {
        results.commandes.push({
          ...commande,
          uniqueKey: `commande-${commande.id || numero || idx}`,
        });
      }
    });
    console.log('[Search] Résultats commandes:', results.commandes.length);

    return results;
  }, [
    query,
    allBoards,
    allCardsData,
    allSubcategoriesData,
    chapters,
    tags,
    gmrs,
    zones,
    contracts,
    commandes,
  ]);

  const totalResults = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);

  const handleProjectClick = boardId => {
    navigate(`/board/${boardId}`);
    setSelectedCard(null);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setActiveTab('informations');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const handleCardClick = (card, boardId) => {
    navigate(`/board/${boardId}`);
    setSelectedCard(card);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setActiveTab('taches');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const handleTaskClick = (sub, card, boardId) => {
    navigate(`/board/${boardId}`);
    setSelectedCard(card);
    setSelectedCategory(null);
    setSelectedSubcategory(sub);
    setActiveTab('taches');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const handleContactClick = boardId => {
    navigate(`/board/${boardId}`);
    setActiveTab('echanges');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const handleTagClick = () => {
    navigate('/system-settings');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const handleGMRClick = () => {
    navigate('/system-settings');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const handleZoneClick = () => {
    navigate('/system-settings');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const handleContractClick = () => {
    navigate('/library');
    if (exitChecked) {
      toggleSearch();
      setExitChecked(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(query);
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    const normalizedParts = normalizedText.split(
      new RegExp(`(${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    );
    return parts.map((part, i) => {
      const normPart = normalizedParts[i] || '';
      if (normPart.toLowerCase() === normalizedQuery.toLowerCase()) {
        return (
          <span key={i} className="bg-accent/30 text-accent font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getCardById = cardId => allCardsData.find(c => c.id === cardId);
  const getBoardById = boardId => allBoards.find(b => b.id === boardId);

  const findChapterInBoards = chapterName => {
    for (const board of allBoards) {
      const boardCards = allCardsData.filter(c => c.boardId === board.id);
      for (const card of boardCards) {
        if (card.chapter === chapterName) {
          return board.id;
        }
      }
    }
    return allBoards[0]?.id;
  };

  const categoryConfig = [
    {
      key: 'projects',
      label: 'Projets',
      icon: Folder,
      color: 'text-blue-500',
      data: searchResults.projects,
      onClick: item => handleProjectClick(item.id),
    },
    {
      key: 'chapters',
      label: 'Chapitres',
      icon: Database,
      color: 'text-purple-500',
      data: searchResults.chapters,
      onClick: item => handleProjectClick(findChapterInBoards(item.name)),
    },
    {
      key: 'cards',
      label: 'Cartes',
      icon: FileText,
      color: 'text-green-500',
      data: searchResults.cards,
      onClick: item => handleCardClick(item, item.boardId),
    },
    {
      key: 'tasks',
      label: 'Tâches',
      icon: CheckSquare,
      color: 'text-orange-500',
      data: searchResults.tasks,
      onClick: item => handleTaskClick(item, getCardById(item.cardId), item.boardId),
    },
    {
      key: 'contacts',
      label: 'Contacts',
      icon: Users,
      color: 'text-cyan-500',
      data: searchResults.contacts,
      onClick: item => handleContactClick(item.boardId),
    },
    {
      key: 'tags',
      label: 'Tags',
      icon: Tag,
      color: 'text-pink-500',
      data: searchResults.tags,
      onClick: handleTagClick,
    },
    {
      key: 'gmrs',
      label: 'GMR',
      icon: Hash,
      color: 'text-yellow-500',
      data: searchResults.gmrs,
      onClick: handleGMRClick,
    },
    {
      key: 'zones',
      label: 'Zones',
      icon: MapPin,
      color: 'text-emerald-500',
      data: searchResults.zones,
      onClick: handleZoneClick,
    },
    {
      key: 'contracts',
      label: 'Contrats',
      icon: Briefcase,
      color: 'text-indigo-500',
      data: searchResults.contracts,
      onClick: handleContractClick,
    },
    {
      key: 'commandes',
      label: 'Commandes',
      icon: ShoppingCart,
      color: 'text-orange-500',
      data: searchResults.commandes,
      onClick: item => {
        if (item.boardId) {
          loadBoard(item.boardId);
        }
        setSelectedCommande(item);
        setActiveTab('commandes');
        setActiveTabCommande('commande');
        toggleSearch();
      },
    },
  ];

  if (!searchOpen) return null;

  return (
    <div className="search-panel absolute right-0 top-14 w-[320px] h-[calc(100%-3.5rem)] bg-card border-l border-std flex flex-col z-40">
      <div className="flex items-center justify-between p-4 border-b border-std bg-card-hover">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-accent" />
          <h2 className="font-semibold text-primary">Recherche</h2>
        </div>
        <button
          onClick={toggleSearch}
          className="p-1 text-muted hover:text-primary rounded hover:bg-card transition-std"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 border-b border-std">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Tapez un mot..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-std rounded-md text-primary placeholder-muted focus:outline-none focus:border-accent"
            autoFocus
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="exitChecked"
            checked={exitChecked}
            onChange={e => setExitChecked(e.target.checked)}
            className="rounded border-std"
          />
          <label htmlFor="exitChecked" className="text-xs text-muted">
            Fermer après sélection
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          <div className="p-4 text-center text-muted text-sm">
            <p>Commencez à taper pour rechercher</p>
            <p className="mt-2 text-xs">
              Projets, cartes, tâches, contacts, tags, GMR, zones, contrats...
            </p>
          </div>
        ) : totalResults === 0 ? (
          <div className="p-4 text-center text-muted text-sm">Aucun résultat pour "{query}"</div>
        ) : (
          <div className="p-2">
            {categoryConfig.map(cat => {
              if (cat.data.length === 0) return null;
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Icon size={14} className={cat.color} />
                    <span className="text-xs font-medium text-muted uppercase">{cat.label}</span>
                    <span className="text-xs text-muted">({cat.data.length})</span>
                  </div>
                  <div className="space-y-1">
                    {cat.data.map((item, idx) => (
                      <button
                        key={item.uniqueKey || `${cat.key}-${item.id}-${idx}`}
                        onClick={() => cat.onClick(item)}
                        className="w-full text-left p-2 rounded hover:bg-card-hover transition-std"
                      >
                        <div className="text-sm text-primary truncate font-medium">
                          {cat.key === 'commandes'
                            ? item.donnees?.numeroCommande || item.title
                            : item.name || item.title || item.label || item.numero || item.code}
                        </div>
                        <div className="text-xs text-accent truncate">
                          {cat.key === 'projects' && 'Projet'}
                          {cat.key === 'chapters' && (item.boardName || 'Chapitre')}
                          {cat.key === 'cards' && (item.boardName || 'Tâches')}
                          {cat.key === 'tasks' &&
                            `${item.boardName || 'Projet'} > ${item.chapterName || 'Chapitre'} > ${item.cardTitle || 'Carte'}`}
                          {cat.key === 'contacts' && (item.boardName || 'Échanges')}
                          {cat.key === 'tags' && 'Paramètres > Tags'}
                          {cat.key === 'gmrs' && 'Paramètres > GMR'}
                          {cat.key === 'zones' && 'Paramètres > Zones'}
                          {cat.key === 'contracts' && 'Bibliothèque > Contrats'}
                          {cat.key === 'commandes' && (item.boardName || 'Projet')}
                        </div>
                        {(item.fournisseur ||
                          item.acheteer ||
                          item.donnees?.fournisseur ||
                          item.donnees?.marcheCadre) && (
                          <div className="text-xs text-muted truncate">
                            {cat.key === 'commandes'
                              ? `${item.donnees?.fournisseur || ''} ${item.donnees?.marcheCadre ? '• ' + item.donnees.marcheCadre : ''}`
                              : `${item.fournisseur} ${item.acheteur ? '• ' + item.acheteur : ''}`}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-std bg-card-hover text-center">
        <span className="text-xs text-muted">
          {totalResults} résultat{totalResults !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

export default SearchPanel;
