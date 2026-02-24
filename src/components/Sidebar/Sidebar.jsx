import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Layout,
  Plus,
  ChevronDown,
  ChevronRight,
  Archive,
  BookOpen,
  Settings,
  Trash2,
  MoreHorizontal,
  Wand2,
} from 'lucide-react';

function Sidebar() {
  const navigate = useNavigate();
  const {
    boards,
    currentBoard,
    createBoard,
    deleteBoard,
    loadBoard,
    loadBoards,
    sidebarOpen,
    setSidebarOpen,
    generateTestData,
  } = useApp();
  const [showBoards, setShowBoards] = useState(true);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDeleteBoard = async id => {
    if (window.confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      await deleteBoard(id);
      setMenuOpenId(null);
    }
  };

  const handleGenerateTestData = async () => {
    if (
      window.confirm(
        'Générer des données de test ? Cela va ajouter des cartes, catégories et sous-catégories.'
      )
    ) {
      setIsGenerating(true);
      try {
        await generateTestData();
        await loadBoards();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="w-[220px] bg-sidebar flex flex-col items-center py-4 border-r border-std">
        <button
          onClick={() => setSidebarOpen(true)}
          className="icon-btn text-secondary hover:text-primary"
        >
          <Layout size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[220px] bg-sidebar text-primary flex flex-col h-full border-r border-std">
      <div className="p-4 flex items-center justify-between border-b border-std">
        <h1
          className="font-display text-lg font-extrabold tracking-tight"
          style={{ fontSize: '18px', letterSpacing: '-0.5px' }}
        >
          MyTrello
        </h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="icon-btn text-secondary hover:text-primary"
        >
          <ChevronDown size={16} className="rotate-90" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-2 pt-4">
          <button
            onClick={() => setShowBoards(!showBoards)}
            className="flex items-center w-full px-2 py-1 text-xs font-semibold uppercase tracking-widest text-muted hover:text-secondary"
            style={{ letterSpacing: '1.2px' }}
          >
            {showBoards ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="ml-1">Projets</span>
          </button>

          {showBoards && (
            <div className="ml-2 mt-1">
              {boards.map(board => (
                <div
                  key={board.id}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-std ${
                    currentBoard?.id === board.id
                      ? 'bg-accent-soft border-l-[3px] border-l-accent'
                      : 'hover:bg-card'
                  }`}
                  onClick={() => {
                    loadBoard(board.id);
                    navigate('/');
                  }}
                >
                  <span className="truncate text-sm font-body">{board.title}</span>
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === board.id ? null : board.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 icon-btn"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {menuOpenId === board.id && (
                      <div className="absolute right-0 top-6 bg-card rounded-lg shadow-card z-10 py-1 w-36 border border-std">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteBoard(board.id);
                          }}
                          className="flex items-center w-full px-3 py-1.5 text-sm text-urgent hover:bg-card-hover"
                        >
                          <Trash2 size={12} className="mr-2" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {showNewBoard ? (
                <div className="mt-1">
                  <input
                    type="text"
                    value={newBoardTitle}
                    onChange={e => setNewBoardTitle(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newBoardTitle.trim()) {
                          const boardId = await createBoard(newBoardTitle.trim());
                          if (boardId) {
                            await loadBoard(boardId);
                            await loadBoards();
                          }
                          setNewBoardTitle('');
                          setShowNewBoard(false);
                        }
                      }
                      if (e.key === 'Escape') {
                        setNewBoardTitle('');
                        setShowNewBoard(false);
                      }
                    }}
                    placeholder="Nom du projet..."
                    className="w-full px-3 py-2 text-sm bg-input border border-std rounded-md text-primary focus:outline-none focus:border-accent"
                    autoFocus
                    onBlur={() => {
                      if (!newBoardTitle.trim()) setShowNewBoard(false);
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        if (newBoardTitle.trim()) {
                          const boardId = await createBoard(newBoardTitle.trim());
                          if (boardId) {
                            await loadBoard(boardId);
                            await loadBoards();
                          }
                          setNewBoardTitle('');
                          setShowNewBoard(false);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-md hover:opacity-90 transition-std"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setNewBoardTitle('');
                        setShowNewBoard(false);
                      }}
                      className="px-3 py-1.5 text-xs text-secondary hover:text-primary"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewBoard(true)}
                  className="flex items-center w-full px-2 py-1.5 mt-1 text-sm text-secondary hover:text-primary transition-std"
                >
                  <Plus size={14} className="mr-1" />
                  Nouveau projet
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-std mt-4 pt-4 px-2">
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 rounded transition-std ${
                isActive ? 'bg-accent-soft border-l-[3px] border-l-accent' : 'hover:bg-card'
              }`
            }
          >
            <BookOpen size={16} className="mr-2 text-secondary" />
            <span className="text-sm">Bibliothèque</span>
          </NavLink>

          <NavLink
            to="/archives"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 mt-1 rounded transition-std ${
                isActive ? 'bg-accent-soft border-l-[3px] border-l-accent' : 'hover:bg-card'
              }`
            }
          >
            <Archive size={16} className="mr-2 text-secondary" />
            <span className="text-sm">Archives</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 mt-1 rounded transition-std ${
                isActive ? 'bg-accent-soft border-l-[3px] border-l-accent' : 'hover:bg-card'
              }`
            }
          >
            <Settings size={16} className="mr-2 text-secondary" />
            <span className="text-sm">Paramètres</span>
          </NavLink>

          <button
            onClick={handleGenerateTestData}
            disabled={isGenerating}
            className="flex items-center w-full px-2 py-1.5 mt-4 rounded-md bg-etudes hover:opacity-90 disabled:opacity-50 transition-std text-white font-medium text-sm"
          >
            <Wand2 size={16} className="mr-2" />
            {isGenerating ? 'Génération...' : 'Générer données test'}
          </button>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;
