import { useState } from 'react';
import { addWorkingDays, subtractWorkingDays } from '../components/SubCategory/workingDaysUtils';

export function useCardForm(card, updateCard, saveToLibrary, categories, subcategories) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.due_date || '');
  const [startDate, setStartDate] = useState(card.start_date || '');
  const [durationDays, setDurationDays] = useState(card.duration_days || 1);
  const [parentId, setParentId] = useState(card.parent_id || null);
  const [predecessorId, setPredecessorId] = useState(card.predecessor_id || null);

  const handleDurationChange = newDuration => {
    const duration = parseInt(newDuration) || 1;
    setDurationDays(duration);
    if (startDate && !dueDate) {
      setDueDate(addWorkingDays(startDate, duration));
    } else if (dueDate && !startDate) {
      setStartDate(subtractWorkingDays(dueDate, duration));
    }
  };

  const handleStartDateChange = newStartDate => {
    setStartDate(newStartDate);
    if (newStartDate && durationDays > 0 && !dueDate) {
      setDueDate(addWorkingDays(newStartDate, durationDays));
    }
  };

  const handleDueDateChange = newDueDate => {
    setDueDate(newDueDate);
    if (newDueDate && durationDays > 0 && !startDate) {
      setStartDate(subtractWorkingDays(newDueDate, durationDays));
    }
  };

  const handleSave = async onClose => {
    await updateCard(card.id, {
      title,
      description,
      due_date: dueDate || null,
      start_date: startDate || null,
      duration_days: durationDays || 1,
      parent_id: parentId || null,
      predecessor_id: predecessorId || null,
    });
    onClose();
  };

  const handleSaveToLibrary = async () => {
    const cats = categories.filter(c => Number(c.card_id) === Number(card.id));
    const content = {
      card: { title, description, due_date: dueDate, start_date: startDate, duration_days: durationDays },
      categories: cats.map(cat => ({
        ...cat,
        subcategories: subcategories.filter(sc => Number(sc.category_id) === Number(cat.id)),
      })),
    };
    await saveToLibrary('card', title, JSON.stringify(content));
    alert('Carte sauvegardée dans la bibliothèque');
  };

  return {
    title, setTitle,
    description, setDescription,
    dueDate, setDueDate,
    startDate, setStartDate,
    durationDays, setDurationDays,
    parentId, setParentId,
    predecessorId, setPredecessorId,
    handleDurationChange,
    handleStartDateChange,
    handleDueDateChange,
    handleSave,
    handleSaveToLibrary,
  };
}
