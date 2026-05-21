import { useState, useEffect, useRef } from 'react';
import { loadGMRData } from '../data/GMRData';
import { loadZonesData } from '../data/ZonesData';
import { loadTagsData } from '../data/TagsData';
import { loadChaptersOrder } from '../data/ChaptersData';

export function useSearchData(boards, cards, subcategories, categories) {
  const [chapters, setChapters] = useState(() => loadChaptersOrder());
  const [gmrs, setGmrs] = useState(() => loadGMRData());
  const [zones, setZones] = useState(() => loadZonesData());
  const [tags, setTags] = useState(() => loadTagsData());
  const [contracts, setContracts] = useState(() => {
    const saved = localStorage.getItem('c-projets_contracts');
    return saved ? JSON.parse(saved) : [];
  });

  const [commandes, setCommandes] = useState(() => {
    const allCommandes = [];
    const savedDb = localStorage.getItem('c-projets_db');
    if (savedDb) {
      const db = JSON.parse(savedDb);
      if (db.boards) {
        db.boards.forEach(board => {
          const boardCommandes = localStorage.getItem(`board-${board.id}-commandes`);
          if (boardCommandes) {
            const parsed = JSON.parse(boardCommandes);
            parsed.forEach(cmd => {
              allCommandes.push({ ...cmd, boardId: board.id, boardName: board.title });
            });
          }
        });
      }
    }
    return allCommandes;
  });

  const loadedRef = useRef(false);

  const loadFromStorage = () => {
    const savedDb = localStorage.getItem('c-projets_db');
    if (savedDb) {
      const db = JSON.parse(savedDb);
      return {
        boards: db.boards || [],
        cards: db.cards || [],
        subcategories: db.subcategories || [],
        categories: db.categories || [],
      };
    }
    return { boards, cards, subcategories, categories: [] };
  };

  const [allBoards, setAllBoards] = useState(() => loadFromStorage().boards);
  const [allCardsData, setAllCardsData] = useState(() => loadFromStorage().cards);
  const [allSubcategoriesData, setAllSubcategoriesData] = useState(
    () => loadFromStorage().subcategories
  );
  const [allCategoriesData, setAllCategoriesData] = useState(() => loadFromStorage().categories);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    setChapters(loadChaptersOrder());
    setGmrs(loadGMRData());
    setZones(loadZonesData());
    setTags(loadTagsData());

    const savedContracts = localStorage.getItem('c-projets_contracts');
    if (savedContracts) setContracts(JSON.parse(savedContracts));

    const allCommandes = [];
    const savedDb = localStorage.getItem('c-projets_db');
    if (savedDb) {
      const db = JSON.parse(savedDb);
      if (db.boards) {
        db.boards.forEach(board => {
          const boardCommandes = localStorage.getItem(`board-${board.id}-commandes`);
          if (boardCommandes) {
            const parsed = JSON.parse(boardCommandes);
            parsed.forEach(cmd => {
              allCommandes.push({ ...cmd, boardId: board.id, boardName: board.title });
            });
          }
        });
      }
    }
    setCommandes(allCommandes);
  }, []);

  useEffect(() => {
    const data = loadFromStorage();
    setAllBoards(data.boards);
    setAllCardsData(data.cards);
    setAllSubcategoriesData(data.subcategories);
    setAllCategoriesData(data.categories);
  }, [boards, cards, subcategories, categories]);

  return {
    chapters,
    gmrs,
    zones,
    tags,
    contracts,
    commandes,
    allBoards,
    allCardsData,
    allSubcategoriesData,
    allCategoriesData,
  };
}
