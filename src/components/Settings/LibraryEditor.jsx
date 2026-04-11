import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Download,
  RotateCcw,
  FolderOpen,
  Upload,
  FileText,
  List,
  CheckSquare,
  Folder,
  Layers,
  GripVertical,
} from 'lucide-react';
import { libraryTemplates } from '../../data/libraryData';
import { loadTagsData } from '../../data/TagsData';
import { parseMSProjectXml } from '../../utils/xmlParser';
import {
  formatDuration,
  parsePTDuration,
  convertLibraryDataToTree,
  parseCSV,
  buildTree,
  treeToCSV,
} from './libraryEditorUtils';

const STORAGE_KEY = 'c-projets_library_editor';

function convertTreeToLibraryItems(treeData) {
  const libraryItems = [];
  const cardMap = new Map();
  const categorySet = new Set();
  const subcategorySet = new Set();
  let itemId = 1;

  const processNode = (node, chapitre = '', carte = '', categorie = '') => {
    let currentChapitre = chapitre;
    let currentCarte = carte;
    let currentCategorie = categorie;

    if (node.type === 'chapitre') {
      currentChapitre = node.data.chapitre || node.titre;
    } else if (node.type === 'carte') {
      currentCarte = node.data.carte || node.titre;
    } else if (node.type === 'categorie') {
      currentCategorie = node.data.categorie || node.titre;
    }

    if (node.type === 'carte' || node.type === 'categorie' || node.type === 'souscategorie') {
      const tags = currentChapitre;

      let cardItem = cardMap.get(currentCarte);
      if (!cardItem) {
        cardItem = {
          id: itemId++,
          title: currentCarte,
          type: 'card',
          tags: tags,
          duration: node.data.temps || 0,
          content_json: JSON.stringify({
            card: {
              title: currentCarte,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
              skipAction: node.data.skipAction || false,
            },
            categories: [],
          }),
        };
        cardMap.set(currentCarte, cardItem);
        libraryItems.push(cardItem);
      } else {
        const content = JSON.parse(cardItem.content_json);
        if (node.data.skipAction !== undefined) {
          content.card.skipAction = node.data.skipAction;
          cardItem.content_json = JSON.stringify(content);
        }
      }

      if (node.type === 'categorie' || node.type === 'souscategorie') {
        const content = JSON.parse(cardItem.content_json);
        const catKey = `${currentCarte}_${currentCategorie}`;
        let category = content.categories.find(c => c.title === currentCategorie);
        if (!category) {
          category = {
            title: currentCategorie,
            description: '',
            priority: 'normal',
            duration_days: node.data.temps || 0,
            tag: node.data.systemTag || null,
            subcategories: [],
          };
          content.categories.push(category);
        } else if (node.data.systemTag) {
          category.tag = node.data.systemTag;
        }

        if (!categorySet.has(catKey)) {
          categorySet.add(catKey);
          libraryItems.push({
            id: itemId++,
            title: currentCategorie,
            type: 'category',
            tags: '',
            duration: node.data.temps || 0,
            content_json: JSON.stringify({
              category: {
                title: currentCategorie,
                description: '',
                priority: 'normal',
                duration_days: node.data.temps || 0,
                tag: null,
              },
            }),
          });
        }

        if (node.type === 'souscategorie' && node.data.sousCat1) {
          const subCatKey = `${catKey}_${node.data.sousCat1}`;
          if (!category.subcategories.find(s => s.title === node.data.sousCat1)) {
            category.subcategories.push({
              title: node.data.sousCat1,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
              tag: node.data.systemTag || null,
            });
          }

          if (!subcategorySet.has(subCatKey)) {
            subcategorySet.add(subCatKey);
            libraryItems.push({
              id: itemId++,
              title: node.data.sousCat1,
              type: 'subcategory',
              tags: tags,
              duration: node.data.temps || 0,
              content_json: JSON.stringify({
                subcategory: {
                  title: node.data.sousCat1,
                  description: '',
                  priority: 'normal',
                  duration_days: node.data.temps || 0,
                  tag: node.data.systemTag || null,
                },
              }),
            });
          }
        }

        cardItem.content_json = JSON.stringify(content);
      }
    }

    if (node.children) {
      node.children.forEach(child =>
        processNode(child, currentChapitre, currentCarte, currentCategorie)
      );
    }
  };

  treeData.forEach(node => processNode(node));
  return libraryItems;
}

// Fonction de migration pour restaurer les champs tags/temps manquants
function migrateLibraryTree(tree) {
  const newTree = JSON.parse(JSON.stringify(tree));

  function traverseNodes(nodes) {
    for (const node of nodes) {
      if (!node.data) node.data = {};

      // Migrer selon le type de nœud
      if (node.type === 'chapitre') {
        node.data.chapitre = node.data.chapitre || node.titre || '';
        node.data.temps = node.data.temps || 0;
        // Pas de tags pour chapitre
      } else if (node.type === 'carte') {
        node.data.carte = node.data.carte || node.titre || '';
        node.data.temps = node.data.temps || 0;
        node.data.systemTag = '';
      } else if (node.type === 'categorie') {
        node.data.categorie = node.data.categorie || node.titre || '';
        node.data.temps = node.data.temps || 0;
        node.data.systemTag = node.data.systemTag || '';
      } else if (node.type === 'souscategorie') {
        node.data.sousCat1 = node.data.sousCat1 || node.titre || '';
        node.data.temps = node.data.temps || 0;
        node.data.systemTag = node.data.systemTag || '';
      }

      if (node.children && node.children.length > 0) {
        traverseNodes(node.children);
      }
    }
  }

  traverseNodes(newTree);
  return newTree;
}


// parseCSV, buildTree, treeToCSV imported from libraryEditorUtils

function TreeNode({
  node,
  onEdit,
  onDelete,
  onAddChild,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDragLeave,
  draggedNode,
  dragOverNode,
  dropPosition,
}) {
  const [isExpanded, setIsExpanded] = useState(node.expanded !== false);
  const [localData, setLocalData] = useState(node.data);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setLocalData(node.data);
    }
  }, [node.data, isEditing]);

  const handleChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    setIsEditing(true);
    onEdit(node.id, updatedData);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const typeConfig = {
    chapitre: { color: 'text-accent font-bold', bg: 'bg-[var(--accent-soft)]', label: 'Chapitre' },
    carte: {
      color: 'text-[var(--accent)] font-semibold',
      bg: 'bg-[var(--normal-soft)]',
      label: 'Carte',
    },
    categorie: {
      color: 'text-[var(--done)] font-medium',
      bg: 'bg-[var(--done-soft)]',
      label: 'Action',
    },
    souscategorie: { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Tâche' },
  };

  const config = typeConfig[node.type] || typeConfig.categorie;
  const hasChildren = node.children && node.children.length > 0;
  const canAddChild =
    node.type === 'categorie' || node.type === 'chapitre' || node.type === 'carte';

  return (
    <div className="ml-4">
      <div
        className={`flex items-center gap-2 py-3 px-3 rounded ${config.bg} hover:bg-[var(--bg-card-hover)] transition-colors
          ${draggedNode?.id === node.id ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
          ${dragOverNode?.id === node.id && dropPosition === 'inside' ? 'ring-2 ring-purple-500 ring-offset-1' : ''}
          ${dragOverNode?.id === node.id && dropPosition === 'before' ? 'border-t-2 border-t-purple-500' : ''}
          ${dragOverNode?.id === node.id && dropPosition === 'after' ? 'border-b-2 border-b-purple-500' : ''}
        `}
        draggable
        onDragStart={e => onDragStart(e, node)}
        onDragOver={e => onDragOver(e, node)}
        onDrop={e => onDrop(e, node)}
        onDragEnd={onDragEnd}
        onDragLeave={onDragLeave}
      >
        {/* Poignée de drag */}
        <GripVertical size={16} className="text-gray-400 cursor-grab flex-shrink-0" />

        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-[var(--txt-secondary)]" />
            ) : (
              <ChevronRight size={16} className="text-[var(--txt-secondary)]" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <span className={`min-w-[100px] text-xs ${config.color}`}>{config.label}</span>

        {node.type === 'chapitre' && (
          <>
            <input
              type="text"
              value={localData.chapitre || ''}
              onChange={e => handleChange('chapitre', e.target.value)}
              onBlur={handleBlur}
              className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] font-medium cursor-text"
              placeholder="Titre du chapitre"
            />
          </>
        )}

        {node.type === 'carte' && (
          <>
            <input
              type="text"
              value={localData.carte || ''}
              onChange={e => handleChange('carte', e.target.value)}
              onBlur={handleBlur}
              className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
              placeholder="Nom de la carte"
            />
          </>
        )}

        {node.type === 'categorie' && (
          <>
            <input
              type="text"
              value={localData.categorie || ''}
              onChange={e => handleChange('categorie', e.target.value)}
              onBlur={handleBlur}
              className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
              placeholder="Action"
            />
            <div className="flex-[2]"></div>
          </>
        )}

        {node.type === 'souscategorie' && (
          <>
            <input
              type="text"
              value={localData.sousCat1 || ''}
              onChange={e => handleChange('sousCat1', e.target.value)}
              onBlur={handleBlur}
              className="flex-[2] px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
              placeholder="Tâche"
            />
            <button
              onClick={() => onAddChild(node)}
              className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded"
              title="Ajouter une sous-tâche"
            >
              <Plus size={16} />
            </button>
          </>
        )}

        <input
          type="number"
          value={localData.temps || 0}
          onChange={e => handleChange('temps', parseInt(e.target.value) || 0)}
          onBlur={handleBlur}
          className="w-20 px-2 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] text-center cursor-text"
          placeholder="Temps"
        />

        {node.type === 'chapitre' || node.type === 'carte' ? (
          <>
            <select
              disabled
              className="w-32 px-2 py-1.5 text-sm bg-[var(--bg-disabled)] border border-[var(--border)] rounded text-[var(--txt-muted)] cursor-not-allowed"
            >
              <option value="">Tag Revue d'activité...</option>
            </select>
          </>
        ) : (
          <>
            <select
              value={localData.systemTag || ''}
              onChange={e => handleChange('systemTag', e.target.value)}
              onBlur={handleBlur}
              className="w-32 px-2 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-pointer"
            >
              <option value="">Tag Revue d'activité...</option>
              {loadTagsData().map(tag => (
                <option key={tag.id} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>
          </>
        )}

        {canAddChild && (
          <button
            onClick={() => onAddChild(node)}
            className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded"
            title="Ajouter"
          >
            <Plus size={16} />
          </button>
        )}

        <button
          onClick={() => onDelete(node)}
          className="p-1.5 text-[var(--urgent)] hover:bg-[var(--urgent-soft)] rounded"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l-2 border-[var(--border)] ml-3">
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.id + idx}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onDragLeave={onDragLeave}
              draggedNode={draggedNode}
              dragOverNode={dragOverNode}
              dropPosition={dropPosition}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryEditor() {
  const [treeData, setTreeData] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [treeKey, setTreeKey] = useState(0);
  const [showXmlImportModal, setShowXmlImportModal] = useState(false);
  const [xmlItems, setXmlItems] = useState([]);
  const [selectedXmlItems, setSelectedXmlItems] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOverNode, setDragOverNode] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before', 'after', 'inside'

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        // Appliquer la migration pour restaurer les champs tags/temps manquants
        const migrated = migrateLibraryTree(parsed);
        setTreeData(migrated);
        // Si la migration a modifié les données, les sauvegarder
        if (JSON.stringify(migrated) !== stored) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
      } catch {
        const tree = convertLibraryDataToTree(libraryTemplates);
        setTreeData(tree);
      }
    } else {
      const tree = convertLibraryDataToTree(libraryTemplates);
      setTreeData(tree);
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
        data: {
          ...parentNode.data,
          carte: 'Nouvelle carte',
          categorie: '',
          sousCat1: '',
          sousCat2: '',
          sousCat3: '',
          systemTag: '',
        },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'carte') {
      newNode = {
        id: `cat_${Date.now()}`,
        type: 'categorie',
        titre: 'Nouvelle catégorie',
        data: {
          ...parentNode.data,
          categorie: 'Nouvelle catégorie',
          sousCat1: '',
          sousCat2: '',
          sousCat3: '',
          systemTag: parentNode.data.systemTag || '',
        },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'categorie') {
      newNode = {
        id: `sc_${Date.now()}`,
        type: 'souscategorie',
        titre: 'Nouvelle tâche',
        data: {
          ...parentNode.data,
          sousCat1: 'Nouvelle tâche',
          sousCat2: '',
          sousCat3: '',
          systemTag: parentNode.data.systemTag || '',
        },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'souscategorie') {
      newNode = {
        id: `sst_${Date.now()}`,
        type: 'souscategorie',
        titre: 'Nouvelle sous-tâche',
        data: {
          ...parentNode.data,
          sousCat1: 'Nouvelle sous-tâche',
          sousCat2: '',
          sousCat3: '',
        },
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

  // Fonctions de drag and drop
  const handleDragStart = useCallback((e, node) => {
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
    // Stocker l'ID du nœud pour référence
    e.dataTransfer.setData('text/plain', node.id);
  }, []);

  const handleDragOver = useCallback(
    (e, targetNode) => {
      e.preventDefault();
      if (!draggedNode || draggedNode.id === targetNode.id) return;

      // Déterminer la position de drop basée sur la position verticale de la souris
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const threshold = rect.height / 3;

      let position;
      if (offsetY < threshold) {
        position = 'before';
      } else if (offsetY > rect.height - threshold) {
        position = 'after';
      } else {
        // Si la cible peut accueillir des enfants (et que ce n'est pas un sous-types不合适), proposer 'inside'
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

      // Valider le drop
      if (!isValidDropTarget(draggedNode, targetNode, position)) {
        alert("Opération non autorisée : ce déplacement n'est pas possible");
        setDraggedNode(null);
        setDragOverNode(null);
        setDropPosition(null);
        return;
      }

      setTreeData(prev => {
        const newData = JSON.parse(JSON.stringify(prev));

        // 1. Retirer le nœud déplacé de son parent actuel
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

        if (!removedNode) {
          console.error('Node not found for removal');
          return prev;
        }

        // 2. Insérer le nœud à la nouvelle position
        const insertIntoTree = nodes => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === targetNode.id) {
              if (position === 'inside') {
                // Déposer à l'intérieur (comme enfant)
                if (!nodes[i].children) nodes[i].children = [];
                nodes[i].children.push(removedNode);
                nodes[i].expanded = true;
              } else if (position === 'before') {
                // Insérer avant
                nodes.splice(i, 0, removedNode);
              } else {
                // Insérer après
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

  // Vérifie si un drop est valide selon les règles métier
  const isValidDropTarget = (dragged, target, position) => {
    // Empêcher le déplacement d'un nœud dans son propre descendant
    const isDescendant = (node, childId) => {
      if (!node.children) return false;
      for (const child of node.children) {
        if (child.id === childId || isDescendant(child, childId)) {
          return true;
        }
      }
      return false;
    };

    // Vérifier que dragged n'est pas un descendant de target
    if (position === 'inside' && isDescendant(target, dragged.id)) {
      return false;
    }

    // Règles selon les types
    if (dragged.type === 'chapitre') {
      // Un chapitre ne peut être déposé qu'à la racine (before/after sur un autre chapitre)
      if (position === 'inside') return false;
      if (target.type !== 'chapitre') return false;
      return true;
    }

    if (dragged.type === 'carte') {
      // Une carte peut:
      // - être déposée sur un chapitre (inside) → changer de chapitre
      // - être déposée avant/après une autre carte (même niveau)
      if (position === 'inside') {
        return target.type === 'chapitre';
      }
      // before/after seulement sur une carte
      return target.type === 'carte';
    }

    if (dragged.type === 'categorie') {
      // Une catégorie peut:
      // - être déposée sur une carte (inside) → changer de carte
      // - être déposée avant/après une autre catégorie (même carte)
      if (position === 'inside') {
        return target.type === 'carte';
      }
      return target.type === 'categorie';
    }

    if (dragged.type === 'souscategorie') {
      // Une sous-catégorie peut:
      // - être déposée sur une catégorie (inside) → changer de catégorie
      // - être déposée avant/après une autre sous-catégorie (même catégorie)
      if (position === 'inside') {
        return target.type === 'categorie';
      }
      return target.type === 'souscategorie';
    }

    return false;
  };

  const handleAddRoot = useCallback(() => {
    const newNode = {
      id: `chap_${Date.now()}`,
      type: 'chapitre',
      titre: 'Nouveau chapitre',
      data: {
        numero: '',
        chapitre: 'Nouveau chapitre',
        carte: '',
        categorie: '',
        sousCat1: '',
        sousCat2: '',
        sousCat3: '',
        temps: 0,
        systemTag: '',
      },
      children: [],
      expanded: true,
    };

    setTreeData(prev => [...prev, newNode]);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(treeData));

    // Convert tree to library items
    const newLibraryItems = convertTreeToLibraryItems(treeData);

    // Try to update main database, or create it if it doesn't exist
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
      // Create new database structure
      const newDb = {
        boards: [],
        columns: [],
        cards: [],
        categories: [],
        subcategories: [],
        libraryItems: newLibraryItems,
        messages: [],
        nextIds: {
          board: 1,
          column: 1,
          card: 1,
          category: 1,
          subcategory: 1,
          libraryItem: newLibraryItems.length + 1,
          message: 1,
        },
        orders: [],
      };
      localStorage.setItem('c-projets_db', JSON.stringify(newDb));
    }

    // Dispatch event to notify other components
    window.dispatchEvent(new Event('library-updated'));

    setHasChanges(false);
    alert('Modifications enregistrées !');
  }, [treeData]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Réinitialiser toutes les modifications ?')) return;
    localStorage.removeItem(STORAGE_KEY);
    const tree = convertLibraryDataToTree(libraryTemplates);
    setTreeData(tree);
    setHasChanges(false);
  }, []);

  const handleXmlFileSelect = useCallback(event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result;
        const items = parseMSProjectXml(content);
        setXmlItems(items);
        setSelectedXmlItems(items.map(i => i.id));
        setShowXmlImportModal(true);
      } catch (error) {
        alert(`Erreur lors du parsing XML: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const toggleXmlItem = useCallback(itemId => {
    setSelectedXmlItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  }, []);

  const selectAllXmlItems = useCallback(() => {
    setSelectedXmlItems(xmlItems.map(i => i.id));
  }, [xmlItems]);

  const deselectAllXmlItems = useCallback(() => {
    setSelectedXmlItems([]);
  }, []);

  const handleConfirmXmlImport = useCallback(() => {
    const selectedItems = xmlItems.filter(i => selectedXmlItems.includes(i.id));
    if (selectedItems.length === 0) {
      alert('Veuillez sélectionner au moins un élément à importer');
      return;
    }

    const roundToHalf = num => Math.round(num * 2) / 2;

    const convertXmlItemsToNodes = items => {
      const rootNodes = [];
      const stack = [];

      items.forEach(item => {
        while (stack.length > 0 && stack[stack.length - 1].outlineLevel >= item.outlineLevel) {
          stack.pop();
        }

        let chapitre = '';
        let carte = '';
        let categorie = '';

        if (item.outlineLevel === 1) {
          chapitre = item.name;
        } else if (item.outlineLevel === 2) {
          const parent = stack.find(p => p.outlineLevel === 1);
          chapitre = parent ? parent.name : '';
          carte = item.name;
        } else if (item.outlineLevel === 3) {
          const parentChap = stack.find(p => p.outlineLevel === 1);
          const parentCart = stack.find(p => p.outlineLevel === 2);
          chapitre = parentChap ? parentChap.name : '';
          carte = parentCart ? parentCart.name : '';
          categorie = item.name;
        } else {
          const parentChap = stack.find(p => p.outlineLevel === 1);
          const parentCart = stack.find(p => p.outlineLevel === 2);
          const parentCat = stack.find(p => p.outlineLevel === 3);
          chapitre = parentChap ? parentChap.name : '';
          carte = parentCart ? parentCart.name : '';
          categorie = parentCat ? parentCat.name : '';
        }

        const node = {
          id: crypto.randomUUID(),
          type:
            item.outlineLevel === 1
              ? 'chapitre'
              : item.outlineLevel === 2
                ? 'carte'
                : item.outlineLevel === 3
                  ? 'categorie'
                  : 'souscategorie',
          titre: item.name,
          expanded: true,
          children: [],
          data: {
            chapitre,
            carte,
            categorie,
            sousCat1: item.outlineLevel >= 4 ? item.name : '',
            temps: roundToHalf(item.duration),
            systemTag: '',
          },
        };

        if (stack.length === 0) {
          rootNodes.push(node);
        } else {
          const parent = stack[stack.length - 1];
          if (parent.node && parent.node.children !== undefined) {
            parent.node.children.push(node);
          }
        }

        stack.push({ ...item, node });
      });

      return rootNodes;
    };

    const newNodes = convertXmlItemsToNodes(selectedItems);

    const addNodesToTree = (existingNodes, newNodes) => {
      newNodes.forEach(newNode => {
        existingNodes.push(JSON.parse(JSON.stringify(newNode)));
      });
      return existingNodes;
    };

    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      return addNodesToTree(newData, newNodes);
    });

    setHasChanges(true);
    setShowXmlImportModal(false);
    setXmlItems([]);
    setSelectedXmlItems([]);
    alert(`${selectedItems.length} élément(s) importé(s) avec succès`);
  }, [xmlItems, selectedXmlItems]);

  const expandAll = useCallback(() => {
    const expand = nodes => {
      nodes.forEach(n => {
        n.expanded = true;
        if (n.children) expand(n.children);
      });
    };
    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      expand(newData);
      return newData;
    });
    setTreeKey(k => k + 1);
  }, []);

  const collapseAll = useCallback(() => {
    const collapse = nodes => {
      nodes.forEach(n => {
        n.expanded = false;
        if (n.children) collapse(n.children);
      });
    };
    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      collapse(newData);
      return newData;
    });
    setTreeKey(k => k + 1);
  }, []);

  const createCompleteChains = useCallback(() => {
    let createdCount = 0;

    const processNode = node => {
      if (node.type === 'carte') {
        const hasCategoryChildren =
          node.children && node.children.some(child => child.type === 'categorie');
        if (!hasCategoryChildren) {
          const cardTitle = node.data.carte || node.titre;
          node.children = node.children || [];
          node.children.push({
            id: `auto_cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'categorie',
            titre: cardTitle,
            data: {
              ...node.data,
              categorie: cardTitle,
              sousCat1: '',
              sousCat2: '',
              sousCat3: '',
            },
            children: [
              {
                id: `auto_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'souscategorie',
                titre: cardTitle,
                data: {
                  ...node.data,
                  sousCat1: cardTitle,
                  sousCat2: '',
                  sousCat3: '',
                },
                children: [],
                expanded: true,
              },
            ],
            expanded: true,
          });
          createdCount++;
        }
      }

      if (node.type === 'categorie') {
        const hasSubcategoryChildren =
          node.children && node.children.some(child => child.type === 'souscategorie');
        if (!hasSubcategoryChildren) {
          const categoryTitle = node.data.categorie || node.titre;
          node.children = node.children || [];
          node.children.push({
            id: `auto_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'souscategorie',
            titre: categoryTitle,
            data: {
              ...node.data,
              sousCat1: categoryTitle,
              sousCat2: '',
              sousCat3: '',
            },
            children: [],
            expanded: true,
          });
          createdCount++;
        }
      }

      if (node.children) {
        node.children.forEach(child => processNode(child));
      }
    };

    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.forEach(node => processNode(node));
      return newData;
    });
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
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const today = new Date().toISOString().split('T')[0];
    const tasks = [];
    let uidCounter = 1;

    const processNode = (node, outlineLevel = 1) => {
      const duration = node.data?.temps || 0;
      const durationStr = duration > 0 ? `P${duration}D` : `PT1H0M0S`;
      const taskName = node.titre || node.data?.title || '';
      const systemTag = node.data?.systemTag || '';
      const notes = systemTag;

      const task = {
        UID: uidCounter++,
        ID: uidCounter - 1,
        Name: taskName,
        Manual: 0,
        Type: 1,
        IsNull: 0,
        CreateDate: `${today}T09:00:00`,
        WBS: uidCounter - 1,
        OutlineNumber: uidCounter - 1,
        OutlineLevel: outlineLevel,
        Priority: 500,
        Start: `${today}T09:00:00`,
        Finish: `${today}T10:00:00`,
        Duration: durationStr,
        ManualStart: `${today}T09:00:00`,
        ManualFinish: `${today}T10:00:00`,
        ManualDuration: durationStr,
        DurationFormat: 7,
        Work: durationStr,
        PercentComplete: 0,
        ActualDuration: 0,
        ActualStart: '',
        ActualFinish: '',
        FreeSlack: 0,
        TotalSlack: 0,
        FixedCost: 0,
        FixedCostAccrual: 3,
        PercentWorkComplete: 0,
        PhysicalPercentComplete: 0,
        Milestone: 0,
        Summary: node.children && node.children.length > 0 ? 1 : 0,
        Critical: 0,
        Notes: notes,
      };
      tasks.push(task);

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => processNode(child, outlineLevel + 1));
      }
    };

    treeData.forEach(node => processNode(node));

    let tasksXML = '';
    tasks.forEach(task => {
      const actualStartXml = task.ActualStart
        ? `<ActualStart>${task.ActualStart}</ActualStart>`
        : '';
      const actualFinishXml = task.ActualFinish
        ? `<ActualFinish>${task.ActualFinish}</ActualFinish>`
        : '';

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
			<ActualDuration>${task.ActualDuration}</ActualDuration>${actualStartXml}${actualFinishXml}
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={createCompleteChains}
            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
            title="Crée automatiquement les catégories/sous-catégories manquantes pour compléter les chaînes"
          >
            <Layers size={14} />
            Créer chaînes complètes
          </button>
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout déplier
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout replier
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRoot}
            className="flex items-center px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90"
          >
            <Plus size={16} className="mr-1" /> Ajouter Chapitre
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded"
            title="Réinitialiser"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            <Download size={16} className="mr-1" /> Exporter
          </button>
          <label className="flex items-center px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)] cursor-pointer">
            <Upload size={16} className="mr-1" /> Importer XML
            <input type="file" accept=".xml" className="hidden" onChange={handleXmlFileSelect} />
          </label>
          <button
            onClick={handleSave}
            className={`flex items-center px-3 py-1.5 text-sm rounded ${hasChanges ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'bg-[var(--border)] text-[var(--txt-muted)] cursor-not-allowed'}`}
            disabled={!hasChanges}
          >
            <Save size={16} className="mr-1" /> Enregistrer
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-[var(--txt-secondary)] pb-2 border-b border-[var(--border)]">
        <span className="w-[100px]">Type</span>
        <span className="flex-1">Titre</span>
        <span className="flex-[2]">Tâche</span>
        <span className="w-20 text-center">Temps repères</span>
        <span className="w-32 text-[var(--txt-muted)]">Tag Revue d'activité</span>
        <span className="w-16"></span>
      </div>

      <div
        className="flex-1 overflow-auto"
        key={treeKey}
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {treeData.map((node, idx) => (
          <TreeNode
            key={node.id + idx}
            node={node}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            draggedNode={draggedNode}
            dragOverNode={dragOverNode}
            dropPosition={dropPosition}
          />
        ))}
      </div>

      {treeData.length === 0 && (
        <div className="text-center py-8 text-[var(--txt-muted)]">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune donnée. Cliquez sur &quot;Ajouter Chapitre&quot; pour commencer.</p>
        </div>
      )}

      {showXmlImportModal && xmlItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] rounded-lg shadow-xl w-full max-w-4xl border border-[var(--border)] p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--txt-primary)]">
                Import XML MS Project - Sélection des éléments
              </h3>
              <button
                onClick={() => {
                  setShowXmlImportModal(false);
                  setXmlItems([]);
                  setSelectedXmlItems([]);
                }}
                className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
              >
                <Trash2 size={20} className="text-[var(--txt-muted)]" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--txt-secondary)]">
                {selectedXmlItems.length} / {xmlItems.length} élément(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllXmlItems}
                  className="px-3 py-1 text-xs bg-[var(--bg-card-hover)] hover:bg-[var(--border)] rounded"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={deselectAllXmlItems}
                  className="px-3 py-1 text-xs bg-[var(--bg-card-hover)] hover:bg-[var(--border)] rounded"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-[var(--border)] rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-card-hover)] sticky top-0">
                  <tr>
                    <th className="w-12 p-2 text-left"></th>
                    <th className="p-2 text-left text-[var(--txt-secondary)]">Niveau</th>
                    <th className="p-2 text-left text-[var(--txt-secondary)]">Nom</th>
                    <th className="w-24 p-2 text-right text-[var(--txt-secondary)]">Durée (j)</th>
                  </tr>
                </thead>
                <tbody>
                  {xmlItems.map(item => {
                    const LevelIcon =
                      item.outlineLevel === 1
                        ? Folder
                        : item.outlineLevel === 2
                          ? FileText
                          : item.outlineLevel === 3
                            ? List
                            : CheckSquare;
                    const levelLabel =
                      item.outlineLevel === 1
                        ? 'Chapitre'
                        : item.outlineLevel === 2
                          ? 'Carte'
                          : item.outlineLevel === 3
                            ? 'Catégorie'
                            : 'Tâche';
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] ${
                          selectedXmlItems.includes(item.id) ? 'bg-[var(--accent)]/10' : ''
                        }`}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedXmlItems.includes(item.id)}
                            onChange={() => toggleXmlItem(item.id)}
                            className="w-4 h-4 accent-[var(--accent)]"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <LevelIcon size={16} className="text-[var(--txt-muted)]" />
                            <span style={{ marginLeft: `${(item.outlineLevel - 1) * 16}px` }}>
                              {levelLabel}
                            </span>
                          </div>
                        </td>
                        <td
                          className="p-2 text-[var(--txt-primary)]"
                          style={{ paddingLeft: `${item.outlineLevel * 16 + 8}px` }}
                        >
                          {item.name}
                        </td>
                        <td className="p-2 text-right text-[var(--txt-secondary)]">
                          {item.duration > 0 ? `${item.duration}j` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowXmlImportModal(false);
                  setXmlItems([]);
                  setSelectedXmlItems([]);
                }}
                className="px-4 py-2 text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmXmlImport}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
              >
                Importer la sélection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryEditor;
