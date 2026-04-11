export const FAVORITES_KEY = 'c-projets_library_favorites';

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
