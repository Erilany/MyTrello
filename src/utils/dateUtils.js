export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function formatDateFrench(dateStr, options = {}) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const defaultOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
  } catch {
    return '-';
  }
}

export function formatDateShort(dateStr) {
  return formatDateFrench(dateStr, { day: '2-digit', month: '2-digit' });
}

export function formatDateLong(dateStr) {
  return formatDateFrench(dateStr, { day: 'numeric', month: 'long', year: 'numeric' });
}
