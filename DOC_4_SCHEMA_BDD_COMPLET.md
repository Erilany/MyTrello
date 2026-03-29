# 🗄️ D-ProjeT — Schéma Base de Données Complet

> Schéma SQLite complet couvrant toutes les versions MVP → V3.0.
> Fichier de référence unique à exécuter pour initialiser la base.

---

## 1. Script d'initialisation complet

```sql
-- ═══════════════════════════════════════════════════════════
-- MYTRELLO — SCHEMA COMPLET v3.0
-- Généré le 23 février 2026
-- Exécuter une seule fois pour initialiser la base complète
-- ═══════════════════════════════════════════════════════════

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ───────────────────────────────────────────────────────────
-- SECTION 1 : STRUCTURE MYTRELLO (MVP)
-- ───────────────────────────────────────────────────────────

-- Tableaux (Boards)
CREATE TABLE IF NOT EXISTS boards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  color       TEXT    DEFAULT '#4A90D9',
  position    INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Colonnes (Columns)
CREATE TABLE IF NOT EXISTS columns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id   INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  position   INTEGER NOT NULL,
  color      TEXT    DEFAULT '#4A90D9',
  collapsed  INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cartes Projet (Cards — Niveau 1)
CREATE TABLE IF NOT EXISTS cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  priority    TEXT    DEFAULT 'normal',   -- 'urgent'|'normal'|'waiting'|'done'
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  color       TEXT    DEFAULT '#FFFFFF',
  is_archived INTEGER DEFAULT 0,
  collapsed   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Catégories (Categories — Niveau 2)
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id     INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  priority    TEXT    DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  color       TEXT    DEFAULT '#F5F5F5',
  collapsed   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sous-catégories (SubCategories — Niveau 3)
CREATE TABLE IF NOT EXISTS subcategories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  priority    TEXT    DEFAULT 'normal',
  due_date    DATE,
  assignee    TEXT,
  position    INTEGER NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Commentaires (tous niveaux)
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type   TEXT    NOT NULL,   -- 'card'|'category'|'subcategory'
  ref_id     INTEGER NOT NULL,
  content    TEXT    NOT NULL,
  author     TEXT    DEFAULT 'Moi',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pièces jointes (tous niveaux)
CREATE TABLE IF NOT EXISTS attachments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type   TEXT    NOT NULL,   -- 'card'|'category'|'subcategory'
  ref_id     INTEGER NOT NULL,
  filename   TEXT    NOT NULL,
  filepath   TEXT    NOT NULL,
  filesize   INTEGER,
  mimetype   TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bibliothèque de modèles
CREATE TABLE IF NOT EXISTS library_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT    NOT NULL,   -- 'card'|'category'|'subcategory'
  title        TEXT    NOT NULL,
  content_json TEXT    NOT NULL,   -- Structure imbriquée complète en JSON
  tags         TEXT    DEFAULT '', -- Tags séparés par des virgules
  usage_count  INTEGER DEFAULT 0,
  last_used    DATETIME,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Paramètres utilisateur
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT    PRIMARY KEY,
  value      TEXT    NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- SECTION 2 : COMMANDES VOCALES (V1.1)
-- ───────────────────────────────────────────────────────────

-- Historique commandes vocales
CREATE TABLE IF NOT EXISTS voice_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  command    TEXT    NOT NULL,   -- Texte reconnu brut
  action     TEXT    NOT NULL,   -- Action identifiée
  params     TEXT,               -- Paramètres extraits (JSON)
  status     TEXT    NOT NULL,   -- 'success'|'unknown'|'error'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- SECTION 3 : MODULE MESSAGERIE (V2.0 / V2.1)
-- ───────────────────────────────────────────────────────────

-- Liens entre emails et éléments D-ProjeT
CREATE TABLE IF NOT EXISTS email_links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type    TEXT    NOT NULL,   -- 'card'|'category'|'subcategory'
  ref_id      INTEGER NOT NULL,
  source      TEXT    NOT NULL,   -- 'outlook'|'gmail'
  email_id    TEXT    NOT NULL,   -- ID email côté serveur
  subject     TEXT,
  sender      TEXT,
  received_at DATETIME,
  is_available INTEGER DEFAULT 1, -- 0 si l'email a été supprimé côté serveur
  linked_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- SECTION 4 : CALENDRIER OUTLOOK (V2.2)
-- ───────────────────────────────────────────────────────────

-- Filtres de tags calendrier (persistance des filtres actifs)
CREATE TABLE IF NOT EXISTS calendar_filters (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name   TEXT    NOT NULL UNIQUE,
  color      TEXT    DEFAULT '#4A90D9',
  is_active  INTEGER DEFAULT 1,
  position   INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cache local des événements calendrier
CREATE TABLE IF NOT EXISTS calendar_events_cache (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  outlook_id     TEXT    NOT NULL UNIQUE,
  subject        TEXT    NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime   DATETIME NOT NULL,
  location       TEXT,
  body_preview   TEXT,
  organizer      TEXT,
  tags           TEXT,           -- JSON array des catégories Outlook
  is_all_day     INTEGER DEFAULT 0,
  is_recurring   INTEGER DEFAULT 0,
  cached_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- SECTION 5 : SYNCHRONISATION TAGS (V3.0)
-- ───────────────────────────────────────────────────────────

-- Mapping tags messagerie / calendrier ↔ étiquettes D-ProjeT
CREATE TABLE IF NOT EXISTS tag_mapping (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  source          TEXT    NOT NULL,   -- 'outlook'|'gmail'|'calendar'
  source_tag      TEXT    NOT NULL,   -- Nom du tag côté source
  mytrello_label  TEXT    NOT NULL,   -- Étiquette D-ProjeT correspondante
  mytrello_priority TEXT,             -- Priorité D-ProjeT associée
  direction       TEXT    DEFAULT 'both', -- 'to_mytrello'|'to_source'|'both'
  is_active       INTEGER DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Historique des synchronisations
CREATE TABLE IF NOT EXISTS sync_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source      TEXT    NOT NULL,   -- 'outlook'|'gmail'|'calendar'
  direction   TEXT    NOT NULL,   -- 'to_mytrello'|'to_source'
  tag_from    TEXT    NOT NULL,
  tag_to      TEXT    NOT NULL,
  ref_type    TEXT,
  ref_id      INTEGER,
  status      TEXT    NOT NULL,   -- 'success'|'conflict'|'error'
  error_msg   TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ───────────────────────────────────────────────────────────
-- SECTION 6 : INDEX DE PERFORMANCE
-- ───────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_columns_board_id    ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_position    ON columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_column_id     ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_cards_position      ON cards(column_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_archived      ON cards(is_archived);
CREATE INDEX IF NOT EXISTS idx_cards_due_date      ON cards(due_date);
CREATE INDEX IF NOT EXISTS idx_categories_card_id  ON categories(card_id);
CREATE INDEX IF NOT EXISTS idx_categories_position ON categories(card_id, position);
CREATE INDEX IF NOT EXISTS idx_subcats_cat_id      ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcats_position    ON subcategories(category_id, position);
CREATE INDEX IF NOT EXISTS idx_comments_ref        ON comments(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_attachments_ref     ON attachments(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_email_links_ref     ON email_links(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_email_links_source  ON email_links(source, email_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tags       ON calendar_events_cache(tags);
CREATE INDEX IF NOT EXISTS idx_calendar_dates      ON calendar_events_cache(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_voice_history_date  ON voice_history(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_history_date   ON sync_history(created_at);
CREATE INDEX IF NOT EXISTS idx_tag_mapping_source  ON tag_mapping(source, source_tag);

-- ───────────────────────────────────────────────────────────
-- SECTION 7 : DONNÉES INITIALES (SETTINGS)
-- ───────────────────────────────────────────────────────────

INSERT OR IGNORE INTO settings (key, value) VALUES
  -- Apparence
  ('theme',                  'light'),
  ('drag_animation',         'true'),
  ('reduce_motion',          'false'),

  -- Voix
  ('voice_language',         'fr-FR'),
  ('voice_confidence',       '0.70'),
  ('voice_timeout_sec',      '10'),

  -- Messagerie Outlook
  ('outlook_enabled',        'false'),
  ('outlook_mode',           'graph'),   -- 'graph'|'ews'
  ('outlook_refresh_min',    '5'),
  ('outlook_inbox_limit',    '50'),
  ('email_clipboard',        ''),

  -- Messagerie Gmail
  ('gmail_enabled',          'false'),
  ('gmail_refresh_min',      '5'),
  ('gmail_inbox_limit',      '50'),

  -- Onglet messagerie actif
  ('active_messaging_tab',   'outlook'),

  -- Calendrier
  ('calendar_enabled',       'false'),
  ('calendar_view',          'week'),
  ('calendar_refresh_min',   '15'),
  ('calendar_show_indicator','true'),
  ('calendar_days_ahead',    '30'),
  ('calendar_multi_tag',     'false'),

  -- Synchronisation
  ('sync_enabled',           'false'),
  ('sync_interval_min',      '10'),
  ('sync_conflict_rule',     'mytrello'),
  ('sync_calendar_enabled',  'false'),
  ('last_sync_outlook',      ''),
  ('last_sync_gmail',        ''),
  ('last_sync_calendar',     ''),

  -- Cache
  ('cache_ttl_min',          '5'),

  -- Onboarding
  ('onboarding_done',        'false'),

  -- Données
  ('app_version',            '0.1.0');
```

---

## 2. Dictionnaire des tables

| Table | Section | Description |
|---|---|---|
| `boards` | MVP | Tableaux de bord |
| `columns` | MVP | Colonnes d'un tableau |
| `cards` | MVP | Cartes projet (niveau 1) |
| `categories` | MVP | Catégories (niveau 2) |
| `subcategories` | MVP | Sous-catégories (niveau 3) |
| `comments` | MVP | Commentaires (tous niveaux) |
| `attachments` | MVP | Pièces jointes locales |
| `library_items` | MVP | Bibliothèque de modèles |
| `settings` | MVP | Paramètres utilisateur |
| `voice_history` | V1.1 | Historique commandes vocales |
| `email_links` | V2.0 | Liens email ↔ éléments D-ProjeT |
| `calendar_filters` | V2.2 | Tags calendrier sélectionnés |
| `calendar_events_cache` | V2.2 | Cache local des événements |
| `tag_mapping` | V3.0 | Règles de synchronisation tags |
| `sync_history` | V3.0 | Journal des synchronisations |

---

## 3. Valeurs autorisées

### Champ `priority`
```
'urgent'   → Rouge   — À traiter immédiatement
'normal'   → Bleu    — Priorité standard
'waiting'  → Orange  — En attente d'une action externe
'done'     → Vert    — Terminé
```

### Champ `ref_type` (commentaires, pièces jointes, liens email)
```
'card'          → Carte projet (niveau 1)
'category'      → Catégorie (niveau 2)
'subcategory'   → Sous-catégorie (niveau 3)
```

### Champ `source` (email_links, tag_mapping, sync_history)
```
'outlook'   → Email ou événement provenant d'Outlook
'gmail'     → Email provenant de Gmail
'calendar'  → Événement provenant du calendrier Outlook
```

### Champ `direction` (tag_mapping)
```
'to_mytrello'   → Sync dans un seul sens : messagerie → D-ProjeT
'to_source'     → Sync dans un seul sens : D-ProjeT → messagerie
'both'          → Synchronisation bidirectionnelle
```

### Champ `status` (voice_history)
```
'success'   → Commande reconnue et exécutée
'unknown'   → Commande non reconnue
'error'     → Commande reconnue mais erreur à l'exécution
```

### Champ `status` (sync_history)
```
'success'   → Synchronisation réussie
'conflict'  → Conflit détecté et résolu selon la règle configurée
'error'     → Erreur technique lors de la synchronisation
```

---

## 4. Migrations par version

### Structure des fichiers de migration

```
database/migrations/
├── 001_mvp_init.sql         → Tables MVP (boards → settings)
├── 002_v1_1_voice.sql       → Table voice_history
├── 003_v2_0_messaging.sql   → Table email_links
├── 004_v2_2_calendar.sql    → Tables calendar_filters + calendar_events_cache
└── 005_v3_0_sync.sql        → Tables tag_mapping + sync_history
```

### Appliquer les migrations

```bash
# Appliquer toutes les migrations en attente
npm run db:migrate

# Vérifier l'état des migrations
npm run db:migrate:status

# Annuler la dernière migration
npm run db:migrate:rollback
```

---

*D-ProjeT — Schéma BDD Complet — 23 février 2026*
