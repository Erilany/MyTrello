import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { useApp } from '../../context/AppContext';
import Card from '../Card/Card';
import { MoreHorizontal, Plus, Pencil, Trash2, Palette } from 'lucide-react';

function Column({ column }) {
  const { cards, createCard, updateColumn, deleteColumn, moveCard, currentBoard } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest('.column-menu')) {
        setShowMenu(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const columnCards = cards
    .filter(card => card.column_id === column.id)
    .sort((a, b) => a.position - b.position);

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

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      await createCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setShowNewCard(false);
    }
  };

  const handleColorChange = async (color) => {
    await updateColumn(column.id, column.title, color);
    setShowColorPicker(false);
  };

  const colors = [
    '#4A90D9', '#50C878', '#F5A623', '#D0021B', '#9013FE',
    '#4A90D9', '#7ED321', '#F8E71C', '#BD10E0', '#B8E986'
  ];

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col h-full max-h-full overflow-hidden">
      <div className="p-3 flex items-center justify-between flex-shrink-0 bg-gray-100 dark:bg-gray-800">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateColumn}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateColumn();
              if (e.key === 'Escape') {
                setTitle(column.title);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-2 py-1 text-sm font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <div 
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{column.title}</h3>
            <span className="ml-2 text-xs text-gray-400">({columnCards.length})</span>
          </div>
        )}

        <div className="relative column-menu">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-500 hover:bg-gray-200 rounded"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 w-40 border dark:border-gray-700">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Pencil size={14} className="mr-2" />
                Renommer
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Palette size={14} className="mr-2" />
                  Couleur
                </button>
                {showColorPicker && (
                  <div className="absolute left-full top-0 bg-white rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1 w-32">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className="w-5 h-5 rounded-full hover:ring-2 hover:ring-offset-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleDeleteColumn}
                className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
              >
                <Trash2 size={14} className="mr-2" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <Droppable droppableId={String(column.id)} type="card" isDropDisabled={false}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const data = e.dataTransfer.getData('application/json');
              if (data) {
                const event = new CustomEvent('library-drop', {
                  detail: { 
                    columnId: column.id,
                    boardId: column.board_id,
                    data: JSON.parse(data)
                  }
                });
                window.dispatchEvent(event);
              }
            }}
            className={`flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin ${
              snapshot.isDraggingOver ? 'bg-gray-200 dark:bg-gray-700' : 'dark:bg-gray-800'
            }`}
          >
            {columnCards.map((card, index) => (
              <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={(e) => {
                      if (snapshot.isDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <Card card={card} isDragging={snapshot.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="p-2">
        {showNewCard ? (
          <form onSubmit={handleCreateCard}>
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Titre de la carte..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onBlur={() => {
                if (!newCardTitle.trim()) setShowNewCard(false);
              }}
            />
            <div className="flex items-center mt-2 space-x-2">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewCardTitle('');
                  setShowNewCard(false);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewCard(true)}
            className="w-full flex items-center justify-center py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
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
