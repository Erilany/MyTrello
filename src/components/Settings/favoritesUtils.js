export const FAVORITES_KEY = 'c-projets_library_favorites';

// Helper: Find library item by ID (handles both numeric IDs and UUIDs)
// library_item_id should be the tree node UUID, but libraryItems may have numeric IDs
export const findLibraryItemById = (libraryItems, id) => {
  if (!id || !libraryItems || !Array.isArray(libraryItems)) return null;
  const strId = String(id);

  // If it's a UUID (contains dashes), match on treeNodeId first
  if (strId.includes('-')) {
    const item = libraryItems.find(item => String(item.treeNodeId) === strId);
    if (item) return item;
  }

  // Fallback: try direct match on id (handles numeric IDs)
  return libraryItems.find(item => String(item.id) === strId);
};

export const getCardCategories = cardItem => {
  if (!cardItem || !cardItem.content_json) return [];
  try {
    const content = JSON.parse(cardItem.content_json);
    return content.categories || [];
  } catch {
    return [];
  }
};

export const getCardSkipAction = cardItem => {
  if (!cardItem || !cardItem.content_json) return false;
  try {
    const content = JSON.parse(cardItem.content_json);
    return content.card?.skipAction || false;
  } catch {
    return false;
  }
};

export const getSubcategoryTagFromLibrary = (libraryItemId, libraryItems) => {
  if (!libraryItemId || !libraryItems) return null;
  const libraryItem = findLibraryItemById(libraryItems, libraryItemId);
  if (!libraryItem) return null;
  // If tags contains a card name, it's the parent card - return it as the display name
  if (libraryItem.tags) {
    return libraryItem.tags;
  }
  if (!libraryItem.content_json) return null;
  try {
    const content = JSON.parse(libraryItem.content_json);
    if (content.subcategory?.tag) return content.subcategory.tag;
    if (content.category?.tag) return content.category.tag;
    return null;
  } catch {
    return null;
  }
};

// Get the dynamic name for a library item from its ID
// Always returns item.title - this is the card name that updates dynamically
// When user renames card in library, title changes and project items reflect it
export const getLibraryItemTitle = (libraryItemId, libraryItems) => {
  if (!libraryItemId || !libraryItems) {
    return null;
  }
  const item = findLibraryItemById(libraryItems, libraryItemId);
  if (!item) {
    return null;
  }
  return item.title || null;
};

// Get the parent card's title for a subcategory/category by following library_item_id
// This maintains a dynamic link - when user renames the card in library, it updates automatically
export const getParentCardTitle = (item, libraryItems) => {
  if (!item?.library_item_id || !libraryItems) return null;
  const parentCard = findLibraryItemById(libraryItems, item.library_item_id);
  return parentCard?.title || null;
};

// Get the systemTag for a subcategory from the library tree
// Follows library_item_id to find the subcategory in the library tree and get its systemTag
export const getSubcategorySystemTag = (subcategory, libraryItems) => {
  if (!subcategory?.library_item_id || !libraryItems) return null;

  // Find the subcategory in libraryItems using library_item_id
  const librarySub = findLibraryItemById(libraryItems, subcategory.library_item_id);
  if (librarySub?.systemTag) return librarySub.systemTag;

  // Fallback: try to get systemTag from the tree using the library_item_id (which should be a tree node UUID)
  try {
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (treeRaw) {
      const treeData = JSON.parse(treeRaw);
      const nodes = treeData.children || treeData;
      const treeNodeId = String(subcategory.library_item_id);

      const findTag = nodes => {
        for (const node of nodes) {
          if (node.id === treeNodeId && node.data?.systemTag) {
            return node.data.systemTag;
          }
          if (node.children && node.children.length > 0) {
            const found = findTag(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      return findTag(nodes);
    }
  } catch (e) {
    console.error('[getSubcategorySystemTag] Error:', e);
  }

  return null;
};

export const getCardSubcategories = cardItem => {
  const categories = getCardCategories(cardItem);
  const subcategories = [];
  categories.forEach(cat => {
    if (cat.subcategories) {
      cat.subcategories.forEach(subcat => {
        subcategories.push({ ...subcat, categoryTitle: cat.title });
      });
    }
  });
  return subcategories;
};

export const getItemChapter = (item, libraryItems) => {
  if (item.type === 'subcategory') {
    const parentCategory = libraryItems.find(
      c => c.type === 'category' && c.title === item.title && c.tags === item.tags
    );
    if (parentCategory) {
      const parentCard = libraryItems.find(
        p => p.type === 'card' && p.title === parentCategory.title && p.tags === parentCategory.tags
      );
      if (parentCard) {
        const tags = parentCard.tags ? parentCard.tags.split(',') : [];
        return tags[0] || 'Autre';
      }
    }
    const tags = item.tags ? item.tags.split(',') : [];
    return tags[0] || 'Autre';
  } else if (item.type === 'category') {
    const parentCard = libraryItems.find(
      c => c.type === 'card' && c.title === item.title && c.tags === item.tags
    );
    if (parentCard) {
      const tags = parentCard.tags ? parentCard.tags.split(',') : [];
      return tags[0] || 'Autre';
    }
    const tags = item.tags ? item.tags.split(',') : [];
    return tags[0] || 'Autre';
  } else {
    const tags = item.tags ? item.tags.split(',') : [];
    return tags[0] || 'Autre';
  }
};

export const groupItemsByChapter = (libraryItems, getItemChapterFn) => {
  return libraryItems.reduce((acc, item) => {
    const chapter = getItemChapterFn(item);
    if (!acc[chapter]) {
      acc[chapter] = [];
    }
    acc[chapter].push(item);
    return acc;
  }, {});
};

export const filterItemsBySearch = (groupedItems, search, getCardCategoriesFn) => {
  return Object.keys(groupedItems).reduce((acc, chapter) => {
    const items = groupedItems[chapter].filter(item => {
      if (!search) return true;
      const searchLower = search.toLowerCase();

      if (item.title?.toLowerCase().includes(searchLower)) return true;
      if (item.tags?.toLowerCase().includes(searchLower)) return true;

      const categories = getCardCategoriesFn(item);
      for (const cat of categories) {
        if (cat.title?.toLowerCase().includes(searchLower)) return true;
        for (const sub of cat.subcategories || []) {
          if (sub.title?.toLowerCase().includes(searchLower)) return true;
        }
      }
      return false;
    });
    if (items.length > 0) {
      acc[chapter] = items;
    }
    return acc;
  }, {});
};

export const expandAllChapters = (libraryItems, getItemChapterFn) => {
  const chapters = {};
  const cards = {};
  const categories = {};

  libraryItems.forEach(item => {
    const chapter = getItemChapterFn(item);
    chapters[chapter] = true;

    const cardKey = `${item.id}`;
    cards[cardKey] = true;

    try {
      const content = JSON.parse(item.content_json);
      (content.categories || []).forEach(cat => {
        const catKey = `${item.id}_${cat.title}`;
        categories[catKey] = true;
      });
    } catch {
      // ignore parse errors
    }
  });

  return { chapters, cards, categories };
};
