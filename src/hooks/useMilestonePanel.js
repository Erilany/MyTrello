import { useState, useEffect } from 'react';
import { sortMilestones } from '../components/SubCategory/subCategoryUtils';

export function useMilestonePanel(subcategoryId, initialMilestones, addHiddenMilestone) {
  const [milestones, setMilestones] = useState(sortMilestones(initialMilestones || []));
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    const handleMilestoneUpdated = () => {
      const data = localStorage.getItem('c-projets_db');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const updatedSub = parsed.subcategories?.find(s => Number(s.id) === Number(subcategoryId));
          if (updatedSub) {
            setMilestones(sortMilestones(updatedSub.milestones || []));
          }
        } catch (e) {
          console.error('Error parsing milestones:', e);
        }
      }
    };
    window.addEventListener('milestone-updated', handleMilestoneUpdated);
    return () => window.removeEventListener('milestone-updated', handleMilestoneUpdated);
  }, [subcategoryId]);

  useEffect(() => {
    setMilestones(sortMilestones(initialMilestones || []));
  }, [subcategoryId]);

  const addMilestone = () => {
    setIsAddingMilestone(true);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  const saveNewMilestone = () => {
    if (newMilestoneTitle.trim()) {
      const maxPosition = milestones
        .filter(m => !m.date)
        .reduce((max, m) => Math.max(max, m.position || 0), 0);
      const newMilestoneObj = {
        id: Date.now(),
        title: newMilestoneTitle.trim(),
        done: false,
        date: newMilestoneDate || null,
        position: maxPosition + 1,
      };
      setMilestones(sortMilestones([...milestones, newMilestoneObj]));
    }
    setIsAddingMilestone(false);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  const cancelAddMilestone = () => {
    setIsAddingMilestone(false);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  const handleNewMilestoneKeyDown = e => {
    if (e.key === 'Enter') saveNewMilestone();
    else if (e.key === 'Escape') cancelAddMilestone();
  };

  const toggleMilestone = id => {
    const milestone = milestones.find(m => m.id === id);
    const isBeingChecked = milestone && !milestone.done;
    if (isBeingChecked) addHiddenMilestone(id);
    const newMilestones = milestones
      .map(m => (m.id === id ? { ...m, done: !m.done } : m))
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return 0;
      });
    setMilestones(newMilestones);
  };

  const deleteMilestone = id => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestoneTitle = (id, newTitle) => {
    if (!newTitle.trim()) return;
    setMilestones(milestones.map(m => (m.id === id ? { ...m, title: newTitle.trim() } : m)));
  };

  const updateMilestoneDate = (id, newDate) => {
    setMilestones(sortMilestones(milestones.map(m => (m.id === id ? { ...m, date: newDate || null } : m))));
  };

  const handleMilestoneDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMilestoneDragOver = (e, _id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMilestoneDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const withoutDate = milestones.filter(m => !m.date);
    const withDate = milestones.filter(m => m.date);
    const draggedIdxInWithout = withoutDate.findIndex(m => m.id === draggedId);
    const targetIdxInWithout = withoutDate.findIndex(m => m.id === targetId);
    if (draggedIdxInWithout === -1 || targetIdxInWithout === -1) return;
    const reordered = [...withoutDate];
    const [removed] = reordered.splice(draggedIdxInWithout, 1);
    reordered.splice(targetIdxInWithout, 0, removed);
    const withUpdatedPositions = reordered.map((m, idx) => ({ ...m, position: idx + 1 }));
    setMilestones(sortMilestones([...withUpdatedPositions, ...withDate]));
    setDraggedId(null);
  };

  const handleMilestoneDragEnd = () => {
    setDraggedId(null);
  };

  return {
    milestones,
    setMilestones,
    isAddingMilestone,
    newMilestoneTitle,
    setNewMilestoneTitle,
    newMilestoneDate,
    setNewMilestoneDate,
    draggedId,
    addMilestone,
    saveNewMilestone,
    cancelAddMilestone,
    handleNewMilestoneKeyDown,
    toggleMilestone,
    deleteMilestone,
    updateMilestoneTitle,
    updateMilestoneDate,
    handleMilestoneDragStart,
    handleMilestoneDragOver,
    handleMilestoneDrop,
    handleMilestoneDragEnd,
  };
}
