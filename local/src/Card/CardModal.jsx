import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, Plus, Folder } from 'lucide-react';

function CardModal({ card, onClose }) {
  const {
    updateCard,
    categories,
    subcategories,
    saveToLibrary,
    createCategory,
    cards,
    libraryItems,
  } = useApp();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.due_date || '');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  // MS Project fields
  const [startDate, setStartDate] = useState(card.start_date || '');
  const [durationDays, setDurationDays] = useState(card.duration_days || 1);
  const [parentId, setParentId] = useState(card.parent_id || null);
  const [predecessorId, setPredecessorId] = useState(card.predecessor_id || null);

  // Temps repère from library (read-only)
  const libraryCard = libraryItems?.find(item => item.type === 'card' && item.title === card.title);
  const tempsRepere = libraryCard
    ? JSON.parse(libraryCard.content_json)?.card?.duration_days || libraryCard.duration || null
    : null;

  // Helper to add working days (excluding weekends)
  const addWorkingDays = (startDateStr, days) => {
    if (!startDateStr || days <= 0) return '';
    const date = new Date(startDateStr);
    let daysAdded = 0;
    while (daysAdded < days) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
    return date.toISOString().split('T')[0];
  };

  // Helper to subtract working days
  const subtractWorkingDays = (endDateStr, days) => {
    if (!endDateStr || days <= 0) return '';
    const date = new Date(endDateStr);
    let daysSubtracted = 0;
    while (daysSubtracted < days) {
      date.setDate(date.getDate() - 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysSubtracted++;
      }
    }
    return date.toISOString().split('T')[0];
  };

  const handleDurationChange = newDuration => {
    const duration = parseInt(newDuration) || 1;
    setDurationDays(duration);

    if (startDate && !dueDate) {
      // Calculate due date from start date + duration
      const calculatedDueDate = addWorkingDays(startDate, duration);
      setDueDate(calculatedDueDate);
    } else if (dueDate && !startDate) {
      // Calculate start date from due date - duration
      const calculatedStartDate = subtractWorkingDays(dueDate, duration);
      setStartDate(calculatedStartDate);
    }
  };

  const handleStartDateChange = newStartDate => {
    setStartDate(newStartDate);
    if (newStartDate && durationDays > 0 && !dueDate) {
      // Calculate due date from start date + duration
      const calculatedDueDate = addWorkingDays(newStartDate, durationDays);
      setDueDate(calculatedDueDate);
    }
  };

  const handleDueDateChange = newDueDate => {
    setDueDate(newDueDate);
    if (newDueDate && durationDays > 0 && !startDate) {
      // Calculate start date from due date - duration
      const calculatedStartDate = subtractWorkingDays(newDueDate, durationDays);
      setStartDate(calculatedStartDate);
    }
  };

  const handleSave = async () => {
    console.log('[CardModal] Saving card:', card.id, {
      due_date: dueDate,
      start_date: startDate,
      duration_days: durationDays,
    });
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
    const cardCategories = categories.filter(c => Number(c.card_id) === Number(card.id));
    const content = {
      card: {
        title,
        description,
        due_date: dueDate,
        start_date: startDate,
        duration_days: durationDays,
      },
      categories: cardCategories.map(cat => ({
        ...cat,
        subcategories: subcategories.filter(sc => Number(sc.category_id) === Number(cat.id)),
      })),
    };

    await saveToLibrary('card', title, JSON.stringify(content));
    alert('Carte sauvegardée dans la bibliothèque');
  };

  const handleAddCategory = async e => {
    e.preventDefault();
    if (newCategoryTitle.trim()) {
      await createCategory(Number(card.id), newCategoryTitle.trim());
      setNewCategoryTitle('');
    }
  };

  const cardCategories = categories.filter(c => Number(c.card_id) === Number(card.id));

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ width: 'calc(100vw * 0.35)', minWidth: '400px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-std">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-display font-bold flex-1 mr-4 border-none focus:outline-none bg-transparent text-primary"
          />
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent"
              placeholder="Ajouter une description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                <Calendar size={14} className="inline mr-1" />
                Date d'échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => handleDueDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-card-hover border border-std rounded-lg text-secondary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-std">
            <h4 className="text-sm font-medium text-secondary mb-3 flex items-center">
              <Calendar size={14} className="inline mr-1" />
              Planning MS Project
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-card-hover border border-std rounded-lg text-secondary focus:outline-none focus:border-accent text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Durée (j)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={e => handleDurationChange(e.target.value)}
                    className="w-full px-2 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent text-sm"
                  />
                </div>
                {tempsRepere && (
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">
                      Temps repère
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tempsRepere}
                      disabled
                      className="w-full px-2 py-2 bg-card-hover border border-std rounded-lg text-secondary text-sm disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Tâche parente (indentation)
                </label>
                <select
                  value={parentId || ''}
                  onChange={e => setParentId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent text-sm"
                >
                  <option value="">Aucune (tâche principale)</option>
                  {cards
                    .filter(c => c.id !== card.id && !c.parent_id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title.substring(0, 30)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Prédécesseur (dépendance)
                </label>
                <select
                  value={predecessorId || ''}
                  onChange={e => setPredecessorId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent text-sm"
                >
                  <option value="">Aucune</option>
                  {cards
                    .filter(c => c.id !== card.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title.substring(0, 30)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-std">
            <h4 className="text-sm font-medium text-secondary mb-2">
              <Folder size={14} className="inline mr-1" />
              Catégories ({cardCategories.length})
            </h4>

            <div className="space-y-2 mb-3">
              {cardCategories.map(cat => (
                <div
                  key={cat.id}
                  className="bg-card-hover rounded p-2 flex items-center justify-between"
                >
                  <span className="text-sm text-primary">{cat.title}</span>
                  {cat.priority !== 'normal' && (
                    <span
                      className={`badge ${
                        cat.priority === 'urgent'
                          ? 'badge-urgent'
                          : cat.priority === 'high'
                            ? 'badge-waiting'
                            : 'badge-normal'
                      }`}
                    >
                      {cat.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryTitle}
                onChange={e => setNewCategoryTitle(e.target.value)}
                placeholder="Nouvelle catégorie..."
                className="flex-1 px-3 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-done text-white rounded-lg hover:opacity-90 text-sm flex items-center transition-std"
              >
                <Plus size={14} className="mr-1" />
                Ajouter
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-std">
            <button onClick={handleSaveToLibrary} className="text-sm text-accent hover:opacity-80">
              + Sauvegarder comme modèle
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-std bg-card">
          <button
            onClick={onClose}
            className="px-4 py-2 text-secondary hover:text-primary hover:bg-card-hover rounded-lg transition-std"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-std"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
