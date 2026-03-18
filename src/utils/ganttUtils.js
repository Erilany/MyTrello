export function getGanttDateRange(
  tasks,
  ganttStartDate = null,
  zoom = 'week',
  containerWidth = 1200
) {
  if (!tasks || tasks.length === 0) {
    const today = new Date();
    return {
      start: today,
      end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  let minDate = new Date('2099-01-01');
  let maxDate = new Date('1970-01-01');

  tasks.forEach(task => {
    if (task.start_date) {
      const d = new Date(task.start_date);
      if (d < minDate) minDate = d;
    }
    if (task.due_date) {
      const d = new Date(task.due_date);
      if (d > maxDate) maxDate = d;
    }
  });

  if (ganttStartDate) {
    minDate = new Date(ganttStartDate);
  }

  const minDays = zoom === 'day' ? 30 : zoom === 'week' ? 60 : 180;

  const rangeDays = Math.ceil((maxDate - minDate) / (24 * 60 * 60 * 1000));
  if (rangeDays < minDays) {
    maxDate = new Date(minDate.getTime() + minDays * 24 * 60 * 60 * 1000);
  } else {
    minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    maxDate = new Date(maxDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  }

  return { start: minDate, end: maxDate };
}

export function getGanttDays(tasks, ganttStartDate = null, zoom = 'week') {
  const range = getGanttDateRange(tasks, ganttStartDate, zoom);
  const days = [];
  const current = new Date(range.start);
  while (current <= range.end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function getTaskBarPosition(task, tasks, ganttStartDate = null, zoom = 'week') {
  const range = getGanttDateRange(tasks, ganttStartDate, zoom);
  const startDate = task.start_date ? new Date(task.start_date) : range.start;
  const endDate = task.due_date ? new Date(task.due_date) : startDate;

  const totalDays = Math.ceil((range.end - range.start) / (24 * 60 * 60 * 1000));
  const startOffset = Math.ceil((startDate - range.start) / (24 * 60 * 60 * 1000));
  const duration = Math.max(1, Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1);

  return {
    startOffset,
    duration,
    totalDays,
  };
}
