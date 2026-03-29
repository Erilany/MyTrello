const STORAGE_KEY = 'd-projet_db';

const PROJECT_KEYS = [
  'links',
  'commandes',
  'eotp',
  'internalContacts',
  'externalContacts',
  'gmr',
  'priority',
  'zone',
];

export const storage = {
  isSQLite: false,

  getItem: key => {
    return localStorage.getItem(key);
  },

  setItem: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  removeItem: key => {
    localStorage.removeItem(key);
  },

  getDb: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('[Storage] Erreur parsing db:', e);
        return null;
      }
    }
    return null;
  },

  setDb: dbData => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData));
  },

  getBoards: () => {
    const db = storage.getDb();
    return db?.boards || [];
  },

  getBoard: boardId => {
    const db = storage.getDb();
    return db?.boards?.find(b => b.id === boardId) || null;
  },

  getColumns: boardId => {
    const db = storage.getDb();
    return db?.columns?.filter(c => Number(c.board_id) === Number(boardId)) || [];
  },

  getCards: boardId => {
    const db = storage.getDb();
    return db?.cards?.filter(c => Number(c.board_id) === Number(boardId)) || [];
  },

  getAllCards: () => {
    const db = storage.getDb();
    return db?.cards || [];
  },

  getCategories: cardId => {
    const db = storage.getDb();
    return db?.categories?.filter(c => Number(c.card_id) === Number(cardId)) || [];
  },

  getAllCategories: () => {
    const db = storage.getDb();
    return db?.categories || [];
  },

  getSubcategories: categoryId => {
    const db = storage.getDb();
    return db?.subcategories?.filter(s => Number(s.category_id) === Number(categoryId)) || [];
  },

  getAllSubcategories: () => {
    const db = storage.getDb();
    return db?.subcategories || [];
  },

  getProjectData: (boardId, key) => {
    const data = localStorage.getItem(`board-${boardId}-${key}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return null;
  },

  setProjectData: (boardId, key, value) => {
    localStorage.setItem(`board-${boardId}-${key}`, JSON.stringify(value));
  },

  getAllProjectData: boardId => {
    const result = {};
    PROJECT_KEYS.forEach(key => {
      const data = storage.getProjectData(boardId, key);
      if (data !== null) {
        result[key] = data;
      }
    });
    return result;
  },

  getProjectContacts: (boardId, type = 'internal') => {
    const key = type === 'internal' ? 'internalContacts' : 'externalContacts';
    return storage.getProjectData(boardId, key) || [];
  },

  setProjectContacts: (boardId, contacts, type = 'internal') => {
    const key = type === 'internal' ? 'internalContacts' : 'externalContacts';
    storage.setProjectData(boardId, key, contacts);
  },

  getGMRData: () => {
    const data = localStorage.getItem('d-projet_gmr');
    return data ? JSON.parse(data) : [];
  },

  setGMRData: gmrData => {
    localStorage.setItem('d-projet_gmr', JSON.stringify(gmrData));
  },

  getZonesData: () => {
    const data = localStorage.getItem('d-projet_zones');
    return data ? JSON.parse(data) : [];
  },

  setZonesData: zonesData => {
    localStorage.setItem('d-projet_zones', JSON.stringify(zonesData));
  },

  getTagsData: () => {
    const data = localStorage.getItem('d-projet_tags');
    return data ? JSON.parse(data) : [];
  },

  setTagsData: tagsData => {
    localStorage.setItem('d-projet_tags', JSON.stringify(tagsData));
  },

  getContracts: () => {
    const data = localStorage.getItem('d-projet_contracts');
    return data ? JSON.parse(data) : [];
  },

  setContracts: contracts => {
    localStorage.setItem('d-projet_contracts', JSON.stringify(contracts));
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    PROJECT_KEYS.forEach(key => {
      const prefix = 'board-';
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(prefix) && k.includes(key)) {
          localStorage.removeItem(k);
        }
      });
    });
  },

  getAllKeys: () => {
    return Object.keys(localStorage);
  },

  exportAll: () => {
    const data = {};
    Object.keys(localStorage).forEach(key => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        data[key] = localStorage.getItem(key);
      }
    });
    return data;
  },

  importAll: data => {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
  },
};

export default storage;
