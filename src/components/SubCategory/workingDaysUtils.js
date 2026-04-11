export const addWorkingDays = (startDateStr, days) => {
  if (!startDateStr || days < 0) return '';
  if (days === 0) return startDateStr;
  const date = new Date(startDateStr);
  let daysAdded = 0;
  while (daysAdded < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  return date.toISOString().split('T')[0];
};

export const subtractWorkingDays = (endDateStr, days) => {
  if (!endDateStr || days < 0) return '';
  if (days === 0) return endDateStr;
  const date = new Date(endDateStr);
  let daysSubtracted = 0;
  while (daysSubtracted < days) {
    date.setDate(date.getDate() - 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysSubtracted++;
    }
  }
  return date.toISOString().split('T')[0];
};
