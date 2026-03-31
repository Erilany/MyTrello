import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Filter, Download, Upload } from 'lucide-react';
import PlanningSidebar from './PlanningSidebar';
import PlanningGantt from './PlanningGantt';
import PlanningTaskSelector from './PlanningTaskSelector';
import PlanningImportCompare from './PlanningImportCompare';
import { generateMSProjectXML } from '../utils/xmlUtils';
import { getGanttDateRange, getGanttDays, getTaskBarPosition } from '../utils/ganttUtils';
import { getFlatTaskList } from '../utils/hierarchyUtils';

export default function PlanningView({
  currentBoard,
  tasks,
  cards,
  categories,
  selectedTaskIds,
  onToggleTask,
  onSelectAll,
  onDeselectAll,
  showTaskSelector,
  setShowTaskSelector,
  expandedChapters,
  expandedCards,
  expandedCategories,
  onToggleChapter,
  onToggleCard,
  onToggleCategory,
  onExpandAll,
  onCenterTask,
  onEditTask,
  sortOrder,
  setSortOrder,
  zoom,
  setZoom,
  ganttStartDate,
  onImportPlanning,
  orderedChapters,
  importing,
}) {
  const [scrollToTask, setScrollToTask] = useState(null);
  const [showImportCompare, setShowImportCompare] = useState(false);
  const [scrollToToday, setScrollToToday] = useState(false);
  const [isHoveringGantt, setIsHoveringGantt] = useState(false);
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const ganttContainerRef = useRef(null);
  const sidebarContainerRef = useRef(null);

  const handleToggleAll = useCallback(() => {
    if (isAllExpanded) {
      if (onExpandAll) {
        onExpandAll(new Set(), new Set(), new Set());
      }
    } else {
      const allChapters = new Set();
      const allCards = new Set();
      const allCategories = new Set();
      const selectedIdsSet = new Set(selectedTaskIds.map(id => Number(id)));

      tasks.forEach(task => {
        if (selectedIdsSet.has(Number(task.id))) {
          const card = task.card || {};
          const category = task.category || {};
          const chapter = card.chapter || 'Sans chapitre';
          const cardId = card.id;
          const categoryId = category.id;

          allChapters.add(chapter);
          if (cardId) {
            allCards.add(`${chapter}|${cardId}`);
          }
          if (categoryId && cardId) {
            allCategories.add(`${chapter}|${cardId}|${categoryId}`);
          }
        }
      });

      if (onExpandAll) {
        onExpandAll(allChapters, allCards, allCategories);
      }
    }
    setIsAllExpanded(!isAllExpanded);
  }, [isAllExpanded, tasks, selectedTaskIds, onExpandAll]);

  const handleGanttScroll = useCallback(e => {
    if (sidebarContainerRef.current) {
      sidebarContainerRef.current.scrollTop = e.target.scrollTop;
    }
  }, []);

  const handleSidebarScroll = useCallback(e => {
    if (ganttContainerRef.current) {
      ganttContainerRef.current.scrollTop = e.target.scrollTop;
    }
  }, []);

  console.log(
    '[PlanningView] RENDER, tasks.length:',
    tasks?.length,
    'selectedTaskIds:',
    selectedTaskIds
  );

  const handleCenterTask = useCallback(
    task => {
      setScrollToTask(null);
      onCenterTask(task);
      setTimeout(() => setScrollToTask(task), 100);
    },
    [onCenterTask]
  );

  const selectedTasks = useMemo(() => {
    console.log('[PlanningView] selectedTasks useMemo computing');
    console.log('[PlanningView] selectedTaskIds:', selectedTaskIds);
    console.log('[PlanningView] tasks.length:', tasks.length);

    if (selectedTaskIds.length === 0) {
      return [];
    }

    console.log(
      '[PlanningView] selectedTaskIds types:',
      selectedTaskIds.map(id => ({ id, type: typeof id }))
    );
    console.log('[PlanningView] tasks[0] id type:', typeof tasks[0]?.id, tasks[0]?.id);

    const selectedIdsSet = new Set(selectedTaskIds.map(id => Number(id)));
    console.log('[PlanningView] selectedIdsSet:', [...selectedIdsSet]);

    let result = tasks.filter(t => selectedIdsSet.has(Number(t.id)));
    console.log('[PlanningView] Filtered by ID, result count:', result.length);

    if (sortOrder === 'date') {
      result = [...result].sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date) : new Date('2099-01-01');
        const dateB = b.start_date ? new Date(b.start_date) : new Date('2099-01-01');
        return dateA - dateB;
      });
    }

    console.log(
      '[PlanningView] selectedTasks result:',
      result.map(t => ({ id: t.id, title: t.title }))
    );
    return result;
  }, [tasks, selectedTaskIds, sortOrder]);

  const handleExportMSProject = useCallback(() => {
    if (selectedTasks.length === 0) {
      alert('Aucune tâche sélectionnée');
      return;
    }

    const projectName = currentBoard?.title || 'Projet';
    const xml = generateMSProjectXML(selectedTasks, projectName);

    if (!xml) return;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_planning.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentBoard, selectedTasks]);

  const handleGoToToday = useCallback(() => {
    setScrollToToday(prev => !prev);
  }, []);

  const flatTaskList = useMemo(() => {
    console.log('[PlanningView] flatTaskList computing');
    console.log('[PlanningView] selectedTasks for flatList:', selectedTasks.length);
    console.log(
      '[PlanningView] selectedTasks:',
      selectedTasks.map(t => ({
        id: t.id,
        title: t.title,
        card: t.card?.title,
        category: t.category?.title,
      }))
    );
    const result = getFlatTaskList(
      selectedTasks,
      expandedChapters,
      expandedCards,
      expandedCategories
    );
    console.log(
      '[PlanningView] flatTaskList result:',
      result.map(r => ({ type: r.type, key: r.key, title: r.title, hasTask: !!r.task }))
    );
    return result;
  }, [selectedTasks, expandedChapters, expandedCards, expandedCategories]);

  const computedGanttDateRange = useMemo(() => {
    return getGanttDateRange(flatTaskList, ganttStartDate, zoom);
  }, [flatTaskList, ganttStartDate, zoom]);

  const computedGanttDays = useMemo(() => {
    return getGanttDays(flatTaskList, ganttStartDate, zoom);
  }, [flatTaskList, ganttStartDate, zoom]);

  const computedGetTaskBarPosition = useMemo(() => {
    return task => getTaskBarPosition(task, flatTaskList, ganttStartDate, zoom);
  }, [flatTaskList, ganttStartDate, zoom]);

  useEffect(() => {
    if (scrollToToday && ganttContainerRef.current) {
      const container = ganttContainerRef.current;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIndex = computedGanttDays.findIndex(day => {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });

      if (todayIndex >= 0) {
        const dayWidth =
          zoom === 'day'
            ? 60
            : zoom === 'week'
              ? Math.max(20, container.clientWidth / 42)
              : Math.max(8, container.clientWidth / 180);
        const scrollPosition = todayIndex * dayWidth - container.clientWidth / 2;
        container.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, [scrollToToday, computedGanttDays, zoom]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-std flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-primary">Planning</h2>
          <button
            onClick={() => setShowTaskSelector(true)}
            className="flex items-center px-3 py-1.5 text-sm bg-accent-soft text-accent rounded-lg hover:bg-accent/20"
          >
            <Filter size={14} className="mr-2" />
            {selectedTaskIds.length === 0
              ? 'Toutes les tâches'
              : `${selectedTaskIds.length} tâche(s) sélectionnée(s)`}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="px-2 py-1.5 text-sm bg-input border border-std rounded text-primary"
          >
            <option value="date">Trier par date</option>
            <option value="hierarchy">Trier par hiérarchie</option>
          </select>
          <select
            value={zoom}
            onChange={e => setZoom(e.target.value)}
            className="px-2 py-1.5 text-sm bg-input border border-std rounded text-primary"
          >
            <option value="day">Jour</option>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
          </select>
          <button
            onClick={handleGoToToday}
            className="px-2 py-1.5 text-sm bg-input border border-std rounded text-primary hover:bg-card-hover"
            title="Aller à aujourd'hui"
          >
            Aujourd'hui
          </button>
          <button
            onClick={handleExportMSProject}
            className="flex items-center px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:opacity-90"
          >
            <Download size={14} className="mr-2" />
            Exporter MS Project
          </button>
          <button
            onClick={() => setShowImportCompare(true)}
            className="flex items-center px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:opacity-90"
          >
            <Upload size={14} className="mr-2" />
            Importer MS Project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {selectedTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-secondary">
            <div className="text-center">
              <Filter size={48} className="mx-auto mb-4 text-muted" />
              <p className="mb-4">Aucune tâche à afficher</p>
              <button
                onClick={() => setShowTaskSelector(true)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
              >
                Sélectionner des tâches
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <PlanningSidebar
              cards={cards}
              categories={categories}
              subcategories={selectedTasks}
              expandedChapters={expandedChapters}
              expandedCards={expandedCards}
              expandedCategories={expandedCategories}
              onToggleChapter={onToggleChapter}
              onToggleCard={onToggleCard}
              onToggleCategory={onToggleCategory}
              onCenterTask={handleCenterTask}
              onEditTask={onEditTask}
              selectedTaskIds={selectedTaskIds}
              scrollContainerRef={sidebarContainerRef}
              onScroll={handleSidebarScroll}
            />
            <PlanningGantt
              flatTaskList={flatTaskList}
              ganttDays={computedGanttDays}
              getTaskBarPosition={computedGetTaskBarPosition}
              zoom={zoom}
              scrollToTask={scrollToTask}
              scrollToToday={scrollToToday}
              containerRef={ganttContainerRef}
              onScroll={handleGanttScroll}
              isHovering={isHoveringGantt}
              onMouseEnter={() => setIsHoveringGantt(true)}
              onMouseLeave={() => setIsHoveringGantt(false)}
            />
          </div>
        )}
      </div>

      {showTaskSelector && (
        <PlanningTaskSelector
          tasks={tasks}
          selectedTaskIds={selectedTaskIds}
          onToggleTask={onToggleTask}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onClose={() => setShowTaskSelector(false)}
          onCenterTask={handleCenterTask}
          onEditTask={onEditTask}
        />
      )}

      <PlanningImportCompare
        isOpen={showImportCompare}
        onClose={() => setShowImportCompare(false)}
        projectData={{
          cards: cards || [],
          categories: categories || [],
          subcategories: tasks || [],
        }}
        orderedChapters={orderedChapters || []}
        boardTitle={currentBoard?.title || 'Projet'}
        importing={importing}
        onImport={async result => {
          if (onImportPlanning) {
            await onImportPlanning(result);
          }
        }}
      />
    </div>
  );
}
