import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { libraryTemplates } from '../data/libraryData';
import { loadGMRData, saveGMRData } from '../data/GMRData';
import { loadPriorityData, savePriorityData } from '../data/PriorityData';
import { loadZonesData, saveZonesData } from '../data/ZonesData';
import { loadTagsData, saveTagsData } from '../data/TagsData';
import { loadChaptersOrder, saveChaptersOrder } from '../data/ChaptersData';
import { normalizeImportData, generateExportData, downloadExport } from '../services/migration';
import storage from '../services/storage';
import { TimerProvider } from '../hooks/useTimer.jsx';
import { useHiddenMilestones } from '../hooks/useHiddenMilestones.jsx';
import { useUserSettings } from '../hooks/useUserSettings.jsx';
import { useProjectTime } from '../hooks/useProjectTime.jsx';
import { useInternalContacts } from '../hooks/useInternalContacts.jsx';
import { useArchived } from '../hooks/useArchived.jsx';
import { useCardOperations } from '../hooks/useCardOperations.js';
import { useCategorySubcategoryOperations } from '../hooks/useCategorySubcategoryOperations.js';
import { useBoardCrud } from '../hooks/useBoardCrud.jsx';
import { useLibraryOperations } from '../hooks/useLibraryOperations.js';
import { useOrderOperations } from '../hooks/useOrderOperations.js';
import { useMessageOperations } from '../hooks/useMessageOperations.js';
import { useUserManagement } from '../hooks/useUserManagement.js';
import { useUIContext } from './UIContext.jsx';

const STORAGE_KEY = 'c-projets_db';

// Migration des clés localStorage de MyTrello vers C-PRojeTs

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
      const tags = [currentChapitre, node.data.categorieTag || '', node.data.domaineTag || '']
        .filter(Boolean)
        .join(',');

      let cardItem = cardMap.get(currentCarte);
      if (!cardItem) {
        cardItem = {
          id: itemId++,
          treeNodeId: node.type === 'carte' ? node.id : undefined, // Link to tree node ID
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
              skipAction: node.data.skipAction || false,
            },
            categories: [],
          }),
        };
        cardMap.set(currentCarte, cardItem);
        libraryItems.push(cardItem);
      } else {
        if (node.type === 'carte' && node.data.skipAction !== undefined) {
          const content = JSON.parse(cardItem.content_json);
          content.card.skipAction = node.data.skipAction;
          cardItem.content_json = JSON.stringify(content);
        }
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
          treeNodeId: node.type === 'categorie' ? node.id : undefined, // Link to tree node ID
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
            treeNodeId: node.id, // Link to tree node ID (stable reference)
            title: node.data.sousCat1,
            type: 'subcategory',
            tags: tags,
            systemTag: node.data.systemTag?.trim() || '',
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

export function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.boards?.length > 0) {
        storage.setDb(parsed).catch(() => {});
        return parsed;
      }
    } catch (e) {
      console.error('[AppContext] Erreur:', e);
    }
  }
  return {
    boards: [],
    columns: [],
    cards: [],
    categories: [],
    subcategories: [],
    libraryItems: [],
    messages: [],
    subcategoryEmails: [],
    nextIds: {
      board: 1,
      column: 1,
      card: 1,
      category: 1,
      subcategory: 1,
      libraryItem: 1,
      message: 1,
      email: 1,
    },
  };
}

function saveToStorage(data) {
  return storage.setDb(data).catch(e => {
    console.error('[saveToStorage] Erreur:', e.message);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });
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
      email: 1,
    };
  } else if (!data.nextIds.order) {
    data.nextIds.order = 1;
  }
  if (!data.nextIds.email) {
    data.nextIds.email = 1;
  }
  if (!data.subcategoryEmails) {
    data.subcategoryEmails = [];
  }

  // Ensure libraryItems has data - always check library editor first (admin defines the master data)
  if (!data.libraryItems || data.libraryItems.length === 0) {
    // Check if custom library data exists in LibraryEditor storage
    const customLibrary = localStorage.getItem('c-projets_library_editor');
    if (customLibrary) {
      try {
        const treeData = JSON.parse(customLibrary);
        data.libraryItems = convertTreeToLibraryItems(treeData);
      } catch (e) {
        console.error('[AppContext] Error loading custom library:', e);
        data.libraryItems = libraryTemplates;
      }
    } else {
      data.libraryItems = libraryTemplates;
    }
  } else {
    // Even if libraryItems exists, check if admin has updated the library editor
    const customLibrary = localStorage.getItem('c-projets_library_editor');
    if (customLibrary) {
      try {
        const treeData = JSON.parse(customLibrary);
        data.libraryItems = convertTreeToLibraryItems(treeData);
      } catch (e) {
        console.error('[AppContext] Error loading custom library:', e);
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
  const [db, setDb] = useState({
    boards: [],
    columns: [],
    cards: [],
    categories: [],
    subcategories: [],
    libraryItems: [],
    messages: [],
    subcategoryEmails: [],
    nextIds: {
      board: 1,
      column: 1,
      card: 1,
      category: 1,
      subcategory: 1,
      libraryItem: 1,
      message: 1,
      email: 1,
    },
  });
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [subcategoryEmails, setSubcategoryEmails] = useState([]);
  const { username, setUsername, userRole, setUserRole, showTagOnCard, setShowTagOnCard } = useUserSettings();
  const { setTheme } = useUIContext();
  const [loading, setLoading] = useState(false);
  const [unreadMentions, setUnreadMentions] = useState({});
  const [filterMyProjects, setFilterMyProjects] = useState(
    () => localStorage.getItem('c-projets-filter-my-projects') === 'true'
  );
  useEffect(() => {
    async function loadData() {
      try {
        const stored = await storage.getDb();
        if (stored && stored.boards?.length > 0) {
          setDb(stored);
        }
      } catch (e) {
        console.error('[AppContext] Erreur loadData:', e);
      }
    }
    loadData();
  }, []);

  const {
    hiddenMilestones,
    addHiddenMilestone,
    removeHiddenMilestone,
    clearHiddenMilestones,
    isHiddenMilestone,
  } = useHiddenMilestones();

  const { getInternalContacts } = useInternalContacts();

  const {
    usersList,
    setUsersList,
    formatUserName,
    addNewUser,
    getUsers,
    searchUsers,
    migrateUsersFromBoards,
  } = useUserManagement(db, getInternalContacts);

  useEffect(() => {
    if (db.boards && db.boards.length > 0 && usersList.length === 0) {
      migrateUsersFromBoards();
    }
  }, [db.boards]);

  useEffect(() => {
    let activeBoards = db.boards.filter(b => !b.is_archived);
    if (filterMyProjects && username) {
      activeBoards = activeBoards.filter(board => {
        const contacts = getInternalContacts(board.id) || [];
        return contacts.some(c => c.name && c.name.toLowerCase() === username.toLowerCase());
      });
    }
    setBoards(activeBoards.sort((a, b) => a.title.localeCompare(b.title)));
  }, [db.boards, username, getInternalContacts, filterMyProjects]);

  const pendingSaveRef = useRef(null);
  const saveTimer = useRef(null);

  const flushSave = useCallback(() => {
    if (pendingSaveRef.current) {
      saveToStorage(pendingSaveRef.current);
      pendingSaveRef.current = null;
      setTimeout(() => window.dispatchEvent(new Event('project-updated')), 50);
    }
  }, []);

  const saveDb = useCallback(newDbOrFn => {
    if (typeof newDbOrFn === 'function') {
      setDb(currentDb => {
        const newDb = newDbOrFn(currentDb);
        // Store result for deferred save — avoids double-invoke in StrictMode
        pendingSaveRef.current = newDb;
        return newDb;
      });
    } else {
      setDb(newDbOrFn);
      pendingSaveRef.current = newDbOrFn;
    }
    // Debounce: coalesce rapid CRUD calls into one save (16ms = 1 frame)
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 16);
  }, [flushSave]);

  const loadBoard = useCallback(
    (boardId, data = null) => {
      const sourceData = data || db;
      const board = sourceData.boards.find(b => Number(b.id) === Number(boardId));
      if (board) {
        setCurrentBoard(board);

        let boardColumns = sourceData.columns.filter(c => Number(c.board_id) === Number(boardId));

        // Create default columns if none exist
        if (boardColumns.length === 0) {
          const nextColId = Math.max(0, ...(sourceData.columns || []).map(c => c.id)) + 1;
          boardColumns = [
            { id: nextColId, board_id: boardId, title: 'À faire', position: 0, color: '#4A90D9' },
            {
              id: nextColId + 1,
              board_id: boardId,
              title: 'En cours',
              position: 1,
              color: '#F5A623',
            },
            {
              id: nextColId + 2,
              board_id: boardId,
              title: 'En attente',
              position: 2,
              color: '#9CA3AF',
            },
            {
              id: nextColId + 3,
              board_id: boardId,
              title: 'Terminée',
              position: 3,
              color: '#7ED321',
            },
            {
              id: nextColId + 4,
              board_id: boardId,
              title: 'Archiver',
              position: 4,
              color: '#475569',
            },
          ];
          sourceData.columns = [...sourceData.columns, ...boardColumns];
        }

        const columnIds = boardColumns.map(c => Number(c.id));
        const filteredCards = sourceData.cards.filter(
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
        const filteredCategories = sourceData.categories
          .filter(c => cardIds.includes(Number(c.card_id)))
          .sort((a, b) => a.position - b.position);
        setCategories(filteredCategories);
        const catIds = sourceData.categories
          .filter(c => cardIds.includes(Number(c.card_id)))
          .map(c => Number(c.id));
        setSubcategories(
          sourceData.subcategories
            .filter(s => catIds.includes(Number(s.category_id)))
            .sort((a, b) => a.position - b.position)
        );
      }
    },
    [db]
  );

  const {
    getWeekNumber,
    loadProjectTime,
    saveProjectTime,
    getWeekKey,
    getWeekNumberFromKey,
    addProjectTime,
    getProjectTime,
    getAllProjectTime,
  } = useProjectTime();

  // Ensure libraryItems has data - always check library editor first
  const forceLibraryItems = () => {
    // Always check if custom library data exists in LibraryEditor storage
    const customLibrary = localStorage.getItem('c-projets_library_editor');
    let itemsToUse = null;

    if (customLibrary) {
      try {
        const treeData = JSON.parse(customLibrary);
        itemsToUse = convertTreeToLibraryItems(treeData);
        setLibraryItems(itemsToUse);
      } catch (e) {
        console.error('[AppContext] Error reloading library from editor:', e);
      }
    } else {
      // Fallback to main database
      const mainDb = localStorage.getItem('c-projets_db');
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

  // Migration: Convert numeric library_item_id to tree node UUIDs
  const migrateLibraryItemIds = () => {
    try {
      const dbRaw = localStorage.getItem('c-projets_db');
      if (!dbRaw) return;
      const db = JSON.parse(dbRaw);
      if (!db.libraryItems || !Array.isArray(db.libraryItems)) return;

      // Build mapping: numericId -> treeNodeId (UUID)
      const idMapping = {};
      db.libraryItems.forEach(item => {
        if (item.id && item.treeNodeId) {
          idMapping[String(item.id)] = String(item.treeNodeId);
        }
      });

      if (Object.keys(idMapping).length === 0) {
        return;
      }

      let updated = 0;

      // Update categories
      if (db.categories && Array.isArray(db.categories)) {
        db.categories.forEach(cat => {
          if (cat.library_item_id && idMapping[String(cat.library_item_id)]) {
            cat.library_item_id = idMapping[String(cat.library_item_id)];
            updated++;
          }
        });
      }

      // Update subcategories
      if (db.subcategories && Array.isArray(db.subcategories)) {
        db.subcategories.forEach(sub => {
          if (sub.library_item_id && idMapping[String(sub.library_item_id)]) {
            sub.library_item_id = idMapping[String(sub.library_item_id)];
            updated++;
          }
        });
      }

      if (updated > 0) {
        localStorage.setItem('c-projets_db', JSON.stringify(db));
        // Reload board if needed
        if (currentBoard) {
          setTimeout(() => loadBoard(currentBoard.id, db), 100);
        }
      }
    } catch (e) {
      console.error('[Migration] Error:', e);
    }
  };

  useEffect(() => {
    // Run migration on mount
    migrateLibraryItemIds();
  }, []);

  // Refs to always capture the latest versions — avoids stale closures in the
  // library-updated event listener which is registered once with [] deps.
  const syncTagsFromLibraryRef = useRef(null);
  const currentBoardRef = useRef(null);
  const loadBoardRef = useRef(loadBoard);

  useEffect(() => {
    const handleLibraryUpdate = () => {
      forceLibraryItems();
      migrateLibraryItemIds();
      setTimeout(() => {
        syncTagsFromLibraryRef.current?.();
        // Always reload the board from fresh localStorage so the UI reflects
        // every change — even if syncTagsFromLibrary found nothing new to update
        // (the DB may already be correct from a previous direct localStorage write).
        if (currentBoardRef.current) {
          setTimeout(() => {
            try {
              const dbRaw = localStorage.getItem('c-projets_db');
              if (dbRaw) {
                const freshDb = JSON.parse(dbRaw);
                loadBoardRef.current?.(currentBoardRef.current.id, freshDb);
              }
            } catch (e) {}
          }, 200);
        }
      }, 100);
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

  useEffect(() => {
    setSubcategoryEmails(db.subcategoryEmails || []);
  }, [db.subcategoryEmails]);

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
    loadBoard(currentBoard.id, newDb);
  };

  const exportData = (usernameForExport = null) => {
    try {
      const exportObj = generateExportData(db);
      downloadExport(exportObj, usernameForExport);
    } catch (err) {
      console.error('[ExportData] Error during export:', err);
      throw err;
    }
  };

  const deduplicateLibraryEditor = treeData => {
    const seenCategories = new Set();
    const seenSubcategories = new Set();

    const deduplicateNode = node => {
      if (!node.children) return;
      node.children = node.children.filter(child => {
        if (child.type === 'categorie') {
          if (seenCategories.has(child.id)) return false;
          seenCategories.add(child.id);
        } else if (child.type === 'souscategorie') {
          if (seenSubcategories.has(child.id)) return false;
          seenSubcategories.add(child.id);
        }
        deduplicateNode(child);
        return true;
      });
    };

    treeData.forEach(chapter => {
      seenCategories.clear();
      seenSubcategories.clear();
      if (chapter.children) {
        chapter.children.forEach(card => {
          seenCategories.clear();
          seenSubcategories.clear();
          deduplicateNode(card);
        });
      }
    });

    return treeData;
  };

  const importData = async jsonData => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      const normalized = normalizeImportData(parsed);

      if (!normalized.success) {
        return { success: false, error: normalized.errors.join(', ') };
      }

      const data = normalized.data;
      let dbData;

      if (data.version === '2.0' && data.databases?.core) {
        dbData = data.databases.core;
      } else if (data.data) {
        dbData = data.data;
      } else {
        return { success: false, error: 'Format de fichier invalide: aucune donnée trouvée' };
      }

      const existingColumnBoardIds = new Set((dbData.columns || []).map(c => c.board_id));
      let nextColumnId = Math.max(0, ...(dbData.columns || []).map(c => c.id)) + 1;

      dbData.boards.forEach(board => {
        if (!existingColumnBoardIds.has(board.id)) {
          const defaultColumns = [
            {
              id: nextColumnId++,
              board_id: board.id,
              title: 'À faire',
              position: 0,
              color: '#4A90D9',
            },
            {
              id: nextColumnId++,
              board_id: board.id,
              title: 'En cours',
              position: 1,
              color: '#F5A623',
            },
            {
              id: nextColumnId++,
              board_id: board.id,
              title: 'En attente',
              position: 2,
              color: '#9CA3AF',
            },
            {
              id: nextColumnId++,
              board_id: board.id,
              title: 'Terminée',
              position: 3,
              color: '#7ED321',
            },
            {
              id: nextColumnId++,
              board_id: board.id,
              title: 'Archiver',
              position: 4,
              color: '#475569',
            },
          ];
          dbData.columns.push(...defaultColumns);
          existingColumnBoardIds.add(board.id);
        }
      });

      await saveToStorage(dbData);
      setDb(dbData);

      if (data.projectTime) {
        localStorage.setItem('c-projets_project_time', JSON.stringify(data.projectTime));
      }
      if (data.libraryFavorites) {
        localStorage.setItem('c-projets_library_favorites', JSON.stringify(data.libraryFavorites));
      }
      if (data.databases?.library) {
        const cleanLibraryEditor = deduplicateLibraryEditor(data.databases.library);
        localStorage.setItem('c-projets_library_editor', JSON.stringify(cleanLibraryEditor));
      } else if (data.libraryEditor) {
        const cleanLibraryEditor = deduplicateLibraryEditor(data.libraryEditor);
        localStorage.setItem('c-projets_library_editor', JSON.stringify(cleanLibraryEditor));
      }
      if (data.libraryTemplates) {
        localStorage.setItem('c-projets_library_templates', JSON.stringify(data.libraryTemplates));
      }
      if (data.settings) {
        if (data.settings.theme) {
          localStorage.setItem('c-projets-theme', data.settings.theme);
          setTheme(data.settings.theme);
        }
        if (data.settings.cardColors) {
          localStorage.setItem('c-projets-cardColors', JSON.stringify(data.settings.cardColors));
        }
        if (data.settings.username) {
          localStorage.setItem('c-projets-username', data.settings.username);
          setUsername(data.settings.username);
        }
        if (data.settings.userRole) {
          localStorage.setItem('c-projets-user-role', data.settings.userRole);
          setUserRole(data.settings.userRole);
        }
        if (data.settings.chargeResentie) {
          localStorage.setItem(
            'c-projets_charge_ressentie',
            JSON.stringify(data.settings.chargeResentie)
          );
        }
        if (
          data.settings.filterMyProjects !== undefined &&
          data.settings.filterMyProjects !== null
        ) {
          localStorage.setItem('c-projets-filter-my-projects', data.settings.filterMyProjects);
          setFilterMyProjects(data.settings.filterMyProjects === 'true');
        }
        if (data.settings.usersList && Array.isArray(data.settings.usersList)) {
          localStorage.setItem('c-projets-users', JSON.stringify(data.settings.usersList));
        }
      }
      if (data.username) {
        localStorage.setItem('c-projets-username', data.username);
        setUsername(data.username);
      }
      if (data.userRole) {
        localStorage.setItem('c-projets-user-role', data.userRole);
        setUserRole(data.userRole);
      }

      const databases = data.databases?.params || data.databases;
      if (databases) {
        if (databases.gmr) {
          saveGMRData(databases.gmr);
        }
        if (databases.priority) {
          savePriorityData(databases.priority);
        }
        if (databases.zones) {
          saveZonesData(databases.zones);
        }
        if (databases.tags) {
          saveTagsData(databases.tags);
        }
        if (databases.chaptersOrder) {
          saveChaptersOrder(databases.chaptersOrder);
        }
        if (databases.entreprises) {
          localStorage.setItem('c-projets_entreprises', JSON.stringify(databases.entreprises));
        }
      }

      if (data.projects) {
        data.projects.forEach(project => {
          const boardId = project.id;
          if (project.links) {
            localStorage.setItem(`board-${boardId}-links`, JSON.stringify(project.links));
          }
          if (project.commandes) {
            localStorage.setItem(`board-${boardId}-commandes`, JSON.stringify(project.commandes));
          }
          if (project.eotp) {
            localStorage.setItem(`board-${boardId}-eotp`, JSON.stringify(project.eotp));
          }
          if (project.internalContacts) {
            localStorage.setItem(
              `board-${boardId}-internalContacts`,
              JSON.stringify(project.internalContacts)
            );
          }
          if (project.externalContacts) {
            localStorage.setItem(
              `board-${boardId}-externalContacts`,
              JSON.stringify(project.externalContacts)
            );
          }
          if (project.gmr) {
            localStorage.setItem(`board-${boardId}-gmr`, project.gmr);
          }
          if (project.priority) {
            localStorage.setItem(`board-${boardId}-priority`, project.priority);
          }
          if (project.zone) {
            localStorage.setItem(`board-${boardId}-zone`, project.zone);
          }
        });
      }

      if (data.projectsData) {
        Object.entries(data.projectsData).forEach(([boardId, projData]) => {
          if (projData.links) {
            localStorage.setItem(`board-${boardId}-links`, JSON.stringify(projData.links));
          }
          if (projData.commandes) {
            localStorage.setItem(`board-${boardId}-commandes`, JSON.stringify(projData.commandes));
          }
          if (projData.eotp) {
            localStorage.setItem(`board-${boardId}-eotp`, JSON.stringify(projData.eotp));
          }
          if (projData.internalContacts) {
            localStorage.setItem(
              `board-${boardId}-internalContacts`,
              JSON.stringify(projData.internalContacts)
            );
          }
          if (projData.externalContacts) {
            localStorage.setItem(
              `board-${boardId}-externalContacts`,
              JSON.stringify(projData.externalContacts)
            );
          }
          if (projData.gmr) {
            localStorage.setItem(`board-${boardId}-gmr`, projData.gmr);
          }
          if (projData.priority) {
            localStorage.setItem(`board-${boardId}-priority`, projData.priority);
          }
          if (projData.zone) {
            localStorage.setItem(`board-${boardId}-zone`, projData.zone);
          }
        });
      }

      if (data.databases?.contracts || data.contracts) {
        const contracts = data.databases?.contracts || data.contracts;
        localStorage.setItem('c-projets_contracts', JSON.stringify(contracts));
      }

      if (data.planning) {
        Object.entries(data.planning).forEach(([boardId, planningData]) => {
          localStorage.setItem(`planning_${boardId}`, JSON.stringify(planningData));
        });
      }

      return { success: true, warnings: normalized.warnings };
    } catch (error) {
      console.error('[ImportData] Erreur:', error);
      return { success: false, error: error.message };
    }
  };

  const {
    createBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
  } = useBoardCrud(db, saveDb, loadBoard, currentBoard);

  const {
    createOrder,
    updateOrder,
    deleteOrder,
    addAvenant,
    updateAvenant,
    deleteAvenant,
    getOrdersByBoard,
  } = useOrderOperations(db, saveDb);


  const {
    createCard,
    updateCard,
    deleteCard,
    archiveCard,
    restoreCard,
    canArchiveBoard,
    archiveBoard,
    restoreBoard,
    moveCard,
  } = useCardOperations(db, saveDb, loadBoard, currentBoard);

  const {
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    createSubcategory,
    updateSubcategory,
    toggleMilestone,
    deleteSubcategory,
    moveSubcategory,
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
    updateEmailStatus,
    getEmailsForSubcategory,
    saveEmailFile,
    getEmailFile,
  } = useCategorySubcategoryOperations(db, saveDb, loadBoard, currentBoard);


  const {
    loadLibrary,
    saveToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
    syncTagsFromLibrary,
  } = useLibraryOperations(db, saveDb, setLibraryItems, loadBoard, currentBoard);

  // Keep refs in sync so the library-updated listener always calls the latest versions
  syncTagsFromLibraryRef.current = syncTagsFromLibrary;
  currentBoardRef.current = currentBoard;
  loadBoardRef.current = loadBoard;


  const getArchivedCards = () => {
    return db.cards.filter(c => c.is_archived);
  };

  const getArchivedBoards = () => {
    return db.boards.filter(b => b.is_archived);
  };

  const { getMessages, addMessage, markMessagesAsRead, getUnreadCount } = useMessageOperations(
    db, saveDb, username, setMessages, unreadMentions, setUnreadMentions
  );

  const addComment = (refType, refId, content) => {
    return true;
  };

  const getComments = async (refType, refId) => {
    return [];
  };

  const deleteComment = id => {};

  const value = useMemo(() => ({
    boards,
    currentBoard,
    columns,
    cards,
    categories,
    subcategories,
    libraryItems,
    messages,
    subcategoryEmails,
    db,
    username,
    setUsername,
    userRole,
    setUserRole,
    showTagOnCard,
    setShowTagOnCard,
    addMessage,
    getMessages,
    markMessagesAsRead,
    getUnreadCount,
    loading,
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
    toggleMilestone,
    hiddenMilestones,
    addHiddenMilestone,
    deleteSubcategory,
    moveSubcategory,
    removeHiddenMilestone,
    clearHiddenMilestones,
    isHiddenMilestone,
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
    updateEmailStatus,
    getEmailsForSubcategory,
    saveEmailFile,
    getEmailFile,
    loadLibrary,
    generateTestData,
    exportData,
    importData,
    saveToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
    syncTagsFromLibrary,
    getArchivedCards,
    getArchivedBoards,
    addComment,
    getComments,
    deleteComment,
    addWorkingDays,
    getWorkingDaysBetween,
    getWeekNumber,
    getInternalContacts,
    filterMyProjects,
    setFilterMyProjects,
    usersList,
    setUsersList,
    addNewUser,
    getUsers,
    searchUsers,
    formatUserName,
    migrateUsersFromBoards,
    loadProjectTime,
    getProjectTime,
    getAllProjectTime,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [db, currentBoard, columns, cards, categories, subcategories, libraryItems,
    messages, subcategoryEmails, username, userRole, showTagOnCard, loading,
    filterMyProjects, usersList, hiddenMilestones]);

  return (
    <AppContext.Provider value={value}>
      <TimerProvider currentBoard={currentBoard}>{children}</TimerProvider>
    </AppContext.Provider>
  );
}

export function useApp() {
  const appContext = useContext(AppContext);
  if (!appContext) {
    throw new Error('useApp must be used within an AppProvider');
  }
  const uiContext = useUIContext();
  return { ...appContext, ...uiContext };
}
