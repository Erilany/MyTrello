import { useState, useEffect, useCallback } from 'react';

export function usePlanning(currentBoard) {
  const [planningSelectedTasks, setPlanningSelectedTasks] = useState([]);
  const [expandedPlanningChapters, setExpandedPlanningChapters] = useState(new Set());
  const [expandedPlanningCards, setExpandedPlanningCards] = useState(new Set());
  const [expandedPlanningCategories, setExpandedPlanningCategories] = useState(new Set());
  const [planningSortOrder, setPlanningSortOrder] = useState('date');
  const [ganttZoom, setGanttZoom] = useState('week');
  const [ganttStartDate, setGanttStartDate] = useState(null);
  const [ganttStartDateInput, setGanttStartDateInput] = useState(0);

  const storageKey = currentBoard?.id ? `planning_${currentBoard.id}` : null;

  useEffect(() => {
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.selectedTasks) setPlanningSelectedTasks(data.selectedTasks);
        if (data.chapters) setExpandedPlanningChapters(new Set(data.chapters));
        if (data.cards) setExpandedPlanningCards(new Set(data.cards));
        if (data.categories) setExpandedPlanningCategories(new Set(data.categories));
        if (data.sortOrder) setPlanningSortOrder(data.sortOrder);
        if (data.ganttZoom) setGanttZoom(data.ganttZoom);
      }
    } catch (e) {
      console.error('Error loading planning state:', e);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedTasks: planningSelectedTasks,
          chapters: [...expandedPlanningChapters],
          cards: [...expandedPlanningCards],
          categories: [...expandedPlanningCategories],
          sortOrder: planningSortOrder,
          ganttZoom: ganttZoom,
        })
      );
    } catch (e) {
      console.error('Error saving planning state:', e);
    }
  }, [
    storageKey,
    planningSelectedTasks,
    expandedPlanningChapters,
    expandedPlanningCards,
    expandedPlanningCategories,
    planningSortOrder,
    ganttZoom,
  ]);

  const togglePlanningTask = useCallback(taskId => {
    setPlanningSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const selectAllTasks = useCallback(taskIds => {
    setPlanningSelectedTasks(taskIds);
  }, []);

  const deselectAllTasks = useCallback(() => {
    setPlanningSelectedTasks([]);
  }, []);

  const toggleChapter = useCallback(chapterKey => {
    setExpandedPlanningChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterKey)) next.delete(chapterKey);
      else next.add(chapterKey);
      return next;
    });
  }, []);

  const toggleCard = useCallback(cardKey => {
    setExpandedPlanningCards(prev => {
      const next = new Set(prev);
      if (next.has(cardKey)) next.delete(cardKey);
      else next.add(cardKey);
      return next;
    });
  }, []);

  const toggleCategory = useCallback(catKey => {
    setExpandedPlanningCategories(prev => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey);
      else next.add(catKey);
      return next;
    });
  }, []);

  const centerGanttOnTask = useCallback(task => {
    try {
      if (task.start_date || task.due_date) {
        const targetDate = task.start_date ? new Date(task.start_date) : new Date(task.due_date);
        const today = new Date();
        const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        setGanttStartDateInput(daysDiff);
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + daysDiff - 30);
        setGanttStartDate(baseDate.toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Error centering on task:', err);
    }
  }, []);

  return {
    planningSelectedTasks,
    setPlanningSelectedTasks,
    expandedPlanningChapters,
    expandedPlanningCards,
    expandedPlanningCategories,
    planningSortOrder,
    setPlanningSortOrder,
    ganttZoom,
    setGanttZoom,
    ganttStartDate,
    setGanttStartDate,
    ganttStartDateInput,
    setGanttStartDateInput,
    togglePlanningTask,
    selectAllTasks,
    deselectAllTasks,
    toggleChapter,
    toggleCard,
    toggleCategory,
    centerGanttOnTask,
  };
}

export default usePlanning;
