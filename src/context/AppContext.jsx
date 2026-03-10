import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mytrello_db';

const AppContext = createContext();

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return {
    boards: [],
    columns: [],
    cards: [],
    categories: [],
    subcategories: [],
    libraryItems: [],
    nextIds: { board: 1, column: 1, card: 1, category: 1, subcategory: 1, libraryItem: 1 },
  };
}

function saveToStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initDefaultData() {
  const data = loadFromStorage();
  if (data.boards.length === 0) {
    const boardId = 1;
    data.boards.push({
      id: boardId,
      title: 'Mon Premier Projet',
      description: 'Projet par défaut',
      created_at: new Date().toISOString(),
    });
    data.columns.push(
      { id: 1, board_id: boardId, title: 'À faire', position: 0, color: '#4A90D9' },
      { id: 2, board_id: boardId, title: 'En cours', position: 1, color: '#F5A623' },
      { id: 3, board_id: boardId, title: 'Terminé', position: 2, color: '#7ED321' }
    );
    data.nextIds = { board: 2, column: 4, card: 1, category: 1, subcategory: 1, libraryItem: 1 };
    saveToStorage(data);
  }
  return data;
}

export function AppProvider({ children }) {
  const [db, setDb] = useState(() => initDefaultData());
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [cardColors, setCardColors] = useState({
    etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
    enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
    realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
    archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('mytrello-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedColors = localStorage.getItem('mytrello-cardColors');
    if (savedColors) {
      setCardColors(JSON.parse(savedColors));
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('mytrello-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mytrello-cardColors', JSON.stringify(cardColors));
  }, [cardColors]);

  useEffect(() => {
    setBoards(db.boards.sort((a, b) => a.title.localeCompare(b.title)));
    if (db.boards.length > 0) {
      const firstBoard = db.boards[0];
      setCurrentBoard(firstBoard);
      const boardColumns = db.columns.filter(c => Number(c.board_id) === Number(firstBoard.id));
      const columnIds = boardColumns.map(c => Number(c.id));
      setCards(
        db.cards
          .filter(c => columnIds.includes(Number(c.column_id)) && !c.is_archived)
          .sort((a, b) => a.position - b.position)
      );
      const cardIds = db.cards
        .filter(c => columnIds.includes(Number(c.column_id)))
        .map(c => Number(c.id));
      setCategories(
        db.categories
          .filter(c => cardIds.includes(Number(c.card_id)))
          .sort((a, b) => a.position - b.position)
      );
      const catIds = db.categories
        .filter(c => cardIds.includes(Number(c.card_id)))
        .map(c => Number(c.id));
      setSubcategories(
        db.subcategories
          .filter(s => catIds.includes(Number(s.category_id)))
          .sort((a, b) => a.position - b.position)
      );
    }
  }, [db.boards, db.columns, db.cards, db.categories, db.subcategories]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const updateCardColors = useCallback(newColors => {
    setCardColors(newColors);
  }, []);

  const resetCardColors = useCallback(() => {
    setCardColors({
      etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
      enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
      realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
      archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
    });
  }, []);

  const saveDb = useCallback(newDb => {
    setDb(newDb);
    saveToStorage(newDb);
  }, []);

  const loadBoard = useCallback(
    boardId => {
      const board = db.boards.find(b => Number(b.id) === Number(boardId));
      if (board) {
        setCurrentBoard(board);
        setColumns(
          db.columns
            .filter(c => Number(c.board_id) === Number(boardId))
            .sort((a, b) => a.position - b.position)
        );
        const boardColumns = db.columns.filter(c => Number(c.board_id) === Number(boardId));
        const columnIds = boardColumns.map(c => Number(c.id));
        setCards(
          db.cards
            .filter(c => columnIds.includes(Number(c.column_id)) && !c.is_archived)
            .sort((a, b) => a.position - b.position)
        );
        const cardIds = db.cards
          .filter(c => columnIds.includes(Number(c.column_id)))
          .map(c => Number(c.id));
        setCategories(
          db.categories
            .filter(c => cardIds.includes(Number(c.card_id)))
            .sort((a, b) => a.position - b.position)
        );
        const catIds = db.categories
          .filter(c => cardIds.includes(Number(c.card_id)))
          .map(c => Number(c.id));
        setSubcategories(
          db.subcategories
            .filter(s => catIds.includes(Number(s.category_id)))
            .sort((a, b) => a.position - b.position)
        );
      }
    },
    [db]
  );

  const loadBoards = useCallback(() => {
    setLoading(true);
    setBoards(db.boards.sort((a, b) => a.title.localeCompare(b.title)));
    setLibraryItems(db.libraryItems || []);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    setBoards(db.boards.sort((a, b) => a.title.localeCompare(b.title)));
  }, [db.boards]);

  const generateTestData = () => {
    if (!currentBoard && db.boards.length === 0) {
      initDefaultData();
      return;
    }

    let newDb = {
      boards: db.boards,
      columns: [...db.columns],
      cards: [],
      categories: [],
      subcategories: [],
      libraryItems: [...(db.libraryItems || [])],
      nextIds: { ...db.nextIds },
    };

    const testCards = [
      {
        title: 'Poste 400kV Saint-Étienne-du-Rouvray',
        description: 'Construction nouveau poste source',
        priority: 'urgent',
        dueDate: '2026-06-30',
      },
      {
        title: 'Poste 225kV Lyon-Est',
        description: 'Rénovation poste existant',
        priority: 'high',
        dueDate: '2026-09-15',
      },
      {
        title: 'Liaison Haute Tension Bordeaux-Nantes',
        description: 'Tracé 45km lignes aériennes',
        priority: 'normal',
        dueDate: '2026-12-01',
      },
    ];

    const testCategories = [
      { title: 'Études GC', description: 'Génie civil' },
      { title: 'Études Électriques HTB', description: 'Haute tension' },
      { title: 'Réalisation GC', description: 'Travaux génie civil' },
      { title: 'Suivi administratif', description: 'Permis, autorisations' },
    ];

    const testSubcategories = [
      { title: 'Terrassements' },
      { title: 'Fondations' },
      { title: 'Dallage' },
      { title: 'Clôture' },
      { title: 'Réseaux enterrés' },
    ];

    const colId = Number(
      newDb.columns.find(c => Number(c.board_id) === Number(currentBoard.id))?.id
    );

    testCards.forEach((card, i) => {
      const cardId = newDb.nextIds.card++;
      newDb.cards.push({
        id: cardId,
        column_id: colId,
        title: card.title,
        description: card.description,
        priority: card.priority,
        due_date: card.dueDate,
        assignee: 'Éric',
        position: i,
        is_archived: 0,
        created_at: new Date().toISOString(),
      });

      testCategories.forEach((cat, j) => {
        const catId = newDb.nextIds.category++;
        newDb.categories.push({
          id: catId,
          card_id: cardId,
          title: cat.title,
          description: cat.description,
          priority: 'normal',
          position: j,
          created_at: new Date().toISOString(),
        });

        testSubcategories.forEach((subcat, k) => {
          newDb.subcategories.push({
            id: newDb.nextIds.subcategory++,
            category_id: catId,
            title: subcat.title,
            description: '',
            priority: 'normal',
            position: k,
            created_at: new Date().toISOString(),
          });
        });
      });
    });

    saveDb(newDb);
    loadBoard(currentBoard.id);
  };

  const createBoard = (title, description = '') => {
    const boardId = db.nextIds.board++;
    const newBoard = { id: boardId, title, description, created_at: new Date().toISOString() };
    const newDb = {
      ...db,
      boards: [...db.boards, newBoard],
      columns: [
        ...db.columns,
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'À faire',
          position: 0,
          color: '#4A90D9',
        },
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'En cours',
          position: 1,
          color: '#F5A623',
        },
        {
          id: db.nextIds.column++,
          board_id: boardId,
          title: 'Terminé',
          position: 2,
          color: '#7ED321',
        },
      ],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    loadBoard(boardId);
    return boardId;
  };

  const updateBoard = (id, title, description) => {
    const newDb = {
      ...db,
      boards: db.boards.map(b =>
        Number(b.id) === Number(id)
          ? { ...b, title, description, updated_at: new Date().toISOString() }
          : b
      ),
    };
    saveDb(newDb);
  };

  const deleteBoard = id => {
    const newDb = {
      ...db,
      boards: db.boards.filter(b => Number(b.id) !== Number(id)),
      columns: db.columns.filter(c => Number(c.board_id) !== Number(id)),
      cards: db.cards.filter(c => {
        const col = db.columns.find(col => Number(col.id) === Number(c.column_id));
        return !col || Number(col.board_id) !== Number(id);
      }),
    };
    saveDb(newDb);
  };

  const createColumn = (boardId, title, color = '#4A90D9') => {
    const maxPos = db.columns
      .filter(c => Number(c.board_id) === Number(boardId))
      .reduce((max, c) => Math.max(max, c.position), -1);
    const colId = db.nextIds.column++;
    const newDb = {
      ...db,
      columns: [
        ...db.columns,
        { id: colId, board_id: Number(boardId), title, position: maxPos + 1, color },
      ],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    loadBoard(boardId);
    return colId;
  };

  const updateColumn = (id, title, color) => {
    const newDb = {
      ...db,
      columns: db.columns.map(c => (Number(c.id) === Number(id) ? { ...c, title, color } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const deleteColumn = id => {
    const newDb = {
      ...db,
      columns: db.columns.filter(c => Number(c.id) !== Number(id)),
      cards: db.cards.filter(c => Number(c.column_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const moveColumn = (columnId, newPosition) => {
    const column = db.columns.find(c => Number(c.id) === Number(columnId));
    if (!column) return;
    const oldPosition = column.position;
    if (oldPosition === newPosition) return;

    let newColumns = db.columns.map(c => {
      if (Number(c.id) === Number(columnId)) return { ...c, position: newPosition };
      if (
        Number(c.board_id) === Number(column.board_id) &&
        c.position >= Math.min(oldPosition, newPosition) &&
        c.position <= Math.max(oldPosition, newPosition)
      ) {
        return { ...c, position: c.position + (newPosition > oldPosition ? -1 : 1) };
      }
      return c;
    });

    const newDb = { ...db, columns: newColumns };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const createCard = (
    columnId,
    title,
    description = '',
    priority = 'normal',
    dueDate = null,
    assignee = ''
  ) => {
    const maxPos = db.cards
      .filter(c => Number(c.column_id) === Number(columnId))
      .reduce((max, c) => Math.max(max, c.position), -1);
    const cardId = db.nextIds.card++;
    const newCard = {
      id: cardId,
      column_id: Number(columnId),
      title,
      description,
      priority,
      due_date: dueDate,
      assignee,
      position: maxPos + 1,
      is_archived: 0,
      created_at: new Date().toISOString(),
    };
    const newDb = { ...db, cards: [...db.cards, newCard], nextIds: { ...db.nextIds } };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
    return cardId;
  };

  const updateCard = (id, updates) => {
    const newDb = {
      ...db,
      cards: db.cards.map(c =>
        Number(c.id) === Number(id) ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const deleteCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.filter(c => Number(c.id) !== Number(id)),
      categories: db.categories.filter(cat => Number(cat.card_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const archiveCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 1 } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const restoreCard = id => {
    const newDb = {
      ...db,
      cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 0 } : c)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const moveCard = (cardId, newColumnId, newPosition) => {
    const card = db.cards.find(c => Number(c.id) === Number(cardId));
    if (!card) return;

    const oldColumnId = Number(card.column_id);
    const oldPosition = card.position;
    const destColumnId = Number(newColumnId);

    let newCards = db.cards.map(c => {
      const cId = Number(c.id);
      const cColId = Number(c.column_id);

      if (cId === Number(cardId)) {
        return { ...c, column_id: destColumnId, position: newPosition };
      }

      if (oldColumnId === destColumnId) {
        if (oldPosition < newPosition) {
          if (cColId === oldColumnId && c.position > oldPosition && c.position <= newPosition) {
            return { ...c, position: c.position - 1 };
          }
        } else if (oldPosition > newPosition) {
          if (cColId === oldColumnId && c.position >= newPosition && c.position < oldPosition) {
            return { ...c, position: c.position + 1 };
          }
        }
      } else {
        if (cColId === destColumnId && c.position >= newPosition && cId !== Number(cardId)) {
          return { ...c, position: c.position + 1 };
        }
        if (cColId === oldColumnId && c.position > oldPosition) {
          return { ...c, position: c.position - 1 };
        }
      }
      return c;
    });

    const newDb = { ...db, cards: newCards };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const createCategory = (
    cardId,
    title,
    description = '',
    priority = 'normal',
    dueDate = null,
    assignee = ''
  ) => {
    const maxPos = db.categories
      .filter(c => Number(c.card_id) === Number(cardId))
      .reduce((max, c) => Math.max(max, c.position), -1);
    const catId = db.nextIds.category++;
    const newCategory = {
      id: catId,
      card_id: Number(cardId),
      title,
      description,
      priority,
      due_date: dueDate,
      assignee,
      position: maxPos + 1,
      created_at: new Date().toISOString(),
    };
    const newDb = {
      ...db,
      categories: [...db.categories, newCategory],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
    return catId;
  };

  const updateCategory = (id, updates) => {
    const newDb = {
      ...db,
      categories: db.categories.map(c =>
        Number(c.id) === Number(id) ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const deleteCategory = id => {
    const newDb = {
      ...db,
      categories: db.categories.filter(c => Number(c.id) !== Number(id)),
      subcategories: db.subcategories.filter(s => Number(s.category_id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const moveCategory = (categoryId, newCardId, newPosition) => {
    const category = db.categories.find(c => Number(c.id) === Number(categoryId));
    if (!category) return;

    const oldCardId = Number(category.card_id);
    const oldPosition = category.position;
    const destCardId = Number(newCardId);

    let newCategories = db.categories.map(c => {
      const cId = Number(c.id);
      const cCardId = Number(c.card_id);

      if (cId === Number(categoryId)) {
        return { ...c, card_id: destCardId, position: newPosition };
      }

      if (oldCardId === destCardId) {
        if (oldPosition < newPosition) {
          if (cCardId === oldCardId && c.position > oldPosition && c.position <= newPosition) {
            return { ...c, position: c.position - 1 };
          }
        } else if (oldPosition > newPosition) {
          if (cCardId === oldCardId && c.position >= newPosition && c.position < oldPosition) {
            return { ...c, position: c.position + 1 };
          }
        }
      } else {
        if (cCardId === destCardId && c.position >= newPosition && cId !== Number(categoryId)) {
          return { ...c, position: c.position + 1 };
        }
        if (cCardId === oldCardId && c.position > oldPosition) {
          return { ...c, position: c.position - 1 };
        }
      }
      return c;
    });

    const newDb = { ...db, categories: newCategories };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const createSubcategory = (
    categoryId,
    title,
    description = '',
    priority = 'normal',
    dueDate = null,
    assignee = ''
  ) => {
    const maxPos = db.subcategories
      .filter(s => Number(s.category_id) === Number(categoryId))
      .reduce((max, s) => Math.max(max, s.position), -1);
    const subcatId = db.nextIds.subcategory++;
    const newSubcategory = {
      id: subcatId,
      category_id: Number(categoryId),
      title,
      description,
      priority,
      due_date: dueDate,
      assignee,
      position: maxPos + 1,
      created_at: new Date().toISOString(),
    };
    const newDb = {
      ...db,
      subcategories: [...db.subcategories, newSubcategory],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
    return subcatId;
  };

  const updateSubcategory = (id, updates) => {
    const newDb = {
      ...db,
      subcategories: db.subcategories.map(s =>
        Number(s.id) === Number(id) ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
      ),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const deleteSubcategory = id => {
    const newDb = {
      ...db,
      subcategories: db.subcategories.filter(s => Number(s.id) !== Number(id)),
    };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const moveSubcategory = (subcategoryId, newCategoryId, newPosition) => {
    const subcategory = db.subcategories.find(s => Number(s.id) === Number(subcategoryId));
    if (!subcategory) return;

    const oldCategoryId = Number(subcategory.category_id);
    const oldPosition = subcategory.position;
    const destCategoryId = Number(newCategoryId);

    let newSubcategories = db.subcategories.map(s => {
      const sId = Number(s.id);
      const sCatId = Number(s.category_id);

      if (sId === Number(subcategoryId)) {
        return { ...s, category_id: destCategoryId, position: newPosition };
      }

      if (oldCategoryId === destCategoryId) {
        if (oldPosition < newPosition) {
          if (sCatId === oldCategoryId && s.position > oldPosition && s.position <= newPosition) {
            return { ...s, position: s.position - 1 };
          }
        } else if (oldPosition > newPosition) {
          if (sCatId === oldCategoryId && s.position >= newPosition && s.position < oldPosition) {
            return { ...s, position: s.position + 1 };
          }
        }
      } else {
        if (
          sCatId === destCategoryId &&
          s.position >= newPosition &&
          sId !== Number(subcategoryId)
        ) {
          return { ...s, position: s.position + 1 };
        }
        if (sCatId === oldCategoryId && s.position > oldPosition) {
          return { ...s, position: s.position - 1 };
        }
      }
      return s;
    });

    const newDb = { ...db, subcategories: newSubcategories };
    saveDb(newDb);
    if (currentBoard) loadBoard(currentBoard.id);
  };

  const loadLibrary = useCallback(() => {
    setLibraryItems(db.libraryItems || []);
  }, [db]);

  const saveToLibrary = useCallback(
    (type, title, contentJson) => {
      const itemId = db.nextIds.libraryItem++;
      const newItem = {
        id: itemId,
        type,
        title,
        content_json: contentJson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const newDb = {
        ...db,
        libraryItems: [...(db.libraryItems || []), newItem],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      loadLibrary();
      return itemId;
    },
    [db, saveDb, loadLibrary]
  );

  const updateLibraryItem = (id, title, contentJson) => {
    const newDb = {
      ...db,
      libraryItems: (db.libraryItems || []).map(item =>
        Number(item.id) === Number(id)
          ? { ...item, title, content_json: contentJson, updated_at: new Date().toISOString() }
          : item
      ),
    };
    saveDb(newDb);
    loadLibrary();
  };

  const deleteLibraryItem = id => {
    const newDb = {
      ...db,
      libraryItems: (db.libraryItems || []).filter(item => Number(item.id) !== Number(id)),
    };
    saveDb(newDb);
    loadLibrary();
  };

  const getArchivedCards = () => {
    return db.cards.filter(c => c.is_archived);
  };

  const addComment = (refType, refId, content) => {
    return true;
  };

  const getComments = async (refType, refId) => {
    return [];
  };

  const deleteComment = id => {};

  const value = {
    boards,
    currentBoard,
    columns,
    cards,
    categories,
    subcategories,
    libraryItems,
    loading,
    sidebarOpen,
    libraryOpen,
    setSidebarOpen,
    setLibraryOpen,
    theme,
    toggleTheme,
    selectedCard,
    setSelectedCard,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    loadBoard,
    loadBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
    createCard,
    updateCard,
    deleteCard,
    archiveCard,
    restoreCard,
    moveCard,
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    moveSubcategory,
    loadLibrary,
    generateTestData,
    saveToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
    getArchivedCards,
    addComment,
    getComments,
    deleteComment,
    cardColors,
    updateCardColors,
    resetCardColors,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
