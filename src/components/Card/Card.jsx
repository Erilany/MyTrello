import React, { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useApp } from '../../context/AppContext';
import Category from '../Category/Category';
import CardModal from './CardModal';
import {
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Archive,
  Trash2,
  BookMarked,
} from 'lucide-react';

const priorityColors = {
  urgent: '#EF4444',
  high: '#F97316',
  normal: '#22C55E',
  low: '#6B7280',
};

function Card({ card, isDragging }) {
  const { categories, updateCard, deleteCard, archiveCard, saveToLibrary, subcategories } =
    useApp();

  const [showMenu, setShowMenu] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = e => {
      if (showMenu && !e.target.closest('.card-menu')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const cardCategories = categories
    .filter(cat => cat.card_id === card.id)
    .sort((a, b) => a.position - b.position);

  const handleToggleCollapse = async () => {
    await updateCard(card.id, { collapsed: card.collapsed ? 0 : 1 });
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette carte ?')) {
      await deleteCard(card.id);
    }
  };

  const handleArchive = async () => {
    await archiveCard(card.id);
  };

  const handleSaveToLibrary = async () => {
    const cardCategoriesData = categories
      .filter(cat => cat.card_id === card.id)
      .sort((a, b) => a.position - b.position)
      .map(cat => {
        const catSubcategories = subcategories
          .filter(sub => sub.category_id === cat.id)
          .sort((a, b) => a.position - b.position);
        return {
          ...cat,
          subcategories: catSubcategories,
        };
      });

    const content = {
      card: {
        title: card.title,
        description: card.description,
        priority: card.priority,
        due_date: card.due_date,
        assignee: card.assignee,
        color: card.color,
      },
      categories: cardCategoriesData,
    };

    await saveToLibrary('card', card.title, JSON.stringify(content));
    alert('Carte sauvegardée dans la bibliothèque !');
    setShowMenu(false);
  };

  const handleDragStart = e => {
    const cardCategoriesData = categories
      .filter(cat => cat.card_id === card.id)
      .sort((a, b) => a.position - b.position)
      .map(cat => {
        const catSubcategories = subcategories
          .filter(sub => sub.category_id === cat.id)
          .sort((a, b) => a.position - b.position);
        return {
          ...cat,
          subcategories: catSubcategories,
        };
      });

    const content = {
      card: {
        title: card.title,
        description: card.description,
        priority: card.priority,
        due_date: card.due_date,
        assignee: card.assignee,
        color: card.color,
      },
      categories: cardCategoriesData,
    };

    const event = new CustomEvent('library-save', {
      detail: {
        itemType: 'card',
        content: JSON.stringify(content),
        title: card.title,
      },
    });
    window.dispatchEvent(event);
  };

  const formatDate = dateStr => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    let colorClass = 'text-gray-500 dark:text-gray-400';
    if (diffDays < 0) colorClass = 'text-red-500 dark:text-red-400';
    else if (diffDays <= 3) colorClass = 'text-orange-500 dark:text-orange-400';

    return {
      text: date.toLocaleDateString('fr-FR'),
      colorClass,
    };
  };

  const dateInfo = formatDate(card.due_date);

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-2 hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDoubleClick={e => {
          if (
            e.target.closest('[data-rbd-drag-handle]') ||
            e.target.closest('.categories-container')
          ) {
            return;
          }
          setModalOpen(true);
        }}
      >
        {card.color && card.color !== '#FFFFFF' && (
          <div className="h-2 rounded-t-lg" style={{ backgroundColor: card.color }} />
        )}

        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                {cardCategories.length > 0 ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleToggleCollapse();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title={card.collapsed ? 'Développer' : 'Réduire'}
                  >
                    {card.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                ) : (
                  <span className="w-4 text-xs text-gray-300">•</span>
                )}
                {cardCategories.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-400">
                    {card.collapsed ? `(${cardCategories.length})` : ''}
                  </span>
                )}
                <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {card.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {card.priority !== 'normal' && (
                  <span
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{
                      backgroundColor: priorityColors[card.priority] || priorityColors.normal,
                    }}
                  >
                    {card.priority === 'urgent'
                      ? 'Urgent'
                      : card.priority === 'high'
                        ? 'Haute'
                        : card.priority === 'low'
                          ? 'Basse'
                          : 'Normale'}
                  </span>
                )}

                {dateInfo && (
                  <span className={`text-xs ${dateInfo.colorClass}`}>{dateInfo.text}</span>
                )}

                {card.assignee && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                    {card.assignee}
                  </span>
                )}
              </div>
            </div>

            <div className="relative card-menu">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="fixed" style={{ zIndex: 9999 }}>
                  <div
                    className="absolute right-0 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 w-40 border dark:border-gray-700"
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setModalOpen(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleSaveToLibrary();
                      }}
                      className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <BookMarked size={14} className="mr-2" />
                      Sauvegarder en bibliothèque
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleArchive();
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Archive size={14} className="mr-2" />
                      Archiver
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!card.collapsed && cardCategories.length > 0 && (
            <Droppable droppableId={`card-${card.id}`} type="category">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin ${
                    snapshot.isDraggingOver ? 'bg-gray-200 dark:bg-gray-700' : 'dark:bg-gray-800'
                  }`}
                >
                  {cardCategories.map((category, index) => (
                    <Draggable
                      key={category.id}
                      draggableId={`category-${category.id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Category category={category} isDragging={snapshot.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      </div>

      {modalOpen && <CardModal card={card} onClose={() => setModalOpen(false)} />}
    </>
  );
}

export default Card;
