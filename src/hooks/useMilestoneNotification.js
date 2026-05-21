import { useState } from 'react';

export function useMilestoneNotification(toggleMilestone, addHiddenMilestone) {
  const [recentlyCompletedMilestones, setRecentlyCompletedMilestones] = useState([]);
  const [milestoneNotification, setMilestoneNotification] = useState(null);

  const handleMilestoneToggle = (e, milestone) => {
    e.stopPropagation();
    toggleMilestone(milestone.subcategoryId, milestone.id);
    setRecentlyCompletedMilestones(prev => [...prev, milestone.id]);
    setTimeout(() => {
      setRecentlyCompletedMilestones(prev => prev.filter(id => id !== milestone.id));
      addHiddenMilestone(milestone.id);
      setMilestoneNotification('Jalon terminé !');
      setTimeout(() => setMilestoneNotification(null), 2000);
    }, 1000);
  };

  return { milestoneNotification, recentlyCompletedMilestones, handleMilestoneToggle };
}
