const ZONES_STORAGE_KEY = 'c-projets_zones_data';

export const defaultZonesData = [];

export function loadZonesData() {
  try {
    const stored = localStorage.getItem(ZONES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.sort((a, b) => a.label.localeCompare(b.label));
    }
  } catch (e) {
    console.error('[Zones] Error loading data:', e);
  }
  return defaultZonesData;
}

export function saveZonesData(data) {
  try {
    localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Zones] Error saving data:', e);
  }
}

export function addZoneItem(label) {
  const data = loadZonesData();
  if (data.some(item => item.label.toLowerCase() === label.toLowerCase())) {
    throw new Error('Cette zone existe déjà');
  }
  data.push({ id: Date.now(), label });
  data.sort((a, b) => a.label.localeCompare(b.label));
  saveZonesData(data);
  return data;
}

export function updateZoneItem(id, newLabel) {
  const data = loadZonesData();
  const index = data.findIndex(item => item.id === id);
  if (index === -1) return data;

  if (data.some(item => item.id !== id && item.label.toLowerCase() === newLabel.toLowerCase())) {
    throw new Error('Cette zone existe déjà');
  }

  data[index] = { id, label: newLabel };
  data.sort((a, b) => a.label.localeCompare(b.label));
  saveZonesData(data);
  return data;
}

export function deleteZoneItem(id) {
  const data = loadZonesData();
  const filtered = data.filter(item => item.id !== id);
  saveZonesData(filtered);
  return filtered;
}
