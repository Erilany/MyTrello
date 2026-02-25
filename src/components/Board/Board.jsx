import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useApp } from '../../context/AppContext';
import Column from '../Column/Column';
import { Plus, GripVertical } from 'lucide-react';

function Board() {
  const {
    currentBoard,
    columns,
    createColumn,
    moveColumn,
    moveCard,
    moveCategory,
    moveSubcategory,
    loadBoard,
    loading,
    dbRun,
    dbGet,
    categories,
    subcategories,
  } = useApp();
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumn, setShowNewColumn] = useState(false);

  useEffect(() => {
    const handleLibraryDrop = async e => {
      const { columnId, boardId, data } = e.detail;
      const { itemType, content, title } = data;

      if (!columnId) return;

      try {
        const parsedContent = JSON.parse(content);

        if (itemType === 'card' && parsedContent.card) {
          const maxPosResult = await dbGet(
            'SELECT MAX(position) as maxPos FROM cards WHERE column_id = ?',
            [columnId]
          );
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
              parsedContent.card.color || '#FFFFFF',
            ]
          );

          if (cardResult.success && parsedContent.categories) {
            for (const cat of parsedContent.categories) {
              const catResult = await dbRun(
                'INSERT INTO categories (card_id, title, description, priority, due_date, assignee, position, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  cardResult.data.lastInsertRowid,
                  cat.title,
                  cat.description || '',
                  cat.priority || 'normal',
                  cat.due_date || null,
                  cat.assignee || '',
                  cat.position,
                  cat.color || '#F5F5F5',
                ]
              );

              if (catResult.success && cat.subcategories) {
                for (const subcat of cat.subcategories) {
                  await dbRun(
                    'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                      catResult.data.lastInsertRowid,
                      subcat.title,
                      subcat.description || '',
                      subcat.priority || 'normal',
                      subcat.due_date || null,
                      subcat.assignee || '',
                      subcat.position,
                    ]
                  );
                }
              }
            }
          }

          await loadBoard(boardId);
        } else if (itemType === 'category' && parsedContent.category) {
          const maxPosResult = await dbGet(
            'SELECT MAX(position) as maxPos FROM cards WHERE column_id = ?',
            [columnId]
          );
          const newPosition = (maxPosResult?.data?.maxPos ?? -1) + 1;

          const cardResult = await dbRun(
            'INSERT INTO cards (column_id, title, description, priority, due_date, assignee, position, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              columnId,
              parsedContent.category.title,
              parsedContent.category.description || '',
              parsedContent.category.priority || 'normal',
              parsedContent.category.due_date || null,
              parsedContent.category.assignee || '',
              newPosition,
              parsedContent.category.color || '#FFFFFF',
            ]
          );

          if (cardResult.success && parsedContent.subcategories) {
            for (const subcat of parsedContent.subcategories) {
              await dbRun(
                'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                  cardResult.data.lastInsertRowid,
                  subcat.title,
                  subcat.description || '',
                  subcat.priority || 'normal',
                  subcat.due_date || null,
                  subcat.assignee || '',
                  subcat.position || 0,
                ]
              );
            }
          }

          await loadBoard(boardId);
        } else if (itemType === 'subcategory' && parsedContent.subcategory) {
          await dbRun(
            'INSERT INTO subcategories (category_id, title, description, priority, due_date, assignee, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              columnId,
              parsedContent.subcategory.title,
              parsedContent.subcategory.description || '',
              parsedContent.subcategory.priority || 'normal',
              parsedContent.subcategory.due_date || null,
              parsedContent.subcategory.assignee || '',
              0,
            ]
          );

          await loadBoard(boardId);
        }
      } catch (error) {
        console.error('Error handling library drop:', error);
      }
    };

    window.addEventListener('library-drop', handleLibraryDrop);
    return () => window.removeEventListener('library-drop', handleLibraryDrop);
  }, [dbRun, dbGet, loadBoard]);

  const handleCreateColumn = async e => {
    e.preventDefault();
    if (newColumnTitle.trim() && currentBoard) {
      await createColumn(currentBoard.id, newColumnTitle.trim());
      setNewColumnTitle('');
      setShowNewColumn(false);
    }
  };

  const handleDragEnd = async result => {
    if (!result.destination) {
      console.log('[DragEnd] No destination', result);
      return;
    }

    const { source, destination, draggableId, type } = result;
    console.log('[DragEnd]', { source, destination, draggableId, type });

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('[DragEnd] Same position, skipping');
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
      console.log('[DragEnd] Moving card', { cardId, newColumnId, newPosition });
      await moveCard(cardId, newColumnId, newPosition);
      return;
    }

    if (type === 'category') {
      const categoryId = parseInt(draggableId.replace('category-', ''));
      const newCardId = parseInt(destination.droppableId.replace('card-', ''));
      const newPosition = destination.index;
      console.log('[DragEnd] Moving category', { categoryId, newCardId, newPosition });
      await moveCategory(categoryId, newCardId, newPosition);
      return;
    }

    if (type === 'subcategory') {
      const subcategoryId = parseInt(draggableId.replace('subcategory-', ''));
      const newCategoryId = parseInt(destination.droppableId.replace('category-', ''));
      const newPosition = destination.index;
      await moveSubcategory(subcategoryId, newCategoryId, newPosition);
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-secondary">Chargement...</div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-secondary mb-4">Aucun projet sélectionné</p>
          <p className="text-sm text-muted">Créez un nouveau projet depuis la barre latérale</p>
        </div>
      </div>
    );
  }

  const orderedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {currentBoard.description && (
        <p className="text-sm text-secondary mb-4">{currentBoard.description}</p>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="column" direction="horizontal">
            {provided => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex h-auto min-h-full space-x-[14px] pb-4"
              >
                {orderedColumns.map((column, index) => (
                  <Draggable key={column.id} draggableId={String(column.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex-shrink-0 relative group"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 cursor-grab z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-muted hover:text-secondary"
                          title="Déplacer la colonne"
                        >
                          <GripVertical size={16} />
                        </div>
                        <Column column={column} index={index} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                <div className="flex-shrink-0 w-[310px]">
                  {showNewColumn ? (
                    <form
                      onSubmit={handleCreateColumn}
                      className="bg-column rounded-lg border border-std p-3"
                    >
                      <input
                        type="text"
                        value={newColumnTitle}
                        onChange={e => setNewColumnTitle(e.target.value)}
                        placeholder="Nom de la colonne..."
                        className="w-full px-3 py-2 text-sm bg-input border border-std rounded-md text-primary placeholder-muted focus:outline-none focus:border-accent"
                        autoFocus
                        onBlur={() => {
                          if (!newColumnTitle.trim()) setShowNewColumn(false);
                        }}
                      />
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-md hover:opacity-90 transition-std"
                        >
                          Ajouter
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewColumnTitle('');
                            setShowNewColumn(false);
                          }}
                          className="px-3 py-1.5 text-sm text-secondary hover:text-primary"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewColumn(true)}
                      className="w-full h-12 flex items-center justify-center bg-card/30 hover:bg-card rounded-lg border-2 border-dashed border-std text-secondary hover:text-primary transition-std"
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
