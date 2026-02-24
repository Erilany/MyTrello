import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, Copy, Search, X, GripVertical, Eye } from 'lucide-react';

function LibraryPanel() {
  const { 
    libraryItems, 
    loadLibrary, 
    deleteLibraryItem, 
    dbRun, 
    dbGet, 
    loadBoard, 
    currentBoard, 
    categories, 
    subcategories,
    libraryOpen,
    setLibraryOpen,
    boards,
    columns,
    loadBoards
  } = useApp();
  
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [previewItem, setPreviewItem] = useState(null);
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');

  useEffect(() => {
    if (libraryOpen) {
      loadLibrary();
      loadBoards();
    }
  }, [libraryOpen]);

  useEffect(() => {
    if (selectedBoardId) {
      loadBoard(parseInt(selectedBoardId));
    }
  }, [selectedBoardId]);

  const filteredItems = libraryItems.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.tags && item.tags.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'usage') return (b.usage_count || 0) - (a.usage_count || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce modèle ?')) {
      await deleteLibraryItem(id);
    }
  };

  const handlePreview = (item) => {
    setPreviewItem(item);
  };

  const handleUseClick = (item) => {
    setSelectedItem(item);
    setShowUseModal(true);
    setSelectedBoardId(currentBoard?.id?.toString() || '');
  };

  const handleConfirmUse = async () => {
    if (!selectedItem || !selectedBoardId || !selectedColumnId) {
      alert('Veuillez sélectionner un projet et une colonne');
      return;
    }

    try {
      const content = JSON.parse(selectedItem.content_json);
      const boardId = parseInt(selectedBoardId);
      const columnId = parseInt(selectedColumnId);
      
      const maxPositionResult = await dbGet(
        'SELECT MAX(position) as maxPos FROM cards WHERE column_id = ?',
        [columnId]
      );
      const newPosition = (maxPositionResult?.data?.maxPos ?? -1) + 1;

      if (selectedItem.type === 'card' && content.card) {
        const cardResult = await dbRun(
          'INSERT INTO cards (column_id, title, description, priority, due_date, assignee, position, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            columnId,
            content.card.title,
            content.card.description || '',
            content.card.priority || 'normal',
            content.card.due_date || null,
            content.card.assignee || '',
            newPosition,
            content.card.color || '#FFFFFF'
          ]
        );
        
        if (cardResult.success && content.categories) {
          for (const cat of content.categories) {
            const catResult = await dbRun(
              'INSERT INTO categories (card_id, title, description, priority, due_date, assignee, position, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [
                cardResult.data.lastInsertRowid,
                cat.title,
                cat.description || '',
                cat.priority || 'normal',
                cat.due_date || null,
                cat.assignee || '',
                cat.position,
                cat.color || '#F5F5F5'
              ]
            );
            
            if (catResult.success && cat.subcategories) {
              for (const subcat of cat.subcategories) {
                await dbRun(
                  'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [
                    catResult.data.lastInsertRowid,
                    subcat.title,
                    subcat.description || '',
                    subcat.priority || 'normal',
                    subcat.due_date || null,
                    subcat.assignee || '',
                    subcat.position
                  ]
                );
              }
            }
          }
        }
        
        await dbRun('UPDATE library_items SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?', [selectedItem.id]);
        await loadBoard(boardId);
        alert('Modèle utilisé avec succès !');
      } else if (selectedItem.type === 'category' && content.category) {
        const maxCatPosResult = await dbGet(
          'SELECT MAX(position) as maxPos FROM categories WHERE card_id = ?',
          [columnId]
        );
        const newCatPosition = (maxCatPosResult?.data?.maxPos ?? -1) + 1;
        
        const catResult = await dbRun(
          'INSERT INTO categories (card_id, title, description, priority, due_date, assignee, position, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            columnId,
            content.category.title,
            content.category.description || '',
            content.category.priority || 'normal',
            content.category.due_date || null,
            content.category.assignee || '',
            newCatPosition,
            content.category.color || '#F5F5F5'
          ]
        );
        
        if (catResult.success && content.subcategories) {
          for (const subcat of content.subcategories) {
            await dbRun(
              'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                catResult.data.lastInsertRowid,
                subcat.title,
                subcat.description || '',
                subcat.priority || 'normal',
                subcat.due_date || null,
                subcat.assignee || '',
                subcat.position
              ]
            );
          }
        }
        
        await dbRun('UPDATE library_items SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?', [selectedItem.id]);
        await loadBoard(boardId);
        alert('Catégorie appliquée avec succès !');
      } else if (selectedItem.type === 'subcategory' && content.subcategory) {
        const maxSubPosResult = await dbGet(
          'SELECT MAX(position) as maxPos FROM subcategories WHERE category_id = ?',
          [columnId]
        );
        const newSubPosition = (maxSubPosResult?.data?.maxPos ?? -1) + 1;
        
        await dbRun(
          'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            columnId,
            content.subcategory.title,
            content.subcategory.description || '',
            content.subcategory.priority || 'normal',
            content.subcategory.due_date || null,
            content.subcategory.assignee || '',
            newSubPosition
          ]
        );
        
        await dbRun('UPDATE library_items SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?', [selectedItem.id]);
        await loadBoard(boardId);
        alert('Sous-catégorie appliquée avec succès !');
      }
      
      setShowUseModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error using template:', error);
      alert('Erreur lors de l\'utilisation du modèle');
    }
  };

  const handleRename = async (item, newTitle) => {
    await dbRun('UPDATE library_items SET title = ? WHERE id = ?', [newTitle, item.id]);
    loadLibrary();
  };

  const typeLabels = {
    card: 'Carte',
    category: 'Catégorie',
    subcategory: 'Sous-catégorie'
  };

  const typeColors = {
    card: 'bg-blue-100 text-blue-700',
    category: 'bg-green-100 text-green-700',
    subcategory: 'bg-purple-100 text-purple-700'
  };

  if (!libraryOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col border-l dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Bibliothèque</h2>
          <button
            onClick={() => setLibraryOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="card">Cartes</option>
            <option value="category">Catégories</option>
            <option value="subcategory">Sous-catégories</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date</option>
            <option value="name">Nom</option>
            <option value="usage">Utilisation</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun modèle trouvé</p>
            <p className="text-sm mt-2">Glissez des éléments depuis le projet pour les sauvegarder</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map(item => (
              <div 
                key={item.id} 
                className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3 hover:shadow-md transition-shadow cursor-pointer"
                onDoubleClick={() => handlePreview(item)}
              >
                <div className="flex items-start gap-2">
                  <GripVertical size={16} className="text-gray-400 mt-1 cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${typeColors[item.type] || 'bg-gray-100'}`}>
                        {typeLabels[item.type] || item.type}
                      </span>
                      {item.usage_count > 0 && (
                        <span className="text-xs text-gray-400">×{item.usage_count}</span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-800 dark:text-white text-sm truncate">{item.title}</h3>
                    {item.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.split(',').map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 ml-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePreview(item); }}
                    className="flex items-center px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-300"
                    title="Voir le contenu"
                  >
                    <Eye size={12} className="mr-1" />
                    Voir
                  </button>
                  {item.type === 'card' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUseClick(item); }}
                      className="flex items-center px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Copy size={12} className="mr-1" />
                      Utiliser
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={12} className="mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 text-center">
        Glissez un élément depuis le projet pour le sauvegarder
      </div>

      {previewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewItem(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">{previewItem.title}</h3>
              <button onClick={() => setPreviewItem(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              {(() => {
                try {
                  const content = JSON.parse(previewItem.content_json);
                  return (
                    <div className="space-y-4">
                      {previewItem.type === 'card' && content.card && (
                        <>
                          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">CARTE</span>
                            <h4 className="font-medium dark:text-white">{content.card.title}</h4>
                            {content.card.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{content.card.description}</p>}
                          </div>
                          {content.categories && content.categories.map((cat, i) => (
                            <div key={i} className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg ml-4">
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">CATÉGORIE</span>
                              <h5 className="font-medium dark:text-white">{cat.title}</h5>
                              {cat.subcategories && cat.subcategories.map((sub, j) => (
                                <div key={j} className="ml-4 mt-2 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">SOUS-CATÉGORIE</span>
                                  <p className="dark:text-gray-200">{sub.title}</p>
                                </div>
                              ))}
                            </div>
                          ))}
                        </>
                      )}
                      {previewItem.type === 'category' && content.category && (
                        <>
                          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">CATÉGORIE</span>
                            <h4 className="font-medium dark:text-white">{content.category.title}</h4>
                          </div>
                          {content.subcategories && content.subcategories.map((sub, i) => (
                            <div key={i} className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg ml-4">
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">SOUS-CATÉGORIE</span>
                              <p className="dark:text-gray-200">{sub.title}</p>
                            </div>
                          ))}
                        </>
                      )}
                      {previewItem.type === 'subcategory' && content.subcategory && (
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">SOUS-CATÉGORIE</span>
                          <h4 className="font-medium dark:text-white">{content.subcategory.title}</h4>
                        </div>
                      )}
                    </div>
                  );
                } catch (e) {
                  return <p className="text-gray-500">Contenu non disponible</p>;
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {showUseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUseModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Utiliser le modèle</h3>
              <button onClick={() => setShowUseModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projet</label>
                <select
                  value={selectedBoardId}
                  onChange={(e) => { setSelectedBoardId(e.target.value); setSelectedColumnId(''); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un projet...</option>
                  {boards.map(board => (
                    <option key={board.id} value={board.id}>{board.title}</option>
                  ))}
                </select>
              </div>
              {selectedBoardId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colonne</label>
                  <select
                    value={selectedColumnId}
                    onChange={(e) => setSelectedColumnId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une colonne...</option>
                    {columns.filter(c => c.board_id === parseInt(selectedBoardId)).map(col => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowUseModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmUse}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryPanel;
