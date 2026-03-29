export const sqlite = {
  isAvailable: false,
  db: null,

  async init() {
    console.log('[SQLite] Initialisation...');
    return false;
  },

  async migrateFromLocalStorage() {
    console.log('[SQLite] Migration depuis localStorage non implémentée');
    return false;
  },

  async query(sql, params = []) {
    console.warn('[SQLite] Non disponible - utilisez localStorage');
    return [];
  },

  async execute(sql, params = []) {
    console.warn('[SQLite] Non disponible - utilisez localStorage');
    return false;
  },

  getTables() {
    return [];
  },

  async close() {
    console.log('[SQLite] Fermeture...');
  },
};

export const initSQLite = async () => {
  try {
    if (typeof window !== 'undefined' && window.initSQLite) {
      console.log('[SQLite] Wrapper détecté');
      return true;
    }
  } catch (e) {
    console.log('[SQLite] Non disponible dans ce contexte');
  }
  return false;
};

export const tableSchemas = {
  boards: `
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT,
      updated_at TEXT,
      is_archived INTEGER DEFAULT 0
    )
  `,
  columns: `
    CREATE TABLE IF NOT EXISTS columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER,
      title TEXT NOT NULL,
      position INTEGER,
      color TEXT,
      FOREIGN KEY (board_id) REFERENCES boards(id)
    )
  `,
  cards: `
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER,
      column_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      chapter TEXT,
      position INTEGER,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (board_id) REFERENCES boards(id),
      FOREIGN KEY (column_id) REFERENCES columns(id)
    )
  `,
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER,
      title TEXT NOT NULL,
      position INTEGER,
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )
  `,
  subcategories: `
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT,
      progress INTEGER DEFAULT 0,
      position INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `,
  contacts: `
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER,
      type TEXT,
      title TEXT,
      name TEXT,
      FOREIGN KEY (board_id) REFERENCES boards(id)
    )
  `,
  tags: `
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT,
      functions TEXT
    )
  `,
  gmrs: `
    CREATE TABLE IF NOT EXISTS gmrs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      label TEXT
    )
  `,
  zones: `
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL
    )
  `,
  chapters: `
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position INTEGER
    )
  `,
  contracts: `
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT,
      fournisseur TEXT,
      acheteur TEXT,
      date_debut TEXT,
      date_fin TEXT,
      type TEXT,
      segment TEXT,
      lien_doki TEXT
    )
  `,
};

export default sqlite;
