import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

const STORAGE_KEY_THEME = 'c-projets-theme';
const STORAGE_KEY_COLORS = 'c-projets-cardColors';

const defaultCardColors = {
  etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
  enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
  realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
  archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
};

export function UIProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState('panel');
  const [guideOpen, setGuideOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cardColors, setCardColors] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLORS);
    return saved ? JSON.parse(saved) : defaultCardColors;
  });

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  const updateCardColors = useCallback((newColors) => {
    setCardColors(newColors);
    localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(newColors));
  }, []);

  const resetCardColors = useCallback(() => {
    setCardColors(defaultCardColors);
    localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(defaultCardColors));
  }, []);

  const toggleGuide = useCallback(() => {
    setGuideOpen(prev => !prev);
    setSearchOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchOpen(prev => !prev);
    setGuideOpen(false);
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    sidebarOpen,
    setSidebarOpen,
    libraryOpen,
    setLibraryOpen,
    libraryViewMode,
    setLibraryViewMode,
    guideOpen,
    toggleGuide,
    searchOpen,
    toggleSearch,
    cardColors,
    updateCardColors,
    resetCardColors,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
