import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, Copy, Search, X, GripVertical, Eye } from 'lucide-react';

function LibraryPanel() {
  const {
    libraryItems,
    loadLibrary,
    deleteLibraryItem,
    saveToLibrary,
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
    loadBoards,
  } = useApp();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [previewItem, setPreviewItem] = useState(null);
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [editingTags, setEditingTags] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (libraryOpen) {
      loadLibrary();
      loadBoards();
    }
  }, [libraryOpen]);

  useEffect(() => {
    const handleLibrarySave = async e => {
      const { itemType, content, title } = e.detail;
      console.log('Library save event received:', { itemType, title });

      try {
        const parsedContent = JSON.parse(content);

        let dbType = itemType;
        let dbTitle = title;
        let dbContent = content;

        if (itemType === 'card' && parsedContent.card) {
          dbType = 'card';
          dbTitle = parsedContent.card.title || title;
          dbContent = content;
        } else if (itemType === 'category' && parsedContent.category) {
          dbType = 'category';
          dbTitle = parsedContent.category.title || title;
        } else if (itemType === 'subcategory' && parsedContent.subcategory) {
          dbType = 'subcategory';
          dbTitle = parsedContent.subcategory.title || title;
        }

        await saveToLibrary(dbType, dbTitle, dbContent);
        alert('Élément sauvegardé dans la bibliothèque !');
      } catch (error) {
        console.error('Error saving to library:', error);
        alert('Erreur lors de la sauvegarde');
      }
    };

    window.addEventListener('library-save', handleLibrarySave);
    return () => window.removeEventListener('library-save', handleLibrarySave);
  }, [saveToLibrary]);

  useEffect(() => {
    console.log(
      'Library items updated:',
      libraryItems.map(i => ({ id: i.id, title: i.title, tags: i.tags }))
    );
  }, [libraryItems]);

  useEffect(() => {
    if (selectedBoardId) {
      loadBoard(parseInt(selectedBoardId));
    }
  }, [selectedBoardId]);

  const handleSaveTags = async itemId => {
    console.log('Saving tags:', tagsInput, 'for item:', itemId);
    const result = await dbRun(
      'UPDATE library_items SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [tagsInput, itemId]
    );
    console.log('DB update result:', result);
    await loadLibrary();
    console.log('Library reloaded, items:', libraryItems);
    setEditingTags(null);
    console.log('Tags saved for item:', itemId);
  };

  const handleEditTags = item => {
    setEditingTags(item.id);
    setTagsInput(item.tags || '');
  };

  const filteredItems = libraryItems.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const itemTags = item.tags || '';
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      itemTags.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'usage') return (b.usage_count || 0) - (a.usage_count || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const handleDelete = async id => {
    if (window.confirm('Voulez-vous vraiment supprimer ce modèle ?')) {
      await deleteLibraryItem(id);
    }
  };

  const handlePreview = item => {
    setPreviewItem(item);
  };

  const handleUseClick = item => {
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
            content.card.color || '#FFFFFF',
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
                cat.color || '#F5F5F5',
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
                    subcat.position,
                  ]
                );
              }
            }
          }
        }

        await dbRun(
          'UPDATE library_items SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?',
          [selectedItem.id]
        );
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
            content.category.color || '#F5F5F5',
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
                subcat.position,
              ]
            );
          }
        }

        await dbRun(
          'UPDATE library_items SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?',
          [selectedItem.id]
        );
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
            newSubPosition,
          ]
        );

        await dbRun(
          'UPDATE library_items SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?',
          [selectedItem.id]
        );
        await loadBoard(boardId);
        alert('Sous-catégorie appliquée avec succès !');
      }

      setShowUseModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error using template:', error);
      alert("Erreur lors de l'utilisation du modèle");
    }
  };

  const handleRename = async (item, newTitle) => {
    await dbRun('UPDATE library_items SET title = ? WHERE id = ?', [newTitle, item.id]);
    loadLibrary();
  };

  const typeLabels = {
    card: 'Carte',
    category: 'Catégorie',
    subcategory: 'Sous-catégorie',
  };

  const allTags = [
    ...new Set(
      libraryItems
        .filter(item => item.tags)
        .flatMap(item => item.tags.split(',').map(t => t.trim()))
        .filter(tag => tag)
    ),
  ].sort();

  console.log(
    'All tags calculated from:',
    libraryItems.map(i => ({ id: i.id, tags: i.tags }))
  );
  console.log('All tags:', allTags);

  const handleTagClick = tag => {
    setSearch(tag);
  };

  const typeColors = {
    card: 'bg-blue-100 text-blue-700',
    category: 'bg-green-100 text-green-700',
    subcategory: 'bg-purple-100 text-purple-700',
  };

  if (!libraryOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-panel shadow-xl z-50 flex flex-col border-l border-std">
      <div className="p-4 border-b border-std">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-primary">Bibliothèque</h2>
          <button onClick={() => setLibraryOpen(false)} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">Tous</option>
            <option value="card">Cartes</option>
            <option value="category">Catégories</option>
            <option value="subcategory">Sous-catégories</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
          >
            <option value="date">Date</option>
            <option value="name">Nom</option>
            <option value="usage">Utilisation</option>
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-muted mr-1">Tags:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-2 py-0.5 text-xs rounded ${
                  search.toLowerCase() === tag.toLowerCase()
                    ? 'bg-accent text-white'
                    : 'bg-card-hover text-secondary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {showUseModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowUseModal(false)}
        >
          <div
            className="bg-card rounded-lg shadow-card w-full max-w-md border border-std"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-std flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-primary">
                Utiliser le modèle
              </h3>
              <button onClick={() => setShowUseModal(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Projet</label>
                <select
                  value={selectedBoardId}
                  onChange={e => {
                    setSelectedBoardId(e.target.value);
                    setSelectedColumnId('');
                  }}
                  className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                >
                  <option value="">Sélectionner un projet...</option>
                  {boards.map(board => (
                    <option key={board.id} value={board.id}>
                      {board.title}
                    </option>
                  ))}
                </select>
              </div>
              {selectedBoardId && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Colonne</label>
                  <select
                    value={selectedColumnId}
                    onChange={e => setSelectedColumnId(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">Sélectionner une colonne...</option>
                    {columns
                      .filter(c => c.board_id === parseInt(selectedBoardId))
                      .map(col => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowUseModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary hover:bg-card rounded-lg transition-std"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmUse}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-std"
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
