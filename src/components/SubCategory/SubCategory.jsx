import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SubCategoryModal from './SubCategoryModal';
import { MoreHorizontal, Trash2, BookMarked } from 'lucide-react';

function SubCategory({ subcategory, isDragging = false }) {
  const { updateSubcategory, deleteSubcategory, saveToLibrary, setSelectedSubcategory } = useApp();

  const [showMenu, setShowMenu] = useState(false);

  const handleDoubleClick = () => {
    setSelectedSubcategory(subcategory);
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette sous-catégorie ?')) {
      await deleteSubcategory(subcategory.id);
    }
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
    const p = subcategory.priority;
    if (p === 'urgent') return { class: 'badge-urgent', label: 'U' };
    if (p === 'high') return { class: 'badge-waiting', label: 'H' };
    if (p === 'low') return { class: 'badge-normal', label: 'B' };
    if (p === 'done') return { class: 'badge-done', label: '✓' };
    return null;
  };

  const dateInfo = formatDate(subcategory.due_date);
  const priorityBadge = getPriorityBadge();

  const handleSaveToLibrary = async () => {
    const content = {
      subcategory: {
        title: subcategory.title,
        description: subcategory.description,
        priority: subcategory.priority,
        due_date: subcategory.due_date,
        assignee: subcategory.assignee,
      },
    };

    await saveToLibrary('subcategory', subcategory.title, JSON.stringify(content));
    alert('Sous-catégorie sauvegardée dans la bibliothèque !');
  };

  const handleDragStart = e => {
    const content = {
      subcategory: {
        title: subcategory.title,
        description: subcategory.description,
        priority: subcategory.priority,
        due_date: subcategory.due_date,
        assignee: subcategory.assignee,
      },
    };

    const event = new CustomEvent('library-save', {
      detail: {
        itemType: 'subcategory',
        content: JSON.stringify(content),
        title: subcategory.title,
      },
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const handleClickOutside = e => {
      if (showMenu && !e.target.closest('.subcategory-menu')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  return (
    <>
      <div
        className="bg-card-hover rounded border border-std mb-1 py-1.5 px-2 flex items-center group cursor-pointer hover:border-strong transition-std"
        onDoubleClick={e => {
          e.stopPropagation();
          if (e.target.closest('button')) return;
          handleDoubleClick();
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-primary">{subcategory.title}</span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {priorityBadge && (
              <span className={`badge ${priorityBadge.class}`}>{priorityBadge.label}</span>
            )}

            {dateInfo && <span className={`badge ${dateInfo.badgeClass}`}>📅 {dateInfo.text}</span>}

            {subcategory.start_date && (
              <span className="badge badge-date">
                ▶ {new Date(subcategory.start_date).toLocaleDateString('fr-FR')}
              </span>
            )}

            {subcategory.duration_days > 0 && (
              <span className="badge bg-blue-500/20 text-blue-400">
                ⏱ {subcategory.duration_days}j
              </span>
            )}

            {subcategory.assignee && (
              <span className="badge badge-category">{subcategory.assignee}</span>
            )}
          </div>
        </div>

        <div className="relative subcategory-menu">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="icon-btn !w-6 !h-6 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div className="fixed right-0 top-8 bg-card rounded-lg shadow-card py-1 z-[99999] w-40 border border-std">
              <button
                onClick={() => {
                  setModalOpen(true);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-card-hover"
              >
                Modifier
              </button>

              <button
                onClick={() => {
                  handleSaveToLibrary();
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-card-hover"
              >
                <BookMarked size={14} className="mr-2 text-secondary" />
                Sauvegarder
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center w-full px-3 py-2 text-sm text-urgent hover:bg-card-hover"
              >
                <Trash2 size={14} className="mr-2" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SubCategory;
