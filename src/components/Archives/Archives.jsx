import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, Trash2, Archive } from 'lucide-react';

function Archives() {
  const { getArchivedCards, restoreCard, deleteCard } = useApp();
  const [archivedCards, setArchivedCards] = useState([]);

  useEffect(() => {
    loadArchived();
  }, []);

  const loadArchived = async () => {
    const cards = await getArchivedCards();
    setArchivedCards(cards);
  };

  const handleRestore = async (id) => {
    await restoreCard(id);
    await loadArchived();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer définitivement cette carte ?')) {
      await deleteCard(id);
      await loadArchived();
    }
  };

  const priorityColors = {
    urgent: '#EF4444',
    high: '#F97316',
    normal: '#22C55E',
    low: '#6B7280'
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Archive size={28} className="mr-2" />
          Archives
        </h1>
      </div>

      {archivedCards.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Archive size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Aucune carte archivée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {archivedCards.map(card => (
            <div 
              key={card.id} 
              className="bg-white rounded-lg shadow border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800">{card.title}</h3>
                  {card.priority !== 'normal' && (
                    <span 
                      className="px-2 py-0.5 text-xs rounded-full text-white"
                      style={{ backgroundColor: priorityColors[card.priority] }}
                    >
                      {card.priority}
                    </span>
                  )}
                </div>
                {card.description && (
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Archivé le {new Date(card.updated_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore(card.id)}
                  className="flex items-center px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Restaurer
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={14} className="mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Archives;
