import { useCallback } from 'react';

export function useLibraryOperations(db, saveDb, setLibraryItems, loadBoard, currentBoard) {
  const loadLibrary = useCallback(() => {
    setLibraryItems(db.libraryItems || []);
  }, [db, setLibraryItems]);

  const saveToLibrary = useCallback(
    (type, title, contentJson) => {
      const existingItems = db.libraryItems || [];
      const existingItem = existingItems.find(item => item.type === type && item.title === title);
      if (existingItem) return existingItem.id;

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

  const syncTagsFromLibrary = useCallback(() => {
    let updatedCount = 0;

    let currentDb;
    try {
      const dbRaw = localStorage.getItem('c-projets_db');
      currentDb = dbRaw ? JSON.parse(dbRaw) : db;
    } catch (e) {
      currentDb = db;
    }

    const treeTagsByNodeId = {};
    const titleToNodeInfo = {}; // fallback: subcategory title → { nodeId, systemTag }
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (treeRaw) {
      try {
        const treeData = JSON.parse(treeRaw);
        const nodes = Array.isArray(treeData) ? treeData : treeData.children || [];
        const extractTags = ns => {
          (ns || []).forEach(node => {
            if (node.id && node.data?.systemTag && node.data.systemTag.trim()) {
              treeTagsByNodeId[String(node.id)] = node.data.systemTag.trim();
            }
            // Build title fallback for subcategory nodes
            if (node.type === 'souscategorie' && node.data?.sousCat1 && node.id) {
              if (!titleToNodeInfo[node.data.sousCat1]) {
                titleToNodeInfo[node.data.sousCat1] = {
                  nodeId: String(node.id),
                  systemTag: node.data.systemTag?.trim() || '',
                };
              }
            }
            if (node.children && node.children.length > 0) extractTags(node.children);
          });
        };
        extractTags(nodes);
      } catch (e) {
        console.error('[syncTagsFromLibrary] Error parsing tree:', e);
      }
    }

    const numericIdToUUID = {};
    (currentDb.libraryItems || []).forEach(item => {
      if (item.id && item.treeNodeId) {
        numericIdToUUID[String(item.id)] = String(item.treeNodeId);
      }
    });

    const resolveToTreeNodeId = libItemId => {
      if (!libItemId) return null;
      const strId = String(libItemId);
      if (strId.includes('-')) return strId;
      return numericIdToUUID[strId] || null;
    };

    const titleFallback = (sub) => {
      const info = sub.title ? titleToNodeInfo[sub.title] : null;
      if (!info || !info.nodeId) return sub;
      const updated = { ...sub, library_item_id: info.nodeId };
      if (info.systemTag && info.systemTag !== sub.tag) {
        updatedCount++;
        return { ...updated, tag: info.systemTag };
      }
      return updated;
    };

    const newSubcategories = currentDb.subcategories.map(sub => {
      if (!sub.library_item_id) {
        return titleFallback(sub);
      }
      const treeNodeId = resolveToTreeNodeId(sub.library_item_id);
      // UUID resolution failed (e.g. old numeric ID with no UUID mapping) — use title fallback
      if (!treeNodeId) return titleFallback(sub);
      const tagFromTree = treeTagsByNodeId[treeNodeId];
      if (!tagFromTree) return sub;
      if (tagFromTree !== sub.tag) {
        updatedCount++;
        return { ...sub, tag: tagFromTree };
      }
      return sub;
    });

    const newCategories = currentDb.categories.map(cat => {
      if (!cat.library_item_id) return cat;
      const treeNodeId = resolveToTreeNodeId(cat.library_item_id);
      if (!treeNodeId) return cat;
      const tagFromTree = treeTagsByNodeId[treeNodeId];
      if (!tagFromTree) return cat;
      if (tagFromTree !== cat.tag) {
        updatedCount++;
        return { ...cat, tag: tagFromTree };
      }
      return cat;
    });

    if (updatedCount > 0) {
      const newDb = { ...currentDb, categories: newCategories, subcategories: newSubcategories };
      saveDb(newDb);
      if (currentBoard) setTimeout(() => loadBoard(currentBoard.id, newDb), 100);
    }

    return updatedCount;
  }, [db, saveDb, currentBoard, loadBoard]);

  return {
    loadLibrary,
    saveToLibrary,
    updateLibraryItem,
    deleteLibraryItem,
    syncTagsFromLibrary,
  };
}
