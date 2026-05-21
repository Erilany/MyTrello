import { useState, useEffect } from 'react';
import { sanitizeHtml } from '../utils/sanitize';
import { addWorkingDays, subtractWorkingDays } from '../components/SubCategory/workingDaysUtils';

export function useSubcategoryForm(subcategory, updateSubcategory, saveToLibrary) {
  const [title, setTitle] = useState(subcategory.title);
  const [description, setDescription] = useState(subcategory.description || '');
  const [progress, setProgress] = useState(subcategory.progress || 0);
  const [priority, setPriority] = useState(subcategory.priority || 'normal');
  const [status, setStatus] = useState(subcategory.status || 'todo');
  const [dueDate, setDueDate] = useState(subcategory.due_date || '');
  const [assignee, setAssignee] = useState(subcategory.assignee || '');
  const [startDate, setStartDate] = useState(subcategory.start_date || '');
  const [durationDays, setDurationDays] = useState(subcategory.duration_days || 0);
  const [anchorOnStart, setAnchorOnStart] = useState(!!subcategory.start_date);
  const [anchorOnEnd, setAnchorOnEnd] = useState(
    !!subcategory.due_date && !subcategory.start_date
  );

  useEffect(() => {
    if (status === 'waiting') return;
    if (progress === 100) {
      setStatus('done');
      return;
    }
    if (progress > 0 && status === 'todo') {
      setStatus('in_progress');
    }
  }, [progress, status]);

  useEffect(() => {
    if (status === 'done' && progress !== 100) {
      setProgress(100);
    }
  }, [status, progress]);

  const handleDurationChange = newDuration => {
    const duration = parseInt(newDuration) || 0;
    setDurationDays(duration);
    if (anchorOnStart && startDate && duration >= 0) {
      setDueDate(addWorkingDays(startDate, duration));
    } else if (anchorOnEnd && dueDate && duration >= 0) {
      setStartDate(subtractWorkingDays(dueDate, duration));
    }
  };

  const handleStartDateChange = newStartDate => {
    setStartDate(newStartDate);
    if (anchorOnStart && newStartDate && durationDays >= 0) {
      setDueDate(addWorkingDays(newStartDate, durationDays));
    }
  };

  const handleDueDateChange = newDueDate => {
    setDueDate(newDueDate);
    if (anchorOnEnd && newDueDate && durationDays >= 0) {
      setStartDate(subtractWorkingDays(newDueDate, durationDays));
    }
  };

  const handleAnchorOnStartChange = checked => {
    setAnchorOnStart(checked);
    if (checked) setAnchorOnEnd(false);
  };

  const handleAnchorOnEndChange = checked => {
    setAnchorOnEnd(checked);
    if (checked) setAnchorOnStart(false);
  };

  const handleSave = async (milestones, onClose) => {
    await updateSubcategory(subcategory.id, {
      title,
      description: sanitizeHtml(description),
      progress,
      priority,
      status,
      due_date: dueDate || null,
      assignee,
      start_date: startDate || null,
      duration_days: durationDays || 0,
      milestones,
    });
    onClose();
  };

  const handleSaveToLibrary = async () => {
    const content = {
      subcategory: {
        title,
        description,
        priority,
        due_date: dueDate,
        assignee,
        status,
        start_date: startDate,
        duration_days: durationDays,
      },
    };
    await saveToLibrary('subcategory', title, JSON.stringify(content));
    alert('Sous-catégorie sauvegardée dans la bibliothèque');
  };

  return {
    title, setTitle,
    description, setDescription,
    progress, setProgress,
    priority, setPriority,
    status, setStatus,
    dueDate, setDueDate,
    assignee, setAssignee,
    startDate, setStartDate,
    durationDays, setDurationDays,
    anchorOnStart, setAnchorOnStart,
    anchorOnEnd, setAnchorOnEnd,
    handleDurationChange,
    handleStartDateChange,
    handleDueDateChange,
    handleAnchorOnStartChange,
    handleAnchorOnEndChange,
    handleSave,
    handleSaveToLibrary,
  };
}
