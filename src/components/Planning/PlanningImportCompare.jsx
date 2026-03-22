import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Upload, Folder, FileText, List, CheckSquare, GripVertical, Trash2 } from 'lucide-react';
import { parseMSProjectXmlWithDates } from '../../utils/xmlParser';

const LEVEL_ICONS = {
  1: Folder,
  2: FileText,
  3: List,
  4: CheckSquare,
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  } catch {
    return '-';
  }
}

function normalizeChapter(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/s$/, '')
    .trim();
}

function PlanningImportCompare({
  isOpen,
  onClose,
  projectData,
  onImport,
  boardTitle,
  orderedChapters,
  importing,
}) {
  const [xmlItems, setXmlItems] = useState([]);
  const [draggedItems, setDraggedItems] = useState([]);
  const [selectedXmlIds, setSelectedXmlIds] = useState(new Set());
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [pendingDragIds, setPendingDragIds] = useState([]);
  const [createFullChains, setCreateFullChains] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  const toggleChapter = useCallback(chapterId => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  const projectChapters = useMemo(() => {
    const chapters = [];
    const seen = new Set();
    const isSpacer = item => typeof item === 'string' && item.startsWith('__spacer_');

    if (orderedChapters && orderedChapters.length > 0) {
      orderedChapters.forEach(ch => {
        if (!seen.has(normalizeChapter(ch)) && !isSpacer(ch)) {
          seen.add(normalizeChapter(ch));
          chapters.push({ id: `lib_${ch}`, name: ch, type: 'chapter', level: 1 });
        }
      });
    }

    return chapters.length > 0 ? chapters : [];
  }, [orderedChapters]);

  const projectHierarchy = useMemo(() => {
    const cards = projectData?.cards || [];
    const categories = projectData?.categories || [];
    const subcategories = projectData?.subcategories || [];

    return projectChapters.map(chapter => {
      const chapterCards = cards.filter(
        card => card.chapter && normalizeChapter(card.chapter) === normalizeChapter(chapter.name)
      );

      return {
        ...chapter,
        children: chapterCards.map(card => {
          const cardCategories = categories.filter(c => Number(c.card_id) === Number(card.id));
          return {
            id: `card_${card.id}`,
            name: card.title,
            type: 'card',
            level: 2,
            cardId: card.id,
            children: cardCategories.map(cat => {
              const catSubcats = subcategories.filter(
                s => Number(s.category_id) === Number(cat.id)
              );
              return {
                id: `cat_${cat.id}`,
                name: cat.title,
                type: 'category',
                level: 3,
                cardId: card.id,
                categoryId: cat.id,
                children: catSubcats.map(sub => ({
                  id: `sub_${sub.id}`,
                  name: sub.title,
                  type: 'subcategory',
                  level: 4,
                  cardId: card.id,
                  categoryId: cat.id,
                  children: [],
                })),
              };
            }),
          };
        }),
      };
    });
  }, [projectChapters, projectData]);

  const xmlHierarchy = useMemo(() => {
    const root = { children: [] };
    const stack = [{ node: root, level: 0 }];

    const sortedItems = [...xmlItems].sort((a, b) => a.outlineLevel - b.outlineLevel);

    sortedItems.forEach(item => {
      while (stack.length > 1 && stack[stack.length - 1].level >= item.outlineLevel) {
        stack.pop();
      }
      const newNode = { ...item, children: [], isProject: false };
      stack[stack.length - 1].node.children.push(newNode);
      stack.push({ node: newNode, level: item.outlineLevel });
    });

    return root.children;
  }, [xmlItems]);

  const findMatchingChapter = useCallback(
    xmlChapterName => {
      const normalized = normalizeChapter(xmlChapterName);
      for (const ch of projectChapters) {
        if (normalizeChapter(ch.name) === normalized) {
          return ch.name;
        }
      }
      return null;
    },
    [projectChapters]
  );

  const getDraggedItemsForDropZone = useCallback(
    dropZoneId => {
      return draggedItems.filter(d => d.dropZoneId === dropZoneId);
    },
    [draggedItems]
  );

  const getDraggedCount = useCallback(
    chapterName => {
      return draggedItems.filter(
        d => normalizeChapter(d.assignedChapter) === normalizeChapter(chapterName)
      ).length;
    },
    [draggedItems]
  );

  const buildDraggedHierarchy = useCallback(
    (chapterName, projectCards) => {
      const chapterDragged = draggedItems.filter(
        d => normalizeChapter(d.assignedChapter) === normalizeChapter(chapterName)
      );

      const getChildren = (parentCardId, parentCategoryId) => {
        return chapterDragged.filter(
          d =>
            Number(d.parentCardId) === Number(parentCardId) &&
            Number(d.parentCategoryId) === Number(parentCategoryId)
        );
      };

      const renderDraggedChildren = (parentCardId, parentCategoryId, level) => {
        const children = getChildren(parentCardId, parentCategoryId);
        return children.map(child => (
          <div key={`dragged_${child.originalId}`}>
            {renderDraggedItem(child, level)}
            {renderDraggedChildren(
              child.cardId || child.parentCardId,
              child.categoryId || child.parentCategoryId,
              level + 1
            )}
          </div>
        ));
      };

      return { chapterDragged, getChildren, renderDraggedChildren };
    },
    [draggedItems]
  );

  useEffect(() => {
    if (!isOpen) {
      setXmlItems([]);
      setDraggedItems([]);
      setSelectedXmlIds(new Set());
    }
  }, [isOpen]);

  const handleFileSelect = useCallback(event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const items = parseMSProjectXmlWithDates(e.target.result);
        setXmlItems(items);
        setDraggedItems([]);
        setSelectedXmlIds(new Set());
      } catch (error) {
        alert(`Erreur lors du parsing XML: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const draggedItemIds = useMemo(
    () => new Set(draggedItems.map(d => d.originalId)),
    [draggedItems]
  );

  const selectedXmlIdsSet = useMemo(() => new Set(selectedXmlIds), [selectedXmlIds]);

  const handleDragStart = useCallback(
    (e, item, source) => {
      if (source === 'xml') {
        if (!selectedXmlIdsSet.has(item.id) || draggedItemIds.has(item.id)) {
          e.preventDefault();
          return;
        }
        const idsToDrag = [...selectedXmlIdsSet].filter(id => !draggedItemIds.has(id));
        setPendingDragIds(idsToDrag);
      }
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({
          item,
          source,
          pendingIds: [...selectedXmlIdsSet].filter(id => !draggedItemIds.has(id)),
        })
      );
      e.dataTransfer.effectAllowed = 'copy';
    },
    [selectedXmlIdsSet, draggedItemIds]
  );

  const handleDragOver = useCallback((e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverTarget(targetId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e, dropZone, parentChapter) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverTarget(null);

      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.source !== 'xml') return;

        const pendingIds = data.pendingIds || [data.item.id];
        let assignedChapter = parentChapter;
        if (!assignedChapter && dropZone.type === 'chapter') {
          assignedChapter = dropZone.name;
        }

        const allToAdd = [];
        const addedIds = new Set();

        pendingIds.forEach(itemId => {
          const xmlItem = xmlItems.find(i => i.id === itemId);
          if (!xmlItem || xmlItem.outlineLevel === 1) return;
          if (draggedItemIds.has(xmlItem.id)) return;
          if (addedIds.has(xmlItem.id)) return;

          const itemIndex = xmlItems.indexOf(xmlItem);
          const itemsToAdd = [xmlItem];
          let i = itemIndex + 1;
          while (i < xmlItems.length) {
            if (xmlItems[i].outlineLevel > xmlItem.outlineLevel) {
              itemsToAdd.push(xmlItems[i]);
              i++;
            } else {
              break;
            }
          }

          itemsToAdd.forEach(item => {
            if (draggedItemIds.has(item.id) || addedIds.has(item.id) || item.outlineLevel === 1)
              return;
            addedIds.add(item.id);

            let itemParentCardId = null;
            let itemParentCatId = null;

            if (item.outlineLevel === 2) {
              itemParentCardId = null;
              itemParentCatId = null;
            } else if (item.outlineLevel === 3) {
              itemParentCardId = dropZone.type === 'card' ? dropZone.cardId : null;
              itemParentCatId = null;
            } else if (item.outlineLevel >= 4) {
              if (dropZone.type === 'category') {
                itemParentCardId = dropZone.cardId;
                itemParentCatId = dropZone.categoryId;
              } else if (dropZone.type === 'card') {
                itemParentCardId = dropZone.cardId;
                itemParentCatId = null;
              } else if (dropZone.type === 'chapter') {
                itemParentCardId = null;
                itemParentCatId = null;
              }
            }

            allToAdd.push({
              ...item,
              assignedChapter,
              parentCardId: itemParentCardId,
              parentCategoryId: itemParentCatId,
              dropZoneId: dropZone.id,
              id: `dragged_${item.id}_${Date.now()}`,
              originalId: item.id,
            });
          });
        });

        if (allToAdd.length > 0) {
          setDraggedItems(prev => [...prev, ...allToAdd]);
          setSelectedXmlIds(prev => {
            const next = new Set(prev);
            allToAdd.forEach(i => next.delete(i.originalId));
            return next;
          });
        }
      } catch (error) {
        console.error('Drop error:', error);
      }
    },
    [draggedItemIds, xmlItems]
  );

  const removeDraggedItem = useCallback(originalId => {
    setDraggedItems(prev => prev.filter(d => d.originalId !== originalId));
  }, []);

  const removeDraggedItemWithChildren = useCallback((originalId, allXmlItems) => {
    const itemToRemove = allXmlItems.find(i => i.id === originalId);
    if (!itemToRemove) return;

    const idsToRemove = new Set([originalId]);
    let i = allXmlItems.indexOf(itemToRemove);
    while (i < allXmlItems.length - 1) {
      i++;
      if (allXmlItems[i].outlineLevel > itemToRemove.outlineLevel) {
        idsToRemove.add(allXmlItems[i].id);
      } else {
        break;
      }
    }

    setDraggedItems(prev => prev.filter(d => !idsToRemove.has(d.originalId)));
  }, []);

  const toggleXmlSelection = useCallback(
    (item, allXmlItems) => {
      const isCurrentlySelected = selectedXmlIdsSet.has(item.id);
      const isAlreadyDragged = draggedItemIds.has(item.id);
      if (isAlreadyDragged) return;

      const itemIndex = allXmlItems.indexOf(item);
      const childrenIds = [item.id];
      let i = itemIndex + 1;
      while (i < allXmlItems.length) {
        if (allXmlItems[i].outlineLevel > item.outlineLevel) {
          childrenIds.push(allXmlItems[i].id);
          i++;
        } else {
          break;
        }
      }

      setSelectedXmlIds(prev => {
        const next = new Set(prev);
        if (isCurrentlySelected) {
          childrenIds.forEach(id => next.delete(id));
        } else {
          childrenIds.forEach(id => next.add(id));
        }
        return next;
      });
    },
    [selectedXmlIdsSet, draggedItemIds]
  );

  const toggleXmlItem = useCallback(
    (item, allXmlItems, assignedChapter = 'Sans chapitre') => {
      const isAlreadyDragged = draggedItemIds.has(item.id);

      if (isAlreadyDragged) {
        removeDraggedItemWithChildren(item.id, allXmlItems);
        setSelectedXmlIds(prev => {
          const next = new Set(prev);
          const itemIndex = allXmlItems.indexOf(item);
          let i = itemIndex + 1;
          while (i < allXmlItems.length) {
            if (allXmlItems[i].outlineLevel > item.outlineLevel) {
              next.delete(allXmlItems[i].id);
              i++;
            } else {
              break;
            }
          }
          return next;
        });
      } else {
        const itemIndex = allXmlItems.indexOf(item);
        const itemsToAdd = [item];
        let i = itemIndex + 1;
        while (i < allXmlItems.length) {
          if (allXmlItems[i].outlineLevel > item.outlineLevel) {
            itemsToAdd.push(allXmlItems[i]);
            i++;
          } else {
            break;
          }
        }

        const toAdd = itemsToAdd
          .filter(i => !draggedItemIds.has(i.id) && i.outlineLevel !== 1)
          .map(i => ({
            ...i,
            assignedChapter,
            parentCardId: null,
            parentCategoryId: null,
            dropZoneId: `xml_${assignedChapter}`,
            id: `dragged_${i.id}_${Date.now()}`,
            originalId: i.id,
          }));

        setDraggedItems(prev => [...prev, ...toAdd]);
        setSelectedXmlIds(prev => {
          const next = new Set(prev);
          itemsToAdd.forEach(i => next.delete(i.id));
          return next;
        });
      }
    },
    [draggedItemIds, removeDraggedItemWithChildren]
  );

  const selectAllForChapter = useCallback(
    (chapterName, items) => {
      const existingIds = new Set(draggedItems.map(d => d.originalId));

      const toAdd = items
        .filter(item => item.outlineLevel !== 1 && !existingIds.has(item.id))
        .map(item => ({
          ...item,
          assignedChapter: chapterName,
          parentCardId: null,
          parentCategoryId: null,
          dropZoneId: `xml_${chapterName}`,
          id: `dragged_${item.id}_${Date.now()}`,
          originalId: item.id,
        }));

      if (toAdd.length > 0) {
        setDraggedItems(prev => [...prev, ...toAdd]);
      }
    },
    [draggedItems]
  );

  const confirmImport = useCallback(() => {
    if (draggedItems.length === 0) {
      alert('Veuillez sélectionner au moins un élément à importer');
      return;
    }

    const result = {
      items: draggedItems,
      parentChapter: null,
      createFullChains: createFullChains,
    };

    onImport(result);
  }, [draggedItems, onImport, createFullChains]);

  const handleResetDragged = useCallback(() => {
    setDraggedItems([]);
    setSelectedXmlIds(new Set());
  }, []);

  const wasImporting = useRef(false);

  useEffect(() => {
    if (wasImporting.current && importing === false && xmlItems.length > 0) {
      onClose();
    }
    wasImporting.current = importing;
  }, [importing, xmlItems.length, onClose]);

  const handleClose = useCallback(() => {
    if (!importing) {
      onClose();
    }
  }, [importing, onClose]);

  const renderProjectItem = (item, level, parentChapter) => {
    const Icon = LEVEL_ICONS[level] || CheckSquare;
    const isDropTarget = dragOverTarget === item.id;
    const zoneDragged = getDraggedItemsForDropZone(item.id);

    const colors = {
      2: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-400',
        text: 'text-green-900 dark:text-green-100',
      },
      3: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-400',
        text: 'text-yellow-900 dark:text-yellow-100',
      },
      4: {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-300 dark:border-gray-600',
        text: 'text-gray-700 dark:text-gray-200',
      },
    };

    const levelColors = colors[level] || colors[4];
    const levelTextSizes = { 2: 'text-sm', 3: 'text-xs', 4: 'text-xs' };

    const dropZone = {
      id: item.id,
      type: item.type,
      name: item.name,
      cardId: item.cardId,
      categoryId: item.categoryId,
    };

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-1.5 px-3 rounded border-l-4 transition-all ${levelColors.bg} ${levelColors.border} ${
            isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''
          }`}
          style={{ marginLeft: `${(level - 1) * 16}px` }}
          onDragOver={e => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, dropZone, parentChapter)}
        >
          <Icon size={12} className="flex-shrink-0 text-gray-500" />
          <span
            className={`flex-1 ${levelTextSizes[level] || 'text-sm'} font-medium ${levelColors.text} truncate`}
          >
            {item.name}
          </span>
          {zoneDragged.length > 0 && (
            <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
              +{zoneDragged.length}
            </span>
          )}
        </div>
        {item.children?.map(child => renderProjectItem(child, level + 1, parentChapter))}
        {zoneDragged.map(dragged => renderDraggedItem(dragged, level + 1))}
      </div>
    );
  };

  const renderDraggedItem = (item, level) => {
    const Icon = LEVEL_ICONS[item.outlineLevel] || CheckSquare;
    const levelSize = item.outlineLevel >= 3 ? 'text-xs' : 'text-sm';
    const isDropTarget = dragOverTarget === `dragged_${item.originalId}`;

    const dropZone = {
      id: `dragged_${item.originalId}`,
      type: item.outlineLevel === 2 ? 'card' : item.outlineLevel === 3 ? 'category' : 'subcategory',
      name: item.name,
      cardId: item.parentCardId,
      categoryId: item.parentCategoryId,
    };

    return (
      <div
        key={`dragged_${item.originalId}`}
        onDragOver={e => handleDragOver(e, `dragged_${item.originalId}`)}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, dropZone, item.assignedChapter)}
        className={`flex items-center gap-2 py-1 px-2 rounded border-l-4 bg-green-200 dark:bg-green-800/50 border-green-500 ${levelSize} ${
          isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''
        }`}
        style={{ marginLeft: `${level * 16}px` }}
      >
        <Icon size={10} className="flex-shrink-0 text-green-700 dark:text-green-300" />
        <span className="flex-1 text-green-800 dark:text-green-200 truncate font-medium">
          {item.name}
        </span>
        {draggedItems.filter(
          d =>
            d.parentCardId === item.cardId &&
            d.parentCategoryId === item.categoryId &&
            d.assignedChapter === item.assignedChapter &&
            d.originalId !== item.originalId
        ).length > 0 && (
          <span className="text-xs bg-green-500 text-white px-1 py-0.5 rounded">
            +
            {
              draggedItems.filter(
                d =>
                  d.parentCardId === item.cardId &&
                  d.parentCategoryId === item.categoryId &&
                  d.assignedChapter === item.assignedChapter &&
                  d.originalId !== item.originalId
              ).length
            }
          </span>
        )}
        <button
          onClick={() => removeDraggedItem(item.originalId)}
          className="p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded text-red-500"
          title="Retirer"
        >
          <Trash2 size={10} />
        </button>
      </div>
    );
  };

  const renderXmlItem = (item, onSelectAll, childItems) => {
    const Icon = LEVEL_ICONS[item.outlineLevel] || CheckSquare;
    const isDragged = draggedItemIds.has(item.id);
    const isSelected = selectedXmlIdsSet.has(item.id);
    const isDraggable = !isDragged && isSelected && !isChapter;
    const isChapter = item.outlineLevel === 1;
    const levelSize = item.outlineLevel >= 3 ? 'text-xs' : 'text-sm';
    const importableChildren = childItems.filter(
      c => c.outlineLevel !== 1 && !draggedItemIds.has(c.id)
    );

    const bgByLevel = {
      1: 'bg-blue-50 dark:bg-blue-900/30 border-blue-400',
      2: 'bg-green-50 dark:bg-green-900/30 border-green-400',
      3: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400',
      4: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
    };

    const textByLevel = {
      1: 'font-bold text-blue-900 dark:text-blue-100',
      2: 'font-semibold text-green-900 dark:text-green-100',
      3: 'font-medium text-yellow-900 dark:text-yellow-100',
      4: 'text-gray-700 dark:text-gray-200',
    };

    return (
      <div key={item.id}>
        <div
          draggable={isDraggable}
          onDragStart={e => isDraggable && handleDragStart(e, item, 'xml')}
          className={`flex items-center gap-2 py-2 px-3 rounded border-l-4 transition-all ${
            isChapter
              ? 'opacity-60 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
              : isDragged
                ? 'opacity-40 line-through bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                : isSelected
                  ? 'cursor-grab hover:shadow-md'
                  : 'cursor-pointer'
          } ${bgByLevel[item.outlineLevel] || bgByLevel[4]} border-transparent`}
          style={{ marginLeft: `${(item.outlineLevel - 1) * 16}px` }}
        >
          <input
            type="checkbox"
            checked={isSelected || isDragged}
            disabled={isChapter || isDragged}
            onChange={() => {}}
            onClick={e => {
              e.stopPropagation();
              if (!isChapter && !isDragged) {
                toggleXmlSelection(item, xmlItems);
              }
            }}
            className="w-4 h-4 accent-green-500 z-10 relative cursor-pointer"
          />
          <GripVertical
            size={12}
            className={`flex-shrink-0 ${isChapter || isDragged ? 'text-gray-400' : 'text-gray-500'}`}
          />
          <Icon
            size={item.outlineLevel >= 3 ? 12 : 14}
            className={`flex-shrink-0 ${
              isChapter || isDragged
                ? 'text-gray-400'
                : item.outlineLevel === 1
                  ? 'text-blue-600'
                  : item.outlineLevel === 2
                    ? 'text-green-600'
                    : item.outlineLevel === 3
                      ? 'text-yellow-600'
                      : 'text-gray-500'
            }`}
          />
          <span
            className={`flex-1 ${levelSize} ${
              isChapter
                ? 'text-gray-500 italic'
                : isDragged
                  ? 'text-gray-500 line-through'
                  : textByLevel[item.outlineLevel] || textByLevel[4]
            } truncate`}
          >
            {item.name}
          </span>
          <span className={`${levelSize} text-gray-400`}>{formatDate(item.start)}</span>
          <span className={`${levelSize} text-gray-400`}>{formatDate(item.finish)}</span>
          <span className={`${levelSize} text-gray-500 w-12 text-right font-mono`}>
            {item.duration > 0 ? `${item.duration}j` : '-'}
          </span>
          {!isChapter && importableChildren.length > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                const allItems = [item, ...importableChildren];
                allItems.forEach(i => {
                  if (!draggedItemIds.has(i.id) && !selectedXmlIdsSet.has(i.id)) {
                    toggleXmlSelection(i, xmlItems);
                  }
                });
              }}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-0.5 rounded z-10 relative"
              title="Sélectionner tout"
            >
              +{importableChildren.length + 1}
            </button>
          )}
        </div>
        {childItems.map(child => renderXmlItem(child, onSelectAll, []))}
      </div>
    );
  };

  const renderChapterDropZone = chapter => {
    const isDropTarget = dragOverTarget === chapter.id;
    const chapterDragged = draggedItems.filter(
      d => normalizeChapter(d.assignedChapter) === normalizeChapter(chapter.name)
    );
    const existingCardCount = chapter.children?.length || 0;
    const draggedCount = chapterDragged.length;

    const getDraggedChildren = (parentCardId, parentCategoryId) => {
      return chapterDragged.filter(
        d =>
          Number(d.parentCardId) === Number(parentCardId) &&
          Number(d.parentCategoryId) === Number(parentCategoryId)
      );
    };

    const renderProjectCardWithDraggedChildren = (card, level) => {
      const cardKey = `${chapter.id}|${card.id}`;
      const isCardExpanded = true;
      const cardDraggedChildren = getDraggedChildren(card.cardId || card.id, null);
      const cardSubcats = card.categories || [];

      return (
        <div key={card.id}>
          <div
            className={`flex items-center gap-2 py-1.5 px-3 rounded border-l-4 transition-all bg-green-50 dark:bg-green-900/20 border-green-400 text-green-900 dark:text-green-100 ${
              isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''
            }`}
            style={{ marginLeft: `${level * 16}px` }}
            onDragOver={e => handleDragOver(e, cardKey)}
            onDragLeave={handleDragLeave}
            onDrop={e =>
              handleDrop(
                e,
                { id: cardKey, type: 'card', name: card.name, cardId: card.id },
                chapter.name
              )
            }
          >
            <Folder size={12} className="flex-shrink-0 text-green-600" />
            <span className="flex-1 text-sm font-medium truncate">{card.name}</span>
            {cardDraggedChildren.length > 0 && (
              <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                +{cardDraggedChildren.length}
              </span>
            )}
          </div>
          {cardSubcats.map(cat => {
            const catKey = `${cardKey}|${cat.id}`;
            const catDraggedChildren = getDraggedChildren(card.id, cat.categoryId || cat.id);
            return (
              <div key={cat.id}>
                <div
                  className="flex items-center gap-2 py-1 px-2 rounded border-l-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-900 dark:text-yellow-100 text-xs"
                  style={{ marginLeft: `${(level + 1) * 16}px` }}
                  onDragOver={e => handleDragOver(e, catKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={e =>
                    handleDrop(
                      e,
                      {
                        id: catKey,
                        type: 'category',
                        name: cat.name,
                        cardId: card.id,
                        categoryId: cat.categoryId || cat.id,
                      },
                      chapter.name
                    )
                  }
                >
                  <List size={10} className="flex-shrink-0 text-yellow-600" />
                  <span className="flex-1 truncate font-medium">{cat.name}</span>
                  {catDraggedChildren.length > 0 && (
                    <span className="text-xs bg-yellow-500 text-white px-1 py-0.5 rounded">
                      +{catDraggedChildren.length}
                    </span>
                  )}
                </div>
                {catDraggedChildren.map(dragged => renderDraggedItem(dragged, level + 2))}
              </div>
            );
          })}
          {cardDraggedChildren.map(dragged => renderDraggedItem(dragged, level + 1))}
        </div>
      );
    };

    const renderDraggedCardWithChildren = (draggedCard, level, renderedIds) => {
      if (renderedIds.has(draggedCard.originalId)) return null;
      renderedIds.add(draggedCard.originalId);

      const draggedKey = `dragged_${draggedCard.originalId}`;
      const cardId = draggedCard.cardId || draggedCard.parentCardId;
      const cardDraggedChildren = chapterDragged.filter(
        d =>
          d.outlineLevel === 2 && d.parentCardId === cardId && Number(d.parentCategoryId || 0) === 0
      );
      const catDraggedChildren = chapterDragged.filter(
        d =>
          d.outlineLevel === 3 && d.parentCardId === cardId && Number(d.parentCategoryId || 0) > 0
      );

      return (
        <div key={draggedKey}>
          {renderDraggedItem(draggedCard, level)}
          {cardDraggedChildren.map(child =>
            renderDraggedCardWithChildren(child, level + 1, renderedIds)
          )}
          {catDraggedChildren.map(child =>
            renderDraggedCatWithChildren(child, level + 1, renderedIds)
          )}
        </div>
      );
    };

    const renderDraggedCatWithChildren = (draggedCat, level, renderedIds) => {
      if (renderedIds.has(draggedCat.originalId)) return null;
      renderedIds.add(draggedCat.originalId);

      const draggedKey = `dragged_${draggedCat.originalId}`;
      const catId = draggedCat.categoryId || draggedCat.parentCategoryId;
      const subDraggedChildren = chapterDragged.filter(
        d =>
          d.outlineLevel >= 4 &&
          d.parentCardId === (draggedCat.cardId || draggedCat.parentCardId) &&
          d.parentCategoryId === catId
      );

      return (
        <div key={draggedKey}>
          {renderDraggedItem(draggedCat, level)}
          {subDraggedChildren.map(child =>
            renderDraggedSubWithChildren(child, level + 1, renderedIds)
          )}
        </div>
      );
    };

    const renderDraggedSubWithChildren = (draggedSub, level, renderedIds) => {
      if (renderedIds.has(draggedSub.originalId)) return null;
      renderedIds.add(draggedSub.originalId);

      const draggedKey = `dragged_${draggedSub.originalId}`;
      return <div key={draggedKey}>{renderDraggedItem(draggedSub, level)}</div>;
    };

    const renderRootDraggedItems = () => {
      const renderedIds = new Set();
      const rootItems = chapterDragged.filter(d => {
        if (d.outlineLevel === 2) return true;
        if (d.outlineLevel === 3) {
          const hasParentInDragged = chapterDragged.some(
            p => p.outlineLevel === 2 && p.originalId === d.parentCardId
          );
          return !hasParentInDragged;
        }
        if (d.outlineLevel >= 4) {
          const hasCatParent = chapterDragged.some(
            c => c.outlineLevel === 3 && c.originalId === d.parentCategoryId
          );
          const hasCardParent = chapterDragged.some(
            p => p.outlineLevel === 2 && p.originalId === d.parentCardId
          );
          return !hasCatParent && !hasCardParent;
        }
        return false;
      });

      const renderFlatItem = item => {
        if (renderedIds.has(item.originalId)) return null;
        renderedIds.add(item.originalId);
        const level = item.outlineLevel;
        return (
          <div key={`dragged_${item.originalId}`}>
            {renderDraggedItem(item, level)}
            {chapterDragged
              .filter(d => {
                if (renderedIds.has(d.originalId)) return false;
                if (d.outlineLevel === 3 && d.parentCardId === item.originalId) return true;
                if (
                  d.outlineLevel >= 4 &&
                  d.parentCardId === item.originalId &&
                  !d.parentCategoryId
                )
                  return true;
                return false;
              })
              .map(child => renderFlatItem(child))}
            {chapterDragged
              .filter(d => {
                if (renderedIds.has(d.originalId)) return false;
                if (d.outlineLevel >= 4 && d.parentCategoryId) {
                  const parentCat = chapterDragged.find(c => c.originalId === d.parentCategoryId);
                  if (
                    parentCat &&
                    (parentCat.originalId === item.originalId ||
                      parentCat.parentCardId === item.originalId)
                  )
                    return true;
                }
                return false;
              })
              .map(child => renderFlatItem(child))}
          </div>
        );
      };

      return <>{rootItems.map(dragged => renderFlatItem(dragged))}</>;
    };

    const isExpanded = expandedChapters.has(chapter.id);

    return (
      <div key={chapter.id} className="mb-3">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded border-l-4 bg-blue-50 dark:bg-blue-900/20 border-blue-400 font-bold text-blue-900 dark:text-blue-100 transition-colors ${
            isDropTarget
              ? 'ring-2 ring-blue-400 bg-blue-100 dark:bg-blue-900/40'
              : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
          onDragOver={e => handleDragOver(e, chapter.id)}
          onDragLeave={handleDragLeave}
          onDrop={e =>
            handleDrop(e, { id: chapter.id, type: 'chapter', name: chapter.name }, chapter.name)
          }
        >
          <button
            onClick={() => toggleChapter(chapter.id)}
            className="flex items-center justify-center w-5 h-5 text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 rounded"
          >
            {isExpanded ? '-' : '+'}
          </button>
          <Folder size={16} className="text-blue-600" />
          <span className="flex-1 truncate">{chapter.name}</span>
          <span className="text-xs text-blue-500">({existingCardCount + draggedCount})</span>
        </div>
        {isExpanded && (
          <div style={{ marginLeft: '16px' }}>
            {chapter.children?.map(card => renderProjectCardWithDraggedChildren(card, 2))}
            {renderRootDraggedItems()}
          </div>
        )}
      </div>
    );
  };

  const getXmlChildren = parentItem => {
    if (!parentItem) return xmlItems.filter(i => i.outlineLevel > 1);

    const parentLevel = parentItem.outlineLevel;
    const parentIndex = xmlItems.indexOf(parentItem);
    const siblings = [];

    for (let i = parentIndex + 1; i < xmlItems.length; i++) {
      if (xmlItems[i].outlineLevel <= parentLevel) break;
      siblings.push(xmlItems[i]);
    }

    return siblings;
  };

  const renderXmlTree = () => {
    const roots = xmlItems.filter(i => i.outlineLevel === 1);
    const processed = new Set();

    const renderRecursive = item => {
      if (processed.has(item.id)) return null;
      processed.add(item.id);

      const children = getXmlChildren(item);
      const isDragged = draggedItemIds.has(item.id);
      const isSelected = selectedXmlIdsSet.has(item.id);
      const isDraggable = !isDragged && isSelected;
      const importableChildren = children.filter(
        c => c.outlineLevel !== 1 && !draggedItemIds.has(c.id)
      );

      return (
        <div key={item.id}>
          <div
            draggable={isDraggable}
            onDragStart={e => isDraggable && handleDragStart(e, item, 'xml')}
            className={`flex items-center gap-2 py-2 px-3 rounded border-l-4 transition-all ${
              isDragged
                ? 'opacity-40 line-through bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                : isSelected
                  ? 'cursor-grab hover:shadow-md'
                  : 'cursor-pointer'
            } ${item.outlineLevel === 1 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400' : item.outlineLevel === 2 ? 'bg-green-50 dark:bg-green-900/30 border-green-400' : item.outlineLevel === 3 ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400' : 'bg-white dark:bg-gray-800 border-gray-300'}`}
            style={{ marginLeft: `${(item.outlineLevel - 1) * 16}px` }}
          >
            <input
              type="checkbox"
              checked={isSelected || isDragged}
              onChange={() => {}}
              onClick={e => {
                e.stopPropagation();
                if (item.outlineLevel !== 1 && !isDragged) {
                  toggleXmlSelection(item, xmlItems);
                }
              }}
              className="w-4 h-4 accent-green-500 z-10 relative cursor-pointer"
              disabled={item.outlineLevel === 1 || isDragged}
            />
            <GripVertical size={12} className="text-gray-500 flex-shrink-0" />
            {React.createElement(LEVEL_ICONS[item.outlineLevel] || CheckSquare, {
              size: item.outlineLevel >= 3 ? 12 : 14,
              className: `flex-shrink-0 ${item.outlineLevel === 1 ? 'text-blue-600' : item.outlineLevel === 2 ? 'text-green-600' : item.outlineLevel === 3 ? 'text-yellow-600' : 'text-gray-500'}`,
            })}
            <span
              className={`flex-1 ${item.outlineLevel >= 3 ? 'text-xs' : 'text-sm'} ${
                item.outlineLevel === 1
                  ? 'font-bold text-blue-900 dark:text-blue-100'
                  : item.outlineLevel === 2
                    ? 'font-semibold text-green-900 dark:text-green-100'
                    : item.outlineLevel === 3
                      ? 'font-medium text-yellow-900 dark:text-yellow-100'
                      : 'text-gray-700 dark:text-gray-200'
              } truncate`}
            >
              {item.name}
            </span>
            <span className="text-xs text-gray-400">{formatDate(item.start)}</span>
            <span className="text-xs text-gray-400">{formatDate(item.finish)}</span>
            <span className="text-xs text-gray-500 w-12 text-right font-mono">
              {item.duration > 0 ? `${item.duration}j` : '-'}
            </span>
            {!item.isChapter && importableChildren.length > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  const allItems = [item, ...importableChildren];
                  allItems.forEach(i => {
                    if (!draggedItemIds.has(i.id) && !selectedXmlIdsSet.has(i.id)) {
                      toggleXmlSelection(i, xmlItems);
                    }
                  });
                }}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-0.5 rounded z-10 relative"
                title="Sélectionner tout avec enfants"
              >
                +{importableChildren.length + 1}
              </button>
            )}
          </div>
          {children.map(child => renderRecursive(child))}
        </div>
      );
    };

    return roots.map(renderRecursive);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-lg shadow-xl w-full max-w-7xl border border-[var(--border)] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {importing && (
              <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <h2 className="text-lg font-semibold text-[var(--txt-primary)]">
              {importing ? 'Importation en cours...' : `Import MS Project - ${boardTitle}`}
            </h2>
          </div>
          {!importing && (
            <button onClick={handleClose} className="p-1 hover:bg-[var(--bg-card-hover)] rounded">
              <X size={20} className="text-[var(--txt-muted)]" />
            </button>
          )}
        </div>

        {importing && (
          <div className="p-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-accent mb-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-lg font-medium text-[var(--txt-primary)]">
              Importation des tâches en cours...
            </p>
            <p className="text-sm text-[var(--txt-secondary)] mt-2">
              Veuillez patienter, cela peut prendre quelques instants.
            </p>
          </div>
        )}

        {!importing && (
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg cursor-pointer hover:opacity-90 w-fit">
              <Upload size={16} />
              <span>Sélectionner un fichier XML MS Project</span>
              <input type="file" accept=".xml" className="hidden" onChange={handleFileSelect} />
            </label>
            {xmlItems.length > 0 && (
              <span className="text-sm text-[var(--txt-secondary)]">
                {xmlItems.length} élément(s) - {draggedItems.length} à importer
              </span>
            )}
            {draggedItems.length > 0 && (
              <button
                onClick={handleResetDragged}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg"
              >
                <Trash2 size={14} />
                Réinitialiser ({draggedItems.length})
              </button>
            )}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 border-r border-[var(--border)] flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-medium text-[var(--txt-primary)]">Données du Projet</h3>
              {projectChapters.length > 0 && (
                <button
                  onClick={() => {
                    if (expandedChapters.size === projectChapters.length) {
                      setExpandedChapters(new Set());
                    } else {
                      setExpandedChapters(new Set(projectChapters.map(ch => ch.id)));
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                >
                  {expandedChapters.size === projectChapters.length
                    ? 'Tout réplier'
                    : 'Tout déplier'}
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--txt-muted)] px-3 py-2">
              Droppez ici pour ajouter au projet
            </p>
            <div className="flex-1 overflow-y-auto p-2">
              {projectHierarchy.length === 0 ? (
                <div className="text-center py-8 text-[var(--txt-muted)]">
                  <p>Aucun projet</p>
                </div>
              ) : (
                projectHierarchy.map(renderChapterDropZone)
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-[var(--border)]">
              <h3 className="font-medium text-[var(--txt-primary)]">Données XML</h3>
              <p className="text-xs text-[var(--txt-muted)]">
                {draggedItems.length} élément(s) sélectionné(s)
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {xmlItems.length === 0 ? (
                <div className="text-center py-8 text-[var(--txt-muted)]">
                  <Upload size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Sélectionnez un fichier XML</p>
                </div>
              ) : (
                renderXmlTree()
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-xs text-[var(--txt-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded"></span> Sélectionné
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gray-400 rounded opacity-50"></span> Chapitre
              </span>
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--txt-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={createFullChains}
                onChange={e => setCreateFullChains(e.target.checked)}
                className="w-4 h-4 accent-green-500"
              />
              Créer chaînes complètes
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded-lg disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={confirmImport}
              disabled={draggedItems.length === 0 || importing}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Importation...
                </>
              ) : (
                <>Importer ({draggedItems.length})</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanningImportCompare;
