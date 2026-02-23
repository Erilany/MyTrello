import React from 'react';
import { useApp } from '../../context/AppContext';
import { Library, Search, Bell } from 'lucide-react';

function Header() {
  const { currentBoard, setLibraryOpen, libraryOpen } = useApp();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {currentBoard?.title || 'MyTrello'}
        </h2>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>

        <button
          onClick={() => setLibraryOpen(!libraryOpen)}
          className={`p-2 rounded-lg ${libraryOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
          title="Bibliothèque"
        >
          <Library size={20} />
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}

export default Header;
