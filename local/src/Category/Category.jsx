import React, { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useApp } from '../context/AppContext';
import SubCategory from '../SubCategory/SubCategory';
import CategoryModal from './CategoryModal';
import { MoreHorizontal, ChevronDown, ChevronRight, Trash2, BookMarked, Plus } from 'lucide-react';

function Category({ category, isDragging = false, dragHandleProps, depth = 0 }) {
  const {
    subcategories,
    categories,
    updateCategory,
    deleteCategory,
    saveToLibrary,
    setSelectedCategory,
    createCategory,
    moveCategory,
    moveSubcategory,
  } = useApp();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(category.title);
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategoryTitle, setNewSubCategoryTitle] = useState('');

  const handleDoubleClick = () => {
    setSelectedCategory(category);
  };

  const categorySubcategories = subcategories
    .filter(sc => Number(sc.category_id) === Number(category.id))
    .sort((a, b) => a.position - b.position);

  const childCategories = categories
    .filter(cat => Number(cat.parent_id) === Number(category.id))
    .sort((a, b) => a.position - b.position);

  const hasChildren = categorySubcategories.length > 0 || childCategories.length > 0;

  const handleToggleCollapse = async () => {
    await updateCategory(category.id, { collapsed: category.collapsed ? 0 : 1 });
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      await deleteCategory(category.id);
    }
  };

  const handleAddSubCategory = async e => {
    e.preventDefault();
    if (newSubCategoryTitle.trim()) {
      await createCategory(null, newSubCategoryTitle.trim(), '', 'normal', null, '', category.id);
      setNewSubCategoryTitle('');
      setShowAddSubCategory(false);
    }
  };

  const handleSaveTitle = async () => {
    if (editTitle.trim()) {
      await updateCategory(category.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  useEffect(() => {
    const handleClickOutside = e => {
      if (showMenu && !e.target.closest('.category-menu')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

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
    const p = category.priority;
    if (p === 'urgent') return { class: 'badge-urgent', label: 'U' };
    if (p === 'high') return { class: 'badge-waiting', label: 'H' };
    if (p === 'low') return { class: 'badge-normal', label: 'B' };
    if (p === 'done') return { class: 'badge-done', label: '✓' };
    return null;
  };

  const dateInfo = formatDate(category.due_date);
  const priorityBadge = getPriorityBadge();

  const handleSaveToLibrary = async () => {
    const catSubcategoriesData = subcategories
      .filter(sc => Number(sc.category_id) === Number(category.id))
      .sort((a, b) => a.position - b.position);

    const content = {
      category: {
        title: category.title,
        description: category.description,
        priority: category.priority,
        due_date: category.due_date,
        assignee: category.assignee,
        color: category.color,
      },
      subcategories: catSubcategoriesData,
    };

    await saveToLibrary('category', category.title, JSON.stringify(content));
    alert('Catégorie sauvegardée dans la bibliothèque !');
    setShowMenu(false);
  };

  const handleDragStart = e => {
    const catSubcategoriesData = subcategories
      .filter(sc => Number(sc.category_id) === Number(category.id))
      .sort((a, b) => a.position - b.position);

    const content = {
      category: {
        title: category.title,
        description: category.description,
        priority: category.priority,
        due_date: category.due_date,
        assignee: category.assignee,
        color: category.color,
      },
      subcategories: catSubcategoriesData,
    };

    const event = new CustomEvent('library-save', {
      detail: {
        itemType: 'category',
        content: JSON.stringify(content),
        title: category.title,
      },
    });
    window.dispatchEvent(event);
  };

  return (
    <>
      <div
        {...dragHandleProps}
        className="bg-card-hover rounded border border-std mb-2 cursor-grab hover:border-strong select-none transition-std"
        style={{
          borderLeftColor: category.color || '#6366f1',
          borderLeftWidth: '3px',
          marginLeft: depth > 0 ? `${depth * 16}px` : '0',
        }}
        onDoubleClick={e => {
          if (e.target.closest('button')) return;
          handleDoubleClick();
        }}
      >
        <div className="p-2 flex items-start">
          <button
            onClick={handleToggleCollapse}
            className="text-muted hover:text-secondary mr-1 mt-0.5 flex items-center justify-center w-4 h-4 transition-std"
            title={category.collapsed ? 'Développer' : 'Réduire'}
          >
            {hasChildren ? (
              category.collapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )
            ) : (
              <span className="text-xs text-muted">•</span>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              {hasChildren && (
                <span className="text-xs text-muted mr-1">
                  {category.collapsed
                    ? `(${categorySubcategories.length + childCategories.length})`
                    : ''}
                </span>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setEditTitle(category.title);
                      setIsEditing(false);
                    }
                  }}
                  className="px-1 py-0.5 text-sm font-medium bg-input border border-accent rounded focus:outline-none"
                  autoFocus
                />
              ) : (
                <span
                  className="text-sm font-medium text-primary cursor-pointer hover:text-accent transition-std"
                  title="Cliquez pour modifier"
                  onClick={() => {
                    if (isDragging) return;
                    setEditTitle(category.title);
                    setIsEditing(true);
                  }}
                >
                  {category.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {priorityBadge && (
                <span className={`badge ${priorityBadge.class}`}>{priorityBadge.label}</span>
              )}

              {dateInfo && (
                <span className={`badge ${dateInfo.badgeClass}`}>📅 {dateInfo.text}</span>
              )}

              {category.start_date && (
                <span className="badge badge-date">
                  ▶ {new Date(category.start_date).toLocaleDateString('fr-FR')}
                </span>
              )}

              {category.duration_days > 0 && (
                <span className="badge bg-blue-500/20 text-blue-400">
                  ⏱ {category.duration_days}j
                </span>
              )}

              {category.parent_id && (
                <span className="badge bg-purple-500/20 text-purple-400">↳ Sous-catégorie</span>
              )}

              {category.assignee && (
                <span className="badge badge-category">{category.assignee}</span>
              )}
            </div>
          </div>

          <div className="relative category-menu">
            <button onClick={() => setShowMenu(!showMenu)} className="icon-btn !w-6 !h-6">
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <div className="fixed right-0 top-8 bg-card rounded-lg shadow-card py-1 z-[99999] w-44 border border-std">
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

        {!category.collapsed && hasChildren && (
          <div
            className="px-2 pb-2 overflow-visible subcategories-container"
            style={{ marginLeft: `${depth * 16}px` }}
            onDragOver={e => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={e => {
              e.preventDefault();
              try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                console.log('[Category] Drop received:', data);
                if (data.type === 'subcategory') {
                  const maxPos = Math.max(...categorySubcategories.map(s => s.position), -1);
                  moveSubcategory(data.subcategoryId, category.id, maxPos + 1);
                }
              } catch (err) {
                console.error('[Category] Drop error:', err);
              }
            }}
          >
            {childCategories.map((childCat, index) => (
              <Draggable
                key={childCat.id}
                draggableId={`category-${childCat.id}`}
                index={index}
                type="category"
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <Category
                      category={childCat}
                      isDragging={snapshot.isDragging}
                      depth={depth + 1}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {categorySubcategories.map((subcategory, index) => (
              <div
                key={subcategory.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      type: 'subcategory',
                      subcategoryId: subcategory.id,
                      sourceCategoryId: category.id,
                    })
                  );
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className="cursor-grab active:cursor-grabbing"
                style={{ marginLeft: `${(depth + 1) * 16}px` }}
              >
                <SubCategory subcategory={subcategory} />
              </div>
            ))}
          </div>
        )}

        {!category.collapsed && (
          <div className="px-2 pb-2" style={{ marginLeft: `${depth * 16}px` }}>
            {showAddSubCategory ? (
              <form onSubmit={handleAddSubCategory} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubCategoryTitle}
                  onChange={e => setNewSubCategoryTitle(e.target.value)}
                  placeholder="Titre..."
                  className="flex-1 px-2 py-1 text-xs bg-input border border-std rounded focus:outline-none focus:border-accent"
                  autoFocus
                />
                <button type="submit" className="text-accent hover:text-accent/80">
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSubCategory(false)}
                  className="text-muted hover:text-primary"
                >
                  <ChevronRight size={14} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowAddSubCategory(true)}
                className="flex items-center text-xs text-muted hover:text-primary transition-std"
              >
                <Plus size={12} className="mr-1" />
                Ajouter sous-catégorie
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Category;
