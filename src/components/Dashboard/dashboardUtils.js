export function formatSeconds(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatPercentage(value, total) {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function getStatusColor(status) {
  switch (status) {
    case 'done':
      return 'bg-green-500';
    case 'waiting':
      return 'bg-blue-500';
    case 'todo':
      return 'bg-red-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'blocked':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'done':
      return 'Terminé';
    case 'waiting':
      return 'En attente';
    case 'todo':
      return 'À faire';
    case 'in_progress':
      return 'En cours';
    case 'blocked':
      return 'Bloqué';
    default:
      return 'Inconnu';
  }
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-400';
  }
}

export function getPriorityLabel(priority) {
  switch (priority) {
    case 'high':
      return 'Haute';
    case 'medium':
      return 'Moyenne';
    case 'low':
      return 'Basse';
    default:
      return 'Normale';
  }
}

export function getTaskProgress(status) {
  switch (status) {
    case 'done':
      return 100;
    case 'in_progress':
      return 50;
    case 'waiting':
      return 25;
    case 'todo':
      return 0;
    case 'blocked':
      return 0;
    default:
      return 0;
  }
}

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
    .toString()
    .padStart(2, '0')}`;
}

export function getWeekRange(weekStr) {
  const [year, week] = weekStr.split('-W').map(Number);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const start = new Date(simple);
  if (dow <= 4) start.setDate(simple.getDate() - simple.getDay() + 1);
  else start.setDate(simple.getDate() + 8 - simple.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function getUpcomingTasks(
  subcategories,
  categories,
  cards,
  boards,
  columns,
  username,
  days
) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const result = subcategories
    .filter(sub => {
      if (!sub.due_date) return false;
      const dueDate = new Date(sub.due_date);
      return dueDate <= futureDate;
    })
    .map(sub => {
      const category = categories.find(c => Number(c.id) === Number(sub.category_id));
      const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
      const column = card ? columns.find(col => Number(col.id) === Number(card.column_id)) : null;
      const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
      let milestones = sub.milestones;
      if (typeof milestones === 'string') {
        try {
          milestones = JSON.parse(milestones);
        } catch (e) {
          milestones = [];
        }
      }
      const taskMilestones = Array.isArray(milestones)
        ? milestones.filter(m => !m.done && m.date)
        : [];
      return { ...sub, category, card, board, milestones: taskMilestones };
    })
    .filter(task => task.board)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return result;
}

export function getUpcomingMilestones(subcategories, categories, cards, boards, columns, days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const milestonesList = [];

  subcategories.forEach(sub => {
    let milestones = sub.milestones;
    if (typeof milestones === 'string') {
      try {
        milestones = JSON.parse(milestones);
      } catch (e) {
        milestones = [];
      }
    }
    if (!Array.isArray(milestones)) return;

    milestones.forEach(m => {
      if (m.date) {
        const milestoneDate = new Date(m.date);
        if (milestoneDate <= futureDate && !m.done) {
          const category = categories.find(c => Number(c.id) === Number(sub.category_id));
          const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
          const column = card
            ? columns.find(col => Number(col.id) === Number(card.column_id))
            : null;
          const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
          milestonesList.push({
            milestone: { ...m, subcategoryId: sub.id, subcategoryTitle: sub.title },
            category,
            card,
            board,
          });
        }
      }
    });
  });

  return milestonesList.sort((a, b) => new Date(a.milestone.date) - new Date(b.milestone.date));
}

export function getMyMilestones(subcategories, categories, cards, boards, columns, username) {
  const milestonesList = [];

  subcategories.forEach(sub => {
    if (sub.assignee !== username) return;

    let milestones = sub.milestones;
    if (typeof milestones === 'string') {
      try {
        milestones = JSON.parse(milestones);
      } catch (e) {
        milestones = [];
      }
    }
    if (!Array.isArray(milestones)) return;

    milestones.forEach(m => {
      const category = categories.find(c => Number(c.id) === Number(sub.category_id));
      const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
      const column = card ? columns.find(col => Number(col.id) === Number(card.column_id)) : null;
      const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
      milestonesList.push({
        milestone: { ...m, subcategoryId: sub.id, subcategoryTitle: sub.title },
        category,
        card,
        board,
      });
    });
  });

  const withoutDate = milestonesList
    .filter(m => !m.milestone.date)
    .sort((a, b) => {
      if (a.milestone.done !== b.milestone.done) return a.milestone.done ? 1 : -1;
      return (a.milestone.position || 0) - (b.milestone.position || 0);
    });

  const withDate = milestonesList
    .filter(m => m.milestone.date)
    .sort((a, b) => {
      if (a.milestone.done !== b.milestone.done) return a.milestone.done ? 1 : -1;
      return new Date(a.milestone.date) - new Date(b.milestone.date);
    });

  return [...withoutDate, ...withDate];
}

export function getMyTasks(subcategories, categories, cards, boards, columns, username) {
  const userSubcategories = subcategories.filter(sub => sub.assignee === username);

  const tasksWithContext = userSubcategories.map(sub => {
    const category = categories.find(c => Number(c.id) === Number(sub.category_id));
    const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
    const column = card ? columns.find(col => Number(col.id) === Number(card.column_id)) : null;
    const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
    return { subcategory: sub, category, card, board };
  });

  return tasksWithContext
    .filter(t => t.board)
    .sort((a, b) => {
      const aDate = a.subcategory.due_date ? new Date(a.subcategory.due_date) : new Date('9999');
      const bDate = b.subcategory.due_date ? new Date(b.subcategory.due_date) : new Date('9999');
      return aDate - bDate;
    });
}

export function getOtherTasks(subcategories, categories, cards, boards, columns, username) {
  const otherSubcategories = subcategories.filter(sub => sub.assignee && sub.assignee !== username);

  const tasksWithContext = otherSubcategories.map(sub => {
    const category = categories.find(c => Number(c.id) === Number(sub.category_id));
    const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
    const column = card ? columns.find(col => Number(col.id) === Number(card.column_id)) : null;
    const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
    return { subcategory: sub, category, card, board };
  });

  return tasksWithContext
    .filter(t => t.board)
    .sort((a, b) => {
      const aDate = a.subcategory.due_date ? new Date(a.subcategory.due_date) : new Date('9999');
      const bDate = b.subcategory.due_date ? new Date(b.subcategory.due_date) : new Date('9999');
      return aDate - bDate;
    });
}
