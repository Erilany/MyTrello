import React, { useMemo, useRef, useEffect } from 'react';
import {
  Folder,
  FileText,
  List,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { ROW_HEIGHTS_PX } from '../../utils/hierarchyUtils';

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

  const hierarchy = useMemo(() => {
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

  const formatDate = dateStr => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const getPriorityBadge = priority => {
    if (priority === 'urgent') return { class: 'bg-red-500/20 text-red-400', label: 'U' };
    if (priority === 'high') return { class: 'bg-orange-500/20 text-orange-400', label: 'H' };
    if (priority === 'low') return { class: 'bg-blue-500/20 text-blue-400', label: 'B' };
    if (priority === 'done') return { class: 'bg-green-500/20 text-green-400', label: '✓' };
    return null;
  };

  return (
    <div
      ref={scrollContainerRef}
      className="w-80 shrink-0 border-r border-std bg-card overflow-y-auto overflow-x-hidden"
      onScroll={onScroll}
    >
      <div className="sticky top-0 h-10 bg-card border-b border-std px-3 font-semibold text-sm text-primary flex items-center justify-between z-10">
        <span className="text-primary font-medium">Tâches</span>
        <span className="text-xs text-muted bg-card-hover px-2 py-0.5 rounded">
          {selectedTaskIds.length}/{subcategories.length}
        </span>
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
              className="flex items-center px-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer font-semibold text-blue-900 dark:text-blue-100 text-sm border-l-4 border-blue-500"
              style={{ height: ROW_HEIGHTS_PX.chapter }}
              onClick={() => onToggleChapter(chapterKey)}
            >
              <span className="mr-2">
                {isChapterExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <Folder size={16} className="mr-2 text-blue-600" />
              <span className="truncate flex-1">{chapterName}</span>
              <span className="text-xs text-blue-500/70 bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                {cardCount}c/{catCount}
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
                      className="flex items-center px-3 pl-5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer text-green-900 dark:text-green-100 text-sm border-l-4 border-green-500"
                      style={{ height: ROW_HEIGHTS_PX.card }}
                      onClick={() => onToggleCard(cardKey)}
                    >
                      <span className="mr-2">
                        {isCardExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                      <FileText size={14} className="mr-2 text-green-600" />
                      <span className="truncate flex-1 text-xs font-medium">
                        {card.title || 'Sans titre'}
                      </span>
                      <span className="text-xs text-green-500/70 bg-green-100 dark:bg-green-800 px-1.5 py-0.5 rounded">
                        {catCount}
                      </span>
                    </div>

                    {isCardExpanded &&
                      Object.entries(card.categories).map(([catId, cat]) => {
                        const catKey = `${cardKey}|${catId}`;
                        const isCatExpanded = expandedCategories.has(catKey);

                        return (
                          <div key={`cat-${catId}`}>
                            <div
                              className="flex items-center px-3 pl-8 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer text-yellow-900 dark:text-yellow-100 text-xs border-l-4 border-yellow-500"
                              style={{ height: ROW_HEIGHTS_PX.category }}
                              onClick={() => onToggleCategory(catKey)}
                            >
                              <span className="mr-1.5">
                                {isCatExpanded ? (
                                  <ChevronDown size={11} />
                                ) : (
                                  <ChevronRight size={11} />
                                )}
                              </span>
                              <List size={12} className="mr-1.5 text-yellow-600" />
                              <span className="truncate flex-1">{cat.title || 'Sans titre'}</span>
                              <span className="text-xs text-yellow-500/70 bg-yellow-100 dark:bg-yellow-800 px-1.5 py-0.5 rounded">
                                {cat.subcats.length}
                              </span>
                            </div>

                            {isCatExpanded &&
                              cat.subcats.map((sub, subIdx) => {
                                const isSelected = selectedTaskIds.includes(sub.id);
                                const priorityBadge = getPriorityBadge(sub.priority);

                                return (
                                  <div
                                    key={`sub-${sub.id}`}
                                    className={`flex items-center px-3 pl-12 text-xs cursor-pointer border-l-4 border-gray-300 dark:border-gray-600 hover:bg-card-hover transition-std ${
                                      isSelected ? 'bg-accent/10 border-accent' : 'bg-card'
                                    }`}
                                    style={{ height: ROW_HEIGHTS_PX.task }}
                                    onClick={() => onCenterTask(sub)}
                                    onDoubleClick={() => onEditTask(sub)}
                                  >
                                    <CheckSquare
                                      size={12}
                                      className={`mr-2 shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`}
                                    />
                                    <span
                                      className={`truncate flex-1 ${isSelected ? 'text-accent font-medium' : 'text-primary'}`}
                                    >
                                      {sub.title}
                                    </span>

                                    <div className="flex items-center gap-1 ml-auto shrink-0">
                                      {priorityBadge && (
                                        <span
                                          className={`text-[10px] px-1 py-0.5 rounded ${priorityBadge.class}`}
                                        >
                                          {priorityBadge.label}
                                        </span>
                                      )}

                                      {sub.start_date && (
                                        <Calendar size={10} className="text-muted" />
                                      )}

                                      {sub.due_date && (
                                        <span className="text-[10px] text-muted flex items-center gap-0.5">
                                          {formatDate(sub.due_date)}
                                        </span>
                                      )}

                                      {sub.duration_days > 0 && (
                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded flex items-center gap-0.5">
                                          <Clock size={8} />
                                          {sub.duration_days}j
                                        </span>
                                      )}

                                      {sub.assignee && (
                                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded flex items-center gap-0.5">
                                          <User size={8} />
                                        </span>
                                      )}
                                    </div>
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
