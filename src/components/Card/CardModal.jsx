import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, User, Tag, MessageSquare, Trash2, Plus, Folder } from 'lucide-react';

function CardModal({ card, onClose }) {
  const { updateCard, categories, subcategories, addComment, getComments, deleteComment, saveToLibrary, createCategory } = useApp();
  
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
      color
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

  const handleDeleteComment = async (commentId) => {
    await deleteComment(commentId);
    await loadComments();
  };

  const handleSaveToLibrary = async () => {
    const cardCategories = categories.filter(c => c.card_id === card.id);
    const content = {
      card: { title, description, priority, due_date: dueDate, assignee, color },
      categories: cardCategories.map(cat => ({
        ...cat,
        subcategories: subcategories.filter(sc => sc.category_id === cat.id)
      }))
    };
    
    await saveToLibrary('card', title, JSON.stringify(content));
    alert('Carte sauvegardée dans la bibliothèque');
  };

  const handleAddCategory = async (e) => {
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
    { value: 'low', label: 'Basse', color: '#6B7280' }
  ];

  const colors = [
    '#FFFFFF', '#FEE2E2', '#FEF3C7', '#DCFCE7', '#DBEAFE', '#F3E8FF', '#FCE7F3', '#E5E7EB'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold flex-1 mr-4 border-none focus:outline-none focus:ring-0"
          />
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ajouter une description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag size={14} className="inline mr-1" />
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Date d'échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={14} className="inline mr-1" />
              Assigné à
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nom de la personne..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-blue-500' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              <Folder size={14} className="inline mr-1" />
              Catégories ({cardCategories.length})
            </h4>
            
            <div className="space-y-2 mb-3">
              {cardCategories.map(cat => (
                <div key={cat.id} className="bg-gray-50 rounded p-2 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{cat.title}</span>
                  {cat.priority !== 'normal' && (
                    <span className={`px-2 py-0.5 text-xs rounded text-white ${
                      cat.priority === 'urgent' ? 'bg-red-500' : 
                      cat.priority === 'high' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}>
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
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="Nouvelle catégorie..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center"
              >
                <Plus size={14} className="mr-1" />
                Ajouter
              </button>
            </form>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={handleSaveToLibrary}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Sauvegarder comme modèle
            </button>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={14} className="inline mr-1" />
              Commentaires
            </h4>
            
            <div className="space-y-2 mb-3">
              {comments.map(comment => (
                <div key={comment.id} className="bg-gray-50 rounded p-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment();
                }}
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
