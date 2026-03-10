import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Copy, Search } from 'lucide-react';

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

  useEffect(() => {
    loadLibrary();
  }, []);

  const filteredItems = libraryItems.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = id => {
    if (window.confirm('Voulez-vous vraiment supprimer ce modèle ?')) {
      deleteLibraryItem(id);
    }
  };

  const handleUseTemplate = item => {
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Bibliothèque de modèles
        </h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un modèle..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les types</option>
          <option value="card">Cartes</option>
          <option value="category">Catégories</option>
          <option value="subcategory">Sous-catégories</option>
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Aucun modèle trouvé</p>
          <p className="text-sm mt-2">
            Sauvegardez des cartes, catégories ou sous-catégories depuis le projet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
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
          ))}
        </div>
      )}
    </div>
  );
}

export default Library;
