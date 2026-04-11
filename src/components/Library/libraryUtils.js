export {
  getCardCategories,
  getCardSkipAction,
  getCardSubcategories,
} from '../Settings/favoritesUtils';

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
