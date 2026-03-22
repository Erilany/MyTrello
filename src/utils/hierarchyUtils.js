export const ROW_HEIGHTS = {
  chapter: 'h-8',
  card: 'h-7',
  category: 'h-6',
  task: 'h-8',
};

export const ROW_HEIGHTS_PX = {
  chapter: 32,
  card: 28,
  category: 24,
  task: 32,
};

export function getRowHeight(type) {
  return ROW_HEIGHTS_PX[type] || 32;
}

export function getFlatTaskList(
  selectedTasks,
  expandedChapters,
  expandedCards,
  expandedCategories
) {
  console.log('[hierarchyUtils] getFlatTaskList called');
  console.log('[hierarchyUtils] selectedTasks count:', selectedTasks?.length || 0);

  if (!selectedTasks || selectedTasks.length === 0) {
    return [];
  }

  const grouped = {};

  selectedTasks.forEach(task => {
    const card = task.card || {};
    const category = task.category || {};
    const chapter = card.chapter || 'Sans chapitre';
    const cardId = card.id || 'nocard';
    const categoryId = category.id || 'nocategory';

    if (!grouped[chapter]) {
      grouped[chapter] = { tasks: [], cards: {} };
    }
    grouped[chapter].tasks.push(task);

    if (!grouped[chapter].cards[cardId]) {
      grouped[chapter].cards[cardId] = { card, tasks: [], categories: {} };
    }
    grouped[chapter].cards[cardId].tasks.push(task);

    if (!grouped[chapter].cards[cardId].categories[categoryId]) {
      grouped[chapter].cards[cardId].categories[categoryId] = {
        category,
        tasks: [],
      };
    }
    grouped[chapter].cards[cardId].categories[categoryId].tasks.push(task);
  });

  const flatList = [];
  let rowIndex = 0;

  Object.entries(grouped).forEach(([chapter, chapterData]) => {
    const chapterKey = chapter;
    const isChapterExpanded = expandedChapters.has(chapterKey);

    const chapterDates = getAggregatedDates(chapterData.tasks);

    flatList.push({
      type: 'chapter',
      key: `chapter-${chapterKey}`,
      title: chapter,
      level: 0,
      rowIndex: rowIndex++,
      aggregatedDates: chapterDates,
    });

    if (isChapterExpanded) {
      Object.entries(chapterData.cards).forEach(([cardId, cardData]) => {
        const cardKey = `${chapterKey}|${cardId}`;
        const isCardExpanded = expandedCards.has(cardKey);

        const cardDates = getAggregatedDates(cardData.tasks);

        flatList.push({
          type: 'card',
          key: `card-${cardId}`,
          title: cardData.card.title,
          level: 1,
          rowIndex: rowIndex++,
          aggregatedDates: cardDates,
        });

        if (isCardExpanded) {
          Object.entries(cardData.categories).forEach(([catId, catData]) => {
            const catKey = `${cardKey}|${catId}`;
            const isCatExpanded = expandedCategories.has(catKey);

            const catDates = getAggregatedDates(catData.tasks);

            flatList.push({
              type: 'category',
              key: `cat-${catId}`,
              title: catData.category.title,
              level: 2,
              rowIndex: rowIndex++,
              aggregatedDates: catDates,
            });

            if (isCatExpanded) {
              catData.tasks.forEach(task => {
                flatList.push({
                  type: 'task',
                  key: `task-${task.id}`,
                  title: task.title,
                  task,
                  level: 3,
                  rowIndex: rowIndex++,
                });
              });
            }
          });
        }
      });
    }
  });

  console.log('[hierarchyUtils] Final flatList count:', flatList.length);
  return flatList;
}

function getAggregatedDates(tasks) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  let minStart = null;
  let maxEnd = null;

  tasks.forEach(task => {
    const start = task.start_date ? new Date(task.start_date) : null;
    const end = task.due_date ? new Date(task.due_date) : null;

    if (start && (!minStart || start < minStart)) {
      minStart = start;
    }
    if (end && (!maxEnd || end > maxEnd)) {
      maxEnd = end;
    }
  });

  if (!minStart && !maxEnd) {
    return null;
  }

  return {
    start: minStart,
    end: maxEnd,
  };
}
