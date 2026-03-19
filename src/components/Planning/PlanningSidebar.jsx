import React, { useMemo, useRef, useEffect } from 'react';
import { Folder, FileText, List, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { ROW_HEIGHTS_PX, getRowHeight } from '../../utils/hierarchyUtils';

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
  ganttScrollTop = 0,
  scrollContainerRef = null,
  onScroll = null,
}) {
  const rowRefs = useRef({});

  useEffect(() => {
    if (scrollContainerRef?.current && ganttScrollTop !== undefined) {
      scrollContainerRef.current.scrollTop = ganttScrollTop;
    }
  }, [ganttScrollTop, scrollContainerRef]);
  console.log('[PlanningSidebar] subcategories.length:', subcategories.length);
  console.log(
    '[PlanningSidebar] subcategories (selectedTasks):',
    subcategories.map(s => ({
      id: s.id,
      title: s.title,
      card_id: s.card_id,
      card_title: s.card?.title,
      category_id: s.category_id,
      category_title: s.category?.title,
    }))
  );
  console.log('[PlanningSidebar] selectedTaskIds:', selectedTaskIds);

  const hierarchy = useMemo(() => {
    console.log('[PlanningSidebar] Building hierarchy from subcategories:', subcategories.length);
    const chapters = {};

    subcategories.forEach(sub => {
      const card = sub.card || {};
      const category = sub.category || {};
      const chapter = card.chapter || 'Sans chapitre';

      if (!chapters[chapter]) {
        chapters[chapter] = { cards: {} };
      }

      const cardId = card.id || 'nocard';
      if (!chapters[chapter].cards[cardId]) {
        chapters[chapter].cards[cardId] = {
          ...card,
          categories: {},
        };
      }

      const catId = category.id || 'nocategory';
      if (!chapters[chapter].cards[cardId].categories[catId]) {
        chapters[chapter].cards[cardId].categories[catId] = {
          ...category,
          subcats: [],
        };
      }

      chapters[chapter].cards[cardId].categories[catId].subcats.push(sub);
    });

    return chapters;
  }, [subcategories]);

  return (
    <div
      ref={scrollContainerRef}
      className="w-72 shrink-0 border-r border-std bg-card overflow-y-auto overflow-x-hidden"
      onScroll={onScroll}
    >
      <div className="sticky top-0 h-8 bg-card border-b border-std p-2 font-semibold text-sm text-primary flex items-center justify-between z-10">
        <span>Tâches ({subcategories.length})</span>
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

      {Object.entries(hierarchy).map(([chapterName, chapterData], chapterIdx) => {
        const chapterKey = chapterName;
        const isChapterExpanded = expandedChapters.has(chapterKey);
        const cardCount = Object.keys(chapterData.cards).length;
        const catCount = Object.values(chapterData.cards).reduce(
          (sum, card) => sum + Object.keys(card.categories).length,
          0
        );

        return (
          <div
            key={`chapter-${chapterIdx}-${chapterKey}`}
            className="border-b border-[var(--border)]"
          >
            <div
              className="flex items-center px-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer font-semibold text-blue-900 dark:text-blue-100 text-sm border-l-4 border-blue-400 border-b border-[var(--border)]"
              style={{ height: ROW_HEIGHTS_PX.chapter }}
              onClick={() => onToggleChapter(chapterKey)}
            >
              <span className="mr-1">
                {isChapterExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <Folder size={14} className="mr-1 text-blue-600" />
              <span className="truncate flex-1">{chapterName}</span>
              <span className="text-xs text-blue-500 ml-1">
                ({cardCount}c/{catCount}cat)
              </span>
            </div>

            {isChapterExpanded &&
              Object.entries(chapterData.cards).map(([cardId, card]) => {
                const cardKey = `${chapterKey}|${cardId}`;
                const isCardExpanded = expandedCards.has(cardKey);
                const catCount = Object.keys(card.categories).length;

                return (
                  <div key={`card-${cardId}`}>
                    <div
                      className="flex items-center px-2 pl-6 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer text-green-900 dark:text-green-100 text-sm border-l-4 border-green-400 border-b border-[var(--border)]"
                      style={{ height: ROW_HEIGHTS_PX.card }}
                      onClick={() => onToggleCard(cardKey)}
                    >
                      <span className="mr-1">
                        {isCardExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                      <FileText size={12} className="mr-1 text-green-600" />
                      <span className="truncate flex-1 text-xs">{card.title || 'Sans titre'}</span>
                      <span className="text-xs text-green-500">({catCount})</span>
                    </div>

                    {isCardExpanded &&
                      Object.entries(card.categories).map(([catId, cat]) => {
                        const catKey = `${cardKey}|${catId}`;
                        const isCatExpanded = expandedCategories.has(catKey);

                        return (
                          <div key={`cat-${catId}`}>
                            <div
                              className="flex items-center px-2 pl-10 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer text-yellow-900 dark:text-yellow-100 text-xs border-l-4 border-yellow-400 border-b border-[var(--border)]"
                              style={{ height: ROW_HEIGHTS_PX.category }}
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
                              <span className="truncate flex-1">{cat.title || 'Sans titre'}</span>
                              <span className="text-xs text-yellow-500">
                                ({cat.subcats.length})
                              </span>
                            </div>

                            {isCatExpanded &&
                              cat.subcats.map((sub, subIdx) => {
                                const isSelected = selectedTaskIds.includes(sub.id);
                                return (
                                  <div
                                    key={`sub-${sub.id}`}
                                    className={`flex items-center px-2 pl-14 text-xs cursor-pointer border-l-4 border-gray-300 dark:border-gray-600 border-b border-[var(--border)] ${
                                      isSelected
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                    style={{ height: ROW_HEIGHTS_PX.task }}
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
          <p>Aucune tâche sélectionnée</p>
        </div>
      )}
    </div>
  );
}
