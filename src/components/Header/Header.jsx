import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Sun, Moon, HelpCircle, Search } from 'lucide-react';

const APP_VERSION = '1.1.0';

function Header() {
  const { theme, toggleTheme, guideOpen, toggleGuide, searchOpen, toggleSearch } = useApp();

  return (
    <header
      className="h-14 bg-sidebar border-b border-std flex items-center justify-between px-4"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center text-sm text-muted">
        <span className="px-1.5 py-0.5 bg-card rounded text-xs">v{APP_VERSION}</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={toggleSearch}
          className={`icon-btn ${searchOpen ? 'text-accent' : ''}`}
          title="Rechercher"
        >
          <Search size={18} />
        </button>

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

        <button
          onClick={toggleGuide}
          className={`icon-btn ${guideOpen ? 'text-accent' : ''}`}
          title="Guide"
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
