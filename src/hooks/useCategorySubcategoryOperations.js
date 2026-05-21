import { useCallback } from 'react';

export function useCategorySubcategoryOperations(db, saveDb, loadBoard, currentBoard) {
  // ── Category ────────────────────────────────────────────────────────────────

  const createCategory = useCallback(
    (
      cardId,
      title,
      description = '',
      priority = 'normal',
      dueDate = null,
      assignee = '',
      parentId = null,
      durationDays = 1,
      tag = null,
      libraryItemId = null
    ) => {
      const existingCategory = db.categories.find(
        c =>
          c.title &&
          c.title.toLowerCase() === title.toLowerCase() &&
          Number(c.card_id) === Number(cardId) &&
          !c.parent_id
      );
      if (existingCategory) {
        return Promise.reject(
          new Error(`Une catégorie avec le titre "${title}" existe déjà pour cette carte.`)
        );
      }

      return new Promise(resolve => {
        let catId;
        saveDb(currentDb => {
          let filter;
          if (parentId) {
            filter = currentDb.categories.filter(c => Number(c.parent_id) === Number(parentId));
          } else if (cardId) {
            filter = currentDb.categories.filter(
              c => Number(c.card_id) === Number(cardId) && !c.parent_id
            );
          } else {
            filter = [];
          }
          const maxPos = filter.reduce((max, c) => Math.max(max, c.position || 0), -1);
          const safeDb = currentDb || { nextIds: { category: 1 }, categories: [] };
          catId = safeDb.nextIds?.category || 1;
          const newCategory = {
            id: catId,
            card_id: cardId ? Number(cardId) : null,
            parent_id: parentId || null,
            title,
            description,
            priority,
            due_date: dueDate,
            assignee,
            position: maxPos + 1,
            start_date: null,
            duration_days: durationDays,
            tag,
            library_item_id: libraryItemId || null,
            created_at: new Date().toISOString(),
          };
          return {
            ...currentDb,
            categories: [...currentDb.categories, newCategory],
            nextIds: { ...currentDb.nextIds, category: catId + 1 },
          };
        });
        setTimeout(() => resolve(catId), 100);
      });
    },
    [db, saveDb]
  );

  const updateCategory = useCallback(
    (id, updates) => {
      const newDb = {
        ...db,
        categories: db.categories.map(c =>
          Number(c.id) === Number(id)
            ? { ...c, ...updates, updated_at: new Date().toISOString() }
            : c
        ),
      };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
      window.dispatchEvent(new Event('project-updated'));
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const deleteCategory = useCallback(
    id => {
      const newDb = {
        ...db,
        categories: db.categories.filter(c => Number(c.id) !== Number(id)),
        subcategories: db.subcategories.filter(s => Number(s.category_id) !== Number(id)),
      };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
      window.dispatchEvent(new Event('project-updated'));
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const moveCategory = useCallback(
    (categoryId, newCardId, newPosition) => {
      const category = db.categories.find(c => Number(c.id) === Number(categoryId));
      if (!category) return;

      const oldCardId = Number(category.card_id);
      const oldPosition = category.position;
      const destCardId = Number(newCardId);

      const newCategories = db.categories.map(c => {
        const cId = Number(c.id);
        const cCardId = Number(c.card_id);

        if (cId === Number(categoryId)) {
          return { ...c, card_id: destCardId, position: newPosition };
        }

        if (oldCardId === destCardId) {
          if (oldPosition < newPosition) {
            if (cCardId === oldCardId && c.position > oldPosition && c.position <= newPosition) {
              return { ...c, position: c.position - 1 };
            }
          } else if (oldPosition > newPosition) {
            if (cCardId === oldCardId && c.position >= newPosition && c.position < oldPosition) {
              return { ...c, position: c.position + 1 };
            }
          }
        } else {
          if (cCardId === destCardId && c.position >= newPosition && cId !== Number(categoryId)) {
            return { ...c, position: c.position + 1 };
          }
          if (cCardId === oldCardId && c.position > oldPosition) {
            return { ...c, position: c.position - 1 };
          }
        }
        return c;
      });

      const newDb = { ...db, categories: newCategories };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  // ── Subcategory ──────────────────────────────────────────────────────────────

  const createSubcategory = useCallback(
    (
      categoryId,
      title,
      description = '',
      priority = 'normal',
      dueDate = null,
      assignee = '',
      startDate = null,
      durationDays = 1,
      tag = null,
      libraryItemId = null
    ) => {
      const existingSubcategory = db.subcategories.find(
        s =>
          s.title &&
          s.title.toLowerCase() === title.toLowerCase() &&
          Number(s.category_id) === Number(categoryId)
      );
      if (existingSubcategory) {
        return Promise.reject(
          new Error(
            `Une sous-catégorie avec le titre "${title}" existe déjà pour cette catégorie.`
          )
        );
      }

      return new Promise(resolve => {
        let subcatId;
        saveDb(currentDb => {
          const maxPos = (currentDb?.subcategories || [])
            .filter(s => Number(s.category_id) === Number(categoryId))
            .reduce((max, s) => Math.max(max, s.position || 0), -1);
          const safeDb = currentDb || { nextIds: { subcategory: 1 }, subcategories: [] };
          subcatId = safeDb.nextIds?.subcategory || 1;
          const newSubcategory = {
            id: subcatId,
            category_id: Number(categoryId),
            title,
            description,
            priority,
            due_date: dueDate,
            assignee,
            position: maxPos + 1,
            start_date: startDate,
            duration_days: durationDays,
            tag,
            library_item_id: libraryItemId,
            created_at: new Date().toISOString(),
            predecessors: [],
          };
          return {
            ...safeDb,
            subcategories: [...(safeDb.subcategories || []), newSubcategory],
            nextIds: { ...safeDb.nextIds, subcategory: subcatId + 1 },
          };
        });
        setTimeout(() => resolve(subcatId), 100);
      });
    },
    [db, saveDb]
  );

  const updateSubcategory = useCallback(
    (id, updates) => {
      const newDb = {
        ...db,
        subcategories: db.subcategories.map(s =>
          Number(s.id) === Number(id)
            ? { ...s, ...updates, updated_at: new Date().toISOString() }
            : s
        ),
      };
      saveDb(newDb);
      if (currentBoard) {
        setTimeout(() => loadBoard(currentBoard.id, newDb), 100);
      }
      window.dispatchEvent(new Event('project-updated'));
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const toggleMilestone = useCallback(
    (subcategoryId, milestoneId) => {
      const sub = db.subcategories.find(s => Number(s.id) === Number(subcategoryId));
      if (!sub) return;

      let milestones = sub.milestones;
      if (typeof milestones === 'string') {
        try {
          milestones = JSON.parse(milestones);
        } catch (e) {
          milestones = [];
        }
      }
      if (!Array.isArray(milestones)) milestones = [];

      const updatedMilestones = milestones.map(m =>
        Number(m.id) === Number(milestoneId) ? { ...m, done: !m.done } : m
      );

      updateSubcategory(subcategoryId, { milestones: updatedMilestones });
      setTimeout(() => window.dispatchEvent(new CustomEvent('milestone-updated')), 100);
    },
    [db, updateSubcategory]
  );

  const deleteSubcategory = useCallback(
    id => {
      const newDb = {
        ...db,
        subcategories: db.subcategories.filter(s => Number(s.id) !== Number(id)),
      };
      saveDb(newDb);
      if (currentBoard) {
        setTimeout(() => loadBoard(currentBoard.id, newDb), 100);
      }
      window.dispatchEvent(new Event('project-updated'));
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  const moveSubcategory = useCallback(
    (subcategoryId, newCategoryId, newPosition) => {
      const subcategory = db.subcategories.find(s => Number(s.id) === Number(subcategoryId));
      if (!subcategory) return;

      const oldCategoryId = Number(subcategory.category_id);
      const oldPosition = subcategory.position;
      const destCategoryId = Number(newCategoryId);

      const newSubcategories = db.subcategories.map(s => {
        const sId = Number(s.id);
        const sCatId = Number(s.category_id);

        if (sId === Number(subcategoryId)) {
          return { ...s, category_id: destCategoryId, position: newPosition };
        }

        if (oldCategoryId === destCategoryId) {
          if (oldPosition < newPosition) {
            if (sCatId === oldCategoryId && s.position > oldPosition && s.position <= newPosition) {
              return { ...s, position: s.position - 1 };
            }
          } else if (oldPosition > newPosition) {
            if (sCatId === oldCategoryId && s.position >= newPosition && s.position < oldPosition) {
              return { ...s, position: s.position + 1 };
            }
          }
        } else {
          if (sCatId === destCategoryId && s.position >= newPosition && sId !== Number(subcategoryId)) {
            return { ...s, position: s.position + 1 };
          }
          if (sCatId === oldCategoryId && s.position > oldPosition) {
            return { ...s, position: s.position - 1 };
          }
        }
        return s;
      });

      const newDb = { ...db, subcategories: newSubcategories };
      saveDb(newDb);
      if (currentBoard) loadBoard(currentBoard.id, newDb);
    },
    [db, saveDb, currentBoard, loadBoard]
  );

  // ── Email ────────────────────────────────────────────────────────────────────

  const addEmailToSubcategory = useCallback(
    (subcategoryId, emailData) => {
      const emailId = db.nextIds.email++;
      const newEmail = {
        id: emailId,
        subcategory_id: Number(subcategoryId),
        date: emailData.date,
        subject: emailData.subject,
        filepath: emailData.filepath,
        filename: emailData.filename,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const newDb = {
        ...db,
        subcategoryEmails: [...(db.subcategoryEmails || []), newEmail],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      return emailId;
    },
    [db, saveDb]
  );

  const removeEmailFromSubcategory = useCallback(
    emailId => {
      const email = db.subcategoryEmails?.find(e => Number(e.id) === Number(emailId));
      if (email && email.filepath) {
        localStorage.removeItem(`c-projets_email_${emailId}`);
      }
      const newDb = {
        ...db,
        subcategoryEmails: (db.subcategoryEmails || []).filter(
          e => Number(e.id) !== Number(emailId)
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const updateEmailSubject = useCallback(
    (emailId, newSubject) => {
      const newDb = {
        ...db,
        subcategoryEmails: (db.subcategoryEmails || []).map(e =>
          Number(e.id) === Number(emailId) ? { ...e, customSubject: newSubject } : e
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const updateEmailStatus = useCallback(
    (emailId, newStatus) => {
      const newDb = {
        ...db,
        subcategoryEmails: (db.subcategoryEmails || []).map(e =>
          Number(e.id) === Number(emailId) ? { ...e, status: newStatus } : e
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const getEmailsForSubcategory = useCallback(
    subcategoryId => {
      return (db.subcategoryEmails || []).filter(
        e => Number(e.subcategory_id) === Number(subcategoryId)
      );
    },
    [db.subcategoryEmails]
  );

  const saveEmailFile = useCallback((emailId, fileData) => {
    localStorage.setItem(`c-projets_email_${emailId}`, fileData);
  }, []);

  const getEmailFile = useCallback(emailId => {
    return localStorage.getItem(`c-projets_email_${emailId}`);
  }, []);

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    createSubcategory,
    updateSubcategory,
    toggleMilestone,
    deleteSubcategory,
    moveSubcategory,
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
    updateEmailStatus,
    getEmailsForSubcategory,
    saveEmailFile,
    getEmailFile,
  };
}
