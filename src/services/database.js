const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function getDbPath() {
  const dbPath = process.env.DB_PATH || './database/mytrello.db';
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }
  // Use app.getAppPath() for Electron, or __dirname for dev
  const basePath = process.resourcesPath || path.join(__dirname, '..', '..');
  return path.join(basePath, dbPath);
}

function initDatabase() {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);
  
  console.log('DB Path:', dbPath);
  console.log('DB Dir:', dbDir);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Find schema.sql - check multiple locations
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'database', 'schema.sql'),
    path.join(process.cwd(), 'database', 'schema.sql'),
    path.join(__dirname, 'database', 'schema.sql')
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
  
  db.exec(schema);

  insertDefaultData();

  return db;
}

function insertDefaultData() {
  const boardCount = db.prepare('SELECT COUNT(*) as count FROM boards').get();
  
  if (boardCount.count === 0) {
    const insertBoard = db.prepare('INSERT INTO boards (title, description) VALUES (?, ?)');
    const result = insertBoard.run('Mon Premier Projet', 'Projet par défaut');
    const boardId = result.lastInsertRowid;

    const insertColumn = db.prepare('INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)');
    insertColumn.run(boardId, 'À faire', 0, '#4A90D9');
    insertColumn.run(boardId, 'En cours', 1, '#F5A623');
    insertColumn.run(boardId, 'Terminé', 2, '#7ED321');

    console.log('Default board created with ID:', boardId);
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
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
