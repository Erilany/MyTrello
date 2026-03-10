import React, { useState, useEffect, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useApp } from '../../context/AppContext';
import Card from '../Card/Card';
import { MoreHorizontal, Plus, Pencil, Trash2, Palette } from 'lucide-react';

function Column({ column, index }) {
  const { cards, createCard, updateColumn, deleteColumn, currentBoard, cardColors } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const droppableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (showMenu && !e.target.closest('.column-menu')) {
        setShowMenu(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    const handleLibraryDrop = e => {
      const { columnId, boardId, data } = e.detail;
      if (columnId === column.id) {
        console.log('[Column] Library drop handled', { columnId: column.id });
      }
    };

    window.addEventListener('library-drop', handleLibraryDrop);
    return () => window.removeEventListener('library-drop', handleLibraryDrop);
  }, [column.id, column.board_id]);

  const columnCards = cards
    .filter(card => Number(card.column_id) === Number(column.id))
    .sort((a, b) => a.position - b.position);

  const getColumnStyle = colTitle => {
    const t = (colTitle || '').toLowerCase();

    if (cardColors.etudes.keywords.some(k => t.includes(k))) {
      return {
        background: `linear-gradient(90deg, ${cardColors.etudes.gradient[0]}, ${cardColors.etudes.gradient[1]})`,
      };
    }
    if (cardColors.enCours.keywords.some(k => t.includes(k))) {
      return {
        background: `linear-gradient(90deg, ${cardColors.enCours.gradient[0]}, ${cardColors.enCours.gradient[1]})`,
      };
    }
    if (cardColors.realise.keywords.some(k => t.includes(k))) {
      return {
        background: `linear-gradient(90deg, ${cardColors.realise.gradient[0]}, ${cardColors.realise.gradient[1]})`,
      };
    }
    if (cardColors.archive.keywords.some(k => t.includes(k))) {
      return { background: cardColors.archive.gradient[0] };
    }
    return {
      background: `linear-gradient(90deg, ${cardColors.enCours.gradient[0]}, ${cardColors.enCours.gradient[1]})`,
    };
  };

  const getColumnClass = colTitle => {
    const t = (colTitle || '').toLowerCase();
    if (cardColors.etudes.keywords.some(k => t.includes(k))) return 'accent-bar-etudes';
    if (cardColors.enCours.keywords.some(k => t.includes(k))) return 'accent-bar-en-cours';
    if (cardColors.realise.keywords.some(k => t.includes(k))) return 'accent-bar-realise';
    if (cardColors.archive.keywords.some(k => t.includes(k))) return 'accent-bar-archive';
    return 'accent-bar-en-cours';
  };

  const handleUpdateColumn = async () => {
    if (title.trim()) {
      await updateColumn(column.id, title.trim(), column.color);
    }
    setIsEditing(false);
  };

  const handleDeleteColumn = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette colonne ?')) {
      await deleteColumn(column.id);
    }
  };

  const handleCreateCard = e => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      createCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setShowNewCard(false);
    }
  };

  const handleColorChange = async color => {
    await updateColumn(column.id, column.title, color);
    setShowColorPicker(false);
  };

  const colors = [
    '#6366f1',
    '#f59e0b',
    '#22c55e',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
  ];

  const getAnimationClass = () => {
    return '';
  };

  return (
    <div
      className={`flex-shrink-0 w-[310px] bg-column rounded-lg flex flex-col h-[calc(100vh-180px)] border border-std ${getAnimationClass()}`}
    >
      <div className="p-3 flex items-center justify-between flex-shrink-0 bg-column relative sticky top-0 z-20">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleUpdateColumn}
            onKeyDown={e => {
              if (e.key === 'Enter') handleUpdateColumn();
              if (e.key === 'Escape') {
                setTitle(column.title);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-2 py-1 text-sm font-display font-bold bg-input border border-std rounded focus:outline-none focus:border-accent"
            style={{ letterSpacing: '0.2px' }}
            autoFocus
          />
        ) : (
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: column.color, boxShadow: `0 0 6px ${column.color}` }}
            />
            <h3
              className="font-display text-sm font-bold text-primary"
              style={{ letterSpacing: '0.2px' }}
            >
              {column.title}
            </h3>
            <span className="ml-2 text-xs text-muted">({columnCards.length})</span>
          </div>
        )}

        <div className="relative column-menu">
          <button onClick={() => setShowMenu(!showMenu)} className="icon-btn">
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card rounded-lg shadow-card py-1 z-[100] w-44 border border-std">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-card-hover"
              >
                <Pencil size={14} className="mr-2 text-secondary" />
                Renommer
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-card-hover"
                >
                  <Palette size={14} className="mr-2 text-secondary" />
                  Couleur
                </button>
                {showColorPicker && (
                  <div className="absolute left-full top-0 ml-1 bg-card rounded-lg shadow-card p-2 grid grid-cols-4 gap-1.5 z-[99999]">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className="w-5 h-5 rounded-full hover:ring-2 hover:ring-white/30 transition-std"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleDeleteColumn}
                className="flex items-center w-full px-3 py-2 text-sm text-urgent hover:bg-card-hover"
              >
                <Trash2 size={14} className="mr-2" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-1 flex flex-col min-h-0"
        onDragOver={e => {
          if (window.__isLibraryDrag) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={e => {
          if (!window.__isLibraryDrag) return;
          e.preventDefault();
          console.log('[Column] Native drop detected', { columnId: column.id });
          const data = e.dataTransfer.getData('application/json');
          if (data) {
            console.log('[Column] Native drop data:', data);
            const event = new CustomEvent('library-drop', {
              detail: {
                columnId: column.id,
                boardId: column.board_id,
                data: JSON.parse(data),
              },
            });
            window.dispatchEvent(event);
          } else if (window.__libraryDragData) {
            console.log('[Column] Using stored drag data');
            const event = new CustomEvent('library-drop', {
              detail: {
                columnId: column.id,
                boardId: column.board_id,
                data: window.__libraryDragData,
              },
            });
            window.dispatchEvent(event);
            window.__libraryDragData = null;
          }
          window.__isLibraryDrag = false;
        }}
      >
        <Droppable droppableId={String(column.id)} type="card" isDropDisabled={false}>
          {(provided, snapshot) => (
            <div
              ref={node => {
                provided.innerRef(node);
                droppableRef.current = node;
              }}
              {...provided.droppableProps}
              className={`flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin ${
                snapshot.isDraggingOver ? 'bg-card/50' : ''
              }`}
            >
              {columnCards.map((card, idx) => (
                <Draggable key={card.id} draggableId={String(card.id)} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={e => {
                        if (snapshot.isDragging) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      <Card
                        card={card}
                        isDragging={snapshot.isDragging}
                        columnColor={column.color}
                        columnTitle={column.title}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      <div className="p-2 border-t border-std">
        {showNewCard ? (
          <form onSubmit={handleCreateCard}>
            <input
              type="text"
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              placeholder="Titre de la carte..."
              className="w-full px-3 py-2 text-sm bg-input border border-std rounded-md text-primary placeholder-muted focus:outline-none focus:border-accent"
              autoFocus
              onBlur={() => {
                if (!newCardTitle.trim()) setShowNewCard(false);
              }}
            />
            <div className="flex items-center mt-2 space-x-2">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-md hover:opacity-90 transition-std"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewCardTitle('');
                  setShowNewCard(false);
                }}
                className="px-3 py-1.5 text-sm text-secondary hover:text-primary"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewCard(true)}
            className="w-full flex items-center justify-center py-2 text-sm text-secondary hover:text-primary hover:bg-card rounded-md transition-std"
          >
            <Plus size={16} className="mr-1" />
            Ajouter une carte
          </button>
        )}
      </div>
    </div>
  );
}

export default Column;
