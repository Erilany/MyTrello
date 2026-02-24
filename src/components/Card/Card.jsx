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

function Card({ card, isDragging, columnColor, columnTitle }) {
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

  const getAccentBarClass = () => {
    const t = (columnTitle || '').toLowerCase();
    if (t.includes('études') || t.includes('etudes')) return 'accent-bar-etudes';
    if (t.includes('cours') || t.includes('en cours')) return 'accent-bar-en-cours';
    if (t.includes('réalisé') || t.includes('realis') || t.includes('terminé'))
      return 'accent-bar-realise';
    if (t.includes('archiv')) return 'accent-bar-archive';
    return 'accent-bar-en-cours';
  };

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

    let badgeClass = 'badge-date';
    if (diffDays < 0) badgeClass = 'badge-date-overdue';
    else if (diffDays <= 3) badgeClass = 'badge-date-soon';

    return {
      text: date.toLocaleDateString('fr-FR'),
      badgeClass,
    };
  };

  const getPriorityBadge = () => {
    const p = card.priority;
    if (p === 'urgent') return { class: 'badge-urgent', label: '● URGENT' };
    if (p === 'high') return { class: 'badge-waiting', label: '● HAUTE' };
    if (p === 'low') return { class: 'badge-normal', label: '● BASSE' };
    if (p === 'done') return { class: 'badge-done', label: '✓ TERMINÉ' };
    return null;
  };

  const priorityBadge = getPriorityBadge();
  const dateInfo = formatDate(card.due_date);

  const isDone =
    columnTitle?.toLowerCase().includes('réalisé') ||
    columnTitle?.toLowerCase().includes('realis') ||
    columnTitle?.toLowerCase().includes('terminé');
  const isArchived = columnTitle?.toLowerCase().includes('archiv');

  return (
    <>
      <div
        className={`bg-card rounded-md mb-2 border border-std hover:border-strong card-hover transition-card ${isDragging ? 'opacity-50' : ''} ${isDone ? 'card-realise' : ''} ${isArchived ? 'card-archive' : ''}`}
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
        <div className={`h-[3px] rounded-t-md ${getAccentBarClass()}`} />

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
                    className="text-muted hover:text-secondary transition-std"
                    title={card.collapsed ? 'Développer' : 'Réduire'}
                  >
                    <span className="drag-handle text-muted select-none" style={{ opacity: 1 }}>
                      ⠿
                    </span>
                  </button>
                ) : (
                  <span className="w-4 text-xs text-muted">•</span>
                )}
                {cardCategories.length > 0 && (
                  <span className="text-xs text-muted">
                    {card.collapsed ? `(${cardCategories.length})` : ''}
                  </span>
                )}
                <h4
                  className="font-display text-sm font-semibold text-primary truncate"
                  style={{ letterSpacing: '-0.1px' }}
                >
                  {card.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {priorityBadge && (
                  <span className={`badge ${priorityBadge.class}`}>{priorityBadge.label}</span>
                )}

                {dateInfo && (
                  <span className={`badge ${dateInfo.badgeClass}`}>📅 {dateInfo.text}</span>
                )}

                {cardCategories.length > 0 && (
                  <span className="badge badge-category">📁 {cardCategories.length}</span>
                )}

                {card.assignee && <span className="badge badge-category">{card.assignee}</span>}
              </div>
            </div>

            <div className="relative card-menu">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="icon-btn"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="fixed" style={{ zIndex: 9999 }}>
                  <div
                    className="absolute right-0 top-0 bg-card rounded-lg shadow-card py-1 w-44 border border-std"
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setModalOpen(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-card-hover"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleSaveToLibrary();
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-card-hover"
                    >
                      <BookMarked size={14} className="mr-2 text-secondary" />
                      Sauvegarder en bibliothèque
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleArchive();
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-card-hover"
                    >
                      <Archive size={14} className="mr-2 text-secondary" />
                      Archiver
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-urgent hover:bg-card-hover"
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
                  className={`flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin mt-2 pt-2 border-t border-std ${
                    snapshot.isDraggingOver ? 'bg-card-hover' : ''
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
