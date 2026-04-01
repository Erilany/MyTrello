import { useCallback } from 'react';

const STORAGE_KEY = 'c-projets_db';

function loadDb() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);
  return {
    boards: [],
    columns: [],
    cards: [],
    categories: [],
    subcategories: [],
    libraryItems: [],
    messages: [],
    subcategoryEmails: [],
    nextIds: { board: 1, column: 1, card: 1, category: 1, subcategory: 1 },
  };
}

function saveDb(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[useBoard] Error saving:', e);
  }
}

export function useBoard() {
  const getBoard = useCallback((boardId, data = null) => {
    const sourceData = data || loadDb();
    const board = sourceData.boards.find(b => Number(b.id) === Number(boardId));
    if (!board) return null;
    
    const boardColumns = sourceData.columns.filter(c => Number(c.board_id) === Number(boardId));
    const columnIds = boardColumns.map(c => Number(c.id));
    const filteredCards = sourceData.cards.filter(
      c => columnIds.includes(Number(c.column_id)) && !c.is_archived
    );
    const cardIds = filteredCards.map(c => Number(c.id));
    const boardCategories = sourceData.categories.filter(c => cardIds.includes(Number(c.card_id)));
    const catIds = boardCategories.map(c => Number(c.id));
    const boardSubcategories = sourceData.subcategories.filter(s => catIds.includes(Number(s.category_id)));

    return {
      board,
      columns: boardColumns.sort((a, b) => a.position - b.position),
      cards: filteredCards.sort((a, b) => a.position - b.position),
      categories: boardCategories.sort((a, b) => a.position - b.position),
      subcategories: boardSubcategories.sort((a, b) => a.position - b.position),
    };
  }, []);

  const createBoard = useCallback((title, description = '') => {
    const db = loadDb();
    const boardId = db.nextIds.board++;
    const newBoard = {
      id: boardId,
      title,
      description,
      created_at: new Date().toISOString(),
      is_archived: 0,
    };
    const defaultColumns = [
      { id: db.nextIds.column++, board_id: boardId, title: 'À faire', position: 0, color: '#4A90D9' },
      { id: db.nextIds.column++, board_id: boardId, title: 'En cours', position: 1, color: '#F5A623' },
      { id: db.nextIds.column++, board_id: boardId, title: 'En attente', position: 2, color: '#9CA3AF' },
      { id: db.nextIds.column++, board_id: boardId, title: 'Terminée', position: 3, color: '#7ED321' },
      { id: db.nextIds.column++, board_id: boardId, title: 'Archiver', position: 4, color: '#475569' },
    ];
    const newDb = {
      ...db,
      boards: [...db.boards, newBoard],
      columns: [...db.columns, ...defaultColumns],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    return boardId;
  }, []);

  const updateBoard = useCallback((id, title, description) => {
    const db = loadDb();
    const newDb = {
      ...db,
      boards: db.boards.map(b =>
        Number(b.id) === Number(id)
          ? { ...b, title, description, updated_at: new Date().toISOString() }
          : b
      ),
    };
    saveDb(newDb);
  }, []);

  const deleteBoard = useCallback((id) => {
    const db = loadDb();
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
  }, []);

  const createColumn = useCallback((boardId, title, color = '#4A90D9') => {
    const db = loadDb();
    const maxPos = db.columns
      .filter(c => Number(c.board_id) === Number(boardId))
      .reduce((max, c) => Math.max(max, c.position), -1);
    const colId = db.nextIds.column++;
    const newDb = {
      ...db,
      columns: [...db.columns, { id: colId, board_id: Number(boardId), title, position: maxPos + 1, color }],
      nextIds: { ...db.nextIds },
    };
    saveDb(newDb);
    return colId;
  }, []);

  const updateColumn = useCallback((id, title, color) => {
    const db = loadDb();
    const newDb = {
      ...db,
      columns: db.columns.map(c => (Number(c.id) === Number(id) ? { ...c, title, color } : c)),
    };
    saveDb(newDb);
  }, []);

  const deleteColumn = useCallback((id) => {
    const db = loadDb();
    const newDb = {
      ...db,
      columns: db.columns.filter(c => Number(c.id) !== Number(id)),
      cards: db.cards.filter(c => Number(c.column_id) !== Number(id)),
    };
    saveDb(newDb);
  }, []);

  const moveColumn = useCallback((columnId, newPosition) => {
    const db = loadDb();
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
  }, []);

  return {
    loadDb,
    saveDb,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
  };
}
