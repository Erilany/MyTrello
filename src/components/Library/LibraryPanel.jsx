import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Trash2, Copy, Search, X, GripVertical, Eye, Star } from 'lucide-react';

function LibraryEventListener() {
  const { saveToLibrary, loadLibrary } = useApp();

  useEffect(() => {
    const handleLibrarySave = async e => {
      const { itemType, content, title } = e.detail;

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
        console.error('[LibraryEventListener] Error saving to library:', error);
        alert('Erreur lors de la sauvegarde');
      }
    };

    window.addEventListener('library-save', handleLibrarySave);
    return () => {
      window.removeEventListener('library-save', handleLibrarySave);
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
  const [useFormDestination, setUseFormDestination] = useState('board');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('card');
  const [newItemParentCard, setNewItemParentCard] = useState('');
  const [newItemParentCategory, setNewItemParentCategory] = useState('');
  const [favorites, setFavorites] = useState({ cards: [], categories: [], subcategories: [] });

  useEffect(() => {
    const stored = localStorage.getItem('mytrello_library_favorites');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Handle old format (array) - migrate to new format (object)
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
      const stored = localStorage.getItem('mytrello_library_favorites');
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

  const isCardFavorite = cardId => {
    // Handle both string and number comparison
    return favorites.cards.some(id => String(id) === String(cardId));
  };

  const isCategoryFavorite = (cardId, categoryTitle) => {
    return favorites.categories.some(
      c => String(c.cardId) === String(cardId) && c.title === categoryTitle
    );
  };

  const isSubcategoryFavorite = (cardId, categoryTitle, subcategoryTitle) => {
    return favorites.subcategories.some(
      s =>
        String(s.cardId) === String(cardId) &&
        s.categoryTitle === categoryTitle &&
        s.title === subcategoryTitle
    );
  };

  const cardItems = libraryItems.filter(item => item.type === 'card');

  const filteredItems = libraryItems.filter(item => {
    if (filter === 'favorites') {
      const isFav =
        favorites.cards.some(id => String(id) === String(item.id)) ||
        favorites.categories.some(c => String(c.cardId) === String(item.id)) ||
        favorites.subcategories.some(s => String(s.cardId) === String(item.id));

      if (!isFav) return false;
    } else if (filter !== 'all') {
      if (item.type !== filter) return false;
    }
    const itemTags = item.tags || '';
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      itemTags.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
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

  const toggleCardOnly = (card, forceState = null) => {
    const isSelected = selectedCards.some(c => c.id === card.id);
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCards(prev => {
        if (prev.some(c => c.id === card.id)) return prev;
        return [...prev, card];
      });
    } else {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
    }
  };

  const toggleCardWithChildren = (card, forceState = null) => {
    const cardCategories = getCardCategories(card);
    const cardTitle = card.title;

    const isSelected = selectedCards.some(c => c.id === card.id);
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCards(prev => {
        if (prev.some(c => c.id === card.id)) return prev;
        return [...prev, card];
      });

      cardCategories.forEach(cat => {
        const catWithCard = { ...cat, cardTitle };
        setSelectedCategories(prev => {
          if (prev.some(c => c.title === cat.title && c.cardTitle === cardTitle)) return prev;
          return [...prev, catWithCard];
        });

        (cat.subcategories || []).forEach(subcat => {
          const subcatWithParents = { ...subcat, categoryTitle: cat.title, cardTitle };
          setSelectedSubcategories(prev => {
            if (
              prev.some(
                s =>
                  s.title === subcat.title &&
                  s.categoryTitle === cat.title &&
                  s.cardTitle === cardTitle
              )
            )
              return prev;
            return [...prev, subcatWithParents];
          });
        });
      });
    } else {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
      setSelectedCategories(prevCats => prevCats.filter(c => c.cardTitle !== cardTitle));
      setSelectedSubcategories(prevSubcats => prevSubcats.filter(s => s.cardTitle !== cardTitle));
    }
  };

  const toggleCategoryOnly = (category, cardTitle, forceState = null) => {
    const categoryWithCard = { ...category, cardTitle };

    const isSelected = selectedCategories.some(
      c => c.title === category.title && c.cardTitle === cardTitle
    );
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCategories(prev => {
        if (prev.some(c => c.title === category.title && c.cardTitle === cardTitle)) return prev;
        return [...prev, categoryWithCard];
      });
    } else {
      setSelectedCategories(prev =>
        prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle))
      );
    }
  };

  const toggleCategoryWithChildren = (category, cardTitle, forceState = null) => {
    const categoryWithCard = { ...category, cardTitle };

    const isSelected = selectedCategories.some(
      c => c.title === category.title && c.cardTitle === cardTitle
    );
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCategories(prev => {
        if (prev.some(c => c.title === category.title && c.cardTitle === cardTitle)) return prev;
        return [...prev, categoryWithCard];
      });

      (category.subcategories || []).forEach(subcat => {
        const subcatWithParents = { ...subcat, categoryTitle: category.title, cardTitle };
        setSelectedSubcategories(prev => {
          if (
            prev.some(
              s =>
                s.title === subcat.title &&
                s.categoryTitle === category.title &&
                s.cardTitle === cardTitle
            )
          )
            return prev;
          return [...prev, subcatWithParents];
        });
      });
    } else {
      setSelectedCategories(prev =>
        prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle))
      );
      setSelectedSubcategories(prevSubcats =>
        prevSubcats.filter(s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle))
      );
    }
  };

  const toggleSubcategoryOnly = (subcategory, categoryTitle, cardTitle, forceState = null) => {
    const subcatWithParents = { ...subcategory, categoryTitle, cardTitle };
    setSelectedSubcategories(prev => {
      const exists = prev.find(
        s =>
          s.title === subcategory.title &&
          s.categoryTitle === categoryTitle &&
          s.cardTitle === cardTitle
      );
      const shouldSelect = forceState !== null ? forceState : !exists;

      if (shouldSelect) {
        if (exists) return prev;
        return [...prev, subcatWithParents];
      } else {
        return prev.filter(
          s =>
            !(
              s.title === subcategory.title &&
              s.categoryTitle === categoryTitle &&
              s.cardTitle === cardTitle
            )
        );
      }
    });
  };

  const toggleCategorySelection = (category, cardTitle, forceState = null) => {
    const categoryWithCard = { ...category, cardTitle };

    const isSelected = selectedCategories.some(
      c => c.title === category.title && c.cardTitle === cardTitle
    );
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCategories(prev => {
        if (prev.some(c => c.title === category.title && c.cardTitle === cardTitle)) return prev;
        return [...prev, categoryWithCard];
      });

      (category.subcategories || []).forEach(subcat => {
        const subcatWithParents = { ...subcat, categoryTitle: category.title, cardTitle };
        setSelectedSubcategories(prev => {
          if (
            prev.some(
              s =>
                s.title === subcat.title &&
                s.categoryTitle === category.title &&
                s.cardTitle === cardTitle
            )
          )
            return prev;
          return [...prev, subcatWithParents];
        });
      });
    } else {
      setSelectedCategories(prev =>
        prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle))
      );
      setSelectedSubcategories(prevSubcats =>
        prevSubcats.filter(s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle))
      );
    }
  };

  const toggleSubcategorySelection = (subcategory, categoryTitle, cardTitle, forceState = null) => {
    const subcatWithParents = { ...subcategory, categoryTitle, cardTitle };
    setSelectedSubcategories(prev => {
      const exists = prev.find(
        s =>
          s.title === subcategory.title &&
          s.categoryTitle === categoryTitle &&
          s.cardTitle === cardTitle
      );
      const shouldSelect = forceState !== null ? forceState : !exists;

      if (shouldSelect) {
        if (exists) return prev;
        return [...prev, subcatWithParents];
      } else {
        return prev.filter(
          s =>
            !(
              s.title === subcategory.title &&
              s.categoryTitle === categoryTitle &&
              s.cardTitle === cardTitle
            )
        );
      }
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
    if (!selectedBoardId || (!selectedColumnId && useFormDestination !== 'board2')) {
      alert('Veuillez sélectionner un projet et une colonne');
      return;
    }

    const columnId = useFormDestination === 'board2' ? 1 : parseInt(selectedColumnId);
    const boardId = parseInt(selectedBoardId);

    selectedCards.forEach(card => {
      try {
        const content = JSON.parse(card.content_json);
        const tagsStr = card.tags || '';
        const tags = tagsStr.split(',');
        const chapter = tags[0] || null;

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
          null,
          chapter
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

      if (useFormDestination === 'board2') {
        window.dispatchEvent(
          new CustomEvent('board2-import', {
            detail: {
              cards: selectedCards,
              categories: selectedCategories,
              subcategories: selectedSubcategories,
            },
          })
        );
        loadBoard(boardId);
        setLibraryOpen(false);
        navigate('/board2');
      } else {
        loadBoard(boardId);
        setLibraryOpen(false);
        navigate('/board');
      }
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

  const handleMainViewConfirmUse = async () => {
    console.log('[LibraryPanel] handleMainViewConfirmUse called');
    console.log('[LibraryPanel] selectedCards:', selectedCards);
    console.log('[LibraryPanel] selectedCategories:', selectedCategories);
    console.log('[LibraryPanel] selectedSubcategories:', selectedSubcategories);
    if (!useFormBoardId) {
      alert('Veuillez sélectionner un projet');
      return;
    }
    if (useFormDestination !== 'board2' && !useFormColumnId) {
      alert('Veuillez sélectionner une colonne');
      return;
    }

    const columnId = useFormDestination === 'board2' ? 1 : parseInt(useFormColumnId);
    const boardId = parseInt(useFormBoardId);

    for (const card of selectedCards) {
      try {
        const content = JSON.parse(card.content_json);
        const cardDuration = content.card?.duration_days ?? card.duration ?? 1;

        const tagsStr = card.tags || '';
        const tags = tagsStr.split(',');
        const chapter = tags[0] || null;

        const cardId = await createCard(
          columnId,
          content.card?.title || card.title,
          content.card?.description || '',
          content.card?.priority || 'normal',
          content.card?.due_date || null,
          content.card?.assignee || '',
          null,
          cardDuration,
          null,
          null,
          null,
          chapter
        );

        const cardCategories = content.categories || [];
        const cardTitleForCompare = content.card?.title || card.title;
        for (const cat of cardCategories) {
          const isCatSelected = selectedCategories.some(
            sc => sc.title === cat.title && sc.cardTitle === cardTitleForCompare
          );
          if (isCatSelected) {
            const categoryDuration = cat.duration_days ?? 1;
            const categoryId = await createCategory(
              cardId,
              cat.title,
              cat.description || '',
              cat.priority || 'normal',
              cat.due_date || null,
              cat.assignee || '',
              null,
              categoryDuration,
              null
            );

            const catSubcategories = cat.subcategories || [];
            console.log(
              '[LibraryPanel] Checking subcats for card:',
              cardTitleForCompare,
              'category:',
              cat.title
            );
            console.log(
              '[LibraryPanel] subcats in content:',
              catSubcategories.map(s => s.title)
            );
            console.log(
              '[LibraryPanel] selectedSubcategories:',
              selectedSubcategories.map(s => ({
                title: s.title,
                categoryTitle: s.categoryTitle,
                cardTitle: s.cardTitle,
              }))
            );
            for (const subcat of catSubcategories) {
              const isSubcatSelected = selectedSubcategories.some(
                ss =>
                  ss.title === subcat.title &&
                  ss.categoryTitle === cat.title &&
                  ss.cardTitle === cardTitleForCompare
              );
              console.log(
                '[LibraryPanel] Checking subcat:',
                subcat.title,
                'isSubcatSelected:',
                isSubcatSelected
              );
              if (isSubcatSelected) {
                const subcatDuration = subcat.duration_days ?? 1;
                await createSubcategory(
                  categoryId,
                  subcat.title,
                  subcat.description || '',
                  subcat.priority || 'normal',
                  subcat.due_date || null,
                  subcat.assignee || '',
                  null,
                  subcatDuration,
                  null
                );
              }
            }
          }
        }
      } catch (e) {
        console.error('Error creating card:', e);
      }
    }

    for (const cat of selectedCategories.filter(
      cat =>
        !selectedCards.some(
          sc =>
            sc.title === cat.cardTitle ||
            (sc.content_json && JSON.parse(sc.content_json).card?.title === cat.cardTitle)
        )
    )) {
      try {
        const categoryDuration = cat.duration_days ?? 1;
        const categoryId = await createCategory(
          null,
          cat.title,
          cat.description || '',
          cat.priority || 'normal',
          cat.due_date || null,
          cat.assignee || '',
          null,
          categoryDuration,
          null
        );

        const catSubcategories = selectedSubcategories.filter(
          ss => ss.categoryTitle === cat.title && !ss.cardTitle
        );
        for (const subcat of catSubcategories) {
          const subcatDuration = subcat.duration_days ?? 1;
          await createSubcategory(
            categoryId,
            subcat.title,
            subcat.description || '',
            subcat.priority || 'normal',
            subcat.due_date || null,
            subcat.assignee || '',
            null,
            subcatDuration,
            null
          );
        }
      } catch (e) {
        console.error('Error creating category:', e);
      }
    }

    console.log('[LibraryPanel] Calling loadBoard for:', boardId);
    loadBoard(boardId);

    setTimeout(() => {
      console.log(
        '[LibraryPanel] Navigating to:',
        useFormDestination === 'board2' ? '/board2' : `/board/${boardId}`
      );
      if (useFormDestination === 'board2') {
        navigate('/board2');
      } else {
        navigate(`/board/${boardId}`);
      }
      alert('Éléments ajoutés au projet avec succès !');
    }, 300);
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
      if (filter === 'favorites') {
        const isFav =
          favorites.cards.some(id => String(id) === String(item.id)) ||
          favorites.categories.some(c => String(c.cardId) === String(item.id)) ||
          favorites.subcategories.some(s => String(s.cardId) === String(item.id));

        if (!isFav) return false;
      }
      const itemTags = item.tags || '';
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        itemTags.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });

    console.log(
      '[LibraryPanel] filter:',
      filter,
      'favorites.cards:',
      favorites.cards,
      'filteredCards:',
      filteredCards.length
    );

    let categories = selectedLibraryCard ? getCardCategories(selectedLibraryCard) : [];

    // Filter categories and subcategories when in favorites mode
    if (filter === 'favorites' && selectedLibraryCard) {
      const cardId = selectedLibraryCard.id;
      categories = categories.filter(cat => {
        // Show only if category is favorite
        if (
          favorites.categories.some(
            c => String(c.cardId) === String(cardId) && c.title === cat.title
          )
        )
          return true;
        // Show if any subcategory is favorite
        if (
          (cat.subcategories || []).some(sub =>
            favorites.subcategories.some(
              s =>
                String(s.cardId) === String(cardId) &&
                s.categoryTitle === cat.title &&
                s.title === sub.title
            )
          )
        )
          return true;
        return false;
      });
    }

    const subcategories = selectedLibraryCategory
      ? getCategorySubcategories(selectedLibraryCategory).filter(sub => {
          if (filter !== 'favorites') return true;
          return favorites.subcategories.some(
            s =>
              String(s.cardId) === String(selectedLibraryCard?.id) &&
              s.categoryTitle === selectedLibraryCategory.title &&
              s.title === sub.title
          );
        })
      : [];

    return (
      <>
        <LibraryEventListener />
        <div className="flex h-full">
          <div className="w-80 flex-shrink-0 bg-panel border-r border-std flex flex-col">
            <div className="p-4 border-b border-std">
              <h2 className="text-lg font-display font-bold text-primary mb-3">Bibliothèque</h2>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-accent text-white'
                      : 'bg-input text-secondary hover:bg-card-hover'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilter('favorites')}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    filter === 'favorites'
                      ? 'bg-accent text-white'
                      : 'bg-input text-secondary hover:bg-card-hover'
                  }`}
                >
                  <Star size={14} className={filter === 'favorites' ? 'fill-current' : ''} />
                  Favoris
                </button>
              </div>
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
                <p className="text-sm text-muted">
                  {filter === 'favorites'
                    ? 'Aucun favori. Ajoutez des favoris dans Paramètres > Favoris Bibliothèque'
                    : 'Aucune carte'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredCards.map(item => (
                    <div
                      key={item.id}
                      onClick={e => {
                        if (e.target.type === 'checkbox') return;
                        handleCardClick(item);
                        toggleCardWithChildren(item);
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
                        onChange={() => toggleCardOnly(item)}
                        className="mt-1 w-4 h-4 accent-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate text-primary">
                            {item.title}
                          </h4>
                          {isCardFavorite(item.id) && (
                            <Star
                              size={14}
                              className="text-yellow-500 flex-shrink-0"
                              fill="currentColor"
                            />
                          )}
                        </div>
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
                      onClick={e => {
                        if (e.target.type === 'checkbox') return;
                        handleCategoryClick(cat);
                        toggleCategoryWithChildren(cat, selectedLibraryCard.title);
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
                        onChange={() => toggleCategoryOnly(cat, selectedLibraryCard.title)}
                        className="mt-1 w-4 h-4 accent-done"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <h4 className="font-medium text-sm text-primary">{cat.title}</h4>
                        {selectedLibraryCard &&
                          isCategoryFavorite(selectedLibraryCard.id, cat.title) && (
                            <Star
                              size={14}
                              className="text-yellow-500 flex-shrink-0"
                              fill="currentColor"
                            />
                          )}
                      </div>
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
                      onClick={e => {
                        if (e.target.type === 'checkbox') return;
                        toggleSubcategorySelection(
                          subcat,
                          selectedLibraryCategory.title,
                          selectedLibraryCard?.title
                        );
                      }}
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
                        onChange={e => {
                          e.stopPropagation();
                          toggleSubcategorySelection(
                            subcat,
                            selectedLibraryCategory.title,
                            selectedLibraryCard?.title
                          );
                        }}
                        className="mt-1 w-4 h-4 accent-waiting"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <h4 className="font-medium text-sm text-primary">{subcat.title}</h4>
                        {selectedLibraryCard &&
                          selectedLibraryCategory &&
                          isSubcategoryFavorite(
                            selectedLibraryCard.id,
                            selectedLibraryCategory.title,
                            subcat.title
                          ) && (
                            <Star
                              size={14}
                              className="text-yellow-500 flex-shrink-0"
                              fill="currentColor"
                            />
                          )}
                      </div>
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
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Destination
                  </label>
                  <select
                    value={useFormDestination}
                    onChange={e => {
                      setUseFormDestination(e.target.value);
                      setUseFormColumnId('');
                    }}
                    className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="board">Projets (Kanban)</option>
                    <option value="board2">Projets 2 (Tableau Blanc)</option>
                  </select>
                </div>

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

                {useFormBoardId && useFormDestination === 'board2' && (
                  <div className="bg-card-hover rounded-lg p-3 text-sm text-secondary">
                    Les cartes seront automatiquement affectées à leur chapitre (tag)
                  </div>
                )}

                {useFormBoardId && useFormDestination === 'board' && (
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
                  let categories = getPanelCardCategories(panelSelectedCard);

                  // Filter categories when in favorites mode
                  if (filter === 'favorites') {
                    const cardId = panelSelectedCard.id;
                    categories = categories.filter(cat => {
                      // Show only if category is favorite
                      if (
                        favorites.categories.some(
                          c => String(c.cardId) === String(cardId) && c.title === cat.title
                        )
                      )
                        return true;
                      // Show if any subcategory is favorite
                      if (
                        (cat.subcategories || []).some(sub =>
                          favorites.subcategories.some(
                            s =>
                              String(s.cardId) === String(cardId) &&
                              s.categoryTitle === cat.title &&
                              s.title === sub.title
                          )
                        )
                      )
                        return true;
                      return false;
                    });
                  }

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
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h4 className="font-medium text-primary text-sm truncate">
                                {cat.title}
                              </h4>
                              {panelSelectedCard &&
                                isCategoryFavorite(panelSelectedCard.id, cat.title) && (
                                  <Star
                                    size={14}
                                    className="text-yellow-500 flex-shrink-0"
                                    fill="currentColor"
                                  />
                                )}
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
                let subcategories = getPanelCategorySubcategories(panelSelectedCategory);

                // Filter subcategories when in favorites mode
                if (filter === 'favorites') {
                  subcategories = subcategories.filter(sub =>
                    favorites.subcategories.some(
                      s =>
                        String(s.cardId) === String(panelSelectedCard?.id) &&
                        s.categoryTitle === panelSelectedCategory.title &&
                        s.title === sub.title
                    )
                  );
                }

                return subcategories.length === 0 ? (
                  <p className="text-sm text-muted">Aucune sous-catégorie</p>
                ) : (
                  <div className="space-y-2">
                    {subcategories.map((subcat, idx) => (
                      <div key={idx} className="bg-card rounded-lg border border-std p-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-primary text-sm">{subcat.title}</h4>
                          {panelSelectedCard &&
                            panelSelectedCategory &&
                            isSubcategoryFavorite(
                              panelSelectedCard.id,
                              panelSelectedCategory.title,
                              subcat.title
                            ) && (
                              <Star
                                size={14}
                                className="text-yellow-500 flex-shrink-0"
                                fill="currentColor"
                              />
                            )}
                        </div>
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
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Destination
                  </label>
                  <select
                    value={useFormDestination}
                    onChange={e => {
                      setUseFormDestination(e.target.value);
                      setSelectedColumnId('');
                    }}
                    className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="board">Projets (Kanban)</option>
                    <option value="board2">Projets 2 (Tableau Blanc)</option>
                  </select>
                </div>
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
                {selectedBoardId && useFormDestination === 'board2' && (
                  <div className="bg-card-hover rounded-lg p-3 text-sm text-secondary">
                    Les cartes seront automatiquement affectées à leur chapitre (tag)
                  </div>
                )}
                {selectedBoardId && useFormDestination === 'board' && (
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
