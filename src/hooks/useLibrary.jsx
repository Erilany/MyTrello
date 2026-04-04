import { useCallback } from 'react';

export function useLibrary(db, saveDb, setLibraryItems) {
  const loadLibrary = useCallback(() => {
    setLibraryItems(db.libraryItems || []);
  }, [db, setLibraryItems]);

  const saveToLibrary = useCallback(
    (type, title, contentJson) => {
      const existingItems = db.libraryItems || [];
      const existingItem = existingItems.find(item => item.type === type && item.title === title);
      if (existingItem) {
        console.log('[saveToLibrary] Item already exists:', type, title);
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
      setTimeout(() => {
        window.dispatchEvent(new Event('library-updated'));
      }, 100);
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
      setTimeout(() => {
        window.dispatchEvent(new Event('library-updated'));
      }, 100);
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
      setTimeout(() => {
        window.dispatchEvent(new Event('library-updated'));
      }, 100);
    },
    [db, saveDb, loadLibrary]
  );

  const syncTagsFromLibrary = useCallback(() => {
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    console.log('[syncTagsFromLibrary] treeRaw exists:', !!treeRaw);
    const categoriesWithTags = [];
    const subcategoriesWithTags = [];

    if (treeRaw) {
      try {
        const treeData = JSON.parse(treeRaw);
        const findTagsInNodes = nodes => {
          nodes.forEach(node => {
            if (node.data && node.data.systemTag && node.data.systemTag.trim()) {
              if (node.type === 'categorie' && node.data.categorie) {
                categoriesWithTags.push({
                  name: node.data.categorie,
                  tag: node.data.systemTag.trim(),
                });
              } else if (node.type === 'sous-categorie' && node.data.sousCat1) {
                subcategoriesWithTags.push({
                  name: node.data.sousCat1,
                  tag: node.data.systemTag.trim(),
                });
              }
            }
            if (node.children) {
              findTagsInNodes(node.children);
            }
          });
        };
        findTagsInNodes(treeData);
        console.log('[syncTagsFromLibrary] Found tags:', {
          categoriesWithTags,
          subcategoriesWithTags,
        });
        localStorage.setItem(
          'c-projets_tags_synced',
          JSON.stringify({ categoriesWithTags, subcategoriesWithTags })
        );
      } catch (e) {
        console.error('[syncTagsFromLibrary] Error:', e);
      }
    }
    return { categoriesWithTags, subcategoriesWithTags };
  }, []);

  return {
    loadLibrary,
    saveToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
    syncTagsFromLibrary,
  };
}

export default useLibrary;
