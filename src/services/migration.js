import { loadGMRData } from '../data/GMRData';
import { loadPriorityData } from '../data/PriorityData';
import { loadZonesData } from '../data/ZonesData';
import { loadTagsData } from '../data/TagsData';
import { loadChaptersOrder } from '../data/ChaptersData';
import { validateImportDataWithSchema } from '../utils/importSchema';

export const CURRENT_VERSION = '2.0';

export const validateImportData = data => {
  if (!data) {
    return { valid: false, errors: ['Aucune donnée trouvée'], warnings: [], version: null };
  }

  if (!data.data && !data.databases) {
    return {
      valid: false,
      errors: ['Format invalide : aucune structure de données trouvée (clé "data" ou "databases" manquante)'],
      warnings: [],
      version: data.version || null,
    };
  }

  return validateImportDataWithSchema(data);
};

export const migrateFromV1ToV2 = data => {

  const migrated = {
    version: CURRENT_VERSION,
    exportedAt: data.exportedAt || new Date().toISOString(),
    migratedFrom: '1.0',
    migratedAt: new Date().toISOString(),

    databases: {
      core: data.data || {},
      params: data.databases || {},
      library: data.libraryEditor || [],
      contracts: data.contracts || [],
    },

    settings: data.settings ||
      data.data?.settings || {
        username: data.data?.username || '',
        userRole: data.data?.userRole || '',
      },

    projectTime: data.projectTime || {},

    libraryFavorites: data.libraryFavorites || {},
    libraryTemplates: data.libraryTemplates || { templates: [] },

    projects: [],
  };

  if (data.projectsData) {
    migrated.projects = Object.entries(data.projectsData).map(([id, projectData]) => ({
      id: parseInt(id),
      ...projectData,
    }));
  }

  if (data.databases?.chaptersOrder) {
    migrated.databases.params.chaptersOrder = data.databases.chaptersOrder;
  }


  return migrated;
};

export const normalizeImportData = data => {
  const { valid, version, errors, warnings } = validateImportData(data);

  if (!valid) {
    console.error('[Migration] Données invalides:', errors);
    return { success: false, errors, data: null };
  }

  let normalizedData = data;

  if (version === '1.0') {
    normalizedData = migrateFromV1ToV2(data);
  } else if (version === CURRENT_VERSION) {
    normalizedData = addDefaultColumns(normalizedData);
  } else {
    console.warn('[Migration] Version inconnue:', version);
  }

  return {
    success: true,
    errors: [],
    warnings,
    data: normalizedData,
  };
};

const addDefaultColumns = data => {
  if (!data.databases?.core) return data;

  const core = { ...data.databases.core };

  if (!core.columns || core.columns.length === 0) {
    core.columns = [];
    let nextColId = 1;

    core.boards.forEach(board => {
      const defaultColumns = [
        { id: nextColId++, board_id: board.id, title: 'À faire', position: 0, color: '#4A90D9' },
        { id: nextColId++, board_id: board.id, title: 'En cours', position: 1, color: '#F5A623' },
        { id: nextColId++, board_id: board.id, title: 'En attente', position: 2, color: '#9CA3AF' },
        { id: nextColId++, board_id: board.id, title: 'Terminée', position: 3, color: '#7ED321' },
        { id: nextColId++, board_id: board.id, title: 'Archiver', position: 4, color: '#475569' },
      ];
      core.columns.push(...defaultColumns);
    });
  }

  return {
    ...data,
    databases: {
      ...data.databases,
      core,
    },
  };
};

export const generateExportData = (db, options = {}) => {
  const {
    includeProjectTime = true,
    includeLibrary = true,
    includeSettings = true,
    includeDatabases = true,
  } = options;

  const projectDataKeys = [
    'links',
    'commandes',
    'eotp',
    'internalContacts',
    'externalContacts',
    'gmr',
    'priority',
    'zone',
  ];

  const projects = [];
  if (db.boards) {
    db.boards.forEach(board => {
      const project = { id: board.id };
      projectDataKeys.forEach(key => {
        const stored = localStorage.getItem(`board-${board.id}-${key}`);
        if (stored) {
          try {
            project[key] = JSON.parse(stored);
          } catch {
            project[key] = stored;
          }
        }
      });
      projects.push(project);
    });
  }

  const exportObj = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    databases: {
      core: db,
      params: {
        gmr: loadGMRData(),
        priority: loadPriorityData(),
        zones: loadZonesData(),
        tags: loadTagsData(),
        chaptersOrder: loadChaptersOrder(),
      },
      library: (() => {
        try {
          const e = localStorage.getItem('c-projets_library_editor');
          return e ? JSON.parse(e) : [];
        } catch {
          return [];
        }
      })(),
      contracts: (() => {
        try {
          const e = localStorage.getItem('c-projets_contracts');
          return e ? JSON.parse(e) : [];
        } catch {
          return [];
        }
      })(),
      entreprises: (() => {
        try {
          const e = localStorage.getItem('c-projets_entreprises');
          return e ? JSON.parse(e) : [];
        } catch {
          return [];
        }
      })(),
    },
    settings: includeSettings
      ? {
          theme: localStorage.getItem('c-projets-theme'),
          cardColors: (() => {
            try {
              return JSON.parse(localStorage.getItem('c-projets-cardColors'));
            } catch {
              return null;
            }
          })(),
          username: localStorage.getItem('c-projets-username'),
          userRole: localStorage.getItem('c-projets-user-role'),
          chargeResentie: (() => {
            try {
              return JSON.parse(localStorage.getItem('c-projets_charge_ressentie') || '{}');
            } catch {
              return {};
            }
          })(),
          filterMyProjects: localStorage.getItem('c-projets-filter-my-projects'),
          usersList: (() => {
            try {
              return JSON.parse(localStorage.getItem('c-projets-users') || '[]');
            } catch {
              return [];
            }
          })(),
        }
      : {},
    projectTime: includeProjectTime
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('c-projets_project_time') || '{}');
          } catch {
            return {};
          }
        })()
      : {},
    libraryFavorites: includeLibrary
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('c-projets_library_favorites') || '{}');
          } catch {
            return {};
          }
        })()
      : {},
    libraryTemplates: includeLibrary
      ? (() => {
          try {
            return JSON.parse(
              localStorage.getItem('c-projets_library_templates') || '{"templates":[]}'
            );
          } catch {
            return { templates: [] };
          }
        })()
      : {},
    projects,
    planning: includeSettings
      ? (() => {
          try {
            const planningData = {};
            if (db.boards) {
              db.boards.forEach(board => {
                const saved = localStorage.getItem(`planning_${board.id}`);
                if (saved) {
                  planningData[board.id] = JSON.parse(saved);
                }
              });
            }
            return planningData;
          } catch {
            return {};
          }
        })()
      : {},
  };

  return exportObj;
};

export const downloadExport = (data, usernameForExport = null) => {
  let filename = `c-projets-backup-${new Date().toISOString().split('T')[0]}.json`;

  if (usernameForExport && usernameForExport.trim()) {
    const parts = usernameForExport.trim().split(' ');
    const nom = parts[0] || '';
    const prenom = parts.slice(1).join(' ') || '';
    const code = (nom + prenom.substring(0, 3)).toLowerCase();
    filename = `mytrello-${code}-${new Date().toISOString().split('T')[0]}.json`;
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  setTimeout(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export const mergeExportData = (userAData, userBData) => {
  const errors = [];
  const warnings = [];
  const conflicts = [];
  const merged = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    databases: {
      core: { boards: [], columns: [], cards: [], categories: [], subcategories: [] },
      params: userAData.databases?.params || userBData.databases?.params || {},
      library: [],
      contracts: [],
      entreprises: [],
    },
    settings: {},
    projectTime: {},
    libraryFavorites: {},
    libraryTemplates: { templates: [] },
    projects: [],
    planning: {},
  };

  const userAName = userAData.settings?.username || 'Utilisateur A';
  const userBName = userBData.settings?.username || 'Utilisateur B';

  const coreA = userAData.databases?.core || userAData.data || {};
  const coreB = userBData.databases?.core || userBData.data || {};

  const mergeArrayById = (arrA, arrB, type, idField = 'id') => {
    const mapA = new Map((arrA || []).map(item => [item[idField], { ...item, source: userAName }]));
    const mapB = new Map((arrB || []).map(item => [item[idField], { ...item, source: userBName }]));
    const result = [];
    const allIds = new Set([...mapA.keys(), ...mapB.keys()]);

    allIds.forEach(id => {
      const itemA = mapA.get(id);
      const itemB = mapB.get(id);

      if (itemA && itemB) {
        const isEqual = JSON.stringify(itemA) === JSON.stringify(itemB);
        if (!isEqual) {
          conflicts.push({
            type,
            id,
            userA: { name: userAName, data: itemA },
            userB: { name: userBName, data: itemB },
          });
        }
        result.push({ ...itemA, ...itemB, source: `${userAName} + ${userBName}` });
      } else if (itemA) {
        result.push({ ...itemA, source: userAName });
      } else if (itemB) {
        result.push({ ...itemB, source: userBName });
      }
    });

    return result;
  };

  merged.databases.core.boards = mergeArrayById(coreA.boards, coreB.boards, 'boards');
  merged.databases.core.columns = mergeArrayById(coreA.columns, coreB.columns, 'columns');
  merged.databases.core.cards = mergeArrayById(coreA.cards, coreB.cards, 'cards');
  merged.databases.core.categories = mergeArrayById(
    coreA.categories,
    coreB.categories,
    'categories'
  );
  merged.databases.core.subcategories = mergeArrayById(
    coreA.subcategories,
    coreB.subcategories,
    'subcategories'
  );

  const mergeArrayByName = (arrA, arrB, type) => {
    const mapA = new Map(
      (arrA || []).map(item => [item.nom || item.name || item.id, { ...item, source: userAName }])
    );
    const mapB = new Map(
      (arrB || []).map(item => [item.nom || item.name || item.id, { ...item, source: userBName }])
    );
    const result = [];
    const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);

    allKeys.forEach(key => {
      const itemA = mapA.get(key);
      const itemB = mapB.get(key);

      if (itemA && itemB) {
        const isEqual = JSON.stringify(itemA) === JSON.stringify(itemB);
        if (!isEqual) {
          conflicts.push({
            type,
            id: key,
            userA: { name: userAName, data: itemA },
            userB: { name: userBName, data: itemB },
          });
        }
        result.push({ ...itemA, ...itemB, source: `${userAName} + ${userBName}` });
      } else if (itemA) {
        result.push({ ...itemA, source: userAName });
      } else if (itemB) {
        result.push({ ...itemB, source: userBName });
      }
    });

    return result;
  };

  merged.databases.library = mergeArrayByName(
    userAData.databases?.library,
    userBData.databases?.library,
    'library'
  );
  merged.databases.contracts = mergeArrayByName(
    userAData.databases?.contracts,
    userBData.databases?.contracts,
    'contracts'
  );
  merged.databases.entreprises = mergeArrayByName(
    userAData.databases?.entreprises,
    userBData.databases?.entreprises,
    'entreprises'
  );

  merged.settings = { ...userAData.settings, ...userBData.settings };
  merged.projectTime = { ...userAData.projectTime, ...userBData.projectTime };
  merged.libraryFavorites = { ...userAData.libraryFavorites, ...userBData.libraryFavorites };
  merged.libraryTemplates = {
    templates: [
      ...(userAData.libraryTemplates?.templates || []),
      ...(userBData.libraryTemplates?.templates || []),
    ],
  };

  const projectIdsA = new Set((userAData.projects || []).map(p => p.id));
  const projectIdsB = new Set((userBData.projects || []).map(p => p.id));
  const allProjectIds = new Set([...projectIdsA, ...projectIdsB]);

  allProjectIds.forEach(id => {
    const projA = (userAData.projects || []).find(p => p.id === id);
    const projB = (userBData.projects || []).find(p => p.id === id);

    if (projA && projB) {
      const mergedProj = { id, source: `${userAName} + ${userBName}` };
      const keys = new Set([...Object.keys(projA || {}), ...Object.keys(projB || {})]);
      keys.forEach(key => {
        if (key !== 'id' && key !== 'source') {
          const valA = projA[key];
          const valB = projB[key];
          if (valA && valB && JSON.stringify(valA) !== JSON.stringify(valB)) {
            conflicts.push({
              type: `project-${key}`,
              id,
              userA: { name: userAName, data: valA },
              userB: { name: userBName, data: valB },
            });
          }
          mergedProj[key] = valB !== undefined ? valB : valA;
        }
      });
      merged.projects.push(mergedProj);
    } else if (projA) {
      merged.projects.push({ ...projA, source: userAName });
    } else if (projB) {
      merged.projects.push({ ...projB, source: userBName });
    }
  });

  merged.planning = { ...userAData.planning, ...userBData.planning };

  return {
    success: true,
    merged,
    conflicts,
    warnings,
    errors,
    userAName,
    userBName,
  };
};
