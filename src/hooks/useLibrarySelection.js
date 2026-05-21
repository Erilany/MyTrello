import { useState } from 'react';
import { getCardCategories, getCardSkipAction } from '../components/Library/libraryUtils';

export function useLibrarySelection(libraryItems) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);

  const isCardSelected = card => selectedCards.some(c => c.id === card.id);
  const isCategorySelected = (category, cardTitle) =>
    selectedCategories.some(c => c.title === category.title && c.cardTitle === cardTitle);
  const isSubcategorySelected = (subcategory, categoryTitle, cardTitle) =>
    selectedSubcategories.some(
      s =>
        s.title === subcategory.title &&
        s.categoryTitle === categoryTitle &&
        s.cardTitle === cardTitle
    );

  const toggleCardOnly = (card, forceState = null) => {
    const cardCategories = getCardCategories(card);
    const cardTitle = card.title;
    const skipAction = getCardSkipAction(card);
    const isSelected = selectedCards.some(c => c.id === card.id);
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCards(prev => {
        if (prev.some(c => c.id === card.id)) return prev;
        return [...prev, card];
      });

      if (skipAction) {
        const allSubcats = [];
        cardCategories.forEach(cat => {
          (cat.subcategories || []).forEach(subcat => {
            allSubcats.push({ ...subcat, categoryTitle: cat.title, cardTitle });
          });
        });
        if (allSubcats.length === 1) {
          setSelectedSubcategories(prev => {
            const sub = allSubcats[0];
            if (prev.some(s => s.title === sub.title && s.cardTitle === cardTitle)) return prev;
            return [...prev, sub];
          });
        }
      } else {
        cardCategories.forEach(cat => {
          const catWithCard = { ...cat, cardTitle };
          setSelectedCategories(prev => {
            if (prev.some(c => c.title === cat.title && c.cardTitle === cardTitle)) return prev;
            return [...prev, catWithCard];
          });
          (cat.subcategories || []).forEach(subcat => {
            const subcatWithParents = { ...subcat, categoryTitle: cat.title, cardTitle };
            setSelectedSubcategories(prev => {
              if (prev.some(s => s.title === subcat.title && s.categoryTitle === cat.title && s.cardTitle === cardTitle)) return prev;
              return [...prev, subcatWithParents];
            });
          });
        });
      }
    } else {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
      setSelectedCategories(prevCats => prevCats.filter(c => c.cardTitle !== cardTitle));
      setSelectedSubcategories(prevSubcats => prevSubcats.filter(s => s.cardTitle !== cardTitle));
    }
  };

  const toggleCardWithChildren = (card, forceState = null) => {
    const cardCategories = getCardCategories(card);
    const cardTitle = card.title;
    const isSelected = selectedCards.some(c => c.id === card.id);
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCards(prev => {
        if (prev.some(c => c.id === card.id)) return prev;
        return [...prev, card];
      });
      cardCategories.forEach(cat => {
        const catWithCard = { ...cat, cardTitle };
        setSelectedCategories(prev => {
          if (prev.some(c => c.title === cat.title && c.cardTitle === cardTitle)) return prev;
          return [...prev, catWithCard];
        });
        (cat.subcategories || []).forEach(subcat => {
          const subcatWithParents = { ...subcat, categoryTitle: cat.title, cardTitle };
          setSelectedSubcategories(prev => {
            if (prev.some(s => s.title === subcat.title && s.categoryTitle === cat.title && s.cardTitle === cardTitle)) return prev;
            return [...prev, subcatWithParents];
          });
        });
      });
    } else {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
      setSelectedCategories(prevCats => prevCats.filter(c => c.cardTitle !== cardTitle));
      setSelectedSubcategories(prevSubcats => prevSubcats.filter(s => s.cardTitle !== cardTitle));
    }
  };

  const toggleCategoryOnly = (category, cardTitle, forceState = null) => {
    const categoryWithCard = { ...category, cardTitle };
    const isSelected = selectedCategories.some(c => c.title === category.title && c.cardTitle === cardTitle);
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCategories(prev => {
        if (prev.some(c => c.title === category.title && c.cardTitle === cardTitle)) return prev;
        return [...prev, categoryWithCard];
      });
      (category.subcategories || []).forEach(subcat => {
        const subcatWithParents = { ...subcat, categoryTitle: category.title, cardTitle };
        setSelectedSubcategories(prev => {
          if (prev.some(s => s.title === subcat.title && s.categoryTitle === category.title && s.cardTitle === cardTitle)) return prev;
          return [...prev, subcatWithParents];
        });
      });
      const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
      if (card && !selectedCards.some(c => c.id === card.id)) {
        setSelectedCards(prev => [...prev, card]);
      }
    } else {
      setSelectedCategories(prev => prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle)));
      setSelectedSubcategories(prevSubcats => prevSubcats.filter(s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle)));
    }
  };

  const toggleCategoryWithChildren = (category, cardTitle, forceState = null) => {
    const categoryWithCard = { ...category, cardTitle };
    const isSelected = selectedCategories.some(c => c.title === category.title && c.cardTitle === cardTitle);
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCategories(prev => {
        if (prev.some(c => c.title === category.title && c.cardTitle === cardTitle)) return prev;
        return [...prev, categoryWithCard];
      });
      (category.subcategories || []).forEach(subcat => {
        const subcatWithParents = { ...subcat, categoryTitle: category.title, cardTitle };
        setSelectedSubcategories(prev => {
          if (prev.some(s => s.title === subcat.title && s.categoryTitle === category.title && s.cardTitle === cardTitle)) return prev;
          return [...prev, subcatWithParents];
        });
      });
      const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
      if (card && !selectedCards.some(c => c.id === card.id)) {
        setSelectedCards(prev => [...prev, card]);
      }
    } else {
      setSelectedCategories(prev => prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle)));
      setSelectedSubcategories(prevSubcats => prevSubcats.filter(s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle)));
      const remainingCatsForCard = selectedCategories.filter(c => c.cardTitle === cardTitle && c.title !== category.title);
      if (remainingCatsForCard.length === 0) {
        setSelectedCards(prev => prev.filter(c => c.title !== cardTitle));
      }
    }
  };

  const toggleCategorySelection = (category, cardTitle, forceState = null) => {
    const categoryWithCard = { ...category, cardTitle };
    const isSelected = selectedCategories.some(c => c.title === category.title && c.cardTitle === cardTitle);
    const shouldSelect = forceState !== null ? forceState : !isSelected;

    if (shouldSelect) {
      setSelectedCategories(prev => {
        if (prev.some(c => c.title === category.title && c.cardTitle === cardTitle)) return prev;
        return [...prev, categoryWithCard];
      });
      (category.subcategories || []).forEach(subcat => {
        const subcatWithParents = { ...subcat, categoryTitle: category.title, cardTitle };
        setSelectedSubcategories(prev => {
          if (prev.some(s => s.title === subcat.title && s.categoryTitle === category.title && s.cardTitle === cardTitle)) return prev;
          return [...prev, subcatWithParents];
        });
      });
    } else {
      setSelectedCategories(prev => prev.filter(c => !(c.title === category.title && c.cardTitle === cardTitle)));
      setSelectedSubcategories(prevSubcats => prevSubcats.filter(s => !(s.categoryTitle === category.title && s.cardTitle === cardTitle)));
    }
  };

  const toggleSubcategoryOnly = (subcategory, categoryTitle, cardTitle, forceState = null) => {
    const subcatWithParents = { ...subcategory, categoryTitle, cardTitle };
    setSelectedSubcategories(prev => {
      const exists = prev.find(s => s.title === subcategory.title && s.categoryTitle === categoryTitle && s.cardTitle === cardTitle);
      const shouldSelect = forceState !== null ? forceState : !exists;
      if (shouldSelect) {
        if (exists) return prev;
        return [...prev, subcatWithParents];
      } else {
        return prev.filter(s => !(s.title === subcategory.title && s.categoryTitle === categoryTitle && s.cardTitle === cardTitle));
      }
    });
  };

  const toggleSubcategoryDirect = (subcategory, cardTitle, categoryTitle, forceState = null) => {
    const subcatWithParents = { ...subcategory, cardTitle, categoryTitle: categoryTitle || '' };
    setSelectedSubcategories(prev => {
      const exists = prev.find(s => s.title === subcategory.title && s.cardTitle === cardTitle);
      const shouldSelect = forceState !== null ? forceState : !exists;
      if (shouldSelect) {
        if (exists) return prev;
        return [...prev, subcatWithParents];
      } else {
        return prev.filter(s => !(s.title === subcategory.title && s.categoryTitle === categoryTitle && s.cardTitle === cardTitle));
      }
    });
  };

  const toggleSubcategorySelection = (subcategory, categoryTitle, cardTitle, forceState = null) => {
    const subcatWithParents = { ...subcategory, categoryTitle, cardTitle };
    const exists = selectedSubcategories.find(
      s => s.title === subcategory.title && s.categoryTitle === categoryTitle && s.cardTitle === cardTitle
    );
    const shouldSelect = forceState !== null ? forceState : !exists;

    if (shouldSelect) {
      setSelectedSubcategories(prev => {
        if (prev.some(s => s.title === subcategory.title && s.categoryTitle === categoryTitle && s.cardTitle === cardTitle)) return prev;
        return [...prev, subcatWithParents];
      });
      const categoryExists = selectedCategories.some(c => c.title === categoryTitle && c.cardTitle === cardTitle);
      if (!categoryExists) {
        const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
        const categoryContent = card ? getCardCategories(card).find(cat => cat.title === categoryTitle) : null;
        if (categoryContent) {
          setSelectedCategories(prev => [...prev, { ...categoryContent, cardTitle }]);
        }
      }
      const cardExists = selectedCards.some(c => c.title === cardTitle);
      if (!cardExists) {
        const card = libraryItems.find(c => c.title === cardTitle && c.type === 'card');
        if (card) setSelectedCards(prev => [...prev, card]);
      }
    } else {
      setSelectedSubcategories(prev =>
        prev.filter(s => !(s.title === subcategory.title && s.categoryTitle === categoryTitle && s.cardTitle === cardTitle))
      );
      const remainingSubcatsForCategory = selectedSubcategories.filter(
        s => s.categoryTitle === categoryTitle && s.cardTitle === cardTitle && s.title !== subcategory.title
      );
      if (remainingSubcatsForCategory.length === 0) {
        setSelectedCategories(prev => prev.filter(c => !(c.title === categoryTitle && c.cardTitle === cardTitle)));
        const remainingCatsForCard = selectedCategories.filter(c => c.cardTitle === cardTitle && c.title !== categoryTitle);
        if (remainingCatsForCard.length === 0) {
          setSelectedCards(prev => prev.filter(c => c.title !== cardTitle));
        }
      }
    }
  };

  return {
    selectedCards,
    setSelectedCards,
    selectedCategories,
    setSelectedCategories,
    selectedSubcategories,
    setSelectedSubcategories,
    isCardSelected,
    isCategorySelected,
    isSubcategorySelected,
    toggleCardOnly,
    toggleCardWithChildren,
    toggleCategoryOnly,
    toggleCategoryWithChildren,
    toggleCategorySelection,
    toggleSubcategoryOnly,
    toggleSubcategoryDirect,
    toggleSubcategorySelection,
  };
}
