import React, { createContext, useContext, useState } from 'react';

const SelectionContext = createContext(null);

export function SelectionProvider({ children }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [activeTabCommande, setActiveTabCommande] = useState('commande');
  const [activeTab, setActiveTab] = useState('taches');

  const value = {
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

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
