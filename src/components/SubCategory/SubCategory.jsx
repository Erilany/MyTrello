import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SubCategoryModal from './SubCategoryModal';
import { MoreHorizontal, Trash2 } from 'lucide-react';

const priorityColors = {
  urgent: '#EF4444',
  high: '#F97316',
  normal: '#22C55E',
  low: '#6B7280'
};

function SubCategory({ subcategory, isDragging = false }) {
  const { 
    updateSubcategory, 
    deleteSubcategory 
  } = useApp();
  
  const [showMenu, setShowMenu] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette sous-catégorie ?')) {
      await deleteSubcategory(subcategory.id);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    let colorClass = 'text-gray-500 dark:text-gray-400';
    if (diffDays < 0) colorClass = 'text-red-500 dark:text-red-400';
    else if (diffDays <= 3) colorClass = 'text-orange-500 dark:text-orange-400';
    
    return {
      text: date.toLocaleDateString('fr-FR'),
      colorClass
    };
  };

  const dateInfo = formatDate(subcategory.due_date);

  useEffect(() => {
    const handleClickOutside = (e) => {
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
        className="bg-white dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600 mb-1 py-1.5 px-2 flex items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (e.target.closest('button')) return;
          setModalOpen(true);
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{subcategory.title}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            {subcategory.priority !== 'normal' && (
              <span 
                className="px-1.5 py-0.5 text-xs rounded text-white"
                style={{ backgroundColor: priorityColors[subcategory.priority] }}
              >
                {subcategory.priority === 'urgent' ? 'U' : subcategory.priority === 'high' ? 'H' : 'L'}
              </span>
            )}
            
            {dateInfo && (
              <span className={`text-xs ${dateInfo.colorClass}`}>
                {dateInfo.text}
              </span>
            )}
            
            {subcategory.assignee && (
              <span className="text-xs text-gray-400">
                {subcategory.assignee}
              </span>
            )}
          </div>
        </div>

        <div className="relative subcategory-menu">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg py-1 z-30 w-36">
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

      {modalOpen && (
        <SubCategoryModal subcategory={subcategory} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

export default SubCategory;
