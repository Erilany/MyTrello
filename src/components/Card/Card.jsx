import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Category from '../Category/Category';
import CardModal from './CardModal';
import { 
  MoreHorizontal, 
  ChevronDown, 
  ChevronRight, 
  Archive, 
  Trash2,
  ArrowLeft,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

const priorityColors = {
  urgent: '#EF4444',
  high: '#F97316',
  normal: '#22C55E',
  low: '#6B7280'
};

function Card({ card }) {
  const { 
    categories, 
    columns, 
    updateCard, 
    deleteCard, 
    archiveCard, 
    moveCard,
    columns: allColumns 
  } = useApp();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  const cardCategories = categories.filter(cat => cat.card_id === card.id);
  const currentColumnIndex = allColumns.findIndex(c => c.id === card.column_id);

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

  const handleMove = async (direction) => {
    const newIndex = currentColumnIndex + direction;
    if (newIndex >= 0 && newIndex < allColumns.length) {
      const newColumnId = allColumns[newIndex].id;
      const cardsInNewColumn = allColumns.find(c => c.id === newColumnId).id;
      const maxPos = Math.max(...allColumns
        .filter(c => c.id === newColumnId)
        .map(c => c.id), 0);
      await moveCard(card.id, newColumnId, maxPos + 1);
    }
    setShowMoveMenu(false);
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

  const dateInfo = formatDate(card.due_date);

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setModalOpen(true)}
      >
        {card.color && card.color !== '#FFFFFF' && (
          <div 
            className="h-2 rounded-t-lg"
            style={{ backgroundColor: card.color }}
          />
        )}
        
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {cardCategories.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCollapse();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {card.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
                <h4 className="text-sm font-medium text-gray-800">{card.title}</h4>
              </div>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {card.priority !== 'normal' && (
                  <span 
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: priorityColors[card.priority] || priorityColors.normal }}
                  >
                    {card.priority === 'urgent' ? 'Urgent' : 
                     card.priority === 'high' ? 'Haute' : 
                     card.priority === 'low' ? 'Basse' : 'Normale'}
                  </span>
                )}
                
                {dateInfo && (
                  <span className={`text-xs ${dateInfo.colorClass}`}>
                    {dateInfo.text}
                  </span>
                )}
                
                {card.assignee && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 rounded text-gray-600">
                    {card.assignee}
                  </span>
                )}

                {cardCategories.length > 0 && (
                  <span className="flex items-center text-xs text-gray-400">
                    <ChevronDown size={12} className="mr-0.5" />
                    {cardCategories.length}
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg py-1 z-20 w-40">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalOpen(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Modifier
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoveMenu(!showMoveMenu);
                      }}
                      className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRight size={14} className="mr-2" />
                      Déplacer
                    </button>
                    
                    {showMoveMenu && (
                      <div className="absolute left-full top-0 bg-white rounded-lg shadow-lg py-1 z-30 w-32">
                        {currentColumnIndex > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(-1);
                            }}
                            className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <ArrowLeft size={14} className="mr-2" />
                            Vers gauche
                          </button>
                        )}
                        {currentColumnIndex < allColumns.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(1);
                            }}
                            className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <ArrowRight size={14} className="mr-2" />
                            Vers droite
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
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
                    onClick={(e) => {
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
              )}
            </div>
          </div>

          {!card.collapsed && cardCategories.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              {cardCategories.map(category => (
                <Category key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <CardModal card={card} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

export default Card;
