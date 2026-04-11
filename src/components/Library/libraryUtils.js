export {
  getCardCategories,
  getCardSkipAction,
  getCardSubcategories,
} from '../Settings/favoritesUtils';

export function getCategorySubcategories(category) {
  if (!category) return [];
  return category.subcategories || [];
}
