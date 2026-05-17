export const getSystemTagFromLibraryItemId = (libraryItemId, libraryItems) => {
  if (!libraryItemId) return null;

  try {
    if (libraryItems && Array.isArray(libraryItems)) {
      const item = libraryItems.find(item => item.id == libraryItemId);
      if (item?.tags) {
        console.log('[getSystemTagFromLibraryItemId] Found tags from libraryItems:', item.tags);
        return item.tags;
      }
      if (item?.content_json) {
        try {
          const content = JSON.parse(item.content_json);
          const tag = content.subcategory?.tag || content.category?.tag;
          if (tag) return tag;
        } catch {}
      }
    }

    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (!treeRaw) return null;

    const treeData = JSON.parse(treeRaw);
    console.log('[getSystemTagFromLibraryItemId] treeRaw exists, libraryItemId:', libraryItemId);

    const findSystemTag = (nodes, targetId, depth = 0) => {
      for (const node of nodes) {
        if ((node.id == targetId || node.data?.id == targetId) && node.data?.systemTag) {
          return node.data.systemTag;
        }
        if (node.children && depth < 5) {
          const found = findSystemTag(node.children, targetId, depth + 1);
          if (found) return found;
        }
      }
      return null;
    };

    const result = findSystemTag(treeData, libraryItemId);
    console.log('[getSystemTagFromLibraryItemId] Result for', libraryItemId, ':', result);
    return result;
  } catch (e) {
    console.error('[getSystemTagFromLibraryItemId] Error:', e);
    return null;
  }
};
