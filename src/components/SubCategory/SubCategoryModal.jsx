import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Bookmark, Trash2, Mail, FileText, GripVertical } from 'lucide-react';
import { loadTagsData } from '../../data/TagsData';
import {
  sortEmails,
  handleDrop,
  handleOpenEmail,
  sortMilestones,
  createMilestone,
  getMaxPositionWithoutDate,
  priorities,
  statuses,
  getStatusBadgeClass,
  quillModules,
  quillFormats,
} from './subCategoryUtils';
import { addWorkingDays, subtractWorkingDays } from './workingDaysUtils';

function SubCategoryModal({ subcategory, onClose }) {
  const {
    updateSubcategory,
    saveToLibrary,
    categories: contextCategories,
    currentBoard,
    getInternalContacts,
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
    getEmailsForSubcategory,
    saveEmailFile,
    getEmailFile,
    addHiddenMilestone,
  } = useApp();

  const allTags = loadTagsData();

  // Load data directly from localStorage for consistency
  const [libraryItems, setLibraryItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem('c-projets_db');
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

  // Auto-update status based on progress
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

  // Auto-update progress to 100% when status is done
  useEffect(() => {
    if (status === 'done' && progress !== 100) {
      setProgress(100);
    }
  }, [status, progress]);

  // Email panel state
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [sortMode, setSortMode] = useState('date');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Load emails for this subcategory
  useEffect(() => {
    const loadedEmails = getEmailsForSubcategory(subcategory.id);
    setEmails(loadedEmails);
  }, [subcategory.id]);

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = async e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newEmails = await handleDrop(files, subcategory.id, addEmailToSubcategory);
    setEmails(prev => [...prev, ...newEmails]);
  };

  const handleDeleteEmail = emailId => {
    if (window.confirm('Supprimer cet email ?')) {
      removeEmailFromSubcategory(emailId);
      setEmails(prev => prev.filter(e => e.id !== emailId));
    }
  };

  const handleStartEditSubject = email => {
    setEditingEmailId(email.id);
    setEditingSubject(email.subject);
  };

  const handleSaveSubject = emailId => {
    updateEmailSubject(emailId, editingSubject);
    setEmails(prev => prev.map(e => (e.id === emailId ? { ...e, subject: editingSubject } : e)));
    setEditingEmailId(null);
    setEditingSubject('');
  };

  // MS Project fields
  const [startDate, setStartDate] = useState(subcategory.start_date || '');
  const [durationDays, setDurationDays] = useState(subcategory.duration_days || 0);
  const [anchorOnStart, setAnchorOnStart] = useState(!!subcategory.start_date);
  const [anchorOnEnd, setAnchorOnEnd] = useState(!!subcategory.due_date && !subcategory.start_date);

  // Tag inheritance: use task tag, or inherit from parent category
  const parentCategory = categories?.find(c => c.id === subcategory.category_id);
  const effectiveTag = subcategory.tag || (parentCategory ? parentCategory.tag : null);
  const tagInfo = effectiveTag ? allTags.find(t => t.name === effectiveTag) : null;

  // Temps repère from library (read-only)
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
          const updatedSub = parsed.subcategories?.find(
            s => Number(s.id) === Number(subcategory.id)
          );
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
  }, [subcategory.id]);

  useEffect(() => {
    setMilestones(sortMilestones(subcategory.milestones || []));
  }, [subcategory.id]);

  const handleDurationChange = newDuration => {
    const duration = parseInt(newDuration) || 0;
    setDurationDays(duration);

    if (anchorOnStart && startDate && duration >= 0) {
      const calculatedDueDate = addWorkingDays(startDate, duration);
      setDueDate(calculatedDueDate);
    } else if (anchorOnEnd && dueDate && duration >= 0) {
      const calculatedStartDate = subtractWorkingDays(dueDate, duration);
      setStartDate(calculatedStartDate);
    }
  };

  const handleStartDateChange = newStartDate => {
    setStartDate(newStartDate);
    if (anchorOnStart && newStartDate && durationDays >= 0) {
      const calculatedDueDate = addWorkingDays(newStartDate, durationDays);
      setDueDate(calculatedDueDate);
    }
  };

  const handleDueDateChange = newDueDate => {
    setDueDate(newDueDate);
    if (anchorOnEnd && newDueDate && durationDays >= 0) {
      const calculatedStartDate = subtractWorkingDays(newDueDate, durationDays);
      setStartDate(calculatedStartDate);
    }
  };

  const handleAnchorOnStartChange = checked => {
    setAnchorOnStart(checked);
    if (checked) {
      setAnchorOnEnd(false);
    }
  };

  const handleAnchorOnEndChange = checked => {
    setAnchorOnEnd(checked);
    if (checked) {
      setAnchorOnStart(false);
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
    if (e.key === 'Enter') {
      saveNewMilestone();
    } else if (e.key === 'Escape') {
      cancelAddMilestone();
    }
  };

  const toggleMilestone = id => {
    const milestone = milestones.find(m => m.id === id);
    const isBeingChecked = milestone && !milestone.done;

    if (isBeingChecked) {
      addHiddenMilestone(id);
    }

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
    const newMilestones = milestones.map(m => (m.id === id ? { ...m, title: newTitle.trim() } : m));
    setMilestones(newMilestones);
  };

  const updateMilestoneDate = (id, newDate) => {
    const newMilestones = milestones.map(m => (m.id === id ? { ...m, date: newDate || null } : m));
    setMilestones(sortMilestones(newMilestones));
  };

  const handleMilestoneDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMilestoneDragOver = (e, id) => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div
        className={`bg-card rounded-lg shadow-card w-full ${emailPanelOpen ? 'max-w-4xl' : 'max-w-2xl'} max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-std flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-bold text-xl text-primary bg-transparent border-b border-transparent hover:border-std focus:border-accent focus:outline-none min-w-[200px]"
              style={{ wordBreak: 'break-word' }}
            />
            <button
              onClick={() => setEmailPanelOpen(!emailPanelOpen)}
              className={`p-2 rounded-lg transition-colors ${emailPanelOpen ? 'bg-accent text-white' : 'bg-card-hover text-secondary hover:text-accent'}`}
              title="Afficher/Masquer les emails"
            >
              <Mail size={18} />
            </button>
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

        <div className="flex-1 overflow-hidden flex">
          <div className="w-[600px] flex-shrink-0 overflow-auto p-4 space-y-6 border-r border-std">
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
                <span className="text-sm font-medium text-primary w-12 text-right">
                  {progress}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Description</label>
              <div className="bg-input rounded-lg border border-std">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={quillModules}
                  formats={quillFormats}
                  className="text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Date de début</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  />
                  <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anchorOnStart}
                      onChange={e => handleAnchorOnStartChange(e.target.checked)}
                      className="w-4 h-4 text-accent"
                    />
                    Ancrer
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Date d'échéance
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => handleDueDateChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
                  />
                  <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anchorOnEnd}
                      onChange={e => handleAnchorOnEndChange(e.target.checked)}
                      className="w-4 h-4 text-accent"
                    />
                    Ancrer
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Durée (j)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={durationDays}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      handleDurationChange(val);
                    }}
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
                  <option value="TEAM">Team - Tous les interlocuteurs</option>
                  {getInternalContacts(currentBoard?.id).map(contact => (
                    <option key={contact.id} value={contact.name || contact.title}>
                      {contact.name || contact.title}
                    </option>
                  ))}
                </select>
              </div>

              {effectiveTag && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Tag</label>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white"
                    style={{ backgroundColor: tagInfo?.color || '#6B7280' }}
                  >
                    {effectiveTag}
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {subcategory.tag
                      ? "Tag assigné par l'administrateur"
                      : 'Tag hérité de la catégorie parente'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-primary">Jalons</label>
                {!isAddingMilestone && (
                  <button onClick={addMilestone} className="text-xs text-accent hover:underline">
                    + Jalon
                  </button>
                )}
              </div>
              {isAddingMilestone && (
                <div className="p-3 bg-card-hover rounded mb-3 border border-accent">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="w-4 h-4 rounded border-std text-accent opacity-50"
                    />
                    <input
                      type="text"
                      value={newMilestoneTitle}
                      onChange={e => setNewMilestoneTitle(e.target.value)}
                      onKeyDown={handleNewMilestoneKeyDown}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm bg-card border border-std rounded focus:outline-none focus:border-accent text-primary"
                      placeholder="Nom du jalon (Entrée pour valider)..."
                    />
                    <button
                      onClick={cancelAddMilestone}
                      className="p-1 text-muted hover:text-urgent rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-xs text-muted">Date:</span>
                    <input
                      type="date"
                      value={newMilestoneDate}
                      onChange={e => setNewMilestoneDate(e.target.value)}
                      className="px-2 py-1 text-xs bg-card border border-std rounded focus:outline-none focus:border-accent text-primary"
                    />
                    <button
                      onClick={saveNewMilestone}
                      className="px-2 py-1 text-xs bg-accent text-white rounded hover:opacity-90"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
              {milestones.length === 0 && !isAddingMilestone ? (
                <p className="text-sm text-muted">Aucun jalon</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map(milestone => (
                    <div
                      key={milestone.id}
                      draggable={!milestone.date}
                      onDragStart={e =>
                        !milestone.date && handleMilestoneDragStart(e, milestone.id)
                      }
                      onDragOver={e => !milestone.date && handleMilestoneDragOver(e, milestone.id)}
                      onDrop={e => !milestone.date && handleMilestoneDrop(e, milestone.id)}
                      onDragEnd={handleMilestoneDragEnd}
                      className={`p-3 bg-card-hover rounded transition-all ${
                        milestone.done ? 'opacity-60' : ''
                      } ${
                        draggedId === milestone.id
                          ? 'border-2 border-accent shadow-lg opacity-75'
                          : !milestone.date
                            ? 'cursor-grab hover:border hover:border-accent'
                            : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {!milestone.date && (
                          <GripVertical size={16} className="text-muted flex-shrink-0" />
                        )}
                        <input
                          type="checkbox"
                          checked={milestone.done}
                          onChange={() => toggleMilestone(milestone.id)}
                          className="w-4 h-4 rounded border-std text-accent"
                        />
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={e => updateMilestoneTitle(milestone.id, e.target.value)}
                          className={`flex-1 px-2 py-1 text-sm bg-card border border-std rounded focus:outline-none focus:border-accent ${
                            milestone.done ? 'line-through text-muted' : 'text-primary'
                          }`}
                          placeholder="Nom du jalon..."
                        />
                        <button
                          onClick={() => deleteMilestone(milestone.id)}
                          className="p-1 text-muted hover:text-urgent rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <span className="text-xs text-muted">Date:</span>
                        <input
                          type="date"
                          value={milestone.date || ''}
                          onChange={e => updateMilestoneDate(milestone.id, e.target.value)}
                          className="px-2 py-1 text-xs bg-card border border-std rounded focus:outline-none focus:border-accent text-primary"
                        />
                        {milestone.date && (
                          <span className="text-xs text-muted">
                            ({new Date(milestone.date).toLocaleDateString('fr-FR')})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {emailPanelOpen && (
            <div className="flex-1 border-l border-std bg-card overflow-hidden flex flex-col">
              <div className="p-3 border-b border-std bg-card-hover flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-accent" />
                  <span className="text-sm font-medium text-primary">Emails liés</span>
                  <span className="text-xs text-muted">({emails.length})</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className="px-2 py-1 text-xs bg-card border border-std rounded hover:bg-card-hover flex items-center gap-1"
                  >
                    {sortMode === 'date' ? 'Date' : 'Objet'}
                    <span className="text-muted">▼</span>
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-card border border-std rounded-lg shadow-lg z-10 min-w-[140px]">
                      <button
                        onClick={() => {
                          setSortMode('date');
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-card-hover ${sortMode === 'date' ? 'text-accent font-medium' : 'text-primary'}`}
                      >
                        ○ Date uniquement
                      </button>
                      <button
                        onClick={() => {
                          setSortMode('object-date');
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-card-hover ${sortMode === 'object-date' ? 'text-accent font-medium' : 'text-primary'}`}
                      >
                        ● Objet + Date
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                <div
                  className={`w-40 flex-shrink-0 p-3 border-r border-std flex flex-col items-center justify-center transition-colors h-[300px] ${isDragOver ? 'bg-accent-soft border-accent' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={onDrop}
                >
                  <GripVertical size={32} className="text-muted mb-3" />
                  <p className="text-sm text-muted text-center font-medium">Drop .msg</p>
                  <p className="text-xs text-muted text-center mt-1">
                    Glissez un email Outlook ici
                  </p>
                </div>

                <div className="flex-1 overflow-auto p-2 space-y-1">
                  {emails.length === 0 ? (
                    <p className="text-xs text-muted text-center py-4">Aucun email</p>
                  ) : (
                    sortEmails(emails, sortMode).map(email => (
                      <div
                        key={email.id}
                        className="p-2 bg-card-hover rounded hover:bg-card-hover/80 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <FileText
                            size={16}
                            className="text-accent flex-shrink-0 mt-0.5 cursor-pointer hover:text-accent/80"
                            onClick={() => handleOpenEmail(email)}
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs text-muted flex-shrink-0 w-20">
                              {new Date(email.date).toLocaleDateString('fr-FR')}
                            </span>
                            {editingEmailId === email.id ? (
                              <input
                                type="text"
                                value={editingSubject}
                                onChange={e => setEditingSubject(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary min-w-0"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveSubject(email.id);
                                  if (e.key === 'Escape') setEditingEmailId(null);
                                }}
                              />
                            ) : (
                              <span
                                className="text-sm text-primary truncate cursor-pointer hover:text-accent"
                                onClick={() => handleStartEditSubject(email)}
                                title="Cliquez pour modifier"
                              >
                                {email.subject}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteEmail(email.id)}
                            className="p-1 text-muted hover:text-urgent opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
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
