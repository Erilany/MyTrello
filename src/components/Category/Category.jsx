import React, { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { useApp } from '../../context/AppContext';
import SubCategory from '../SubCategory/SubCategory';
import CategoryModal from './CategoryModal';
import { MoreHorizontal, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

const priorityColors = {
  urgent: '#EF4444',
  high: '#F97316',
  normal: '#22C55E',
  low: '#6B7280'
};

function Category({ category }) {
  const { 
    subcategories, 
    updateCategory, 
    deleteCategory 
  } = useApp();
  
  const [showMenu, setShowMenu] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const categorySubcategories = subcategories
    .filter(sc => sc.category_id === category.id)
    .sort((a, b) => a.position - b.position);

  const handleToggleCollapse = async () => {
    await updateCategory(category.id, { collapsed: category.collapsed ? 0 : 1 });
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      await deleteCategory(category.id);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    let colorClass = 'text-gray-500';
    if (diffDays < 0) colorClass = 'text-red-500';
    else if (diffDays <= 3) colorClass = 'text-orange-500';
    
    return {
      text: date.toLocaleDateString('fr-FR'),
      colorClass
    };
  };

  const dateInfo = formatDate(category.due_date);

  return (
    <>
      <div 
        className="bg-gray-50 rounded border border-gray-200 mb-2"
        style={{ borderLeftColor: category.color || '#E5E7EB', borderLeftWidth: '3px' }}
      >
        <div className="p-2 flex items-start">
          <button
            onClick={handleToggleCollapse}
            className="text-gray-400 hover:text-gray-600 mr-1 mt-0.5"
          >
            {category.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              {categorySubcategories.length > 0 && (
                <span className="text-xs text-gray-400 mr-1">
                  {category.collapsed ? `(${categorySubcategories.length})` : ''}
                </span>
              )}
              <span className="text-sm font-medium text-gray-700">{category.title}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {category.priority !== 'normal' && (
                <span 
                  className="px-1.5 py-0.5 text-xs rounded text-white"
                  style={{ backgroundColor: priorityColors[category.priority] }}
                >
                  {category.priority === 'urgent' ? 'U' : category.priority === 'high' ? 'H' : 'L'}
                </span>
              )}
              
              {dateInfo && (
                <span className={`text-xs ${dateInfo.colorClass}`}>
                  {dateInfo.text}
                </span>
              )}
              
              {category.assignee && (
                <span className="text-xs text-gray-500">
                  {category.assignee}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg py-1 z-20 w-36">
                <button
                  onClick={() => {
                    setModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Modifier
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 size={14} className="mr-2" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {!category.collapsed && categorySubcategories.length > 0 && (
          <Droppable droppableId={`category-${category.id}`} type="subcategory">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="px-2 pb-2 pl-7"
              >
                {categorySubcategories.map((subcategory, index) => (
                  <Draggable key={subcategory.id} draggableId={`subcategory-${subcategory.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <SubCategory subcategory={subcategory} />
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

      {modalOpen && (
        <CategoryModal category={category} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

export default Category;
