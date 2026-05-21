import { useState, useEffect, useMemo } from 'react';
import { loadTagsData } from '../data/TagsData';
import {
  ROLE_TO_ACTIVITY,
  getQuarterColumnsTwoYears,
} from '../components/Dashboard/activityReviewUtils';

export function useActivityData(username, cards, columns, categories, subcategories, showAllUsers) {
  const currentUserRole = localStorage.getItem('c-projets-user-role') || '';

  const [projectsData, setProjectsData] = useState([]);
  const [taggedItems, setTaggedItems] = useState([]);
  const [quarterColumns, setQuarterColumns] = useState([]);
  const [tags, setTags] = useState([]);
  const [chargeResentie, setChargeResentie] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setTags(loadTagsData());
    const saved = localStorage.getItem('c-projets_charge_ressentie');
    if (saved) setChargeResentie(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('c-projets_charge_ressentie', JSON.stringify(chargeResentie));
  }, [chargeResentie]);

  useEffect(() => {
    const handleStorageChange = () => setRefreshKey(k => k + 1);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!username) return;

    const storageData = JSON.parse(localStorage.getItem('c-projets_db') || '{}');
    const allBoardsFromStorage = storageData.boards || [];
    const projects = [];

    for (const board of allBoardsFromStorage) {
      const internalContacts = JSON.parse(
        localStorage.getItem(`board-${board.id}-internalContacts`) || '[]'
      );
      const boardGMR = localStorage.getItem(`board-${board.id}-gmr`) || '';
      const boardPriority = localStorage.getItem(`board-${board.id}-priority`) || '';
      const boardZone = localStorage.getItem(`board-${board.id}-zone`) || '';
      const eotpLines = JSON.parse(localStorage.getItem(`board-${board.id}-eotp`) || '[]');

      const userContacts = internalContacts.filter(
        c => c.name && c.name.toLowerCase().trim() === username.toLowerCase().trim()
      );

      const boardLinks = JSON.parse(localStorage.getItem(`board-${board.id}-links`) || '[]');

      if (userContacts.length > 0) {
        const userRoleTitles = userContacts.map(c => c.title);
        let activityType = '';
        const hasPO = userRoleTitles.includes("Chargé(e) d'Etudes Poste HT");
        const hasCC = userRoleTitles.includes("Chargé(e) d'Etudes Poste BT et CC");

        if (hasPO && hasCC) {
          activityType = 'PO/CC';
        } else if (userRoleTitles.length > 0) {
          activityType = userRoleTitles
            .map(title => ROLE_TO_ACTIVITY[title] || '')
            .filter(Boolean)
            .join('/');
        } else {
          activityType = '-';
        }

        const ruo =
          eotpLines.length > 0
            ? eotpLines
                .map(l => l.ruo)
                .filter(Boolean)
                .join(', ')
            : '';

        projects.push({
          id: board.id,
          title: board.title,
          gmr: boardGMR.slice(0, 4),
          priority: boardPriority,
          zone: boardZone,
          ruo,
          activityType,
          userRoles: userRoleTitles,
          links: boardLinks,
        });
      }
    }

    setProjectsData(projects);

    if (projects.length > 0) {
      const tagsWithFunctions = loadTagsData();
      const projectTagsMap = {};

      const findBoardForCategory = cat => {
        if (!cat.card_id || !cards || !columns || !allBoardsFromStorage) return null;
        const card = cards.find(c => Number(c.id) === Number(cat.card_id));
        if (!card) return null;
        const column = columns.find(col => Number(col.id) === Number(card.column_id));
        if (!column) return null;
        return allBoardsFromStorage.find(b => Number(b.id) === Number(column.board_id));
      };

      categories.forEach(cat => {
        if (cat.tag && cat.start_date && cat.due_date) {
          const board = findBoardForCategory(cat);
          if (board) {
            const tagInfo = cat.tag ? tagsWithFunctions.find(t => t.name === cat.tag) : null;
            const tagFunctions = tagInfo?.functions || [];
            const hasMatchingFunction =
              showAllUsers || (tagFunctions.length > 0 && tagFunctions.includes(currentUserRole));

            if (hasMatchingFunction) {
              if (!projectTagsMap[board.id]) projectTagsMap[board.id] = {};
              const tagName = cat.tag;
              if (!projectTagsMap[board.id][tagName]) {
                projectTagsMap[board.id][tagName] = {
                  label: tagName,
                  color: tagInfo?.color || '#6B7280',
                  startDate: cat.start_date,
                  endDate: cat.due_date,
                };
              } else {
                const existing = projectTagsMap[board.id][tagName];
                if (new Date(cat.start_date) < new Date(existing.startDate))
                  existing.startDate = cat.start_date;
                if (new Date(cat.due_date) > new Date(existing.endDate))
                  existing.endDate = cat.due_date;
              }
            }
          }
        }
      });

      subcategories.forEach(sub => {
        const category = categories.find(c => Number(c.id) === Number(sub.category_id));
        const itemTag = sub.tag || (category ? category.tag : null);

        if (itemTag && sub.start_date && sub.due_date) {
          if (category) {
            const board = findBoardForCategory(category);
            if (board) {
              const tagInfo = itemTag ? tagsWithFunctions.find(t => t.name === itemTag) : null;
              const tagFunctions = tagInfo?.functions || [];
              const hasMatchingFunction =
                showAllUsers ||
                (tagFunctions.length > 0 && tagFunctions.includes(currentUserRole));

              if (hasMatchingFunction) {
                if (!projectTagsMap[board.id]) projectTagsMap[board.id] = {};
                const tagName = itemTag;
                if (!projectTagsMap[board.id][tagName]) {
                  projectTagsMap[board.id][tagName] = {
                    label: tagName,
                    color: tagInfo?.color || '#6B7280',
                    startDate: sub.start_date,
                    endDate: sub.due_date,
                  };
                } else {
                  const existing = projectTagsMap[board.id][tagName];
                  if (new Date(sub.start_date) < new Date(existing.startDate))
                    existing.startDate = sub.start_date;
                  if (new Date(sub.due_date) > new Date(existing.endDate))
                    existing.endDate = sub.due_date;
                }
              }
            }
          }
        }
      });

      const allItems = [];
      Object.entries(projectTagsMap).forEach(([boardId, tagsMap]) => {
        const board = allBoardsFromStorage.find(b => Number(b.id) === Number(boardId));
        Object.values(tagsMap).forEach(tagData => {
          allItems.push({ ...tagData, boardId: Number(boardId), boardTitle: board?.title || '' });
        });
      });

      setTaggedItems(allItems);
      const cols = getQuarterColumnsTwoYears();
      setQuarterColumns(cols);
    }
  }, [categories, subcategories, columns, cards, username, currentUserRole, refreshKey]);

  const groupedByZone = useMemo(() => {
    const groups = {};
    const horsZone = [];

    projectsData.forEach(project => {
      if (project.zone && project.zone.trim() !== '') {
        if (!groups[project.zone]) groups[project.zone] = [];
        groups[project.zone].push(project);
      } else {
        horsZone.push(project);
      }
    });

    const sortedGroups = Object.entries(groups).sort((a, b) =>
      String(a[0]).localeCompare(String(b[0]))
    );
    if (horsZone.length > 0) sortedGroups.push(['Hors zone', horsZone]);
    return sortedGroups;
  }, [projectsData]);

  return {
    projectsData,
    taggedItems,
    quarterColumns,
    tags,
    chargeResentie,
    setChargeResentie,
    refreshKey,
    groupedByZone,
  };
}
