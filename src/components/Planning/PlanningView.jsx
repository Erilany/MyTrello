import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Filter, Download } from 'lucide-react';
import PlanningSidebar from './PlanningSidebar';
import PlanningGantt from './PlanningGantt';
import PlanningTaskSelector from './PlanningTaskSelector';
import { generateMSProjectXML } from '../../utils/xmlUtils';
import { getGanttDateRange, getGanttDays, getTaskBarPosition } from '../../utils/ganttUtils';

export default function PlanningView({
  currentBoard,
  tasks,
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
  onCenterTask,
  onEditTask,
  sortOrder,
  setSortOrder,
  zoom,
  setZoom,
  setStartDate,
  startDateInput,
  setStartDateInput,
  ganttStartDate,
}) {
  const [scrollToTask, setScrollToTask] = useState(null);

  const handleCenterTask = task => {
    setScrollToTask(null);
    onCenterTask(task);
    setTimeout(() => setScrollToTask(task), 100);
  };

  const getSelectedTasks = () => {
    let result =
      selectedTaskIds.length === 0 ? tasks : tasks.filter(t => selectedTaskIds.includes(t.id));

    if (sortOrder === 'date') {
      result = [...result].sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date) : new Date('2099-01-01');
        const dateB = b.start_date ? new Date(b.start_date) : new Date('2099-01-01');
        return dateA - dateB;
      });
    }

    return result;
  };

  const handleExportMSProject = () => {
    const selectedTasks = getSelectedTasks();
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
  };

  const handleGoToToday = () => {
    const range = computedGanttDateRange;
    const today = new Date();
    const diffDays = Math.ceil((today - range.start) / (1000 * 60 * 60 * 24));
    setStartDateInput(diffDays);
  };

  const handleSliderChange = e => {
    const days = parseInt(e.target.value);
    setStartDateInput(days);
    const range = computedGanttDateRange;
    const baseDate = new Date();
    baseDate.setDate(
      baseDate.getDate() + days - Math.ceil((baseDate - range.start) / (1000 * 60 * 60 * 24))
    );
    setStartDate(baseDate.toISOString().split('T')[0]);
  };

  const selectedTasks = getSelectedTasks();

  const computedGanttDateRange = useMemo(() => {
    return getGanttDateRange(selectedTasks, ganttStartDate);
  }, [selectedTasks, ganttStartDate]);

  const computedGanttDays = useMemo(() => {
    return getGanttDays(selectedTasks, ganttStartDate);
  }, [selectedTasks, ganttStartDate]);

  const computedGetTaskBarPosition = useMemo(() => {
    return task => getTaskBarPosition(task, selectedTasks, ganttStartDate);
  }, [selectedTasks, ganttStartDate]);

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
          <input
            type="range"
            min="-90"
            max="365"
            value={startDateInput}
            onChange={handleSliderChange}
            className="w-32 h-2 bg-std rounded-lg appearance-none cursor-pointer"
            title={`Déplacer: ${startDateInput > 0 ? '+' : ''}${startDateInput} jours`}
          />
          <button
            onClick={handleExportMSProject}
            className="flex items-center px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:opacity-90"
          >
            <Download size={14} className="mr-2" />
            Exporter MS Project
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
              tasks={selectedTasks}
              expandedChapters={expandedChapters}
              expandedCards={expandedCards}
              expandedCategories={expandedCategories}
              onToggleChapter={onToggleChapter}
              onToggleCard={onToggleCard}
              onToggleCategory={onToggleCategory}
              onCenterTask={handleCenterTask}
              onEditTask={onEditTask}
            />
            <PlanningGantt
              tasks={selectedTasks}
              ganttDays={computedGanttDays}
              getTaskBarPosition={computedGetTaskBarPosition}
              expandedChapters={expandedChapters}
              expandedCards={expandedCards}
              expandedCategories={expandedCategories}
              zoom={zoom}
              scrollToTask={scrollToTask}
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
    </div>
  );
}
