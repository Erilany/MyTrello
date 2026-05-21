import { useCallback } from 'react';

export function useOrderOperations(db, saveDb) {
  const createOrder = useCallback(
    (boardId, title) => {
      const orderId = db.nextIds.order++;
      const newOrder = {
        id: orderId,
        board_id: Number(boardId),
        title,
        donnees: { numero: '', date: '', objet: '', estimation: '' },
        groupes: null,
        avenants: [],
        ficheAchat: null,
        created_at: new Date().toISOString(),
      };
      const newDb = {
        ...db,
        orders: [...(db.orders || []), newOrder],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      return orderId;
    },
    [db, saveDb]
  );

  const updateOrder = useCallback(
    (orderId, updates) => {
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o =>
          Number(o.id) === Number(orderId) ? { ...o, ...updates } : o
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const deleteOrder = useCallback(
    orderId => {
      const newDb = {
        ...db,
        orders: (db.orders || []).filter(o => Number(o.id) !== Number(orderId)),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const addAvenant = useCallback(
    (orderId, title) => {
      const order = (db.orders || []).find(o => Number(o.id) === Number(orderId));
      if (!order) return null;
      const avenantNumber = (order.avenants?.length || 0) + 1;
      const newAvenant = {
        id: Date.now(),
        numero: avenantNumber,
        title: title || `Avenant ${avenantNumber}`,
        groupes: null,
        ficheAchat: null,
      };
      const updatedAvenants = [...(order.avenants || []), newAvenant];
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o =>
          Number(o.id) === Number(orderId) ? { ...o, avenants: updatedAvenants } : o
        ),
      };
      saveDb(newDb);
      return newAvenant.id;
    },
    [db, saveDb]
  );

  const updateAvenant = useCallback(
    (orderId, avenantId, updates) => {
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o => {
          if (Number(o.id) !== Number(orderId)) return o;
          return {
            ...o,
            avenants: (o.avenants || []).map(a =>
              Number(a.id) === Number(avenantId) ? { ...a, ...updates } : a
            ),
          };
        }),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const deleteAvenant = useCallback(
    (orderId, avenantId) => {
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o => {
          if (Number(o.id) !== Number(orderId)) return o;
          return {
            ...o,
            avenants: (o.avenants || []).filter(a => Number(a.id) !== Number(avenantId)),
          };
        }),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const getOrdersByBoard = useCallback(
    boardId => {
      return (db.orders || []).filter(o => Number(o.board_id) === Number(boardId));
    },
    [db.orders]
  );

  return {
    createOrder,
    updateOrder,
    deleteOrder,
    addAvenant,
    updateAvenant,
    deleteAvenant,
    getOrdersByBoard,
  };
}
