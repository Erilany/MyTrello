import { useState, useEffect, useCallback } from 'react';

export function useSettings() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('c-projets-theme') || 'dark';
  });

  const [cardColors, setCardColors] = useState(() => {
    const saved = localStorage.getItem('c-projets-cardColors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing cardColors:', e);
      }
    }
    return {
      etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
      enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
      realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
      archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
    };
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('c-projets-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('c-projets-cardColors', JSON.stringify(cardColors));
  }, [cardColors]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const updateCardColors = useCallback(newColors => {
    setCardColors(newColors);
  }, []);

  const resetCardColors = useCallback(() => {
    setCardColors({
      etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
      enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
      realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
      archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
    });
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    cardColors,
    setCardColors,
    updateCardColors,
    resetCardColors,
  };
}

export default useSettings;
