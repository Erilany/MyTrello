-- Tableaux
CREATE TABLE IF NOT EXISTS boards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Colonnes
CREATE TABLE IF NOT EXISTS columns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id   INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  position   INTEGER NOT NULL,
  color      TEXT DEFAULT '#4A90D9',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cartes Projet (niveau 1)
CREATE TABLE IF NOT EXISTS cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER REFERENCES columns(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  color       TEXT DEFAULT '#FFFFFF',
  is_archived INTEGER DEFAULT 0,
  collapsed   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Catégories (niveau 2)
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id     INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  color       TEXT DEFAULT '#F5F5F5',
  collapsed   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sous-catégories (niveau 3)
CREATE TABLE IF NOT EXISTS subcategories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Commentaires (tous niveaux)
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type   TEXT NOT NULL,
  ref_id     INTEGER NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bibliothèque de modèles
CREATE TABLE IF NOT EXISTS library_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  content_json TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Paramètres
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column_id ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_categories_card_id ON categories(card_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_ref ON comments(ref_type, ref_id);

-- Historique des commandes vocales
CREATE TABLE IF NOT EXISTS voice_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  command    TEXT NOT NULL,
  action     TEXT NOT NULL,
  status     TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
