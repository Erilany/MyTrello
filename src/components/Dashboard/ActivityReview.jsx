import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { loadTagsData } from '../../data/TagsData';
import { loadZonesData } from '../../data/ZonesData';
import { RefreshCw } from 'lucide-react';

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
  return `T${quarter}`;
}

function getQuarterYear(date) {
  return date.getFullYear();
}

function getQuarterColumnsTwoYears() {
  const columns = [];
  const today = new Date();
  const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);
  const currentYear = today.getFullYear();

  // Start from 4 quarters ago (1 year back)
  const startQuarter = currentQuarter - 3;
  const startYear = startQuarter <= 0 ? currentYear - 1 : currentYear;
  const adjustedStartQuarter = startQuarter <= 0 ? startQuarter + 4 : startQuarter;

  const start = new Date(startYear, (adjustedStartQuarter - 1) * 3, 1);

  // Generate 8 quarters (2 years)
  for (let i = 0; i < 8; i++) {
    const q = Math.ceil((start.getMonth() + 1) / 3);
    const y = start.getFullYear();
    columns.push({ quarter: `T${q}`, year: y, label: `T${q} - ${y}` });
    start.setMonth(start.getMonth() + 3);
  }

  return columns;
}

function getItemDateRange(item) {
  const start = item.start_date ? new Date(item.start_date) : new Date(item.created_at);
  const end = item.due_date ? new Date(item.due_date) : null;
  return { start, end };
}

function getSystemTagFromLibrary() {
  try {
    const libraryRaw = localStorage.getItem('mytrello_library_editor');
    if (!libraryRaw) return null;

    const library = JSON.parse(libraryRaw);
    if (!Array.isArray(library)) return null;

    let systemTag = null;
    const findSystemTag = nodes => {
      for (const node of nodes) {
        if (node.data && node.data.systemTag && node.data.systemTag.trim() !== '') {
          systemTag = node.data.systemTag;
          return true;
        }
        if (node.children) {
          if (findSystemTag(node.children)) return true;
        }
      }
      return false;
    };
    findSystemTag(library);
    return systemTag;
  } catch (e) {
    return null;
  }
}

function ActivityReview({ boards, categories, subcategories, columns, currentUsername }) {
  const { syncTagsFromLibrary } = useApp();
  const [projectsData, setProjectsData] = useState([]);
  const [taggedItems, setTaggedItems] = useState([]);
  const [quarterColumns, setQuarterColumns] = useState([]);
  const [tags, setTags] = useState([]);
  const [zones, setZones] = useState([]);
  const [chargeResentie, setChargeResentie] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

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
    if (!boards || !currentUsername) {
      return;
    }

    const systemTag = getSystemTagFromLibrary();

    // Get all boards from storage directly to show all projects with tagged items
    const storageData = JSON.parse(localStorage.getItem('mytrello_db') || '{}');
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

      if (userContacts.length > 0 || true) {
        // Show all projects to see tagged items
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
        });
      }
    }

    setProjectsData(projects);

    if (projects.length > 0) {
      const allItems = [];
      const today = new Date();
      let latestDate = today;

      const boardIds = projects.map(p => p.id);
      const tagsWithFunctions = loadTagsData();

      // Helper to check if item is assigned to current user
      const isAssignedToUser = (item, boardId) => {
        // Check assignee field
        if (item.assignee && item.assignee.toLowerCase().includes(currentUsername.toLowerCase())) {
          return true;
        }
        // Check internal contacts
        const contacts = JSON.parse(
          localStorage.getItem(`board-${boardId}-internalContacts`) || '[]'
        );
        return contacts.some(
          c => c.name && c.name.toLowerCase().trim() === currentUsername.toLowerCase().trim()
        );
      };

      categories.forEach(cat => {
        // Show ONLY if has a tag AND has dates
        if (cat.tag && cat.start_date && cat.due_date) {
          if (cat.card_id) {
            const boardId = Number(cat.card_id);
            const board = boards.find(b => Number(b.id) === boardId);
            if (board) {
              const tagInfo = cat.tag ? tagsWithFunctions.find(t => t.name === cat.tag) : null;
              const tagFunctions = tagInfo?.functions || [];
              const hasMatchingFunction =
                showAllUsers || tagFunctions.length === 0 || tagFunctions.includes(currentUserRole);

              const userAssigned = showAllUsers || isAssignedToUser(cat, boardId);

              if (hasMatchingFunction && userAssigned) {
                allItems.push({
                  ...cat,
                  type: 'category',
                  boardId: board.id,
                  boardTitle: board.title,
                  displayLabel: cat.tag,
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
        // Get tag from subcategory or inherit from parent category
        const category = categories.find(c => Number(c.id) === Number(sub.category_id));
        const itemTag = sub.tag || (category ? category.tag : null);

        // Show if: has a tag AND has dates
        if (itemTag && sub.start_date && sub.due_date) {
          if (category && category.card_id) {
            const boardId = Number(category.card_id);
            const board = boards.find(b => Number(b.id) === boardId);
            if (board) {
              const tagInfo = itemTag ? tagsWithFunctions.find(t => t.name === itemTag) : null;
              const tagFunctions = tagInfo?.functions || [];
              const hasMatchingFunction =
                showAllUsers || tagFunctions.length === 0 || tagFunctions.includes(currentUserRole);

              const userAssigned = showAllUsers || isAssignedToUser(sub, boardId);

              if (hasMatchingFunction && userAssigned) {
                allItems.push({
                  ...sub,
                  type: 'subcategory',
                  boardId: board.id,
                  boardTitle: board.title,
                  displayLabel: itemTag,
                });
                if (sub.due_date) {
                  const dueDate = new Date(sub.due_date);
                  if (dueDate > latestDate) latestDate = dueDate;
                }
              }
            }
          }
        }
      });

      setTaggedItems(allItems);
      const cols = getQuarterColumnsTwoYears();
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

    if (startIdx === -1 && endIdx === -1) return null;

    const startIndex = startIdx !== -1 ? startIdx : 0;
    const endIndex = endIdx !== -1 ? endIdx : quarterCols.length - 1;

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
    setChargeResentie(prev => ({
      ...prev,
      [quarterKey]: level,
    }));
  };

  const getCurrentQuarterKey = () => {
    const today = new Date();
    const q = Math.ceil((today.getMonth() + 1) / 3);
    const y = today.getFullYear();
    return `T${q} - ${y}`;
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

  const currentQuarterKey = getCurrentQuarterKey();
  const quarterWidth = 90;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-std">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-primary">Revue d'activité</h2>
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
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div style={{ minWidth: `${5 * 60 + quarterColumns.length * quarterWidth}px` }}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="bg-card border-b border-std">
                <th className="p-2 text-center text-muted font-medium sticky left-0 bg-card z-30 w-16 border-r border-std">
                  Type
                </th>
                <th className="p-2 text-center text-muted font-medium sticky left-16 bg-card z-30 w-16 border-r border-std">
                  GMR
                </th>
                <th className="p-2 text-left text-muted font-medium sticky left-32 bg-card z-30 min-w-[150px] border-r border-std">
                  Projet
                </th>
                <th className="p-2 text-center text-muted font-medium sticky left-[182px] bg-card z-30 w-20 border-r border-std">
                  Lien
                </th>
                {quarterColumns.map((col, idx) => {
                  const isCurrentQuarter = col.label === currentQuarterKey;
                  return (
                    <th
                      key={col.label}
                      className={`p-2 text-center text-muted font-medium min-w-[${quarterWidth}px] ${
                        isCurrentQuarter ? 'bg-accent/20 border-b-2 border-accent' : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs">{col.quarter}</span>
                        <span className="text-[10px] text-muted">{col.year}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-card-hover border-b border-std">
                <th
                  colSpan={5}
                  className="p-2 text-left font-medium text-primary sticky left-0 bg-card-hover z-30 border-r border-std"
                >
                  Charge ressentie
                </th>
                {quarterColumns.map(col => {
                  const isCurrentQuarter = col.label === currentQuarterKey;
                  return (
                    <th
                      key={col.label}
                      className={`p-2 text-center min-w-[${quarterWidth}px] ${isCurrentQuarter ? 'bg-accent/10' : ''}`}
                    >
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleChargeChange(col.label, 'low')}
                          className={`text-lg p-1 rounded hover:bg-green-100 ${
                            chargeResentie[col.label] === 'low' ? 'bg-green-100' : ''
                          }`}
                          title={`${SMILEY_LEVELS.low.emoji} ${SMILEY_LEVELS.low.label}`}
                        >
                          {SMILEY_LEVELS.low.emoji}
                        </button>
                        <button
                          onClick={() => handleChargeChange(col.label, 'medium')}
                          className={`text-lg p-1 rounded hover:bg-yellow-100 ${
                            chargeResentie[col.label] === 'medium' ? 'bg-yellow-100' : ''
                          }`}
                          title={`${SMILEY_LEVELS.medium.emoji} ${SMILEY_LEVELS.medium.label}`}
                        >
                          {SMILEY_LEVELS.medium.emoji}
                        </button>
                        <button
                          onClick={() => handleChargeChange(col.label, 'high')}
                          className={`text-lg p-1 rounded hover:bg-red-100 ${
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
                  <tr className="bg-accent/10">
                    <td
                      colSpan={5}
                      className="p-2 font-semibold text-primary sticky left-0 bg-accent/10 z-10 border-r border-std"
                    >
                      {zone}
                    </td>
                    <td
                      colSpan={quarterColumns.length}
                      className="p-2 font-semibold text-primary"
                    />
                  </tr>
                  {projects.map(project => {
                    const projectItems = taggedItems.filter(item => item.boardId === project.id);

                    return (
                      <tr key={project.id} className="border-b border-std hover:bg-card-hover">
                        <td className="p-2 text-center font-medium text-accent sticky left-0 bg-card z-10 border-r border-std">
                          {project.activityType}
                        </td>
                        <td className="p-2 text-center text-secondary sticky left-16 bg-card z-10 border-r border-std">
                          {project.gmr || '-'}
                        </td>
                        <td className="p-2 text-primary sticky left-32 bg-card z-10 max-w-[150px] border-r border-std">
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
                        <td className="p-2 text-center sticky left-[182px] bg-card z-10 border-r border-std">
                          <span className="text-xs text-muted">-</span>
                        </td>
                        <td
                          colSpan={quarterColumns.length}
                          className="p-1 border-l border-std min-h-[30px] align-top bg-card-hover"
                        >
                          <div className="flex flex-col gap-1">
                            {projectItems
                              .filter(item => {
                                const pos = getItemPosition(item, quarterColumns);
                                if (!pos) return false;
                                const effectiveTag = item.tag || item.displayLabel;
                                return effectiveTag;
                              })
                              .map((item, idx) => {
                                const pos = getItemPosition(item, quarterColumns);
                                if (!pos) return null;
                                const span = pos.endIndex - pos.startIndex + 1;
                                const cellWidth = 90;
                                const tagValue = item.tag || item.displayLabel || 'Sans tag';
                                return (
                                  <div
                                    key={`${item.type}-${item.id}-${idx}`}
                                    className="px-2 py-1 rounded text-white text-xs truncate"
                                    style={{
                                      backgroundColor: getTagColor(tagValue),
                                      width: `calc(${span} * ${cellWidth}px - 8px)`,
                                    }}
                                    title={`${item.title} - Tag: ${tagValue} | item.tag: ${item.tag} | displayLabel: ${item.displayLabel} (${item.start_date || '?'} à ${item.due_date || '?'})`}
                                  >
                                    {item.title} [{tagValue}]
                                  </div>
                                );
                              })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ActivityReview;
