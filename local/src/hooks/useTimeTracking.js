import { useCallback } from 'react';
import { getWeekNumberISO } from '../shared/utils';

const STORAGE_KEY = 'c-projets_project_time';

export function loadProjectTime() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

export function saveProjectTime(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useTimeTracking() {
  const getWeekKey = useCallback((date = new Date()) => {
    return getWeekNumberISO(date);
  }, []);

  const addProjectTime = useCallback((projectId, seconds) => {
    const week = getWeekKey();
    const data = loadProjectTime();
    if (!data[week]) data[week] = {};
    if (!data[week][projectId]) data[week][projectId] = 0;
    data[week][projectId] += seconds;
    saveProjectTime(data);
  }, [getWeekKey]);

  const getProjectTime = useCallback((projectId, week = null) => {
    const w = week ? week : getWeekKey();
    const data = loadProjectTime();
    return data[w]?.[String(projectId)] || 0;
  }, [getWeekKey]);

  const getAllProjectTime = useCallback((week = null) => {
    const w = week || getWeekKey();
    const data = loadProjectTime();
    return data[w] || {};
  }, [getWeekKey]);

  return {
    loadProjectTime,
    saveProjectTime,
    getWeekKey,
    addProjectTime,
    getProjectTime,
    getAllProjectTime,
  };
}
