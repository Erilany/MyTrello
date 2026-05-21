import { useState } from 'react';

export function useLibraryAddForm(saveToLibrary, loadLibrary, cardItems) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('card');
  const [newItemParentCard, setNewItemParentCard] = useState('');
  const [newItemParentCategory, setNewItemParentCategory] = useState('');

  const handleSaveToLibrary = () => {
    if (!newItemTitle.trim()) {
      alert('Veuillez entrer un titre');
      return;
    }

    try {
      if (newItemType === 'card') {
        const content = JSON.stringify({
          card: { title: newItemTitle, description: '', priority: 'normal' },
          categories: [],
        });
        saveToLibrary('card', newItemTitle, content);
        alert('Carte ajoutée à la bibliothèque !');
      } else if (newItemType === 'category') {
        if (!newItemParentCard) {
          alert('Veuillez sélectionner une carte parente');
          return;
        }
        const parentCard = cardItems.find(c => c.id === parseInt(newItemParentCard));
        if (parentCard) {
          const content = JSON.parse(parentCard.content_json);
          content.categories.push({
            title: newItemTitle,
            description: '',
            priority: 'normal',
            subcategories: [],
          });
          saveToLibrary('card', parentCard.title, JSON.stringify(content));
          alert('Catégorie ajoutée à la bibliothèque !');
        }
      } else if (newItemType === 'subcategory') {
        if (!newItemParentCard || !newItemParentCategory) {
          alert('Veuillez sélectionner une carte et une catégorie parentes');
          return;
        }
        const parentCard = cardItems.find(c => c.id === parseInt(newItemParentCard));
        if (parentCard) {
          const content = JSON.parse(parentCard.content_json);
          const category = content.categories.find(cat => cat.title === newItemParentCategory);
          if (category) {
            category.subcategories.push({
              title: newItemTitle,
              description: '',
              priority: 'normal',
            });
            saveToLibrary('card', parentCard.title, JSON.stringify(content));
            alert('Sous-catégorie ajoutée à la bibliothèque !');
          }
        }
      }

      setShowAddForm(false);
      setNewItemTitle('');
      setNewItemParentCard('');
      setNewItemParentCategory('');
      loadLibrary();
    } catch (e) {
      console.error('Error saving to library:', e);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return {
    showAddForm,
    setShowAddForm,
    newItemTitle,
    setNewItemTitle,
    newItemType,
    setNewItemType,
    newItemParentCard,
    setNewItemParentCard,
    newItemParentCategory,
    setNewItemParentCategory,
    handleSaveToLibrary,
  };
}
