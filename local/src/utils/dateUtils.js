export function addBusinessDays(startDate, days) {
  if (!startDate || !days) return '';
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date.toISOString().split('T')[0];
}

export function subtractBusinessDays(endDate, days) {
  if (!endDate || !days) return '';
  const date = new Date(endDate);
  let subtracted = 0;
  while (subtracted < days) {
    date.setDate(date.getDate() - 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) subtracted++;
  }
  return date.toISOString().split('T')[0];
}

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
