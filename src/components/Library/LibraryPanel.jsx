import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    libraryViewMode,
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
  const [selectedLibraryCard, setSelectedLibraryCard] = useState(null);
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [panelSelectedCard, setPanelSelectedCard] = useState(null);
  const [panelSelectedCategory, setPanelSelectedCategory] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [showUseForm, setShowUseForm] = useState(false);
  const [useFormBoardId, setUseFormBoardId] = useState('');
  const [useFormColumnId, setUseFormColumnId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('card');
  const [newItemParentCard, setNewItemParentCard] = useState('');
  const [newItemParentCategory, setNewItemParentCategory] = useState('');

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

  const getCardCategories = cardItem => {
    if (!cardItem || !cardItem.content_json) return [];
    try {
      const content = JSON.parse(cardItem.content_json);
      return content.categories || [];
    } catch {
      return [];
    }
  };

  const getCategorySubcategories = category => {
    if (!category) return [];
    return category.subcategories || [];
  };

  const handleCardClick = cardItem => {
    setSelectedLibraryCard(cardItem);
    setSelectedLibraryCategory(null);
  };

  const handleCategoryClick = category => {
    setSelectedLibraryCategory(category);
  };

  const handleBackToCards = () => {
    setSelectedLibraryCard(null);
    setSelectedLibraryCategory(null);
  };

  const handleBackToCategories = () => {
    setSelectedLibraryCategory(null);
  };

  const toggleCardSelection = card => {
    setSelectedCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        setSelectedCategories(prevCats => prevCats.filter(c => c.cardTitle !== card.title));
        setSelectedSubcategories(prevSubcats =>
          prevSubcats.filter(s => s.cardTitle !== card.title)
        );
        return prev.filter(c => c.id !== card.id);
      }
      return [...prev, card];
    });
  };

  const toggleCategorySelection = (category, cardTitle) => {
    const categoryWithCard = { ...category, cardTitle };
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.title === category.title && c.cardTitle === cardTitle);
      if (exists) {
        setSelectedSubcategories(prevSubcats =>
          prevSubcats.filter(
            s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle)
          )
        );
        return prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle));
      }
      return [...prev, categoryWithCard];
    });
  };

  const toggleSubcategorySelection = (subcategory, categoryTitle, cardTitle) => {
    const subcatWithParents = { ...subcategory, categoryTitle, cardTitle };
    setSelectedSubcategories(prev => {
      const exists = prev.find(
        s =>
          s.title === subcategory.title &&
          s.categoryTitle === categoryTitle &&
          s.cardTitle === cardTitle
      );
      if (exists) {
        return prev.filter(
          s =>
            !(
              s.title === subcategory.title &&
              s.categoryTitle === categoryTitle &&
              s.cardTitle === cardTitle
            )
        );
      }
      return [...prev, subcatWithParents];
    });
  };

  const isCardSelected = card => selectedCards.some(c => c.id === card.id);
  const isCategorySelected = (category, cardTitle) =>
    selectedCategories.some(c => c.title === category.title && c.cardTitle === cardTitle);
  const isSubcategorySelected = (subcategory, categoryTitle, cardTitle) =>
    selectedSubcategories.some(
      s =>
        s.title === subcategory.title &&
        s.categoryTitle === categoryTitle &&
        s.cardTitle === cardTitle
    );

  const handleSaveToLibrary = () => {
    if (!newItemTitle.trim()) {
      alert('Veuillez entrer un titre');
      return;
    }

    try {
      if (newItemType === 'card') {
        const content = JSON.stringify({
          card: {
            title: newItemTitle,
            description: '',
            priority: 'normal',
          },
          categories: [],
        });
        saveToLibrary('card', newItemTitle, content);
        alert('Carte ajoutée à la bibliothèque !');
      } else if (newItemType === 'category') {
        if (!newItemParentCard) {
          alert('Veuillez sélectionner une carte parente');
          return;
        }
        const parentCard = cardItems.find(c => c.id === parseInt(newItemParentCard));
        if (parentCard) {
          const content = JSON.parse(parentCard.content_json);
          content.categories.push({
            title: newItemTitle,
            description: '',
            priority: 'normal',
            subcategories: [],
          });
          saveToLibrary('card', parentCard.title, JSON.stringify(content));
          alert('Catégorie ajoutée à la bibliothèque !');
        }
      } else if (newItemType === 'subcategory') {
        if (!newItemParentCard || !newItemParentCategory) {
          alert('Veuillez sélectionner une carte et une catégorie parentes');
          return;
        }
        const parentCard = cardItems.find(c => c.id === parseInt(newItemParentCard));
        if (parentCard) {
          const content = JSON.parse(parentCard.content_json);
          const category = content.categories.find(cat => cat.title === newItemParentCategory);
          if (category) {
            category.subcategories.push({
              title: newItemTitle,
              description: '',
              priority: 'normal',
            });
            saveToLibrary('card', parentCard.title, JSON.stringify(content));
            alert('Sous-catégorie ajoutée à la bibliothèque !');
          }
        }
      }

      setShowAddForm(false);
      setNewItemTitle('');
      setNewItemParentCard('');
      setNewItemParentCategory('');
      loadLibrary();
    } catch (e) {
      console.error('Error saving to library:', e);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handlePanelConfirmUse = () => {
    if (!useFormBoardId || !useFormColumnId) {
      alert('Veuillez sélectionner un projet et une colonne');
      return;
    }

    const columnId = parseInt(useFormColumnId);
    const boardId = parseInt(useFormBoardId);

    selectedCards.forEach(card => {
      try {
        const content = JSON.parse(card.content_json);
        const cardId = createCard(
          columnId,
          content.card?.title || card.title,
          content.card?.description || '',
          content.card?.priority || 'normal',
          content.card?.due_date || null,
          content.card?.assignee || ''
        );

        const selectedCatsForCard = selectedCategories.filter(c => c.cardTitle === card.title);
        selectedCatsForCard.forEach(cat => {
          const categoryId = createCategory(
            cardId,
            cat.title,
            cat.description || '',
            cat.priority || 'normal',
            cat.due_date || null,
            cat.assignee || ''
          );

          const selectedSubcats = selectedSubcategories.filter(
            s => s.categoryTitle === cat.title && s.cardTitle === card.title
          );
          selectedSubcats.forEach(subcat => {
            createSubcategory(
              categoryId,
              subcat.title,
              subcat.description || '',
              subcat.priority || 'normal',
              subcat.due_date || null,
              subcat.assignee || ''
            );
          });
        });
      } catch (e) {
        console.error('Error creating card:', e);
      }
    });

    setTimeout(() => {
      setShowUseForm(false);
      setSelectedCards([]);
      setSelectedCategories([]);
      setSelectedSubcategories([]);
      setUseFormBoardId('');
      setUseFormColumnId('');
      loadBoard(boardId);
      setLibraryOpen(false);
      navigate('/');
      alert('Éléments ajoutés au projet avec succès !');
    }, 100);
  };

  const handlePanelCardClick = cardItem => {
    setPanelSelectedCard(cardItem);
    setPanelSelectedCategory(null);
    setViewMode('categories');
  };

  const handlePanelCategoryClick = category => {
    setPanelSelectedCategory(category);
    setViewMode('subcategories');
  };

  const handlePanelBackToCards = () => {
    setPanelSelectedCard(null);
    setPanelSelectedCategory(null);
    setViewMode('cards');
  };

  const handlePanelBackToCategories = () => {
    setPanelSelectedCategory(null);
    setViewMode('categories');
  };

  const getPanelCardCategories = cardItem => {
    if (!cardItem || !cardItem.content_json) return [];
    try {
      const content = JSON.parse(cardItem.content_json);
      return content.categories || [];
    } catch {
      return [];
    }
  };

  const getPanelCategorySubcategories = category => {
    if (!category) return [];
    return category.subcategories || [];
  };

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

  const handleMainViewConfirmUse = () => {
    if (!useFormBoardId || !useFormColumnId) {
      alert('Veuillez sélectionner un projet et une colonne');
      return;
    }

    const columnId = parseInt(useFormColumnId);
    const boardId = parseInt(useFormBoardId);

    selectedCards.forEach(card => {
      try {
        const content = JSON.parse(card.content_json);
        const cardId = createCard(
          columnId,
          content.card?.title || card.title,
          content.card?.description || '',
          content.card?.priority || 'normal',
          content.card?.due_date || null,
          content.card?.assignee || '',
          null,
          1,
          null,
          null,
          boardId
        );

        const cardCategories = content.categories || [];
        cardCategories.forEach(cat => {
          const isCatSelected = selectedCategories.some(
            sc => sc.title === cat.title && sc.cardTitle === card.title
          );
          if (isCatSelected) {
            const categoryId = createCategory(
              cardId,
              cat.title,
              cat.description || '',
              cat.priority || 'normal',
              cat.due_date || null,
              cat.assignee || '',
              null,
              boardId
            );

            const catSubcategories = cat.subcategories || [];
            catSubcategories.forEach(subcat => {
              const isSubcatSelected = selectedSubcategories.some(
                ss =>
                  ss.title === subcat.title &&
                  ss.categoryTitle === cat.title &&
                  ss.cardTitle === card.title
              );
              if (isSubcatSelected) {
                createSubcategory(
                  categoryId,
                  subcat.title,
                  subcat.description || '',
                  subcat.priority || 'normal',
                  subcat.due_date || null,
                  subcat.assignee || '',
                  null,
                  1,
                  boardId
                );
              }
            });
          }
        });
      } catch (e) {
        console.error('Error creating card:', e);
      }
    });

    selectedCategories
      .filter(cat => !selectedCards.some(sc => sc.title === cat.cardTitle))
      .forEach(cat => {
        try {
          const cardId = createCard(
            columnId,
            cat.title,
            cat.description || '',
            cat.priority || 'normal',
            cat.due_date || null,
            cat.assignee || '',
            null,
            1,
            null,
            null,
            boardId
          );

          selectedSubcategories
            .filter(sub => sub.categoryTitle === cat.title && sub.cardTitle === cat.cardTitle)
            .forEach(subcat => {
              createSubcategory(
                cardId,
                subcat.title,
                subcat.description || '',
                subcat.priority || 'normal',
                subcat.due_date || null,
                subcat.assignee || '',
                null,
                1,
                boardId
              );
            });
        } catch (e) {
          console.error('Error creating category card:', e);
        }
      });

    setTimeout(() => {
      setShowUseForm(false);
      setSelectedCards([]);
      setSelectedCategories([]);
      setSelectedSubcategories([]);
      setUseFormBoardId('');
      setUseFormColumnId('');
      loadBoard(boardId);
      setLibraryOpen(false);
      navigate('/');
      alert('Éléments ajoutés au projet avec succès !');
    }, 100);
  };

  const toggleAllSubcategories = () => {
    if (!selectedLibraryCategory || !selectedLibraryCard) return;

    const currentSubcategories = getCategorySubcategories(selectedLibraryCategory);

    const allSelected = currentSubcategories.every(subcat =>
      isSubcategorySelected(subcat, selectedLibraryCategory.title, selectedLibraryCard.title)
    );

    if (allSelected) {
      setSelectedSubcategories(prev =>
        prev.filter(
          s =>
            !(
              s.categoryTitle === selectedLibraryCategory.title &&
              s.cardTitle === selectedLibraryCard.title
            )
        )
      );
    } else {
      const newSubcats = currentSubcategories.map(subcat => ({
        ...subcat,
        categoryTitle: selectedLibraryCategory.title,
        cardTitle: selectedLibraryCard.title,
      }));
      setSelectedSubcategories(prev => {
        const existing = prev.filter(
          s =>
            !(
              s.categoryTitle === selectedLibraryCategory.title &&
              s.cardTitle === selectedLibraryCard.title
            )
        );
        return [...existing, ...newSubcats];
      });
    }
  };

  const allSubcategoriesSelected =
    selectedLibraryCategory &&
    selectedLibraryCard &&
    getCategorySubcategories(selectedLibraryCategory).length > 0 &&
    getCategorySubcategories(selectedLibraryCategory).every(subcat =>
      isSubcategorySelected(subcat, selectedLibraryCategory.title, selectedLibraryCard.title)
    );

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

  if (libraryViewMode === 'main') {
    const filteredCards = cardItems.filter(item => {
      const itemTags = item.tags || '';
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        itemTags.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });

    const categories = selectedLibraryCard ? getCardCategories(selectedLibraryCard) : [];
    const subcategories = selectedLibraryCategory
      ? getCategorySubcategories(selectedLibraryCategory)
      : [];

    return (
      <>
        <LibraryEventListener />
        <div className="flex h-full">
          <div className="w-80 flex-shrink-0 bg-panel border-r border-std flex flex-col">
            <div className="p-4 border-b border-std">
              <h2 className="text-lg font-display font-bold text-primary mb-3">Bibliothèque</h2>
              <div className="relative">
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
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary">Cartes ({filteredCards.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setNewItemType('card');
                    }}
                    className="px-3 py-1 bg-done text-white text-sm rounded-lg hover:opacity-90"
                  >
                    +
                  </button>
                  {(selectedCards.length > 0 ||
                    selectedCategories.length > 0 ||
                    selectedSubcategories.length > 0) && (
                    <button
                      onClick={() => setShowUseForm(true)}
                      className="px-3 py-1 bg-accent text-white text-sm rounded-lg hover:opacity-90"
                    >
                      Utiliser (
                      {selectedCards.length +
                        selectedCategories.length +
                        selectedSubcategories.length}
                      )
                    </button>
                  )}
                </div>
              </div>
              {filteredCards.length === 0 ? (
                <p className="text-sm text-muted">Aucune carte</p>
              ) : (
                <div className="space-y-2">
                  {filteredCards.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleCardClick(item);
                        toggleCardSelection(item);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-std flex items-start gap-2 ${
                        isCardSelected(item)
                          ? 'bg-accent-soft border-accent'
                          : 'bg-card border-std hover:border-strong'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isCardSelected(item)}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 accent-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate text-primary">{item.title}</h4>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-80 flex-shrink-0 bg-panel border-r border-std flex flex-col">
            <div className="p-4 border-b border-std">
              {selectedLibraryCard ? (
                <button
                  onClick={handleBackToCards}
                  className="text-sm text-accent hover:underline mb-2"
                >
                  ← Retour aux cartes
                </button>
              ) : null}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-primary truncate">
                  {selectedLibraryCard ? selectedLibraryCard.title : 'Catégories'}
                </h3>
                {selectedLibraryCard && (
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setNewItemType('category');
                      setNewItemParentCard(selectedLibraryCard.id.toString());
                    }}
                    className="px-2 py-1 bg-done text-white text-xs rounded hover:opacity-90"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedLibraryCard ? (
                <p className="text-sm text-muted">Sélectionnez une carte</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-muted">Aucune catégorie</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        handleCategoryClick(cat);
                        toggleCategorySelection(cat, selectedLibraryCard.title);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-std flex items-start gap-2 ${
                        isCategorySelected(cat, selectedLibraryCard.title)
                          ? 'bg-done-soft border-done'
                          : 'bg-card border-std hover:border-strong'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isCategorySelected(cat, selectedLibraryCard.title)}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 accent-done"
                      />
                      <h4 className="font-medium text-sm text-primary">{cat.title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-panel flex flex-col">
            <div className="p-4 border-b border-std">
              {selectedLibraryCategory ? (
                <button
                  onClick={handleBackToCategories}
                  className="text-sm text-accent hover:underline mb-2"
                >
                  ← Retour aux catégories
                </button>
              ) : null}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-primary">
                  {selectedLibraryCategory ? selectedLibraryCategory.title : 'Sous-catégories'}
                </h3>
                <div className="flex gap-2">
                  {selectedLibraryCategory &&
                    selectedLibraryCard &&
                    getCategorySubcategories(selectedLibraryCategory).length > 0 && (
                      <button
                        onClick={toggleAllSubcategories}
                        className="px-2 py-1 text-xs bg-card-hover text-secondary rounded hover:bg-std transition-std"
                      >
                        {allSubcategoriesSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    )}
                  {selectedLibraryCategory && selectedLibraryCard && (
                    <button
                      onClick={() => {
                        setShowAddForm(true);
                        setNewItemType('subcategory');
                        setNewItemParentCard(selectedLibraryCard.id.toString());
                        setNewItemParentCategory(selectedLibraryCategory.title);
                      }}
                      className="px-2 py-1 bg-waiting text-white text-xs rounded hover:opacity-90"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedLibraryCategory ? (
                <p className="text-sm text-muted">Sélectionnez une catégorie</p>
              ) : subcategories.length === 0 ? (
                <p className="text-sm text-muted">Aucune sous-catégorie</p>
              ) : (
                <div className="space-y-2">
                  {subcategories.map((subcat, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        toggleSubcategorySelection(
                          subcat,
                          selectedLibraryCategory.title,
                          selectedLibraryCard?.title
                        )
                      }
                      className={`p-3 rounded-lg border cursor-pointer transition-std flex items-start gap-2 ${
                        isSubcategorySelected(
                          subcat,
                          selectedLibraryCategory.title,
                          selectedLibraryCard?.title
                        )
                          ? 'bg-waiting-soft border-waiting'
                          : 'bg-card border-std hover:border-strong'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSubcategorySelected(
                          subcat,
                          selectedLibraryCategory.title,
                          selectedLibraryCard?.title
                        )}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 accent-waiting"
                      />
                      <h4 className="font-medium text-sm text-primary">{subcat.title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showUseForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-card w-full max-w-md border border-std p-6">
              <h3 className="text-lg font-display font-semibold text-primary mb-4">
                Ajouter au projet
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Projet</label>
                  <select
                    value={useFormBoardId}
                    onChange={e => {
                      setUseFormBoardId(e.target.value);
                      setUseFormColumnId('');
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

                {useFormBoardId && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Colonne</label>
                    <select
                      value={useFormColumnId}
                      onChange={e => setUseFormColumnId(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="">Sélectionner une colonne...</option>
                      {db.columns
                        .filter(c => Number(c.board_id) === parseInt(useFormBoardId))
                        .sort((a, b) => a.position - b.position)
                        .map(col => (
                          <option key={col.id} value={col.id}>
                            {col.title}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="bg-card-hover rounded-lg p-3">
                  <h4 className="text-sm font-medium text-primary mb-2">Résumé de la sélection:</h4>
                  <ul className="text-sm text-secondary space-y-1">
                    {selectedCards.length > 0 && <li>- {selectedCards.length} carte(s)</li>}
                    {selectedCategories.length > 0 && (
                      <li>- {selectedCategories.length} catégorie(s)</li>
                    )}
                    {selectedSubcategories.length > 0 && (
                      <li>- {selectedSubcategories.length} sous-catégorie(s)</li>
                    )}
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowUseForm(false)}
                    className="px-4 py-2 text-secondary hover:text-primary hover:bg-card rounded-lg transition-std"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleMainViewConfirmUse}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-std"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-card w-full max-w-md border border-std p-6">
              <h3 className="text-lg font-display font-semibold text-primary mb-4">
                Ajouter à la bibliothèque
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Type</label>
                  <select
                    value={newItemType}
                    onChange={e => {
                      setNewItemType(e.target.value);
                      setNewItemParentCard('');
                      setNewItemParentCategory('');
                    }}
                    className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="card">Carte</option>
                    <option value="category">Catégorie</option>
                    <option value="subcategory">Sous-catégorie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Titre</label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    placeholder="Titre..."
                    className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {newItemType === 'category' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Carte parente
                    </label>
                    <select
                      value={newItemParentCard}
                      onChange={e => {
                        setNewItemParentCard(e.target.value);
                        setNewItemParentCategory('');
                      }}
                      className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="">Sélectionner une carte...</option>
                      {cardItems.map(card => (
                        <option key={card.id} value={card.id}>
                          {card.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newItemType === 'subcategory' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">
                        Carte parente
                      </label>
                      <select
                        value={newItemParentCard}
                        onChange={e => {
                          setNewItemParentCard(e.target.value);
                          setNewItemParentCategory('');
                        }}
                        className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                      >
                        <option value="">Sélectionner une carte...</option>
                        {cardItems.map(card => (
                          <option key={card.id} value={card.id}>
                            {card.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {newItemParentCard && (
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-1">
                          Catégorie parente
                        </label>
                        <select
                          value={newItemParentCategory}
                          onChange={e => setNewItemParentCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="">Sélectionner une catégorie...</option>
                          {(() => {
                            const parentCard = cardItems.find(
                              c => c.id === parseInt(newItemParentCard)
                            );
                            if (!parentCard) return null;
                            try {
                              const content = JSON.parse(parentCard.content_json);
                              return content.categories?.map(cat => (
                                <option key={cat.title} value={cat.title}>
                                  {cat.title}
                                </option>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewItemTitle('');
                      setNewItemParentCard('');
                      setNewItemParentCategory('');
                    }}
                    className="px-4 py-2 text-secondary hover:text-primary hover:bg-card rounded-lg transition-std"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveToLibrary}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-std"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

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
                      onClick={() => handlePanelCardClick(item)}
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

          {viewMode === 'categories' && panelSelectedCard && (
            <>
              <button
                onClick={handlePanelBackToCards}
                className="text-sm text-accent hover:underline mb-3"
              >
                ← Retour aux cartes
              </button>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary truncate">{panelSelectedCard.title}</h3>
                <span className="text-xs text-muted">Catégories</span>
              </div>
              {panelSelectedCard &&
                (() => {
                  const categories = getPanelCardCategories(panelSelectedCard);
                  return categories.length === 0 ? (
                    <p className="text-sm text-muted">Aucune catégorie</p>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((cat, idx) => (
                        <div
                          key={idx}
                          className="bg-card rounded-lg border border-std p-3 hover:border-strong transition-std cursor-pointer"
                          onClick={() => handlePanelCategoryClick(cat)}
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
                  onClick={() => handleUseClick(panelSelectedCard)}
                  className="w-full py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-std text-sm"
                >
                  Utiliser cette carte
                </button>
              </div>
            </>
          )}

          {viewMode === 'subcategories' && panelSelectedCategory && (
            <>
              <button
                onClick={handlePanelBackToCategories}
                className="text-sm text-accent hover:underline mb-3"
              >
                ← Retour aux catégories
              </button>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary truncate">
                  {panelSelectedCategory.title}
                </h3>
                <span className="text-xs text-muted">Sous-catégories</span>
              </div>
              {(() => {
                const subcategories = getPanelCategorySubcategories(panelSelectedCategory);
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
                      {db.columns
                        .filter(c => Number(c.board_id) === parseInt(selectedBoardId))
                        .sort((a, b) => a.position - b.position)
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
                    onClick={handlePanelConfirmUse}
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
