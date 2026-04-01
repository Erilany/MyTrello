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

function deduplicateLibraryEditor(treeData) {
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
    localStorage.setItem('c-projets_library_favorites', JSON.stringify(backup.libraryFavorites));
    console.log('[BackupLoader] Saved libraryFavorites to localStorage');
  }
  
  if (backup.databases?.library) {
    const cleanLibraryEditor = deduplicateLibraryEditor(backup.databases.library);
    localStorage.setItem('c-projets_library_editor', JSON.stringify(cleanLibraryEditor));
    console.log('[BackupLoader] Saved library editor to localStorage, count:', backup.databases.library.length);
  } else if (backup.databases?.params?.library) {
    const cleanLibraryEditor = deduplicateLibraryEditor(backup.databases.params.library);
    localStorage.setItem('c-projets_library_editor', JSON.stringify(cleanLibraryEditor));
    console.log('[BackupLoader] Saved library editor from params to localStorage');
  }
  
  return data;
}

function deduplicateLibraryEditor(treeData) {
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
}

module.exports = {
  findBackupFile,
  loadBackupFromFile,
  convertBackupToAppData,
};
