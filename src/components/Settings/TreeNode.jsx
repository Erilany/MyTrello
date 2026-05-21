import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { loadTagsData } from '../../data/TagsData';

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

export function TreeNode({
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
  if (!node || typeof node !== 'object' || !node.type) return null;

  const safeData = node.data || {};
  const [isExpanded, setIsExpanded] = useState(node.expanded !== false);
  const [localData, setLocalData] = useState(safeData);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      const safeData = node?.data || {};
      setLocalData(safeData);
    }
  }, [node, node?.data, isEditing]);

  const handleChange = (field, value) => {
    const currentData = localData || node?.data || {};
    const updatedData = { ...currentData, [field]: value };
    setLocalData(updatedData);
    setIsEditing(true);
    onEdit(node.id, updatedData);
  };

  const handleBlur = () => {
    setIsEditing(false);
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
          <input
            type="text"
            value={localData?.chapitre || node?.titre || ''}
            onChange={e => handleChange('chapitre', e.target.value)}
            onBlur={handleBlur}
            className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] font-medium cursor-text"
            placeholder="Titre du chapitre"
          />
        )}

        {node.type === 'carte' && (
          <input
            type="text"
            value={localData?.carte || node?.titre || ''}
            onChange={e => handleChange('carte', e.target.value)}
            onBlur={handleBlur}
            className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
            placeholder="Nom de la carte"
          />
        )}

        {node.type === 'categorie' && (
          <>
            <input
              type="text"
              value={localData?.categorie || node?.titre || ''}
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
              value={localData?.sousCat1 || node?.titre || ''}
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
          value={localData?.temps || 0}
          onChange={e => handleChange('temps', parseInt(e.target.value) || 0)}
          onBlur={handleBlur}
          className="w-20 px-2 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] text-center cursor-text"
          placeholder="Temps"
        />

        {node.type === 'chapitre' || node.type === 'carte' ? (
          <select
            disabled
            className="w-32 px-2 py-1.5 text-sm bg-[var(--bg-disabled)] border border-[var(--border)] rounded text-[var(--txt-muted)] cursor-not-allowed"
          >
            <option value="">Tag Revue d'activité...</option>
          </select>
        ) : (
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

export default TreeNode;
