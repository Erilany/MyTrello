import { useCallback } from 'react';

export function useCategoryCrud(db, saveDb, saveToStorage) {
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
      tag = null
    ) => {
      console.log('[createCategory] Called with cardId:', cardId, 'title:', title, 'tag:', tag);

      const existingCategory = db.categories.find(
        c =>
          c.title &&
          c.title.toLowerCase() === title.toLowerCase() &&
          Number(c.card_id) === Number(cardId) &&
          !c.parent_id
      );
      if (existingCategory) {
        console.log('[createCategory] Duplicate category title found:', title);
        return Promise.reject(
          new Error(`Une catégorie avec le titre "${title}" existe déjà pour cette carte.`)
        );
      }

      return new Promise(resolve => {
        let catId;

        const updateDb = currentDb => {
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
          const maxPos = filter.reduce((max, c) => Math.max(max, c.position), -1);
          catId = currentDb.nextIds.category;
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
            created_at: new Date().toISOString(),
          };
          const newDb = {
            ...currentDb,
            categories: [...currentDb.categories, newCategory],
            nextIds: { ...currentDb.nextIds, category: catId + 1 },
          };
          saveToStorage(newDb);
          return newDb;
        };

        saveDb(updateDb);

        setTimeout(() => {
          resolve(catId);
        }, 200);
      });
    },
    [db, saveDb, saveToStorage]
  );

  const updateCategory = useCallback(
    (id, updates) => {
      const newDb = {
        ...db,
        categories: db.categories.map(c =>
          Number(c.id) === Number(id) ? { ...c, ...updates } : c
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const deleteCategory = useCallback(
    id => {
      const newDb = {
        ...db,
        categories: db.categories.filter(c => Number(c.id) !== Number(id)),
        subcategories: db.subcategories.filter(s => Number(s.category_id) !== Number(id)),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const moveCategory = useCallback(
    (categoryId, newPosition) => {
      const newDb = {
        ...db,
        categories: db.categories.map(c =>
          Number(c.id) === Number(categoryId) ? { ...c, position: newPosition } : c
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
  };
}

export function useSubcategoryCrud(db, saveDb, saveToStorage) {
  const createSubcategory = useCallback(
    (
      categoryId,
      title,
      description = '',
      priority = 'normal',
      dueDate = null,
      assignee = '',
      parentId = null,
      tag = null,
      assigneeType = null
    ) => {
      console.log('[createSubcategory] Called with categoryId:', categoryId, 'title:', title);

      return new Promise(resolve => {
        let subId;

        const updateDb = currentDb => {
          const filter = currentDb.categories.filter(
            c => Number(c.category_id) === Number(categoryId)
          );
          const maxPos = filter.reduce((max, c) => Math.max(max, c.position), -1);
          subId = currentDb.nextIds.subcategory;
          const newSubcategory = {
            id: subId,
            category_id: Number(categoryId),
            parent_id: parentId || null,
            title,
            description,
            priority,
            due_date: dueDate,
            assignee,
            assigneeType,
            position: maxPos + 1,
            start_date: null,
            duration_days: 1,
            tag,
            created_at: new Date().toISOString(),
            milestones: '[]',
            emails: '[]',
          };
          const newDb = {
            ...currentDb,
            subcategories: [...currentDb.subcategories, newSubcategory],
            nextIds: { ...currentDb.nextIds, subcategory: subId + 1 },
          };
          saveToStorage(newDb);
          return newDb;
        };

        saveDb(updateDb);

        setTimeout(() => {
          resolve(subId);
        }, 200);
      });
    },
    [db, saveDb, saveToStorage]
  );

  const updateSubcategory = useCallback(
    (id, updates) => {
      const newDb = {
        ...db,
        subcategories: db.subcategories.map(s =>
          Number(s.id) === Number(id) ? { ...s, ...updates } : s
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const deleteSubcategory = useCallback(
    id => {
      const newDb = {
        ...db,
        subcategories: db.subcategories.filter(s => Number(s.id) !== Number(id)),
        subcategoryEmails: (db.subcategoryEmails || []).filter(
          e => Number(e.subcategory_id) !== Number(id)
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const moveSubcategory = useCallback(
    (subcategoryId, targetCategoryId, newPosition) => {
      const newDb = {
        ...db,
        subcategories: db.subcategories.map(s =>
          Number(s.id) === Number(subcategoryId)
            ? { ...s, category_id: Number(targetCategoryId), position: newPosition }
            : s
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  return {
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    moveSubcategory,
  };
}

export default { useCategoryCrud, useSubcategoryCrud };
