import { useCallback } from 'react';

export function useCardOperations(db, saveDb, loadBoard, currentBoard) {
  const createCard = useCallback(
    (
      columnId,
      title,
      description = '',
      priority = 'normal',
      dueDate = null,
      assignee = '',
      startDate = null,
      durationDays = 1,
      parentId = null,
      predecessorId = null,
      chapter = null,
      libraryItemId = null,
      skipAction = false
    ) => {
      const existingCard = db.cards.find(
        c =>
          Number(c.column_id) === Number(columnId) &&
          c.title &&
          c.title.toLowerCase() === title.toLowerCase() &&
          !c.is_archived
      );
      if (existingCard) {
        return Promise.reject(
          new Error(`Une carte avec le titre "${title}" existe déjà dans ce projet.`)
        );
      }

      return new Promise(resolve => {
        let cardId;

        saveDb(currentDb => {
          const safeDb = currentDb || { cards: [], nextIds: { card: 1 } };
          cardId = safeDb.nextIds?.card || 1;
          const newCard = {
            id: cardId,
            column_id: Number(columnId),
            title,
            description,
            priority,
            due_date: dueDate,
            assignee,
            position: 0,
            is_archived: 0,
            start_date: startDate,
            duration_days: durationDays,
            parent_id: parentId,
            predecessor_id: predecessorId,
            created_at: new Date().toISOString(),
            chapter,
            library_item_id: libraryItemId,
            skip_action: skipAction,
          };

          const maxPos = (safeDb.cards || [])
            .filter(c => Number(c.column_id) === Number(columnId))
            .reduce((max, c) => Math.max(max, c.position || 0), -1);
          newCard.position = maxPos + 1;

          return {
            ...currentDb,
            cards: [...currentDb.cards, newCard],
            nextIds: { ...safeDb.nextIds, card: cardId + 1 },
          };
        });

        setTimeout(() => resolve(cardId), 50);
      });
    },
    [db, saveDb]
  );

  const updateCard = useCallback(
    (id, updates) => {
      const newDb = {
        ...db,
        cards: db.cards.map(c =>
          Number(c.id) === Number(id)
            ? { ...c, ...updates, updated_at: new Date().toISOString() }
            : c
        ),
      };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const deleteCard = useCallback(
    id => {
      const newDb = {
        ...db,
        cards: db.cards.filter(c => Number(c.id) !== Number(id)),
        categories: db.categories.filter(cat => Number(cat.card_id) !== Number(id)),
      };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const archiveCard = useCallback(
    id => {
      const newDb = {
        ...db,
        cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 1 } : c)),
      };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const restoreCard = useCallback(
    id => {
      const newDb = {
        ...db,
        cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 0 } : c)),
      };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const canArchiveBoard = useCallback(
    boardId => {
      const boardColumns = db.columns.filter(c => Number(c.board_id) === Number(boardId));
      const archiveColumn = boardColumns.find(c => c.title.toLowerCase().includes('archiv'));
      if (!archiveColumn) return { canArchive: false, reason: 'Colonne Archiver non trouvée' };

      const columnIds = boardColumns.map(c => Number(c.id));
      const boardCards = db.cards.filter(c => columnIds.includes(Number(c.column_id)));

      if (boardCards.length === 0) return { canArchive: true, reason: '' };

      const allInArchive = boardCards.every(c => Number(c.column_id) === Number(archiveColumn.id));
      return allInArchive
        ? { canArchive: true, reason: '' }
        : { canArchive: false, reason: 'Toutes les cartes doivent être dans la colonne Archiver' };
    },
    [db]
  );

  const archiveBoard = useCallback(
    id => {
      const { canArchive, reason } = canArchiveBoard(id);
      if (!canArchive) {
        alert(reason);
        return false;
      }
      const newDb = {
        ...db,
        boards: db.boards.map(b =>
          Number(b.id) === Number(id) ? { ...b, is_archived: 1 } : b
        ),
      };
      saveDb(newDb);
      return true;
    },
    [db, saveDb, canArchiveBoard]
  );

  const restoreBoard = useCallback(
    id => {
      const newDb = {
        ...db,
        boards: db.boards.map(b =>
          Number(b.id) === Number(id) ? { ...b, is_archived: 0 } : b
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const moveCard = useCallback(
    (cardId, newColumnId, newPosition) => {
      const card = db.cards.find(c => Number(c.id) === Number(cardId));
      if (!card) return;

      const oldColumnId = Number(card.column_id);
      const oldPosition = card.position;
      const destColumnId = Number(newColumnId);

      const newCards = db.cards.map(c => {
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
      if (currentBoard) loadBoard(currentBoard.id, newDb);
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  return {
    createCard,
    updateCard,
    deleteCard,
    archiveCard,
    restoreCard,
    canArchiveBoard,
    archiveBoard,
    restoreBoard,
    moveCard,
  };
}
