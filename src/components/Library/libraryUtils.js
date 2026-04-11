export function getCardCategories(cardItem) {
  if (!cardItem || !cardItem.content_json) return [];
  try {
    const content = JSON.parse(cardItem.content_json);
    return content.categories || [];
  } catch {
    return [];
  }
}

export function getCardSkipAction(cardItem) {
  if (!cardItem || !cardItem.content_json) return false;
  try {
    const content = JSON.parse(cardItem.content_json);
    return content.card?.skipAction || false;
  } catch {
    return false;
  }
}

export function getCardSubcategories(cardItem) {
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
}

export function getCategorySubcategories(category) {
  if (!category) return [];
  return category.subcategories || [];
}

export function parseLibraryItemContent(item) {
  if (!item || !item.content_json) {
    return { card: {}, categories: [] };
  }
  try {
    return JSON.parse(item.content_json);
  } catch {
    return { card: {}, categories: [] };
  }
}
