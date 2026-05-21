import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useLibraryTemplates } from '../../hooks/useLibraryTemplates';
import { useLibraryFavorites } from '../../hooks/useLibraryFavorites';
import { useLibraryUseForm } from '../../hooks/useLibraryUseForm';
import { useLibrarySelection } from '../../hooks/useLibrarySelection';
import { useLibraryNavigation } from '../../hooks/useLibraryNavigation';
import { useLibraryAddForm } from '../../hooks/useLibraryAddForm';
import { LibraryEventListener } from './LibraryEventListener';
import {
  getCardCategories,
  getCardSkipAction,
  getCardSubcategories,
  getCategorySubcategories,
} from './libraryUtils';
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

  // =============================================================================
  // SECTION: STATE (useState hooks - ~40 states)
  // =============================================================================

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [isDragOver, setIsDragOver] = useState(false);
  const {
    showUseForm, setShowUseForm,
    useFormBoardId, setUseFormBoardId,
    useFormColumnId, setUseFormColumnId,
    useFormDestination, setUseFormDestination,
    isUseFormLoading,
    handleMainViewConfirmUse,
  } = useLibraryUseForm();
  const {
    favorites,
    expandedCards,
    expandedCategories,
    toggleCardFavorite,
    toggleCategoryFavorite,
    toggleSubcategoryFavorite,
    toggleCardExpanded,
    toggleCategoryExpanded,
    isCardFavorite,
    isCategoryFavorite,
    isSubcategoryFavorite,
    isSubcategoryFavoriteSimple,
  } = useLibraryFavorites();

  const {
    templates,
    showTemplateModal, setShowTemplateModal,
    templateName, setTemplateName,
    showImportModal, setShowImportModal,
    importFile,
    importTemplatesList,
    selectedImportTemplates,
    showTemplatesList, setShowTemplatesList,
    handleSaveTemplate,
    handleLoadTemplate,
    handleDeleteTemplate,
    handleExportTemplates,
    handleImportFileSelect,
    handleConfirmImport,
    toggleImportTemplate,
  } = useLibraryTemplates();

  const cardItems = libraryItems.filter(item => item.type === 'card');

  const {
    selectedCards, setSelectedCards,
    selectedCategories, setSelectedCategories,
    selectedSubcategories, setSelectedSubcategories,
    isCardSelected, isCategorySelected, isSubcategorySelected,
    toggleCardOnly, toggleCardWithChildren,
    toggleCategoryOnly, toggleCategoryWithChildren, toggleCategorySelection,
    toggleSubcategoryOnly, toggleSubcategoryDirect, toggleSubcategorySelection,
  } = useLibrarySelection(libraryItems);

  const {
    selectedLibraryCard, setSelectedLibraryCard,
    selectedLibraryCategory, setSelectedLibraryCategory,
    viewMode, panelSelectedCard, panelSelectedCategory,
    handleCardClick, handleCategoryClick, handleBackToCards, handleBackToCategories,
    handlePanelCardClick, handlePanelCategoryClick, handlePanelBackToCards, handlePanelBackToCategories,
    getPanelCardCategories, getPanelCategorySubcategories,
  } = useLibraryNavigation();

  const {
    showAddForm, setShowAddForm,
    newItemTitle, setNewItemTitle,
    newItemType, setNewItemType,
    newItemParentCard, setNewItemParentCard,
    newItemParentCategory, setNewItemParentCategory,
    handleSaveToLibrary,
  } = useLibraryAddForm(saveToLibrary, loadLibrary, cardItems);

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

  const handleTagClick = tag => {
    setSearch(tag);
  };

  const handleDelete = async id => {
    if (window.confirm('Voulez-vous vraiment supprimer ce modèle ?')) {
      await deleteLibraryItem(id);
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
                  onClick={() => handleLoadTemplate(template, setSelectedCards, setSelectedCategories, setSelectedSubcategories)}
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
                            {!cardSkipAction && (
                              <span className="px-1.5 py-0.5 text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded">
                                C
                              </span>
                            )}
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
                    onClick={() => handleMainViewConfirmUse(selectedCards, selectedCategories, selectedSubcategories)}
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
                    onClick={() => handleSaveTemplate(selectedCards, selectedCategories, selectedSubcategories)}
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
      {/* ============================================================================= */}
      {/* SECTION: EN-TÊTE ET RECHERCHE (lignes 2562-1610) */}
      {/* ============================================================================= */}
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
                    onClick={() => handleMainViewConfirmUse(selectedCards, selectedCategories, selectedSubcategories)}
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

// =============================================================================
// FIN DU COMPOSANT
// =============================================================================

export default LibraryPanel;
