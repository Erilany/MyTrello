import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bookmark } from 'lucide-react';

function SubCategoryModal({ subcategory, onClose }) {
  const { updateSubcategory, saveToLibrary } = useApp();

  const [title, setTitle] = useState(subcategory.title);
  const [description, setDescription] = useState(subcategory.description || '');
  const [priority, setPriority] = useState(subcategory.priority || 'normal');
  const [dueDate, setDueDate] = useState(subcategory.due_date || '');
  const [assignee, setAssignee] = useState(subcategory.assignee || '');

  // MS Project fields
  const [startDate, setStartDate] = useState(subcategory.start_date || '');
  const [durationDays, setDurationDays] = useState(subcategory.duration_days || 1);

  const handleSave = async () => {
    await updateSubcategory(subcategory.id, {
      title,
      description,
      priority,
      due_date: dueDate || null,
      assignee,
      start_date: startDate || null,
      duration_days: durationDays || 1,
    });
    onClose();
  };

  const handleSaveToLibrary = async () => {
    const content = {
      subcategory: { title, description, priority, due_date: dueDate, assignee },
    };

    await saveToLibrary('subcategory', title, JSON.stringify(content));
    alert('Sous-catégorie sauvegardée dans la bibliothèque');
  };

  const priorities = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'Haute' },
    { value: 'normal', label: 'Normale' },
    { value: 'low', label: 'Basse' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-card w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-std">
          <h3 className="text-lg font-display font-bold text-primary">
            Modifier la sous-catégorie
          </h3>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
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
              rows={2}
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
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Durée (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={e => setDurationDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent text-sm"
                />
              </div>
            </div>
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

export default SubCategoryModal;
