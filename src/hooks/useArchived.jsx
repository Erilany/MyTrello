import { useCallback } from 'react';

export function useArchived(db = {}) {
  const getArchivedCards = useCallback(() => {
    return (db.cards || []).filter(c => c.is_archived);
  }, [db.cards]);

  const getArchivedBoards = useCallback(() => {
    return (db.boards || []).filter(b => b.is_archived);
  }, [db.boards]);

  return {
    getArchivedCards,
    getArchivedBoards,
  };
}

export default useArchived;
