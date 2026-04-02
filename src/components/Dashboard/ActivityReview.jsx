import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { loadTagsData } from '../../data/TagsData';
import { RefreshCw, ExternalLink } from 'lucide-react';

const ROLE_TO_ACTIVITY = {
  'Manager de projets': 'MP',
  'Chargé(e) de Concertation': 'SCET',
  "Chargé(e) d'Etudes LA": 'LA',
  "Chargé(e) d'Etudes LS": 'LS',
  "Chargé(e) d'Etudes Poste HT": 'PO',
  "Chargé(e) d'Etudes Poste BT et CC": 'CC',
  "Chargé(e) d'Etudes SPC": 'SPC',
  'Contrôleur Travaux': 'CT',
  'Assistant(e) Etudes': 'AE',
};

const SMILEY_LEVELS = {
  low: { emoji: '🟢', color: '#22C55E', label: 'Faible' },
  medium: { emoji: '🟠', color: '#F59E0B', label: 'Moyenne' },
  high: { emoji: '🔴', color: '#EF4444', label: 'Élevée' },
};

function getQuarter(date) {
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `T${quarter}`;
}

function getQuarterYear(date) {
  return date.getFullYear();
}

function getMonthIndexInQuarter(date) {
  return date.getMonth() % 3;
}

function formatDateFrench(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getQuarterColumnsTwoYears() {
  const columns = [];
  const today = new Date();
  const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);
  const currentYear = today.getFullYear();

  // Start from 1 quarter ago
  const startQuarter = currentQuarter - 1;
  const startYear = startQuarter <= 0 ? currentYear - 1 : currentYear;
  const adjustedStartQuarter = startQuarter <= 0 ? startQuarter + 4 : startQuarter;

  const start = new Date(startYear, (adjustedStartQuarter - 1) * 3, 1);

  // Generate 7 quarters (1 past + current + 5 future)
  for (let i = 0; i < 7; i++) {
    const q = Math.ceil((start.getMonth() + 1) / 3);
    const y = start.getFullYear();
    columns.push({ quarter: `T${q}`, year: y, label: `T${q} - ${y}` });
    start.setMonth(start.getMonth() + 3);
  }

  return columns;
}

function getItemDateRange(item) {
  const start = item.startDate
    ? new Date(item.startDate)
    : item.start_date
      ? new Date(item.start_date)
      : null;
  const end = item.endDate
    ? new Date(item.endDate)
    : item.due_date
      ? new Date(item.due_date)
      : null;
  return { start, end };
}

const TAG_VERTICAL_OFFSET = 3;

function ActivityReview({ boards, categories, subcategories, columns, currentUsername, cards }) {
  const { syncTagsFromLibrary } = useApp();
  const [projectsData, setProjectsData] = useState([]);
  const [taggedItems, setTaggedItems] = useState([]);
  const [quarterColumns, setQuarterColumns] = useState([]);
  const [tags, setTags] = useState([]);
  const [chargeResentie, setChargeResentie] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const initializedRef = useRef(false);

  const currentUserRole = localStorage.getItem('c-projets-user-role') || '';

  useEffect(() => {
    setTags(loadTagsData());

    const saved = localStorage.getItem('c-projets_charge_ressentie');
    if (saved) {
      setChargeResentie(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('c-projets_charge_ressentie', JSON.stringify(chargeResentie));
  }, [chargeResentie]);

  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!currentUsername) {
      return;
    }

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
        c => c.name && c.name.toLowerCase().trim() === currentUsername.toLowerCase().trim()
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
              if (!projectTagsMap[board.id]) {
                projectTagsMap[board.id] = {};
              }
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
                if (new Date(cat.start_date) < new Date(existing.startDate)) {
                  existing.startDate = cat.start_date;
                }
                if (new Date(cat.due_date) > new Date(existing.endDate)) {
                  existing.endDate = cat.due_date;
                }
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
                showAllUsers || (tagFunctions.length > 0 && tagFunctions.includes(currentUserRole));

              if (hasMatchingFunction) {
                if (!projectTagsMap[board.id]) {
                  projectTagsMap[board.id] = {};
                }
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
                  if (new Date(sub.start_date) < new Date(existing.startDate)) {
                    existing.startDate = sub.start_date;
                  }
                  if (new Date(sub.due_date) > new Date(existing.endDate)) {
                    existing.endDate = sub.due_date;
                  }
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
          allItems.push({
            ...tagData,
            boardId: Number(boardId),
            boardTitle: board?.title || '',
          });
        });
      });

      setTaggedItems(allItems);
      const cols = getQuarterColumnsTwoYears();
      setQuarterColumns(cols);
    }
  }, [categories, subcategories, columns, cards, currentUsername, currentUserRole, refreshKey]);

  const groupedByZone = useMemo(() => {
    const groups = {};
    const horsZone = [];

    projectsData.forEach(project => {
      if (project.zone && project.zone.trim() !== '') {
        if (!groups[project.zone]) {
          groups[project.zone] = [];
        }
        groups[project.zone].push(project);
      } else {
        horsZone.push(project);
      }
    });

    const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

    if (horsZone.length > 0) {
      sortedGroups.push(['Hors zone', horsZone]);
    }

    return sortedGroups;
  }, [projectsData]);

  const getItemPosition = (item, quarterCols) => {
    const { start, end } = getItemDateRange(item);
    if (!start) return null;

    const startQuarter = getQuarter(start);
    const startYear = getQuarterYear(start);
    const endQuarter = end ? getQuarter(end) : startQuarter;
    const endYear = end ? getQuarterYear(end) : startYear;

    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < quarterCols.length; i++) {
      const col = quarterCols[i];
      if (col.quarter === startQuarter && col.year === startYear) {
        startIdx = i;
      }
      if (col.quarter === endQuarter && col.year === endYear) {
        endIdx = i;
      }
    }

    const startIndex = startIdx !== -1 ? startIdx : 0;
    const endIndex = endIdx !== -1 ? endIdx : quarterCols.length - 1;

    if (startIndex > quarterCols.length - 1 || endIndex < 0) return null;

    return { startIndex, endIndex };
  };

  const getTagColor = tagName => {
    if (!tagName) return '#6B7280';
    const tag = tags.find(t => t.name === tagName);
    if (tag) return tag.color;
    // Fallback colors based on tag name patterns
    if (tagName.toLowerCase().includes('valid')) return '#F59E0B';
    if (tagName.toLowerCase().includes('urgent')) return '#EF4444';
    if (tagName.toLowerCase().includes('attente')) return '#6B7280';
    return '#3B82F6'; // Default blue
  };

  const handleChargeChange = (quarterKey, level) => {
    setChargeResentie(prev => {
      if (prev[quarterKey] === level) {
        const newState = { ...prev };
        delete newState[quarterKey];
        return newState;
      }
      return {
        ...prev,
        [quarterKey]: level,
      };
    });
  };

  const getCurrentQuarterKey = () => {
    const today = new Date();
    const q = Math.ceil((today.getMonth() + 1) / 3);
    const y = today.getFullYear();
    return `T${q} - ${y}`;
  };

  const currentQuarterKey = getCurrentQuarterKey();
  const quarterWidth = 90;
  const currentQuarterIdx = quarterColumns.findIndex(col => col.label === currentQuarterKey);

  if (!currentUsername) {
    return (
      <div className="p-6 text-center text-secondary">
        Veuillez configurer votre nom d&apos;utilisateur dans les paramètres pour accéder à cette
        page.
      </div>
    );
  }

  if (projectsData.length === 0) {
    return (
      <div className="p-6 text-center text-secondary">
        Vous n&apos;êtes actuellement assigné à aucun projet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-std">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-primary">Revue d&apos;activité</h2>
          <span className="text-sm text-muted">({taggedItems.length} élément(s) tagué(s))</span>
        </div>
        <button
          onClick={async () => {
            setSyncing(true);
            const count = await syncTagsFromLibrary();
            setSyncing(false);
            if (count > 0) {
              alert(`${count} élément(s) tagué(s) avec succès depuis la bibliothèque`);
              setRefreshKey(k => k + 1);
            } else {
              alert('Aucun nouveau tag à synchroniser');
            }
          }}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Synchronisation...' : 'Sync tags bibliothèque'}
        </button>
        <button
          onClick={() => setShowAllUsers(!showAllUsers)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border ${
            showAllUsers
              ? 'bg-accent text-white border-accent'
              : 'bg-card text-secondary border-std hover:bg-card-hover'
          }`}
        >
          {showAllUsers ? 'Tous les tags' : 'Mes éléments'}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm table-fixed">
          <thead className="sticky top-0 z-30">
            {/* Ligne 1: En-têtes des colonnes projet + trimestres */}
            <tr className="bg-card border-b border-std h-12">
              {/* Colonnes projet (sticky à gauche) */}
              <th className="p-1 text-center text-muted font-medium w-16 border-r border-std h-12 bg-card sticky left-0 z-10">
                Type
              </th>
              <th className="p-1 text-center text-muted font-medium w-12 border-r border-std h-12 bg-card sticky left-[64px] z-10">
                GMR
              </th>
              <th className="p-1 text-left text-muted font-medium w-[400px] border-r border-std h-12 bg-card sticky left-[112px] z-10">
                Projet
              </th>
              <th className="p-1 text-center text-muted font-medium w-15 border-r border-std h-12 bg-card sticky left-[512px] z-10">
                Lien
              </th>
              {/* Colonnes trimestres */}
              {quarterColumns.map((col, idx) => {
                const isCurrentQuarter = idx === currentQuarterIdx;
                const leftPos = 572 + idx * 90; // 512 (Lien) + 60 (w-15 ≈ 60px) + idx*90
                return (
                  <th
                    key={col.label}
                    className={`p-1 text-center font-medium min-w-[90px] h-12 ${
                      isCurrentQuarter
                        ? 'bg-green-900/50 border-b-2 border-green-500 text-green-300 font-bold'
                        : 'text-muted bg-card'
                    }`}
                    style={{ left: `${leftPos}px`, position: 'sticky', top: 0, zIndex: 30 }}
                  >
                    <div className="flex flex-col h-full items-center justify-center">
                      <span
                        className={`text-xs ${isCurrentQuarter ? 'text-green-300' : 'text-muted'}`}
                      >
                        {col.quarter}
                      </span>
                      <span
                        className={`text-[10px] ${isCurrentQuarter ? 'text-green-400' : 'text-muted'}`}
                      >
                        {col.year}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
            {/* Ligne 2: Charge ressentie */}
            <tr className="bg-card-hover h-12">
              <td
                colSpan={4}
                className="p-1 font-medium text-primary h-12 align-middle bg-card sticky left-0 z-20"
                style={{ top: '48px' }}
              >
                Charge ressentie
              </td>
              {quarterColumns.map((col, colIdx) => {
                const isCurrentQuarter = colIdx === currentQuarterIdx;
                const leftPos = 572 + colIdx * 90;
                return (
                  <th
                    key={col.label}
                    className={`p-1 text-center w-[90px] h-12 ${isCurrentQuarter ? 'bg-green-900/30' : 'bg-card-hover'}`}
                    style={{ left: `${leftPos}px`, position: 'sticky', top: '48px', zIndex: 20 }}
                  >
                    <div className="flex justify-center items-center gap-0.5 h-full">
                      <button
                        onClick={() => handleChargeChange(col.label, 'low')}
                        className={`text-sm p-0.5 rounded hover:bg-green-100 ${
                          chargeResentie[col.label] === 'low' ? 'bg-green-100' : ''
                        }`}
                        title={`${SMILEY_LEVELS.low.emoji} ${SMILEY_LEVELS.low.label}`}
                      >
                        {SMILEY_LEVELS.low.emoji}
                      </button>
                      <button
                        onClick={() => handleChargeChange(col.label, 'medium')}
                        className={`text-sm p-0.5 rounded hover:bg-yellow-100 ${
                          chargeResentie[col.label] === 'medium' ? 'bg-yellow-100' : ''
                        }`}
                        title={`${SMILEY_LEVELS.medium.emoji} ${SMILEY_LEVELS.medium.label}`}
                      >
                        {SMILEY_LEVELS.medium.emoji}
                      </button>
                      <button
                        onClick={() => handleChargeChange(col.label, 'high')}
                        className={`text-sm p-0.5 rounded hover:bg-red-100 ${
                          chargeResentie[col.label] === 'high' ? 'bg-red-100' : ''
                        }`}
                        title={`${SMILEY_LEVELS.high.emoji} ${SMILEY_LEVELS.high.label}`}
                      >
                        {SMILEY_LEVELS.high.emoji}
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groupedByZone.map(([zone, projects]) => (
              <React.Fragment key={zone}>
                <tr className="bg-accent/10 border-b border-std h-12">
                  <td
                    colSpan={4}
                    className="p-1 font-semibold text-primary h-12 align-middle bg-card sticky left-0 z-10"
                  >
                    {zone}
                  </td>
                  {quarterColumns.map((col, colIdx) => {
                    const isCurrentQuarter = colIdx === currentQuarterIdx;
                    const leftPos = 572 + colIdx * 90;
                    return (
                      <td
                        key={col.label}
                        className={`p-1 text-center w-[90px] h-12 align-middle ${isCurrentQuarter ? 'bg-green-900/20' : ''}`}
                        style={{
                          left: `${leftPos}px`,
                          position: 'sticky',
                          top: '96px',
                          zIndex: 10,
                        }}
                      />
                    );
                  })}
                </tr>
                {projects.map(project => {
                  const projectItems = taggedItems.filter(item => item.boardId === project.id);
                  const maxTagsInRow = Math.max(
                    1,
                    ...quarterColumns.map((_, colIdx) => {
                      const itemsInCol = projectItems.filter(item => {
                        const pos = getItemPosition(item, quarterColumns);
                        return (
                          pos && colIdx >= pos.startIndex && colIdx <= pos.endIndex && item.label
                        );
                      }).length;
                      return itemsInCol;
                    })
                  );
                  const rowHeight = Math.max(48, maxTagsInRow * 21 + 6);
                  return (
                    <tr
                      key={project.id}
                      className="border-b border-std hover:bg-card-hover"
                      style={{ height: `${rowHeight}px` }}
                    >
                      <td
                        className="p-1 text-center font-medium text-accent align-middle bg-card sticky left-0 z-10"
                        style={{ height: `${rowHeight}px` }}
                      >
                        {project.activityType}
                      </td>
                      <td
                        className="p-1 text-center text-secondary align-middle bg-card sticky left-[64px] z-10"
                        style={{ height: `${rowHeight}px` }}
                      >
                        {project.gmr || '-'}
                      </td>
                      <td
                        className="p-1 text-primary overflow-hidden align-middle sticky left-[112px] z-10 bg-card-hover"
                        style={{ height: `${rowHeight}px` }}
                      >
                        <div className="text-xs truncate h-full flex items-center">
                          <span className="font-mono bg-card-hover px-1 py-0.5 rounded">
                            {project.priority || '-'}
                          </span>
                          <span className="mx-1 text-muted">|</span>
                          <span className="font-mono text-secondary">{project.ruo || '-'}</span>
                          <span className="mx-1 text-muted">|</span>
                          <span className="font-medium">{project.title}</span>
                          {projectItems.length > 0 && (
                            <span className="ml-2 text-green-500">({projectItems.length})</span>
                          )}
                        </div>
                      </td>
                      <td
                        className="p-1 text-center align-middle border-r border-std sticky left-[512px] z-10 bg-card-hover"
                        style={{ height: `${rowHeight}px` }}
                      >
                        {project.links && project.links.length > 0 ? (
                          <div
                            className="flex flex-col items-center justify-center gap-0.5 h-full"
                            style={{ height: `${rowHeight}px` }}
                          >
                            {project.links.slice(0, 3).map((link, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (link.url) {
                                    window.open(
                                      link.url.startsWith('http')
                                        ? link.url
                                        : `https://${link.url}`,
                                      '_blank'
                                    );
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title={link.title || link.url}
                              >
                                <ExternalLink size={12} />
                              </button>
                            ))}
                            {project.links.length > 3 && (
                              <span className="text-xs text-muted">
                                +{project.links.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                      {quarterColumns.map((_, colIdx) => {
                        const isCurrentQuarterCol = colIdx === currentQuarterIdx;
                        const leftPos = 572 + colIdx * 90;
                        return (
                          <td
                            key={colIdx}
                            className={`p-1 border-r-0 align-middle ${isCurrentQuarterCol ? 'bg-green-900/30' : 'bg-card-hover'}`}
                            style={{
                              left: `${leftPos}px`,
                              position: 'sticky',
                              top: 0,
                              zIndex: 5,
                              width: '90px',
                              height: `${rowHeight}px`,
                            }}
                          >
                            <div
                              className="flex flex-col overflow-visible h-full relative"
                              style={{ height: `${rowHeight}px` }}
                            >
                              {(() => {
                                const groupedByTag = {};
                                projectItems.forEach(item => {
                                  const pos = getItemPosition(item, quarterColumns);
                                  if (!pos || !item.label) return;
                                  if (!groupedByTag[item.label]) {
                                    groupedByTag[item.label] = {
                                      ...item,
                                      startIndex: pos.startIndex,
                                      endIndex: pos.endIndex,
                                    };
                                  } else {
                                    groupedByTag[item.label].startIndex = Math.min(
                                      groupedByTag[item.label].startIndex,
                                      pos.startIndex
                                    );
                                    groupedByTag[item.label].endIndex = Math.max(
                                      groupedByTag[item.label].endIndex,
                                      pos.endIndex
                                    );
                                  }
                                });
                                const groupedItems = Object.values(groupedByTag);
                                return groupedItems.map((item, idx) => {
                                  const isVisible =
                                    item.startIndex <= colIdx && item.endIndex >= colIdx;
                                  if (!isVisible) {
                                    return (
                                      <div
                                        key={`${item.boardId}-${item.label}`}
                                        className="absolute"
                                        style={{
                                          top: idx > 0 ? `${idx * 21}px` : '0px',
                                          height: '18px',
                                          visibility: 'hidden',
                                        }}
                                      />
                                    );
                                  }
                                  const startMonthIdx = getMonthIndexInQuarter(
                                    new Date(item.startDate)
                                  );
                                  const endMonthIdx = getMonthIndexInQuarter(
                                    new Date(item.endDate)
                                  );
                                  const isFirstQuarter = colIdx === item.startIndex;
                                  const isLastQuarter = colIdx === item.endIndex;

                                  let leftPercent = 0;
                                  let widthPercent = 100;

                                  if (isFirstQuarter && isLastQuarter) {
                                    leftPercent = (startMonthIdx / 3) * 100;
                                    widthPercent = ((endMonthIdx - startMonthIdx + 1) / 3) * 100;
                                  } else if (isFirstQuarter) {
                                    leftPercent = (startMonthIdx / 3) * 100;
                                    widthPercent = ((3 - startMonthIdx) / 3) * 100;
                                  } else if (isLastQuarter) {
                                    leftPercent = 0;
                                    widthPercent = ((endMonthIdx + 1) / 3) * 100;
                                  }

                                  return (
                                    <div
                                      key={`${item.boardId}-${item.label}`}
                                      className="px-2 py-1 text-white text-xs truncate absolute"
                                      style={{
                                        backgroundColor: item.color || '#6B7280',
                                        top: idx > 0 ? `${idx * 21}px` : '0px',
                                        height: '18px',
                                        left: `${leftPercent}%`,
                                        width: `${widthPercent}%`,
                                        minWidth: '20px',
                                        maxWidth: '100%',
                                        borderRadius:
                                          isFirstQuarter && isLastQuarter
                                            ? '4px'
                                            : isFirstQuarter
                                              ? '4px 0 0 4px'
                                              : isLastQuarter
                                                ? '0 4px 4px 0'
                                                : '0',
                                      }}
                                      title={`${item.label} (${formatDateFrench(item.startDate)} au ${formatDateFrench(item.endDate)})`}
                                    />
                                  );
                                });
                              })()}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActivityReview;
