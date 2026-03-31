import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Trash2, Archive, Folder } from 'lucide-react';

function Archives() {
  const { getArchivedBoards, restoreBoard, boards, deleteBoard, loadBoard } = useApp();
  const [archivedBoards, setArchivedBoards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadArchived();
  }, [getArchivedBoards]);

  const loadArchived = async () => {
    const archived = getArchivedBoards();
    setArchivedBoards(archived);
  };

  const handleRestore = async id => {
    restoreBoard(id);
    setTimeout(() => {
      const archived = getArchivedBoards();
      setArchivedBoards(archived);
      loadBoard(id);
      navigate('/board');
    }, 100);
  };

  const handleDelete = async id => {
    if (window.confirm('Voulez-vous vraiment supprimer définitivement ce projet ?')) {
      deleteBoard(id);
      loadArchived();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <Archive size={28} className="mr-2" />
          Archives
        </h1>
      </div>

      {archivedBoards.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <Archive size={48} className="mx-auto mb-4 text-muted" />
          <p>Aucun projet archivé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {archivedBoards.map(board => (
            <div
              key={board.id}
              className="bg-card rounded-lg shadow-card border border-std p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Folder size={18} className="text-muted" />
                  <h3 className="font-medium text-primary">{board.title}</h3>
                </div>
                {board.description && (
                  <p className="text-sm text-secondary mt-1">{board.description}</p>
                )}
                <p className="text-xs text-muted mt-2">
                  Archivé le {new Date(board.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore(board.id)}
                  className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:opacity-90"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Restaurer
                </button>
                <button
                  onClick={() => handleDelete(board.id)}
                  className="flex items-center px-3 py-1.5 text-sm text-urgent hover:bg-card-hover rounded"
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
