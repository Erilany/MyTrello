import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  MoreHorizontal
} from 'lucide-react';

function Sidebar() {
  const { boards, currentBoard, createBoard, deleteBoard, loadBoard, sidebarOpen, setSidebarOpen } = useApp();
  const [showBoards, setShowBoards] = useState(true);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (newBoardTitle.trim()) {
      await createBoard(newBoardTitle.trim());
      setNewBoardTitle('');
      setShowNewBoard(false);
    }
  };

  const handleDeleteBoard = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce tableau ?')) {
      await deleteBoard(id);
      setMenuOpenId(null);
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="w-12 bg-gray-900 flex flex-col items-center py-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Layout size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">MyTrello</h1>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="p-1 text-gray-400 hover:text-white"
        >
          <ChevronDown size={16} className="rotate-90" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-2">
          <button
            onClick={() => setShowBoards(!showBoards)}
            className="flex items-center w-full px-2 py-1 text-sm text-gray-400 hover:text-white"
          >
            {showBoards ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="ml-1">Tableaux</span>
          </button>

          {showBoards && (
            <div className="ml-2">
              {boards.map(board => (
                <div 
                  key={board.id} 
                  className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                    currentBoard?.id === board.id ? 'bg-blue-600' : 'hover:bg-gray-800'
                  }`}
                  onClick={() => loadBoard(board.id)}
                >
                  <span className="truncate text-sm">{board.title}</span>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === board.id ? null : board.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {menuOpenId === board.id && (
                      <div className="absolute right-0 top-6 bg-gray-800 rounded shadow-lg z-10 py-1 w-32">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBoard(board.id);
                          }}
                          className="flex items-center w-full px-3 py-1 text-sm text-red-400 hover:bg-gray-700"
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
                <form onSubmit={handleCreateBoard} className="mt-1">
                  <input
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="Nom du tableau..."
                    className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                    onBlur={() => {
                      if (!newBoardTitle.trim()) setShowNewBoard(false);
                    }}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setShowNewBoard(true)}
                  className="flex items-center w-full px-2 py-1 mt-1 text-sm text-gray-400 hover:text-white"
                >
                  <Plus size={14} className="mr-1" />
                  Nouveau tableau
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 mt-4 pt-4 px-2">
          <NavLink 
            to="/library"
            className={({ isActive }) => 
              `flex items-center px-2 py-1 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`
            }
          >
            <BookOpen size={16} className="mr-2" />
            Bibliothèque
          </NavLink>
          
          <NavLink 
            to="/archives"
            className={({ isActive }) => 
              `flex items-center px-2 py-1 mt-1 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`
            }
          >
            <Archive size={16} className="mr-2" />
            Archives
          </NavLink>
          
          <NavLink 
            to="/settings"
            className={({ isActive }) => 
              `flex items-center px-2 py-1 mt-1 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`
            }
          >
            <Settings size={16} className="mr-2" />
            Paramètres
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;
