import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Bookmark, Trash2, Mail, FileText, GripVertical } from 'lucide-react';
import { loadTagsData } from '../../data/TagsData';
import { parseMsgFile, isValidMsgFile } from '../../utils/msgParser';

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

  // Tri des emails
  const sortEmails = emailsToSort => {
    if (sortMode === 'date') {
      return [...emailsToSort].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    if (sortMode === 'object-date') {
      // 1. Calculer la date max par objet
      const objectMaxDates = {};
      emailsToSort.forEach(email => {
        const date = new Date(email.date);
        if (!objectMaxDates[email.subject] || date > objectMaxDates[email.subject]) {
          objectMaxDates[email.subject] = date;
        }
      });

      // 2. Objets triés par date max (récent → ancien), puis alphabétique
      const sortedSubjects = Object.keys(objectMaxDates).sort((a, b) => {
        const dateDiff = objectMaxDates[b] - objectMaxDates[a];
        if (dateDiff !== 0) return dateDiff;
        return a.localeCompare(b);
      });

      // 3. Construire le résultat: objets → emails triés (récent → ancien)
      const sorted = [];
      sortedSubjects.forEach(subject => {
        const subjectEmails = emailsToSort
          .filter(e => e.subject === subject)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        sorted.push(...subjectEmails);
      });

      return sorted;
    }

    return emailsToSort;
  };

  // Drag & drop handlers
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

  const handleDrop = async e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const msgFiles = files.filter(f => isValidMsgFile(f));

    if (msgFiles.length === 0) {
      alert('Seuls les fichiers .msg sont acceptés');
      return;
    }

    for (const file of msgFiles) {
      try {
        const metadata = await parseMsgFile(file);

        // Convert file to base64 for storage
        const reader = new FileReader();
        reader.onload = event => {
          const base64Data = event.target.result;
          const emailData = {
            date: metadata.date,
            subject: metadata.subject,
            filepath: base64Data,
            filename: metadata.filename,
          };
          const emailId = addEmailToSubcategory(subcategory.id, emailData);

          // Update local state with all data including filepath
          setEmails(prev => [
            ...prev,
            {
              id: emailId,
              subcategory_id: subcategory.id,
              ...emailData,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing MSG file:', error);
        alert('Erreur lors du traitement du fichier');
      }
    }
  };

  const handleOpenEmail = async email => {
    const fileData = email.filepath;
    if (!fileData) {
      console.error('[handleOpenEmail] No filepath in email:', email);
      alert('Fichier email non disponible');
      return;
    }

    console.log('[handleOpenEmail] Opening email:', email.filename);

    try {
      const base64Response = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      const binaryString = atob(base64Response);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/vnd.ms-outlook' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = email.filename || 'email.msg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 60000);

      console.log('[handleOpenEmail] File downloaded:', email.filename);
    } catch (error) {
      console.error('[handleOpenEmail] Error:', error);
      alert("Erreur lors de l'ouverture du fichier: " + error.message);
    }
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

  // Quill toolbar configuration
  const modules = {
    toolbar: [['bold', 'underline'], [{ color: ['#000000', '#ef4444', '#3b82f6', '#22c55e'] }]],
  };

  const formats = ['bold', 'underline', 'color'];

  // MS Project fields
  const [startDate, setStartDate] = useState(subcategory.start_date || '');
  const [durationDays, setDurationDays] = useState(subcategory.duration_days || 0);
  const [anchorOnStart, setAnchorOnStart] = useState(!!subcategory.start_date);
  const [anchorOnEnd, setAnchorOnEnd] = useState(!!subcategory.due_date && !subcategory.start_date);

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
    if (!startDateStr || days < 0) return '';
    if (days === 0) return startDateStr;
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
    if (!endDateStr || days < 0) return '';
    if (days === 0) return endDateStr;
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
                  modules={modules}
                  formats={formats}
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
                  onDrop={handleDrop}
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
                    sortEmails(emails).map(email => (
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
