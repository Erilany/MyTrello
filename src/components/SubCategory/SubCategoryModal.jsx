import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bookmark, Trash2 } from 'lucide-react';

function SubCategoryModal({ subcategory, onClose }) {
  const { updateSubcategory, saveToLibrary } = useApp();

  const [title, setTitle] = useState(subcategory.title);
  const [description, setDescription] = useState(subcategory.description || '');
  const [priority, setPriority] = useState(subcategory.priority || 'normal');
  const [status, setStatus] = useState(subcategory.status || 'todo');
  const [dueDate, setDueDate] = useState(subcategory.due_date || '');
  const [assignee, setAssignee] = useState(subcategory.assignee || '');

  // MS Project fields
  const [startDate, setStartDate] = useState(subcategory.start_date || '');
  const [durationDays, setDurationDays] = useState(subcategory.duration_days || 1);

  // Milestones
  const [milestones, setMilestones] = useState(subcategory.milestones || []);

  const handleSave = async () => {
    await updateSubcategory(subcategory.id, {
      title,
      description,
      priority,
      status,
      due_date: dueDate || null,
      assignee,
      start_date: startDate || null,
      duration_days: durationDays || 1,
      milestones,
    });
    onClose();
  };

  const handleSaveToLibrary = async () => {
    const content = {
      subcategory: { title, description, priority, due_date: dueDate, assignee, status },
    };

    await saveToLibrary('subcategory', title, JSON.stringify(content));
    alert('Sous-catégorie sauvegardée dans la bibliothèque');
  };

  const addMilestone = () => {
    const newMilestone = prompt('Nom du jalon:');
    if (newMilestone) {
      const sorted = [...milestones, { id: Date.now(), title: newMilestone, done: false }].sort(
        (a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return 0;
        }
      );
      setMilestones(sorted);
    }
  };

  const toggleMilestone = id => {
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

  const priorities = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'Haute' },
    { value: 'normal', label: 'Normale' },
    { value: 'low', label: 'Basse' },
  ];

  const statuses = [
    { value: 'todo', label: 'À faire' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'waiting', label: 'En attente' },
    { value: 'done', label: 'Terminé' },
  ];

  const getStatusBadgeClass = s => {
    switch (s) {
      case 'done':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'waiting':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-300';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-card w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-std flex items-center justify-between shrink-0">
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-bold text-xl text-primary bg-transparent border-b border-transparent hover:border-std focus:border-accent focus:outline-none w-full min-w-[200px]"
              style={{ wordBreak: 'break-word' }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(status)}`}
            >
              {statuses.find(s => s.value === status)?.label || 'À faire'}
            </span>
            <button onClick={onClose} className="icon-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Durée (jours)</label>
              <input
                type="number"
                min="1"
                value={durationDays}
                onChange={e => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Date d'échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Priorité</label>
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
              <label className="block text-sm font-medium text-primary mb-1">Statut</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              >
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Assigné à</label>
              <input
                type="text"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-primary">Jalons</label>
              <button onClick={addMilestone} className="text-xs text-accent hover:underline">
                + Jalon
              </button>
            </div>
            {milestones.length === 0 ? (
              <p className="text-sm text-muted">Aucun jalon</p>
            ) : (
              <div className="space-y-2">
                {milestones.map(milestone => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2 p-2 bg-card-hover rounded"
                  >
                    <input
                      type="checkbox"
                      checked={milestone.done}
                      onChange={() => toggleMilestone(milestone.id)}
                      className="w-4 h-4 rounded border-std text-accent"
                    />
                    <span
                      className={`flex-1 text-sm ${milestone.done ? 'line-through text-muted' : 'text-primary'}`}
                    >
                      {milestone.title}
                    </span>
                    <button
                      onClick={() => deleteMilestone(milestone.id)}
                      className="p-1 text-muted hover:text-urgent rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between p-4 border-t border-std bg-card shrink-0">
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
