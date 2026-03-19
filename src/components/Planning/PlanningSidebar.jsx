import React, { useMemo } from 'react';
import { Folder, FileText, List, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';

export default function PlanningSidebar({
  cards = [],
  categories = [],
  subcategories = [],
  expandedChapters,
  expandedCards,
  expandedCategories,
  onToggleChapter,
  onToggleCard,
  onToggleCategory,
  onCenterTask,
  onEditTask,
  selectedTaskIds = [],
}) {
  const hierarchy = useMemo(() => {
    const chapters = {};

    cards.forEach(card => {
      const chapter = card.chapter || 'Sans chapitre';
      if (!chapters[chapter]) {
        chapters[chapter] = { cards: [], hasSubcategories: false };
      }
      chapters[chapter].cards.push({
        ...card,
        categories: categories.filter(cat => Number(cat.card_id) === Number(card.id)),
      });
    });

    categories.forEach(cat => {
      const card = cards.find(c => Number(c.id) === Number(cat.card_id));
      if (card) {
        const chapter = card.chapter || 'Sans chapitre';
        const subcats = subcategories.filter(sub => Number(sub.category_id) === Number(cat.id));
        if (subcats.length > 0) {
          if (chapters[chapter]) {
            chapters[chapter].hasSubcategories = true;
          }
        }
      }
    });

    return chapters;
  }, [cards, categories, subcategories]);

  const getChapterItemCount = (chapterName, chapterData) => {
    const cardCount = chapterData.cards.length;
    const catCount = chapterData.cards.reduce((sum, card) => sum + card.categories.length, 0);
    const catIds = chapterData.cards.flatMap(card => card.categories.map(cat => cat.id));
    const subcatCount = subcategories.filter(sub =>
      catIds.includes(Number(sub.category_id))
    ).length;
    return { cards: cardCount, categories: catCount, subcategories: subcatCount };
  };

  return (
    <div className="w-72 shrink-0 border-r border-std bg-card overflow-y-auto overflow-x-hidden">
      <div className="sticky top-0 h-8 bg-card border-b border-std p-2 font-semibold text-sm text-primary flex items-center justify-between z-10">
        <span>Tâches</span>
        <button
          onClick={() => {
            const allChapters = Object.keys(hierarchy);
            allChapters.forEach(ch => onToggleChapter(ch));
          }}
          className="text-xs px-2 py-0.5 bg-[var(--bg-card-hover)] rounded hover:bg-[var(--border)]"
        >
          Tout
        </button>
      </div>

      {Object.entries(hierarchy).map(([chapterName, chapterData]) => {
        const chapterKey = chapterName;
        const isChapterExpanded = expandedChapters.has(chapterKey);
        const counts = getChapterItemCount(chapterName, chapterData);

        return (
          <div key={chapterKey} className="border-b border-[var(--border)]">
            <div
              className="flex items-center h-8 px-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer font-semibold text-blue-900 dark:text-blue-100 text-sm border-l-4 border-blue-400"
              onClick={() => onToggleChapter(chapterKey)}
            >
              <span className="mr-1">
                {isChapterExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <Folder size={14} className="mr-1 text-blue-600" />
              <span className="truncate flex-1">{chapterName}</span>
              <span className="text-xs text-blue-500 ml-1">
                ({counts.cards}c/{counts.categories}cat/{counts.subcategories}s)
              </span>
            </div>

            {isChapterExpanded &&
              chapterData.cards.map(card => {
                const cardKey = `${chapterKey}|${card.id}`;
                const isCardExpanded = expandedCards.has(cardKey);
                const catCount = card.categories.length;

                return (
                  <div key={card.id}>
                    <div
                      className="flex items-center h-7 px-2 pl-6 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer text-green-900 dark:text-green-100 text-sm border-l-4 border-green-400"
                      onClick={() => onToggleCard(cardKey)}
                    >
                      <span className="mr-1">
                        {isCardExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                      <FileText size={12} className="mr-1 text-green-600" />
                      <span className="truncate flex-1 text-xs">{card.title}</span>
                      <span className="text-xs text-green-500">({catCount})</span>
                    </div>

                    {isCardExpanded &&
                      card.categories.map(cat => {
                        const catKey = `${cardKey}|${cat.id}`;
                        const isCatExpanded = expandedCategories.has(catKey);
                        const catSubcats = subcategories.filter(
                          sub => Number(sub.category_id) === Number(cat.id)
                        );

                        return (
                          <div key={cat.id}>
                            <div
                              className="flex items-center h-6 px-2 pl-10 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer text-yellow-900 dark:text-yellow-100 text-xs border-l-4 border-yellow-400"
                              onClick={() => onToggleCategory(catKey)}
                            >
                              <span className="mr-1">
                                {isCatExpanded ? (
                                  <ChevronDown size={10} />
                                ) : (
                                  <ChevronRight size={10} />
                                )}
                              </span>
                              <List size={10} className="mr-1 text-yellow-600" />
                              <span className="truncate flex-1">{cat.title}</span>
                              <span className="text-xs text-yellow-500">({catSubcats.length})</span>
                            </div>

                            {isCatExpanded &&
                              catSubcats.map(sub => {
                                const isSelected = selectedTaskIds.includes(sub.id);
                                return (
                                  <div
                                    key={sub.id}
                                    className={`flex items-center h-6 px-2 pl-14 text-xs cursor-pointer border-l-4 border-gray-300 dark:border-gray-600 ${
                                      isSelected
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                    onClick={() => onCenterTask(sub)}
                                    onDoubleClick={() => onEditTask(sub)}
                                  >
                                    <CheckSquare size={10} className="mr-1 text-gray-500" />
                                    <span className="truncate flex-1 text-gray-700 dark:text-gray-200">
                                      {sub.title}
                                    </span>
                                    {sub.due_date && (
                                      <span className="text-xs text-gray-400 ml-1">
                                        {new Date(sub.due_date).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                        })}
                                      </span>
                                    )}
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
      })}

      {Object.keys(hierarchy).length === 0 && (
        <div className="text-center py-8 text-muted text-sm">
          <p>Aucune tâche</p>
        </div>
      )}
    </div>
  );
}
