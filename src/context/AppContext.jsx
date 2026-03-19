import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { libraryTemplates } from '../data/libraryData';
import { loadGMRData, saveGMRData } from '../data/GMRData';
import { loadPriorityData, savePriorityData } from '../data/PriorityData';
import { loadZonesData, saveZonesData } from '../data/ZonesData';
import { loadTagsData, saveTagsData } from '../data/TagsData';
import { loadChaptersOrder, saveChaptersOrder } from '../data/ChaptersData';

const STORAGE_KEY = 'mytrello_db';

function formatDuration(days) {
  const hours = days * 24;
  return `PT${hours}H0M0S`;
}

function convertTreeToLibraryItems(treeData) {
  const libraryItems = [];
  const cardMap = new Map();
  let itemId = 1;

  const processNode = (node, chapitre = '', carte = '', categorie = '') => {
    let currentChapitre = chapitre;
    let currentCarte = carte;
    let currentCategorie = categorie;

    if (node.type === 'chapitre') {
      currentChapitre = node.data.chapitre || node.titre;
    } else if (node.type === 'carte') {
      currentCarte = node.data.carte || node.titre;
    } else if (node.type === 'categorie') {
      currentCategorie = node.data.categorie || node.titre;
    }

    if (node.type === 'carte' || node.type === 'categorie' || node.type === 'souscategorie') {
      const tags = [node.data.categorieTag || '', node.data.domaineTag || '']
        .filter(Boolean)
        .join(',');

      let cardItem = cardMap.get(currentCarte);
      if (!cardItem) {
        cardItem = {
          id: itemId++,
          title: currentCarte,
          type: 'card',
          tags: tags,
          duration: node.data.temps || 0,
          content_json: JSON.stringify({
            card: {
              title: currentCarte,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
            },
            categories: [],
          }),
        };
        cardMap.set(currentCarte, cardItem);
        libraryItems.push(cardItem);
      }

      if (node.type === 'categorie' || node.type === 'souscategorie') {
        const content = JSON.parse(cardItem.content_json);
        let category = content.categories.find(c => c.title === currentCategorie);
        if (!category) {
          category = {
            title: currentCategorie,
            description: '',
            priority: 'normal',
            duration_days: node.data.temps || 0,
            subcategories: [],
          };
          content.categories.push(category);
        }

        libraryItems.push({
          id: itemId++,
          title: currentCategorie,
          type: 'category',
          tags: tags,
          duration: node.data.temps || 0,
          content_json: JSON.stringify({
            category: {
              title: currentCategorie,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
            },
          }),
        });

        if (node.type === 'souscategorie' && node.data.sousCat1) {
          if (!category.subcategories.find(s => s.title === node.data.sousCat1)) {
            category.subcategories.push({
              title: node.data.sousCat1,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
            });
          }

          libraryItems.push({
            id: itemId++,
            title: node.data.sousCat1,
            type: 'subcategory',
            tags: tags,
            duration: node.data.temps || 0,
            content_json: JSON.stringify({
              subcategory: {
                title: node.data.sousCat1,
                description: '',
                priority: 'normal',
                duration_days: node.data.temps || 0,
              },
            }),
          });
        }

        cardItem.content_json = JSON.stringify(content);
      }
    }

    if (node.children) {
      node.children.forEach(child =>
        processNode(child, currentChapitre, currentCarte, currentCategorie)
      );
    }
  };

  treeData.forEach(node => processNode(node));
  return libraryItems;
}

const AppContext = createContext();

function addWorkingDays(startDate, days) {
  if (!startDate || days <= 0) return startDate;
  const result = new Date(startDate);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }
  return result.toISOString().split('T')[0];
}

function getWorkingDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  const current = new Date(start);
  while (current < end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    console.log('[loadFromStorage] Loaded, cards:', parsed.cards?.length || 0);
    return parsed;
  }
  console.log('[loadFromStorage] No data found');
  return {
    boards: [],
    columns: [],
    cards: [],
    categories: [],
    subcategories: [],
    libraryItems: [],
    messages: [],
    nextIds: {
      board: 1,
      column: 1,
      card: 1,
      category: 1,
      subcategory: 1,
      libraryItem: 1,
      message: 1,
    },
  };
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[saveToStorage] Error:', e);
  }
}

function initDefaultData() {
  const data = loadFromStorage();
  if (!data.orders) {
    data.orders = [];
  }
  if (!data.nextIds) {
    data.nextIds = {
      board: 2,
      column: 6,
      card: 1,
      category: 1,
      subcategory: 1,
      libraryItem: 1,
      order: 1,
    };
  } else if (!data.nextIds.order) {
    data.nextIds.order = 1;
  }

  // Ensure libraryItems has data - always check library editor first (admin defines the master data)
  if (!data.libraryItems || data.libraryItems.length === 0) {
    console.log('[AppContext] Loading library templates');
    // Check if custom library data exists in LibraryEditor storage
    const customLibrary = localStorage.getItem('mytrello_library_editor');
    if (customLibrary) {
      try {
        const treeData = JSON.parse(customLibrary);
        data.libraryItems = convertTreeToLibraryItems(treeData);
        console.log('[AppContext] Loaded custom library from editor');
      } catch (e) {
        console.error('[AppContext] Error loading custom library:', e);
        data.libraryItems = libraryTemplates;
      }
    } else {
      data.libraryItems = libraryTemplates;
    }
  } else {
    // Even if libraryItems exists, check if admin has updated the library editor
    const customLibrary = localStorage.getItem('mytrello_library_editor');
    if (customLibrary) {
      try {
        const treeData = JSON.parse(customLibrary);
        data.libraryItems = convertTreeToLibraryItems(treeData);
        console.log('[AppContext] Updated libraryItems from library editor');
      } catch (e) {
        console.error('[AppContext] Error loading custom library:', e);
        // Keep existing data
      }
    }
  }
  if (data.boards.length === 0) {
    const boardId = 1;
    data.boards.push({
      id: boardId,
      title: 'Mon Premier Projet',
      description: 'Projet par défaut',
      created_at: new Date().toISOString(),
      is_archived: 0,
    });
    data.columns = [
      { id: 1, board_id: boardId, title: 'À faire', position: 0, color: '#4A90D9' },
      { id: 2, board_id: boardId, title: 'En cours', position: 1, color: '#F5A623' },
      { id: 3, board_id: boardId, title: 'En attente', position: 2, color: '#9CA3AF' },
      { id: 4, board_id: boardId, title: 'Terminée', position: 3, color: '#7ED321' },
      { id: 5, board_id: boardId, title: 'Archiver', position: 4, color: '#475569' },
    ];
    data.nextIds = {
      board: 2,
      column: 6,
      card: 1,
      category: 1,
      subcategory: 1,
      libraryItem: 1,
      message: 1,
      order: 1,
    };
  } else {
    const titleCounts = {};
    data.boards.forEach(b => {
      titleCounts[b.title] = (titleCounts[b.title] || 0) + 1;
    });
    for (const [title, count] of Object.entries(titleCounts)) {
      if (count > 1) {
        const duplicates = data.boards.filter(b => b.title === title).sort((a, b) => b.id - a.id);
        const toKeep = duplicates[0];
        const toRemoveIds = duplicates.slice(1).map(d => d.id);
        data.columns = data.columns.filter(c => !toRemoveIds.includes(c.board_id));
        data.cards = data.cards.filter(c => !toRemoveIds.includes(c.column_id));
        data.boards = data.boards.filter(b => !toRemoveIds.includes(b.id));
      }
    }
  }
  if (data.boards.length > 0 && data.columns.length === 0) {
    const boardId = data.boards[0].id;
    data.columns = [
      { id: 1, board_id: boardId, title: 'À faire', position: 0, color: '#4A90D9' },
      { id: 2, board_id: boardId, title: 'En cours', position: 1, color: '#F5A623' },
      { id: 3, board_id: boardId, title: 'En attente', position: 2, color: '#9CA3AF' },
      { id: 4, board_id: boardId, title: 'Terminée', position: 3, color: '#7ED321' },
      { id: 5, board_id: boardId, title: 'Archiver', position: 4, color: '#475569' },
    ];
  }
  saveToStorage(data);
  if (data.boards.length === 0) {
    const boardId = 1;
    data.boards.push({
      id: boardId,
      title: 'Mon Premier Projet',
      description: 'Projet par défaut',
      created_at: new Date().toISOString(),
      is_archived: 0,
    });
    data.columns.push(
      { id: 1, board_id: boardId, title: 'À faire', position: 0, color: '#4A90D9' },
      { id: 2, board_id: boardId, title: 'En cours', position: 1, color: '#F5A623' },
      { id: 3, board_id: boardId, title: 'En attente', position: 2, color: '#9CA3AF' },
      { id: 4, board_id: boardId, title: 'Terminée', position: 3, color: '#7ED321' },
      { id: 5, board_id: boardId, title: 'Archiver', position: 4, color: '#475569' }
    );
    data.nextIds = {
      board: 2,
      column: 6,
      card: 1,
      category: 1,
      subcategory: 1,
      libraryItem: 1,
      message: 1,
      order: 1,
    };
    saveToStorage(data);
  }
  return data;
}

export function AppProvider({ children }) {
  const [db, setDb] = useState(() => initDefaultData());
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUsername, setCurrentUsername] = useState(
    () => localStorage.getItem('mytrello-username') || ''
  );
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState('panel');
  const [theme, setTheme] = useState('dark');
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [unreadMentions, setUnreadMentions] = useState({});
  const [projectTimer, setProjectTimer] = useState({
    activeProjectId: null,
    startTime: null,
    intervals: {},
  });
  const [cardColors, setCardColors] = useState({
    etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
    enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
    realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
    archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('mytrello-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedColors = localStorage.getItem('mytrello-cardColors');
    if (savedColors) {
      setCardColors(JSON.parse(savedColors));
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('mytrello-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mytrello-cardColors', JSON.stringify(cardColors));
  }, [cardColors]);

  useEffect(() => {
    const activeBoards = db.boards.filter(b => !b.is_archived);
    setBoards(activeBoards.sort((a, b) => a.title.localeCompare(b.title)));
    if (activeBoards.length > 0 && !currentBoard) {
      const firstBoard = activeBoards[0];
      setCurrentBoard(firstBoard);
      const boardColumns = db.columns.filter(c => Number(c.board_id) === Number(firstBoard.id));
      const columnIds = boardColumns.map(c => Number(c.id));
      setCards(
        db.cards
          .filter(c => columnIds.includes(Number(c.column_id)) && !c.is_archived)
          .sort((a, b) => a.position - b.position)
      );
      const cardIds = db.cards
        .filter(c => columnIds.includes(Number(c.column_id)))
        .map(c => Number(c.id));
      setCategories(
        db.categories
          .filter(c => cardIds.includes(Number(c.card_id)))
          .sort((a, b) => a.position - b.position)
      );
      const catIds = db.categories
        .filter(c => cardIds.includes(Number(c.card_id)))
        .map(c => Number(c.id));
      setSubcategories(
        db.subcategories
          .filter(s => catIds.includes(Number(s.category_id)))
          .sort((a, b) => a.position - b.position)
      );
    }
  }, [db.boards, db.columns, db.cards, db.categories, db.subcategories, currentBoard]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const updateCardColors = useCallback(newColors => {
    setCardColors(newColors);
  }, []);

  const resetCardColors = useCallback(() => {
    setCardColors({
      etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
      enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
      realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
      archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
    });
  }, []);

  const saveDb = useCallback(newDb => {
    setDb(newDb);
    saveToStorage(newDb);
  }, []);

  const loadBoard = useCallback(boardId => {
    const storageData = loadFromStorage();
    const board = storageData.boards.find(b => Number(b.id) === Number(boardId));
    if (board) {
      setCurrentBoard(board);
      const boardColumns = storageData.columns.filter(c => Number(c.board_id) === Number(boardId));
      const columnIds = boardColumns.map(c => Number(c.id));
      const filteredCards = storageData.cards.filter(
        c =>
          (columnIds.includes(Number(c.column_id)) ||
            c.column_id === null ||
            c.column_id === undefined ||
            c.column_id === '' ||
            c.column_id === 0 ||
            !c.column_id) &&
          !c.is_archived
      );
      setColumns(boardColumns.sort((a, b) => a.position - b.position));
      setCards(filteredCards.sort((a, b) => a.position - b.position));
      const cardIds = filteredCards.map(c => Number(c.id));
      setCategories(
        storageData.categories
          .filter(c => cardIds.includes(Number(c.card_id)))
          .sort((a, b) => a.position - b.position)
      );
      const catIds = storageData.categories
        .filter(c => cardIds.includes(Number(c.card_id)))
        .map(c => Number(c.id));
      setSubcategories(
        storageData.subcategories
          .filter(s => catIds.includes(Number(s.category_id)))
          .sort((a, b) => a.position - b.position)
      );

      if (selectedSubcategory) {
        const updatedSub = storageData.subcategories.find(
          s => Number(s.id) === Number(selectedSubcategory.id)
        );
        if (updatedSub) {
          setSelectedSubcategory(updatedSub);
        }
      }
    }
  }, []);

  // Project time tracking functions
  const getWeekNumber = date => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
      .toString()
      .padStart(2, '0')}`;
  };

  const loadProjectTime = () => {
    const stored = localStorage.getItem('mytrello_project_time');
    return stored ? JSON.parse(stored) : {};
  };

  const saveProjectTime = data => {
    localStorage.setItem('mytrello_project_time', JSON.stringify(data));
  };

  const getWeekKey = (date = new Date()) => {
    return getWeekNumber(date);
  };

  const getWeekNumberFromKey = weekKey => {
    if (!weekKey || typeof weekKey !== 'string') return getWeekNumber(new Date());
    const parts = weekKey.split('-W');
    if (parts.length !== 2) return getWeekNumber(new Date());
    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);
    if (isNaN(year) || isNaN(week)) return getWeekNumber(new Date());
    return weekKey;
  };

  const getInternalContacts = boardId => {
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
    if (!boardId) return defaultContacts;
    const saved = localStorage.getItem(`board-${boardId}-internalContacts`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultContacts;
      }
    }
    return defaultContacts;
  };

  const addProjectTime = (projectId, seconds) => {
    const week = getWeekKey();
    const data = loadProjectTime();
    if (!data[week]) data[week] = {};
    if (!data[week][projectId]) data[week][projectId] = 0;
    data[week][projectId] += seconds;
    saveProjectTime(data);
  };

  const getProjectTime = (projectId, week = null) => {
    const w = week ? week : getWeekKey();
    const data = loadProjectTime();
    return data[w]?.[String(projectId)] || 0;
  };

  const getAllProjectTime = (week = null) => {
    const w = week || getWeekKey();
    const data = loadProjectTime();
    return data[w] || {};
  };

  const clearProjectTimer = () => {
    setProjectTimer({ activeProjectId: null, startTime: null, intervals: {} });
  };

  // Timer effect - runs every second when a project is active
  useEffect(() => {
    let interval = null;

    if (projectTimer.activeProjectId && projectTimer.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - projectTimer.startTime) / 1000);
        if (elapsed >= 1) {
          addProjectTime(projectTimer.activeProjectId, elapsed);
          setProjectTimer(prev => ({ ...prev, startTime: now }));
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectTimer.activeProjectId, projectTimer.startTime]);

  // Update timer when currentBoard changes
  useEffect(() => {
    if (currentBoard) {
      const now = new Date();
      setProjectTimer(prev => {
        if (
          prev.activeProjectId &&
          prev.startTime &&
          prev.activeProjectId !== String(currentBoard.id)
        ) {
          const elapsed = Math.floor((now - prev.startTime) / 1000);
          if (elapsed > 0) {
            addProjectTime(prev.activeProjectId, elapsed);
          }
        }
        return {
          activeProjectId: String(currentBoard.id),
          startTime: now,
          intervals: {},
        };
      });
    }
  }, [currentBoard?.id]);

  // Ensure libraryItems has data - always check library editor first
  const forceLibraryItems = () => {
    // Always check if custom library data exists in LibraryEditor storage
    const customLibrary = localStorage.getItem('mytrello_library_editor');
    let itemsToUse;

    if (customLibrary) {
      try {
        const treeData = JSON.parse(customLibrary);
        itemsToUse = convertTreeToLibraryItems(treeData);
        console.log('[AppContext] Loading custom library from editor, count:', itemsToUse.length);
      } catch (e) {
        console.error('[AppContext] Error loading custom library:', e);
        itemsToUse =
          db.libraryItems && db.libraryItems.length > 0 ? db.libraryItems : libraryTemplates;
      }
    } else if (db.libraryItems && db.libraryItems.length > 0) {
      itemsToUse = libraryTemplates;
      console.log('[AppContext] Using libraryTemplates, count:', itemsToUse.length);
    } else {
      itemsToUse = libraryTemplates;
      console.log(
        '[AppContext] Loading library templates, count:',
        libraryTemplates.length,
        'first:',
        libraryTemplates[0]?.title
      );
    }

    const newDb = { ...db, libraryItems: itemsToUse };
    setDb(newDb);
    setLibraryItems(itemsToUse);
    saveToStorage(newDb);
  };

  // Check and load library on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    forceLibraryItems();
  }, []);

  // Listen for library updates from LibraryEditor
  useEffect(() => {
    const handleLibraryUpdate = () => {
      // Always prioritize library editor storage
      const customLibrary = localStorage.getItem('mytrello_library_editor');
      if (customLibrary) {
        try {
          const treeData = JSON.parse(customLibrary);
          const itemsToUse = convertTreeToLibraryItems(treeData);

          // Update mytrello_db with the new libraryItems
          let mainDb = localStorage.getItem('mytrello_db');
          if (mainDb) {
            const dbObj = JSON.parse(mainDb);
            dbObj.libraryItems = itemsToUse;
            localStorage.setItem('mytrello_db', JSON.stringify(dbObj));
          }

          // Force update by creating new object reference
          setLibraryItems([...itemsToUse]);
          console.log('[AppContext] Reloaded library from editor, count:', itemsToUse.length);
        } catch (e) {
          console.error('[AppContext] Error reloading library from editor:', e);
        }
      } else {
        // Fallback to main database
        const mainDb = localStorage.getItem('mytrello_db');
        if (mainDb) {
          try {
            const updatedDb = JSON.parse(mainDb);
            setLibraryItems([...(updatedDb.libraryItems || [])]);
          } catch (e) {
            console.error('[AppContext] Error reloading library:', e);
          }
        }
      }
      // Force re-render of all components using libraryItems
      setTimeout(() => window.dispatchEvent(new Event('library-refreshed')), 0);
    };

    window.addEventListener('library-updated', handleLibraryUpdate);
    return () => window.removeEventListener('library-updated', handleLibraryUpdate);
  }, []);

  const loadBoards = useCallback(() => {
    setLoading(true);
    const activeBoards = db.boards.filter(b => !b.is_archived);
    setBoards(activeBoards.sort((a, b) => a.title.localeCompare(b.title)));
    setLibraryItems(db.libraryItems || []);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    const activeBoards = db.boards.filter(b => !b.is_archived);
    setBoards(activeBoards.sort((a, b) => a.title.localeCompare(b.title)));
  }, [db.boards]);

  useEffect(() => {
    setLibraryItems(db.libraryItems || []);
  }, [db.libraryItems]);

  const generateTestData = () => {
    if (!currentBoard && db.boards.length === 0) {
      initDefaultData();
      return;
    }

    let newDb = {
      boards: db.boards,
      columns: [...db.columns],
      cards: [],
      categories: [],
      subcategories: [],
      libraryItems: [...(db.libraryItems || [])],
      nextIds: { ...db.nextIds },
    };

    const testCards = [
      {
        title: 'Poste 400kV Saint-Étienne-du-Rouvray',
        description: 'Construction nouveau poste source',
        priority: 'urgent',
        dueDate: '2026-06-30',
      },
      {
        title: 'Poste 225kV Lyon-Est',
        description: 'Rénovation poste existant',
        priority: 'high',
        dueDate: '2026-09-15',
      },
      {
        title: 'Liaison Haute Tension Bordeaux-Nantes',
        description: 'Tracé 45km lignes aériennes',
        priority: 'normal',
        dueDate: '2026-12-01',
      },
    ];

    const testCategories = [
      { title: 'Études GC', description: 'Génie civil' },
      { title: 'Études Électriques HTB', description: 'Haute tension' },
      { title: 'Réalisation GC', description: 'Travaux génie civil' },
      { title: 'Suivi administratif', description: 'Permis, autorisations' },
    ];

    const testSubcategories = [
      { title: 'Terrassements' },
      { title: 'Fondations' },
      { title: 'Dallage' },
      { title: 'Clôture' },
      { title: 'Réseaux enterrés' },
    ];

    const colId = Number(
      newDb.columns.find(c => Number(c.board_id) === Number(currentBoard.id))?.id
    );

    testCards.forEach((card, i) => {
      const cardId = newDb.nextIds.card++;
      newDb.cards.push({
        id: cardId,
        column_id: colId,
        title: card.title,
        description: card.description,
        priority: card.priority,
        due_date: card.dueDate,
        assignee: 'Éric',
        position: i,
        is_archived: 0,
        created_at: new Date().toISOString(),
      });

      testCategories.forEach((cat, j) => {
        const catId = newDb.nextIds.category++;
        newDb.categories.push({
          id: catId,
          card_id: cardId,
          title: cat.title,
          description: cat.description,
          priority: 'normal',
          position: j,
          created_at: new Date().toISOString(),
        });

        testSubcategories.forEach((subcat, k) => {
          newDb.subcategories.push({
            id: newDb.nextIds.subcategory++,
            category_id: catId,
            title: subcat.title,
            description: '',
            priority: 'normal',
            position: k,
            created_at: new Date().toISOString(),
          });
        });
      });
    });

    saveDb(newDb);
    loadBoard(currentBoard.id);
  };

  const exportData = () => {
    console.log('[ExportData] Starting export...');
    try {
      const projectTime = localStorage.getItem('mytrello_project_time');
      const libraryFavorites = localStorage.getItem('mytrello_library_favorites');
      const libraryEditor = localStorage.getItem('mytrello_library_editor');
      const libraryTemplates = localStorage.getItem('mytrello_library_templates');
      const theme = localStorage.getItem('mytrello-theme');
      const cardColors = localStorage.getItem('mytrello-cardColors');
      const username = localStorage.getItem('mytrello-username');
      const userRole = localStorage.getItem('mytrello-user-role');

      console.log('[ExportData] Loading databases...');
      const gmr = loadGMRData();
      const priority = loadPriorityData();
      const zones = loadZonesData();
      const tags = loadTagsData();
      console.log('[ExportData] Databases loaded:', { gmr, priority, zones, tags });

      const projectDataKeys = [
        'links',
        'commandes',
        'eotp',
        'internalContacts',
        'externalContacts',
        'gmr',
        'priority',
        'zone',
      ];
      const projectData = {};
      db.boards.forEach(board => {
        projectData[board.id] = {};
        projectDataKeys.forEach(key => {
          const stored = localStorage.getItem(`board-${board.id}-${key}`);
          if (stored) {
            try {
              projectData[board.id][key] = JSON.parse(stored);
            } catch {
              projectData[board.id][key] = stored;
            }
          }
        });
      });

      const exportObj = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: db,
        projectTime: projectTime ? JSON.parse(projectTime) : {},
        libraryFavorites: libraryFavorites ? JSON.parse(libraryFavorites) : {},
        libraryEditor: libraryEditor ? JSON.parse(libraryEditor) : null,
        libraryTemplates: libraryTemplates ? JSON.parse(libraryTemplates) : { templates: [] },
        settings: {
          theme,
          cardColors: cardColors ? JSON.parse(cardColors) : null,
          username,
          userRole,
        },
        databases: {
          gmr,
          priority,
          zones,
          tags,
          chaptersOrder: loadChaptersOrder(),
        },
        projectsData: projectData,
      };

      console.log('[ExportData] Creating blob...');
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mytrello-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[ExportData] Export completed successfully');
    } catch (err) {
      console.error('[ExportData] Error during export:', err);
      throw err;
    }
  };

  const importData = jsonData => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!parsed.data) {
        return { success: false, error: 'Format de fichier invalide: aucune donnée trouvée' };
      }

      setDb(parsed.data);
      saveToStorage(parsed.data);

      if (parsed.projectTime) {
        localStorage.setItem('mytrello_project_time', JSON.stringify(parsed.projectTime));
      }
      if (parsed.libraryFavorites) {
        localStorage.setItem('mytrello_library_favorites', JSON.stringify(parsed.libraryFavorites));
      }
      if (parsed.libraryEditor) {
        localStorage.setItem('mytrello_library_editor', JSON.stringify(parsed.libraryEditor));
      }
      if (parsed.libraryTemplates) {
        localStorage.setItem('mytrello_library_templates', JSON.stringify(parsed.libraryTemplates));
      }
      if (parsed.settings) {
        if (parsed.settings.theme) {
          localStorage.setItem('mytrello-theme', parsed.settings.theme);
          setTheme(parsed.settings.theme);
        }
        if (parsed.settings.cardColors) {
          localStorage.setItem('mytrello-cardColors', JSON.stringify(parsed.settings.cardColors));
        }
        if (parsed.settings.username) {
          localStorage.setItem('mytrello-username', parsed.settings.username);
        }
        if (parsed.settings.userRole) {
          localStorage.setItem('mytrello-user-role', parsed.settings.userRole);
        }
      }

      if (parsed.databases) {
        if (parsed.databases.gmr) {
          saveGMRData(parsed.databases.gmr);
        }
        if (parsed.databases.priority) {
          savePriorityData(parsed.databases.priority);
        }
        if (parsed.databases.zones) {
          saveZonesData(parsed.databases.zones);
        }
        if (parsed.databases.tags) {
          saveTagsData(parsed.databases.tags);
        }
        if (parsed.databases.chaptersOrder) {
          saveChaptersOrder(parsed.databases.chaptersOrder);
        }
      }

      if (parsed.projectsData) {
        Object.entries(parsed.projectsData).forEach(([boardId, data]) => {
          if (data.links) {
            localStorage.setItem(`board-${boardId}-links`, JSON.stringify(data.links));
          }
          if (data.commandes) {
            localStorage.setItem(`board-${boardId}-commandes`, JSON.stringify(data.commandes));
          }
          if (data.eotp) {
            localStorage.setItem(`board-${boardId}-eotp`, JSON.stringify(data.eotp));
          }
          if (data.internalContacts) {
            localStorage.setItem(
              `board-${boardId}-internalContacts`,
              JSON.stringify(data.internalContacts)
            );
          }
          if (data.externalContacts) {
            localStorage.setItem(
              `board-${boardId}-externalContacts`,
              JSON.stringify(data.externalContacts)
            );
          }
          if (data.gmr) {
            localStorage.setItem(`board-${boardId}-gmr`, data.gmr);
          }
          if (data.priority) {
            localStorage.setItem(`board-${boardId}-priority`, data.priority);
          }
          if (data.zone) {
            localStorage.setItem(`board-${boardId}-zone`, data.zone);
          }
        });
      }

      if (parsed.data.boards && parsed.data.boards.length > 0) {
        loadBoard(parsed.data.boards[0].id);
      }
      return { success: true };
    } catch (e) {
      console.error('[Import] Error:', e);
      return { success: false, error: e.message };
    }
  };

  const createBoard = (title, description = '') => {
    const boardId = db.nextIds.board++;
    const newBoard = {
      id: boardId,
      title,
      description,
      created_at: new Date().toISOString(),
      is_archived: 0,
    };
    const newDb = {
      ...db,
      boards: [...db.boards, newBoard],
      columns: [
        ...db.columns,
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'À faire',
          position: 0,
          color: '#4A90D9',
        },
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'En cours',
          position: 1,
          color: '#F5A623',
        },
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'En attente',
          position: 2,
          color: '#9CA3AF',
        },
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'Terminée',
          position: 3,
          color: '#7ED321',
        },
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'Archiver',
          position: 4,
          color: '#475569',
        },
      ],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    loadBoard(boardId);
    return boardId;
  };

  const updateBoard = (id, title, description) => {
    const newDb = {
      ...db,
      boards: db.boards.map(b =>
        Number(b.id) === Number(id)
          ? { ...b, title, description, updated_at: new Date().toISOString() }
          : b
      ),
    };
    saveDb(newDb);
  };

  const deleteBoard = id => {
    const newDb = {
      ...db,
      boards: db.boards.filter(b => Number(b.id) !== Number(id)),
      columns: db.columns.filter(c => Number(c.board_id) !== Number(id)),
      cards: db.cards.filter(c => {
        const col = db.columns.find(col => Number(col.id) === Number(c.column_id));
        return !col || Number(col.board_id) !== Number(id);
      }),
    };
    saveDb(newDb);
  };

  const createOrder = (boardId, title) => {
    const orderId = db.nextIds.order++;
    const newOrder = {
      id: orderId,
      board_id: Number(boardId),
      title,
      donnees: { numero: '', date: '', objet: '', estimation: '' },
      groupes: null,
      avenants: [],
      ficheAchat: null,
      created_at: new Date().toISOString(),
    };
    const newDb = {
      ...db,
      orders: [...(db.orders || []), newOrder],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    return orderId;
  };

  const updateOrder = (orderId, updates) => {
    const newDb = {
      ...db,
      orders: (db.orders || []).map(o =>
        Number(o.id) === Number(orderId) ? { ...o, ...updates } : o
      ),
    };
    saveDb(newDb);
  };

  const deleteOrder = orderId => {
    const newDb = {
      ...db,
      orders: (db.orders || []).filter(o => Number(o.id) !== Number(orderId)),
    };
    saveDb(newDb);
  };

  const addAvenant = (orderId, title) => {
    const order = (db.orders || []).find(o => Number(o.id) === Number(orderId));
    if (!order) return null;
    const avenantNumber = (order.avenants?.length || 0) + 1;
    const newAvenant = {
      id: Date.now(),
      numero: avenantNumber,
      title: title || `Avenant ${avenantNumber}`,
      groupes: null,
      ficheAchat: null,
    };
    const updatedAvenants = [...(order.avenants || []), newAvenant];
    const newDb = {
      ...db,
      orders: (db.orders || []).map(o =>
        Number(o.id) === Number(orderId) ? { ...o, avenants: updatedAvenants } : o
      ),
    };
    saveDb(newDb);
    return newAvenant.id;
  };

  const updateAvenant = (orderId, avenantId, updates) => {
    const newDb = {
      ...db,
      orders: (db.orders || []).map(o => {
        if (Number(o.id) !== Number(orderId)) return o;
        return {
          ...o,
          avenants: (o.avenants || []).map(a =>
            Number(a.id) === Number(avenantId) ? { ...a, ...updates } : a
          ),
        };
      }),
    };
    saveDb(newDb);
  };

  const deleteAvenant = (orderId, avenantId) => {
    const newDb = {
      ...db,
      orders: (db.orders || []).map(o => {
        if (Number(o.id) !== Number(orderId)) return o;
        return {
          ...o,
          avenants: (o.avenants || []).filter(a => Number(a.id) !== Number(avenantId)),
        };
      }),
    };
    saveDb(newDb);
  };

  const getOrdersByBoard = boardId => {
    return (db.orders || []).filter(o => Number(o.board_id) === Number(boardId));
  };

  const createColumn = (boardId, title, color = '#4A90D9') => {
    const maxPos = db.columns
      .filter(c => Number(c.board_id) === Number(boardId))
      .reduce((max, c) => Math.max(max, c.position), -1);
    const colId = db.nextIds.column++;
    const newDb = {
      ...db,
      columns: [
        ...db.columns,
        { id: colId, board_id: Number(boardId), title, position: maxPos + 1, color },
      ],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    loadBoard(boardId);
    return colId;
  };

  const updateColumn = (id, title, color) => {
    const newDb = {
      ...db,
      columns: db.columns.map(c => (Number(c.id) === Number(id) ? { ...c, title, color } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const deleteColumn = id => {
    const newDb = {
      ...db,
      columns: db.columns.filter(c => Number(c.id) !== Number(id)),
      cards: db.cards.filter(c => Number(c.column_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const moveColumn = (columnId, newPosition) => {
    const column = db.columns.find(c => Number(c.id) === Number(columnId));
    if (!column) return;
    const oldPosition = column.position;
    if (oldPosition === newPosition) return;

    let newColumns = db.columns.map(c => {
      if (Number(c.id) === Number(columnId)) return { ...c, position: newPosition };
      if (
        Number(c.board_id) === Number(column.board_id) &&
        c.position >= Math.min(oldPosition, newPosition) &&
        c.position <= Math.max(oldPosition, newPosition)
      ) {
        return { ...c, position: c.position + (newPosition > oldPosition ? -1 : 1) };
      }
      return c;
    });

    const newDb = { ...db, columns: newColumns };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const createCard = (
    columnId,
    title,
    description = '',
    priority = 'normal',
    dueDate = null,
    assignee = '',
    startDate = null,
    durationDays = 1,
    parentId = null,
    predecessorId = null,
    reloadBoardId = null,
    chapter = null
  ) => {
    console.log('[createCard] Called with columnId:', columnId, 'title:', title);

    // Check for duplicate card title in current project (same column)
    const existingCard = db.cards.find(
      c =>
        Number(c.column_id) === Number(columnId) &&
        c.title &&
        c.title.toLowerCase() === title.toLowerCase() &&
        !c.is_archived
    );
    if (existingCard) {
      console.log('[createCard] Duplicate card title found:', title);
      return Promise.reject(
        new Error(`Une carte avec le titre "${title}" existe déjà dans ce projet.`)
      );
    }

    return new Promise(resolve => {
      let cardId;

      setDb(currentDb => {
        cardId = currentDb.nextIds.card;
        const newCard = {
          id: cardId,
          column_id: Number(columnId),
          title,
          description,
          priority,
          due_date: dueDate,
          assignee,
          position: 0,
          is_archived: 0,
          start_date: startDate,
          duration_days: durationDays,
          parent_id: parentId,
          predecessor_id: predecessorId,
          created_at: new Date().toISOString(),
          chapter,
        };

        const maxPos = currentDb.cards
          .filter(c => Number(c.column_id) === Number(columnId))
          .reduce((max, c) => Math.max(max, c.position), -1);
        newCard.position = maxPos + 1;

        const newDb = {
          ...currentDb,
          cards: [...currentDb.cards, newCard],
          nextIds: { ...currentDb.nextIds, card: cardId + 1 },
        };
        saveToStorage(newDb);
        console.log(
          '[createCard] Card saved, id:',
          cardId,
          'column_id:',
          newCard.column_id,
          'total cards:',
          newDb.cards.length
        );
        return newDb;
      });

      // Wait longer and verify state update
      setTimeout(() => {
        // Force a re-render by reading db
        setDb(currentDb => {
          console.log('[createCard] After wait, cards in db:', currentDb.cards.length);
          return currentDb;
        });
        resolve(cardId);
      }, 200);
    });
  };

  const updateCard = (id, updates) => {
    console.log('[AppContext] updateCard called:', id, updates);
    const newDb = {
      ...db,
      cards: db.cards.map(c =>
        Number(c.id) === Number(id) ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const deleteCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.filter(c => Number(c.id) !== Number(id)),
      categories: db.categories.filter(cat => Number(cat.card_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const archiveCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 1 } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const restoreCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 0 } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const canArchiveBoard = boardId => {
    const boardColumns = db.columns.filter(c => Number(c.board_id) === Number(boardId));
    const archiveColumn = boardColumns.find(c => c.title.toLowerCase().includes('archiv'));
    if (!archiveColumn) return { canArchive: false, reason: 'Colonne Archiver non trouvée' };

    const columnIds = boardColumns.map(c => Number(c.id));
    const boardCards = db.cards.filter(c => columnIds.includes(Number(c.column_id)));

    if (boardCards.length === 0) return { canArchive: true, reason: '' };

    const allInArchive = boardCards.every(c => Number(c.column_id) === Number(archiveColumn.id));
    if (allInArchive) {
      return { canArchive: true, reason: '' };
    } else {
      return {
        canArchive: false,
        reason: 'Toutes les cartes doivent être dans la colonne Archiver',
      };
    }
  };

  const archiveBoard = id => {
    const { canArchive, reason } = canArchiveBoard(id);
    if (!canArchive) {
      alert(reason);
      return false;
    }
    const newDb = {
      ...db,
      boards: db.boards.map(b => (Number(b.id) === Number(id) ? { ...b, is_archived: 1 } : b)),
    };
    saveDb(newDb);
    return true;
  };

  const restoreBoard = id => {
    const newDb = {
      ...db,
      boards: db.boards.map(b => (Number(b.id) === Number(id) ? { ...b, is_archived: 0 } : b)),
    };
    saveDb(newDb);
  };

  const moveCard = (cardId, newColumnId, newPosition) => {
    const card = db.cards.find(c => Number(c.id) === Number(cardId));
    if (!card) return;

    const oldColumnId = Number(card.column_id);
    const oldPosition = card.position;
    const destColumnId = Number(newColumnId);

    let newCards = db.cards.map(c => {
      const cId = Number(c.id);
      const cColId = Number(c.column_id);

      if (cId === Number(cardId)) {
        return { ...c, column_id: destColumnId, position: newPosition };
      }

      if (oldColumnId === destColumnId) {
        if (oldPosition < newPosition) {
          if (cColId === oldColumnId && c.position > oldPosition && c.position <= newPosition) {
            return { ...c, position: c.position - 1 };
          }
        } else if (oldPosition > newPosition) {
          if (cColId === oldColumnId && c.position >= newPosition && c.position < oldPosition) {
            return { ...c, position: c.position + 1 };
          }
        }
      } else {
        if (cColId === destColumnId && c.position >= newPosition && cId !== Number(cardId)) {
          return { ...c, position: c.position + 1 };
        }
        if (cColId === oldColumnId && c.position > oldPosition) {
          return { ...c, position: c.position - 1 };
        }
      }
      return c;
    });

    const newDb = { ...db, cards: newCards };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const createCategory = (
    cardId,
    title,
    description = '',
    priority = 'normal',
    dueDate = null,
    assignee = '',
    parentId = null,
    durationDays = 1,
    reloadBoardId = null,
    tag = null
  ) => {
    console.log('[createCategory] Called with cardId:', cardId, 'title:', title, 'tag:', tag);

    // Check for duplicate category title for this card
    const existingCategory = db.categories.find(
      c =>
        c.title &&
        c.title.toLowerCase() === title.toLowerCase() &&
        Number(c.card_id) === Number(cardId) &&
        !c.parent_id
    );
    if (existingCategory) {
      console.log('[createCategory] Duplicate category title found:', title);
      return Promise.reject(
        new Error(`Une catégorie avec le titre "${title}" existe déjà pour cette carte.`)
      );
    }

    return new Promise(resolve => {
      let catId;
      setDb(currentDb => {
        let filter;
        if (parentId) {
          filter = currentDb.categories.filter(c => Number(c.parent_id) === Number(parentId));
        } else if (cardId) {
          filter = currentDb.categories.filter(
            c => Number(c.card_id) === Number(cardId) && !c.parent_id
          );
        } else {
          filter = [];
        }
        const maxPos = filter.reduce((max, c) => Math.max(max, c.position), -1);
        catId = currentDb.nextIds.category;
        const newCategory = {
          id: catId,
          card_id: cardId ? Number(cardId) : null,
          parent_id: parentId || null,
          title,
          description,
          priority,
          due_date: dueDate,
          assignee,
          position: maxPos + 1,
          start_date: null,
          duration_days: durationDays,
          tag,
          created_at: new Date().toISOString(),
        };
        const newDb = {
          ...currentDb,
          categories: [...currentDb.categories, newCategory],
          nextIds: { ...currentDb.nextIds, category: catId + 1 },
        };
        saveToStorage(newDb);
        return newDb;
      });

      setTimeout(() => {
        resolve(catId);
      }, 200);
    });
  };

  const updateCategory = (id, updates) => {
    const newDb = {
      ...db,
      categories: db.categories.map(c =>
        Number(c.id) === Number(id) ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const deleteCategory = id => {
    const newDb = {
      ...db,
      categories: db.categories.filter(c => Number(c.id) !== Number(id)),
      subcategories: db.subcategories.filter(s => Number(s.category_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const moveCategory = (categoryId, newCardId, newPosition) => {
    console.log('[moveCategory] Called with:', { categoryId, newCardId, newPosition });
    const category = db.categories.find(c => Number(c.id) === Number(categoryId));
    if (!category) {
      console.log('[moveCategory] Category not found:', categoryId);
      return;
    }
    console.log('[moveCategory] Found category:', category);

    const oldCardId = Number(category.card_id);
    const oldPosition = category.position;
    const destCardId = Number(newCardId);

    console.log('[moveCategory] oldCardId:', oldCardId, 'destCardId:', destCardId);

    let newCategories = db.categories.map(c => {
      const cId = Number(c.id);
      const cCardId = Number(c.card_id);

      if (cId === Number(categoryId)) {
        return { ...c, card_id: destCardId, position: newPosition };
      }

      if (oldCardId === destCardId) {
        if (oldPosition < newPosition) {
          if (cCardId === oldCardId && c.position > oldPosition && c.position <= newPosition) {
            return { ...c, position: c.position - 1 };
          }
        } else if (oldPosition > newPosition) {
          if (cCardId === oldCardId && c.position >= newPosition && c.position < oldPosition) {
            return { ...c, position: c.position + 1 };
          }
        }
      } else {
        if (cCardId === destCardId && c.position >= newPosition && cId !== Number(categoryId)) {
          return { ...c, position: c.position + 1 };
        }
        if (cCardId === oldCardId && c.position > oldPosition) {
          return { ...c, position: c.position - 1 };
        }
      }
      return c;
    });

    const newDb = { ...db, categories: newCategories };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const createSubcategory = (
    categoryId,
    title,
    description = '',
    priority = 'normal',
    dueDate = null,
    assignee = '',
    startDate = null,
    durationDays = 1,
    reloadBoardId = null,
    tag = null
  ) => {
    // Check for duplicate subcategory title for this category
    const existingSubcategory = db.subcategories.find(
      s =>
        s.title &&
        s.title.toLowerCase() === title.toLowerCase() &&
        Number(s.category_id) === Number(categoryId)
    );
    if (existingSubcategory) {
      console.log('[createSubcategory] Duplicate subcategory title found:', title);
      return Promise.reject(
        new Error(`Une sous-catégorie avec le titre "${title}" existe déjà pour cette catégorie.`)
      );
    }

    return new Promise(resolve => {
      let subcatId;
      setDb(currentDb => {
        const maxPos = currentDb.subcategories
          .filter(s => Number(s.category_id) === Number(categoryId))
          .reduce((max, s) => Math.max(max, s.position), -1);
        subcatId = currentDb.nextIds.subcategory;
        const newSubcategory = {
          id: subcatId,
          category_id: Number(categoryId),
          title,
          description,
          priority,
          due_date: dueDate,
          assignee,
          position: maxPos + 1,
          start_date: startDate,
          duration_days: durationDays,
          tag,
          created_at: new Date().toISOString(),
          predecessors: [],
        };
        const newDb = {
          ...currentDb,
          subcategories: [...currentDb.subcategories, newSubcategory],
          nextIds: { ...currentDb.nextIds, subcategory: subcatId + 1 },
        };
        saveToStorage(newDb);
        return newDb;
      });

      setTimeout(() => {
        resolve(subcatId);
      }, 200);
    });
  };

  const updateSubcategory = (id, updates) => {
    const newDb = {
      ...db,
      subcategories: db.subcategories.map(s =>
        Number(s.id) === Number(id) ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
      ),
    };
    saveDb(newDb);
    if (currentBoard) {
      setTimeout(() => loadBoard(currentBoard.id), 100);
    }
  };

  const deleteSubcategory = id => {
    const newDb = {
      ...db,
      subcategories: db.subcategories.filter(s => Number(s.id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) {
      setTimeout(() => loadBoard(currentBoard.id), 100);
    }
  };

  const moveSubcategory = (subcategoryId, newCategoryId, newPosition) => {
    const subcategory = db.subcategories.find(s => Number(s.id) === Number(subcategoryId));
    if (!subcategory) return;

    const oldCategoryId = Number(subcategory.category_id);
    const oldPosition = subcategory.position;
    const destCategoryId = Number(newCategoryId);

    let newSubcategories = db.subcategories.map(s => {
      const sId = Number(s.id);
      const sCatId = Number(s.category_id);

      if (sId === Number(subcategoryId)) {
        return { ...s, category_id: destCategoryId, position: newPosition };
      }

      if (oldCategoryId === destCategoryId) {
        if (oldPosition < newPosition) {
          if (sCatId === oldCategoryId && s.position > oldPosition && s.position <= newPosition) {
            return { ...s, position: s.position - 1 };
          }
        } else if (oldPosition > newPosition) {
          if (sCatId === oldCategoryId && s.position >= newPosition && s.position < oldPosition) {
            return { ...s, position: s.position + 1 };
          }
        }
      } else {
        if (
          sCatId === destCategoryId &&
          s.position >= newPosition &&
          sId !== Number(subcategoryId)
        ) {
          return { ...s, position: s.position + 1 };
        }
        if (sCatId === oldCategoryId && s.position > oldPosition) {
          return { ...s, position: s.position - 1 };
        }
      }
      return s;
    });

    const newDb = { ...db, subcategories: newSubcategories };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const loadLibrary = useCallback(() => {
    setLibraryItems(db.libraryItems || []);
  }, [db]);

  const saveToLibrary = useCallback(
    (type, title, contentJson) => {
      const itemId = db.nextIds.libraryItem++;
      const newItem = {
        id: itemId,
        type,
        title,
        content_json: contentJson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const newDb = {
        ...db,
        libraryItems: [...(db.libraryItems || []), newItem],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      loadLibrary();
      setTimeout(() => {
        window.dispatchEvent(new Event('library-updated'));
      }, 100);
      return itemId;
    },
    [db, saveDb, loadLibrary]
  );

  const updateLibraryItem = (id, title, contentJson) => {
    const newDb = {
      ...db,
      libraryItems: (db.libraryItems || []).map(item =>
        Number(item.id) === Number(id)
          ? { ...item, title, content_json: contentJson, updated_at: new Date().toISOString() }
          : item
      ),
    };
    saveDb(newDb);
    loadLibrary();
    setTimeout(() => {
      window.dispatchEvent(new Event('library-updated'));
    }, 100);
  };

  const deleteLibraryItem = id => {
    const newDb = {
      ...db,
      libraryItems: (db.libraryItems || []).filter(item => Number(item.id) !== Number(id)),
    };
    saveDb(newDb);
    loadLibrary();
    setTimeout(() => {
      window.dispatchEvent(new Event('library-updated'));
    }, 100);
  };

  const getArchivedCards = () => {
    return db.cards.filter(c => c.is_archived);
  };

  const getArchivedBoards = () => {
    return db.boards.filter(b => b.is_archived);
  };

  const getMessages = useCallback(
    boardId => {
      return (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
    },
    [db.messages]
  );

  const addMessage = useCallback(
    (boardId, content, attachments = []) => {
      const mentions = content.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
      const newMessage = {
        id: db.nextIds.message++,
        board_id: boardId,
        author: currentUsername,
        content,
        mentions,
        attachments: attachments.map(att => ({
          name: att.name,
          type: att.type,
          data: att.data,
          size: att.size,
        })),
        created_at: new Date().toISOString(),
        read_by: [currentUsername],
      };
      const newDb = {
        ...db,
        messages: [...(db.messages || []), newMessage],
      };
      saveDb(newDb);
      setMessages(newDb.messages);

      if (mentions.length > 0) {
        const newUnread = { ...unreadMentions };
        mentions.forEach(user => {
          if (user !== currentUsername) {
            if (!newUnread[user]) newUnread[user] = [];
            newUnread[user].push(newMessage.id);
          }
        });
        setUnreadMentions(newUnread);
      }
      return newMessage;
    },
    [db, currentUsername, saveDb, unreadMentions]
  );

  const markMessagesAsRead = useCallback(
    boardId => {
      const boardMessages = (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
      const updatedMessages = boardMessages.map(msg => {
        if (!msg.read_by.includes(currentUsername)) {
          return { ...msg, read_by: [...msg.read_by, currentUsername] };
        }
        return msg;
      });

      const newDb = {
        ...db,
        messages: (db.messages || []).map(msg => {
          const updated = updatedMessages.find(u => u.id === msg.id);
          return updated || msg;
        }),
      };
      saveDb(newDb);
      setMessages(newDb.messages);

      if (unreadMentions[currentUsername]) {
        const newUnread = { ...unreadMentions };
        delete newUnread[currentUsername];
        setUnreadMentions(newUnread);
      }
    },
    [db, currentUsername, saveDb, unreadMentions]
  );

  const getUnreadCount = useCallback(
    boardId => {
      if (!currentUsername) return 0;
      const boardMessages = (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
      return boardMessages.filter(
        msg => !msg.read_by.includes(currentUsername) && msg.author !== currentUsername
      ).length;
    },
    [db.messages, currentUsername]
  );

  const setUsername = useCallback(name => {
    setCurrentUsername(name);
    localStorage.setItem('mytrello-username', name);
  }, []);

  const addComment = (refType, refId, content) => {
    return true;
  };

  const getComments = async (refType, refId) => {
    return [];
  };

  const deleteComment = id => {};

  const value = {
    boards,
    currentBoard,
    columns,
    cards,
    categories,
    subcategories,
    libraryItems,
    messages,
    db,
    currentUsername,
    setUsername,
    addMessage,
    getMessages,
    markMessagesAsRead,
    getUnreadCount,
    loading,
    sidebarOpen,
    libraryOpen,
    libraryViewMode,
    setSidebarOpen,
    setLibraryOpen,
    setLibraryViewMode,
    theme,
    toggleTheme,
    selectedCard,
    setSelectedCard,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    loadBoard,
    loadBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    createOrder,
    updateOrder,
    deleteOrder,
    addAvenant,
    updateAvenant,
    deleteAvenant,
    getOrdersByBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
    createCard,
    updateCard,
    deleteCard,
    archiveCard,
    restoreCard,
    archiveBoard,
    restoreBoard,
    canArchiveBoard,
    moveCard,
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    moveSubcategory,
    loadLibrary,
    generateTestData,
    exportData,
    importData,
    saveToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
    getArchivedCards,
    getArchivedBoards,
    addComment,
    getComments,
    deleteComment,
    cardColors,
    updateCardColors,
    resetCardColors,
    addWorkingDays,
    getWorkingDaysBetween,
    getProjectTime,
    getAllProjectTime,
    loadProjectTime,
    getWeekNumber,
    projectTimer,
    getInternalContacts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
