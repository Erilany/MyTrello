import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, Copy, Search, X, GripVertical, Eye } from 'lucide-react';

function LibraryEventListener() {
  const { saveToLibrary, loadLibrary } = useApp();

  useEffect(() => {
    const handleLibrarySave = async e => {
      const { itemType, content, title } = e.detail;
      console.log('[LibraryEventListener] Library save event received:', { itemType, title });

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

        console.log('[LibraryEventListener] Saving to library:', { dbType, dbTitle });
        await saveToLibrary(dbType, dbTitle, dbContent);
        alert('Élément sauvegardé dans la bibliothèque !');
      } catch (error) {
        console.error('[LibraryEventListener] Error saving to library:', error);
        alert('Erreur lors de la sauvegarde');
      }
    };

    window.addEventListener('library-save', handleLibrarySave);
    console.log('[LibraryEventListener] Event listener attached');
    return () => {
      window.removeEventListener('library-save', handleLibrarySave);
      console.log('[LibraryEventListener] Event listener removed');
    };
  }, [saveToLibrary, loadLibrary]);

  return null;
}

function LibraryPanel() {
  const {
    libraryItems,
    loadLibrary,
    deleteLibraryItem,
    saveToLibrary,
    loadBoard,
    currentBoard,
    categories,
    subcategories,
    libraryOpen,
    setLibraryOpen,
    boards,
    columns,
    createCard,
    createCategory,
    createSubcategory,
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
    }
  }, [libraryOpen]);

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

  const handleSaveTags = itemId => {
    console.log('Saving tags:', tagsInput, 'for item:', itemId);
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

  const allTags = [
    ...new Set(libraryItems.flatMap(item => (item.tags || '').split(',').filter(Boolean))),
  ];

  const handleTagClick = tag => {
    setSearch(tag);
  };

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

  const handleConfirmUse = () => {
    if (!selectedItem || !selectedBoardId || !selectedColumnId) {
      alert('Veuillez sélectionner un projet et une colonne');
      return;
    }

    try {
      const content = JSON.parse(selectedItem.content_json);
      const boardId = parseInt(selectedBoardId);
      const columnId = parseInt(selectedColumnId);

      if (selectedItem.type === 'card' && content.card) {
        createCard(
          columnId,
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
          loadBoard(boardId);
        });
      } else if (selectedItem.type === 'category' && content.category) {
        createCard(
          columnId,
          content.category.title,
          content.category.description || '',
          content.category.priority || 'normal',
          content.category.due_date || null,
          content.category.assignee || ''
        ).then(cardId => {
          if (cardId && content.subcategories) {
            content.subcategories.forEach((subcat, subIndex) => {
              createSubcategory(
                cardId,
                subcat.title,
                subcat.description || '',
                subcat.priority || 'normal',
                subcat.due_date || null,
                subcat.assignee || ''
              );
            });
          }
          loadBoard(boardId);
        });
      } else if (selectedItem.type === 'subcategory' && content.subcategory) {
        const columnCards = [];
        columns.forEach(col => {
          if (Number(col.board_id) === Number(boardId) && Number(col.id) === Number(columnId)) {
            columnCards.push(...(col.cards || []));
          }
        });
        if (columnCards.length > 0) {
          createCategory(
            columnCards[0].id,
            content.subcategory.title,
            content.subcategory.description || '',
            content.subcategory.priority || 'normal',
            content.subcategory.due_date || null,
            content.subcategory.assignee || ''
          );
        }
        loadBoard(boardId);
      }

      alert('Modèle utilisé avec succès !');
      setShowUseModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error using library item:', error);
      alert("Erreur lors de l'utilisation du modèle");
    }
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'usage') return (b.usage_count || 0) - (a.usage_count || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const typeColors = {
    card: 'bg-accent-soft text-accent',
    category: 'bg-done-soft text-done',
    subcategory: 'bg-waiting-soft text-waiting',
  };

  if (!libraryOpen) return null;

  return (
    <>
      <LibraryEventListener />
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

        <div
          className={`flex-1 overflow-y-auto p-4 ${isDragOver ? 'bg-accent-soft' : ''}`}
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={async e => {
            e.preventDefault();
            setIsDragOver(false);
            const data = e.dataTransfer.getData('application/json');
            if (data) {
              try {
                const { itemType, content, title } = JSON.parse(data);
                const parsedContent = JSON.parse(content);
                let dbType = itemType;
                let dbTitle = title;

                if (itemType === 'card' && parsedContent.card) {
                  dbTitle = parsedContent.card.title || title;
                } else if (itemType === 'category' && parsedContent.category) {
                  dbTitle = parsedContent.category.title || title;
                } else if (itemType === 'subcategory' && parsedContent.subcategory) {
                  dbTitle = parsedContent.subcategory.title || title;
                }

                await saveToLibrary(dbType, dbTitle, content);
                alert('Élément sauvegardé dans la bibliothèque !');
              } catch (error) {
                console.error('Error saving dropped item:', error);
              }
            }
          }}
        >
          {sortedItems.length === 0 ? (
            <div className="text-center text-secondary py-8">
              <p>Aucun modèle trouvé</p>
              <p className="text-sm text-muted mt-1">
                Sauvegardez des cartes, catégories ou sous-catégories pour les retrouver ici
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedItems.map(item => (
                <div
                  key={item.id}
                  className="bg-card rounded-lg border border-std p-3 hover:border-strong transition-std cursor-grab"
                  draggable
                  onDragStart={e => {
                    console.log('[LibraryPanel] Drag start', {
                      itemType: item.type,
                      title: item.title,
                    });
                    window.__isLibraryDrag = true;
                    const dragData = {
                      itemType: item.type,
                      content: item.content_json,
                      title: item.title,
                    };
                    window.__libraryDragData = dragData;
                    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                  }}
                  onDragEnd={() => {
                    setTimeout(() => {
                      window.__isLibraryDrag = false;
                    }, 100);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`badge ${typeColors[item.type] || 'bg-card-hover text-secondary'}`}
                        >
                          {item.type}
                        </span>
                        {item.usage_count > 0 && (
                          <span className="badge badge-category">×{item.usage_count}</span>
                        )}
                      </div>
                      <h3 className="font-medium text-primary text-sm truncate">{item.title}</h3>
                      {item.tags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.split(',').map((tag, i) => (
                            <span key={i} className="text-xs text-muted">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleUseClick(item)}
                        className="icon-btn !w-6 !h-6"
                        title="Utiliser"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="icon-btn !w-6 !h-6 text-urgent"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showUseModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
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
    </>
  );
}

export default LibraryPanel;
