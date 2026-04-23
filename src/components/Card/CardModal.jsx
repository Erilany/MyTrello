import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Calendar,
  Plus,
  Folder,
  Mail,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

function CardModal({ card, onClose }) {
  const {
    updateCard,
    categories,
    subcategories,
    saveToLibrary,
    createCategory,
    updateCategory,
    deleteCategory,
    cards,
    libraryItems,
    getEmailsForSubcategory,
  } = useApp();

  const [title, setTitle] = useState(card.title);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    console.log('[CardModal] MOUNTED for card:', card.id, card.title);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const triggerRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.due_date || '');

  const cardCategories = useMemo(() => {
    const cats =
      categories
        ?.filter(c => Number(c.card_id) === Number(card.id))
        .sort((a, b) => (a.position || 0) - (b.position || 0)) || [];
    return cats;
  }, [categories, card.id]);

  let totalEmails = 0;
  for (const cat of cardCategories) {
    const catSubcategories =
      subcategories?.filter(s => Number(s.category_id) === Number(cat.id)) || [];
    for (const sub of catSubcategories) {
      try {
        const emails = getEmailsForSubcategory ? getEmailsForSubcategory(sub.id) : [];
        totalEmails += emails?.length || 0;
      } catch (e) {}
    }
  }
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryTitle, setEditingCategoryTitle] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const [startDate, setStartDate] = useState(card.start_date || '');
  const [durationDays, setDurationDays] = useState(card.duration_days || 1);
  const [parentId, setParentId] = useState(card.parent_id || null);
  const [predecessorId, setPredecessorId] = useState(card.predecessor_id || null);

  const libraryCard = libraryItems?.find(item => item.type === 'card' && item.title === card.title);
  const tempsRepere = libraryCard
    ? JSON.parse(libraryCard.content_json)?.card?.duration_days || libraryCard.duration || null
    : null;

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
      card: {
        title,
        description,
        due_date: dueDate,
        start_date: startDate,
        duration_days: durationDays,
      },
      categories: cats.map(cat => ({
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

  const handleStartEditCategory = cat => {
    setEditingCategoryId(cat.id);
    setEditingCategoryTitle(cat.title);
  };

  const handleSaveEditCategory = async () => {
    if (editingCategoryTitle.trim() && editingCategoryId) {
      await updateCategory(editingCategoryId, { title: editingCategoryTitle.trim() });
      setEditingCategoryId(null);
      setEditingCategoryTitle('');
      triggerRefresh();
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryTitle('');
  };

  const handleDeleteCategory = async catId => {
    if (window.confirm('Voulez-vous vraiment supprimer cette catégorie?')) {
      await deleteCategory(catId);
      setDeletingCategoryId(null);
      triggerRefresh();
    }
  };

  const handleMoveCategoryUp = catId => {
    const currentCategories = categories
      .filter(c => Number(c.card_id) === Number(card.id))
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    const idx = currentCategories.findIndex(c => c.id === catId);
    if (idx <= 0) return;
    const newOrder = [...currentCategories];
    const temp = newOrder[idx - 1];
    newOrder[idx - 1] = newOrder[idx];
    newOrder[idx] = temp;
    newOrder.forEach((cat, i) => updateCategory(cat.id, { position: i }));
    triggerRefresh();
  };

  const handleMoveCategoryDown = catId => {
    const currentCategories = categories
      .filter(c => Number(c.card_id) === Number(card.id))
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    const idx = currentCategories.findIndex(c => c.id === catId);
    if (idx === -1 || idx >= currentCategories.length - 1) return;
    const newOrder = [...currentCategories];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[idx + 1];
    newOrder[idx + 1] = temp;
    newOrder.forEach((cat, i) => updateCategory(cat.id, { position: i }));
    triggerRefresh();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-card w-full max-w-3xl h-[90vh] overflow-hidden flex flex-col"
        style={{ width: 'calc(100vw * 0.35)', minWidth: '400px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-std">
          <div className="flex items-center gap-2 flex-1">
            {totalEmails > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                <Mail size={14} />
                <span>{totalEmails}</span>
              </div>
            )}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-lg font-display font-bold flex-1 mr-4 border-none focus:outline-none bg-transparent text-primary"
            />
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              Catégories ({(cardCategories || []).length})
            </h4>

            <div className="space-y-2 mb-3">
              {(cardCategories || []).map((cat, idx) => (
                <div
                  key={cat.id}
                  className="bg-card-hover rounded p-2 flex items-center justify-between transition-all"
                >
                  {editingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingCategoryTitle}
                        onChange={e => setEditingCategoryTitle(e.target.value)}
                        className="flex-1 px-2 py-1 bg-input border border-std rounded text-sm text-primary focus:outline-none focus:border-accent"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEditCategory}
                        className="p-1 text-green-500 hover:text-green-400"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEditCategory}
                        className="p-1 text-red-500 hover:text-red-400"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-muted w-4">{idx + 1}</span>
                        <span className="text-sm text-primary">{cat.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveCategoryUp(cat.id)}
                          disabled={idx === 0}
                          className="p-1 text-muted hover:text-primary disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveCategoryDown(cat.id)}
                          disabled={idx === cardCategories.length - 1}
                          className="p-1 text-muted hover:text-primary disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => handleStartEditCategory(cat)}
                          className="p-1 text-muted hover:text-primary"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-muted hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
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
                    </>
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
