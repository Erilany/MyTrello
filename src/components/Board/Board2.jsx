import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import Exchange from '../Exchange/Exchange';
import { libraryTemplates } from '../../data/libraryData';
import { addBusinessDays, subtractBusinessDays, getWeekNumber } from '../../utils/dateUtils';
import {
  getGanttDateRange as utilsGetGanttDateRange,
  getGanttDays as utilsGetGanttDays,
  getTaskBarPosition as utilsGetTaskBarPosition,
} from '../../utils/ganttUtils';
import { generateMSProjectXML, calculateDuration, formatDuration } from '../../utils/xmlUtils';

import {
  Plus,
  Archive,
  ListTodo,
  Calendar,
  MessageSquare,
  ShoppingCart,
  Info,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  PlusCircle,
  User,
  Building,
  Star,
  Filter,
  Download,
  GripVertical,
} from 'lucide-react';

const FAVORITES_KEY = 'mytrello_library_favorites';

function Board2() {
  const {
    currentBoard,
    archiveBoard,
    canArchiveBoard,
    getUnreadCount,
    libraryItems,
    cards,
    categories,
    subcategories,
    columns,
    setSelectedCard,
    setSelectedSubcategory,
    updateSubcategory,
    createSubcategory,
    deleteSubcategory,
    updateCategory,
    createCard,
    createCategory,
    loadBoard,
    db,
  } = useApp();
  const [activeTab, setActiveTab] = useState('taches');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedCategoryForTasks, setSelectedCategoryForTasks] = useState(null);
  const [milestoneSortOrder, setMilestoneSortOrder] = useState('asc');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingCategoryTitle, setEditingCategoryTitle] = useState('');

  const [planningSelectedTasks, setPlanningSelectedTasks] = useState([]);

  const [expandedPlanningChapters, setExpandedPlanningChapters] = useState(new Set());
  const [expandedPlanningCards, setExpandedPlanningCards] = useState(new Set());
  const [expandedPlanningCategories, setExpandedPlanningCategories] = useState(new Set());

  const [planningSortOrder, setPlanningSortOrder] = useState('date');
  const [ganttZoom, setGanttZoom] = useState('week');
  const [ganttStartDate, setGanttStartDate] = useState(null);
  const [ganttStartDateInput, setGanttStartDateInput] = useState(0);

  useEffect(() => {
    if (activeTab === 'planning' && currentBoard?.id) {
      const boardId = currentBoard.id;
      const chapters = JSON.parse(
        localStorage.getItem(`planning_expanded_${boardId}_chapters`) || '[]'
      );
      const cards = JSON.parse(localStorage.getItem(`planning_expanded_${boardId}_cards`) || '[]');
      const categories = JSON.parse(
        localStorage.getItem(`planning_expanded_${boardId}_categories`) || '[]'
      );
      setExpandedPlanningChapters(new Set(chapters));
      setExpandedPlanningCards(new Set(cards));
      setExpandedPlanningCategories(new Set(categories));

      const selectedTasks = JSON.parse(
        localStorage.getItem(`planning_selected_${boardId}`) || '[]'
      );
      setPlanningSelectedTasks(selectedTasks);
    }
  }, [activeTab, currentBoard?.id]);

  const savePlanningExpandedState = (type, key, isExpanded) => {
    if (!currentBoard?.id) return;
    const storageKey = `planning_expanded_${currentBoard.id}_${type}`;
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (isExpanded) {
      if (!saved.includes(key)) saved.push(key);
    } else {
      const idx = saved.indexOf(key);
      if (idx > -1) saved.splice(idx, 1);
    }
    localStorage.setItem(storageKey, JSON.stringify(saved));
  };

  const savePlanningSelectedTasks = taskIds => {
    if (!currentBoard?.id) return;
    localStorage.setItem(`planning_selected_${currentBoard.id}`, JSON.stringify(taskIds));
  };

  const centerGanttOnTask = task => {
    try {
      if (task.start_date || task.due_date) {
        const targetDate = task.start_date ? new Date(task.start_date) : new Date(task.due_date);
        const today = new Date();
        const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        setGanttStartDateInput(daysDiff);
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + daysDiff - 30);
        setGanttStartDate(baseDate.toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Error centering on task:', err);
    }
  };

  const getProjectTasks = () => {
    const boardColumns = columns.filter(col => Number(col.board_id) === Number(currentBoard?.id));
    const boardColumnIds = boardColumns.map(col => col.id);

    const projectSubcategories = subcategories.filter(sub => {
      const category = categories.find(c => Number(c.id) === Number(sub.category_id));
      if (!category) return false;
      const card = cards.find(c => Number(c.id) === Number(category.card_id));
      if (!card) return false;
      // Card belongs to board if column_id is in board columns OR column_id is null/undefined
      return (
        boardColumnIds.includes(Number(card.column_id)) ||
        !card.column_id ||
        card.column_id === null
      );
    });
    return projectSubcategories.map(sub => {
      const category = categories.find(c => Number(c.id) === Number(sub.category_id));
      const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
      return { ...sub, category, card };
    });
  };

  const getSelectedTasks = () => {
    const allTasks = getProjectTasks();
    if (planningSelectedTasks.length === 0) return allTasks;
    return allTasks.filter(t => planningSelectedTasks.includes(t.id));
  };

  const togglePlanningTask = taskId => {
    const newSelection = planningSelectedTasks.includes(taskId)
      ? planningSelectedTasks.filter(id => id !== taskId)
      : [...planningSelectedTasks, taskId];
    setPlanningSelectedTasks(newSelection);
    savePlanningSelectedTasks(newSelection);
  };

  const selectAllTasks = () => {
    const allTaskIds = getProjectTasks().map(t => t.id);
    setPlanningSelectedTasks(allTaskIds);
    savePlanningSelectedTasks(allTaskIds);
  };

  const deselectAllTasks = () => {
    setPlanningSelectedTasks([]);
    savePlanningSelectedTasks([]);
  };

  const [showTaskSelector, setShowTaskSelector] = useState(false);

  const handleExportMSProject = () => {
    const tasks = getSelectedTasks();
    if (tasks.length === 0) {
      alert('Aucune tâche sélectionnée');
      return;
    }

    const projectName = currentBoard?.title || 'Projet';
    const xml = generateMSProjectXML(tasks, projectName);

    if (!xml) return;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_planning.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTaskStatusColor = status => {
    switch (status) {
      case 'done':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'waiting':
        return 'bg-blue-500';
      case 'todo':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getGroupedTasks = () => {
    const tasks = getSelectedTasks();
    const groups = {};

    tasks.forEach(task => {
      const card = task.card || {};
      const category = task.category || {};
      const chapter = card.chapter || 'Sans chapitre';
      const cardId = card.id || 'nocard';
      const categoryId = category.id || 'nocategory';

      if (!groups[chapter]) {
        groups[chapter] = {};
      }
      if (!groups[chapter][cardId]) {
        groups[chapter][cardId] = {
          card,
          categories: {},
        };
      }
      if (!groups[chapter][cardId].categories[categoryId]) {
        groups[chapter][cardId].categories[categoryId] = {
          category,
          tasks: [],
        };
      }
      groups[chapter][cardId].categories[categoryId].tasks.push(task);
    });

    return groups;
  };

  const getPlanningFlatList = () => {
    const grouped = getGroupedTasks();
    const flatList = [];
    let uniqueId = 0;

    Object.entries(grouped).forEach(([chapter, cards]) => {
      const chapterKey = `chapter-${chapter}`;
      const isChapterExpanded = expandedPlanningChapters.has(chapter);
      const chapterTaskCount = Object.values(cards).reduce(
        (sum, c) => sum + Object.values(c.categories).reduce((s, cat) => s + cat.tasks.length, 0),
        0
      );

      flatList.push({
        type: 'chapter',
        key: chapterKey,
        title: chapter,
        count: chapterTaskCount,
        expanded: isChapterExpanded,
      });

      if (isChapterExpanded) {
        Object.entries(cards).forEach(([cardId, cardData]) => {
          const cardKey = `card-${chapter}-${cardId}`;
          const isCardExpanded = expandedPlanningCards.has(`card-${cardId}`);
          const cardTaskCount = Object.values(cardData.categories).reduce(
            (sum, cat) => sum + cat.tasks.length,
            0
          );

          flatList.push({
            type: 'card',
            key: cardKey,
            title: cardData.card?.title || 'Sans titre',
            count: cardTaskCount,
            expanded: isCardExpanded,
            parentKey: chapterKey,
          });

          if (isCardExpanded) {
            Object.entries(cardData.categories).forEach(([catId, catData]) => {
              const catKey = `cat-${catId}`;
              const isCatExpanded = expandedPlanningCategories.has(catKey);

              flatList.push({
                type: 'category',
                key: catKey,
                title: catData.category?.title || 'Sans catégorie',
                count: catData.tasks.length,
                expanded: isCatExpanded,
                parentKey: cardKey,
                tasks: catData.tasks,
              });

              if (isCatExpanded) {
                catData.tasks.forEach(task => {
                  flatList.push({ type: 'task', key: `task-${task.id}`, task });
                });
              }
            });
          }
        });
      }
    });

    return flatList;
  };

  const getSortedTasks = () => {
    const tasks = getSelectedTasks();
    if (planningSortOrder === 'date') {
      return [...tasks].sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date) : new Date('2099-01-01');
        const dateB = b.start_date ? new Date(b.start_date) : new Date('2099-01-01');
        return dateA - dateB;
      });
    } else {
      return tasks;
    }
  };

  const getGanttDateRange = () => {
    const tasks = getSelectedTasks();
    return utilsGetGanttDateRange(tasks, ganttStartDate);
  };

  const getGanttDays = () => {
    const tasks = getSelectedTasks();
    return utilsGetGanttDays(tasks, ganttStartDate);
  };

  const getTaskBarPosition = task => {
    const tasks = getSelectedTasks();
    return utilsGetTaskBarPosition(task, tasks, ganttStartDate);
  };

  const tabs = [
    { id: 'informations', label: 'Informations', icon: Info },
    { id: 'taches', label: 'Tâches', icon: ListTodo },
    { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'echanges', label: 'Échanges', icon: MessageSquare },
  ];

  const [board2Data, setBoard2Data] = useState({
    cards: [],
  });

  const [newCardTitle, setNewCardTitle] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardTitle, setEditingCardTitle] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(null);
  const [newSubcategoryTitle, setNewSubcategoryTitle] = useState('');
  const [showAddSubcategory, setShowAddSubcategory] = useState(null);

  const [favorites, setFavorites] = useState({ cards: [], categories: [], subcategories: [] });

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavorites({
          cards: parsed.cards || [],
          categories: parsed.categories || [],
          subcategories: parsed.subcategories || [],
        });
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleFavoritesUpdate = () => {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFavorites({
            cards: parsed.cards || [],
            categories: parsed.categories || [],
            subcategories: parsed.subcategories || [],
          });
        } catch (e) {
          console.error('Error reloading favorites:', e);
        }
      }
    };
    window.addEventListener('library-favorites-updated', handleFavoritesUpdate);
    return () => window.removeEventListener('library-favorites-updated', handleFavoritesUpdate);
  }, []);

  const saveFavorites = newFavorites => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    window.dispatchEvent(new Event('library-favorites-updated'));
  };

  const toggleCardFavorite = (e, cardId, cardTitle) => {
    e.stopPropagation();
    const newFavorites = { ...favorites };
    if (newFavorites.cards.includes(cardId)) {
      newFavorites.cards = newFavorites.cards.filter(id => id !== cardId);
    } else {
      newFavorites.cards.push(cardId);
    }
    saveFavorites(newFavorites);
  };

  const toggleCategoryFavorite = (e, categoryId, cardId, categoryTitle) => {
    e.stopPropagation();
    const newFavorites = { ...favorites };
    const existing = newFavorites.categories.find(
      c => c.cardId === cardId && c.title === categoryTitle
    );
    if (existing) {
      newFavorites.categories = newFavorites.categories.filter(
        c => !(c.cardId === cardId && c.title === categoryTitle)
      );
    } else {
      const card = cards.find(c => Number(c.id) === Number(cardId));
      newFavorites.categories.push({ cardId, cardTitle: card?.title || '', title: categoryTitle });
      if (!newFavorites.cards.includes(cardId)) {
        newFavorites.cards.push(cardId);
      }
    }
    saveFavorites(newFavorites);
  };

  const toggleSubcategoryFavorite = (
    e,
    subcategoryId,
    cardId,
    categoryId,
    subcategoryTitle,
    categoryTitle
  ) => {
    e.stopPropagation();
    const newFavorites = { ...favorites };
    const card = cards.find(c => Number(c.id) === Number(cardId));
    const existing = newFavorites.subcategories.find(
      s => s.cardId === cardId && s.categoryTitle === categoryTitle && s.title === subcategoryTitle
    );
    if (existing) {
      newFavorites.subcategories = newFavorites.subcategories.filter(
        s =>
          !(
            s.cardId === cardId &&
            s.categoryTitle === categoryTitle &&
            s.title === subcategoryTitle
          )
      );
    } else {
      newFavorites.subcategories.push({
        cardId,
        cardTitle: card?.title || '',
        categoryTitle,
        title: subcategoryTitle,
      });
      if (!newFavorites.categories.find(c => c.cardId === cardId && c.title === categoryTitle)) {
        newFavorites.categories.push({
          cardId,
          cardTitle: card?.title || '',
          title: categoryTitle,
        });
      }
      if (!newFavorites.cards.includes(cardId)) {
        newFavorites.cards.push(cardId);
      }
    }
    saveFavorites(newFavorites);
  };

  const isCardFavorite = cardId => favorites.cards.includes(cardId);
  const isCategoryFavorite = (categoryId, cardId, categoryTitle) =>
    favorites.categories.some(c => c.cardId === cardId && c.title === categoryTitle);
  const isSubcategoryFavorite = (subcategoryId, cardId, categoryTitle, subcategoryTitle) =>
    favorites.subcategories.some(
      s => s.cardId === cardId && s.categoryTitle === categoryTitle && s.title === subcategoryTitle
    );

  const [links, setLinks] = useState([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'web', color: '#22C55E' });

  const [eotpLines, setEotpLines] = useState([]);
  const [internalContacts, setInternalContacts] = useState([
    { id: 1, title: 'Manager de projets' },
    { id: 2, title: 'Chargé(e) de Concertation' },
    { id: 3, title: "Chargé(e) d'Etudes LA" },
    { id: 4, title: "Chargé(e) d'Etudes LS" },
    { id: 5, title: "Chargé(e) d'Etudes Poste HT" },
    { id: 6, title: "Chargé(e) d'Etudes Poste BT et CC" },
    { id: 7, title: "Chargé(e) d'Etudes SPC" },
    { id: 8, title: 'Contrôleur Travaux' },
    { id: 9, title: 'Assistant(e) Etudes' },
  ]);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [newInternalTitle, setNewInternalTitle] = useState('');
  const [externalContacts, setExternalContacts] = useState([]);

  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedAvenant, setSelectedAvenant] = useState(null);
  const [showAddCommande, setShowAddCommande] = useState(false);
  const [newCommandeTitle, setNewCommandeTitle] = useState('');
  const [activeTabCommande, setActiveTabCommande] = useState('affectation');

  useEffect(() => {
    if (currentBoard) {
      const savedLinks = localStorage.getItem(`board-${currentBoard.id}-links`);
      if (savedLinks) {
        setLinks(JSON.parse(savedLinks));
      }
      const savedCommandes = localStorage.getItem(`board-${currentBoard.id}-commandes`);
      if (savedCommandes) {
        setCommandes(JSON.parse(savedCommandes));
      }
      const savedEotp = localStorage.getItem(`board-${currentBoard.id}-eotp`);
      if (savedEotp) {
        setEotpLines(JSON.parse(savedEotp));
      }
      const savedInternal = localStorage.getItem(`board-${currentBoard.id}-internalContacts`);
      if (savedInternal) {
        const parsed = JSON.parse(savedInternal);
        if (parsed.length > 0) {
          setInternalContacts(parsed);
        }
      }
      const savedExternal = localStorage.getItem(`board-${currentBoard.id}-externalContacts`);
      if (savedExternal) {
        setExternalContacts(JSON.parse(savedExternal));
      }
    }
  }, [currentBoard]);

  useEffect(() => {
    if (currentBoard && links.length > 0) {
      localStorage.setItem(`board-${currentBoard.id}-links`, JSON.stringify(links));
    }
  }, [links, currentBoard]);

  useEffect(() => {
    if (currentBoard && commandes.length > 0) {
      localStorage.setItem(`board-${currentBoard.id}-commandes`, JSON.stringify(commandes));
    }
  }, [commandes, currentBoard]);

  useEffect(() => {
    if (currentBoard && eotpLines.length > 0) {
      localStorage.setItem(`board-${currentBoard.id}-eotp`, JSON.stringify(eotpLines));
    }
  }, [eotpLines, currentBoard]);

  useEffect(() => {
    if (currentBoard && internalContacts.length > 0) {
      localStorage.setItem(
        `board-${currentBoard.id}-internalContacts`,
        JSON.stringify(internalContacts)
      );
    }
  }, [internalContacts, currentBoard]);

  useEffect(() => {
    if (currentBoard && externalContacts.length > 0) {
      localStorage.setItem(
        `board-${currentBoard.id}-externalContacts`,
        JSON.stringify(externalContacts)
      );
    }
  }, [externalContacts, currentBoard]);

  const toggleCardExpanded = cardId => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const addCardToBoard2 = cardTitle => {
    const newCard = {
      id: `card-${Date.now()}`,
      title: cardTitle,
      categories: [],
    };
    setBoard2Data(prev => ({
      ...prev,
      cards: [...prev.cards, newCard],
    }));
    setNewCardTitle('');
    setShowAddCard(false);
  };

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      addCardToBoard2(newCardTitle.trim());
    }
  };

  const handleDeleteCard = cardId => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== cardId),
    }));
  };

  const handleRenameCard = (cardId, newTitle) => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => (c.id === cardId ? { ...c, title: newTitle } : c)),
    }));
    setEditingCardId(null);
  };

  const handleAddCategory = cardId => {
    if (!newCategoryTitle.trim()) return;
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: [
              ...(c.categories || []),
              { id: `cat-${Date.now()}`, title: newCategoryTitle.trim(), subcategories: [] },
            ],
          };
        }
        return c;
      }),
    }));
    setNewCategoryTitle('');
    setShowAddCategory(null);
  };

  const handleDeleteCategory = (cardId, categoryId) => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: (c.categories || []).filter(cat => cat.id !== categoryId),
          };
        }
        return c;
      }),
    }));
  };

  const handleAddSubcategory = (cardId, categoryId) => {
    if (!newSubcategoryTitle.trim()) return;
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: (c.categories || []).map(cat => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  subcategories: [
                    ...(cat.subcategories || []),
                    { id: `subcat-${Date.now()}`, title: newSubcategoryTitle.trim() },
                  ],
                };
              }
              return cat;
            }),
          };
        }
        return c;
      }),
    }));
    setNewSubcategoryTitle('');
    setShowAddSubcategory(null);
  };

  const handleDeleteSubcategory = (cardId, categoryId, subcategoryId) => {
    setBoard2Data(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            categories: (c.categories || []).map(cat => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  subcategories: (cat.subcategories || []).filter(sub => sub.id !== subcategoryId),
                };
              }
              return cat;
            }),
          };
        }
        return c;
      }),
    }));
  };

  const handleArchiveBoard = () => {
    if (!currentBoard) return;
    const { canArchive, reason } = canArchiveBoard(currentBoard.id);
    if (!canArchive) {
      alert(reason);
      return;
    }
    if (window.confirm(`Voulez-vous archiver le projet "${currentBoard.title}" ?`)) {
      archiveBoard(currentBoard.id);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          {currentBoard?.description && (
            <p className="text-sm text-secondary mb-2">{currentBoard.description}</p>
          )}
        </div>
        {currentBoard && (
          <button
            onClick={handleArchiveBoard}
            className="flex items-center px-3 py-1.5 text-sm bg-card hover:bg-card-hover border border-std rounded transition-std text-secondary"
          >
            <Archive size={14} className="mr-2" />
            Archiver
          </button>
        )}
      </div>

      <div className="flex border-b border-std mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const unreadCount =
            tab.id === 'echanges' && currentBoard ? getUnreadCount(currentBoard.id) : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-std ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary hover:border-std'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {tab.label}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-urgent text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'taches' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-full">
            <div className="mb-4 flex flex-wrap gap-2">
              {(() => {
                const chaptersFromTemplates = libraryTemplates
                  .map(item => {
                    const tagsStr = item.tags || '';
                    const tags = tagsStr.split(',');
                    return tags[0];
                  })
                  .filter(Boolean);
                const chaptersFromCards = cards.map(card => card.chapter).filter(Boolean);
                const chapterOrder = [
                  'Jalons',
                  'Processus décisionnels',
                  'Proccessus Décisionnel',
                  'Etudes',
                  'Procédures administratives',
                  'Procédures Administratives',
                  'Achats',
                  'Consignations',
                  'Travaux',
                  'Projet',
                ];
                const allChapters = [
                  ...new Set([...chaptersFromTemplates, ...chaptersFromCards]),
                ].sort((a, b) => {
                  const indexA = chapterOrder.indexOf(a);
                  const indexB = chapterOrder.indexOf(b);
                  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                });
                return allChapters.map((chapter, idx) => {
                  const hasCards = cards.some(card => card.chapter === chapter);
                  const hasCategories =
                    hasCards &&
                    categories.some(cat => {
                      const card = cards.find(c => c.chapter === chapter);
                      return card && Number(cat.card_id) === Number(card.id);
                    });
                  const isEmpty = !hasCards || !hasCategories;
                  const isAfterProcessus =
                    idx > 0 && allChapters[idx - 1]?.toLowerCase().includes('processus');
                  return (
                    <button
                      key={chapter}
                      onClick={() => !isEmpty && setSelectedChapter(chapter)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        selectedChapter === chapter
                          ? 'bg-accent text-white'
                          : isEmpty
                            ? 'bg-card border border-std text-muted opacity-50 cursor-not-allowed'
                            : 'bg-card border border-std text-secondary hover:bg-card-hover'
                      }`}
                      style={isAfterProcessus ? { marginLeft: '2rem' } : {}}
                      title={isEmpty ? "Ce chapitre n'a pas d'actions" : chapter}
                    >
                      {chapter}
                    </button>
                  );
                });
              })()}
            </div>

            {selectedChapter ? (
              <div className="bg-card rounded-lg border border-std p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-primary">{selectedChapter}</h2>
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="text-sm text-secondary hover:text-primary"
                  >
                    Fermer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards &&
                    cards
                      .filter(card => card.chapter === selectedChapter)
                      .map(card => {
                        const cardCategories = categories.filter(c => c.card_id === card.id);
                        const totalSubcats = cardCategories.reduce(
                          (acc, cat) =>
                            acc + subcategories.filter(s => s.category_id === cat.id).length,
                          0
                        );
                        return (
                          <div
                            key={card.id}
                            className="bg-card-hover rounded-lg border-2 border-std p-4 hover:border-accent hover:ring-2 hover:ring-accent/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3
                                onClick={() => setSelectedCard(card)}
                                className="font-semibold text-primary cursor-pointer hover:text-accent"
                              >
                                {card.title}
                              </h3>
                              <button
                                onClick={e => toggleCardFavorite(e, card.id)}
                                className="p-1 hover:bg-card-hover rounded"
                              >
                                <Star
                                  size={16}
                                  className={
                                    isCardFavorite(card.id)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-400'
                                  }
                                />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {cardCategories.map(cat => {
                                const catSubcats = subcategories.filter(
                                  s => s.category_id === cat.id
                                );
                                return (
                                  <div key={cat.id} className="pl-3 border-l-2 border-accent">
                                    <div className="flex items-center justify-between">
                                      <h4
                                        onClick={() =>
                                          setSelectedCategoryForTasks({
                                            card,
                                            category: cat,
                                            subcategories: catSubcats,
                                          })
                                        }
                                        className="text-sm font-medium text-secondary cursor-pointer hover:text-accent hover:underline"
                                      >
                                        {cat.title}
                                      </h4>
                                      <button
                                        onClick={e =>
                                          toggleCategoryFavorite(e, cat.id, card.id, cat.title)
                                        }
                                        className="p-1 hover:bg-card-hover rounded"
                                      >
                                        <Star
                                          size={14}
                                          className={
                                            isCategoryFavorite(cat.id, card.id, cat.title)
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-400'
                                          }
                                        />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {cardCategories.length === 0 && (
                                <p className="text-sm text-muted">Aucune action</p>
                              )}
                              {totalSubcats > 0 && (
                                <p className="text-xs text-muted mt-2">
                                  {totalSubcats} tâche{totalSubcats > 1 ? 's' : ''} détaillée
                                  {totalSubcats > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  {(!cards ||
                    cards.filter(card => card.chapter === selectedChapter).length === 0) && (
                    <p className="text-sm text-muted col-span-full">
                      Aucune carte pour ce chapitre. Utilisez le bouton "Utiliser" dans la
                      Bibliothèque pour ajouter des cartes.
                    </p>
                  )}
                </div>

                {selectedCategoryForTasks && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg border border-std max-w-lg w-full max-h-[80vh] overflow-auto">
                      <div className="p-4 border-b border-std flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-primary">
                              {selectedCategoryForTasks.category.title}
                            </h3>
                            <button
                              onClick={e =>
                                toggleCategoryFavorite(
                                  e,
                                  selectedCategoryForTasks.category.id,
                                  selectedCategoryForTasks.card.id,
                                  selectedCategoryForTasks.category.title
                                )
                              }
                              className="p-1 hover:bg-card-hover rounded"
                            >
                              <Star
                                size={18}
                                className={
                                  isCategoryFavorite(
                                    selectedCategoryForTasks.category.id,
                                    selectedCategoryForTasks.card.id,
                                    selectedCategoryForTasks.category.title
                                  )
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-400'
                                }
                              />
                            </button>
                          </div>
                          <p className="text-sm text-muted">
                            {selectedCategoryForTasks.card.title}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedCategoryForTasks(null)}
                          className="p-2 hover:bg-card-hover rounded"
                        >
                          <X size={20} className="text-secondary" />
                        </button>
                      </div>
                      <div className="p-4 space-y-2">
                        {selectedCategoryForTasks.subcategories.length > 0 ? (
                          selectedCategoryForTasks.subcategories.map(subcat => {
                            const isNotStarted = !subcat.start_date && !subcat.due_date;
                            const status = isNotStarted ? 'not_started' : subcat.status || 'todo';
                            return (
                              <div
                                key={subcat.id}
                                onClick={() => setSelectedSubcategory(subcat)}
                                className={`p-3 rounded border cursor-pointer transition-all ${
                                  status === 'not_started'
                                    ? 'bg-gray-200 border-gray-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                    : status === 'todo'
                                      ? 'bg-orange-100 border-orange-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                      : status === 'in_progress'
                                        ? 'bg-yellow-100 border-yellow-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                        : status === 'waiting'
                                          ? 'bg-blue-100 border-blue-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                          : status === 'done'
                                            ? 'bg-green-100 border-green-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                            : 'bg-gray-200 border-gray-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={e =>
                                        toggleSubcategoryFavorite(
                                          e,
                                          subcat.id,
                                          selectedCategoryForTasks.card.id,
                                          selectedCategoryForTasks.category.id,
                                          subcat.title,
                                          selectedCategoryForTasks.category.title
                                        )
                                      }
                                      className="p-1 hover:bg-white/50 rounded"
                                    >
                                      <Star
                                        size={14}
                                        className={
                                          isSubcategoryFavorite(
                                            subcat.id,
                                            selectedCategoryForTasks.card.id,
                                            selectedCategoryForTasks.category.title,
                                            subcat.title
                                          )
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-400'
                                        }
                                      />
                                    </button>
                                    <h4 className="font-medium text-secondary">{subcat.title}</h4>
                                  </div>
                                  <button
                                    onClick={async e => {
                                      e.stopPropagation();
                                      if (confirm('Supprimer cette tâche ?')) {
                                        await deleteSubcategory(subcat.id);
                                        setSelectedCategoryForTasks({
                                          ...selectedCategoryForTasks,
                                          subcategories:
                                            selectedCategoryForTasks.subcategories.filter(
                                              s => s.id !== subcat.id
                                            ),
                                        });
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted">Aucune tâche pour cette action</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-std">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              placeholder="Nouvelle tâche..."
                              className="flex-1 px-3 py-2 bg-card-hover border border-std rounded text-secondary text-sm"
                              onKeyDown={async e => {
                                if (e.key === 'Enter' && newTaskTitle.trim()) {
                                  const newSub = await createSubcategory(
                                    selectedCategoryForTasks.category.id,
                                    newTaskTitle.trim()
                                  );
                                  setSelectedCategoryForTasks({
                                    ...selectedCategoryForTasks,
                                    subcategories: [
                                      ...selectedCategoryForTasks.subcategories,
                                      newSub,
                                    ],
                                  });
                                  setNewTaskTitle('');
                                }
                              }}
                            />
                            <button
                              onClick={async () => {
                                if (newTaskTitle.trim()) {
                                  const newSub = await createSubcategory(
                                    selectedCategoryForTasks.category.id,
                                    newTaskTitle.trim()
                                  );
                                  setSelectedCategoryForTasks({
                                    ...selectedCategoryForTasks,
                                    subcategories: [
                                      ...selectedCategoryForTasks.subcategories,
                                      newSub,
                                    ],
                                  });
                                  setNewTaskTitle('');
                                }
                              }}
                              className="px-3 py-2 bg-accent text-white rounded text-sm hover:opacity-90"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {showAddCard && (
                  <div className="mb-6 bg-card rounded-lg border border-std p-4">
                    <input
                      type="text"
                      placeholder="Titre de la tâche..."
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddCard();
                        if (e.key === 'Escape') setShowAddCard(false);
                      }}
                      className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary mb-3"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCard}
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => setShowAddCard(false)}
                        className="px-4 py-2 text-secondary hover:text-primary"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {board2Data.cards.map(card => (
                    <div key={card.id} className="bg-card rounded-lg border border-std p-4">
                      {editingCardId === card.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingCardTitle}
                            onChange={e => setEditingCardTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameCard(card.id, editingCardTitle);
                              if (e.key === 'Escape') setEditingCardId(null);
                            }}
                            className="flex-1 px-3 py-2 bg-input border border-std rounded-lg text-primary"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameCard(card.id, editingCardTitle)}
                            className="p-2 text-accent"
                          >
                            <Check size={18} />
                          </button>
                          <button onClick={() => setEditingCardId(null)} className="p-2 text-muted">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleCardExpanded(card.id)}
                              className="text-secondary hover:text-primary"
                            >
                              {expandedCards[card.id] ? (
                                <ChevronDown size={20} />
                              ) : (
                                <ChevronRight size={20} />
                              )}
                            </button>
                            <h3 className="font-semibold text-primary">{card.title}</h3>
                            <button
                              onClick={e => toggleCardFavorite(e, card.id, card.title)}
                              className="p-1 hover:bg-card-hover rounded"
                            >
                              <Star
                                size={16}
                                className={
                                  isCardFavorite(card.id)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-400'
                                }
                              />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCardId(card.id);
                                setEditingCardTitle(card.title);
                              }}
                              className="p-1.5 text-muted hover:text-primary rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1.5 text-muted hover:text-urgent rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      {expandedCards[card.id] && (
                        <div className="ml-8 mt-4 space-y-3">
                          {(card.categories || []).map(cat => (
                            <div key={cat.id} className="bg-card-hover rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={e =>
                                      toggleCategoryFavorite(e, cat.id, card.id, cat.title)
                                    }
                                    className="p-1 hover:bg-card-hover rounded"
                                  >
                                    <Star
                                      size={14}
                                      className={
                                        isCategoryFavorite(cat.id, card.id, cat.title)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-400'
                                      }
                                    />
                                  </button>
                                  <h4 className="font-medium text-primary">{cat.title}</h4>
                                </div>
                                <button
                                  onClick={() => handleDeleteCategory(card.id, cat.id)}
                                  className="p-1 text-muted hover:text-urgent rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="space-y-1 ml-2">
                                {(cat.subcategories || []).map(sub => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between text-sm text-secondary"
                                  >
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={e =>
                                          toggleSubcategoryFavorite(
                                            e,
                                            sub.id,
                                            card.id,
                                            cat.id,
                                            sub.title,
                                            cat.title
                                          )
                                        }
                                        className="p-1 hover:bg-card-hover rounded"
                                      >
                                        <Star
                                          size={12}
                                          className={
                                            isSubcategoryFavorite(
                                              sub.id,
                                              card.id,
                                              cat.title,
                                              sub.title
                                            )
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-400'
                                          }
                                        />
                                      </button>
                                      <span>{sub.title}</span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleDeleteSubcategory(card.id, cat.id, sub.id)
                                      }
                                      className="p-1 text-muted hover:text-urgent rounded"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              {showAddSubcategory === cat.id ? (
                                <div className="mt-2 flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Nouvelle sous-tâche..."
                                    value={newSubcategoryTitle}
                                    onChange={e => setNewSubcategoryTitle(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleAddSubcategory(card.id, cat.id);
                                      if (e.key === 'Escape') setShowAddSubcategory(null);
                                    }}
                                    className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleAddSubcategory(card.id, cat.id)}
                                    className="px-2 py-1 text-sm bg-accent text-white rounded"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowAddSubcategory(cat.id)}
                                  className="text-xs text-accent hover:underline mt-2"
                                >
                                  + Sous-tâche
                                </button>
                              )}
                            </div>
                          ))}
                          {showAddCategory === card.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Nouvelle catégorie..."
                                value={newCategoryTitle}
                                onChange={e => setNewCategoryTitle(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddCategory(card.id);
                                  if (e.key === 'Escape') setShowAddCategory(null);
                                }}
                                className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary"
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddCategory(card.id)}
                                className="px-2 py-1 text-sm bg-accent text-white rounded"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAddCategory(card.id)}
                              className="text-xs text-accent hover:underline mt-2"
                            >
                              + Catégorie
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'commandes' && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-std p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-primary mb-4">Liste des commandes</h3>
            {commandes.length === 0 ? (
              <p className="text-sm text-muted">Aucune commande</p>
            ) : (
              <div className="space-y-2">
                {commandes.map(cmd => (
                  <div key={cmd.id}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCommande(cmd);
                          setSelectedAvenant(null);
                        }}
                        className={`flex-1 text-left p-2 rounded border text-sm ${
                          selectedCommande?.id === cmd.id && !selectedAvenant
                            ? 'border-accent bg-accent-soft'
                            : 'border-std bg-card hover:bg-card-hover'
                        }`}
                      >
                        {cmd.title}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Êtes-vous sûr de vouloir supprimer "${cmd.title}" ? Cette action est irréversible.`
                            )
                          ) {
                            if (
                              window.confirm(
                                `Confirmer définitivement la suppression de "${cmd.title}" et de tous ses avenants ?`
                              )
                            ) {
                              setCommandes(commandes.filter(c => c.id !== cmd.id));
                              if (selectedCommande?.id === cmd.id) {
                                setSelectedCommande(null);
                                setSelectedAvenant(null);
                              }
                            }
                          }
                        }}
                        className="p-1 text-muted hover:text-urgent"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {cmd.avenants?.map(av => (
                      <div key={av.id} className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedCommande(cmd);
                            setSelectedAvenant(av);
                          }}
                          className={`flex-1 text-left p-2 rounded border text-sm ${
                            selectedAvenant?.id === av.id
                              ? 'border-accent bg-accent-soft'
                              : 'border-std bg-card hover:bg-card-hover'
                          }`}
                        >
                          {av.title}
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(`Êtes-vous sûr de vouloir supprimer "${av.title}" ?`)
                            ) {
                              const updatedCommandes = commandes.map(c =>
                                c.id === cmd.id
                                  ? {
                                      ...c,
                                      avenants: c.avenants?.filter(a => a.id !== av.id) || [],
                                    }
                                  : c
                              );
                              setCommandes(updatedCommandes);
                              if (selectedAvenant?.id === av.id) {
                                setSelectedAvenant(null);
                              }
                            }
                          }}
                          className="p-1 text-muted hover:text-urgent"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const avenantNumber = (cmd.avenants?.length || 0) + 1;
                        const newAvenant = {
                          id: Date.now(),
                          title: `Avenant ${avenantNumber}`,
                          numero: avenantNumber,
                          donnees: { numero: '', date: '', objet: '', estimation: '' },
                        };
                        const updatedCommandes = commandes.map(c =>
                          c.id === cmd.id
                            ? { ...c, avenants: [...(c.avenants || []), newAvenant] }
                            : c
                        );
                        setCommandes(updatedCommandes);
                        setSelectedAvenant(newAvenant);
                      }}
                      className="ml-8 mt-1 text-xs text-accent hover:underline"
                    >
                      + Créer un Avenant
                    </button>
                  </div>
                ))}
              </div>
            )}
            {showAddCommande ? (
              <div className="mt-4 p-3 bg-card rounded border border-std">
                <input
                  type="text"
                  placeholder="Nom de la commande"
                  value={newCommandeTitle}
                  onChange={e => setNewCommandeTitle(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-input border border-std rounded mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newCommandeTitle.trim()) {
                        const newCmd = {
                          id: Date.now(),
                          title: newCommandeTitle.trim(),
                          donnees: { numero: '', date: '', objet: '', estimation: '' },
                        };
                        setCommandes([...commandes, newCmd]);
                        setSelectedCommande(newCmd);
                        setNewCommandeTitle('');
                        setShowAddCommande(false);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-accent text-white rounded"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCommande(false);
                      setNewCommandeTitle('');
                    }}
                    className="px-2 py-1 text-xs text-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCommande(true)}
                className="w-full mt-4 p-2 text-sm text-accent border border-dashed border-accent rounded hover:bg-accent-soft"
              >
                + Nouvelle commande
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedCommande ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-primary">{selectedCommande.title}</h2>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setActiveTabCommande('affectation')}
                        className={`px-3 py-1 text-xs rounded ${
                          activeTabCommande === 'affectation'
                            ? 'bg-accent text-white'
                            : 'border border-accent text-accent hover:bg-accent-soft'
                        }`}
                      >
                        Affectation
                      </button>
                      <button
                        onClick={() => setActiveTabCommande('commande')}
                        className={`px-3 py-1 text-xs rounded ${
                          activeTabCommande === 'commande'
                            ? 'bg-accent text-white'
                            : 'border border-accent text-accent hover:bg-accent-soft'
                        }`}
                      >
                        Commande
                      </button>
                    </div>
                  </div>
                </div>

                {activeTabCommande === 'affectation' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">RENSEIGNEMENTS</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">N° Affaire</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Date de réception
                          </label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Date limite</label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Interlocuteur</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">
                        GÉNÉRALITÉS SUR L'OUVRAGE
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">Désignation</label>
                          <textarea
                            rows={2}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Localisation</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Maître d'ouvrage
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">
                        TYPOLOGIE ET DÉTAILS DE CONSISTANCE
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Type d'intervention
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Description sommaire
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Surface / Volume
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTabCommande === 'commande' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">DONNÉES COMMANDE</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">N° Commande</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Date</label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-secondary mb-1">Objet</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Estimation (€)
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted">
                <p>Sélectionnez une commande</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-std flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-primary">Planning</h2>
              <button
                onClick={() => setShowTaskSelector(true)}
                className="flex items-center px-3 py-1.5 text-sm bg-accent-soft text-accent rounded-lg hover:bg-accent/20"
              >
                <Filter size={14} className="mr-2" />
                {planningSelectedTasks.length === 0
                  ? 'Toutes les tâches'
                  : `${planningSelectedTasks.length} tâche(s) sélectionnée(s)`}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={planningSortOrder}
                onChange={e => setPlanningSortOrder(e.target.value)}
                className="px-2 py-1.5 text-sm bg-input border border-std rounded text-primary"
              >
                <option value="date">Trier par date</option>
                <option value="hierarchy">Trier par hiérarchie</option>
              </select>
              <select
                value={ganttZoom}
                onChange={e => setGanttZoom(e.target.value)}
                className="px-2 py-1.5 text-sm bg-input border border-std rounded text-primary"
              >
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
              </select>
              <button
                onClick={() => {
                  const range = getGanttDateRange();
                  const today = new Date();
                  const diffDays = Math.ceil((today - range.start) / (1000 * 60 * 60 * 24));
                  setGanttStartDateInput(diffDays);
                }}
                className="px-2 py-1.5 text-sm bg-input border border-std rounded text-primary hover:bg-card-hover"
                title="Aller à aujourd'hui"
              >
                Aujourd'hui
              </button>
              <input
                type="range"
                min="-90"
                max="365"
                value={ganttStartDateInput}
                onChange={e => {
                  const days = parseInt(e.target.value);
                  setGanttStartDateInput(days);
                  const range = getGanttDateRange();
                  const baseDate = new Date();
                  baseDate.setDate(
                    baseDate.getDate() +
                      days -
                      Math.ceil((baseDate - range.start) / (1000 * 60 * 60 * 24))
                  );
                  setGanttStartDate(baseDate.toISOString().split('T')[0]);
                }}
                className="w-32 h-2 bg-std rounded-lg appearance-none cursor-pointer"
                title={`Déplacer: ${ganttStartDateInput > 0 ? '+' : ''}${ganttStartDateInput} jours`}
              />
              <button
                onClick={handleExportMSProject}
                className="flex items-center px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:opacity-90"
              >
                <Download size={14} className="mr-2" />
                Exporter MS Project
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {getSelectedTasks().length === 0 ? (
              <div className="flex items-center justify-center h-full text-secondary">
                <div className="text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-muted" />
                  <p className="mb-4">Aucune tâche à afficher</p>
                  <button
                    onClick={() => setShowTaskSelector(true)}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                  >
                    Sélectionner des tâches
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 overflow-auto">
                <div className="w-64 shrink-0 border-r border-std bg-card">
                  <div className="sticky top-0 h-8 bg-card border-b border-std p-2 font-semibold text-sm text-primary flex items-center z-10">
                    Tâche
                  </div>
                  {(() => {
                    const grouped = getGroupedTasks();
                    return Object.entries(grouped).map(([chapter, cards]) => {
                      const chapterKey = chapter;
                      const isChapterExpanded = expandedPlanningChapters.has(chapterKey);
                      const chapterTaskCount = Object.values(cards).reduce(
                        (sum, c) =>
                          sum +
                          Object.values(c.categories).reduce((s, cat) => s + cat.tasks.length, 0),
                        0
                      );

                      return (
                        <div key={chapterKey}>
                          <div
                            className="h-8 flex items-center px-2 border-b border-std hover:bg-card-hover text-sm cursor-pointer font-medium text-primary"
                            onClick={() => {
                              const isExpanded = expandedPlanningChapters.has(chapterKey);
                              setExpandedPlanningChapters(prev => {
                                const next = new Set(prev);
                                if (isExpanded) next.delete(chapterKey);
                                else next.add(chapterKey);
                                return next;
                              });
                              savePlanningExpandedState('chapters', chapterKey, !isExpanded);
                            }}
                          >
                            <span className="mr-1 text-xs">{isChapterExpanded ? '▼' : '▶'}</span>
                            <span className="truncate">{chapterKey}</span>
                            <span className="ml-1 text-xs text-muted">({chapterTaskCount})</span>
                          </div>
                          {isChapterExpanded &&
                            Object.entries(cards).map(([cardId, cardData]) => {
                              const cardKey = `${chapterKey}|${cardId}`;
                              const isCardExpanded = expandedPlanningCards.has(cardKey);
                              const cardTaskCount = Object.values(cardData.categories).reduce(
                                (sum, cat) => sum + cat.tasks.length,
                                0
                              );

                              return (
                                <div key={cardKey}>
                                  <div
                                    className="h-8 flex items-center px-2 pl-6 border-b border-std hover:bg-card-hover text-sm cursor-pointer text-secondary"
                                    onClick={() => {
                                      const isExpanded = expandedPlanningCards.has(cardKey);
                                      setExpandedPlanningCards(prev => {
                                        const next = new Set(prev);
                                        if (isExpanded) next.delete(cardKey);
                                        else next.add(cardKey);
                                        return next;
                                      });
                                      savePlanningExpandedState('cards', cardKey, !isExpanded);
                                    }}
                                  >
                                    <span className="mr-1 text-xs">
                                      {isCardExpanded ? '▼' : '▶'}
                                    </span>
                                    <span className="truncate">
                                      {cardData.card?.title || 'Sans titre'}
                                    </span>
                                    <span className="ml-1 text-xs text-muted">
                                      ({cardTaskCount})
                                    </span>
                                  </div>
                                  {isCardExpanded &&
                                    Object.entries(cardData.categories).map(([catId, catData]) => {
                                      const catKey = `${cardKey}|${catId}`;
                                      const isCatExpanded = expandedPlanningCategories.has(catKey);

                                      return (
                                        <div key={catKey}>
                                          <div
                                            className="h-8 flex items-center px-2 pl-10 border-b border-std hover:bg-card-hover text-sm cursor-pointer text-muted"
                                            onClick={() => {
                                              const isExpanded =
                                                expandedPlanningCategories.has(catKey);
                                              setExpandedPlanningCategories(prev => {
                                                const next = new Set(prev);
                                                if (isExpanded) next.delete(catKey);
                                                else next.add(catKey);
                                                return next;
                                              });
                                              savePlanningExpandedState(
                                                'categories',
                                                catKey,
                                                !isExpanded
                                              );
                                            }}
                                          >
                                            <span className="mr-1 text-xs">
                                              {isCatExpanded ? '▼' : '▶'}
                                            </span>
                                            <span className="truncate">
                                              {catData.category?.title || 'Sans catégorie'}
                                            </span>
                                            <span className="ml-1 text-xs text-muted">
                                              ({catData.tasks.length})
                                            </span>
                                          </div>
                                          {isCatExpanded &&
                                            catData.tasks.map(task => (
                                              <div
                                                key={task.id}
                                                className="h-8 flex items-center px-2 pl-14 border-b border-std hover:bg-card-hover text-sm"
                                              >
                                                <div className="flex items-center gap-2 w-full">
                                                  <span
                                                    className={`w-2 h-2 rounded-full shrink-0 ${getTaskStatusColor(task.status)}`}
                                                  ></span>
                                                  <span
                                                    className="text-primary truncate cursor-pointer hover:underline"
                                                    title={task.title}
                                                    onClick={e => {
                                                      e.stopPropagation();
                                                      centerGanttOnTask(task);
                                                    }}
                                                    onDoubleClick={e => {
                                                      e.stopPropagation();
                                                      setSelectedSubcategory(task);
                                                    }}
                                                  >
                                                    {task.title}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      );
                                    })}
                                </div>
                              );
                            })}
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="min-w-max">
                    <div className="flex sticky top-0 h-8 bg-card border-b border-std z-10">
                      {(() => {
                        const days = getGanttDays();
                        const weeks = [];
                        let currentWeek = null;

                        days.forEach((day, idx) => {
                          const weekNum = getWeekNumber(day);
                          if (!currentWeek || currentWeek.week !== weekNum) {
                            if (currentWeek) weeks.push(currentWeek);
                            currentWeek = { week: weekNum, days: [], startIdx: idx };
                          }
                          currentWeek.days.push({ day, idx });
                        });
                        if (currentWeek) weeks.push(currentWeek);

                        return weeks.map(week => (
                          <div key={week.week} className="flex">
                            <div
                              className="text-xs text-center p-1 border-r border-std bg-card-hover font-medium text-secondary"
                              style={{ minWidth: `${week.days.length * 30}px` }}
                            >
                              S{week.week}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="relative">
                      {(() => {
                        const days = getGanttDays();
                        const range = getGanttDateRange();
                        const totalDays = days.length;
                        const flatList = getPlanningFlatList();

                        return flatList.map(item => {
                          if (item.type !== 'task') {
                            return (
                              <div
                                key={item.key}
                                className="h-8 border-b border-std bg-card-hover"
                                style={{ width: `${totalDays * 30}px` }}
                              />
                            );
                          }
                          const task = item.task;
                          const pos = getTaskBarPosition(task);
                          return (
                            <div
                              key={task.id}
                              className="flex items-center h-8 border-b border-std relative"
                              style={{ width: `${totalDays * 30}px` }}
                            >
                              {days.map((day, idx) => {
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                  <div
                                    key={idx}
                                    className={`w-[30px] h-full border-r border-std ${isWeekend ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                                  />
                                );
                              })}
                              <div
                                className={`absolute h-5 rounded ${getTaskStatusColor(task.status)} flex items-center justify-center text-white text-xs px-1 cursor-pointer hover:opacity-80`}
                                style={{ left: pos.left, width: pos.width, top: '6px' }}
                                title={`${task.title} (${task.start_date || '?'} - ${task.due_date || '?'})`}
                              >
                                <span className="truncate">{task.title}</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showTaskSelector && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-std w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-std flex items-center justify-between">
                  <h3 className="font-bold text-primary">Sélectionner les tâches</h3>
                  <button
                    onClick={() => setShowTaskSelector(false)}
                    className="p-2 hover:bg-card-hover rounded"
                  >
                    <X size={20} className="text-secondary" />
                  </button>
                </div>
                <div className="p-4 border-b border-std flex gap-2">
                  <button
                    onClick={selectAllTasks}
                    className="px-3 py-1.5 text-sm bg-accent-soft text-accent rounded hover:bg-accent/20"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={deselectAllTasks}
                    className="px-3 py-1.5 text-sm bg-card-hover rounded hover:bg-std"
                  >
                    Tout désélectionner
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {(() => {
                    const projectTasks = getProjectTasks();
                    const grouped = {};

                    projectTasks.forEach(task => {
                      const cardTitle = task.card?.title || 'Sans carte';
                      const catTitle = task.category?.title || 'Sans action';
                      const key = `${cardTitle}|||${catTitle}`;
                      if (!grouped[key]) {
                        grouped[key] = {
                          card: task.card?.title,
                          category: task.category?.title,
                          tasks: [],
                        };
                      }
                      grouped[key].tasks.push(task);
                    });

                    return Object.entries(grouped).map(([key, group]) => (
                      <div key={key} className="mb-4">
                        <div className="font-medium text-sm text-primary mb-2">
                          {group.card} → {group.category}
                        </div>
                        <div className="space-y-1 ml-4">
                          {group.tasks.map(task => (
                            <label
                              key={task.id}
                              className="flex items-center gap-2 p-2 hover:bg-card-hover rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={planningSelectedTasks.includes(task.id)}
                                onChange={() => togglePlanningTask(task.id)}
                                className="w-4 h-4 rounded border-std text-accent"
                              />
                              <span
                                className="text-sm text-primary hover:underline cursor-pointer"
                                onClick={e => {
                                  e.stopPropagation();
                                  centerGanttOnTask(task);
                                }}
                                onDoubleClick={e => {
                                  e.stopPropagation();
                                  setSelectedSubcategory(task);
                                }}
                              >
                                {task.title}
                              </span>
                              {task.start_date && (
                                <span className="text-xs text-muted ml-auto">
                                  {task.start_date}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <div className="p-4 border-t border-std">
                  <button
                    onClick={() => setShowTaskSelector(false)}
                    className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'echanges' && currentBoard && <Exchange boardId={currentBoard.id} />}

      {activeTab === 'informations' && (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
              <ExternalLink size={16} className="mr-2" />
              Liens
            </h3>
            <div className="flex flex-wrap gap-2">
              {links.map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    if (!link.url) {
                      const url = prompt(
                        "Entrez l'URL/dossier :",
                        link.type === 'folder' ? 'C:\\' : 'https://'
                      );
                      if (url) {
                        setLinks(links.map(l => (l.id === link.id ? { ...l, url } : l)));
                      }
                    } else if (link.type === 'folder') {
                      const folderUrl = link.url.startsWith('file://')
                        ? link.url
                        : `file:///${link.url.replace(/\\/g, '/')}`;
                      window.open(folderUrl, '_blank');
                    } else {
                      window.open(link.url, '_blank');
                    }
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    const title = prompt('Nom du lien :', link.title);
                    if (title) {
                      setLinks(links.map(l => (l.id === link.id ? { ...l, title } : l)));
                    }
                  }}
                  className="flex items-center px-3 py-2 bg-card hover:bg-card-hover border border-std rounded text-sm text-primary transition-std"
                  style={{ borderLeftColor: link.color, borderLeftWidth: '3px' }}
                >
                  {link.type === 'web' ? (
                    <ExternalLink size={14} className="mr-2" style={{ color: link.color }} />
                  ) : (
                    <FolderOpen size={14} className="mr-2" style={{ color: link.color }} />
                  )}
                  {link.title}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const color = prompt('Couleur (hex) :', link.color);
                      if (color) {
                        setLinks(links.map(l => (l.id === link.id ? { ...l, color } : l)));
                      }
                    }}
                    className="ml-2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: link.color }}
                  />
                </button>
              ))}
              {showAddLink ? (
                <div className="flex items-center gap-2 p-2 bg-card border border-std rounded">
                  <select
                    value={ganttZoom}
                    onChange={e => setGanttZoom(e.target.value)}
                    className="px-2 py-1.5 text-sm bg-input border border-std rounded text-primary"
                  >
                    <option value="web">Internet</option>
                    <option value="folder">Dossier</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newLink.title}
                    onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary w-32"
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={newLink.url}
                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary w-40"
                  />
                  <input
                    type="color"
                    value={newLink.color}
                    onChange={e => setNewLink({ ...newLink, color: e.target.value })}
                    className="w-8 h-8 cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      if (newLink.title.trim()) {
                        setLinks([...links, { ...newLink, id: Date.now() }]);
                        setNewLink({ title: '', url: '', type: 'web', color: '#22C55E' });
                        setShowAddLink(false);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-accent text-white rounded"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setShowAddLink(false)}
                    className="px-2 py-1 text-xs text-secondary"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddLink(true)}
                  className="flex items-center px-3 py-2 bg-card hover:bg-card-hover border border-dashed border-std rounded text-sm text-secondary transition-std"
                >
                  <PlusCircle size={14} className="mr-2" />
                  Ajouter
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-card rounded-lg border border-std">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">EOTP</h3>
              <button
                onClick={() =>
                  setEotpLines([...eotpLines, { id: Date.now(), numero: '', ruo: '', libelle: '' }])
                }
                className="flex items-center px-2 py-1 text-xs text-accent hover:bg-card-hover rounded"
              >
                <PlusCircle size={12} className="mr-1" />
                Ajouter une ligne
              </button>
            </div>
            <div className="space-y-3">
              {eotpLines.map((eotp, idx) => (
                <div key={eotp.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="N°EOTP"
                      value={eotp.numero}
                      onChange={e => {
                        const updated = eotpLines.map((l, i) =>
                          i === idx ? { ...l, numero: e.target.value } : l
                        );
                        setEotpLines(updated);
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="RUO"
                    value={eotp.ruo}
                    onChange={e => {
                      const updated = eotpLines.map((l, i) =>
                        i === idx ? { ...l, ruo: e.target.value } : l
                      );
                      setEotpLines(updated);
                    }}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Libellé opération"
                      value={eotp.libelle}
                      onChange={e => {
                        const updated = eotpLines.map((l, i) =>
                          i === idx ? { ...l, libelle: e.target.value } : l
                        );
                        setEotpLines(updated);
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    {eotpLines.length > 1 && (
                      <button
                        onClick={() => setEotpLines(eotpLines.filter((_, i) => i !== idx))}
                        className="text-muted hover:text-urgent"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
              <User size={16} className="mr-2" />
              Interlocuteurs internes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internalContacts.map(contact => (
                <div key={contact.id} className="p-3 bg-card rounded-lg border border-std">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{contact.title}</span>
                    <button
                      onClick={() =>
                        setInternalContacts(internalContacts.filter(c => c.id !== contact.id))
                      }
                      className="text-muted hover:text-urgent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nom et prénom"
                    value={contact.name || ''}
                    onChange={e => {
                      const updated = internalContacts.map(c =>
                        c.id === contact.id ? { ...c, name: e.target.value } : c
                      );
                      setInternalContacts(updated);
                    }}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                </div>
              ))}
              {showAddInternal ? (
                <div className="p-3 bg-card rounded-lg border border-std">
                  <input
                    type="text"
                    placeholder="Fonction"
                    value={newInternalTitle}
                    onChange={e => setNewInternalTitle(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary mb-2 focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newInternalTitle.trim()) {
                          setInternalContacts([
                            ...internalContacts,
                            { id: Date.now(), title: newInternalTitle.trim() },
                          ]);
                          setNewInternalTitle('');
                          setShowAddInternal(false);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-accent text-white rounded"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setShowAddInternal(false);
                        setNewInternalTitle('');
                      }}
                      className="px-2 py-1 text-xs text-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddInternal(true)}
                  className="p-3 bg-card/50 rounded-lg border border-dashed border-std text-secondary hover:text-primary hover:border-accent transition-std flex items-center justify-center"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Ajouter
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
              <Building size={16} className="mr-2" />
              Interlocuteurs externes
            </h3>
            <div className="space-y-3">
              {externalContacts.map((contact, idx) => (
                <div key={idx} className="p-4 bg-card rounded-lg border border-std">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-primary">
                      {contact.entreprise || 'Nouveau contact'}
                    </span>
                    <button
                      onClick={() =>
                        setExternalContacts(externalContacts.filter((_, i) => i !== idx))
                      }
                      className="text-muted hover:text-urgent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Entreprise"
                      value={contact.entreprise}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].entreprise = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Fonction"
                      value={contact.fonction}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].fonction = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={contact.nom}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].nom = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={contact.prenom}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].prenom = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={contact.email}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].email = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Tél. bureau"
                      value={contact.telBureau}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].telBureau = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Portable"
                      value={contact.telPortable}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].telPortable = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Adresse"
                      value={contact.adresse}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].adresse = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  setExternalContacts([
                    ...externalContacts,
                    {
                      entreprise: '',
                      fonction: '',
                      nom: '',
                      prenom: '',
                      email: '',
                      telBureau: '',
                      telPortable: '',
                      adresse: '',
                    },
                  ])
                }
                className="w-full p-3 bg-card/50 rounded-lg border border-dashed border-std text-secondary hover:text-primary hover:border-accent transition-std flex items-center justify-center"
              >
                <PlusCircle size={16} className="mr-2" />
                Ajouter un contact externe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board2;
