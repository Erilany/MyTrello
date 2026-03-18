import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bookmark } from 'lucide-react';

function CategoryModal({ category, onClose }) {
  const {
    updateCategory,
    createSubcategory,
    saveToLibrary,
    subcategories,
    categories,
    libraryItems,
  } = useApp();

  const [title, setTitle] = useState(category.title);
  const [description, setDescription] = useState(category.description || '');
  const [priority, setPriority] = useState(category.priority || 'normal');
  const [dueDate, setDueDate] = useState(category.due_date || '');
  const [assignee, setAssignee] = useState(category.assignee || '');
  const [color, setColor] = useState(category.color || '#6366f1');
  const [newSubcategoryTitle, setNewSubcategoryTitle] = useState('');

  // MS Project fields
  const [startDate, setStartDate] = useState(category.start_date || '');
  const [durationDays, setDurationDays] = useState(category.duration_days || 1);
  const [parentId, setParentId] = useState(category.parent_id || null);

  // Temps repère from library (read-only)
  const parentCard = cards?.find(c => c.id === category.card_id);
  let tempsRepere = null;
  if (parentCard && libraryItems) {
    const libraryCard = libraryItems.find(
      item => item.type === 'card' && item.title === parentCard.title
    );
    if (libraryCard) {
      const content = JSON.parse(libraryCard.content_json);
      const cat = content.categories?.find(c => c.title === category.title);
      tempsRepere = cat?.duration_days || null;
    }
  }

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
      const calculatedDueDate = addWorkingDays(startDate, duration);
      setDueDate(calculatedDueDate);
    } else if (dueDate && !startDate) {
      const calculatedStartDate = subtractWorkingDays(dueDate, duration);
      setStartDate(calculatedStartDate);
    }
  };

  const handleStartDateChange = newStartDate => {
    setStartDate(newStartDate);
    if (newStartDate && durationDays > 0 && !dueDate) {
      const calculatedDueDate = addWorkingDays(newStartDate, durationDays);
      setDueDate(calculatedDueDate);
    }
  };

  const handleDueDateChange = newDueDate => {
    setDueDate(newDueDate);
    if (newDueDate && durationDays > 0 && !startDate) {
      const calculatedStartDate = subtractWorkingDays(newDueDate, durationDays);
      setStartDate(calculatedStartDate);
    }
  };

  const handleSave = async () => {
    await updateCategory(category.id, {
      title,
      description,
      priority,
      due_date: dueDate || null,
      assignee,
      color,
      start_date: startDate || null,
      duration_days: durationDays || 1,
      parent_id: parentId || null,
    });
    onClose();
  };

  const handleSaveToLibrary = async () => {
    const categorySubcategories = subcategories.filter(
      sc => Number(sc.category_id) === Number(category.id)
    );
    const content = {
      category: {
        title,
        description,
        priority,
        due_date: dueDate,
        assignee,
        color,
        start_date: startDate,
        duration_days: durationDays,
      },
      subcategories: categorySubcategories,
    };

    await saveToLibrary('category', title, JSON.stringify(content));
    alert('Catégorie sauvegardée dans la bibliothèque');
  };

  const handleAddSubcategory = async e => {
    e.preventDefault();
    if (newSubcategoryTitle.trim()) {
      await createSubcategory(category.id, newSubcategoryTitle.trim());
      setNewSubcategoryTitle('');
    }
  };

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: '#EF4444' },
    { value: 'high', label: 'Haute', color: '#F97316' },
    { value: 'normal', label: 'Normale', color: '#22C55E' },
    { value: 'low', label: 'Basse', color: '#6B7280' },
  ];

  const colors = [
    '#6366f1',
    '#f59e0b',
    '#22c55e',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
  ];

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999]"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-card w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-std">
          <h3 className="text-lg font-display font-bold text-primary">Modifier la catégorie</h3>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Priorité</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => handleDueDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-card-hover border border-std rounded-lg text-secondary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Assigné à</label>
            <input
              type="text"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="pt-4 border-t border-std">
            <h4 className="text-sm font-medium text-secondary mb-3">Planning MS Project</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent text-sm"
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

            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Catégorie parente (indentation)
              </label>
              <select
                value={parentId || ''}
                onChange={e => setParentId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent text-sm"
              >
                <option value="">Aucune (niveau principal)</option>
                {categories
                  .filter(c => c.id !== category.id && !c.parent_id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title.substring(0, 40)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Couleur</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-accent' : 'border-std'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-std">
            <label className="block text-sm font-medium text-secondary mb-2">
              Ajouter une sous-catégorie
            </label>
            <form onSubmit={handleAddSubcategory} className="flex gap-2">
              <input
                type="text"
                value={newSubcategoryTitle}
                onChange={e => setNewSubcategoryTitle(e.target.value)}
                placeholder="Titre de la sous-catégorie..."
                className="flex-1 px-3 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm transition-std"
              >
                Ajouter
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-between p-4 border-t border-std bg-card">
          <button
            onClick={handleSaveToLibrary}
            className="flex items-center px-4 py-2 text-accent hover:bg-card-hover rounded-lg transition-std"
          >
            <Bookmark size={16} className="mr-2" />
            Sauvegarder
          </button>
          <div className="flex gap-2">
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
    </div>
  );
}

export default CategoryModal;
