export function parseXmlDuration(ptString) {
  if (!ptString || typeof ptString !== 'string') return 0;

  const hoursMatch = ptString.match(/PT(\d+)H(\d+)M/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    const minutes = parseInt(hoursMatch[2], 10);
    const totalHours = hours + minutes / 60;
    return Math.round((totalHours / 8) * 2) / 2;
  }

  const hoursOnlyMatch = ptString.match(/PT(\d+)H/);
  if (hoursOnlyMatch) {
    const hours = parseInt(hoursOnlyMatch[1], 10);
    return Math.round((hours / 8) * 2) / 2;
  }

  return 0;
}

function parseMsProjectDate(dateStr) {
  if (!dateStr) return null;

  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const simpleMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (simpleMatch) {
    return simpleMatch[0];
  }

  return null;
}

export function parseMSProjectXmlWithDates(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Format XML invalide');
  }

  const tasks = doc.querySelectorAll('Task');
  const allTasks = [];

  tasks.forEach(task => {
    const name = task.querySelector('Name')?.textContent?.trim();
    const outlineLevel = parseInt(task.querySelector('OutlineLevel')?.textContent || '0', 10);
    const durationStr = task.querySelector('Duration')?.textContent || '';
    const startStr = task.querySelector('Start')?.textContent || '';
    const finishStr = task.querySelector('Finish')?.textContent || '';

    if (name && outlineLevel > 0) {
      allTasks.push({
        name: name
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"'),
        outlineLevel,
        durationStr,
        startStr,
        finishStr,
      });
    }
  });

  const items = [];
  const stack = [];

  allTasks.forEach(task => {
    while (stack.length > 0 && stack[stack.length - 1].outlineLevel >= task.outlineLevel) {
      stack.pop();
    }

    if (task.outlineLevel <= 4) {
      stack.push(task);
      items.push({
        id: crypto.randomUUID(),
        name: task.name,
        outlineLevel: task.outlineLevel,
        duration: parseXmlDuration(task.durationStr),
        rawDuration: task.durationStr,
        start: parseMsProjectDate(task.startStr),
        finish: parseMsProjectDate(task.finishStr),
        isSummary: task.outlineLevel === 1,
      });
    } else {
      const parentNames = stack.slice(-1).map(t => t.name);
      const fullName = [...parentNames, task.name].join(' - ');

      items.push({
        id: crypto.randomUUID(),
        name: fullName,
        outlineLevel: 4,
        duration: parseXmlDuration(task.durationStr),
        rawDuration: task.durationStr,
        start: parseMsProjectDate(task.startStr),
        finish: parseMsProjectDate(task.finishStr),
        isSummary: false,
      });
    }
  });

  return items;
}

export function parseMSProjectXml(xmlString) {
  return parseMSProjectXmlWithDates(xmlString);
}
