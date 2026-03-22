import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export function usePlanning(currentBoard, tasks = []) {
  const [planningSelectedTasks, setPlanningSelectedTasks] = useState([]);
  const [expandedPlanningChapters, setExpandedPlanningChapters] = useState(new Set());
  const [expandedPlanningCards, setExpandedPlanningCards] = useState(new Set());
  const [expandedPlanningCategories, setExpandedPlanningCategories] = useState(new Set());
  const [planningSortOrder, setPlanningSortOrder] = useState('date');
  const [ganttZoom, setGanttZoom] = useState('week');
  const [ganttStartDate, setGanttStartDate] = useState(null);
  const [ganttStartDateInput, setGanttStartDateInput] = useState(0);

  const initializedRef = useRef(false);
  const tasksRef = useRef(tasks);

  const storageKey = currentBoard?.id ? `planning_${currentBoard.id}` : null;

  const expandAllForTasks = useCallback(taskList => {
    const allChapters = new Set();
    const allCards = new Set();
    const allCategories = new Set();

    taskList.forEach(task => {
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
    });

    setExpandedPlanningChapters(allChapters);
    setExpandedPlanningCards(allCards);
    setExpandedPlanningCategories(allCategories);
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (!storageKey || initializedRef.current) return;

    try {
      const saved = localStorage.getItem(storageKey);
      const currentTasks = tasksRef.current;

      if (saved) {
        const data = JSON.parse(saved);
        if (data.selectedTasks) setPlanningSelectedTasks(data.selectedTasks);
        if (data.chapters && data.chapters.length > 0) {
          setExpandedPlanningChapters(new Set(data.chapters));
        } else if (currentTasks.length > 0) {
          setTimeout(() => expandAllForTasks(currentTasks), 0);
        }
        if (data.cards && data.cards.length > 0) {
          setExpandedPlanningCards(new Set(data.cards));
        }
        if (data.categories && data.categories.length > 0) {
          setExpandedPlanningCategories(new Set(data.categories));
        }
        if (data.sortOrder) setPlanningSortOrder(data.sortOrder);
        if (data.ganttZoom) setGanttZoom(data.ganttZoom);
        if (data.ganttStartDate) setGanttStartDate(data.ganttStartDate);
      } else if (currentTasks.length > 0) {
        setTimeout(() => expandAllForTasks(currentTasks), 0);
      }
      initializedRef.current = true;
    } catch (e) {
      console.error('Error loading planning state:', e);
      if (tasksRef.current.length > 0) {
        setTimeout(() => expandAllForTasks(tasksRef.current), 0);
      }
      initializedRef.current = true;
    }
  }, [storageKey, expandAllForTasks]);

  const prevStateRef = useRef(null);

  useEffect(() => {
    if (!storageKey) return;

    const currentState = {
      selectedTasks: planningSelectedTasks,
      chapters: [...expandedPlanningChapters],
      cards: [...expandedPlanningCards],
      categories: [...expandedPlanningCategories],
      sortOrder: planningSortOrder,
      ganttZoom: ganttZoom,
      ganttStartDate: ganttStartDate,
    };

    const prevState = prevStateRef.current;
    const stateJson = JSON.stringify(currentState);

    if (!prevState || JSON.stringify(prevState) !== stateJson) {
      prevStateRef.current = currentState;
      try {
        localStorage.setItem(storageKey, stateJson);
      } catch (e) {
        console.error('Error saving planning state:', e);
      }
    }
  }, [
    storageKey,
    planningSelectedTasks,
    expandedPlanningChapters,
    expandedPlanningCards,
    expandedPlanningCategories,
    planningSortOrder,
    ganttZoom,
    ganttStartDate,
  ]);

  const togglePlanningTask = useCallback((taskId, task) => {
    const numericId = Number(taskId);

    setPlanningSelectedTasks(prev => {
      const alreadySelected = prev.some(id => Number(id) === numericId);

      if (!alreadySelected && task) {
        const chapter = task.card?.chapter || 'Sans chapitre';
        const cardId = task.card?.id;
        const categoryId = task.category?.id;

        setExpandedPlanningChapters(prevChap => {
          if (!prevChap.has(chapter)) {
            const next = new Set(prevChap);
            next.add(chapter);
            return next;
          }
          return prevChap;
        });

        if (cardId) {
          const cardKey = `${chapter}|${cardId}`;
          setExpandedPlanningCards(prevCard => {
            if (!prevCard.has(cardKey)) {
              const next = new Set(prevCard);
              next.add(cardKey);
              return next;
            }
            return prevCard;
          });
        }

        if (categoryId && cardId) {
          const catKey = `${chapter}|${cardId}|${categoryId}`;
          setExpandedPlanningCategories(prevCat => {
            if (!prevCat.has(catKey)) {
              const next = new Set(prevCat);
              next.add(catKey);
              return next;
            }
            return prevCat;
          });
        }
      }

      if (alreadySelected) {
        return prev.filter(id => Number(id) !== numericId);
      } else {
        return [...prev, numericId];
      }
    });
  }, []);

  const selectAllTasks = useCallback(taskIds => {
    setPlanningSelectedTasks(taskIds.map(id => Number(id)));
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
      } else {
        setGanttStartDateInput(0);
        setGanttStartDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Error centering on task:', err);
    }
  }, []);

  const returnValue = useMemo(
    () => ({
      planningSelectedTasks,
      setPlanningSelectedTasks,
      expandedPlanningChapters,
      setExpandedPlanningChapters,
      expandedPlanningCards,
      setExpandedPlanningCards,
      expandedPlanningCategories,
      setExpandedPlanningCategories,
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
    }),
    [
      planningSelectedTasks,
      expandedPlanningChapters,
      expandedPlanningCards,
      expandedPlanningCategories,
      planningSortOrder,
      ganttZoom,
      ganttStartDate,
      ganttStartDateInput,
      togglePlanningTask,
      selectAllTasks,
      deselectAllTasks,
      toggleChapter,
      toggleCard,
      toggleCategory,
      centerGanttOnTask,
    ]
  );

  return returnValue;
}

export default usePlanning;
