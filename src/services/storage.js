import Dexie from 'dexie';

const DB_NAME = 'c-projets-db';
const DB_VERSION = 1;

class CProjetsDB extends Dexie {
  constructor() {
    super(DB_NAME);

    this.version(DB_VERSION).stores({
      boards: '++id, title',
      columns: '++id, board_id, position',
      cards: '++id, board_id, title',
      categories: '++id, card_id, title',
      subcategories: '++id, category_id, title',
      library: '++id, type, title, tags',
    });

    this.boards = this.table('boards');
    this.columns = this.table('columns');
    this.cards = this.table('cards');
    this.categories = this.table('categories');
    this.subcategories = this.table('subcategories');
    this.library = this.table('library');
  }
}

const db = new CProjetsDB();
const STORAGE_KEY = 'c-projets_db';

export const storage = {
  isSQLite: true,

  async init() {
    if (!db.isOpen()) {
      await db.open();
    }
  },

  getItem: key => localStorage.getItem(key),

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('[Storage] Erreur setItem:', e.message);
    }
  },

  removeItem: key => localStorage.removeItem(key),

  async getDb() {
    try {
      await storage.init();
      const data = {
        boards: await db.boards.toArray(),
        columns: await db.columns.toArray(),
        cards: await db.cards.toArray(),
        categories: await db.categories.toArray(),
        subcategories: await db.subcategories.toArray(),
        libraryItems: await db.library.toArray(),
        messages: [],
        subcategoryEmails: [],
      };
      if (data.boards.length > 0) return data;
    } catch (e) {
      console.log('[Storage] IndexedDB non dispo, fallback localStorage');
    }
    const fallback = localStorage.getItem(STORAGE_KEY);
    return fallback ? JSON.parse(fallback) : null;
  },

  async setDb(dbData) {
    if (!dbData) return;

    // Always save to localStorage as backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData));
      console.log('[Storage] Sauvegardé localStorage');
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    } catch (e) {
      console.log('[Storage] Erreur localStorage:', e.message);
    }

    // Also save to IndexedDB
    try {
      await storage.init();
      await db.transaction(
        'rw',
        db.boards,
        db.columns,
        db.cards,
        db.categories,
        db.subcategories,
        db.library,
        async () => {
          await db.boards.clear();
          await db.columns.clear();
          await db.cards.clear();
          await db.categories.clear();
          await db.subcategories.clear();
          await db.library.clear();

          if (dbData.boards?.length) await db.boards.bulkPut(dbData.boards);
          if (dbData.columns?.length) await db.columns.bulkPut(dbData.columns);
          if (dbData.cards?.length) await db.cards.bulkPut(dbData.cards);
          if (dbData.categories?.length) await db.categories.bulkPut(dbData.categories);
          if (dbData.subcategories?.length) await db.subcategories.bulkPut(dbData.subcategories);
          if (dbData.libraryItems?.length) await db.library.bulkPut(dbData.libraryItems);
        }
      );
      console.log('[Storage] Sauvegardé IndexedDB');
    } catch (e) {
      console.log('[Storage] Erreur IndexedDB:', e.message);
    }
  },

  getProjectData: (boardId, key) => localStorage.getItem(`board-${boardId}-${key}`),
  setProjectData: (boardId, key, value) =>
    localStorage.setItem(`board-${boardId}-${key}`, JSON.stringify(value)),

  getGMRData: () => {
    const d = localStorage.getItem('c-projets_gmr');
    return d ? JSON.parse(d) : [];
  },
  setGMRData: v => localStorage.setItem('c-projets_gmr', JSON.stringify(v)),

  getZonesData: () => {
    const d = localStorage.getItem('c-projets_zones');
    return d ? JSON.parse(d) : [];
  },
  setZonesData: v => localStorage.setItem('c-projets_zones', JSON.stringify(v)),

  getTagsData: () => {
    const d = localStorage.getItem('c-projets_tags');
    return d ? JSON.parse(d) : [];
  },
  setTagsData: v => localStorage.setItem('c-projets_tags', JSON.stringify(v)),

  getContracts: () => {
    const d = localStorage.getItem('c-projets_contracts');
    return d ? JSON.parse(d) : [];
  },
  setContracts: v => localStorage.setItem('c-projets_contracts', JSON.stringify(v)),

  clear: () => localStorage.removeItem(STORAGE_KEY),
  getAllKeys: () => Object.keys(localStorage),

  async exportAll() {
    return storage.getDb();
  },
  async importAll(data) {
    if (data) await storage.setDb(data);
  },
};

export default storage;
