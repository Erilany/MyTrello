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

  const handleSave = async () => {
    await updateSubcategory(subcategory.id, {
      title,
      description,
      priority,
      due_date: dueDate || null,
      assignee
    });
    onClose();
  };

  const handleSaveToLibrary = async () => {
    const content = {
      subcategory: { title, description, priority, due_date: dueDate, assignee }
    };
    
    await saveToLibrary('subcategory', title, JSON.stringify(content));
    alert('Sous-catégorie sauvegardée dans la bibliothèque');
  };

  const priorities = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'Haute' },
    { value: 'normal', label: 'Normale' },
    { value: 'low', label: 'Basse' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Modifier la sous-catégorie</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handleSaveToLibrary}
            className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Bookmark size={16} className="mr-2" />
            Sauvegarder
          </button>
          <div className="flex gap-2">
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
    </div>
  );
}

export default SubCategoryModal;
