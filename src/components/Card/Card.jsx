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
  const {
    categories,
    updateCard,
    deleteCard,
    archiveCard,
    saveToLibrary,
    subcategories,
    setSelectedCard,
    selectedCard,
    cardColors,
  } = useApp();

  const [showMenu, setShowMenu] = useState(false);

  const handleDoubleClick = () => {
    setSelectedCard(card);
  };

  const handleDelete = () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette carte ?')) {
      deleteCard(card.id);
    }
  };

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
    .filter(cat => Number(cat.card_id) === Number(card.id))
    .sort((a, b) => a.position - b.position);

  const getAccentBarStyle = () => {
    const t = (columnTitle || '').toLowerCase();

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

  const getAccentBarClass = () => {
    const t = (columnTitle || '').toLowerCase();
    if (cardColors.etudes.keywords.some(k => t.includes(k))) return 'accent-bar-etudes';
    if (cardColors.enCours.keywords.some(k => t.includes(k))) return 'accent-bar-en-cours';
    if (cardColors.realise.keywords.some(k => t.includes(k))) return 'accent-bar-realise';
    if (cardColors.archive.keywords.some(k => t.includes(k))) return 'accent-bar-archive';
    return 'accent-bar-en-cours';
  };

  const isDone = cardColors.realise.keywords.some(k =>
    (columnTitle || '').toLowerCase().includes(k)
  );
  const isArchived = cardColors.archive.keywords.some(k =>
    (columnTitle || '').toLowerCase().includes(k)
  );

  const getPriorityBadge = () => {
    const p = card.priority;
    if (p === 'urgent') return { class: 'badge-urgent', label: '● URGENT' };
    if (p === 'high') return { class: 'badge-waiting', label: '● HAUTE' };
    if (p === 'low') return { class: 'badge-normal', label: '● BASSE' };
    if (p === 'done') return { class: 'badge-done', label: '✓ TERMINÉ' };
    return null;
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

  const priorityBadge = getPriorityBadge();
  const dateInfo = formatDate(card.due_date);

  return (
    <>
      <div
        className={`bg-card rounded-md mb-2 border border-std hover:border-strong card-hover transition-card ${isDragging ? 'opacity-50' : ''} ${isDone ? 'card-realise' : ''} ${isArchived ? 'card-archive' : ''}`}
        onDoubleClick={e => {
          if (
            e.target.closest('[data-rbd-drag-handle]') ||
            e.target.closest('.categories-container')
          ) {
            return;
          }
          handleDoubleClick();
        }}
      >
        <div className="h-[3px] rounded-t-md" style={getAccentBarStyle()} />

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
                    <span className="text-muted select-none">⠿</span>
                  </button>
                ) : (
                  <span className="text-muted select-none">⠿</span>
                )}
                {cardCategories.length > 0 && (
                  <span className="text-xs text-muted">
                    {card.collapsed ? `(${cardCategories.length})` : ''}
                  </span>
                )}
                <h4
                  className={`font-display text-sm font-semibold text-primary truncate ${card.parent_id ? 'ml-4' : ''}`}
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

                {card.start_date && (
                  <span className="badge badge-date">
                    ▶ {new Date(card.start_date).toLocaleDateString('fr-FR')}
                  </span>
                )}

                {card.duration_days > 0 && (
                  <span className="badge bg-blue-500/20 text-blue-400">
                    ⏱ {card.duration_days}j
                  </span>
                )}

                {card.parent_id && (
                  <span className="badge bg-purple-500/20 text-purple-400">↳ Sous-tâche</span>
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
                <div className="fixed" style={{ zIndex: 99999 }}>
                  <div
                    className="fixed right-0 top-0 bg-card rounded-lg shadow-card py-1 w-48 border border-std"
                    style={{ minWidth: '180px' }}
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
            <Droppable droppableId={`card-${card.id}`} type="category" isDropDisabled={false}>
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
    </>
  );
}

export default Card;
