import { useCallback } from 'react';

export function useBoardCrud(db, saveDb, loadBoard) {
  const createBoard = useCallback(
    (title, description = '') => {
      const boardId = db.nextIds.board++;
      const newBoard = {
        id: boardId,
        title,
        description,
        created_at: new Date().toISOString(),
        is_archived: 0,
      };
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
            title: 'En attente',
            position: 2,
            color: '#9CA3AF',
          },
          {
            id: db.nextIds.column++,
            board_id: boardId,
            title: 'Terminée',
            position: 3,
            color: '#7ED321',
          },
          {
            id: db.nextIds.column++,
            board_id: boardId,
            title: 'Archiver',
            position: 4,
            color: '#475569',
          },
        ],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      loadBoard(boardId);
      return boardId;
    },
    [db, saveDb, loadBoard]
  );

  const updateBoard = useCallback(
    (id, title, description) => {
      const newDb = {
        ...db,
        boards: db.boards.map(b =>
          Number(b.id) === Number(id)
            ? { ...b, title, description, updated_at: new Date().toISOString() }
            : b
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const deleteBoard = useCallback(
    id => {
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
    },
    [db, saveDb]
  );

  const archiveBoard = useCallback(
    id => {
      const newDb = {
        ...db,
        boards: db.boards.map(b =>
          Number(b.id) === Number(id)
            ? { ...b, is_archived: 1, updated_at: new Date().toISOString() }
            : b
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const restoreBoard = useCallback(
    id => {
      const newDb = {
        ...db,
        boards: db.boards.map(b =>
          Number(b.id) === Number(id)
            ? { ...b, is_archived: 0, updated_at: new Date().toISOString() }
            : b
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const createColumn = useCallback(
    (boardId, title, color = '#4A90D9') => {
      const newColumn = {
        id: db.nextIds.column++,
        board_id: boardId,
        title,
        position: db.columns.filter(c => Number(c.board_id) === Number(boardId)).length,
        color,
      };
      const newDb = {
        ...db,
        columns: [...db.columns, newColumn],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      return newColumn.id;
    },
    [db, saveDb]
  );

  const updateColumn = useCallback(
    (id, title, color) => {
      const newDb = {
        ...db,
        columns: db.columns.map(c => (Number(c.id) === Number(id) ? { ...c, title, color } : c)),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const deleteColumn = useCallback(
    id => {
      const newDb = {
        ...db,
        columns: db.columns.filter(c => Number(c.id) !== Number(id)),
        cards: db.cards.filter(c => Number(c.column_id) !== Number(id)),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  return {
    createBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
    restoreBoard,
    createColumn,
    updateColumn,
    deleteColumn,
  };
}

export default useBoardCrud;
