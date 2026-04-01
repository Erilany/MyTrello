export function getUpcomingTasks(subcategories, categories, cards, boards, columns, username, days) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const result = subcategories
    .filter(sub => {
      if (!sub.due_date) return false;
      const dueDate = new Date(sub.due_date);
      return dueDate >= now && dueDate <= futureDate;
    })
    .map(sub => {
      const category = categories.find(c => Number(c.id) === Number(sub.category_id));
      const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
      const column = card ? columns.find(col => Number(col.id) === Number(card.column_id)) : null;
      const board = column ? boards.find(b => Number(b.id) === Number(column.board_id)) : null;
      return { ...sub, category, card, board };
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
        if (milestoneDate >= now && milestoneDate <= futureDate && !m.done) {
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
