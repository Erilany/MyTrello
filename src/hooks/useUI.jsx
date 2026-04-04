import { useState, useCallback } from 'react';

export function useUI() {
  const [guideOpen, setGuideOpen] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleGuide = useCallback(() => {
    setGuideOpen(prev => !prev);
    setSearchOpen(false);
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleSearch = useCallback(() => {
    setSearchOpen(prev => !prev);
    setGuideOpen(false);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState('panel');

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCommande, setSelectedCommande] = useState(null);

  const [activeTabCommande, setActiveTabCommande] = useState('commande');
  const [activeTab, setActiveTab] = useState('taches');

  return {
    guideOpen,
    setGuideOpen,
    toggleGuide,
    searchOpen,
    setSearchOpen,
    toggleSearch,
    sidebarOpen,
    setSidebarOpen,
    libraryOpen,
    setLibraryOpen,
    libraryViewMode,
    setLibraryViewMode,
    selectedCard,
    setSelectedCard,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    selectedCommande,
    setSelectedCommande,
    activeTabCommande,
    setActiveTabCommande,
    activeTab,
    setActiveTab,
  };
}

export default useUI;
