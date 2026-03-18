import React, { useState, useEffect, useMemo } from 'react';
import { loadTagsData } from '../../data/TagsData';
import { loadZonesData } from '../../data/ZonesData';

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
  low: { emoji: '😊', color: '#22C55E', label: 'Faible' },
  medium: { emoji: '😐', color: '#F59E0B', label: 'Moyenne' },
  high: { emoji: '😰', color: '#EF4444', label: 'Élevée' },
};

function getQuarter(date) {
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `T${quarter} - ${date.getFullYear()}`;
}

function getQuarterColumns(fromDate, toDate) {
  const columns = [];
  const current = new Date(fromDate);
  current.setDate(1);
  current.setMonth(Math.floor(current.getMonth() / 3) * 3);

  while (current <= toDate) {
    columns.push(getQuarter(current));
    current.setMonth(current.getMonth() + 3);
  }
  return columns;
}

function getItemDateRange(item) {
  const start = item.start_date ? new Date(item.start_date) : new Date(item.created_at);
  const end = item.due_date ? new Date(item.due_date) : null;
  return { start, end };
}

function ActivityReview({ boards, categories, subcategories, columns, currentUsername }) {
  const [projectsData, setProjectsData] = useState([]);
  const [taggedItems, setTaggedItems] = useState([]);
  const [quarterColumns, setQuarterColumns] = useState([]);
  const [tags, setTags] = useState([]);
  const [zones, setZones] = useState([]);
  const [chargeResentie, setChargeResentie] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUserRole = localStorage.getItem('mytrello-user-role') || '';

  useEffect(() => {
    setTags(loadTagsData());
    setZones(loadZonesData());

    const saved = localStorage.getItem('mytrello_charge_resentie');
    if (saved) {
      setChargeResentie(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mytrello_charge_resentie', JSON.stringify(chargeResentie));
  }, [chargeResentie]);

  useEffect(() => {
    const handleStorageChange = () => {
      console.log('[ActivityReview] storage event detected');
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
    console.log('[ActivityReview] Refreshing data with key:', refreshKey);
  }, [refreshKey]);

  useEffect(() => {
    if (!boards || !currentUsername) {
      console.log('[ActivityReview] Skipping - no boards or username');
      return;
    }

    console.log('[ActivityReview] Loading projects data...');

    const projects = [];

    for (const board of boards) {
      const internalContacts = JSON.parse(
        localStorage.getItem(`board-${board.id}-internalContacts`) || '[]'
      );
      const boardGMR = localStorage.getItem(`board-${board.id}-gmr`) || '';
      const boardPriority = localStorage.getItem(`board-${board.id}-priority`) || '';
      const boardZone = localStorage.getItem(`board-${board.id}-zone`) || '';
      const eotpLines = JSON.parse(localStorage.getItem(`board-${board.id}-eotp`) || '[]');

      console.log(
        `[ActivityReview] Board ${board.id}: GMR=${boardGMR}, Priority=${boardPriority}, Zone=${boardZone}`
      );

      const userContacts = internalContacts.filter(
        c => c.name && c.name.toLowerCase().trim() === currentUsername.toLowerCase().trim()
      );

      if (userContacts.length > 0) {
        const userRoleTitles = userContacts.map(c => c.title);

        let activityType = '';

        const hasPO = userRoleTitles.includes("Chargé(e) d'Etudes Poste HT");
        const hasCC = userRoleTitles.includes("Chargé(e) d'Etudes Poste BT et CC");

        if (hasPO && hasCC) {
          activityType = 'PO/CC';
        } else {
          activityType = userRoleTitles
            .map(title => ROLE_TO_ACTIVITY[title] || '')
            .filter(Boolean)
            .join('/');
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
        });
      }
    }

    console.log('[ActivityReview] Setting projectsData:', projects);
    setProjectsData(projects);

    if (projects.length > 0) {
      const allItems = [];
      const today = new Date();
      let latestDate = today;

      const boardIds = projects.map(p => p.id);
      const tagsWithFunctions = loadTagsData();

      categories.forEach(cat => {
        if (cat.tag && cat.card_id) {
          const boardId = Number(cat.card_id);
          if (boardIds.includes(boardId)) {
            const board = boards.find(b => Number(b.id) === boardId);
            if (board) {
              const tagInfo = tagsWithFunctions.find(t => t.name === cat.tag);
              const tagFunctions = tagInfo?.functions || [];
              const hasMatchingFunction =
                tagFunctions.length === 0 || tagFunctions.includes(currentUserRole);

              if (hasMatchingFunction) {
                allItems.push({
                  ...cat,
                  type: 'category',
                  boardId: board.id,
                  boardTitle: board.title,
                });
                if (cat.due_date) {
                  const dueDate = new Date(cat.due_date);
                  if (dueDate > latestDate) latestDate = dueDate;
                }
              }
            }
          }
        }
      });

      subcategories.forEach(sub => {
        if (sub.tag) {
          const category = categories.find(c => Number(c.id) === Number(sub.category_id));
          if (category && category.card_id) {
            const boardId = Number(category.card_id);
            if (boardIds.includes(boardId)) {
              const board = boards.find(b => Number(b.id) === boardId);
              if (board) {
                const tagInfo = tagsWithFunctions.find(t => t.name === sub.tag);
                const tagFunctions = tagInfo?.functions || [];
                const hasMatchingFunction =
                  tagFunctions.length === 0 || tagFunctions.includes(currentUserRole);

                if (hasMatchingFunction) {
                  allItems.push({
                    ...sub,
                    type: 'subcategory',
                    boardId: board.id,
                    boardTitle: board.title,
                  });
                  if (sub.due_date) {
                    const dueDate = new Date(sub.due_date);
                    if (dueDate > latestDate) latestDate = dueDate;
                  }
                }
              }
            }
          }
        }
      });

      setTaggedItems(allItems);
      const cols = getQuarterColumns(today, latestDate);
      setQuarterColumns(cols);
    }
  }, [boards, categories, subcategories, columns, currentUsername, currentUserRole, refreshKey]);

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

  const tagsUsedInProjects = useMemo(() => {
    const usedTagNames = new Set();
    taggedItems.forEach(item => {
      if (item.tag) {
        usedTagNames.add(item.tag);
      }
    });
    return tags.filter(tag => usedTagNames.has(tag.name));
  }, [taggedItems, tags]);

  const getItemPosition = (item, quarterCols) => {
    const { start, end } = getItemDateRange(item);
    if (!start) return null;

    const startQuarter = getQuarter(start);
    const endQuarter = end ? getQuarter(end) : startQuarter;

    const startIdx = quarterCols.indexOf(startQuarter);
    const endIdx = quarterCols.indexOf(endQuarter);

    if (startIdx === -1 && endIdx === -1) return null;

    const startIndex = startIdx !== -1 ? startIdx : 0;
    const endIndex = endIdx !== -1 ? endIdx : quarterCols.length - 1;

    return { startIndex, endIndex };
  };

  const getTagColor = tagName => {
    const tag = tags.find(t => t.name === tagName);
    return tag ? tag.color : '#6B7280';
  };

  const handleChargeChange = (quarter, level) => {
    setChargeResentie(prev => ({
      ...prev,
      [quarter]: level,
    }));
  };

  if (!currentUsername) {
    return (
      <div className="p-6 text-center text-secondary">
        Veuillez configurer votre nom d'utilisateur dans les paramètres pour accéder à cette page.
      </div>
    );
  }

  if (projectsData.length === 0) {
    return (
      <div className="p-6 text-center text-secondary">
        Vous n'êtes actuellement assigné à aucun projet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[800px]">
          <thead>
            <tr className="bg-card border-b border-std">
              <th className="p-2 text-center text-muted font-medium sticky left-0 bg-card z-10 w-16">
                Type
              </th>
              <th className="p-2 text-center text-muted font-medium sticky left-16 bg-card z-10 w-16">
                GMR
              </th>
              <th className="p-2 text-left text-muted font-medium sticky left-32 bg-card z-10 min-w-[120px]">
                Projet
              </th>
              <th className="p-2 text-center text-muted font-medium sticky left-32 bg-card z-10 w-24">
                Lien
              </th>
              {quarterColumns.map(col => (
                <th key={col} className="p-2 text-center text-muted font-medium min-w-[80px]">
                  {col}
                </th>
              ))}
            </tr>
            <tr className="bg-card-hover border-b border-std">
              <th
                colSpan={4}
                className="p-2 text-left font-medium text-primary sticky left-0 bg-card-hover z-10"
              >
                Charge ressentie
              </th>
              {quarterColumns.map(col => (
                <th key={col} className="p-2 text-center min-w-[80px]">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => handleChargeChange(col, 'low')}
                      className={`text-lg p-1 rounded hover:bg-green-100 ${
                        chargeResentie[col] === 'low' ? 'bg-green-100' : ''
                      }`}
                      title={`${SMILEY_LEVELS.low.emoji} ${SMILEY_LEVELS.low.label}`}
                    >
                      {SMILEY_LEVELS.low.emoji}
                    </button>
                    <button
                      onClick={() => handleChargeChange(col, 'medium')}
                      className={`text-lg p-1 rounded hover:bg-yellow-100 ${
                        chargeResentie[col] === 'medium' ? 'bg-yellow-100' : ''
                      }`}
                      title={`${SMILEY_LEVELS.medium.emoji} ${SMILEY_LEVELS.medium.label}`}
                    >
                      {SMILEY_LEVELS.medium.emoji}
                    </button>
                    <button
                      onClick={() => handleChargeChange(col, 'high')}
                      className={`text-lg p-1 rounded hover:bg-red-100 ${
                        chargeResentie[col] === 'high' ? 'bg-red-100' : ''
                      }`}
                      title={`${SMILEY_LEVELS.high.emoji} ${SMILEY_LEVELS.high.label}`}
                    >
                      {SMILEY_LEVELS.high.emoji}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedByZone.map(([zone, projects]) => (
              <React.Fragment key={zone}>
                <tr className="bg-accent/10">
                  <td
                    colSpan={4 + quarterColumns.length}
                    className="p-2 font-semibold text-primary"
                  >
                    {zone}
                  </td>
                </tr>
                {projects.map(project => {
                  const projectItems = taggedItems.filter(item => item.boardId === project.id);

                  return (
                    <tr key={project.id} className="border-b border-std hover:bg-card-hover">
                      <td className="p-2 text-center font-medium text-accent sticky left-0 bg-card z-10">
                        {project.activityType}
                      </td>
                      <td className="p-2 text-center text-secondary sticky left-16 bg-card z-10">
                        {project.gmr || '-'}
                      </td>
                      <td className="p-2 text-primary sticky left-32 bg-card z-10 max-w-[120px]">
                        <div className="text-xs truncate">
                          <span className="font-mono bg-card-hover px-1 py-0.5 rounded">
                            {project.priority || '-'}
                          </span>
                          <span className="mx-1 text-muted">|</span>
                          <span className="font-mono text-secondary">{project.ruo || '-'}</span>
                          <span className="mx-1 text-muted">|</span>
                          <span className="font-medium">{project.title}</span>
                        </div>
                      </td>
                      <td className="p-2 text-center sticky left-32 bg-card z-10">
                        <span className="text-xs text-muted">-</span>
                      </td>
                      {quarterColumns.map((col, colIdx) => (
                        <td key={col} className="p-1 border-l border-std min-h-[40px] align-top">
                          <div className="flex flex-wrap gap-1">
                            {projectItems
                              .filter(item => {
                                const pos = getItemPosition(item, quarterColumns);
                                return pos && pos.startIndex <= colIdx && pos.endIndex >= colIdx;
                              })
                              .map((item, idx) => (
                                <div
                                  key={`${item.type}-${item.id}-${idx}`}
                                  className="px-1 py-0.5 rounded text-white text-xs truncate max-w-full"
                                  style={{ backgroundColor: getTagColor(item.tag) }}
                                  title={`${item.title}${item.type === 'category' ? ' (Action)' : ' (Tâche)'}`}
                                >
                                  {item.title.length > 15
                                    ? item.title.substring(0, 15) + '...'
                                    : item.title}
                                </div>
                              ))}
                          </div>
                        </td>
                      ))}
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
