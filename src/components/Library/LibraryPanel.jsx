import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Trash2,
  Copy,
  Search,
  X,
  GripVertical,
  Eye,
  Star,
  Check,
  ChevronRight,
  ChevronDown,
  Plus,
  Download,
  Upload,
} from 'lucide-react';

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

    const handleLibraryRefresh = () => {
      loadLibrary();
    };

    window.addEventListener('library-save', handleLibrarySave);
    window.addEventListener('library-refreshed', handleLibraryRefresh);
    return () => {
      window.removeEventListener('library-save', handleLibrarySave);
      window.removeEventListener('library-refreshed', handleLibraryRefresh);
    };
  }, [saveToLibrary, loadLibrary]);

  return null;
}

function LibraryPanel({ standalone = false }) {
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
  const [useFormDestination, setUseFormDestination] = useState('board2');
  const [isUseFormLoading, setIsUseFormLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('card');
  const [newItemParentCard, setNewItemParentCard] = useState('');
  const [newItemParentCategory, setNewItemParentCategory] = useState('');
  const [favorites, setFavorites] = useState({ cards: [], categories: [], subcategories: [] });
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importTemplatesList, setImportTemplatesList] = useState([]);
  const [selectedImportTemplates, setSelectedImportTemplates] = useState([]);
  const [showTemplatesList, setShowTemplatesList] = useState(false);

  // Load templates from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('c-projets_templates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTemplates(parsed.templates || []);
      } catch (e) {
        console.error('Error loading templates:', e);
      }
    }
  }, []);

  const saveTemplates = newTemplates => {
    setTemplates(newTemplates);
    localStorage.setItem('c-projets_templates', JSON.stringify({ templates: newTemplates }));
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Veuillez entrer un nom pour le template');
      return;
    }
    if (
      selectedCards.length === 0 &&
      selectedCategories.length === 0 &&
      selectedSubcategories.length === 0
    ) {
      alert('Veuillez sélectionner au moins un élément');
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      created_at: new Date().toISOString(),
      cards: selectedCards.map(c => ({
        id: c.id,
        title: c.title,
        tags: c.tags,
        content_json: c.content_json,
      })),
      categories: selectedCategories.map(c => ({
        title: c.title,
        cardTitle: c.cardTitle,
        content_json: c.content_json,
      })),
      subcategories: selectedSubcategories.map(s => ({
        title: s.title,
        categoryTitle: s.categoryTitle,
        cardTitle: s.cardTitle,
        content_json: s.content_json,
      })),
    };

    saveTemplates([...templates, newTemplate]);
    setTemplateName('');
    setShowTemplateModal(false);
    alert('Template sauvegardé !');
  };

  const handleLoadTemplate = template => {
    setSelectedCards([]);
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedCards(template.cards || []);
    setSelectedCategories(template.categories || []);
    setSelectedSubcategories(template.subcategories || []);
    setShowTemplatesList(false);
  };

  const handleDeleteTemplate = templateId => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce template ?')) return;
    saveTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleExportTemplates = () => {
    if (templates.length === 0) {
      alert('Aucun template à exporter');
      return;
    }
    const dataStr = JSON.stringify({ templates }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'c-projets-templates.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileSelect = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.templates && Array.isArray(data.templates)) {
          setImportTemplatesList(data.templates);
          setImportFile(file);
        } else {
          alert('Format de fichier invalide');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (selectedImportTemplates.length === 0) {
      alert('Veuillez sélectionner au moins un template à importer');
      return;
    }

    const templatesToImport = importTemplatesList.filter(t =>
      selectedImportTemplates.includes(t.id)
    );
    const newTemplates = templatesToImport.map(t => ({
      ...t,
      id: Date.now() + Math.random(),
      created_at: new Date().toISOString(),
    }));

    saveTemplates([...templates, ...newTemplates]);
    setShowImportModal(false);
    setImportFile(null);
    setImportTemplatesList([]);
    setSelectedImportTemplates([]);
    alert(`${newTemplates.length} template(s) importé(s) !`);
  };

  const toggleImportTemplate = templateId => {
    setSelectedImportTemplates(prev =>
      prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]
    );
  };

  const saveFavorites = newFavorites => {
    setFavorites(newFavorites);
    localStorage.setItem('c-projets_library_favorites', JSON.stringify(newFavorites));
    window.dispatchEvent(new Event('library-favorites-updated'));
  };

  const toggleCardFavorite = (cardId, cardTitle) => {
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
      newFavorites.subcategories.push({
        cardId,
        cardTitle,
        categoryTitle,
        title: subcategoryTitle,
      });
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

  useEffect(() => {
    const stored = localStorage.getItem('c-projets_library_favorites');
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

  const cardItems = libraryItems.filter(item => item.type === 'card');

  const filteredItems = libraryItems.filter(item => {
    if (filter === 'favorites') {
      const favCards = favorites?.cards || [];
      const favCategories = favorites?.categories || [];
      const favSubcategories = favorites?.subcategories || [];
      const isFav =
        favCards.some(id => String(id) === String(item.id)) ||
        favCategories.some(c => String(c.cardId) === String(item.id)) ||
        favSubcategories.some(s => String(s.cardId) === String(item.id));

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

  const getCardSkipAction = cardItem => {
    if (!cardItem || !cardItem.content_json) return false;
    try {
      const content = JSON.parse(cardItem.content_json);
      return content.card?.skipAction || false;
    } catch {
      return false;
    }
  };

  const getCardSubcategories = cardItem => {
    const categories = getCardCategories(cardItem);
    const subcategories = [];
    categories.forEach(cat => {
      if (cat.subcategories) {
        cat.subcategories.forEach(subcat => {
          subcategories.push({ ...subcat, categoryTitle: cat.title });
        });
      }
    });
    return subcategories;
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

      const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
      if (card && !selectedCards.some(c => c.id === card.id)) {
        setSelectedCards(prev => [...prev, card]);
      }
    } else {
      setSelectedCategories(prev =>
        prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle))
      );
      setSelectedSubcategories(prevSubcats =>
        prevSubcats.filter(s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle))
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

      const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
      if (card && !selectedCards.some(c => c.id === card.id)) {
        setSelectedCards(prev => [...prev, card]);
      }
    } else {
      setSelectedCategories(prev =>
        prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle))
      );
      setSelectedSubcategories(prevSubcats =>
        prevSubcats.filter(s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle))
      );

      const remainingCatsForCard = selectedCategories.filter(
        c => c.cardTitle === cardTitle && c.title !== category.title
      );
      if (remainingCatsForCard.length === 0) {
        setSelectedCards(prev => prev.filter(c => c.title !== cardTitle));
      }
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

  const toggleSubcategoryDirect = (subcategory, cardTitle, categoryTitle, forceState = null) => {
    const subcatWithParents = { ...subcategory, cardTitle, categoryTitle: categoryTitle || '' };
    setSelectedSubcategories(prev => {
      const exists = prev.find(s => s.title === subcategory.title && s.cardTitle === cardTitle);
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

    const exists = selectedSubcategories.find(
      s =>
        s.title === subcategory.title &&
        s.categoryTitle === categoryTitle &&
        s.cardTitle === cardTitle
    );
    const shouldSelect = forceState !== null ? forceState : !exists;

    if (shouldSelect) {
      setSelectedSubcategories(prev => {
        if (
          prev.some(
            s =>
              s.title === subcategory.title &&
              s.categoryTitle === categoryTitle &&
              s.cardTitle === cardTitle
          )
        )
          return prev;
        return [...prev, subcatWithParents];
      });

      const categoryExists = selectedCategories.some(
        c => c.title === categoryTitle && c.cardTitle === cardTitle
      );
      if (!categoryExists) {
        const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
        const categoryContent = card
          ? getCardCategories(card).find(cat => cat.title === categoryTitle)
          : null;
        if (categoryContent) {
          setSelectedCategories(prev => [...prev, { ...categoryContent, cardTitle }]);
        }
      }

      const cardExists = selectedCards.some(c => c.title === cardTitle);
      if (!cardExists) {
        const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
        if (card) {
          setSelectedCards(prev => [...prev, card]);
        }
      }
    } else {
      setSelectedSubcategories(prev =>
        prev.filter(
          s =>
            !(
              s.title === subcategory.title &&
              s.categoryTitle === categoryTitle &&
              s.cardTitle === cardTitle
            )
        )
      );

      const remainingSubcatsForCategory = selectedSubcategories.filter(
        s =>
          s.categoryTitle === categoryTitle &&
          s.cardTitle === cardTitle &&
          s.title !== subcategory.title
      );
      if (remainingSubcatsForCategory.length === 0) {
        setSelectedCategories(prev =>
          prev.filter(c => !(c.title === categoryTitle && c.cardTitle === cardTitle))
        );

        const remainingCatsForCard = selectedCategories.filter(
          c => c.cardTitle === cardTitle && c.title !== categoryTitle
        );
        if (remainingCatsForCard.length === 0) {
          setSelectedCards(prev => prev.filter(c => c.title !== cardTitle));
        }
      }
    }
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

    let columnId;
    if (useFormDestination === 'board2') {
      const boardColumns = db.columns.filter(c => Number(c.board_id) === parseInt(selectedBoardId));
      if (boardColumns.length === 0) {
        alert('Aucune colonne trouvée pour ce projet');
        return;
      }
      columnId = boardColumns.sort((a, b) => a.position - b.position)[0].id;
    } else {
      columnId = parseInt(selectedColumnId);
    }
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
          chapter,
          card.id,
          content.card?.skipAction || false
        );

        const selectedCatsForCard = selectedCategories.filter(c => c.cardTitle === card.title);
        selectedCatsForCard.forEach(cat => {
          const categoryId = createCategory(
            cardId,
            cat.title,
            cat.description || '',
            cat.priority || 'normal',
            cat.due_date || null,
            cat.assignee || '',
            null,
            1,
            null,
            null,
            null,
            cat.tag || null
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
              subcat.assignee || '',
              null,
              1,
              null,
              subcat.tag || cat.tag || null
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
    console.log('[DEBUG handleMainViewConfirmUse] START');
    console.log('[DEBUG] useFormBoardId:', useFormBoardId);
    console.log('[DEBUG] selectedCards:', selectedCards);
    console.log('[DEBUG] selectedCategories:', selectedCategories);
    console.log('[DEBUG] selectedSubcategories:', selectedSubcategories);

    if (!useFormBoardId) {
      alert('Veuillez sélectionner un projet');
      return;
    }

    if (
      selectedCards.length === 0 &&
      selectedCategories.length === 0 &&
      selectedSubcategories.length === 0
    ) {
      alert('Veuillez sélectionner au moins un élément dans la bibliothèque');
      setIsUseFormLoading(false);
      return;
    }

    setIsUseFormLoading(true);

    const boardId = parseInt(useFormBoardId);
    console.log('[DEBUG] boardId:', boardId);

    const errors = [];
    let cardsAdded = 0;
    let categoriesAdded = 0;
    let subcategoriesAdded = 0;

    const boardCards = db.cards.filter(c => {
      const column = db.columns.find(col => Number(col.id) === Number(c.column_id));
      return column && Number(column.board_id) === boardId;
    });
    const boardCardIds = boardCards.map(c => c.id);
    console.log('[DEBUG] boardCards in project:', boardCards.length);
    console.log('[DEBUG] boardCardIds:', boardCardIds);

    const boardColumns = db.columns.filter(col => Number(col.board_id) === boardId);
    const firstColumnId = boardColumns.length > 0 ? boardColumns[0].id : null;
    console.log('[DEBUG] boardColumns:', boardColumns.length, 'firstColumnId:', firstColumnId);
    console.log('[DEBUG] Columns board_ids:', db.columns.map(c => c.board_id).join(', '));
    console.log('[DEBUG] Looking for boardId:', boardId, 'type:', typeof boardId);

    console.log('[DEBUG] Processing selectedCards, count:', selectedCards.length);
    for (const card of selectedCards) {
      try {
        const content = JSON.parse(card.content_json);
        console.log('[DEBUG] Card:', card.title, 'content_json parsed:', !!content);
        const cardDuration = content.card?.duration_days ?? card.duration ?? 1;
        const cardTitle =
          content.card?.title ||
          content.category?.title ||
          content.subcategory?.title ||
          card.title;
        console.log('[DEBUG] cardTitle:', cardTitle);

        let cardId;
        let isNewCard = false;

        // Only check for existing card in the selected board
        const existingCard = db.cards.find(c => {
          if (!c.title || c.title.toLowerCase() !== cardTitle.toLowerCase() || c.is_archived)
            return false;
          const col = db.columns.find(col => Number(col.id) === Number(c.column_id));
          return col && Number(col.board_id) === boardId;
        });
        console.log('[DEBUG] existingCard:', existingCard ? existingCard.id : 'none');

        if (existingCard) {
          // Use existing card from selected board
          cardId = existingCard.id;
        }

        if (!cardId && firstColumnId) {
          const tagsStr = card.tags || '';
          const tags = tagsStr.split(',');
          const chapter = tags[0] || null;

          cardId = await createCard(
            firstColumnId,
            cardTitle,
            content.card?.description ||
              content.category?.description ||
              content.subcategory?.description ||
              '',
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
          isNewCard = true;
          console.log('[DEBUG] Created new card, cardId:', cardId, 'isNewCard:', isNewCard);
        } else if (!firstColumnId) {
          console.log('[DEBUG] Skipping card creation - no firstColumnId');
        }

        if (cardId) {
          if (isNewCard) {
            cardsAdded++;
          }

          // Logique automatique: si 1 seule SOUS-CATÉGORIE au total pour cette carte, importer directement
          const totalSelectedSubcats = selectedSubcategories.filter(
            ss => ss.cardTitle === cardTitle
          );
          const isSingleTask = totalSelectedSubcats.length === 1;

          // Si une seule tâche, importer sans créer de catégories
          if (isSingleTask && totalSelectedSubcats.length > 0) {
            console.log('[DEBUG] Single task detected - importing directly without categories');
            const subcat = totalSelectedSubcats[0];
            // Créer une catégorie par défaut "Tâches" si nécessaire
            let defaultCat = db.categories.find(
              c => Number(c.card_id) === cardId && !c.parent_id && c.title === 'Tâches'
            );
            if (!defaultCat) {
              try {
                const newCatId = await createCategory(
                  cardId,
                  'Tâches',
                  '',
                  'normal',
                  null,
                  '',
                  null,
                  1,
                  null,
                  null
                );
                defaultCat = { id: newCatId };
              } catch (e) {
                console.log('[DEBUG] Error creating default category:', e);
              }
            }
            if (defaultCat) {
              try {
                await createSubcategory(
                  defaultCat.id,
                  subcat.title,
                  subcat.description || '',
                  subcat.priority || 'normal',
                  subcat.due_date || null,
                  subcat.assignee || '',
                  null,
                  subcat.duration_days || 1,
                  null,
                  subcat.tag || cat.tag || null
                );
                console.log('[DEBUG] Created subcategory directly:', subcat.title);
              } catch (e) {
                console.log('[DEBUG] Error creating subcategory:', e);
              }
            }
            // Skip les catégories car on a déjà importé la tâche unique
            continue;
          }

          // Sinon, créer les catégories normalement (plusieurs sous-catégories)
          const cardCategories = content.categories || [];
          for (const cat of cardCategories) {
            const isCatSelected = selectedCategories.some(
              sc => sc.title === cat.title && sc.cardTitle === cardTitle
            );
            console.log('[DEBUG] Category:', cat.title, 'isCatSelected:', isCatSelected);
            if (isCatSelected && cardId) {
              try {
                const categoryDuration = cat.duration_days ?? 1;

                const existingCatsForCard = db.categories.filter(
                  c => Number(c.card_id) === cardId && !c.parent_id
                );
                const existingCat = existingCatsForCard.find(
                  c => c.title && c.title.toLowerCase() === cat.title.toLowerCase()
                );

                if (existingCat) {
                  errors.push(`Catégorie "${cat.title}": existe déjà pour la carte "${cardTitle}"`);
                  console.log('[DEBUG] Category already exists:', cat.title);

                  // Catégorie existe, on ajoute quand même les sous-catégories non existantes
                  const categoryId = existingCat.id;
                  const catSubcategories = cat.subcategories || [];
                  for (const subcat of catSubcategories) {
                    const isSubcatSelected = selectedSubcategories.some(
                      ss =>
                        ss.title === subcat.title &&
                        ss.categoryTitle === cat.title &&
                        ss.cardTitle === cardTitle
                    );
                    if (isSubcatSelected) {
                      try {
                        const existingSubcats = db.subcategories.filter(
                          s => Number(s.category_id) === categoryId
                        );
                        const existingSubcat = existingSubcats.find(
                          s => s.title && s.title.toLowerCase() === subcat.title.toLowerCase()
                        );

                        if (existingSubcat) {
                          errors.push(
                            `Sous-catégorie "${subcat.title}": existe déjà dans la catégorie "${cat.title}"`
                          );
                        } else {
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
                            null,
                            subcat.tag || cat.tag || null
                          );
                          subcategoriesAdded++;
                        }
                      } catch (subcatErr) {
                        errors.push(`Sous-catégorie "${subcat.title}": ${subcatErr.message}`);
                      }
                    }
                  }
                } else {
                  const categoryId = await createCategory(
                    cardId,
                    cat.title,
                    cat.description || '',
                    cat.priority || 'normal',
                    cat.due_date || null,
                    cat.assignee || '',
                    null,
                    categoryDuration,
                    null,
                    null,
                    cat.tag || null
                  );
                  categoriesAdded++;

                  const catSubcategories = cat.subcategories || [];
                  for (const subcat of catSubcategories) {
                    const isSubcatSelected = selectedSubcategories.some(
                      ss =>
                        ss.title === subcat.title &&
                        ss.categoryTitle === cat.title &&
                        ss.cardTitle === cardTitle
                    );
                    if (isSubcatSelected) {
                      try {
                        const existingSubcats = db.subcategories.filter(
                          s => Number(s.category_id) === categoryId
                        );
                        const existingSubcat = existingSubcats.find(
                          s => s.title && s.title.toLowerCase() === subcat.title.toLowerCase()
                        );

                        if (existingSubcat) {
                          errors.push(
                            `Sous-catégorie "${subcat.title}": existe déjà dans la catégorie "${cat.title}"`
                          );
                        } else {
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
                            null,
                            subcat.tag || cat.tag || null
                          );
                          subcategoriesAdded++;
                        }
                      } catch (subcatErr) {
                        errors.push(`Sous-catégorie "${subcat.title}": ${subcatErr.message}`);
                      }
                    }
                  }
                }
              } catch (catErr) {
                errors.push(`Catégorie "${cat.title}": ${catErr.message}`);
              }
            }
          }
        }
      } catch (cardErr) {
        errors.push(`Carte "${card.title}": ${cardErr.message}`);
      }
    }

    // Handle standalone categories (not attached to selected cards)
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

        const existingCat = db.categories.find(
          c =>
            c.title &&
            c.title.toLowerCase() === cat.title.toLowerCase() &&
            !c.parent_id &&
            boardCardIds.includes(Number(c.card_id))
        );
        if (existingCat) {
          errors.push(`Catégorie "${cat.title}": existe déjà dans ce projet`);
          continue;
        }

        const categoryId = await createCategory(
          null,
          cat.title,
          cat.description || '',
          cat.priority || 'normal',
          cat.due_date || null,
          cat.assignee || '',
          null,
          categoryDuration,
          null,
          null,
          cat.tag || null
        );
        categoriesAdded++;

        const catSubcategories = selectedSubcategories.filter(
          ss => ss.categoryTitle === cat.title && !ss.cardTitle
        );
        for (const subcat of catSubcategories) {
          try {
            const existingSubcat = db.subcategories.find(
              s =>
                s.title &&
                s.title.toLowerCase() === subcat.title.toLowerCase() &&
                Number(s.category_id) === categoryId
            );
            if (existingSubcat) {
              errors.push(`Sous-catégorie "${subcat.title}": existe déjà dans ce projet`);
              continue;
            }

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
              null,
              subcat.tag || cat.tag || null
            );
            subcategoriesAdded++;
          } catch (subcatErr) {
            errors.push(`Sous-catégorie "${subcat.title}": ${subcatErr.message}`);
          }
        }
      } catch (catErr) {
        errors.push(`Catégorie "${cat.title}": ${catErr.message}`);
      }
    }

    loadBoard(boardId, db);

    setTimeout(() => {
      if (useFormDestination === 'board2') {
        navigate('/board2');
      } else {
        navigate(`/board/${boardId}`);
      }
      setIsUseFormLoading(false);

      console.log(
        '[DEBUG] Final counts - cardsAdded:',
        cardsAdded,
        'categoriesAdded:',
        categoriesAdded,
        'subcategoriesAdded:',
        subcategoriesAdded
      );
      console.log('[DEBUG] errors:', errors);

      let message = '';
      const hasNewCards = cardsAdded > 0;
      const hasNewCategories = categoriesAdded > 0;
      const hasNewSubcats = subcategoriesAdded > 0;

      if (errors.length === 0) {
        if (hasNewCards || hasNewCategories || hasNewSubcats) {
          message = 'Opération terminée !';
          if (hasNewCards) {
            message += `\n${cardsAdded} carte(s) créée(s)`;
          }
          if (hasNewCategories) {
            message += `\n${categoriesAdded} catégorie(s) créée(s)`;
          }
          if (hasNewSubcats) {
            message += `\n${subcategoriesAdded} sous-catégorie(s) ajoutée(s)`;
          }
        } else {
          message =
            "Aucun élément ajouté :\n- Les éléments sélectionnés existent déjà dans le projet\n- Ou aucun élément n'a été sélectionné";
        }
      } else {
        message = 'Opération terminée avec avertissements :\n';
        if (hasNewCards) {
          message += `\n${cardsAdded} carte(s) créée(s)`;
        }
        if (hasNewCategories) {
          message += `\n${categoriesAdded} catégorie(s) créée(s)`;
        }
        if (hasNewSubcats) {
          message += `\n${subcategoriesAdded} sous-catégorie(s) ajoutée(s)`;
        }
        if (errors.length > 0) {
          message += `\n\nÉléments non copiés (doublons) :\n${errors.join('\n')}`;
        }
      }
      alert(message);
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

  if (!libraryOpen && !standalone) return null;

  if (libraryViewMode === 'main' || standalone) {
    const favCards = favorites?.cards || [];
    const favCategories = favorites?.categories || [];
    const favSubcategories = favorites?.subcategories || [];

    const filteredCards = cardItems.filter(item => {
      if (filter === 'favorites') {
        const isFav =
          favCards.some(id => String(id) === String(item.id)) ||
          favCategories.some(c => String(c.cardId) === String(item.id)) ||
          favSubcategories.some(s => String(s.cardId) === String(item.id));

        if (!isFav) return false;
      }
      const itemTags = item.tags || '';
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        itemTags.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });

    let categories = selectedLibraryCard ? getCardCategories(selectedLibraryCard) : [];
    const skipAction = selectedLibraryCard ? getCardSkipAction(selectedLibraryCard) : false;
    let directSubcategories = [];

    if (skipAction && selectedLibraryCard) {
      directSubcategories = getCardSubcategories(selectedLibraryCard);
      if (filter === 'favorites' && selectedLibraryCard) {
        const cardId = selectedLibraryCard.id;
        const favSubs = favorites?.subcategories || [];
        directSubcategories = directSubcategories.filter(sub =>
          favSubs.some(s => String(s.cardId) === String(cardId) && s.title === sub.title)
        );
      }
    }

    // Filter categories and subcategories when in favorites mode
    if (filter === 'favorites' && selectedLibraryCard) {
      const cardId = selectedLibraryCard.id;
      const favCats = favorites?.categories || [];
      const favSubs = favorites?.subcategories || [];
      categories = categories.filter(cat => {
        // Show only if category is favorite
        if (favCats.some(c => String(c.cardId) === String(cardId) && c.title === cat.title))
          return true;
        // Show if any subcategory is favorite
        if (
          (cat.subcategories || []).some(sub =>
            favSubs.some(
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

    const filteredSubcategories = selectedLibraryCategory
      ? getCategorySubcategories(selectedLibraryCategory).filter(sub => {
          if (filter !== 'favorites') return true;
          const favSubs = favorites?.subcategories || [];
          return favSubs.some(
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
        <div className={standalone ? 'h-full flex flex-col' : 'p-6 h-full flex flex-col'}>
          {!standalone && (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bibliothèque</h1>
            </div>
          )}

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
            {(selectedCards.length > 0 ||
              selectedCategories.length > 0 ||
              selectedSubcategories.length > 0) && (
              <button
                onClick={() => {
                  setSelectedCards([]);
                  setSelectedCategories([]);
                  setSelectedSubcategories([]);
                }}
                className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                Tout désélectionner
              </button>
            )}
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
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowTemplatesList(!showTemplatesList)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                  showTemplatesList
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Mes Templates ({templates.length})
              </button>
              <button
                onClick={() => {
                  setTemplateName('');
                  setShowTemplateModal(true);
                }}
                disabled={
                  selectedCards.length === 0 &&
                  selectedCategories.length === 0 &&
                  selectedSubcategories.length === 0
                }
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Template
              </button>
              <button
                onClick={handleExportTemplates}
                disabled={templates.length === 0}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Exporter
              </button>
              <button
                onClick={() => {
                  setImportFile(null);
                  setImportTemplatesList([]);
                  setSelectedImportTemplates([]);
                  setShowImportModal(true);
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
              >
                <Upload size={16} />
                Importer
              </button>
            </div>
          </div>

          {(selectedCards.length > 0 ||
            selectedCategories.length > 0 ||
            selectedSubcategories.length > 0) && (
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Sélection: {selectedCards.length} carte(s), {selectedCategories.length}{' '}
                  catégorie(s), {selectedSubcategories.length} sous-catégorie(s)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCards([]);
                      setSelectedCategories([]);
                      setSelectedSubcategories([]);
                    }}
                    className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    Tout désélectionner
                  </button>
                  <button
                    onClick={() => setShowUseForm(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Utiliser
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Boutons des Templates - visibles au-dessus des colonnes */}
          {showTemplatesList && templates.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleLoadTemplate(template)}
                  className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-700 flex items-center gap-2"
                >
                  {template.name}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                    className="p-0.5 text-purple-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Cartes ({filteredCards.length})
              </h2>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredCards.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {filter === 'favorites' ? 'Aucun favori' : 'Aucune carte'}
                  </p>
                ) : (
                  filteredCards.map(item => {
                    const isSelected = selectedCards.some(c => c.id === item.id);
                    const cardSkipAction = getCardSkipAction(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                          isSelected
                            ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/40 dark:border-blue-500'
                            : selectedLibraryCard?.id === item.id
                              ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <div
                          className={`mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            toggleCardWithChildren(item);
                          }}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate text-gray-800 dark:text-white flex-1">
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
                                <span key={i} className="text-xs text-gray-500">
                                  #{tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {skipAction ? 'Tâches' : 'Catégories'}
              </h2>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {!selectedLibraryCard ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Sélectionnez une carte</p>
                ) : skipAction ? (
                  directSubcategories.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune tâche</p>
                  ) : (
                    directSubcategories.map((subcat, idx) => {
                      const isSelected = selectedSubcategories.some(
                        s => s.title === subcat.title && s.cardTitle === selectedLibraryCard?.title
                      );
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                            isSelected
                              ? 'bg-green-100 border-green-500 dark:bg-green-900/40 dark:border-green-500'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300'
                          }`}
                        >
                          <div
                            className={`mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            onClick={e => {
                              e.stopPropagation();
                              toggleSubcategoryDirect(
                                subcat,
                                selectedLibraryCard?.title,
                                subcat.categoryTitle
                              );
                            }}
                          >
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm text-gray-800 dark:text-white flex-1">
                                {subcat.title}
                              </h4>
                              {isSubcategoryFavoriteSimple(
                                selectedLibraryCard.id,
                                subcat.title
                              ) && (
                                <Star
                                  size={14}
                                  className="text-yellow-500 flex-shrink-0"
                                  fill="currentColor"
                                />
                              )}
                            </div>
                            {subcat.categoryTitle && (
                              <p className="text-xs text-gray-500 mt-1">{subcat.categoryTitle}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : categories.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune catégorie</p>
                ) : (
                  categories.map((cat, idx) => {
                    const isSelected = selectedCategories.some(
                      c => c.title === cat.title && c.cardTitle === selectedLibraryCard?.title
                    );
                    return (
                      <div
                        key={idx}
                        onClick={() => handleCategoryClick(cat)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                          isSelected
                            ? 'bg-green-100 border-green-500 dark:bg-green-900/40 dark:border-green-500'
                            : selectedLibraryCategory?.title === cat.title
                              ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-600'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div
                          className={`mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            toggleCategoryWithChildren(cat, selectedLibraryCard?.title);
                          }}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-800 dark:text-white flex-1">
                              {cat.title}
                            </h4>
                            {isCategoryFavorite(selectedLibraryCard.id, cat.title) && (
                              <Star
                                size={14}
                                className="text-yellow-500 flex-shrink-0"
                                fill="currentColor"
                              />
                            )}
                          </div>
                          {(cat.subcategories || []).length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {cat.subcategories.length} sous-catégorie(s)
                            </p>
                          )}
                          {cat.tag && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs text-gray-500">#{cat.tag}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {skipAction ? '' : 'Sous-catégories'}
              </h2>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {skipAction ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Les tâches sont affichées dans la colonne de gauche
                  </p>
                ) : !selectedLibraryCategory ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Sélectionnez une catégorie
                  </p>
                ) : filteredSubcategories.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune sous-catégorie</p>
                ) : (
                  filteredSubcategories.map((subcat, idx) => {
                    const isSelected = selectedSubcategories.some(
                      s =>
                        s.title === subcat.title &&
                        s.categoryTitle === selectedLibraryCategory?.title &&
                        s.cardTitle === selectedLibraryCard?.title
                    );
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                          isSelected
                            ? 'bg-orange-100 border-orange-500 dark:bg-orange-900/40 dark:border-orange-500'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300'
                        }`}
                      >
                        <div
                          className={`mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            toggleSubcategorySelection(
                              subcat,
                              selectedLibraryCategory?.title,
                              selectedLibraryCard?.title
                            );
                          }}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-gray-800 dark:text-white flex-1">
                              {subcat.title}
                            </h4>
                            {isSubcategoryFavorite(
                              selectedLibraryCard?.id,
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
                      </div>
                    );
                  })
                )}
              </div>
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
                    disabled={isUseFormLoading}
                    className="px-4 py-2 text-secondary hover:text-primary hover:bg-card rounded-lg transition-std disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleMainViewConfirmUse}
                    disabled={isUseFormLoading}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-std disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUseFormLoading && (
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {isUseFormLoading ? 'Ajout en cours...' : 'Confirmer'}
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

        {/* Modal Sauvegarder Template */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Sauvegarder comme template
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du template
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="Mon template..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Résumé de la sélection :
                  </p>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedCards.length > 0 && <li>- {selectedCards.length} carte(s)</li>}
                    {selectedCategories.length > 0 && (
                      <li>- {selectedCategories.length} catégorie(s)</li>
                    )}
                    {selectedSubcategories.length > 0 && (
                      <li>- {selectedSubcategories.length} sous-catégorie(s)</li>
                    )}
                    {selectedCards.length === 0 &&
                      selectedCategories.length === 0 &&
                      selectedSubcategories.length === 0 && <li>Aucun élément sélectionné</li>}
                  </ul>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importer Templates */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Importer des templates
              </h3>
              <div className="space-y-4">
                {!importFile ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sélectionner un fichier JSON
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Fichier : <span className="font-medium">{importFile.name}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {importTemplatesList.length} template(s) trouvé(s)
                      </p>
                    </div>
                    {importTemplatesList.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sélectionnez les templates à importer :
                        </p>
                        {importTemplatesList.map(template => (
                          <label
                            key={template.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedImportTemplates.includes(template.id)}
                              onChange={() => toggleImportTemplate(template.id)}
                              className="w-4 h-4 accent-purple-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {template.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {template.cards?.length || 0} carte(s),{' '}
                                {template.categories?.length || 0} catégorie(s),{' '}
                                {template.subcategories?.length || 0} sous-catégorie(s)
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportTemplatesList([]);
                      setSelectedImportTemplates([]);
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  {importFile && (
                    <button
                      onClick={handleConfirmImport}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Importer la sélection
                    </button>
                  )}
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
                    const favCats = favorites?.categories || [];
                    const favSubs = favorites?.subcategories || [];
                    categories = categories.filter(cat => {
                      // Show only if category is favorite
                      if (
                        favCats.some(
                          c => String(c.cardId) === String(cardId) && c.title === cat.title
                        )
                      )
                        return true;
                      // Show if any subcategory is favorite
                      if (
                        (cat.subcategories || []).some(sub =>
                          favSubs.some(
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
                const favSubs = favorites?.subcategories || [];

                // Filter subcategories when in favorites mode
                if (filter === 'favorites') {
                  subcategories = subcategories.filter(sub =>
                    favSubs.some(
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
