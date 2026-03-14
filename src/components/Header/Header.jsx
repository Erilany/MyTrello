import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Bell, Sun, Moon } from 'lucide-react';

function Header() {
  const { theme, toggleTheme } = useApp();

  return (
    <header
      className="h-14 bg-sidebar border-b border-std flex items-center justify-between px-4"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center"></div>

      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-1.5 text-sm bg-input border border-std rounded-md text-primary placeholder-muted focus:outline-none focus:border-accent w-56 transition-std"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="icon-btn"
          title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button className="icon-btn relative">
          <Bell size={18} />
          <span
            className="absolute top-1 right-1 w-2 h-2 bg-urgent rounded-full"
            style={{ boxShadow: '0 0 6px #ef4444' }}
          ></span>
        </button>
      </div>
    </header>
  );
}

export default Header;
