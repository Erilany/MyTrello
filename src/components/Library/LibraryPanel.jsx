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
    db,
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
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const cardItems = libraryItems.filter(item => item.type === 'card');
  console.log(
    '[LibraryPanel] All items:',
    libraryItems.length,
    'Card items:',
    cardItems.length,
    'Types:',
    [...new Set(libraryItems.map(i => i.type))]
  );

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
    console.log('[LibraryPanel] handleConfirmUse called', {
      selectedItem: selectedItem?.title,
      selectedBoardId,
      selectedColumnId,
    });

    if (!selectedItem || !selectedBoardId || !selectedColumnId) {
      alert('Veuillez sélectionner un projet et une colonne');
      return;
    }

    if (!selectedItem.content_json) {
      console.error('[LibraryPanel] No content_json in selectedItem');
      alert('Cet élément ne peut pas être utilisé');
      return;
    }

    try {
      const content = JSON.parse(selectedItem.content_json);
      console.log('[LibraryPanel] Parsed content for use:', content);
      const boardId = parseInt(selectedBoardId);
      const columnId = parseInt(selectedColumnId);

      if (selectedItem.type === 'card' && content.card) {
        console.log('[LibraryPanel] Creating card:', content.card.title);
        createCard(
          columnId,
          content.card.title,
          content.card.description || '',
          content.card.priority || 'normal',
          content.card.due_date || null,
          content.card.assignee || ''
        );
        console.log('[LibraryPanel] Card created with ID:', cardId);
        if (content.categories) {
          console.log('[LibraryPanel] Creating categories, count:', content.categories.length);
          content.categories.forEach(cat => {
            console.log('[LibraryPanel] Creating category:', cat.title);
            const categoryId = createCategory(
              cardId,
              cat.title,
              cat.description || '',
              cat.priority || 'normal',
              cat.due_date || null,
              cat.assignee || ''
            );
            console.log('[LibraryPanel] Category created with ID:', categoryId);
            if (cat.subcategories) {
              cat.subcategories.forEach(subcat => {
                console.log('[LibraryPanel] Creating subcategory:', subcat.title);
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
        }
        console.log('[LibraryPanel] Loading board');
        loadBoard(boardId);
      } else if (selectedItem.type === 'category' && content.category) {
        const cardId2 = createCard(
          columnId,
          content.category.title,
          content.category.description || '',
          content.category.priority || 'normal',
          content.category.due_date || null,
          content.category.assignee || ''
        );
        if (content.subcategories) {
          content.subcategories.forEach(subcat => {
            createSubcategory(
              cardId2,
              subcat.title,
              subcat.description || '',
              subcat.priority || 'normal',
              subcat.due_date || null,
              subcat.assignee || ''
            );
          });
        }
        loadBoard(boardId);
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
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
            >
              <option value="date">Date</option>
              <option value="name">Nom</option>
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
          {viewMode === 'cards' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary">Cartes ({cardItems.length})</h3>
              </div>
              {cardItems.length === 0 ? (
                <p className="text-sm text-muted">Aucune carte</p>
              ) : (
                <div className="space-y-2">
                  {cardItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-card rounded-lg border border-std p-3 hover:border-strong transition-std cursor-pointer cursor-grab"
                      draggable={!!item.content_json}
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
                        console.log('[LibraryPanel] Drag end');
                        setTimeout(() => {
                          window.__isLibraryDrag = false;
                        }, 100);
                      }}
                      onClick={() => handleCardClick(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-primary text-sm truncate">
                            {item.title}
                          </h4>
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
                        <span className="text-accent text-sm">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {viewMode === 'categories' && selectedCard && (
            <>
              <button
                onClick={handleBackToCards}
                className="text-sm text-accent hover:underline mb-3"
              >
                ← Retour aux cartes
              </button>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary truncate">{selectedCard.title}</h3>
                <span className="text-xs text-muted">Catégories</span>
              </div>
              {selectedCard &&
                (() => {
                  const categories = getCardCategories(selectedCard);
                  return categories.length === 0 ? (
                    <p className="text-sm text-muted">Aucune catégorie</p>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((cat, idx) => (
                        <div
                          key={idx}
                          className="bg-card rounded-lg border border-std p-3 hover:border-strong transition-std cursor-pointer"
                          onClick={() => handleCategoryClick(cat)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-primary text-sm truncate">
                                {cat.title}
                              </h4>
                            </div>
                            <span className="text-accent text-sm">→</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              <div className="mt-4 pt-4 border-t border-std">
                <button
                  onClick={() => handleUseClick(selectedCard)}
                  className="w-full py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-std text-sm"
                >
                  Utiliser cette carte
                </button>
              </div>
            </>
          )}

          {viewMode === 'subcategories' && selectedCategory && (
            <>
              <button
                onClick={handleBackToCategories}
                className="text-sm text-accent hover:underline mb-3"
              >
                ← Retour aux catégories
              </button>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary truncate">{selectedCategory.title}</h3>
                <span className="text-xs text-muted">Sous-catégories</span>
              </div>
              {(() => {
                const subcategories = getCategorySubcategories(selectedCategory);
                return subcategories.length === 0 ? (
                  <p className="text-sm text-muted">Aucune sous-catégorie</p>
                ) : (
                  <div className="space-y-2">
                    {subcategories.map((subcat, idx) => (
                      <div key={idx} className="bg-card rounded-lg border border-std p-3">
                        <h4 className="font-medium text-primary text-sm">{subcat.title}</h4>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
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
