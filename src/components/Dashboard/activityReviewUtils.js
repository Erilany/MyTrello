export const ROLE_TO_ACTIVITY = {
  'Manager de projets': 'MP',
  'Chargé(e) de Concertation': 'SCET',
  "Chargé(e) d'Etudes LA": 'LA',
  "Chargé(e) d'Etudes LS": 'LS',
  "Chargé(e) d'Etudes Poste HT": 'PO',
  "Chargé(e) d'Etudes Poste BT et CC": 'CC',
  "Chargé(e) d'Etudes SPC": 'SPC',
  'Contrôleur Travaux': 'CT',
  'Assistant(e) Etudes': 'AE',
};

export const SMILEY_LEVELS = {
  low: { emoji: '🟢', color: '#22C55E', label: 'Faible' },
  medium: { emoji: '🟠', color: '#F59E0B', label: 'Moyenne' },
  high: { emoji: '🔴', color: '#EF4444', label: 'Élevée' },
};

export const TAG_VERTICAL_OFFSET = 3;

export function getQuarter(date) {
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `T${quarter}`;
}

export function getQuarterYear(date) {
  return date.getFullYear();
}

export function getMonthIndexInQuarter(date) {
  return date.getMonth() % 3;
}

export function formatDateFrench(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getQuarterColumnsTwoYears() {
  const columns = [];
  const today = new Date();
  const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);
  const currentYear = today.getFullYear();

  const startQuarter = currentQuarter - 1;
  const startYear = startQuarter <= 0 ? currentYear - 1 : currentYear;
  const adjustedStartQuarter = startQuarter <= 0 ? startQuarter + 4 : startQuarter;

  const start = new Date(startYear, (adjustedStartQuarter - 1) * 3, 1);

  for (let i = 0; i < 7; i++) {
    const q = Math.ceil((start.getMonth() + 1) / 3);
    const y = start.getFullYear();
    columns.push({ quarter: `T${q}`, year: y, label: `T${q} - ${y}` });
    start.setMonth(start.getMonth() + 3);
  }

  return columns;
}

export function getItemDateRange(item) {
  const start = item.startDate
    ? new Date(item.startDate)
    : item.start_date
      ? new Date(item.start_date)
      : null;
  const end = item.endDate
    ? new Date(item.endDate)
    : item.due_date
      ? new Date(item.due_date)
      : null;
  return { start, end };
}
