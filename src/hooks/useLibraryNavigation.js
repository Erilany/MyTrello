import { useState } from 'react';

export function useLibraryNavigation() {
  const [selectedLibraryCard, setSelectedLibraryCard] = useState(null);
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [panelSelectedCard, setPanelSelectedCard] = useState(null);
  const [panelSelectedCategory, setPanelSelectedCategory] = useState(null);

  const handleCardClick = cardItem => {
    setSelectedLibraryCard(cardItem);
    setSelectedLibraryCategory(null);
  };

  const handleCategoryClick = category => {
    setSelectedLibraryCategory(category);
  };

  const handleBackToCards = () => {
    setSelectedLibraryCard(null);
    setSelectedLibraryCategory(null);
  };

  const handleBackToCategories = () => {
    setSelectedLibraryCategory(null);
  };

  const handlePanelCardClick = cardItem => {
    setPanelSelectedCard(cardItem);
    setPanelSelectedCategory(null);
    setViewMode('categories');
  };

  const handlePanelCategoryClick = category => {
    setPanelSelectedCategory(category);
    setViewMode('subcategories');
  };

  const handlePanelBackToCards = () => {
    setPanelSelectedCard(null);
    setPanelSelectedCategory(null);
    setViewMode('cards');
  };

  const handlePanelBackToCategories = () => {
    setPanelSelectedCategory(null);
    setViewMode('categories');
  };

  const getPanelCardCategories = cardItem => {
    if (!cardItem || !cardItem.content_json) return [];
    try {
      const content = JSON.parse(cardItem.content_json);
      return content.categories || [];
    } catch {
      return [];
    }
  };

  const getPanelCategorySubcategories = category => {
    if (!category) return [];
    return category.subcategories || [];
  };

  return {
    selectedLibraryCard,
    setSelectedLibraryCard,
    selectedLibraryCategory,
    setSelectedLibraryCategory,
    viewMode,
    setViewMode,
    panelSelectedCard,
    setPanelSelectedCard,
    panelSelectedCategory,
    setPanelSelectedCategory,
    handleCardClick,
    handleCategoryClick,
    handleBackToCards,
    handleBackToCategories,
    handlePanelCardClick,
    handlePanelCategoryClick,
    handlePanelBackToCards,
    handlePanelBackToCategories,
    getPanelCardCategories,
    getPanelCategorySubcategories,
  };
}
