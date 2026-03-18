const PRIORITY_STORAGE_KEY = 'mytrello_priority_data';

export const defaultPriorityData = [
  { id: 1, label: 'Urgent' },
  { id: 2, label: 'Haute' },
  { id: 3, label: 'Normal' },
  { id: 4, label: 'Basse' },
];

export function loadPriorityData() {
  try {
    const stored = localStorage.getItem(PRIORITY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.sort((a, b) => a.id - b.id);
    }
  } catch (e) {
    console.error('[Priority] Error loading data:', e);
  }
  return defaultPriorityData;
}

export function savePriorityData(data) {
  try {
    localStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Priority] Error saving data:', e);
  }
}

export function addPriorityItem(label) {
  const data = loadPriorityData();
  const maxId = Math.max(0, ...data.map(item => item.id));
  data.push({ id: maxId + 1, label });
  savePriorityData(data);
  return data;
}

export function updatePriorityItem(id, label) {
  const data = loadPriorityData();
  const index = data.findIndex(item => item.id === id);
  if (index === -1) return data;

  data[index] = { id, label };
  savePriorityData(data);
  return data;
}

export function deletePriorityItem(id) {
  const data = loadPriorityData();
  const filtered = data.filter(item => item.id !== id);
  savePriorityData(filtered);
  return filtered;
}

export function resetPriorityData() {
  savePriorityData(defaultPriorityData);
  return defaultPriorityData;
}
