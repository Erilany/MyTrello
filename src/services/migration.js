export const CURRENT_VERSION = '2.0';

export const validateImportData = data => {
  const errors = [];
  const warnings = [];

  if (!data) {
    errors.push('Aucune donnée trouvée');
    return { valid: false, errors, warnings, version: null };
  }

  const version = data.version || '1.0';

  if (!data.data && !data.databases) {
    errors.push('Format invalide: aucune structure de données trouvée');
  }

  if (version === '1.0') {
    if (!data.data?.boards) {
      warnings.push('Aucun projet trouvé dans les données');
    }
    if (!data.data?.cards) {
      warnings.push('Aucune carte trouvée');
    }
  }

  if (version === '2.0') {
    if (!data.databases?.core?.boards) {
      errors.push('Structure v2 invalide: databases.core.boards manquant');
    }
  }

  return {
    valid: errors.length === 0,
    version,
    errors,
    warnings,
  };
};

export const migrateFromV1ToV2 = data => {
  console.log('[Migration] Conversion v1.0 → v2.0...');

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

    settings: data.settings || {},

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

  console.log('[Migration] Conversion terminée:', {
    boards: migrated.databases.core.boards?.length || 0,
    projects: migrated.projects.length,
  });

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
    console.log('[Migration] Migration automatique v1.0 → v2.0');
    normalizedData = migrateFromV1ToV2(data);
  } else if (version === CURRENT_VERSION) {
    console.log('[Migration] Données déjà en v2.0');
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
        gmr: (() => {
          try {
            return require('../data/GMRData').loadGMRData();
          } catch {
            return [];
          }
        })(),
        priority: (() => {
          try {
            return require('../data/PriorityData').loadPriorityData();
          } catch {
            return [];
          }
        })(),
        zones: (() => {
          try {
            return require('../data/ZonesData').loadZonesData();
          } catch {
            return [];
          }
        })(),
        tags: (() => {
          try {
            return require('../data/TagsData').loadTagsData();
          } catch {
            return [];
          }
        })(),
        chaptersOrder: (() => {
          try {
            return require('../data/ChaptersData').loadChaptersOrder();
          } catch {
            return [];
          }
        })(),
      },
      library: (() => {
        try {
          const e = localStorage.getItem('d-projet_library_editor');
          return e ? JSON.parse(e) : [];
        } catch {
          return [];
        }
      })(),
      contracts: (() => {
        try {
          const e = localStorage.getItem('d-projet_contracts');
          return e ? JSON.parse(e) : [];
        } catch {
          return [];
        }
      })(),
    },
    settings: includeSettings
      ? {
          theme: localStorage.getItem('d-projet-theme'),
          cardColors: (() => {
            try {
              return JSON.parse(localStorage.getItem('d-projet-cardColors'));
            } catch {
              return null;
            }
          })(),
          username: localStorage.getItem('d-projet-username'),
          userRole: localStorage.getItem('d-projet-user-role'),
        }
      : {},
    projectTime: includeProjectTime
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('d-projet_project_time') || '{}');
          } catch {
            return {};
          }
        })()
      : {},
    libraryFavorites: includeLibrary
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('d-projet_library_favorites') || '{}');
          } catch {
            return {};
          }
        })()
      : {},
    libraryTemplates: includeLibrary
      ? (() => {
          try {
            return JSON.parse(
              localStorage.getItem('d-projet_library_templates') || '{"templates":[]}'
            );
          } catch {
            return { templates: [] };
          }
        })()
      : {},
    projects,
  };

  return exportObj;
};

export const downloadExport = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `d-projet-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
