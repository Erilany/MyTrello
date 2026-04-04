import { useCallback } from 'react';

export function useLibraryCrud(db, saveDb, setLibraryItems) {
  const loadLibrary = useCallback(() => {
    setLibraryItems(db.libraryItems || []);
  }, [db, setLibraryItems]);

  const addToLibrary = useCallback(
    (type, title, contentJson) => {
      const existingItems = db.libraryItems || [];
      const existingItem = existingItems.find(item => item.type === type && item.title === title);
      if (existingItem) {
        console.log('[addToLibrary] Item already exists:', type, title);
        return existingItem.id;
      }

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
      setTimeout(() => window.dispatchEvent(new Event('library-updated')), 100);
      return itemId;
    },
    [db, saveDb, loadLibrary]
  );

  const updateLibraryItem = useCallback(
    (id, title, contentJson) => {
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
      setTimeout(() => window.dispatchEvent(new Event('library-updated')), 100);
    },
    [db, saveDb, loadLibrary]
  );

  const deleteLibraryItem = useCallback(
    id => {
      const newDb = {
        ...db,
        libraryItems: (db.libraryItems || []).filter(item => Number(item.id) !== Number(id)),
      };
      saveDb(newDb);
      loadLibrary();
      setTimeout(() => window.dispatchEvent(new Event('library-updated')), 100);
    },
    [db, saveDb, loadLibrary]
  );

  return {
    loadLibrary,
    addToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
  };
}

export default useLibraryCrud;
