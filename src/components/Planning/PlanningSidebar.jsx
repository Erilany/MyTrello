import React, { useMemo } from 'react';

function getTaskStatusColor(status) {
  switch (status) {
    case 'done':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'waiting':
      return 'bg-blue-500';
    case 'todo':
      return 'bg-orange-500';
    default:
      return 'bg-gray-400';
  }
}

export default function PlanningSidebar({
  tasks,
  expandedChapters,
  expandedCards,
  expandedCategories,
  onToggleChapter,
  onToggleCard,
  onToggleCategory,
  onCenterTask,
  onEditTask,
}) {
  const groupedTasks = useMemo(() => {
    const groups = {};

    tasks.forEach(task => {
      const card = task.card || {};
      const category = task.category || {};
      const chapter = card.chapter || 'Sans chapitre';
      const cardId = card.id || 'nocard';
      const categoryId = category.id || 'nocategory';

      if (!groups[chapter]) {
        groups[chapter] = {};
      }
      if (!groups[chapter][cardId]) {
        groups[chapter][cardId] = {
          card,
          categories: {},
        };
      }
      if (!groups[chapter][cardId].categories[categoryId]) {
        groups[chapter][cardId].categories[categoryId] = {
          category,
          tasks: [],
        };
      }
      groups[chapter][cardId].categories[categoryId].tasks.push(task);
    });

    return groups;
  }, [tasks]);

  const getChapterTaskCount = chapterData => {
    return Object.values(chapterData).reduce(
      (sum, c) => sum + Object.values(c.categories).reduce((s, cat) => s + cat.tasks.length, 0),
      0
    );
  };

  const getCardTaskCount = cardData => {
    return Object.values(cardData.categories).reduce((sum, cat) => sum + cat.tasks.length, 0);
  };

  return (
    <div className="w-64 shrink-0 border-r border-std bg-card overflow-y-auto overflow-x-hidden">
      <div className="sticky top-0 h-8 bg-card border-b border-std p-2 font-semibold text-sm text-primary flex items-center z-10">
        Tâche
      </div>
      {Object.entries(groupedTasks).map(([chapter, cards]) => {
        const chapterKey = chapter;
        const isChapterExpanded = expandedChapters.has(chapterKey);
        const chapterTaskCount = getChapterTaskCount(cards);

        return (
          <div key={chapterKey}>
            <div
              className="h-8 flex items-center px-2 border-b border-std hover:bg-card-hover text-sm cursor-pointer font-medium text-primary"
              onClick={() => onToggleChapter(chapterKey)}
            >
              <span className="mr-1 text-xs">{isChapterExpanded ? '▼' : '▶'}</span>
              <span className="truncate">{chapterKey}</span>
              <span className="ml-1 text-xs text-muted">({chapterTaskCount})</span>
            </div>
            {isChapterExpanded &&
              Object.entries(cards).map(([cardId, cardData]) => {
                const cardKey = `${chapterKey}|${cardId}`;
                const isCardExpanded = expandedCards.has(cardKey);
                const cardTaskCount = getCardTaskCount(cardData);

                return (
                  <div key={cardKey}>
                    <div
                      className="h-8 flex items-center px-2 pl-6 border-b border-std hover:bg-card-hover text-sm cursor-pointer text-secondary"
                      onClick={() => onToggleCard(cardKey)}
                    >
                      <span className="mr-1 text-xs">{isCardExpanded ? '▼' : '▶'}</span>
                      <span className="truncate">{cardData.card?.title || 'Sans titre'}</span>
                      <span className="ml-1 text-xs text-muted">({cardTaskCount})</span>
                    </div>
                    {isCardExpanded &&
                      Object.entries(cardData.categories).map(([catId, catData]) => {
                        const catKey = `${cardKey}|${catId}`;
                        const isCatExpanded = expandedCategories.has(catKey);

                        return (
                          <div key={catKey}>
                            <div
                              className="h-8 flex items-center px-2 pl-10 border-b border-std hover:bg-card-hover text-sm cursor-pointer text-muted"
                              onClick={() => onToggleCategory(catKey)}
                            >
                              <span className="mr-1 text-xs">{isCatExpanded ? '▼' : '▶'}</span>
                              <span className="truncate">
                                {catData.category?.title || 'Sans catégorie'}
                              </span>
                              <span className="ml-1 text-xs text-muted">
                                ({catData.tasks.length})
                              </span>
                            </div>
                            {isCatExpanded &&
                              catData.tasks.map(task => (
                                <div
                                  key={task.id}
                                  className="h-8 flex items-center px-2 pl-14 border-b border-std hover:bg-card-hover text-sm"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${getTaskStatusColor(task.status)}`}
                                    ></span>
                                    <span
                                      className="text-primary truncate cursor-pointer hover:underline"
                                      title={task.title}
                                      onClick={e => {
                                        e.stopPropagation();
                                        onCenterTask(task);
                                      }}
                                      onDoubleClick={e => {
                                        e.stopPropagation();
                                        onEditTask(task);
                                      }}
                                    >
                                      {task.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
