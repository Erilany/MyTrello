import { useCallback } from 'react';

export function useCardCrud(db, saveDb, loadBoard, currentBoard, saveToStorage) {
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
      console.log('[createCard] Called with columnId:', columnId, 'title:', title);

      const existingCard = db.cards.find(
        c =>
          Number(c.column_id) === Number(columnId) &&
          c.title &&
          c.title.toLowerCase() === title.toLowerCase() &&
          !c.is_archived
      );
      if (existingCard) {
        console.log('[createCard] Duplicate card title found:', title);
        return Promise.reject(
          new Error(`Une carte avec le titre "${title}" existe déjà dans ce projet.`)
        );
      }

      return new Promise(resolve => {
        let cardId;

        const updateDb = currentDb => {
          cardId = currentDb.nextIds.card;
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

          const maxPos = currentDb.cards
            .filter(c => Number(c.column_id) === Number(columnId))
            .reduce((max, c) => Math.max(max, c.position), -1);
          newCard.position = maxPos + 1;

          const newDb = {
            ...currentDb,
            cards: [...currentDb.cards, newCard],
            nextIds: { ...currentDb.nextIds, card: cardId + 1 },
          };
          saveToStorage(newDb);
          console.log('[createCard] Card saved, id:', cardId);
          return newDb;
        };

        saveDb(updateDb);

        setTimeout(() => {
          resolve(cardId);
        }, 200);
      });
    },
    [db, saveDb, saveToStorage]
  );

  const updateCard = useCallback(
    (id, updates) => {
      console.log('[AppContext] updateCard called:', id, updates);
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
    },
    [db, saveDb]
  );

  const restoreCard = useCallback(
    id => {
      const newDb = {
        ...db,
        cards: db.cards.map(c => (Number(c.id) === Number(id) ? { ...c, is_archived: 0 } : c)),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const moveCard = useCallback(
    (cardId, targetColumnId, newPosition) => {
      const card = db.cards.find(c => Number(c.id) === Number(cardId));
      if (!card) return;

      const oldColumnId = card.column_id;
      const oldPosition = card.position;

      let newCards = db.cards.map(c => {
        if (Number(c.id) === Number(cardId)) {
          return { ...c, column_id: Number(targetColumnId), position: newPosition };
        }
        if (
          Number(c.column_id) === Number(targetColumnId) &&
          c.position >= newPosition &&
          Number(c.id) !== Number(cardId)
        ) {
          return { ...c, position: c.position + 1 };
        }
        if (
          Number(c.column_id) === Number(oldColumnId) &&
          oldPosition < c.position &&
          Number(c.id) !== Number(cardId)
        ) {
          return { ...c, position: c.position - 1 };
        }
        return c;
      });

      const newDb = { ...db, cards: newCards };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  return {
    createCard,
    updateCard,
    deleteCard,
    archiveCard,
    restoreCard,
    moveCard,
  };
}

export default useCardCrud;
