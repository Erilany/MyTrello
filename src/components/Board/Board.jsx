import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useApp } from '../../context/AppContext';
import Column from '../Column/Column';
import { Plus } from 'lucide-react';

function Board() {
  const { currentBoard, columns, createColumn, moveColumn, moveCard, moveCategory, moveSubcategory, loadBoard, loading, dbRun, dbGet, categories, subcategories } = useApp();
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumn, setShowNewColumn] = useState(false);

  useEffect(() => {
    const handleLibraryDrop = async (e) => {
      const { columnId, boardId, data } = e.detail;
      const { itemType, content, title } = data;
      
      if (!columnId) return;
      
      try {
        const parsedContent = JSON.parse(content);

        if (itemType === 'card' && parsedContent.card) {
          const maxPosResult = await dbGet('SELECT MAX(position) as maxPos FROM cards WHERE column_id = ?', [columnId]);
          const newPosition = (maxPosResult?.data?.maxPos ?? -1) + 1;

          const cardResult = await dbRun(
            'INSERT INTO cards (column_id, title, description, priority, due_date, assignee, position, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              columnId,
              parsedContent.card.title,
              parsedContent.card.description || '',
              parsedContent.card.priority || 'normal',
              parsedContent.card.due_date || null,
              parsedContent.card.assignee || '',
              newPosition,
              parsedContent.card.color || '#FFFFFF'
            ]
          );

          if (cardResult.success && parsedContent.categories) {
            for (const cat of parsedContent.categories) {
              const catResult = await dbRun(
                'INSERT INTO categories (card_id, title, description, priority, due_date, assignee, position, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [cardResult.data.lastInsertRowid, cat.title, cat.description || '', cat.priority || 'normal', cat.due_date || null, cat.assignee || '', cat.position, cat.color || '#F5F5F5']
              );
              
              if (catResult.success && cat.subcategories) {
                for (const subcat of cat.subcategories) {
                  await dbRun(
                    'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [catResult.data.lastInsertRowid, subcat.title, subcat.description || '', subcat.priority || 'normal', subcat.due_date || null, subcat.assignee || '', subcat.position]
                  );
                }
              }
            }
          }
          
          await loadBoard(boardId);
        }
      } catch (error) {
        console.error('Error handling library drop:', error);
      }
    };

    window.addEventListener('library-drop', handleLibraryDrop);
    return () => window.removeEventListener('library-drop', handleLibraryDrop);
  }, [dbRun, dbGet, loadBoard]);

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (newColumnTitle.trim() && currentBoard) {
      await createColumn(currentBoard.id, newColumnTitle.trim());
      setNewColumnTitle('');
      setShowNewColumn(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;

    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      return;
    }

    if (type === 'column') {
      await moveColumn(parseInt(draggableId), destination.index);
      return;
    }

    if (type === 'card') {
      const cardId = parseInt(draggableId);
      const newColumnId = parseInt(destination.droppableId);
      const newPosition = destination.index;
      await moveCard(cardId, newColumnId, newPosition);
      return;
    }

    if (type === 'category') {
      const categoryId = parseInt(draggableId);
      const newCardId = parseInt(destination.droppableId.replace('card-', ''));
      const newPosition = destination.index;
      await moveCategory(categoryId, newCardId, newPosition);
      return;
    }

    if (type === 'subcategory') {
      const subcategoryId = parseInt(draggableId);
      const newCategoryId = parseInt(destination.droppableId.replace('category-', ''));
      const newPosition = destination.index;
      await moveSubcategory(subcategoryId, newCategoryId, newPosition);
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun projet sélectionné</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Créez un nouveau projet depuis la barre latérale</p>
        </div>
      </div>
    );
  }

  const orderedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {currentBoard.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{currentBoard.description}</p>
      )}
      
      <div 
        className="flex-1 overflow-x-auto overflow-y-auto"
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="column" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex h-auto min-h-full space-x-4 pb-4"
              >
                {orderedColumns.map((column, index) => (
                  <Draggable key={column.id} draggableId={String(column.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex-shrink-0"
                      >
                        <div {...provided.dragHandleProps}>
                          <Column column={column} />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                <div className="flex-shrink-0 w-72">
                  {showNewColumn ? (
                    <form onSubmit={handleCreateColumn} className="bg-white rounded-lg shadow p-3">
                      <input
                        type="text"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="Nom de la colonne..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onBlur={() => {
                          if (!newColumnTitle.trim()) setShowNewColumn(false);
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
                            setNewColumnTitle('');
                            setShowNewColumn(false);
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewColumn(true)}
                      className="w-full h-12 flex items-center justify-center bg-white/50 hover:bg-white rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Plus size={20} className="mr-2" />
                      Ajouter une colonne
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

export default Board;
