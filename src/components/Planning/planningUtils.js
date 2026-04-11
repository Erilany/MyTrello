export const LEVEL_ICONS = {
  1: 'Folder',
  2: 'FileText',
  3: 'List',
  4: 'CheckSquare',
};

export function normalizeChapter(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/s$/, '')
    .trim();
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  } catch {
    return '-';
  }
}

export function formatDuration(days) {
  if (!days && days !== 0) return '0h';
  const hours = Math.round(days * 24);
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  const daysOut = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${daysOut}j`;
  return `${daysOut}j ${remainingHours}h`;
}

export function parsePTDuration(ptStr) {
  if (!ptStr || !ptStr.startsWith('PT')) return 0;
  const match = ptStr.match(/PT(\d+)H(\d+)M(\d+)S/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  return Math.floor(hours / 24);
}
