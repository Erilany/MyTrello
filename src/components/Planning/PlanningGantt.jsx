import React, { useMemo, useEffect, useRef, useState } from 'react';
import { getWeekNumber } from '../../utils/dateUtils';
import { ROW_HEIGHTS_PX } from '../../utils/hierarchyUtils';

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
  flatTaskList = [],
  ganttDays,
  getTaskBarPosition,
  zoom = 'week',
  scrollToTask,
  scrollToToday,
  containerRef,
  onScroll = null,
  isHovering = false,
  onMouseEnter = null,
  onMouseLeave = null,
}) {
  const dataScrollRef = useRef(null);
  const taskRefs = useRef({});

  const getRowHeight = type => ROW_HEIGHTS_PX[type] || 32;

  const dayWidth = useMemo(() => {
    if (zoom === 'day') return 60;
    if (zoom === 'week') return 30;
    return 15;
  }, [zoom]);

  const totalDays = ganttDays.length;

  useEffect(() => {
    if (scrollToTask && taskRefs.current[scrollToTask.task?.id]) {
      const taskElement = taskRefs.current[scrollToTask.task?.id];
      taskElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [scrollToTask]);

  useEffect(() => {
    if (scrollToToday && ganttDays.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let targetIndex = -1;
      let minDiff = Infinity;

      ganttDays.forEach((day, idx) => {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        const diff = Math.abs(d.getTime() - today.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          targetIndex = idx;
        }
      });

      if (minDiff > 60 * 24 * 60 * 60 * 1000) {
        return;
      }

      if (targetIndex >= 0 && dataScrollRef.current) {
        const container = dataScrollRef.current;
        const scrollPosition = targetIndex * dayWidth - container.clientWidth / 2 + dayWidth;
        container.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, [scrollToToday, ganttDays, dayWidth]);

  const months = useMemo(() => {
    const m = [];
    let currentMonth = null;

    ganttDays.forEach((day, idx) => {
      const monthKey = `${day.getFullYear()}-${day.getMonth()}`;
      const monthName = day.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      if (!currentMonth || currentMonth.key !== monthKey) {
        if (currentMonth) m.push(currentMonth);
        currentMonth = {
          key: monthKey,
          name: monthName,
          days: [],
          startIdx: idx,
        };
      }
      currentMonth.days.push({ day, idx });
    });
    if (currentMonth) m.push(currentMonth);
    return m;
  }, [ganttDays]);

  const weeks = useMemo(() => {
    const w = [];
    let currentWeek = null;

    ganttDays.forEach((day, idx) => {
      const weekNum = getWeekNumber(day);
      if (!currentWeek || currentWeek.week !== weekNum || currentWeek.year !== day.getFullYear()) {
        if (currentWeek) w.push(currentWeek);
        currentWeek = {
          week: weekNum,
          year: day.getFullYear(),
          days: [],
          startIdx: idx,
          key: `week-${day.getFullYear()}-${weekNum}`,
        };
      }
      currentWeek.days.push({ day, idx });
    });
    if (currentWeek) w.push(currentWeek);

    return w;
  }, [ganttDays]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayIndex = -1;
  let minDiff = Infinity;
  ganttDays.forEach((day, idx) => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    const diff = Math.abs(d.getTime() - today.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      todayIndex = idx;
    }
  });
  if (minDiff > 60 * 24 * 60 * 60 * 1000) {
    todayIndex = -1;
  }

  const getLevelStyles = type => {
    switch (type) {
      case 'chapter':
        return `bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-400 border-b border-[var(--border)]`;
      case 'card':
        return `bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-400 border-b border-[var(--border)]`;
      case 'category':
        return `bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400 border-b border-[var(--border)]`;
      default:
        return `border-l-4 border-l-gray-300 dark:border-l-gray-600 border-b border-[var(--border)]`;
    }
  };

  return (
    <div
      className="flex-1 min-w-0 flex flex-col relative overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header sticky pour Mois et Semaines */}
      <div
        className="flex-shrink-0 bg-card border-b border-std z-20 overflow-hidden"
        style={{ height: ROW_HEIGHTS_PX.chapter * 2 }}
      >
        <div
          className="h-full overflow-x-auto overflow-y-hidden"
          ref={el => {
            if (el && containerRef) {
              containerRef.current = el;
            }
          }}
          onScroll={e => {
            if (dataScrollRef.current) {
              dataScrollRef.current.scrollLeft = e.target.scrollLeft;
            }
            if (onScroll) onScroll(e);
          }}
        >
          <div
            style={{ width: `${totalDays * dayWidth}px`, minWidth: `${totalDays * dayWidth}px` }}
          >
            {/* Ligne Mois */}
            <div className="flex h-6 bg-blue-50 dark:bg-blue-900/30 border-b border-std">
              {months.map(month => (
                <div
                  key={month.key}
                  className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center border-r border-std"
                  style={{ width: `${month.days.length * dayWidth}px` }}
                >
                  {month.name.charAt(0).toUpperCase() + month.name.slice(1)}
                </div>
              ))}
            </div>
            {/* Ligne Semaines */}
            <div className="flex h-6 items-center">
              {weeks.map((week, weekIdx) => (
                <div key={`week-${weekIdx}-${week.key}`} className="flex h-full">
                  <div
                    className="text-xs text-center p-1 border-r border-std bg-card-hover font-medium text-secondary flex items-center justify-center"
                    style={{
                      minWidth: `${week.days.length * dayWidth}px`,
                      height: 24,
                    }}
                  >
                    S{week.week}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div
        ref={dataScrollRef}
        className="flex-1 overflow-auto relative"
        onScroll={e => {
          if (containerRef && containerRef.current) {
            containerRef.current.scrollLeft = e.target.scrollLeft;
          }
          if (onScroll) onScroll(e);
        }}
      >
        {/* Contenu total avec largeur = jours */}
        <div style={{ width: `${totalDays * dayWidth}px`, minWidth: `${totalDays * dayWidth}px` }}>
          {/* Lignes de données */}
          <div className="relative">
            {todayIndex >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{ left: `${todayIndex * dayWidth + dayWidth / 2}px` }}
                title="Aujourd'hui"
              />
            )}
            {flatTaskList.map((item, rowIdx) => {
              const isTask = item.type === 'task' && item.task;
              const rowHeight = getRowHeight(item.type);
              const hasAggregatedDates = item.aggregatedDates && ganttDays.length > 0;

              return (
                <div
                  key={`row-${rowIdx}-${item.key}`}
                  className={`flex items-center relative ${getLevelStyles(item.type)}`}
                  style={{ height: rowHeight }}
                  ref={
                    isTask
                      ? el => {
                          if (el) taskRefs.current[item.task.id] = el;
                        }
                      : undefined
                  }
                >
                  {ganttDays.map((day, dayIdx) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={`${rowIdx}-day-${dayIdx}`}
                        className={`h-full border-r border-std ${isWeekend ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                        style={{ width: `${dayWidth}px`, flexShrink: 0 }}
                      />
                    );
                  })}

                  {todayIndex >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                      style={{ left: `${todayIndex * dayWidth + dayWidth / 2}px` }}
                    />
                  )}

                  {isTask && (
                    <TaskBar
                      task={item.task}
                      pos={getTaskBarPosition(item.task)}
                      rowHeight={rowHeight}
                      dayWidth={dayWidth}
                    />
                  )}

                  {!isTask && hasAggregatedDates && (
                    <AggregatedBar
                      dates={item.aggregatedDates}
                      ganttDays={ganttDays}
                      rowHeight={rowHeight}
                      dayWidth={dayWidth}
                      type={item.type}
                      title={item.title}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskBar({ task, pos, rowHeight, dayWidth }) {
  const barHeight = 20;
  const topOffset = Math.max(0, (rowHeight - barHeight) / 2);

  return (
    <div
      className={`absolute h-5 rounded ${getTaskStatusColor(task.status)} flex items-center justify-center text-white text-xs px-1 cursor-pointer hover:opacity-80 overflow-hidden`}
      style={{
        left: `${pos.startOffset * dayWidth}px`,
        width: `${pos.duration * dayWidth}px`,
        top: `${topOffset}px`,
      }}
      title={`${task.title} (${task.start_date || '?'} - ${task.due_date || '?'})`}
    >
      {task.progress > 0 && task.progress < 100 && (
        <div
          className="absolute inset-y-0 left-0 bg-white/30"
          style={{ width: `${task.progress}%` }}
        />
      )}
      <span className="truncate relative z-10">{task.title}</span>
    </div>
  );
}

function AggregatedBar({ dates, ganttDays, rowHeight, dayWidth, type, title }) {
  if (!dates || !ganttDays || ganttDays.length === 0) return null;

  const rangeStart = ganttDays[0];
  const rangeEnd = ganttDays[ganttDays.length - 1];
  const rangeStartTime = rangeStart.getTime();
  const rangeEndTime = rangeEnd.getTime();
  const totalDays = Math.ceil((rangeEndTime - rangeStartTime) / (24 * 60 * 60 * 1000)) + 1;

  let startOffset = 0;
  let duration = totalDays;

  if (dates.start) {
    const startTime = dates.start.getTime();
    startOffset = Math.max(0, Math.ceil((startTime - rangeStartTime) / (24 * 60 * 60 * 1000)));
  }

  if (dates.end) {
    const endTime = dates.end.getTime();
    const endOffset = Math.ceil((endTime - rangeStartTime) / (24 * 60 * 60 * 1000));
    duration = Math.max(1, endOffset - startOffset + 1);
  }

  const barHeight = type === 'category' ? 8 : 14;
  const topOffset = Math.max(0, (rowHeight - barHeight) / 2);

  const colorMap = {
    chapter: 'bg-blue-400 opacity-60',
    card: 'bg-green-400 opacity-60',
    category: 'bg-yellow-400 opacity-60',
  };

  const barColor = colorMap[type] || 'bg-gray-400 opacity-60';

  const startDateStr = dates.start ? dates.start.toLocaleDateString('fr-FR') : '?';
  const endDateStr = dates.end ? dates.end.toLocaleDateString('fr-FR') : '?';

  return (
    <div
      className={`absolute h-full rounded ${barColor} flex items-center text-white text-xs px-1 cursor-pointer hover:opacity-80 overflow-hidden`}
      style={{
        left: `${startOffset * dayWidth}px`,
        width: `${duration * dayWidth}px`,
        top: `${topOffset}px`,
        height: `${barHeight}px`,
      }}
      title={`${title} (${startDateStr} - ${endDateStr})`}
    >
      <span className="truncate font-medium">{title}</span>
    </div>
  );
}
