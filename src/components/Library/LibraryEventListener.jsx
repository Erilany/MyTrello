import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export function LibraryEventListener() {
  const { saveToLibrary, loadLibrary } = useApp();

  useEffect(() => {
    const handleLibrarySave = async e => {
      const { itemType, content, title } = e.detail;

      try {
        const parsedContent = JSON.parse(content);

        let dbType = itemType;
        let dbTitle = title;
        let dbContent = content;

        if (itemType === 'card' && parsedContent.card) {
          dbType = 'card';
          dbTitle = parsedContent.card.title || title;
          dbContent = content;
        } else if (itemType === 'category' && parsedContent.category) {
          dbType = 'category';
          dbTitle = parsedContent.category.title || title;
        } else if (itemType === 'subcategory' && parsedContent.subcategory) {
          dbType = 'subcategory';
          dbTitle = parsedContent.subcategory.title || title;
        }

        await saveToLibrary(dbType, dbTitle, dbContent);
        alert('Élément sauvegardé dans la bibliothèque !');
      } catch (error) {
        console.error('[LibraryEventListener] Error saving to library:', error);
        alert('Erreur lors de la sauvegarde');
      }
    };

    const handleLibraryRefresh = () => {
      loadLibrary();
    };

    window.addEventListener('library-save', handleLibrarySave);
    window.addEventListener('library-refreshed', handleLibraryRefresh);
    return () => {
      window.removeEventListener('library-save', handleLibrarySave);
      window.removeEventListener('library-refreshed', handleLibraryRefresh);
    };
  }, [saveToLibrary, loadLibrary]);

  return null;
}

export default LibraryEventListener;
