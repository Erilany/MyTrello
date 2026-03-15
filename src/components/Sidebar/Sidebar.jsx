import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  LayoutGrid,
  Home,
  Edit3,
  Archive as ArchiveIcon,
} from 'lucide-react';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    boards,
    currentBoard,
    createBoard,
    deleteBoard,
    loadBoard,
    sidebarOpen,
    setSidebarOpen,
    generateTestData,
    setLibraryOpen,
    setLibraryViewMode,
    updateBoard,
    archiveBoard,
  } = useApp();
  const [showBoards, setShowBoards] = useState(true);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isOnBoardPage =
    location.pathname === '/board' ||
    location.pathname.startsWith('/board/') ||
    location.pathname === '/board2' ||
    location.pathname.startsWith('/board2/');

  const handleDeleteBoard = async id => {
    if (window.confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      await deleteBoard(id);
      setMenuOpenId(null);
    }
  };

  const handleRenameBoard = board => {
    const newTitle = window.prompt('Nouveau nom du projet :', board.title);
    if (newTitle && newTitle.trim() && newTitle !== board.title) {
      updateBoard(board.id, newTitle.trim(), board.description || '');
      setMenuOpenId(null);
    }
  };

  const handleArchiveBoard = async id => {
    if (window.confirm('Voulez-vous archiver ce projet ? Il sera déplace dans les archives.')) {
      await archiveBoard(id);
      setMenuOpenId(null);
    }
  };

  const handleGenerateTestData = () => {
    if (
      window.confirm(
        'Générer des données de test ? Cela va effacer toutes les données existantes et créer de nouvelles données de test.'
      )
    ) {
      setIsGenerating(true);
      try {
        generateTestData();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="w-[60px] bg-sidebar flex flex-col items-center py-4 border-r border-std gap-2">
        <button
          onClick={() => setSidebarOpen(true)}
          className="icon-btn text-secondary hover:text-primary"
          title="Ouvrir le menu"
        >
          <Layout size={20} />
        </button>

        <div className="border-t border-b border-std py-3 flex flex-col gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `icon-btn ${isActive ? 'text-accent' : 'text-secondary hover:text-primary'}`
            }
            title="Dashboard"
          >
            <Home size={20} />
          </NavLink>

          <button
            onClick={() => {
              setLibraryViewMode('main');
              navigate('/library');
            }}
            className="icon-btn text-secondary hover:text-primary"
            title="Bibliothèque"
          >
            <BookOpen size={20} />
          </button>

          <NavLink
            to="/archives"
            className={({ isActive }) =>
              `icon-btn ${isActive ? 'text-accent' : 'text-secondary hover:text-primary'}`
            }
            title="Archives"
          >
            <Archive size={20} />
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `icon-btn ${isActive ? 'text-accent' : 'text-secondary hover:text-primary'}`
            }
            title="Paramètres"
          >
            <Settings size={20} />
          </NavLink>
        </div>
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

      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="px-2 pt-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 rounded transition-std ${
                isActive ? 'bg-accent-soft border-l-[3px] border-l-accent' : 'hover:bg-card'
              }`
            }
          >
            <Home size={16} className="mr-2 text-secondary" />
            <span className="text-sm">Dashboard</span>
          </NavLink>

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
                  className={`group flex items-center justify-between px-2 py-0.5 rounded cursor-pointer transition-std ${
                    isOnBoardPage && Number(currentBoard?.id) === Number(board.id)
                      ? 'bg-accent-soft border-l-[3px] border-l-accent'
                      : 'hover:bg-card'
                  }`}
                  onClick={() => {
                    loadBoard(board.id);
                    navigate('/board');
                  }}
                >
                  <span className="truncate text-[10px] font-body" title={board.title}>
                    {board.title}
                  </span>
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
                      <div className="absolute right-0 top-6 bg-card rounded-lg shadow-card z-10 py-1 w-40 border border-std">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRenameBoard(board);
                          }}
                          className="flex items-center w-full px-3 py-1.5 text-sm text-primary hover:bg-card-hover"
                        >
                          <Edit3 size={12} className="mr-2" />
                          Renommer
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleArchiveBoard(board.id);
                          }}
                          className="flex items-center w-full px-3 py-1.5 text-sm text-primary hover:bg-card-hover"
                        >
                          <ArchiveIcon size={12} className="mr-2" />
                          Archiver
                        </button>
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
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newBoardTitle.trim()) {
                          const boardId = createBoard(newBoardTitle.trim());
                          if (boardId) {
                            loadBoard(boardId);
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
                      onClick={() => {
                        if (newBoardTitle.trim()) {
                          const boardId = createBoard(newBoardTitle.trim());
                          if (boardId) {
                            loadBoard(boardId);
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
            <span className="text-sm">Paramètres utilisateurs</span>
          </NavLink>

          <NavLink
            to="/system-settings"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 mt-1 rounded transition-std ${
                isActive ? 'bg-accent-soft border-l-[3px] border-l-accent' : 'hover:bg-card'
              }`
            }
          >
            <Settings size={16} className="mr-2 text-secondary" />
            <span className="text-sm">Paramètres système</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;
