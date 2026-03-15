import React, { useMemo, useEffect, useRef } from 'react';
import { getWeekNumber } from '../../utils/dateUtils';

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

export default function PlanningGantt({
  tasks,
  ganttDays,
  getTaskBarPosition,
  expandedChapters,
  expandedCards,
  expandedCategories,
  zoom = 'week',
  scrollToTask,
}) {
  const dayWidth = zoom === 'day' ? 60 : zoom === 'week' ? 30 : 10;
  const containerRef = useRef(null);
  const taskRefs = useRef({});

  useEffect(() => {
    if (scrollToTask && taskRefs.current[scrollToTask.id] && containerRef.current) {
      taskRefs.current[scrollToTask.id].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [scrollToTask]);
  const { days, flatList } = useMemo(() => {
    const d = ganttDays;

    const grouped = {};
    tasks.forEach(task => {
      const card = task.card || {};
      const category = task.category || {};
      const chapter = card.chapter || 'Sans chapitre';
      const cardId = card.id || 'nocard';
      const categoryId = category.id || 'nocategory';

      if (!grouped[chapter]) {
        grouped[chapter] = {};
      }
      if (!grouped[chapter][cardId]) {
        grouped[chapter][cardId] = {
          card,
          categories: {},
        };
      }
      if (!grouped[chapter][cardId].categories[categoryId]) {
        grouped[chapter][cardId].categories[categoryId] = {
          category,
          tasks: [],
        };
      }
      grouped[chapter][cardId].categories[categoryId].tasks.push(task);
    });

    const flat = [];
    Object.entries(grouped).forEach(([chapter, cards]) => {
      const chapterKey = chapter;
      const isChapterExpanded = expandedChapters.has(chapterKey);

      flat.push({ type: 'chapter', key: `chapter-${chapterKey}` });

      if (isChapterExpanded) {
        Object.entries(cards).forEach(([cardId, cardData]) => {
          const cardKey = `${chapterKey}|${cardId}`;
          const isCardExpanded = expandedCards.has(cardKey);

          flat.push({ type: 'card', key: `card-${cardId}` });

          if (isCardExpanded) {
            Object.entries(cardData.categories).forEach(([catId, catData]) => {
              const catKey = `${cardKey}|${catId}`;
              const isCatExpanded = expandedCategories.has(catKey);

              flat.push({ type: 'category', key: `cat-${catId}`, tasks: catData.tasks });

              if (isCatExpanded) {
                catData.tasks.forEach(task => {
                  flat.push({ type: 'task', key: `task-${task.id}`, task });
                });
              }
            });
          }
        });
      }
    });

    return { days: d, flatList: flat };
  }, [tasks, ganttDays, expandedChapters, expandedCards, expandedCategories]);

  const weeks = useMemo(() => {
    const w = [];
    let currentWeek = null;

    days.forEach((day, idx) => {
      const weekNum = getWeekNumber(day);
      if (!currentWeek || currentWeek.week !== weekNum) {
        if (currentWeek) w.push(currentWeek);
        currentWeek = { week: weekNum, days: [], startIdx: idx };
      }
      currentWeek.days.push({ day, idx });
    });
    if (currentWeek) w.push(currentWeek);

    return w;
  }, [days]);

  const totalDays = days.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIndex = days.findIndex(day => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  return (
    <div className="flex-1 min-w-0 overflow-x-auto" ref={containerRef}>
      <div className="min-w-max">
        <div className="flex sticky top-0 h-8 bg-card border-b border-std z-10">
          {weeks.map(week => (
            <div key={week.week} className="flex">
              <div
                className="text-xs text-center p-1 border-r border-std bg-card-hover font-medium text-secondary"
                style={{ minWidth: `${week.days.length * dayWidth}px` }}
              >
                S{week.week}
              </div>
            </div>
          ))}
        </div>
        <div className="relative">
          {todayIndex >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
              style={{ left: `${todayIndex * dayWidth + dayWidth / 2}px` }}
              title="Aujourd'hui"
            />
          )}
          {flatList.map(item => {
            if (item.type !== 'task') {
              return (
                <div
                  key={item.key}
                  className="h-8 border-b border-std bg-card-hover"
                  style={{ width: `${totalDays * dayWidth}px` }}
                />
              );
            }
            const task = item.task;
            const pos = getTaskBarPosition(task);
            return (
              <div
                key={task.id}
                ref={el => (taskRefs.current[task.id] = el)}
                className="flex items-center h-8 border-b border-std relative"
                style={{ width: `${totalDays * dayWidth}px` }}
              >
                {days.map((day, idx) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={idx}
                      className={`h-full border-r border-std ${isWeekend ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      style={{ width: `${dayWidth}px`, flexShrink: 0 }}
                    />
                  );
                })}
                {todayIndex >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${todayIndex * dayWidth + dayWidth / 2}px` }}
                  />
                )}
                <div
                  className={`absolute h-5 rounded ${getTaskStatusColor(task.status)} flex items-center justify-center text-white text-xs px-1 cursor-pointer hover:opacity-80`}
                  style={{ left: pos.left, width: pos.width, top: '6px' }}
                  title={`${task.title} (${task.start_date || '?'} - ${task.due_date || '?'})`}
                >
                  <span className="truncate">{task.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
