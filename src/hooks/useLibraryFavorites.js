import { useState, useEffect } from 'react';

export function useLibraryFavorites() {
  const [favorites, setFavorites] = useState({ cards: [], categories: [], subcategories: [] });
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem('c-projets_library_favorites');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites({ cards: parsed, categories: [], subcategories: [] });
        } else {
          setFavorites(parsed);
        }
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleFavoritesUpdate = () => {
      const stored = localStorage.getItem('c-projets_library_favorites');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites({ cards: parsed, categories: [], subcategories: [] });
          } else {
            setFavorites(parsed);
          }
        } catch (e) {
          console.error('Error reloading favorites:', e);
        }
      }
    };
    window.addEventListener('library-favorites-updated', handleFavoritesUpdate);
    return () => window.removeEventListener('library-favorites-updated', handleFavoritesUpdate);
  }, []);

  const saveFavorites = newFavorites => {
    setFavorites(newFavorites);
    localStorage.setItem('c-projets_library_favorites', JSON.stringify(newFavorites));
    window.dispatchEvent(new Event('library-favorites-updated'));
  };

  const toggleCardFavorite = cardId => {
    const newFavorites = {
      cards: favorites?.cards || [],
      categories: favorites?.categories || [],
      subcategories: favorites?.subcategories || [],
    };
    if (newFavorites.cards.includes(cardId)) {
      newFavorites.cards = newFavorites.cards.filter(id => id !== cardId);
      newFavorites.categories = newFavorites.categories.filter(
        c => !c.cardId || c.cardId !== cardId
      );
      newFavorites.subcategories = newFavorites.subcategories.filter(
        s => !s.cardId || s.cardId !== cardId
      );
    } else {
      newFavorites.cards.push(cardId);
    }
    saveFavorites(newFavorites);
  };

  const toggleCategoryFavorite = (cardId, cardTitle, categoryTitle, subcategoriesList = []) => {
    const newFavorites = { ...favorites };
    const isCurrentlyFavorite = newFavorites.categories.some(
      c => c.cardId === cardId && c.title === categoryTitle
    );

    if (isCurrentlyFavorite) {
      newFavorites.categories = newFavorites.categories.filter(
        c => !(c.cardId === cardId && c.title === categoryTitle)
      );
      newFavorites.subcategories = newFavorites.subcategories.filter(
        s => !(s.cardId === cardId && s.categoryTitle === categoryTitle)
      );
      const remainingCatsForCard = newFavorites.categories.filter(c => c.cardId === cardId);
      if (remainingCatsForCard.length === 0) {
        newFavorites.cards = newFavorites.cards.filter(id => id !== cardId);
      }
    } else {
      newFavorites.categories.push({ cardId, cardTitle, title: categoryTitle });
      if (!newFavorites.cards.includes(cardId)) {
        newFavorites.cards.push(cardId);
      }
      if (subcategoriesList && subcategoriesList.length > 0) {
        subcategoriesList.forEach(sub => {
          if (
            !newFavorites.subcategories.find(
              s => s.cardId === cardId && s.categoryTitle === categoryTitle && s.title === sub.title
            )
          ) {
            newFavorites.subcategories.push({ cardId, cardTitle, categoryTitle, title: sub.title });
          }
        });
      }
    }
    saveFavorites(newFavorites);
  };

  const toggleSubcategoryFavorite = (cardId, cardTitle, categoryTitle, subcategoryTitle) => {
    const newFavorites = { ...favorites };

    if (
      newFavorites.subcategories.find(
        s =>
          s.cardId === cardId && s.categoryTitle === categoryTitle && s.title === subcategoryTitle
      )
    ) {
      newFavorites.subcategories = newFavorites.subcategories.filter(
        s =>
          !(
            s.cardId === cardId &&
            s.categoryTitle === categoryTitle &&
            s.title === subcategoryTitle
          )
      );
      const remainingSubcatsForCategory = newFavorites.subcategories.filter(
        s => s.cardId === cardId && s.categoryTitle === categoryTitle
      );
      if (remainingSubcatsForCategory.length === 0) {
        newFavorites.categories = newFavorites.categories.filter(
          c => !(c.cardId === cardId && c.title === categoryTitle)
        );
        const remainingCatsForCard = newFavorites.categories.filter(c => c.cardId === cardId);
        if (remainingCatsForCard.length === 0) {
          newFavorites.cards = newFavorites.cards.filter(id => id !== cardId);
        }
      }
    } else {
      newFavorites.subcategories.push({ cardId, cardTitle, categoryTitle, title: subcategoryTitle });
      if (!newFavorites.cards.includes(cardId)) {
        newFavorites.cards.push(cardId);
      }
      if (!newFavorites.categories.find(c => c.cardId === cardId && c.title === categoryTitle)) {
        newFavorites.categories.push({ cardId, cardTitle, title: categoryTitle });
      }
    }
    saveFavorites(newFavorites);
  };

  const toggleCardExpanded = cardId => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const toggleCategoryExpanded = catKey => {
    setExpandedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const isCardFavorite = cardId => {
    if (!favorites || !favorites.cards) return false;
    return favorites.cards.some(id => String(id) === String(cardId));
  };

  const isCategoryFavorite = (cardId, categoryTitle) => {
    if (!favorites || !favorites.categories) return false;
    return favorites.categories.some(
      c => String(c.cardId) === String(cardId) && c.title === categoryTitle
    );
  };

  const isSubcategoryFavorite = (cardId, categoryTitle, subcategoryTitle) => {
    if (!favorites || !favorites.subcategories) return false;
    return favorites.subcategories.some(
      s =>
        String(s.cardId) === String(cardId) &&
        s.categoryTitle === categoryTitle &&
        s.title === subcategoryTitle
    );
  };

  const isSubcategoryFavoriteSimple = (cardId, subcategoryTitle) => {
    if (!favorites || !favorites.subcategories) return false;
    return favorites.subcategories.some(
      s => String(s.cardId) === String(cardId) && s.title === subcategoryTitle
    );
  };

  return {
    favorites,
    expandedCards,
    expandedCategories,
    saveFavorites,
    toggleCardFavorite,
    toggleCategoryFavorite,
    toggleSubcategoryFavorite,
    toggleCardExpanded,
    toggleCategoryExpanded,
    isCardFavorite,
    isCategoryFavorite,
    isSubcategoryFavorite,
    isSubcategoryFavoriteSimple,
  };
}
