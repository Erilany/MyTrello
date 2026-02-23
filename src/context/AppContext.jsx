import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const dbQuery = useCallback(async (sql, params = []) => {
    if (window.electron) {
      return await window.electron.invoke('db:query', { sql, params });
    }
    return { success: false, error: 'Electron not available' };
  }, []);

  const dbRun = useCallback(async (sql, params = []) => {
    if (window.electron) {
      return await window.electron.invoke('db:run', { sql, params });
    }
    return { success: false, error: 'Electron not available' };
  }, []);

  const dbGet = useCallback(async (sql, params = []) => {
    if (window.electron) {
      return await window.electron.invoke('db:get', { sql, params });
    }
    return { success: false, error: 'Electron not available' };
  }, []);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    const result = await dbQuery('SELECT * FROM boards ORDER BY updated_at DESC');
    if (result.success) {
      setBoards(result.data);
      if (result.data.length > 0) {
        await loadBoard(result.data[0].id);
      }
    }
    setLoading(false);
  };

  const loadBoard = async (boardId) => {
    const boardResult = await dbGet('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (boardResult.success && boardResult.data) {
      setCurrentBoard(boardResult.data);

      const columnsResult = await dbQuery(
        'SELECT * FROM columns WHERE board_id = ? ORDER BY position',
        [boardId]
      );
      if (columnsResult.success) {
        setColumns(columnsResult.data);

        const columnIds = columnsResult.data.map(c => c.id);
        if (columnIds.length > 0) {
          const placeholders = columnIds.map(() => '?').join(',');
          const cardsResult = await dbQuery(
            `SELECT * FROM cards WHERE column_id IN (${placeholders}) AND is_archived = 0 ORDER BY position`,
            columnIds
          );
          if (cardsResult.success) {
            setCards(cardsResult.data);

            const cardIds = cardsResult.data.map(c => c.id);
            if (cardIds.length > 0) {
              const catPlaceholders = cardIds.map(() => '?').join(',');
              const categoriesResult = await dbQuery(
                `SELECT * FROM categories WHERE card_id IN (${catPlaceholders}) ORDER BY position`,
                cardIds
              );
              if (categoriesResult.success) {
                setCategories(categoriesResult.data);

                const catIds = categoriesResult.data.map(c => c.id);
                if (catIds.length > 0) {
                  const subcatPlaceholders = catIds.map(() => '?').join(',');
                  const subcatsResult = await dbQuery(
                    `SELECT * FROM subcategories WHERE category_id IN (${subcatPlaceholders}) ORDER BY position`,
                    catIds
                  );
                  if (subcatsResult.success) {
                    setSubcategories(subcatsResult.data);
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const createBoard = async (title, description = '') => {
    console.log('createBoard called:', { title, description });
    const result = await dbRun(
      'INSERT INTO boards (title, description) VALUES (?, ?)',
      [title, description]
    );
    console.log('createBoard result:', result);
    if (result.success) {
      const boardId = result.data.lastInsertRowid;
      
      await dbRun(
        'INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)',
        [boardId, 'À faire', 0, '#4A90D9']
      );
      await dbRun(
        'INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)',
        [boardId, 'En cours', 1, '#F5A623']
      );
      await dbRun(
        'INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)',
        [boardId, 'Terminé', 2, '#7ED321']
      );
      
      await loadBoard(boardId);
      return boardId;
    }
    return null;
  };

  const updateBoard = async (id, title, description) => {
    console.log('updateBoard called:', { id, title, description });
    const result = await dbRun(
      'UPDATE boards SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, id]
    );
    console.log('updateBoard result:', result);
    await loadBoards();
  };

  const deleteBoard = async (id) => {
    await dbRun('DELETE FROM boards WHERE id = ?', [id]);
    await loadBoards();
  };

  const createColumn = async (boardId, title, color = '#4A90D9') => {
    const maxPos = await dbGet(
      'SELECT MAX(position) as maxPos FROM columns WHERE board_id = ?',
      [boardId]
    );
    const position = (maxPos.data?.maxPos ?? -1) + 1;
    
    const result = await dbRun(
      'INSERT INTO columns (board_id, title, position, color) VALUES (?, ?, ?, ?)',
      [boardId, title, position, color]
    );
    if (result.success) {
      await loadBoard(boardId);
      return result.data.lastInsertRowid;
    }
    return null;
  };

  const updateColumn = async (id, title, color) => {
    await dbRun(
      'UPDATE columns SET title = ?, color = ? WHERE id = ?',
      [title, color, id]
    );
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const deleteColumn = async (id) => {
    await dbRun('DELETE FROM columns WHERE id = ?', [id]);
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const moveColumn = async (columnId, newPosition) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    const oldPosition = column.position;
    if (oldPosition === newPosition) return;

    const direction = newPosition > oldPosition ? 1 : -1;
    const start = Math.min(oldPosition, newPosition);
    const end = Math.max(oldPosition, newPosition);

    for (let i = start; i <= end; i++) {
      const col = columns.find(c => c.position === i);
      if (col) {
        if (i === oldPosition) {
          await dbRun('UPDATE columns SET position = ? WHERE id = ?', [newPosition, columnId]);
        } else if (i === newPosition) {
          await dbRun('UPDATE columns SET position = ? WHERE id = ?', [oldPosition, columnId]);
        } else {
          await dbRun('UPDATE columns SET position = ? WHERE id = ?', [i + direction, col.id]);
        }
      }
    }

    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const createCard = async (columnId, title, description = '', priority = 'normal', dueDate = null, assignee = '') => {
    const maxPos = await dbGet(
      'SELECT MAX(position) as maxPos FROM cards WHERE column_id = ?',
      [columnId]
    );
    const position = (maxPos.data?.maxPos ?? -1) + 1;

    const result = await dbRun(
      'INSERT INTO cards (column_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [columnId, title, description, priority, dueDate, assignee, position]
    );
    if (result.success) {
      if (currentBoard) {
        await loadBoard(currentBoard.id);
      }
      return result.data.lastInsertRowid;
    }
    return null;
  };

  const updateCard = async (id, updates) => {
    const { title, description, priority, due_date, assignee, color, collapsed } = updates;
    await dbRun(
      'UPDATE cards SET title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), due_date = COALESCE(?, due_date), assignee = COALESCE(?, assignee), color = COALESCE(?, color), collapsed = COALESCE(?, collapsed), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, priority, due_date, assignee, color, collapsed, id]
    );
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const deleteCard = async (id) => {
    await dbRun('DELETE FROM cards WHERE id = ?', [id]);
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const archiveCard = async (id) => {
    await dbRun('UPDATE cards SET is_archived = 1 WHERE id = ?', [id]);
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const restoreCard = async (id) => {
    await dbRun('UPDATE cards SET is_archived = 0 WHERE id = ?', [id]);
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const moveCard = async (cardId, newColumnId, newPosition) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const oldColumnId = card.column_id;
    const oldPosition = card.position;

    if (oldColumnId === newColumnId) {
      const direction = newPosition > oldPosition ? 1 : -1;
      const start = Math.min(oldPosition, newPosition);
      const end = Math.max(oldPosition, newPosition);

      for (let i = start; i <= end; i++) {
        const c = cards.find(card => card.column_id === newColumnId && card.position === i);
        if (c) {
          if (i === oldPosition) {
            await dbRun('UPDATE cards SET position = ? WHERE id = ?', [newPosition, cardId]);
          } else if (i === newPosition) {
            await dbRun('UPDATE cards SET position = ? WHERE id = ?', [oldPosition, cardId]);
          } else {
            await dbRun('UPDATE cards SET position = ? WHERE id = ?', [i + direction, c.id]);
          }
        }
      }
    } else {
      const oldColumnCards = cards.filter(c => c.column_id === oldColumnId && c.id !== cardId);
      for (let i = 0; i < oldColumnCards.length; i++) {
        const c = oldColumnCards.find(card => card.position === i);
        if (c) {
          await dbRun('UPDATE cards SET position = ? WHERE id = ?', [i, c.id]);
        }
      }

      const newColumnCards = cards.filter(c => c.column_id === newColumnId);
      for (let i = newPosition; i < newColumnCards.length; i++) {
        const c = newColumnCards.find(card => card.position === i);
        if (c) {
          await dbRun('UPDATE cards SET position = ? WHERE id = ?', [i + 1, c.id]);
        }
      }

      await dbRun('UPDATE cards SET column_id = ?, position = ? WHERE id = ?', [newColumnId, newPosition, cardId]);
    }

    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const createCategory = async (cardId, title, description = '', priority = 'normal', dueDate = null, assignee = '') => {
    const maxPos = await dbGet(
      'SELECT MAX(position) as maxPos FROM categories WHERE card_id = ?',
      [cardId]
    );
    const position = (maxPos.data?.maxPos ?? -1) + 1;

    const result = await dbRun(
      'INSERT INTO categories (card_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cardId, title, description, priority, dueDate, assignee, position]
    );
    if (result.success) {
      if (currentBoard) {
        await loadBoard(currentBoard.id);
      }
      return result.data.lastInsertRowid;
    }
    return null;
  };

  const updateCategory = async (id, updates) => {
    const { title, description, priority, due_date, assignee, color, collapsed } = updates;
    await dbRun(
      'UPDATE categories SET title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), due_date = COALESCE(?, due_date), assignee = COALESCE(?, assignee), color = COALESCE(?, color), collapsed = COALESCE(?, collapsed), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, priority, due_date, assignee, color, collapsed, id]
    );
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const deleteCategory = async (id) => {
    await dbRun('DELETE FROM categories WHERE id = ?', [id]);
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const moveCategory = async (categoryId, newCardId, newPosition) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const oldCardId = category.card_id;
    const oldPosition = category.position;

    if (oldCardId === newCardId) {
      const direction = newPosition > oldPosition ? 1 : -1;
      const start = Math.min(oldPosition, newPosition);
      const end = Math.max(oldPosition, newPosition);

      for (let i = start; i <= end; i++) {
        const c = categories.find(cat => cat.card_id === newCardId && cat.position === i);
        if (c) {
          if (i === oldPosition) {
            await dbRun('UPDATE categories SET position = ? WHERE id = ?', [newPosition, categoryId]);
          } else if (i === newPosition) {
            await dbRun('UPDATE categories SET position = ? WHERE id = ?', [oldPosition, categoryId]);
          } else {
            await dbRun('UPDATE categories SET position = ? WHERE id = ?', [i + direction, c.id]);
          }
        }
      }
    } else {
      const oldCardCats = categories.filter(c => c.card_id === oldCardId && c.id !== categoryId);
      for (let i = 0; i < oldCardCats.length; i++) {
        const c = oldCardCats.find(cat => cat.position === i);
        if (c) {
          await dbRun('UPDATE categories SET position = ? WHERE id = ?', [i, c.id]);
        }
      }

      const newCardCats = categories.filter(c => c.card_id === newCardId);
      for (let i = newPosition; i < newCardCats.length; i++) {
        const c = newCardCats.find(cat => cat.position === i);
        if (c) {
          await dbRun('UPDATE categories SET position = ? WHERE id = ?', [i + 1, c.id]);
        }
      }

      await dbRun('UPDATE categories SET card_id = ?, position = ? WHERE id = ?', [newCardId, newPosition, categoryId]);
    }

    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const createSubcategory = async (categoryId, title, description = '', priority = 'normal', dueDate = null, assignee = '') => {
    const maxPos = await dbGet(
      'SELECT MAX(position) as maxPos FROM subcategories WHERE category_id = ?',
      [categoryId]
    );
    const position = (maxPos.data?.maxPos ?? -1) + 1;

    const result = await dbRun(
      'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [categoryId, title, description, priority, dueDate, assignee, position]
    );
    if (result.success) {
      if (currentBoard) {
        await loadBoard(currentBoard.id);
      }
      return result.data.lastInsertRowid;
    }
    return null;
  };

  const updateSubcategory = async (id, updates) => {
    const { title, description, priority, due_date, assignee } = updates;
    await dbRun(
      'UPDATE subcategories SET title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), due_date = COALESCE(?, due_date), assignee = COALESCE(?, assignee), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, priority, due_date, assignee, id]
    );
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const deleteSubcategory = async (id) => {
    await dbRun('DELETE FROM subcategories WHERE id = ?', [id]);
    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const moveSubcategory = async (subcategoryId, newCategoryId, newPosition) => {
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    if (!subcategory) return;

    const oldCategoryId = subcategory.category_id;
    const oldPosition = subcategory.position;

    if (oldCategoryId === newCategoryId) {
      const direction = newPosition > oldPosition ? 1 : -1;
      const start = Math.min(oldPosition, newPosition);
      const end = Math.max(oldPosition, newPosition);

      for (let i = start; i <= end; i++) {
        const s = subcategories.find(sub => sub.category_id === newCategoryId && sub.position === i);
        if (s) {
          if (i === oldPosition) {
            await dbRun('UPDATE subcategories SET position = ? WHERE id = ?', [newPosition, subcategoryId]);
          } else if (i === newPosition) {
            await dbRun('UPDATE subcategories SET position = ? WHERE id = ?', [oldPosition, subcategoryId]);
          } else {
            await dbRun('UPDATE subcategories SET position = ? WHERE id = ?', [i + direction, s.id]);
          }
        }
      }
    } else {
      const oldCatSubcats = subcategories.filter(s => s.category_id === oldCategoryId && s.id !== subcategoryId);
      for (let i = 0; i < oldCatSubcats.length; i++) {
        const s = oldCatSubcats.find(sub => sub.position === i);
        if (s) {
          await dbRun('UPDATE subcategories SET position = ? WHERE id = ?', [i, s.id]);
        }
      }

      const newCatSubcats = subcategories.filter(s => s.category_id === newCategoryId);
      for (let i = newPosition; i < newCatSubcats.length; i++) {
        const s = newCatSubcats.find(sub => sub.position === i);
        if (s) {
          await dbRun('UPDATE subcategories SET position = ? WHERE id = ?', [i + 1, s.id]);
        }
      }

      await dbRun('UPDATE subcategories SET category_id = ?, position = ? WHERE id = ?', [newCategoryId, newPosition, subcategoryId]);
    }

    if (currentBoard) {
      await loadBoard(currentBoard.id);
    }
  };

  const loadLibrary = async () => {
    const result = await dbQuery('SELECT * FROM library_items ORDER BY updated_at DESC');
    if (result.success) {
      setLibraryItems(result.data);
    }
  };

  const saveToLibrary = async (type, title, contentJson) => {
    const result = await dbRun(
      'INSERT INTO library_items (type, title, content_json) VALUES (?, ?, ?)',
      [type, title, contentJson]
    );
    if (result.success) {
      await loadLibrary();
      return result.data.lastInsertRowid;
    }
    return null;
  };

  const updateLibraryItem = async (id, title, contentJson) => {
    await dbRun(
      'UPDATE library_items SET title = ?, content_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, contentJson, id]
    );
    await loadLibrary();
  };

  const deleteLibraryItem = async (id) => {
    await dbRun('DELETE FROM library_items WHERE id = ?', [id]);
    await loadLibrary();
  };

  const getArchivedCards = async () => {
    const result = await dbQuery('SELECT * FROM cards WHERE is_archived = 1 ORDER BY updated_at DESC');
    return result.success ? result.data : [];
  };

  const addComment = async (refType, refId, content) => {
    const result = await dbRun(
      'INSERT INTO comments (ref_type, ref_id, content) VALUES (?, ?, ?)',
      [refType, refId, content]
    );
    return result.success;
  };

  const getComments = async (refType, refId) => {
    const result = await dbQuery(
      'SELECT * FROM comments WHERE ref_type = ? AND ref_id = ? ORDER BY created_at DESC',
      [refType, refId]
    );
    return result.success ? result.data : [];
  };

  const deleteComment = async (id) => {
    await dbRun('DELETE FROM comments WHERE id = ?', [id]);
  };

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
    saveToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
    getArchivedCards,
    addComment,
    getComments,
    deleteComment,
    dbQuery,
    dbRun,
    dbGet
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
