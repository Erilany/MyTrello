import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { libraryTemplates } from '../data/libraryData';
import { loadGMRData, saveGMRData } from '../data/GMRData';
import { loadPriorityData, savePriorityData } from '../data/PriorityData';
import { loadZonesData, saveZonesData } from '../data/ZonesData';
import { loadTagsData, saveTagsData } from '../data/TagsData';
import { loadChaptersOrder, saveChaptersOrder } from '../data/ChaptersData';
import { normalizeImportData, generateExportData, downloadExport } from '../services/migration';
import { UIProvider, SelectionProvider, UserProvider } from './index';

const IMPORTS_PATH = '/imports/';

const STORAGE_KEY = 'c-projets_db';

// Migration des clés localStorage de MyTrello vers C-PRojeTs
function migrateLocalStorageKeys() {
  const keyMappings = [
    { old: 'mytrello_db', newKey: 'c-projets_db' },
    { old: 'mytrello_library_editor', newKey: 'c-projets_library_editor' },
    { old: 'mytrello_templates', newKey: 'c-projets_templates' },
    { old: 'mytrello_library_favorites', newKey: 'c-projets_library_favorites' },
    { old: 'mytrello_project_time', newKey: 'c-projets_project_time' },
    { old: 'mytrello-theme', newKey: 'c-projets-theme' },
    { old: 'mytrello-cardColors', newKey: 'c-projets-cardColors' },
    { old: 'mytrello-username', newKey: 'c-projets-username' },
    { old: 'mytrello-user-role', newKey: 'c-projets-user-role' },
    { old: 'mytrello_contracts', newKey: 'c-projets_contracts' },
    { old: 'mytrello_charge_resentie', newKey: 'c-projets_charge_resentie' },
    { old: 'mytrello_open_tab', newKey: 'c-projets_open_tab' },
    { old: 'mytrello_chapters_order', newKey: 'c-projets_chapters_order' },
    { old: 'mytrello_priority_data', newKey: 'c-projets_priority_data' },
    { old: 'mytrello_tags_data', newKey: 'c-projets_tags_data' },
    { old: 'mytrello_gmr_data', newKey: 'c-projets_gmr_data' },
    { old: 'mytrello_zones_data', newKey: 'c-projets_zones_data' },
    { old: 'c-projets_db', newKey: 'c-projets_db' },
    { old: 'c-projets_library_editor', newKey: 'c-projets_library_editor' },
    { old: 'c-projets_templates', newKey: 'c-projets_templates' },
    { old: 'c-projets_library_favorites', newKey: 'c-projets_library_favorites' },
    { old: 'c-projets_project_time', newKey: 'c-projets_project_time' },
    { old: 'c-projets-theme', newKey: 'c-projets-theme' },
    { old: 'c-projets-cardColors', newKey: 'c-projets-cardColors' },
    { old: 'c-projets-username', newKey: 'c-projets-username' },
    { old: 'c-projets-user-role', newKey: 'c-projets-user-role' },
    { old: 'c-projets_contracts', newKey: 'c-projets_contracts' },
    { old: 'c-projets_charge_resentie', newKey: 'c-projets_charge_resentie' },
    { old: 'c-projets_open_tab', newKey: 'c-projets_open_tab' },
    { old: 'c-projets_chapters_order', newKey: 'c-projets_chapters_order' },
    { old: 'c-projets_priority_data', newKey: 'c-projets_priority_data' },
    { old: 'c-projets_tags_data', newKey: 'c-projets_tags_data' },
    { old: 'c-projets_gmr_data', newKey: 'c-projets_gmr_data' },
    { old: 'c-projets_zones_data', newKey: 'c-projets_zones_data' },
    { old: 'c-projets_hidden_milestones', newKey: 'c-projets_hidden_milestones' },
    { old: 'c-projets_entreprises', newKey: 'c-projets_entreprises' },
    { old: 'c-projets_library_templates', newKey: 'c-projets_library_templates' },
  ];

  let migrated = false;
  const emailKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('mytrello_email_') || key.startsWith('c-projets_email_')) {
      emailKeys.push(key);
    }
  }
  emailKeys.forEach(oldKey => {
    const newKey = oldKey
      .replace('mytrello_email_', 'c-projets_email_')
      .replace('c-projets_email_', 'c-projets_email_');
    if (!localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
    }
    localStorage.removeItem(oldKey);
    migrated = true;
  });

  keyMappings.forEach(({ old, newKey }) => {
    const oldVal = localStorage.getItem(old);
    if (oldVal && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldVal);
      migrated = true;
    }
  });

  if (migrated) {
    console.log('[Migration] Clés localStorage migrées vers C-PRojeTs');
  }
}

import { getWeekNumberISO, formatDuration } from '../shared/utils';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useBoard } from '../hooks/useBoard';

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

function convertLibraryItemsToTree(libraryItems) {
  const chaptersMap = new Map();

  libraryItems.forEach(item => {
    const tags = item.tags ? item.tags.split(',') : [];
    const chapterName = tags[0] || 'Sans chapitre';

    let chapter = chaptersMap.get(chapterName);
    if (!chapter) {
      chapter = {
        id: `chap-${chapterName}`,
        type: 'chapitre',
        titre: chapterName,
        data: { chapitre: chapterName },
        children: [],
      };
      chaptersMap.set(chapterName, chapter);
    }

    if (item.type === 'card') {
      let content;
      try {
        content = JSON.parse(item.content_json);
      } catch {
        content = { card: { title: item.title }, categories: [] };
      }

      const cardNode = {
        id: `card-${item.id}`,
        type: 'carte',
        titre: item.title,
        data: {
          carte: item.title,
          temps: item.duration || 0,
          skipAction: content.card?.skipAction || false,
        },
        children: [],
      };

      if (content.categories) {
        content.categories.forEach(cat => {
          const categoryNode = {
            id: `cat-${item.id}-${cat.title}`,
            type: 'categorie',
            titre: cat.title,
            data: {
              categorie: cat.title,
              temps: cat.duration_days || 0,
              systemTag: cat.tag || null,
            },
            children: [],
          };

          if (cat.subcategories) {
            cat.subcategories.forEach(sub => {
              categoryNode.children.push({
                id: `sub-${item.id}-${cat.title}-${sub.title}`,
                type: 'souscategorie',
                titre: sub.title,
                data: {
                  sousCat1: sub.title,
                  sousCat2: sub.description || '',
                  temps: sub.duration_days || 0,
                },
              });
            });
          }

          cardNode.children.push(categoryNode);
        });
      }

      chapter.children.push(cardNode);
    }
  });

  return Array.from(chaptersMap.values());
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

async function loadBackupFromImports() {
  try {
    const response = await fetch(IMPORTS_PATH);
    if (!response.ok) {
      return null;
    }
    
    const files = await response.json();
    const jsonFile = files.filter(f => f.isFile && f.name.endsWith('.json'))[0];
    
    if (!jsonFile) {
      console.log('[loadBackupFromImports] No JSON file found in imports/');
      return null;
    }
    
    const fileResponse = await fetch(IMPORTS_PATH + jsonFile.name);
    if (!fileResponse.ok) {
      console.error('[loadBackupFromImports] Could not load file:', jsonFile.name);
      return null;
    }
    
    const backup = await fileResponse.json();
    console.log('[loadBackupFromImports] Loaded backup:', jsonFile.name);
    console.log('[loadBackupFromImports] Version:', backup.version);
    
    return backup;
  } catch (e) {
    console.log('[loadBackupFromImports] No backup file or error:', e.message);
    return null;
  }
}

function convertBackupToAppData(backup) {
  console.log('[convertBackupToAppData] Input backup:', backup ? 'defined' : 'null/undefined');
  console.log('[convertBackupToAppData] backup.databases:', backup?.databases ? 'defined' : 'undefined');
  
  const data = {
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
      order: 1,
    },
  };
  
  if (!backup || !backup.databases) {
    return data;
  }
  
  const core = backup.databases.core;
  
  if (core) {
    if (core.boards) {
      data.boards = core.boards.map(b => ({
        ...b,
        updated_at: b.updated_at || b.created_at,
      }));
      data.nextIds.board = Math.max(...data.boards.map(b => b.id), 0) + 1;
    }
    
    if (core.columns) {
      data.columns = core.columns.map(c => ({
        ...c,
        position: c.position ?? 0,
      }));
      data.nextIds.column = Math.max(...data.columns.map(c => c.id), 0) + 1;
    }
    
    if (core.cards) {
      data.cards = core.cards.map(c => ({
        ...c,
        column_id: c.column_id || c.board_id,
        tags: c.tags || '',
      }));
      data.nextIds.card = Math.max(...data.cards.map(c => c.id), 0) + 1;
    }
    
    if (core.categories) {
      data.categories = core.categories;
      data.nextIds.category = Math.max(...data.categories.map(c => c.id), 0) + 1;
    }
    
    if (core.subcategories) {
      data.subcategories = core.subcategories;
      data.nextIds.subcategory = Math.max(...data.subcategories.map(s => s.id), 0) + 1;
    }
  }
  
  if (backup.libraryFavorites) {
    data.libraryFavorites = backup.libraryFavorites;
  }
  
  return data;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[saveToStorage] Error:', e);
  }
}

function initDefaultData() {
  // Migrer les anciennes clés localStorage si nécessaire
  migrateLocalStorageKeys();

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
    console.log('[AppContext] Loading library templates');
    // Check if custom library data exists in LibraryEditor storage
    const customLibrary = localStorage.getItem('c-projets_library_editor');
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
    const customLibrary = localStorage.getItem('c-projets_library_editor');
    if (customLibrary) {
      try {
        const treeData = JSON.parse(customLibrary);
        data.libraryItems = convertTreeToLibraryItems(treeData);
        console.log('[AppContext] Updated libraryItems from library editor');
      } catch (e) {
        console.error('[AppContext] Error loading custom library:', e);
      }
    }
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

  const timeTracking = useTimeTracking();
  const boardHooks = useBoard();
  const [libraryItems, setLibraryItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [subcategoryEmails, setSubcategoryEmails] = useState([]);
  const [currentUsername, setCurrentUsername] = useState(
    () => localStorage.getItem('c-projets-username') || ''
  );
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState('panel');
  const [theme, setTheme] = useState('dark');
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [activeTabCommande, setActiveTabCommande] = useState('commande');
  const [activeTab, setActiveTab] = useState('taches');
  const [unreadMentions, setUnreadMentions] = useState({});
  const [cardColors, setCardColors] = useState({
    etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
    enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
    realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
    archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
  });

  const [hiddenMilestones, setHiddenMilestones] = useState(() => {
    const saved = localStorage.getItem('c-projets_hidden_milestones');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('c-projets-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedColors = localStorage.getItem('c-projets-cardColors');
    if (savedColors) {
      setCardColors(JSON.parse(savedColors));
    }
  }, []);

  useEffect(() => {
    async function checkAndLoadBackup() {
      try {
        const backupFiles = [
          'c-projets-backup-2026-03-31.json',
          'c-projets-backup.json',
          'backup.json',
          'import.json',
        ];
        
        let backup = null;
        let foundFile = null;
        
        for (const fileName of backupFiles) {
          try {
            const url = IMPORTS_PATH + fileName;
            console.log('[AppContext] Checking for backup file:', url);
            const response = await fetch(url);
            console.log('[AppContext] Response status for', fileName, ':', response.status);
            if (response.ok) {
              backup = await response.json();
              foundFile = fileName;
              console.log('[AppContext] Found and loaded backup file:', fileName);
              break;
            }
          } catch (e) {
            console.log('[AppContext] Error loading', fileName, ':', e.message);
          }
        }
        
        if (!backup) {
          console.log('[AppContext] No backup file found in imports/');
          return;
        }
        
        console.log('[AppContext] Loaded backup, version:', backup.version);
        
        const appData = convertBackupToAppData(backup);
        
        setDb(prev => ({
          ...prev,
          ...appData,
          libraryFavorites: appData.libraryFavorites || prev.libraryFavorites,
        }));
        
        console.log('[AppContext] Backup loaded successfully, boards:', appData.boards.length);
      } catch (e) {
        console.log('[AppContext] No backup to load or error:', e.message);
      }
    }
    
    checkAndLoadBackup();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('c-projets-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('c-projets-cardColors', JSON.stringify(cardColors));
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

  const [guideOpen, setGuideOpen] = useState(false);
  const toggleGuide = useCallback(() => {
    setGuideOpen(prev => !prev);
    setSearchOpen(false);
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const toggleSearch = useCallback(() => {
    setSearchOpen(prev => !prev);
    setGuideOpen(false);
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

  const loadBoard = useCallback(
    (boardId, data = null) => {
      const sourceData = data || db;
      const board = sourceData.boards.find(b => Number(b.id) === Number(boardId));
      if (board) {
        setCurrentBoard(board);
        const boardColumns = sourceData.columns.filter(c => Number(c.board_id) === Number(boardId));
        const columnIds = boardColumns.map(c => Number(c.id));
        console.log(
          '[loadBoard] boardColumns:',
          boardColumns.map(c => ({ id: c.id, title: c.title }))
        );
        console.log('[loadBoard] columnIds:', columnIds);
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
        console.log(
          '[loadBoard] filteredCards:',
          filteredCards.map(c => ({ id: c.id, title: c.title, column_id: c.column_id }))
        );
        setColumns(boardColumns.sort((a, b) => a.position - b.position));
        setCards(filteredCards.sort((a, b) => a.position - b.position));
        const cardIds = filteredCards.map(c => Number(c.id));
        setCategories(
          sourceData.categories
            .filter(c => cardIds.includes(Number(c.card_id)))
            .sort((a, b) => a.position - b.position)
        );
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

  // Project time tracking functions
  const getWeekNumber = date => getWeekNumberISO(date);
  const getWeekKey = timeTracking.getWeekKey;
  const loadProjectTime = timeTracking.loadProjectTime;
  const saveProjectTime = timeTracking.saveProjectTime;

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

  const addProjectTime = timeTracking.addProjectTime;
  const getProjectTime = timeTracking.getProjectTime;
  const getAllProjectTime = timeTracking.getAllProjectTime;

  // Ensure libraryItems has data - always check library editor first
  const forceLibraryItems = () => {
    // Always check if custom library data exists in LibraryEditor storage
    const customLibrary = localStorage.getItem('c-projets_library_editor');
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
      itemsToUse = db.libraryItems;
      console.log('[AppContext] Using db.libraryItems, count:', itemsToUse.length);
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
      const customLibrary = localStorage.getItem('c-projets_library_editor');
      if (customLibrary) {
        try {
          const treeData = JSON.parse(customLibrary);
          const itemsToUse = convertTreeToLibraryItems(treeData);

          // Update c-projets_db with the new libraryItems
          let mainDb = localStorage.getItem('c-projets_db');
          if (mainDb) {
            const dbObj = JSON.parse(mainDb);
            dbObj.libraryItems = itemsToUse;
            localStorage.setItem('c-projets_db', JSON.stringify(dbObj));
          }

          // Force update by creating new object reference
          setLibraryItems([...itemsToUse]);
          console.log('[AppContext] Reloaded library from editor, count:', itemsToUse.length);
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

  const exportData = () => {
    console.log('[ExportData] Starting export with migration layer...');
    try {
      const exportObj = generateExportData(db);
      downloadExport(exportObj);
      console.log('[ExportData] Export completed successfully');
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

  const importData = jsonData => {
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

      setDb(dbData);
      saveToStorage(dbData);

      if (data.projectTime) {
        localStorage.setItem('c-projets_project_time', JSON.stringify(data.projectTime));
      }
      if (data.libraryFavorites) {
        localStorage.setItem('c-projets_library_favorites', JSON.stringify(data.libraryFavorites));
      }
      if (data.databases?.library && Array.isArray(data.databases.library) && data.databases.library.length > 0) {
        console.log('[ImportData] Found library in databases.library, count:', data.databases.library.length);
        const cleanLibraryEditor = deduplicateLibraryEditor(data.databases.library);
        localStorage.setItem('c-projets_library_editor', JSON.stringify(cleanLibraryEditor));
      } else if (data.libraryEditor && Array.isArray(data.libraryEditor) && data.libraryEditor.length > 0) {
        console.log('[ImportData] Found library in libraryEditor, count:', data.libraryEditor.length);
        const cleanLibraryEditor = deduplicateLibraryEditor(data.libraryEditor);
        localStorage.setItem('c-projets_library_editor', JSON.stringify(cleanLibraryEditor));
      } else if (dbData.libraryItems && dbData.libraryItems.length > 0) {
        console.log('[ImportData] Found library in dbData.libraryItems, count:', dbData.libraryItems.length);
        // Fallback for old exports - convert to tree format
        const treeData = convertLibraryItemsToTree(dbData.libraryItems);
        if (treeData.length > 0) {
          localStorage.setItem('c-projets_library_editor', JSON.stringify(treeData));
        }
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
        }
        if (data.settings.userRole) {
          localStorage.setItem('c-projets-user-role', data.settings.userRole);
        }
        if (data.settings.chargeResentie) {
          localStorage.setItem(
            'c-projets_charge_ressentie',
            JSON.stringify(data.settings.chargeResentie)
          );
        }
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

      console.log(
        '[ImportData] Import réussi!',
        normalized.warnings.length > 0 ? `Warnings: ${normalized.warnings.join(', ')}` : ''
      );
      return { success: true, warnings: normalized.warnings };
    } catch (error) {
      console.error('[ImportData] Erreur:', error);
      return { success: false, error: error.message };
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
    if (currentBoard) loadBoard(currentBoard.id, newDb);
  };

  const deleteColumn = id => {
    const newDb = {
      ...db,
      columns: db.columns.filter(c => Number(c.id) !== Number(id)),
      cards: db.cards.filter(c => Number(c.column_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id, newDb);
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
    if (currentBoard) loadBoard(currentBoard.id, newDb);
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
    chapter = null,
    libraryItemId = null,
    skipAction = false
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
          library_item_id: libraryItemId,
          skip_action: skipAction,
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
    if (currentBoard) loadBoard(currentBoard.id, newDb);
  };

  const deleteCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.filter(c => Number(c.id) !== Number(id)),
      categories: db.categories.filter(cat => Number(cat.card_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id, newDb);
  };

  const archiveCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 1 } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id, newDb);
  };

  const restoreCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 0 } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id, newDb);
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
    if (currentBoard) loadBoard(currentBoard.id, newDb);
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
    if (currentBoard) loadBoard(currentBoard.id, newDb);
  };

  const deleteCategory = id => {
    const newDb = {
      ...db,
      categories: db.categories.filter(c => Number(c.id) !== Number(id)),
      subcategories: db.subcategories.filter(s => Number(s.category_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id, newDb);
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
    if (currentBoard) loadBoard(currentBoard.id, newDb);
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
      let newDbRef;
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
        newDbRef = newDb;
        saveToStorage(newDb);
        return newDb;
      });

      setTimeout(() => {
        if (currentBoard) loadBoard(currentBoard.id, newDbRef);
      }, 100);

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
      setTimeout(() => loadBoard(currentBoard.id, newDb), 100);
    }
  };

  const toggleMilestone = (subcategoryId, milestoneId) => {
    const sub = db.subcategories.find(s => Number(s.id) === Number(subcategoryId));
    if (!sub) return;

    let milestones = sub.milestones;
    if (typeof milestones === 'string') {
      try {
        milestones = JSON.parse(milestones);
      } catch (e) {
        milestones = [];
      }
    }
    if (!Array.isArray(milestones)) milestones = [];

    const updatedMilestones = milestones.map(m => {
      if (Number(m.id) === Number(milestoneId)) {
        return { ...m, done: !m.done };
      }
      return m;
    });

    updateSubcategory(subcategoryId, { milestones: updatedMilestones });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('milestone-updated'));
    }, 100);
  };

  const addHiddenMilestone = milestoneId => {
    setHiddenMilestones(prev => {
      const newSet = new Set(prev);
      newSet.add(Number(milestoneId));
      localStorage.setItem('c-projets_hidden_milestones', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const deleteSubcategory = id => {
    const newDb = {
      ...db,
      subcategories: db.subcategories.filter(s => Number(s.id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) {
      setTimeout(() => loadBoard(currentBoard.id, newDb), 100);
    }
  };

  const addEmailToSubcategory = (subcategoryId, emailData) => {
    const emailId = db.nextIds.email++;
    const newEmail = {
      id: emailId,
      subcategory_id: Number(subcategoryId),
      date: emailData.date,
      subject: emailData.subject,
      filepath: emailData.filepath,
      filename: emailData.filename,
      created_at: new Date().toISOString(),
    };
    const newDb = {
      ...db,
      subcategoryEmails: [...(db.subcategoryEmails || []), newEmail],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    return emailId;
  };

  const removeEmailFromSubcategory = emailId => {
    const email = db.subcategoryEmails?.find(e => Number(e.id) === Number(emailId));
    if (email && email.filepath) {
      localStorage.removeItem(`c-projets_email_${emailId}`);
    }
    const newDb = {
      ...db,
      subcategoryEmails: (db.subcategoryEmails || []).filter(e => Number(e.id) !== Number(emailId)),
    };
    saveDb(newDb);
  };

  const updateEmailSubject = (emailId, newSubject) => {
    const newDb = {
      ...db,
      subcategoryEmails: (db.subcategoryEmails || []).map(e =>
        Number(e.id) === Number(emailId) ? { ...e, subject: newSubject } : e
      ),
    };
    saveDb(newDb);
  };

  const getEmailsForSubcategory = subcategoryId => {
    return (db.subcategoryEmails || []).filter(
      e => Number(e.subcategory_id) === Number(subcategoryId)
    );
  };

  const saveEmailFile = (emailId, fileData) => {
    localStorage.setItem(`c-projets_email_${emailId}`, fileData);
  };

  const getEmailFile = emailId => {
    return localStorage.getItem(`c-projets_email_${emailId}`);
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
    if (currentBoard) loadBoard(currentBoard.id, newDb);
  };

  const loadLibrary = useCallback(() => {
    setLibraryItems(db.libraryItems || []);
  }, [db]);

  const saveToLibrary = useCallback(
    (type, title, contentJson) => {
      const existingItems = db.libraryItems || [];
      const existingItem = existingItems.find(item => item.type === type && item.title === title);
      if (existingItem) {
        console.log('[saveToLibrary] Item already exists:', type, title);
        return existingItem.id;
      }

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

  const syncTagsFromLibrary = () => {
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    console.log('[syncTagsFromLibrary] treeRaw exists:', !!treeRaw);
    const categoriesWithTags = [];
    const subcategoriesWithTags = [];

    if (treeRaw) {
      try {
        const treeData = JSON.parse(treeRaw);
        const findTagsInNodes = nodes => {
          nodes.forEach(node => {
            if (node.data && node.data.systemTag && node.data.systemTag.trim()) {
              if (node.type === 'categorie' && node.data.categorie) {
                categoriesWithTags.push({
                  title: node.data.categorie,
                  tag: node.data.systemTag.trim(),
                });
              }
              if (node.type === 'souscategorie' && node.data.sousCat1) {
                subcategoriesWithTags.push({
                  title: node.data.sousCat1,
                  tag: node.data.systemTag.trim(),
                });
              }
            }
            if (node.children) {
              findTagsInNodes(node.children);
            }
          });
        };
        findTagsInNodes(treeData);
      } catch (e) {
        console.error('[syncTagsFromLibrary] Error parsing tree:', e);
      }
    }

    const libraryItems = db.libraryItems || [];
    libraryItems.forEach(item => {
      if (item.type === 'category' && item.content_json) {
        try {
          const content = JSON.parse(item.content_json);
          if (content.category && content.category.tag) {
            categoriesWithTags.push({
              title: item.title,
              tag: content.category.tag,
            });
          }
        } catch (e) {}
      }
      if (item.type === 'subcategory' && item.content_json) {
        try {
          const content = JSON.parse(item.content_json);
          if (content.subcategory && content.subcategory.tag) {
            subcategoriesWithTags.push({
              title: item.title,
              tag: content.subcategory.tag,
            });
          }
        } catch (e) {}
      }
      if (item.type === 'card' && item.content_json) {
        try {
          const content = JSON.parse(item.content_json);
          if (content.categories) {
            content.categories.forEach(cat => {
              if (cat.tag) {
                categoriesWithTags.push({
                  title: cat.title,
                  tag: cat.tag,
                });
              }
              if (cat.subcategories) {
                cat.subcategories.forEach(subcat => {
                  if (subcat.tag) {
                    subcategoriesWithTags.push({
                      title: subcat.title,
                      tag: subcat.tag,
                    });
                  }
                });
              }
            });
          }
        } catch (e) {}
      }
    });

    console.log('[syncTagsFromLibrary] Categories from library:', categoriesWithTags);
    console.log('[syncTagsFromLibrary] Subcategories from library:', subcategoriesWithTags);
    console.log(
      '[syncTagsFromLibrary] Categories in DB:',
      db.categories.map(c => ({ id: c.id, title: c.title, tag: c.tag }))
    );
    console.log(
      '[syncTagsFromLibrary] Subcategories in DB:',
      db.subcategories.map(s => ({ id: s.id, title: s.title, tag: s.tag }))
    );

    let updatedCount = 0;

    const normalizeTitle = title => (title ? title.toLowerCase().trim().replace(/\s+/g, ' ') : '');

    const newCategories = db.categories.map(cat => {
      if (cat.tag) return cat;
      const catTitle = normalizeTitle(cat.title);

      // Exact match first
      let matchingLibraryCat = categoriesWithTags.find(lc => catTitle === normalizeTitle(lc.title));

      // If no exact match, try partial match
      if (!matchingLibraryCat) {
        matchingLibraryCat = categoriesWithTags.find(
          lc =>
            catTitle.includes(normalizeTitle(lc.title)) ||
            normalizeTitle(lc.title).includes(catTitle)
        );
      }

      if (matchingLibraryCat) {
        console.log(
          '[syncTagsFromLibrary] MATCH category:',
          cat.title,
          '->',
          matchingLibraryCat.tag
        );
        updatedCount++;
        return { ...cat, tag: matchingLibraryCat.tag };
      }
      return cat;
    });

    const newSubcategories = db.subcategories.map(sub => {
      if (sub.tag) return sub;
      const subTitle = normalizeTitle(sub.title);

      // Exact match first
      let matchingLibrarySub = subcategoriesWithTags.find(
        ls => subTitle === normalizeTitle(ls.title)
      );

      // If no exact match, try partial match
      if (!matchingLibrarySub) {
        matchingLibrarySub = subcategoriesWithTags.find(
          ls =>
            subTitle.includes(normalizeTitle(ls.title)) ||
            normalizeTitle(ls.title).includes(subTitle)
        );
      }

      if (matchingLibrarySub) {
        console.log(
          '[syncTagsFromLibrary] MATCH subcategory:',
          sub.title,
          '->',
          matchingLibrarySub.tag
        );
        updatedCount++;
        return { ...sub, tag: matchingLibrarySub.tag };
      }
      return sub;
    });

    const newDb = {
      ...db,
      categories: newCategories,
      subcategories: newSubcategories,
    };
    saveDb(newDb);

    if (currentBoard) {
      setTimeout(() => loadBoard(currentBoard.id, newDb), 100);
    }

    return updatedCount;
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
    localStorage.setItem('c-projets-username', name);
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
    subcategoryEmails,
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
    guideOpen,
    toggleGuide,
    searchOpen,
    toggleSearch,
    selectedCard,
    setSelectedCard,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    selectedCommande,
    setSelectedCommande,
    activeTabCommande,
    setActiveTabCommande,
    activeTab,
    setActiveTab,
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
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
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
    cardColors,
    updateCardColors,
    resetCardColors,
    addWorkingDays,
    getWorkingDaysBetween,
    getProjectTime,
    getAllProjectTime,
    loadProjectTime,
    getWeekNumber,
    getInternalContacts,
  };

  return (
    <UIProvider>
      <UserProvider>
        <SelectionProvider>
          <AppContext.Provider value={value}>
            <TimerProvider currentBoard={currentBoard} addProjectTime={addProjectTime}>
              {children}
            </TimerProvider>
          </AppContext.Provider>
        </SelectionProvider>
      </UserProvider>
    </UIProvider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

const TimerContext = createContext(null);

function TimerProvider({ children, currentBoard, addProjectTime }) {
  const [projectTimer, setProjectTimer] = useState({
    activeProjectId: null,
    startTime: null,
    intervals: {},
  });

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
  }, [projectTimer.activeProjectId, projectTimer.startTime, addProjectTime]);

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
  }, [currentBoard?.id, addProjectTime]);

  return (
    <TimerContext.Provider value={{ projectTimer, setProjectTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useProjectTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useProjectTimer must be used within a TimerProvider');
  }
  return context;
}
