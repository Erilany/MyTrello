import { useState, useCallback } from 'react';

export function useHiddenMilestones() {
  const [hiddenMilestones, setHiddenMilestones] = useState(() => {
    const saved = localStorage.getItem('c-projets_hidden_milestones');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const addHiddenMilestone = useCallback(milestoneId => {
    setHiddenMilestones(prev => {
      const newSet = new Set(prev);
      newSet.add(Number(milestoneId));
      localStorage.setItem('c-projets_hidden_milestones', JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  const removeHiddenMilestone = useCallback(milestoneId => {
    setHiddenMilestones(prev => {
      const newSet = new Set(prev);
      newSet.delete(Number(milestoneId));
      localStorage.setItem('c-projets_hidden_milestones', JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  const clearHiddenMilestones = useCallback(() => {
    setHiddenMilestones(new Set());
    localStorage.removeItem('c-projets_hidden_milestones');
  }, []);

  const isHiddenMilestone = useCallback(
    milestoneId => {
      return hiddenMilestones.has(Number(milestoneId));
    },
    [hiddenMilestones]
  );

  return {
    hiddenMilestones,
    addHiddenMilestone,
    removeHiddenMilestone,
    clearHiddenMilestones,
    isHiddenMilestone,
  };
}

export default useHiddenMilestones;
