import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export const TimerContext = createContext(null);

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(1 + Math.floor((d - yearStart) / 86400000 / 7)).padStart(2, '0')}`;
}

const loadProjectTime = () => {
  const stored = localStorage.getItem('c-projets_project_time');
  return stored ? JSON.parse(stored) : {};
};

const saveProjectTime = data => {
  localStorage.setItem('c-projets_project_time', JSON.stringify(data));
};

const getWeekKey = (date = new Date()) => {
  return getWeekNumber(date);
};

const getWeekNumberFromKey = weekKey => {
  if (!weekKey || typeof weekKey !== 'string') return getWeekNumber(new Date());
  const parts = weekKey.split('-W');
  if (parts.length !== 2) return getWeekNumber(new Date());
  const year = parseInt(parts[0]);
  const week = parseInt(parts[1]);
  if (isNaN(year) || isNaN(week)) return getWeekNumber(new Date());
  return weekKey;
};

export function useTimer() {
  const [projectTimer, setProjectTimer] = useState({
    activeProjectId: null,
    startTime: null,
    intervals: {},
  });

  const addProjectTime = useCallback((projectId, seconds) => {
    const week = getWeekKey();
    const data = loadProjectTime();
    if (!data[week]) data[week] = {};
    if (!data[week][projectId]) data[week][projectId] = 0;
    data[week][projectId] += seconds;
    saveProjectTime(data);
  }, []);

  const getProjectTime = useCallback((projectId, week = null) => {
    const w = week ? week : getWeekKey();
    const data = loadProjectTime();
    return data[w]?.[String(projectId)] || 0;
  }, []);

  const getAllProjectTime = useCallback((week = null) => {
    const w = week || getWeekKey();
    const data = loadProjectTime();
    return data[w] || {};
  }, []);

  const getWeekKeyFn = useCallback((date = new Date()) => getWeekKey(date), []);
  const getWeekNumberFromKeyFn = useCallback(weekKey => getWeekNumberFromKey(weekKey), []);

  useEffect(() => {
    let interval = null;

    if (projectTimer.activeProjectId && projectTimer.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - projectTimer.startTime) / 1000);
        if (elapsed >= 1) {
          addProjectTime(projectTimer.activeProjectId, elapsed);
          setProjectTimer(prev => ({ ...prev, startTime: now }));
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectTimer.activeProjectId, projectTimer.startTime, addProjectTime]);

  const stopTimer = useCallback(() => {
    setProjectTimer(prev => {
      if (prev.activeProjectId && prev.startTime) {
        const now = new Date();
        const elapsed = Math.floor((now - prev.startTime) / 1000);
        if (elapsed > 0) {
          addProjectTime(prev.activeProjectId, elapsed);
        }
      }
      return {
        activeProjectId: null,
        startTime: null,
        intervals: {},
      };
    });
  }, [addProjectTime]);

  return {
    projectTimer,
    setProjectTimer,
    addProjectTime,
    getProjectTime,
    getAllProjectTime,
    getWeekKey: getWeekKeyFn,
    getWeekNumberFromKey: getWeekNumberFromKeyFn,
    stopTimer,
  };
}

export function TimerProvider({ children, currentBoard }) {
  const timer = useTimer();

  useEffect(() => {
    if (currentBoard) {
      const now = new Date();
      timer.setProjectTimer(prev => {
        if (
          prev.activeProjectId &&
          prev.startTime &&
          prev.activeProjectId !== String(currentBoard.id)
        ) {
          const elapsed = Math.floor((now - prev.startTime) / 1000);
          if (elapsed > 0) {
            timer.addProjectTime(prev.activeProjectId, elapsed);
          }
        }
        return {
          activeProjectId: String(currentBoard.id),
          startTime: now,
          intervals: {},
        };
      });
    }
  }, [currentBoard?.id]);

  return (
    <TimerContext.Provider
      value={{ projectTimer: timer.projectTimer, setProjectTimer: timer.setProjectTimer, ...timer }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useProjectTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useProjectTimer must be used within a TimerProvider');
  }
  return context;
}

export default useTimer;
