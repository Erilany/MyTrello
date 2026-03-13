const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;
let SQL = null;

function getDbPath() {
  const dbPath = process.env.DB_PATH || './database/mytrello.db';
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }
  return path.join(process.cwd(), dbPath);
}

async function initDatabase() {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  console.log('DB Path:', dbPath);
  console.log('DB Dir:', dbDir);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  const possiblePaths = [
    path.join(__dirname, '..', '..', 'database', 'schema.sql'),
    path.join(process.cwd(), 'database', 'schema.sql'),
    path.join(__dirname, 'database', 'schema.sql'),
  ];

  let schemaPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      schemaPath = p;
      break;
    }
  }

  if (!schemaPath) {
    throw new Error('schema.sql not found in any of: ' + possiblePaths.join(', '));
  }

  console.log('Schema path:', schemaPath);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.run(schema);

  const tableInfo = db.exec('PRAGMA table_info(library_items)');
  const existingColumns = tableInfo.length > 0 ? tableInfo[0].values.map(row => row[1]) : [];
  console.log('[DB MIGRATION] library_items existing columns:', existingColumns);

  if (!existingColumns.includes('tags')) {
    console.log('[DB MIGRATION] Adding tags column');
    db.run("ALTER TABLE library_items ADD COLUMN tags TEXT DEFAULT ''");
  }
  if (!existingColumns.includes('usage_count')) {
    console.log('[DB MIGRATION] Adding usage_count column');
    db.run('ALTER TABLE library_items ADD COLUMN usage_count INTEGER DEFAULT 0');
  }
  if (!existingColumns.includes('last_used')) {
    console.log('[DB MIGRATION] Adding last_used column');
    db.run('ALTER TABLE library_items ADD COLUMN last_used DATETIME');
  }

  const newTableInfo = db.exec('PRAGMA table_info(library_items)');
  console.log(
    '[DB MIGRATION] library_items new columns:',
    newTableInfo.length > 0 ? newTableInfo[0].values.map(row => row[1]) : []
  );

  insertDefaultData();
  saveDatabase();

  return db;
}

function saveDatabase() {
  if (!db) return;
  const dbPath = getDbPath();
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function insertDefaultData() {
  const result = db.exec('SELECT COUNT(*) as count FROM boards');
  const count = result.length > 0 ? result[0].values[0][0] : 0;

  if (count === 0) {
    db.run('INSERT INTO boards (title, description) VALUES (?, ?)', [
      'Mon Premier Projet',
      'Projet par défaut',
    ]);
    const lastId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

    db.run('INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)', [
      lastId,
      'À faire',
      0,
      '#4A90D9',
    ]);
    db.run('INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)', [
      lastId,
      'En cours',
      1,
      '#F5A623',
    ]);
    db.run('INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)', [
      lastId,
      'Terminé',
      2,
      '#7ED321',
    ]);

    console.log('Default board created with ID:', lastId);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  saveDatabase,
};
