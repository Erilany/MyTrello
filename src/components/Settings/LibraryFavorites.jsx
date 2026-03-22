import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const FAVORITES_KEY = 'mytrello_library_favorites';

function LibraryFavorites() {
  const { libraryItems } = useApp();
  const [favorites, setFavorites] = useState({ cards: [], categories: [], subcategories: [] });
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const newFormat = {
            cards: parsed,
            categories: [],
            subcategories: [],
          };
          setFavorites(newFormat);
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFormat));
        } else {
          setFavorites(parsed);
        }
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleLibraryUpdate = () => {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFavorites(parsed);
        } catch (e) {
          console.error('Error reloading favorites:', e);
        }
      }
    };

    window.addEventListener('library-updated', handleLibraryUpdate);
    window.addEventListener('library-refreshed', handleLibraryUpdate);
    window.addEventListener('library-favorites-updated', handleLibraryUpdate);

    return () => {
      window.removeEventListener('library-updated', handleLibraryUpdate);
      window.removeEventListener('library-refreshed', handleLibraryUpdate);
      window.removeEventListener('library-favorites-updated', handleLibraryUpdate);
    };
  }, []);

  const saveFavorites = newFavorites => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    window.dispatchEvent(new Event('library-favorites-updated'));
  };

  const removeFavorite = (type, item) => {
    if (!item) return;

    const itemId =
      type === 'card' ? item.id : type === 'category' ? item.categoryId : item.subcategoryId;
    const itemTitle = item.title;

    const checkExistsInLibrary = () => {
      if (type === 'card') {
        return libraryItems.some(i => i.type === 'card' && i.id === item.id);
      } else if (type === 'category') {
        return libraryItems.some(i => i.type === 'category' && i.id === item.categoryId);
      } else {
        return libraryItems.some(i => i.type === 'subcategory' && i.id === item.subcategoryId);
      }
    };

    const existsInLibrary = checkExistsInLibrary();

    if (existsInLibrary) {
      if (
        !window.confirm(
          `Êtes-vous sûr de vouloir supprimer "${itemTitle}" des favoris ?\n\nCet élément existe toujours dans le Modèle Bibliothèque. Cette action ne le supprimera pas du Modèle Bibliothèque.`
        )
      ) {
        return;
      }
    }

    const newFavorites = {
      cards: favorites.cards || [],
      categories: favorites.categories || [],
      subcategories: favorites.subcategories || [],
    };

    if (type === 'card') {
      newFavorites.cards = newFavorites.cards.filter(id => id !== item.id);
      newFavorites.categories = newFavorites.categories.filter(c => c.cardId !== item.id);
      newFavorites.subcategories = newFavorites.subcategories.filter(s => s.cardId !== item.id);
    } else if (type === 'category') {
      newFavorites.categories = newFavorites.categories.filter(
        c => c.cardId !== item.cardId || c.title !== item.title
      );
      newFavorites.subcategories = newFavorites.subcategories.filter(
        s => s.cardId !== item.cardId || s.categoryTitle !== item.title
      );
      const remainingCats = newFavorites.categories.filter(c => c.cardId === item.cardId);
      if (remainingCats.length === 0) {
        newFavorites.cards = newFavorites.cards.filter(id => id !== item.cardId);
      }
    } else if (type === 'subcategory') {
      newFavorites.subcategories = newFavorites.subcategories.filter(
        s =>
          s.cardId !== item.cardId ||
          s.categoryTitle !== item.categoryTitle ||
          s.title !== item.title
      );
      const remainingSubs = newFavorites.subcategories.filter(
        s => s.cardId === item.cardId && s.categoryTitle === item.categoryTitle
      );
      if (remainingSubs.length === 0) {
        newFavorites.categories = newFavorites.categories.filter(
          c => c.cardId !== item.cardId || c.title !== item.categoryTitle
        );
        const remainingCats = newFavorites.categories.filter(c => c.cardId === item.cardId);
        if (remainingCats.length === 0) {
          newFavorites.cards = newFavorites.cards.filter(id => id !== item.cardId);
        }
      }
    }

    saveFavorites(newFavorites);
    setDeleteConfirm(null);
  };

  const expandAll = () => {
    const chapters = {};
    const cards = {};
    const categories = {};

    const getItemChapter = item => {
      if (item.type === 'subcategory') {
        const parentCategory = libraryItems.find(
          c => c.type === 'category' && c.title === item.title && c.tags === item.tags
        );
        if (parentCategory) {
          const parentCard = libraryItems.find(
            p =>
              p.type === 'card' &&
              p.title === parentCategory.title &&
              p.tags === parentCategory.tags
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

    libraryItems.forEach(item => {
      const chapter = getItemChapter(item);
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

    setExpandedChapters(chapters);
    setExpandedCards(cards);
    setExpandedCategories(categories);
  };

  const collapseAll = () => {
    setExpandedChapters({});
    setExpandedCards({});
    setExpandedCategories({});
  };

  const toggleCardFavorite = (cardId, _cardTitle) => {
    const existingCards = [...new Set(favorites?.cards || [])];
    const existingCategories = [...(favorites?.categories || [])];
    const existingSubcategories = [...(favorites?.subcategories || [])];

    const newFavorites = {
      cards: [...existingCards],
      categories: [...existingCategories],
      subcategories: [...existingSubcategories],
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
    const existingCards = [...new Set(favorites?.cards || [])];
    const existingCategories = [...(favorites?.categories || [])];
    const existingSubcategories = [...(favorites?.subcategories || [])];

    const newFavorites = {
      cards: existingCards,
      categories: [
        ...(new Set(existingCategories.map(c => `${c.cardId}_${c.title}`)).size ===
        existingCategories.length
          ? existingCategories
          : existingCategories.filter(
              (c, i, arr) => arr.findIndex(x => x.cardId === c.cardId && x.title === c.title) === i
            )),
      ],
      subcategories: existingSubcategories,
    };

    const catExists = newFavorites.categories.some(
      c => c.cardId === cardId && c.title === categoryTitle
    );

    if (catExists) {
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
          const subExists = newFavorites.subcategories.some(
            s => s.cardId === cardId && s.categoryTitle === categoryTitle && s.title === sub.title
          );
          if (!subExists) {
            newFavorites.subcategories.push({
              cardId,
              cardTitle,
              categoryTitle,
              title: sub.title,
            });
          }
        });
      }
    }
    saveFavorites(newFavorites);
  };

  const toggleSubcategoryFavorite = (cardId, cardTitle, categoryTitle, subcategoryTitle) => {
    const existingCards = [...new Set(favorites?.cards || [])];
    const existingCategories = [...(favorites?.categories || [])];
    const existingSubcategories = [...(favorites?.subcategories || [])];

    const newFavorites = {
      cards: existingCards,
      categories: existingCategories,
      subcategories: existingSubcategories,
    };

    const subKey = `${cardId}_${categoryTitle}_${subcategoryTitle}`;
    const subExists = newFavorites.subcategories.some(
      s => s.cardId === cardId && s.categoryTitle === categoryTitle && s.title === subcategoryTitle
    );

    if (subExists) {
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
      newFavorites.subcategories.push({
        cardId,
        cardTitle,
        categoryTitle,
        title: subcategoryTitle,
      });
      if (!newFavorites.cards.includes(cardId)) {
        newFavorites.cards.push(cardId);
      }
      if (!newFavorites.categories.some(c => c.cardId === cardId && c.title === categoryTitle)) {
        newFavorites.categories.push({ cardId, cardTitle, title: categoryTitle });
      }
    }
    saveFavorites(newFavorites);
  };

  const isCardFavorite = cardId => favorites?.cards?.includes(cardId) || false;
  const isCategoryFavorite = (cardId, categoryTitle) =>
    favorites?.categories?.some(c => c.cardId === cardId && c.title === categoryTitle) || false;
  const isSubcategoryFavorite = (cardId, categoryTitle, subcategoryTitle) =>
    favorites?.subcategories?.some(
      s => s.cardId === cardId && s.categoryTitle === categoryTitle && s.title === subcategoryTitle
    ) || false;

  const toggleChapter = chapter => {
    setExpandedChapters(prev => ({ ...prev, [chapter]: !prev[chapter] }));
  };

  const toggleCard = cardId => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const toggleCategory = catKey => {
    setExpandedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const getCardCategories = cardItem => {
    if (!cardItem || !cardItem.content_json) return [];
    try {
      const content = JSON.parse(cardItem.content_json);
      return content.categories || [];
    } catch {
      return [];
    }
  };

  const getItemChapter = item => {
    if (item.type === 'subcategory') {
      const parentCategory = libraryItems.find(
        c => c.type === 'category' && c.title === item.title && c.tags === item.tags
      );
      if (parentCategory) {
        const parentCard = libraryItems.find(
          p =>
            p.type === 'card' && p.title === parentCategory.title && p.tags === parentCategory.tags
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

  const groupedItems = libraryItems.reduce((acc, item) => {
    const chapter = getItemChapter(item);
    if (!acc[chapter]) {
      acc[chapter] = [];
    }
    acc[chapter].push(item);
    return acc;
  }, {});

  const filteredChapters = Object.keys(groupedItems).reduce((acc, chapter) => {
    const items = groupedItems[chapter].filter(item => {
      if (!search) return true;
      const searchLower = search.toLowerCase();

      if (item.title?.toLowerCase().includes(searchLower)) return true;
      if (item.tags?.toLowerCase().includes(searchLower)) return true;

      const categories = getCardCategories(item);
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

  const totalFavorites =
    (favorites.cards?.length || 0) +
    (favorites.categories?.length || 0) +
    (favorites.subcategories?.length || 0);
  const totalItems = libraryItems?.length || 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--txt-primary)]">Favoris Bibliothèque</h2>
          <span className="text-sm text-[var(--txt-muted)]">
            ({totalFavorites} éléments sélectionnés)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout déplier
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout replier
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--txt-primary)]"
          />
        </div>
      </div>

      <div className="text-sm text-[var(--txt-secondary)] mb-4">
        Cochez les cartes, actions et tâches que vous souhaitez voir dans la page Bibliothèque.
        Cocher une tâche sélectionne automatiquement sa carte et son action.
      </div>

      <div className="flex-1 overflow-auto">
        {Object.entries(filteredChapters).map(([chapter, items]) => (
          <div key={chapter} className="mb-2">
            <button
              onClick={() => toggleChapter(chapter)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left bg-[var(--bg-card-hover)] rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              {expandedChapters[chapter] ? (
                <ChevronDown size={16} className="text-[var(--txt-secondary)]" />
              ) : (
                <ChevronRight size={16} className="text-[var(--txt-secondary)]" />
              )}
              <span className="font-medium text-[var(--txt-primary)]">{chapter}</span>
              <span className="text-xs text-[var(--txt-muted)]">({items.length})</span>
              {items.some(item => isCardFavorite(item.id)) && (
                <Star size={14} className="ml-auto text-[var(--accent)]" fill="currentColor" />
              )}
            </button>

            {expandedChapters[chapter] && (
              <div className="ml-4 mt-1 space-y-1">
                {items.map(item => {
                  const categories = getCardCategories(item);
                  const cardKey = `${item.id}`;

                  return (
                    <div key={item.id} className="ml-2">
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                          isCardFavorite(item.id)
                            ? 'bg-[var(--accent-soft)]'
                            : 'hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isCardFavorite(item.id)
                              ? 'bg-[var(--accent)] border-[var(--accent)]'
                              : 'border-[var(--border)]'
                          }`}
                          onClick={() => toggleCardFavorite(item.id, item.title)}
                        >
                          {isCardFavorite(item.id) && <Check size={12} className="text-white" />}
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleCard(cardKey);
                          }}
                          className="flex items-center gap-1 flex-1 text-left cursor-pointer"
                        >
                          {expandedCards[cardKey] ? (
                            <ChevronDown size={14} className="text-[var(--txt-secondary)]" />
                          ) : (
                            <ChevronRight size={14} className="text-[var(--txt-secondary)]" />
                          )}
                          <span className="text-sm font-medium text-[var(--txt-primary)]">
                            {item.title}
                          </span>
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteConfirm({ type: 'card', item });
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Supprimer des favoris"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {expandedCards[cardKey] &&
                        categories.map(cat => {
                          const catKey = `${item.id}_${cat.title}`;

                          return (
                            <div key={catKey} className="ml-6">
                              <div
                                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                                  isCategoryFavorite(item.id, cat.title)
                                    ? 'bg-[var(--done-soft)]'
                                    : 'hover:bg-[var(--bg-card-hover)]'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                                    isCategoryFavorite(item.id, cat.title)
                                      ? 'bg-[var(--done)] border-[var(--done)]'
                                      : 'border-[var(--border)]'
                                  }`}
                                  onClick={() =>
                                    toggleCategoryFavorite(
                                      item.id,
                                      item.title,
                                      cat.title,
                                      cat.subcategories || []
                                    )
                                  }
                                >
                                  {isCategoryFavorite(item.id, cat.title) && (
                                    <Check size={10} className="text-white" />
                                  )}
                                </div>
                                {(cat.subcategories || []).length > 0 ? (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      toggleCategory(catKey);
                                    }}
                                    className="flex items-center gap-1 flex-1 text-left cursor-pointer"
                                  >
                                    {expandedCategories[catKey] ? (
                                      <ChevronDown
                                        size={14}
                                        className="text-[var(--txt-secondary)]"
                                      />
                                    ) : (
                                      <ChevronRight
                                        size={14}
                                        className="text-[var(--txt-secondary)]"
                                      />
                                    )}
                                    <span className="text-sm text-[var(--txt-primary)]">
                                      {cat.title}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-sm text-[var(--txt-primary)]">
                                    {cat.title}
                                  </span>
                                )}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setDeleteConfirm({
                                      type: 'category',
                                      item: {
                                        cardId: item.id,
                                        cardTitle: item.title,
                                        categoryId: cat.id,
                                        title: cat.title,
                                      },
                                    });
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded ml-auto"
                                  title="Supprimer des favoris"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {expandedCategories[catKey] &&
                                (cat.subcategories || []).map(sub => (
                                  <div
                                    key={sub.title}
                                    className={`flex items-center gap-2 px-3 py-2 ml-6 rounded transition-colors ${
                                      isSubcategoryFavorite(item.id, cat.title, sub.title)
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                        : 'hover:bg-[var(--bg-card-hover)]'
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                                        isSubcategoryFavorite(item.id, cat.title, sub.title)
                                          ? 'bg-yellow-500 border-yellow-500'
                                          : 'border-[var(--border)]'
                                      }`}
                                      onClick={() =>
                                        toggleSubcategoryFavorite(
                                          item.id,
                                          item.title,
                                          cat.title,
                                          sub.title
                                        )
                                      }
                                    >
                                      {isSubcategoryFavorite(item.id, cat.title, sub.title) && (
                                        <Check size={10} className="text-white" />
                                      )}
                                    </div>
                                    <span className="text-sm text-[var(--txt-primary)] flex-1">
                                      {sub.title}
                                    </span>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        setDeleteConfirm({
                                          type: 'subcategory',
                                          item: {
                                            cardId: item.id,
                                            cardTitle: item.title,
                                            categoryTitle: cat.title,
                                            subcategoryId: sub.id,
                                            title: sub.title,
                                          },
                                        });
                                      }}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                      title="Supprimer des favoris"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filteredChapters).length === 0 && (
          <div className="text-center py-8 text-[var(--txt-muted)]">Aucun élément trouvé</div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-yellow-500" />
              <h3 className="text-lg font-semibold text-[var(--txt-primary)]">
                Confirmer la suppression
              </h3>
            </div>
            <p className="text-[var(--txt-secondary)] mb-6">
              Voulez-vous vraiment supprimer "{deleteConfirm.item.title}" des favoris ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm bg-[var(--bg-card-hover)] hover:bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
              >
                Annuler
              </button>
              <button
                onClick={() => removeFavorite(deleteConfirm.type, deleteConfirm.item)}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryFavorites;
