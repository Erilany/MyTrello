import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useEmailPanel } from '../../hooks/useEmailPanel';
import { useMilestonePanel } from '../../hooks/useMilestonePanel';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Bookmark, Trash2, Mail, FileText, GripVertical } from 'lucide-react';
import { loadTagsData } from '../../data/TagsData';
import {
  sortEmails,
  handleOpenEmail,
  priorities,
  statuses,
  getStatusBadgeClass,
  quillModules,
  quillFormats,
} from './subCategoryUtils';
import { useSubcategoryForm } from '../../hooks/useSubcategoryForm';
import {
  getSubcategoryTagFromLibrary,
  getParentCardTitle,
  getSubcategorySystemTag,
  findLibraryItemById,
} from '../Settings/favoritesUtils';

function SubCategoryModal({ subcategory, onClose }) {
  const {
    updateSubcategory,
    saveToLibrary,
    categories: contextCategories,
    cards: contextCards,
    currentBoard,
    getInternalContacts,
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
    updateEmailStatus,
    getEmailsForSubcategory,
    saveEmailFile,
    getEmailFile,
    addHiddenMilestone,
  } = useApp();

  const allTags = loadTagsData();
  const categories = contextCategories;
  const cards = contextCards;

  // Load library items for tag synchronization
  const [libraryItems, setLibraryItems] = useState([]);
  useEffect(() => {
    const data = localStorage.getItem('c-projets_db');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.libraryItems) setLibraryItems(parsed.libraryItems);
    }
  }, []);

  // Listen for library updates to refresh tags
  useEffect(() => {
    const handleLibraryUpdated = () => {
      const data = localStorage.getItem('c-projets_db');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.libraryItems) setLibraryItems(parsed.libraryItems);
      }
    };
    window.addEventListener('library-updated', handleLibraryUpdated);
    return () => window.removeEventListener('library-updated', handleLibraryUpdated);
  }, []);

  const {
    emailPanelOpen, setEmailPanelOpen,
    emails, setEmails,
    isDragOver,
    editingEmailId, editingSubject, setEditingSubject,
    sortMode, setSortMode,
    sortDropdownOpen, setSortDropdownOpen,
    handleDragOver, handleDragLeave, onDrop,
    handleDeleteEmail, handleStartEditSubject, handleSaveSubject,
  } = useEmailPanel(
    subcategory.id,
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
    getEmailsForSubcategory
  );

  // Tag inheritance: use dynamic systemTag from library, or inherit from parent category
  const parentCategory = categories?.find(c => c.id === subcategory.category_id);
  const dynamicSystemTag = getSubcategorySystemTag(subcategory, libraryItems);
  const effectiveTag =
    dynamicSystemTag || subcategory.tag || (parentCategory ? parentCategory.tag : null);
  const tagInfo = effectiveTag ? allTags.find(t => t.name === effectiveTag) : null;

  // Temps repère from library (read-only)
  let tempsRepere = null;
  if (parentCategory && libraryItems) {
    const parentCard = cards?.find(c => Number(c.id) === Number(parentCategory.card_id));
    if (parentCard) {
      // Try to find library card using library_item_id (handles both numeric and UUID)
      let libraryCard = null;
      if (parentCard.library_item_id) {
        libraryCard = findLibraryItemById(libraryItems, parentCard.library_item_id);
      }
      // Fallback: search by title
      if (!libraryCard) {
        libraryCard = libraryItems.find(
          item => item.type === 'card' && item.title === parentCard.title
        );
      }
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

  const {
    milestones, setMilestones,
    isAddingMilestone,
    newMilestoneTitle, setNewMilestoneTitle,
    newMilestoneDate, setNewMilestoneDate,
    draggedId,
    addMilestone, saveNewMilestone, cancelAddMilestone,
    handleNewMilestoneKeyDown, toggleMilestone, deleteMilestone,
    updateMilestoneTitle, updateMilestoneDate,
    handleMilestoneDragStart, handleMilestoneDragOver,
    handleMilestoneDrop, handleMilestoneDragEnd,
  } = useMilestonePanel(subcategory.id, subcategory.milestones, addHiddenMilestone);

  const {
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
  } = useSubcategoryForm(subcategory, updateSubcategory, saveToLibrary);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div
        className={`bg-card rounded-lg shadow-card w-full ${emailPanelOpen ? 'max-w-4xl' : 'max-w-2xl'} max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-std flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {emails.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                <Mail size={14} />
                <span>{emails.length}</span>
              </div>
            )}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-bold text-xl text-primary bg-transparent border-b border-transparent hover:border-std focus:border-accent focus:outline-none min-w-[200px]"
              style={{ wordBreak: 'break-word' }}
            />
            <button
              onClick={() => setEmailPanelOpen(!emailPanelOpen)}
              className={`p-2 rounded-lg transition-colors ${emailPanelOpen ? 'bg-accent text-white' : emails.length > 0 ? 'bg-blue-500 text-white' : 'bg-card-hover text-secondary hover:text-accent'}`}
              title={emails.length > 0 ? `${emails.length} email(s) lié(s)` : 'Aucun email'}
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
                    {dynamicSystemTag
                      ? `Tag synchronisé depuis la bibliothèque (${dynamicSystemTag})`
                      : subcategory.tag
                        ? 'Tag assigné manuellement'
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
                                {email.customSubject || email.subject}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newStatus = email.status === 'pending' ? 'done' : 'pending';
                              updateEmailStatus(email.id, newStatus);
                              setEmails(prev =>
                                prev.map(e => (e.id === email.id ? { ...e, status: newStatus } : e))
                              );
                            }}
                            className={`px-2 py-0.5 text-xs rounded transition-opacity ${
                              email.status === 'pending'
                                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                            }`}
                            title={email.status === 'pending' ? 'À traiter' : 'Traité'}
                          >
                            {email.status === 'pending' ? 'À traiter' : 'Traité'}
                          </button>
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
              onClick={() => handleSave(milestones, onClose)}
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
