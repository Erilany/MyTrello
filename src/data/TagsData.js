const TAGS_STORAGE_KEY = 'mytrello_tags_data';

export const defaultTagsData = [
  { id: 1, name: 'À valider', color: '#F59E0B', functions: [] },
  { id: 2, name: 'Urgente', color: '#EF4444', functions: [] },
  { id: 3, name: 'En attente', color: '#6B7280', functions: [] },
];

export function loadTagsData() {
  try {
    const stored = localStorage.getItem(TAGS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.map(tag => ({
        ...tag,
        functions: tag.functions || [],
      }));
    }
  } catch (e) {
    console.error('[Tags] Error loading data:', e);
  }
  return defaultTagsData;
}

export function saveTagsData(data) {
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Tags] Error saving data:', e);
  }
}

export function addTag(name, color, functions = []) {
  const data = loadTagsData();
  if (data.some(tag => tag.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Ce tag existe déjà');
  }
  const newTag = {
    id: Date.now(),
    name,
    color,
    functions,
  };
  data.push(newTag);
  saveTagsData(data);
  return data;
}

export function updateTag(id, name, color, functions = []) {
  const data = loadTagsData();
  const index = data.findIndex(tag => tag.id === id);
  if (index === -1) return data;

  if (data.some(tag => tag.id !== id && tag.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Ce tag existe déjà');
  }

  data[index] = { id, name, color, functions };
  saveTagsData(data);
  return data;
}

export function deleteTag(id) {
  const data = loadTagsData();
  const filtered = data.filter(tag => tag.id !== id);
  saveTagsData(filtered);
  return filtered;
}

export function resetTagsData() {
  saveTagsData(defaultTagsData);
  return defaultTagsData;
}
