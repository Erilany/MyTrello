const GMR_STORAGE_KEY = 'd-projet_gmr_data';

export const defaultGMRData = [];

export function loadGMRData() {
  try {
    const stored = localStorage.getItem(GMR_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.sort((a, b) => a.code.localeCompare(b.code));
    }
  } catch (e) {
    console.error('[GMR] Error loading data:', e);
  }
  return defaultGMRData;
}

export function saveGMRData(data) {
  try {
    localStorage.setItem(GMR_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[GMR] Error saving data:', e);
  }
}

export function addGMRItem(code, label) {
  const trimmedCode = (code || '').trim().toUpperCase();
  if (!trimmedCode) {
    throw new Error("L'identifiant est obligatoire");
  }
  if (trimmedCode.length > 4) {
    throw new Error("L'identifiant ne peut pas dépasser 4 caractères");
  }
  const data = loadGMRData();
  if (data.some(item => item.code === trimmedCode)) {
    throw new Error('Cet identifiant existe déjà');
  }
  data.push({ code: trimmedCode, label: label || '' });
  data.sort((a, b) => a.code.localeCompare(b.code));
  saveGMRData(data);
  return data;
}

export function updateGMRItem(oldCode, newCode, newLabel) {
  const trimmedCode = (newCode || '').trim().toUpperCase();
  if (!trimmedCode) {
    throw new Error("L'identifiant est obligatoire");
  }
  if (trimmedCode.length > 4) {
    throw new Error("L'identifiant ne peut pas dépasser 4 caractères");
  }
  const data = loadGMRData();
  const index = data.findIndex(item => item.code === oldCode);
  if (index === -1) return data;

  if (newCode !== oldCode && data.some(item => item.code === trimmedCode)) {
    throw new Error('Cet identifiant existe déjà');
  }

  data[index] = { code: trimmedCode, label: newLabel || '' };
  data.sort((a, b) => a.code.localeCompare(b.code));
  saveGMRData(data);
  return data;
}

export function deleteGMRItem(code) {
  const data = loadGMRData();
  const filtered = data.filter(item => item.code !== code);
  saveGMRData(filtered);
  return filtered;
}
