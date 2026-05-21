import { useState, useEffect, useCallback } from 'react';
import { libraryTemplates } from '../data/libraryData';
import { useXmlImport } from './useXmlImport';
import {
  convertLibraryDataToTree,
  migrateLibraryTreeFull,
  convertTreeToLibraryItems,
} from '../components/Settings/libraryEditorUtils';
import { buildTagMapFromTree, syncTagsToProjects, loadAllProjects } from '../components/Settings/librarySyncUtils';

const STORAGE_KEY = 'c-projets_library_editor';

export function useLibraryTree() {
  const [treeData, setTreeData] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [treeKey, setTreeKey] = useState(0);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOverNode, setDragOverNode] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);

  const {
    showXmlImportModal,
    setShowXmlImportModal,
    xmlItems,
    selectedXmlItems,
    handleXmlFileSelect,
    toggleXmlItem,
    selectAllXmlItems,
    deselectAllXmlItems,
    handleConfirmXmlImport,
  } = useXmlImport(setTreeData, setHasChanges);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          parsed = parsed.children || [];
        }
        const migrated = migrateLibraryTreeFull(parsed);
        setTreeData(Array.isArray(migrated) ? migrated : []);
        if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
      } catch {
        const tree = convertLibraryDataToTree(libraryTemplates);
        setTreeData(migrateLibraryTreeFull(tree.children || []));
      }
    } else {
      const tree = convertLibraryDataToTree(libraryTemplates);
      setTreeData(migrateLibraryTreeFull(tree.children || []));
    }
  }, []);

  const handleEdit = useCallback((nodeId, updatedData) => {
    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const findAndUpdate = nodes => {
        for (let n of nodes) {
          if (n.id === nodeId) {
            n.data = updatedData;
            n.titre = updatedData.carte || updatedData.chapitre || updatedData.categorie || n.titre;
            return true;
          }
          if (n.children && findAndUpdate(n.children)) return true;
        }
        return false;
      };
      findAndUpdate(newData);
      return newData;
    });
    setHasChanges(true);
  }, []);

  const handleDelete = useCallback(node => {
    if (!window.confirm(`Supprimer "${node.titre}" ?`)) return;
    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const findAndDelete = nodes => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === node.id) {
            nodes.splice(i, 1);
            return true;
          }
          if (nodes[i].children && findAndDelete(nodes[i].children)) return true;
        }
        return false;
      };
      findAndDelete(newData);
      return newData;
    });
    setHasChanges(true);
  }, []);

  const handleAddChild = useCallback(parentNode => {
    let newNode;
    if (parentNode.type === 'chapitre') {
      newNode = {
        id: `carte_${Date.now()}`,
        type: 'carte',
        titre: 'Nouvelle carte',
        data: { ...parentNode.data, carte: 'Nouvelle carte', categorie: '', sousCat1: '', sousCat2: '', sousCat3: '', systemTag: '' },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'carte') {
      newNode = {
        id: `cat_${Date.now()}`,
        type: 'categorie',
        titre: 'Nouvelle catégorie',
        data: { ...parentNode.data, categorie: 'Nouvelle catégorie', sousCat1: '', sousCat2: '', sousCat3: '', systemTag: parentNode.data.systemTag || '' },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'categorie') {
      newNode = {
        id: `sc_${Date.now()}`,
        type: 'souscategorie',
        titre: 'Nouvelle tâche',
        data: { ...parentNode.data, sousCat1: 'Nouvelle tâche', sousCat2: '', sousCat3: '', systemTag: parentNode.data.systemTag || '' },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'souscategorie') {
      newNode = {
        id: `sst_${Date.now()}`,
        type: 'souscategorie',
        titre: 'Nouvelle sous-tâche',
        data: { ...parentNode.data, sousCat1: 'Nouvelle sous-tâche', sousCat2: '', sousCat3: '' },
        children: [],
        expanded: true,
      };
    }

    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const findAndAdd = nodes => {
        for (let n of nodes) {
          if (n.id === parentNode.id) {
            n.children = n.children || [];
            n.children.push(newNode);
            n.expanded = true;
            return true;
          }
          if (n.children && findAndAdd(n.children)) return true;
        }
        return false;
      };
      findAndAdd(newData);
      return newData;
    });
    setHasChanges(true);
  }, []);

  const handleDragStart = useCallback((e, node) => {
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
  }, []);

  const handleDragOver = useCallback(
    (e, targetNode) => {
      e.preventDefault();
      if (!draggedNode || draggedNode.id === targetNode.id) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const threshold = rect.height / 3;
      let position;
      if (offsetY < threshold) {
        position = 'before';
      } else if (offsetY > rect.height - threshold) {
        position = 'after';
      } else {
        position = 'inside';
      }
      setDragOverNode(targetNode);
      setDropPosition(position);
    },
    [draggedNode]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverNode(null);
    setDropPosition(null);
  }, []);

  const isValidDropTarget = (dragged, target, position) => {
    const isDescendant = (node, childId) => {
      if (!node.children) return false;
      for (const child of node.children) {
        if (child.id === childId || isDescendant(child, childId)) return true;
      }
      return false;
    };
    if (position === 'inside' && isDescendant(target, dragged.id)) return false;
    if (dragged.type === 'chapitre') {
      if (position === 'inside') return false;
      return target.type === 'chapitre';
    }
    if (dragged.type === 'carte') {
      if (position === 'inside') return target.type === 'chapitre';
      return target.type === 'carte';
    }
    if (dragged.type === 'categorie') {
      if (position === 'inside') return target.type === 'carte';
      return target.type === 'categorie';
    }
    if (dragged.type === 'souscategorie') {
      if (position === 'inside') return target.type === 'categorie';
      return target.type === 'souscategorie';
    }
    return false;
  };

  const handleDrop = useCallback(
    (e, targetNode) => {
      e.preventDefault();
      if (!draggedNode || !targetNode || draggedNode.id === targetNode.id) {
        setDraggedNode(null);
        setDragOverNode(null);
        setDropPosition(null);
        return;
      }
      const position = dropPosition || 'after';
      if (!isValidDropTarget(draggedNode, targetNode, position)) {
        alert("Opération non autorisée : ce déplacement n'est pas possible");
        setDraggedNode(null);
        setDragOverNode(null);
        setDropPosition(null);
        return;
      }
      setTreeData(prev => {
        const newData = JSON.parse(JSON.stringify(prev));
        let removedNode = null;
        const removeFromTree = nodes => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === draggedNode.id) {
              removedNode = nodes.splice(i, 1)[0];
              return true;
            }
            if (nodes[i].children && removeFromTree(nodes[i].children)) return true;
          }
          return false;
        };
        removeFromTree(newData);
        if (!removedNode) return prev;
        const insertIntoTree = nodes => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === targetNode.id) {
              if (position === 'inside') {
                if (!nodes[i].children) nodes[i].children = [];
                nodes[i].children.push(removedNode);
                nodes[i].expanded = true;
              } else if (position === 'before') {
                nodes.splice(i, 0, removedNode);
              } else {
                nodes.splice(i + 1, 0, removedNode);
              }
              return true;
            }
            if (nodes[i].children && insertIntoTree(nodes[i].children)) return true;
          }
          return false;
        };
        insertIntoTree(newData);
        return newData;
      });
      setHasChanges(true);
      setDraggedNode(null);
      setDragOverNode(null);
      setDropPosition(null);
    },
    [draggedNode, dragOverNode, dropPosition]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedNode(null);
    setDragOverNode(null);
    setDropPosition(null);
  }, []);

  const handleAddRoot = useCallback(() => {
    const newNode = {
      id: `chap_${Date.now()}`,
      type: 'chapitre',
      titre: 'Nouveau chapitre',
      data: { numero: '', chapitre: 'Nouveau chapitre', carte: '', categorie: '', sousCat1: '', sousCat2: '', sousCat3: '', temps: 0, systemTag: '' },
      children: [],
      expanded: true,
    };
    setTreeData(prev => [...prev, newNode]);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(treeData));
    const newLibraryItems = convertTreeToLibraryItems(treeData);
    let mainDb = localStorage.getItem('c-projets_db');
    if (mainDb) {
      try {
        const db = JSON.parse(mainDb);
        db.libraryItems = newLibraryItems;
        localStorage.setItem('c-projets_db', JSON.stringify(db));
      } catch (e) {
        console.error('[LibraryEditor] Error updating main database:', e);
      }
    } else {
      const newDb = {
        boards: [], columns: [], cards: [], categories: [], subcategories: [],
        libraryItems: newLibraryItems, messages: [],
        nextIds: { board: 1, column: 1, card: 1, category: 1, subcategory: 1, libraryItem: newLibraryItems.length + 1, message: 1 },
        orders: [],
      };
      localStorage.setItem('c-projets_db', JSON.stringify(newDb));
    }
    try {
      const tagMap = buildTagMapFromTree(treeData);
      const allProjects = loadAllProjects();
      syncTagsToProjects(tagMap, allProjects);
    } catch (e) {
      console.error('[LibraryEditor] Erreur lors de la synchronisation des tags:', e);
    }
    window.dispatchEvent(new Event('library-updated'));
    setHasChanges(false);
    alert('Modifications enregistrées !');
  }, [treeData]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Réinitialiser toutes les modifications ?')) return;
    localStorage.removeItem(STORAGE_KEY);
    const tree = convertLibraryDataToTree(libraryTemplates);
    setTreeData(tree.children || []);
    setHasChanges(false);
  }, []);

  const expandAll = useCallback(() => {
    const expand = nodes => { nodes.forEach(n => { n.expanded = true; if (n.children) expand(n.children); }); };
    setTreeData(prev => { const newData = JSON.parse(JSON.stringify(prev)); expand(newData); return newData; });
    setTreeKey(k => k + 1);
  }, []);

  const collapseAll = useCallback(() => {
    const collapse = nodes => { nodes.forEach(n => { n.expanded = false; if (n.children) collapse(n.children); }); };
    setTreeData(prev => { const newData = JSON.parse(JSON.stringify(prev)); collapse(newData); return newData; });
    setTreeKey(k => k + 1);
  }, []);

  const createCompleteChains = useCallback(() => {
    let createdCount = 0;
    const processNode = node => {
      if (node.type === 'carte') {
        const hasCategoryChildren = node.children && node.children.some(child => child.type === 'categorie');
        if (!hasCategoryChildren) {
          const cardTitle = node.data.carte || node.titre;
          node.children = node.children || [];
          node.children.push({
            id: `auto_cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'categorie',
            titre: cardTitle,
            data: { ...node.data, categorie: cardTitle, sousCat1: '', sousCat2: '', sousCat3: '' },
            children: [{
              id: `auto_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'souscategorie',
              titre: cardTitle,
              data: { ...node.data, sousCat1: cardTitle, sousCat2: '', sousCat3: '' },
              children: [],
              expanded: true,
            }],
            expanded: true,
          });
          createdCount++;
        }
      }
      if (node.type === 'categorie') {
        const hasSubcategoryChildren = node.children && node.children.some(child => child.type === 'souscategorie');
        if (!hasSubcategoryChildren) {
          const categoryTitle = node.data.categorie || node.titre;
          node.children = node.children || [];
          node.children.push({
            id: `auto_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'souscategorie',
            titre: categoryTitle,
            data: { ...node.data, sousCat1: categoryTitle, sousCat2: '', sousCat3: '' },
            children: [],
            expanded: true,
          });
          createdCount++;
        }
      }
      if (node.children) node.children.forEach(child => processNode(child));
    };
    setTreeData(prev => { const newData = JSON.parse(JSON.stringify(prev)); newData.forEach(node => processNode(node)); return newData; });
    setTreeKey(k => k + 1);
    setHasChanges(true);
    if (createdCount > 0) {
      alert(`✓ ${createdCount} chaîne(s) complète(s) créée(s)`);
    } else {
      alert('Toutes les chaînes sont déjà complètes');
    }
  }, []);

  const handleExport = useCallback(() => {
    const escapeXml = str => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    };
    const today = new Date().toISOString().split('T')[0];
    const tasks = [];
    let uidCounter = 1;
    const processNode = (node, outlineLevel = 1) => {
      const duration = node.data?.temps || 0;
      const durationStr = duration > 0 ? `P${duration}D` : `PT1H0M0S`;
      const taskName = node.titre || node.data?.title || '';
      const systemTag = node.data?.systemTag || '';
      tasks.push({
        UID: uidCounter++, ID: uidCounter - 1, Name: taskName, Manual: 0, Type: 1, IsNull: 0,
        CreateDate: `${today}T09:00:00`, WBS: uidCounter - 1, OutlineNumber: uidCounter - 1,
        OutlineLevel: outlineLevel, Priority: 500, Start: `${today}T09:00:00`, Finish: `${today}T10:00:00`,
        Duration: durationStr, ManualStart: `${today}T09:00:00`, ManualFinish: `${today}T10:00:00`,
        ManualDuration: durationStr, DurationFormat: 7, Work: durationStr, PercentComplete: 0,
        ActualDuration: 0, ActualStart: '', ActualFinish: '', FreeSlack: 0, TotalSlack: 0,
        FixedCost: 0, FixedCostAccrual: 3, PercentWorkComplete: 0, PhysicalPercentComplete: 0,
        Milestone: 0, Summary: node.children && node.children.length > 0 ? 1 : 0,
        Critical: 0, Notes: systemTag,
      });
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => processNode(child, outlineLevel + 1));
      }
    };
    treeData.forEach(node => processNode(node));
    let tasksXML = '';
    tasks.forEach(task => {
      const actualStartXml = task.ActualStart ? `<ActualStart>${task.ActualStart}</ActualStart>` : '';
      const actualFinishXml = task.ActualFinish ? `<ActualFinish>${task.ActualFinish}</ActualFinish>` : '';
      tasksXML += `
		<Task>
			<UID>${task.UID}</UID>
			<ID>${task.ID}</ID>
			<Name>${escapeXml(task.Name)}</Name>
			<Manual>${task.Manual}</Manual>
			<Type>${task.Type}</Type>
			<IsNull>${task.IsNull}</IsNull>
			<CreateDate>${task.CreateDate}</CreateDate>
			<WBS>${task.WBS}</WBS>
			<OutlineNumber>${task.OutlineNumber}</OutlineNumber>
			<OutlineLevel>${task.OutlineLevel}</OutlineLevel>
			<Priority>${task.Priority}</Priority>
			<Start>${task.Start}</Start>
			<Finish>${task.Finish}</Finish>
			<Duration>${task.Duration}</Duration>
			<ManualStart>${task.ManualStart}</ManualStart>
			<ManualFinish>${task.ManualFinish}</ManualFinish>
			<ManualDuration>${task.ManualDuration}</ManualDuration>
			<DurationFormat>${task.DurationFormat}</DurationFormat>
			<Work>${task.Work}</Work>
			<PercentComplete>${task.PercentComplete}</PercentComplete>
			<ActualDuration>${task.ActualDuration}</ActualDuration>
			${actualStartXml}
			${actualFinishXml}
			<FreeSlack>${task.FreeSlack}</FreeSlack>
			<TotalSlack>${task.TotalSlack}</TotalSlack>
			<FixedCost>${task.FixedCost}</FixedCost>
			<FixedCostAccrual>${task.FixedCostAccrual}</FixedCostAccrual>
			<PercentWorkComplete>${task.PercentWorkComplete}</PercentWorkComplete>
			<PhysicalPercentComplete>${task.PhysicalPercentComplete}</PhysicalPercentComplete>
			<Milestone>${task.Milestone}</Milestone>
			<Summary>${task.Summary}</Summary>
			<Critical>${task.Critical}</Critical>
			<Notes>${escapeXml(task.Notes)}</Notes>
		</Task>`;
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
	<SaveVersion>14</SaveVersion>
	<BuildNumber>16.0.19127.20532</BuildNumber>
	<Name>${escapeXml('Bibliothèque')}</Name>
	<GUID>{${Date.now().toString(16).toUpperCase()}-1320-F011-9752-D4F32D378D80}</GUID>
	<Title>${escapeXml('Bibliothèque')}</Title>
	<CreationDate>${today}T09:00:00</CreationDate>
	<LastSaved>${today}T${new Date().toTimeString().split(' ')[0]}</LastSaved>
	<ScheduleFromStart>1</ScheduleFromStart>
	<StartDate>${today}T09:00:00</StartDate>
	<FinishDate>${today}T18:00:00</FinishDate>
	<DurationFormat>7</DurationFormat>
	<WorkFormat>2</WorkFormat>
	<DefaultStartTime>09:00:00</DefaultStartTime>
	<DefaultFinishTime>18:00:00</DefaultFinishTime>
	<MinutesPerDay>480</MinutesPerDay>
	<MinutesPerWeek>2400</MinutesPerWeek>
	<DaysPerMonth>21</DaysPerMonth>
	<DefaultTaskType>1</DefaultTaskType>
	<Tasks>${tasksXML}
	</Tasks>
</Project>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library_export.xml';
    a.click();
    URL.revokeObjectURL(url);
  }, [treeData]);

  return {
    treeData,
    setTreeData,
    hasChanges,
    setHasChanges,
    treeKey,
    draggedNode,
    dragOverNode,
    dropPosition,
    showXmlImportModal,
    setShowXmlImportModal,
    xmlItems,
    selectedXmlItems,
    handleXmlFileSelect,
    toggleXmlItem,
    selectAllXmlItems,
    deselectAllXmlItems,
    handleConfirmXmlImport,
    handleEdit,
    handleDelete,
    handleAddChild,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isValidDropTarget,
    handleAddRoot,
    handleSave,
    handleReset,
    expandAll,
    collapseAll,
    createCompleteChains,
    handleExport,
  };
}
