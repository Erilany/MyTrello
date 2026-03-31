const fs = require('fs');
const path = require('path');

function findBackupFile(importsDir) {
  if (!fs.existsSync(importsDir)) {
    return null;
  }
  
  const files = fs.readdirSync(importsDir);
  const jsonFile = files.find(f => f.endsWith('.json'));
  
  if (!jsonFile) {
    return null;
  }
  
  return path.join(importsDir, jsonFile);
}

function loadBackupFromFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log('[BackupLoader] Loaded backup file:', path.basename(filePath));
    console.log('[BackupLoader] Version:', data.version);
    
    return data;
  } catch (e) {
    console.error('[BackupLoader] Error loading backup:', e);
    return null;
  }
}

function convertBackupToAppData(backup) {
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

module.exports = {
  findBackupFile,
  loadBackupFromFile,
  convertBackupToAppData,
};
