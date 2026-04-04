import { useCallback } from 'react';

export function useOrders(db, saveDb) {
  const createOrder = useCallback(
    (boardId, title) => {
      const newOrder = {
        id: db.nextIds.order++,
        board_id: boardId,
        title,
        lignes: [],
        avenants: [],
        decomptes: [],
        created_at: new Date().toISOString(),
      };
      const newDb = {
        ...db,
        orders: [...(db.orders || []), newOrder],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      return newOrder.id;
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
      const newAvenant = {
        id: Date.now(),
        title,
        lignes: [],
        created_at: new Date().toISOString(),
      };
      const updatedOrder = {
        ...order,
        avenants: [...(order.avenants || []), newAvenant],
      };
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o => (Number(o.id) === Number(orderId) ? updatedOrder : o)),
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

  const addDecompte = useCallback(
    (orderId, title) => {
      const order = (db.orders || []).find(o => Number(o.id) === Number(orderId));
      if (!order) return null;
      const newDecompte = {
        id: Date.now(),
        title,
        lignes: [],
        created_at: new Date().toISOString(),
      };
      const updatedOrder = {
        ...order,
        decomptes: [...(order.decomptes || []), newDecompte],
      };
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o => (Number(o.id) === Number(orderId) ? updatedOrder : o)),
      };
      saveDb(newDb);
      return newDecompte.id;
    },
    [db, saveDb]
  );

  const updateDecompte = useCallback(
    (orderId, decompteId, updates) => {
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o => {
          if (Number(o.id) !== Number(orderId)) return o;
          return {
            ...o,
            decomptes: (o.decomptes || []).map(d =>
              Number(d.id) === Number(decompteId) ? { ...d, ...updates } : d
            ),
          };
        }),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const deleteDecompte = useCallback(
    (orderId, decompteId) => {
      const newDb = {
        ...db,
        orders: (db.orders || []).map(o => {
          if (Number(o.id) !== Number(orderId)) return o;
          return {
            ...o,
            decomptes: (o.decomptes || []).filter(d => Number(d.id) !== Number(decompteId)),
          };
        }),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  return {
    createOrder,
    updateOrder,
    deleteOrder,
    addAvenant,
    updateAvenant,
    deleteAvenant,
    addDecompte,
    updateDecompte,
    deleteDecompte,
  };
}

export default useOrders;
