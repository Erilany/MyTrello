import React from 'react';
import { GripVertical, CheckSquare } from 'lucide-react';
import { formatDate, LEVEL_ICONS } from './planningUtils';

export function XmlTree({ xmlItems, draggedItemIds, selectedXmlIdsSet, handleDragStart, toggleXmlSelection }) {
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

  return <>{roots.map(renderRecursive)}</>;
}
