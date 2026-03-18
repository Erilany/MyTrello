import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Copy, Search, Star } from 'lucide-react';

function Library() {
  const {
    libraryItems,
    loadLibrary,
    deleteLibraryItem,
    loadBoard,
    currentBoard,
    categories,
    subcategories,
    createCard,
    createCategory,
    createSubcategory,
    columns,
  } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState({ cards: [], categories: [], subcategories: [] });

  useEffect(() => {
    loadLibrary();
    const stored = localStorage.getItem('mytrello_library_favorites');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  const isItemFavorite = itemId => {
    return favorites.cards.some(id => String(id) === String(itemId));
  };

  const toggleFavorite = (itemId, e) => {
    e.stopPropagation();
    const newFavorites = { ...favorites };
    const idx = newFavorites.cards.indexOf(String(itemId));
    if (idx > -1) {
      newFavorites.cards.splice(idx, 1);
    } else {
      newFavorites.cards.push(String(itemId));
    }
    setFavorites(newFavorites);
    localStorage.setItem('mytrello_library_favorites', JSON.stringify(newFavorites));
    window.dispatchEvent(new Event('library-favorites-updated'));
  };

  const cardItems = libraryItems.filter(item => item.type === 'card');
  const categoryItems = libraryItems.filter(item => item.type === 'category');
  const subcategoryItems = libraryItems.filter(item => item.type === 'subcategory');

  const filterItems = items => {
    return items.filter(item => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'favorites' ? isItemFavorite(item.id) : item.type === filter);
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  };

  const filteredCards = filterItems(cardItems);
  const filteredCategories = filterItems(categoryItems);
  const filteredSubcategories = filterItems(subcategoryItems);

  const handleDelete = id => {
    if (window.confirm('Voulez-vous vraiment supprimer ce modèle ?')) {
      deleteLibraryItem(id);
    }
  };

  const handleUseTemplate = item => {
    if (!item.content_json) {
      alert('Cet élément ne peut pas être utilisé');
      return;
    }

    try {
      const content = JSON.parse(item.content_json);
      const boardColumns = columns.filter(c => c.board_id === currentBoard?.id);
      const firstColumn = boardColumns.length > 0 ? boardColumns[0] : null;

      if (!firstColumn) {
        alert('Aucune colonne disponible dans ce projet');
        return;
      }

      if (item.type === 'card' && content.card) {
        createCard(
          firstColumn.id,
          content.card.title,
          content.card.description || '',
          content.card.priority || 'normal',
          content.card.due_date || null,
          content.card.assignee || ''
        ).then(cardId => {
          if (cardId && content.categories) {
            content.categories.forEach((cat, catIndex) => {
              createCategory(
                cardId,
                cat.title,
                cat.description || '',
                cat.priority || 'normal',
                cat.due_date || null,
                cat.assignee || ''
              ).then(categoryId => {
                if (categoryId && cat.subcategories) {
                  cat.subcategories.forEach((subcat, subIndex) => {
                    createSubcategory(
                      categoryId,
                      subcat.title,
                      subcat.description || '',
                      subcat.priority || 'normal',
                      subcat.due_date || null,
                      subcat.assignee || ''
                    );
                  });
                }
              });
            });
          }
          if (currentBoard) {
            loadBoard(currentBoard.id);
          }
        });
        alert('Modèle utilisé avec succès !');
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert("Erreur lors de l'utilisation du modèle");
    }
  };

  const typeLabels = {
    card: 'Carte',
    category: 'Catégorie',
    subcategory: 'Sous-catégorie',
  };

  const renderItem = (item, type) => (
    <div
      key={item.id}
      className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            {typeLabels[item.type] || item.type}
          </span>
          <h3 className="font-medium text-gray-800 dark:text-white mt-2">{item.title}</h3>
        </div>
        <button
          onClick={e => toggleFavorite(item.id, e)}
          className={`p-1 rounded ${isItemFavorite(item.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
        >
          <Star size={16} className={isItemFavorite(item.id) ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => handleUseTemplate(item)}
          disabled={item.type !== 'card'}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Copy size={14} className="mr-1" />
          Utiliser
        </button>
        <button
          onClick={() => handleDelete(item.id)}
          className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 size={14} className="mr-1" />
          Supprimer
        </button>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}
      </p>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Bibliothèque de modèles
        </h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('favorites')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === 'favorites'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Star size={16} className={filter === 'favorites' ? 'fill-current' : ''} />
          Favoris
        </button>
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        <div className="flex flex-col overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Cartes ({filteredCards.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredCards.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune carte</p>
            ) : (
              filteredCards.map(item => renderItem(item, 'card'))
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Catégories ({filteredCategories.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredCategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune catégorie</p>
            ) : (
              filteredCategories.map(item => renderItem(item, 'category'))
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Sous-catégories ({filteredSubcategories.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredSubcategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune sous-catégorie</p>
            ) : (
              filteredSubcategories.map(item => renderItem(item, 'subcategory'))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Library;
