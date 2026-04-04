import { useCallback } from 'react';

export function useProjectTime() {
  const getWeekNumber = useCallback(date => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
      .toString()
      .padStart(2, '0')}`;
  }, []);

  const loadProjectTime = useCallback(() => {
    const stored = localStorage.getItem('c-projets_project_time');
    return stored ? JSON.parse(stored) : {};
  }, []);

  const saveProjectTime = useCallback(data => {
    localStorage.setItem('c-projets_project_time', JSON.stringify(data));
  }, []);

  const getWeekKey = useCallback(
    (date = new Date()) => {
      return getWeekNumber(date);
    },
    [getWeekNumber]
  );

  const getWeekNumberFromKey = useCallback(
    weekKey => {
      if (!weekKey || typeof weekKey !== 'string') return getWeekNumber(new Date());
      const parts = weekKey.split('-W');
      if (parts.length !== 2) return getWeekNumber(new Date());
      const year = parseInt(parts[0]);
      const week = parseInt(parts[1]);
      if (isNaN(year) || isNaN(week)) return getWeekNumber(new Date());
      return weekKey;
    },
    [getWeekNumber]
  );

  const addProjectTime = useCallback(
    (projectId, seconds) => {
      const week = getWeekKey();
      const data = loadProjectTime();
      if (!data[week]) data[week] = {};
      if (!data[week][projectId]) data[week][projectId] = 0;
      data[week][projectId] += seconds;
      saveProjectTime(data);
    },
    [getWeekKey, loadProjectTime, saveProjectTime]
  );

  const getProjectTime = useCallback(
    (projectId, week = null) => {
      const w = week ? week : getWeekKey();
      const data = loadProjectTime();
      return data[w]?.[String(projectId)] || 0;
    },
    [getWeekKey, loadProjectTime]
  );

  const getAllProjectTime = useCallback(
    (week = null) => {
      const w = week || getWeekKey();
      const data = loadProjectTime();
      return data[w] || {};
    },
    [getWeekKey, loadProjectTime]
  );

  return {
    getWeekNumber,
    loadProjectTime,
    saveProjectTime,
    getWeekKey,
    getWeekNumberFromKey,
    addProjectTime,
    getProjectTime,
    getAllProjectTime,
  };
}

export default useProjectTime;
