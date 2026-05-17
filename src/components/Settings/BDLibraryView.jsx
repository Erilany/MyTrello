import { useState, useEffect, useCallback } from 'react';
import { loadTagsData } from '../../data/TagsData';
import { libraryTemplates } from '../../data/libraryData';
import { convertLibraryDataToTree } from './libraryEditorUtils';
import { findProjectsUsingTask, loadAllProjects } from './librarySyncUtils';

const STORAGE_KEY = 'c-projets_library_editor';

// Helper: Resolve library_item_id to tree node ID (handles both numeric IDs and UUIDs)
const resolveToTreeNodeId = (libraryItemId, libraryItems) => {
  if (!libraryItemId) return null;
  const strId = String(libraryItemId);
  // If it's already a UUID (contains dashes), use it directly
  if (strId.includes('-')) return strId;
  // Otherwise, look up in libraryItems mapping (legacy numeric ID -> UUID)
  if (libraryItems && Array.isArray(libraryItems)) {
    const item = libraryItems.find(item => String(item.id) === strId);
    if (item && item.treeNodeId) return String(item.treeNodeId);
  }
  return null;
};

function migrateTree(tree) {
  if (!tree) return [];
  const newTree = JSON.parse(JSON.stringify(tree));
  function traverse(nodes) {
    if (!nodes || !Array.isArray(nodes)) return;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.data) node.data = {};
      if (node.type === 'chapitre') {
        node.data.chapitre = node.data.chapitre || node.titre || '';
      } else if (node.type === 'carte') {
        node.data.carte = node.data.carte || node.titre || '';
        if (node.data.skipAction === undefined) node.data.skipAction = false;
      } else if (node.type === 'categorie') {
        node.data.categorie = node.data.categorie || node.titre || '';
      } else if (node.type === 'souscategorie') {
        node.data.sousCat1 = node.data.sousCat1 || node.titre || '';
      }
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(newTree);
  return newTree;
}

function flattenTree(treeData, allProjects = []) {
  const rows = [];
  if (!treeData || !Array.isArray(treeData)) return rows;
  const tags = loadTagsData();
  if (!tags || !Array.isArray(tags)) return rows;

  function traverse(node, chapitre, carte, categorie, carteSkipAction) {
    if (!node) return;
    const curChap =
      node.type === 'chapitre' ? node.data?.chapitre || node.titre || '' : chapitre || '';
    const curCart = node.type === 'carte' ? node.data?.carte || node.titre || '' : carte || '';
    const curCat =
      node.type === 'categorie' ? node.data?.categorie || node.titre || '' : categorie || '';

    const currentSkipAction = node.type === 'carte' ? node.data?.skipAction : carteSkipAction;

    let tagName = '';
    if (node.data?.systemTag) {
      const found = tags.find(t => t.name === node.data.systemTag);
      tagName = found ? found.name : '';
    }

    const typeDeTache =
      node.type === 'souscategorie' ? (currentSkipAction ? 'Unique' : 'Multi') : '';
    const tache = node.type === 'souscategorie' ? node.data?.sousCat1 || node.titre || '' : '';

    if (node.type === 'souscategorie') {
      const projectsUsing = findProjectsUsingTask(curChap, curCart, tache, allProjects);

      rows.push({
        id: node.id,
        chapitre: curChap,
        carte: curCart,
        action: curCat,
        tache: tache,
        temps: node.data?.temps || 0,
        tag: tagName,
        typeDeTache: typeDeTache,
        projets: projectsUsing.length > 0 ? projectsUsing.map(p => p.projectTitle) : ['Aucun'],
        tagProjet:
          projectsUsing.length > 0 ? projectsUsing.map(p => p.currentTag || '(vide)') : ['-'],
      });
    }

    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      for (let j = 0; j < node.children.length; j++) {
        traverse(node.children[j], curChap, curCart, curCat, currentSkipAction);
      }
    }
  }

  for (let i = 0; i < treeData.length; i++) {
    traverse(treeData[i], '', '', '', undefined);
  }
  return rows;
}

export default function BDLibraryView() {
  const [tableData, setTableData] = useState([]);

  const loadData = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let treeChildren = [];

      if (stored) {
        let parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          parsed = parsed.children || [];
        }
        const migrated = migrateTree(parsed);
        treeChildren = Array.isArray(migrated) ? migrated : [];
      } else {
        const tree = convertLibraryDataToTree(libraryTemplates);
        treeChildren = tree.children || [];
      }

      const allProjects = loadAllProjects();

      // Add libraryItems to allProjects for ID resolution
      const dbRaw = localStorage.getItem('c-projets_db');
      if (dbRaw) {
        try {
          const db = JSON.parse(dbRaw);
          allProjects.libraryItems = db.libraryItems || [];
        } catch (e) {}
      }

      setTableData(flattenTree(treeChildren, allProjects));
    } catch (e) {
      console.error('[BDLibraryView] Error:', e);
      const tree = convertLibraryDataToTree(libraryTemplates);
      const allProjects = loadAllProjects();
      setTableData(flattenTree(tree.children || [], allProjects));
    }
  }, []);

  useEffect(() => {
    loadData();

    const onStorage = e => {
      // Recharge si la bibliothèque OU les projets changent
      if (e.key === STORAGE_KEY || e.key === 'c-projets_db') loadData();
    };
    const onUpdate = () => loadData();
    const onProjectUpdate = () => loadData();

    window.addEventListener('storage', onStorage);
    window.addEventListener('library-updated', onUpdate);
    window.addEventListener('project-updated', onProjectUpdate);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('library-updated', onUpdate);
      window.removeEventListener('project-updated', onProjectUpdate);
    };
  }, [loadData]);

  const exportJSON = () => {
    const data = { tableData, rawProjects: loadAllProjects() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bd-modele-bibliotheque.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncTags = () => {
    try {
      const dbRaw = localStorage.getItem('c-projets_db');
      if (!dbRaw) return alert('Base vide');
      const db = JSON.parse(dbRaw);
      let updated = 0;

      // Build tree lookup: treeNodeId -> systemTag
      const treeTagsByNodeId = {};
      try {
        const treeRaw = localStorage.getItem('c-projets_library_editor');
        if (treeRaw) {
          const treeData = JSON.parse(treeRaw);
          const nodes = treeData.children || treeData;
          const extractTags = nodes => {
            for (const node of nodes) {
              if (node.id && node.data?.systemTag && node.data.systemTag.trim()) {
                treeTagsByNodeId[String(node.id)] = node.data.systemTag.trim();
              }
              if (node.children) extractTags(node.children);
            }
          };
          extractTags(nodes);
        }
      } catch (e) {}

      // Build mapping: numericId -> treeNodeId (UUID) from libraryItems
      const numericIdToUUID = {};
      (db.libraryItems || []).forEach(item => {
        if (item.id && item.treeNodeId) {
          numericIdToUUID[String(item.id)] = String(item.treeNodeId);
        }
      });

      // Sync subcategories using library_item_id (handles both numeric IDs and UUIDs)
      db.subcategories.forEach(sub => {
        if (!sub.library_item_id) return;
        // Resolve to tree node ID (handle both UUID and legacy numeric IDs)
        const strId = String(sub.library_item_id);
        let treeNodeId = strId;
        if (!strId.includes('-') && numericIdToUUID[strId]) {
          treeNodeId = numericIdToUUID[strId];
        }
        const tagFromTree = treeTagsByNodeId[treeNodeId];
        if (tagFromTree && sub.tag !== tagFromTree) {
          sub.tag = tagFromTree;
          updated++;
        }
      });

      // Sync categories similarly
      db.categories.forEach(cat => {
        if (!cat.library_item_id) return;
        const strId = String(cat.library_item_id);
        let treeNodeId = strId;
        if (!strId.includes('-') && numericIdToUUID[strId]) {
          treeNodeId = numericIdToUUID[strId];
        }
        const tagFromTree = treeTagsByNodeId[treeNodeId];
        if (tagFromTree && cat.tag !== tagFromTree) {
          cat.tag = tagFromTree;
          updated++;
        }
      });

      localStorage.setItem('c-projets_db', JSON.stringify(db));
      window.dispatchEvent(new Event('library-updated'));
      alert(`${updated} éléments mis à jour depuis la bibliothèque`);
      loadData();
    } catch (e) {
      console.error('[BDLibraryView] Sync error:', e);
      alert('Erreur: ' + e.message);
    }
  };

  const forceSyncToProjects = () => {
    try {
      const dbRaw = localStorage.getItem('c-projets_db');
      if (!dbRaw) return alert('Base vide');
      const db = JSON.parse(dbRaw);
      let updated = 0;

      // Build tree lookup: treeNodeId -> systemTag
      const treeTagsByNodeId = {};
      try {
        const treeRaw = localStorage.getItem('c-projets_library_editor');
        if (treeRaw) {
          const treeData = JSON.parse(treeRaw);
          const nodes = treeData.children || treeData;
          const extractTags = nodes => {
            for (const node of nodes) {
              if (node.id && node.data?.systemTag && node.data.systemTag.trim()) {
                treeTagsByNodeId[String(node.id)] = node.data.systemTag.trim();
              }
              if (node.children) extractTags(node.children);
            }
          };
          extractTags(nodes);
        }
      } catch (e) {}

      // Build mapping: numericId -> treeNodeId (UUID) from libraryItems
      const numericIdToUUID = {};
      (db.libraryItems || []).forEach(item => {
        if (item.id && item.treeNodeId) {
          numericIdToUUID[String(item.id)] = String(item.treeNodeId);
        }
      });

      // Update all subcategories using library_item_id (handles both numeric IDs and UUIDs)
      db.subcategories.forEach(sub => {
        if (!sub.library_item_id) return;
        const strId = String(sub.library_item_id);
        let treeNodeId = strId;
        // If it's not a UUID, try to resolve to UUID
        if (!strId.includes('-') && numericIdToUUID[strId]) {
          treeNodeId = numericIdToUUID[strId];
        }
        const tagFromTree = treeTagsByNodeId[treeNodeId];
        if (tagFromTree && sub.tag !== tagFromTree) {
          sub.tag = tagFromTree;
          updated++;
        }
      });

      // Update categories similarly
      db.categories.forEach(cat => {
        if (!cat.library_item_id) return;
        const strId = String(cat.library_item_id);
        let treeNodeId = strId;
        if (!strId.includes('-') && numericIdToUUID[strId]) {
          treeNodeId = numericIdToUUID[strId];
        }
        const tagFromTree = treeTagsByNodeId[treeNodeId];
        if (tagFromTree && cat.tag !== tagFromTree) {
          cat.tag = tagFromTree;
          updated++;
        }
      });

      localStorage.setItem('c-projets_db', JSON.stringify(db));
      window.dispatchEvent(new Event('library-updated'));
      alert(`${updated} éléments mis à jour dans les projets (bibliothèque source)`);
      loadData();
    } catch (e) {
      console.error('[BDLibraryView] Force sync error:', e);
      alert('Erreur: ' + e.message);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-[var(--txt-primary)]">BD Modele Bibliotheque</h2>
        <div className="flex gap-2">
          <button
            onClick={syncTags}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Synchroniser les tags
          </button>
          <button
            onClick={forceSyncToProjects}
            className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Forcer vers projets
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Exporter JSON
          </button>
        </div>
      </div>
      <p className="text-sm text-[var(--txt-muted)] mb-4">
        Lecture seule - Mise a jour automatique
      </p>

      <div className="flex-1 overflow-auto border border-[var(--border)] rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-[var(--bg-card-hover)] sticky top-0">
            <tr>
              <th className="p-2 text-left text-[var(--txt-secondary)]">
                Chapitre (Modèle bibliothèque)
              </th>
              <th className="p-2 text-left text-[var(--txt-secondary)]">
                Carte (Modèle bibliothèque)
              </th>
              <th className="p-2 text-left text-[var(--txt-secondary)]">
                Action (Modèle bibliothèque)
              </th>
              <th className="p-2 text-left text-[var(--txt-secondary)]">
                Tache (Modèle bibliothèque)
              </th>
              <th className="p-2 text-center text-[var(--txt-secondary)]">
                Temps reperes (Modèle bibliothèque)
              </th>
              <th className="p-2 text-left text-[var(--txt-secondary)]">
                Tag Revue d'activité (Modèle bibliothèque)
              </th>
              <th className="p-2 text-left text-[var(--txt-secondary)]">Type de taches</th>
              <th className="p-2 text-left text-[var(--txt-secondary)]">
                Projets (localStorage c-projets_db)
                <br />
                <span className="text-[10px] font-normal text-gray-500">
                  Le tag entre parenthèses = sous-catégorie.tag du projet (synchro depuis
                  bibliothèque)
                </span>
              </th>
              <th className="p-2 text-left text-[var(--txt-secondary)]">
                Tag Projet (localStorage c-projets_db.subcategories.tag)
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(tableData) &&
              tableData.length > 0 &&
              tableData.map((row, idx) => (
                <tr
                  key={row.id + '-' + idx}
                  className="border-t border-[var(--border)] hover:bg-[var(--bg-card-hover)]"
                >
                  <td className="p-2 text-[var(--txt-primary)]">{row.chapitre}</td>
                  <td className="p-2 text-[var(--txt-primary)]">{row.carte}</td>
                  <td className="p-2 text-[var(--txt-primary)]">{row.action}</td>
                  <td className="p-2 text-[var(--txt-primary)]">{row.tache}</td>
                  <td className="p-2 text-center text-[var(--txt-primary)]">{row.temps}</td>
                  <td className="p-2 text-[var(--txt-primary)]">{row.tag}</td>
                  <td className="p-2 font-medium text-[var(--txt-primary)]">{row.typeDeTache}</td>
                  <td className="p-2 text-[var(--txt-primary)] text-[11px] max-w-[300px]">
                    {(Array.isArray(row.projets) ? row.projets : [row.projets || 'Aucun']).map(
                      (projet, i) => {
                        const tag = Array.isArray(row.tagProjet) ? row.tagProjet[i] || '' : '';
                        return (
                          <div key={i} className="truncate" title={`${projet} (${tag})`}>
                            {projet} <span className="text-[10px] text-gray-500">({tag})</span>
                          </div>
                        );
                      }
                    )}
                  </td>
                  <td className="p-2 text-[var(--txt-primary)] text-[11px] max-w-[200px]">
                    {(Array.isArray(row.tagProjet) ? row.tagProjet : [row.tagProjet || '-']).map(
                      (tag, i) => (
                        <div key={i} className="truncate" title={tag}>
                          {tag}
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            {(!tableData || !Array.isArray(tableData) || tableData.length === 0) && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-[var(--txt-muted)]">
                  Aucune donnee dans la bibliotheque
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
