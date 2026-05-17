export function normalizeChapter(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/s$/, '')
    .replace(/procèssus/gi, 'processus')
    .replace(/proccessus/gi, 'processus')
    .trim();
}

export function isSpacer(item) {
  return typeof item === 'string' && item.startsWith('__spacer_');
}

export function fallbackToBat(folderPath) {
  const batContent = `@echo off\nstart explorer "${folderPath}"`;
  const blob = new Blob([batContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'open_folder.bat';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper: Find library item by library_item_id (handles both numeric IDs and UUIDs)
// library_item_id should be the tree node UUID, but libraryItems may have numeric IDs
function findLibraryItem(libraryItems, libraryItemId) {
  if (!libraryItemId || !libraryItems || !Array.isArray(libraryItems)) return null;
  const strId = String(libraryItemId);

  // If it's a UUID (contains dashes), match on treeNodeId first
  if (strId.includes('-')) {
    const item = libraryItems.find(item => String(item.treeNodeId) === strId);
    if (item) return item;
  }

  // Otherwise try direct match on id (handles numeric IDs)
  return libraryItems.find(item => String(item.id) === strId);
}

export function getCardSkipAction(card, libraryItems) {
  if (!card) {
    return false;
  }

  if (card.skip_action !== undefined) {
    return card.skip_action;
  }

  if (card.library_item_id && libraryItems) {
    const libraryCard = findLibraryItem(libraryItems, card.library_item_id);
    if (libraryCard && libraryCard.content_json) {
      try {
        const content = JSON.parse(libraryCard.content_json);
        const skipAction = content.card?.skipAction || false;
        return skipAction;
      } catch (e) {
        console.error(
          '[boardUtils] getCardSkipAction: error parsing content_json for library_item_id',
          e
        );
      }
    }
  }

  if (!libraryItems || !Array.isArray(libraryItems)) {
    return false;
  }

  const cardTitle = normalizeString(card.title);
  const libraryCard = libraryItems.find(
    item => item.type === 'card' && normalizeString(item.title) === cardTitle
  );

  if (!libraryCard) {
    return false;
  }

  if (!libraryCard.content_json) {
    return false;
  }

  try {
    const content = JSON.parse(libraryCard.content_json);
    const skipAction = content.card?.skipAction || false;
    return skipAction;
  } catch (e) {
    console.error('[boardUtils] getCardSkipAction: error parsing content_json', e);
    return false;
  }
}

export function getCardTasks(card, libraryItems) {
  if (!card || !libraryItems || !Array.isArray(libraryItems)) return [];

  let libraryCard = null;

  if (card.library_item_id) {
    libraryCard = findLibraryItem(libraryItems, card.library_item_id);
  }

  if (!libraryCard) {
    const cardTitle = normalizeString(card.title);
    libraryCard = libraryItems.find(
      item => item.type === 'card' && normalizeString(item.title) === cardTitle
    );
  }

  if (!libraryCard || !libraryCard.content_json) return [];
  try {
    const content = JSON.parse(libraryCard.content_json);
    const tasks = [];
    (content.categories || []).forEach(cat => {
      (cat.subcategories || []).forEach(sub => {
        tasks.push({ ...sub, categoryTitle: cat.title });
      });
    });
    return tasks;
  } catch {
    return [];
  }
}

export function getLibraryCardForProjectCard(card, libraryItems) {
  if (!card || !libraryItems || !Array.isArray(libraryItems)) return null;
  const cardTitle = normalizeString(card.title);
  return libraryItems.find(
    item => item.type === 'card' && normalizeString(item.title) === cardTitle
  );
}
