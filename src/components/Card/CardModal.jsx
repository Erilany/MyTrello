import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, User, Tag, MessageSquare, Trash2, Plus, Folder } from 'lucide-react';

function CardModal({ card, onClose }) {
  const {
    updateCard,
    categories,
    subcategories,
    addComment,
    getComments,
    deleteComment,
    saveToLibrary,
    createCategory,
  } = useApp();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'normal');
  const [dueDate, setDueDate] = useState(card.due_date || '');
  const [assignee, setAssignee] = useState(card.assignee || '');
  const [color, setColor] = useState(card.color || '#FFFFFF');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    const result = await getComments('card', card.id);
    setComments(result);
  };

  const handleSave = async () => {
    await updateCard(card.id, {
      title,
      description,
      priority,
      due_date: dueDate || null,
      assignee,
      color,
    });
    onClose();
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment('card', card.id, newComment.trim());
      setNewComment('');
      await loadComments();
    }
  };

  const handleDeleteComment = async commentId => {
    await deleteComment(commentId);
    await loadComments();
  };

  const handleSaveToLibrary = async () => {
    const cardCategories = categories.filter(c => c.card_id === card.id);
    const content = {
      card: { title, description, priority, due_date: dueDate, assignee, color },
      categories: cardCategories.map(cat => ({
        ...cat,
        subcategories: subcategories.filter(sc => sc.category_id === cat.id),
      })),
    };

    await saveToLibrary('card', title, JSON.stringify(content));
    alert('Carte sauvegardée dans la bibliothèque');
  };

  const handleAddCategory = async e => {
    e.preventDefault();
    if (newCategoryTitle.trim()) {
      await createCategory(card.id, newCategoryTitle.trim());
      setNewCategoryTitle('');
    }
  };

  const cardCategories = categories.filter(c => c.card_id === card.id);

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: '#EF4444' },
    { value: 'high', label: 'Haute', color: '#F97316' },
    { value: 'normal', label: 'Normale', color: '#22C55E' },
    { value: 'low', label: 'Basse', color: '#6B7280' },
  ];

  const colors = [
    '#FFFFFF',
    '#FEE2E2',
    '#FEF3C7',
    '#DCFCE7',
    '#DBEAFE',
    '#F3E8FF',
    '#FCE7F3',
    '#E5E7EB',
  ];

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
              rows={3}
              className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent"
              placeholder="Ajouter une description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                <Tag size={14} className="inline mr-1" />
                Priorité
              </label>
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
              <label className="block text-sm font-medium text-secondary mb-1">
                <Calendar size={14} className="inline mr-1" />
                Date d'échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              <User size={14} className="inline mr-1" />
              Assigné à
            </label>
            <input
              type="text"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent"
              placeholder="Nom de la personne..."
            />
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

          <div className="pt-4 border-t border-std">
            <h4 className="text-sm font-medium text-secondary mb-2">
              <MessageSquare size={14} className="inline mr-1" />
              Commentaires
            </h4>

            <div className="space-y-2 mb-3">
              {comments.map(comment => (
                <div key={comment.id} className="bg-card-hover rounded p-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-primary">{comment.content}</p>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-muted hover:text-urgent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 px-3 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddComment();
                }}
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm transition-std"
              >
                Envoyer
              </button>
            </div>
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
