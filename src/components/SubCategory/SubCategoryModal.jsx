import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Bookmark, Trash2 } from 'lucide-react';
import { loadTagsData } from '../../data/TagsData';

function SubCategoryModal({ subcategory, onClose }) {
  const {
    updateSubcategory,
    saveToLibrary,
    categories: contextCategories,
    currentBoard,
    getInternalContacts,
  } = useApp();

  const tag = subcategory.tag || null;
  const allTags = loadTagsData();
  const tagInfo = tag ? allTags.find(t => t.name === tag) : null;

  // Load data directly from localStorage for consistency
  const [libraryItems, setLibraryItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem('mytrello_db');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.libraryItems) setLibraryItems(parsed.libraryItems);
      if (parsed.cards) setCards(parsed.cards);
      if (parsed.categories) setCategories(parsed.categories);
    }
  }, []);

  const [title, setTitle] = useState(subcategory.title);
  const [description, setDescription] = useState(subcategory.description || '');
  const [progress, setProgress] = useState(subcategory.progress || 0);
  const [priority, setPriority] = useState(subcategory.priority || 'normal');
  const [status, setStatus] = useState(subcategory.status || 'todo');
  const [dueDate, setDueDate] = useState(subcategory.due_date || '');
  const [assignee, setAssignee] = useState(subcategory.assignee || '');

  // Quill toolbar configuration
  const modules = {
    toolbar: [['bold', 'underline'], [{ color: ['#000000', '#ef4444', '#3b82f6', '#22c55e'] }]],
  };

  const formats = ['bold', 'underline', 'color'];

  // MS Project fields
  const [startDate, setStartDate] = useState(subcategory.start_date || '');
  const [durationDays, setDurationDays] = useState(subcategory.duration_days || 1);

  // Temps repère from library (read-only)
  const parentCategory = categories?.find(c => c.id === subcategory.category_id);
  let tempsRepere = null;
  if (parentCategory && libraryItems) {
    const parentCard = cards?.find(c => Number(c.id) === Number(parentCategory.card_id));
    if (parentCard) {
      const libraryCard = libraryItems.find(
        item => item.type === 'card' && item.title === parentCard.title
      );
      if (libraryCard && libraryCard.content_json) {
        try {
          const content = JSON.parse(libraryCard.content_json);
          const cat = content.categories?.find(c => c.title === parentCategory.title);
          const subcat = cat?.subcategories?.find(s => s.title === subcategory.title);
          tempsRepere = subcat?.duration_days || null;
        } catch (e) {
          console.error('Error parsing library content:', e);
        }
      }
    }
  }

  // Milestones
  const [milestones, setMilestones] = useState(subcategory.milestones || []);

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
    console.log('[SubCategoryModal] Saving subcategory:', subcategory.id, {
      due_date: dueDate,
      start_date: startDate,
      duration_days: durationDays,
    });
    await updateSubcategory(subcategory.id, {
      title,
      description,
      progress,
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
            <label className="block text-sm font-medium text-primary mb-1">Avancement</label>
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-4 bg-card-hover rounded-full cursor-pointer overflow-hidden"
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = Math.round((x / rect.width) * 100);
                  setProgress(Math.min(100, Math.max(0, percentage)));
                }}
              >
                <div
                  className="h-full bg-accent rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-primary w-12 text-right">{progress}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Description</label>
            <div className="bg-input rounded-lg border border-std">
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                modules={modules}
                formats={formats}
                className="text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Date d'échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => handleDueDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Durée (j)</label>
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
                  <label className="block text-sm font-medium text-secondary mb-1">
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
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Sélectionner...</option>
                {getInternalContacts(currentBoard?.id).map(contact => (
                  <option key={contact.id} value={contact.name || contact.title}>
                    {contact.name || contact.title}
                  </option>
                ))}
              </select>
            </div>

            {tag && (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Tag</label>
                <div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
                  style={{ backgroundColor: tagInfo?.color || '#6B7280' }}
                >
                  {tag}
                </div>
                <p className="text-xs text-muted mt-1">Tag assigné par l'administrateur</p>
              </div>
            )}
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
