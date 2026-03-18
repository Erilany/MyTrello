const PRIORITY_STORAGE_KEY = 'mytrello_priority_data';

export const defaultPriorityData = [
  { code: 'UR', label: 'Urgent' },
  { code: 'HA', label: 'Haute' },
  { code: 'NO', label: 'Normal' },
  { code: 'BA', label: 'Basse' },
];

export function loadPriorityData() {
  try {
    const stored = localStorage.getItem(PRIORITY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.sort((a, b) => a.code.localeCompare(b.code));
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

export function addPriorityItem(code, label) {
  const data = loadPriorityData();
  if (data.some(item => item.code === code)) {
    throw new Error('Ce code existe déjà');
  }
  data.push({ code: code.toUpperCase(), label });
  data.sort((a, b) => a.code.localeCompare(b.code));
  savePriorityData(data);
  return data;
}

export function updatePriorityItem(oldCode, newCode, newLabel) {
  const data = loadPriorityData();
  const index = data.findIndex(item => item.code === oldCode);
  if (index === -1) return data;

  if (newCode !== oldCode && data.some(item => item.code === newCode)) {
    throw new Error('Ce code existe déjà');
  }

  data[index] = { code: newCode.toUpperCase(), label: newLabel };
  data.sort((a, b) => a.code.localeCompare(b.code));
  savePriorityData(data);
  return data;
}

export function deletePriorityItem(code) {
  const data = loadPriorityData();
  const filtered = data.filter(item => item.code !== code);
  savePriorityData(filtered);
  return filtered;
}

export function resetPriorityData() {
  savePriorityData(defaultPriorityData);
  return defaultPriorityData;
}
