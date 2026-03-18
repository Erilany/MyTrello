import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
import { getOrderedChapters } from '../../data/ChaptersData';

function ChaptersDragDrop({ chapters: propChapters, onReorder }) {
  const [chapters, setChapters] = useState(propChapters || []);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    setChapters(propChapters || []);
  }, [propChapters]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...chapters];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    onReorder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const addSpacer = index => {
    const newOrder = [...chapters];
    const spacerId = `__spacer_${Date.now()}__`;
    newOrder.splice(index + 1, 0, spacerId);
    onReorder(newOrder);
  };

  const removeSpacer = index => {
    const newOrder = [...chapters];
    newOrder.splice(index, 1);
    onReorder(newOrder);
  };

  const isSpacer = item => typeof item === 'string' && item.startsWith('__spacer_');

  if (!chapters || chapters.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted py-2">Aucun chapitre trouvé dans la bibliothèque</p>
        <button
          onClick={() => addSpacer(-1)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-card-hover border border-std rounded hover:border-accent"
          title="Ajouter un espacement"
        >
          <Plus size={12} />
          Espacement
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {chapters.map((chapter, index) => {
        const spacer = isSpacer(chapter);

        if (spacer) {
          return (
            <div key={chapter} className="flex items-center gap-1">
              <div className="w-16 h-8 bg-card-hover border-2 border-dashed border-std rounded flex items-center justify-center">
                <span className="text-xs text-muted">vide</span>
              </div>
              <button
                onClick={() => removeSpacer(index)}
                className="p-1 text-muted hover:text-red-500 rounded"
                title="Supprimer l'espacement"
              >
                <X size={14} />
              </button>
              <button
                onClick={() => addSpacer(index)}
                className="p-1 text-muted hover:text-accent rounded"
                title="Ajouter un espacement après"
              >
                <Plus size={14} />
              </button>
            </div>
          );
        }

        return (
          <div key={chapter} className="flex items-center gap-1">
            <div
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-2 px-3 py-2 bg-card border rounded cursor-move select-none
                transition-all duration-150 flex-shrink-0
                ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                ${
                  dragOverIndex === index && draggedIndex !== index
                    ? 'border-accent bg-accent/10'
                    : 'border-std hover:border-accent/50'
                }
              `}
            >
              <GripVertical size={14} className="text-muted flex-shrink-0" />
              <span className="text-sm text-primary whitespace-nowrap">{chapter}</span>
            </div>
            <button
              onClick={() => addSpacer(index)}
              className="p-1 text-muted hover:text-accent rounded"
              title="Ajouter un espacement après"
            >
              <Plus size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ChaptersDragDrop;
