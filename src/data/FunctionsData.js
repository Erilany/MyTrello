const FUNCTIONS_STORAGE_KEY = 'c-projets_functions';

const DEFAULT_FUNCTIONS = [
  'Manager de projets',
  'Chargé(e) de Concertation',
  "Chargé(e) d'Etudes LA",
  "Chargé(e) d'Etudes LS",
  "Chargé(e) d'Etudes Poste HT",
  "Chargé(e) d'Etudes Poste BT et CC",
  "Chargé(e) d'Etudes SPC",
  'Contrôleur Travaux',
  'Assistant(e) Etudes',
];

const LEGACY_CUSTOM_FUNCTIONS = [
  'AOI',
  'Référent Poste HT',
];

export function loadFunctions() {
  try {
    const stored = localStorage.getItem(FUNCTIONS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('[Functions] Error loading data:', e);
  }
  const initialFunctions = [...DEFAULT_FUNCTIONS, ...LEGACY_CUSTOM_FUNCTIONS];
  saveFunctions(initialFunctions);
  return initialFunctions;
}

export function importFunctionsFromProjects(boards) {
  if (!boards || !Array.isArray(boards)) {
    return loadFunctions();
  }

  const existingFunctions = loadFunctions();
  const defaultSet = new Set(DEFAULT_FUNCTIONS.map(f => f.toLowerCase()));

  const customFunctions = new Set();

  boards.forEach(board => {
    if (board.internalContacts && Array.isArray(board.internalContacts)) {
      board.internalContacts.forEach(contact => {
        if (contact.title && !defaultSet.has(contact.title.toLowerCase())) {
          customFunctions.add(contact.title);
        }
      });
    }
  });

  if (customFunctions.size > 0) {
    const updatedFunctions = [...existingFunctions];
    customFunctions.forEach(func => {
      if (!existingFunctions.some(f => f.toLowerCase() === func.toLowerCase())) {
        updatedFunctions.push(func);
      }
    });
    if (updatedFunctions.length > existingFunctions.length) {
      saveFunctions(updatedFunctions);
      return updatedFunctions;
    }
  }

  return existingFunctions;
}

export function loadFunctionsFromAllProjects() {
  try {
    const dbData = localStorage.getItem('c-projets_db');
    if (!dbData) {
      return loadFunctions();
    }

    const parsed = JSON.parse(dbData);
    const boards = parsed.boards || [];
    return importFunctionsFromProjects(boards);
  } catch (e) {
    console.error('[Functions] Error importing from projects:', e);
    return loadFunctions();
  }
}

export function saveFunctions(functions) {
  try {
    localStorage.setItem(FUNCTIONS_STORAGE_KEY, JSON.stringify(functions));
  } catch (e) {
    console.error('[Functions] Error saving data:', e);
  }
}

export function addFunction(newFunction) {
  const functions = loadFunctions();
  const trimmed = newFunction.trim();
  if (!trimmed) return functions;
  if (functions.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
    return functions;
  }
  const updated = [...functions, trimmed];
  saveFunctions(updated);
  return updated;
}

export function resetFunctions() {
  saveFunctions([...DEFAULT_FUNCTIONS]);
  return [...DEFAULT_FUNCTIONS];
}

export { DEFAULT_FUNCTIONS };
