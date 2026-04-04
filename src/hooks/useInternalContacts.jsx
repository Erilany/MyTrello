import { useCallback } from 'react';

export function useInternalContacts() {
  const getInternalContacts = useCallback(boardId => {
    const defaultContacts = [
      { id: 1, title: 'Manager de projets' },
      { id: 2, title: 'Chargé(e) de Concertation' },
      { id: 3, title: "Chargé(e) d'Etudes LA" },
      { id: 4, title: "Chargé(e) d'Etudes LS" },
      { id: 5, title: "Chargé(e) d'Etudes Poste HT" },
      { id: 6, title: "Chargé(e) d'Etudes Poste BT et CC" },
      { id: 7, title: "Chargé(e) d'Etudes SPC" },
      { id: 8, title: 'Contrôleur Travaux' },
      { id: 9, title: 'Assistant(e) Etudes' },
    ];
    if (!boardId) return defaultContacts;
    const saved = localStorage.getItem(`board-${boardId}-internalContacts`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultContacts;
      }
    }
    return defaultContacts;
  }, []);

  return { getInternalContacts };
}

export default useInternalContacts;
