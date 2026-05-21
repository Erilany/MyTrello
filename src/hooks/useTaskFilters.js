import { useState } from 'react';

export function useTaskFilters() {
  const [showMyTasks, setShowMyTasks] = useState(true);
  const [showOtherTasks, setShowOtherTasks] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [selectedProjectForOthers, setSelectedProjectForOthers] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});

  const toggleProject = boardId => {
    setExpandedProjects(prev => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  return {
    showMyTasks,
    setShowMyTasks,
    showOtherTasks,
    setShowOtherTasks,
    showCompletedTasks,
    setShowCompletedTasks,
    selectedProjectForOthers,
    setSelectedProjectForOthers,
    expandedProjects,
    toggleProject,
  };
}
