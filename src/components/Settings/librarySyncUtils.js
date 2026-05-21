/**
 * Utilities to sync tags from library to projects
 * Uses library_item_id (tree node ID) as the stable reference
 * Handles both numeric IDs (legacy) and UUIDs (new format)
 */

/**
 * Build a tag map from tree by tree node ID
 * Returns: { "treeNodeId": { systemTag } }
 */
export function buildTagMapFromTree(treeData) {
  const tagMap = {};

  if (!treeData || !Array.isArray(treeData)) return tagMap;

  const traverse = nodes => {
    for (const node of nodes) {
      // Use node.id (tree node ID) as the key - this is stable
      if (node.id && node.data?.systemTag && node.data.systemTag.trim()) {
        tagMap[String(node.id)] = {
          systemTag: node.data.systemTag.trim(),
        };
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };

  traverse(treeData);
  return tagMap;
}

// Helper: Resolve library_item_id to tree node ID (handles both numeric IDs and UUIDs)
function resolveToTreeNodeId(libraryItemId, libraryItems) {
  if (!libraryItemId) return null;
  const strId = String(libraryItemId);
  // If it's already a UUID (contains dashes), use it directly
  if (strId.includes('-')) return strId;
  // Otherwise, look up in libraryItems mapping (legacy numeric ID -> UUID)
  if (libraryItems && Array.isArray(libraryItems)) {
    const item = libraryItems.find(item => String(item.id) === strId);
    if (item && item.treeNodeId) return String(item.treeNodeId);
  }
  return strId; // fallback to original
}

/**
 * Sync tags from library to all projects
 * Uses library_item_id (tree node ID) to identify tasks
 * Handles both numeric IDs and UUIDs
 * allData = { boards, columns, cards, categories, subcategories, libraryItems }
 */
export function syncTagsToProjects(tagMap, allData) {
  if (!allData || !allData.boards) return [];
  if (!tagMap || typeof tagMap !== 'object') return [];

  const { boards, columns, cards, categories, subcategories, libraryItems } = allData;
  let globalModified = false;

  // Build mapping: numericId -> treeNodeId (UUID) from libraryItems
  const numericIdToUUID = {};
  (libraryItems || []).forEach(item => {
    if (item.id && item.treeNodeId) {
      numericIdToUUID[String(item.id)] = String(item.treeNodeId);
    }
  });

  // Sync subcategories using library_item_id (handles both formats)
  for (const sub of subcategories) {
    if (!sub.library_item_id) continue;
    // Resolve to tree node ID (handle both UUID and legacy numeric IDs)
    const strId = String(sub.library_item_id);
    const treeNodeId = strId.includes('-') ? strId : numericIdToUUID[strId] || strId;
    const tagInfo = tagMap[treeNodeId];
    if (tagInfo && sub.tag !== tagInfo.systemTag) {
      sub.tag = tagInfo.systemTag;
      globalModified = true;
    }
  }

  // Sync categories using library_item_id (handles both formats)
  for (const cat of categories) {
    if (!cat.library_item_id) continue;
    const strId = String(cat.library_item_id);
    const treeNodeId = strId.includes('-') ? strId : numericIdToUUID[strId] || strId;
    const tagInfo = tagMap[treeNodeId];
    if (tagInfo && cat.tag !== tagInfo.systemTag) {
      cat.tag = tagInfo.systemTag;
      globalModified = true;
    }
  }

  // Save all changes at once
  if (globalModified) {
    saveProject(allData);
  }

  return globalModified
    ? allData.boards.map(b => ({
        projectId: b.id,
        projectTitle: b.title || 'Projet ' + b.id,
      }))
    : [];
}

/**
 * Save all updated subcategories tags to localStorage (flat structure)
 * allData contains the updated subcategories array
 */
function saveProject(allData) {
  try {
    const dbRaw = localStorage.getItem('c-projets_db');
    if (!dbRaw) return;

    const db = JSON.parse(dbRaw);
    let updated = 0;

    // Update subcategories in flat db.subcategories from allData
    for (const sub of allData.subcategories) {
      const idx = db.subcategories?.findIndex(s => Number(s.id) === Number(sub.id));
      if (idx !== -1 && db.subcategories[idx].tag !== sub.tag) {
        db.subcategories[idx].tag = sub.tag;
        updated++;
      }
    }

    if (updated > 0) {
      localStorage.setItem('c-projets_db', JSON.stringify(db));
      window.dispatchEvent(new Event('library-updated'));
    }
  } catch (e) {
    console.error('[librarySyncUtils] Error saving project:', e);
  }
}

/**
 * Load all projects data from localStorage (flat structure)
 */
export function loadAllProjects() {
  try {
    const dbRaw = localStorage.getItem('c-projets_db');
    if (!dbRaw) return { boards: [], columns: [], cards: [], categories: [], subcategories: [] };

    const db = JSON.parse(dbRaw);
    return {
      boards: db.boards || [],
      columns: db.columns || [],
      cards: db.cards || [],
      categories: db.categories || [],
      subcategories: db.subcategories || [],
      libraryItems: db.libraryItems || [],
    };
  } catch (e) {
    console.error('[librarySyncUtils] Error loading projects:', e);
    return { boards: [], columns: [], cards: [], categories: [], subcategories: [] };
  }
}

/**
 * Find all projects using a specific task.
 * Uses library_item_id (tree node ID) to find the task
 * Handles both numeric IDs and UUIDs
 * allData = { boards, columns, cards, categories, subcategories, libraryItems }
 */
export function findProjectsUsingTask(chapitre, carte, sousCat1, allData) {
  const projects = [];

  if (!allData || !allData.boards) return projects;

  const { boards, columns, cards, categories, subcategories, libraryItems } = allData;

  // First, try to find the tree node ID for this task
  let targetTreeNodeId = null;
  try {
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (treeRaw) {
      const treeData = JSON.parse(treeRaw);
      const nodes = treeData.children || treeData;

      const traverse = (node, currentCarte = '', currentCategorie = '') => {
        if (targetTreeNodeId) return;

        const carte = node.type === 'carte' ? node.data?.carte || node.titre : currentCarte;
        const cat =
          node.type === 'categorie' ? node.data?.categorie || node.titre : currentCategorie;

        if (
          node.type === 'souscategorie' &&
          node.data?.sousCat1 === sousCat1 &&
          carte === carte &&
          (!cat || cat === currentCategorie)
        ) {
          targetTreeNodeId = node.id;
          return;
        }

        if (node.children) {
          node.children.forEach(child => traverse(child, carte, cat));
        }
      };

      nodes.forEach(node => traverse(node));
    }
  } catch (e) {
    console.error('[findProjectsUsingTask] Error finding tree node:', e);
  }

  // Build mapping: numericId -> treeNodeId (UUID) from libraryItems
  const numericIdToUUID = {};
  (libraryItems || []).forEach(item => {
    if (item.id && item.treeNodeId) {
      numericIdToUUID[String(item.id)] = String(item.treeNodeId);
    }
  });

  // Search by library_item_id (handles both numeric IDs and UUIDs)
  for (const board of boards) {
    const boardColumns = columns.filter(col => Number(col.board_id) === Number(board.id));

    for (const column of boardColumns) {
      const columnCards = cards.filter(c => Number(c.column_id) === Number(column.id));

      for (const card of columnCards) {
        const cardCategories = categories.filter(cat => Number(cat.card_id) === Number(card.id));

        for (const cat of cardCategories) {
          const subs = subcategories.filter(sub => Number(sub.category_id) === Number(cat.id));

          for (const sub of subs) {
            let match = false;

            // Try to match by library_item_id (handles both numeric and UUID)
            if (sub.library_item_id) {
              const strId = String(sub.library_item_id);
              const treeNodeId = strId.includes('-') ? strId : numericIdToUUID[strId] || strId;
              if (targetTreeNodeId && treeNodeId === targetTreeNodeId) {
                match = true;
              }
            }

            // Fallback: match by title
            if (!match && sub.title === sousCat1) {
              const cardChapter =
                card.chapter || (card.tags ? card.tags.split(',')[0]?.trim() : '');
              if (cardChapter === chapitre && card.title === carte) {
                match = true;
              }
            }

            if (match) {
              projects.push({
                projectId: board.id,
                projectTitle: board.title || 'Projet ' + board.id,
                cardId: card.id,
                cardTitle: card.title,
                subcategoryId: sub.id,
                subcategoryTitle: sub.title,
                currentTag: sub.tag || '',
              });
            }
          }
        }
      }
    }
  }

  return projects;
}
