import { useMemo } from 'react';
import { normalizeChapter } from '../components/Planning/planningUtils';

export function useProjectHierarchy(orderedChapters, projectData) {
  const projectChapters = useMemo(() => {
    const chapters = [];
    const seen = new Set();
    const isSpacer = item => typeof item === 'string' && item.startsWith('__spacer_');

    if (orderedChapters && orderedChapters.length > 0) {
      orderedChapters.forEach(ch => {
        if (!seen.has(normalizeChapter(ch)) && !isSpacer(ch)) {
          seen.add(normalizeChapter(ch));
          chapters.push({ id: `lib_${ch}`, name: ch, type: 'chapter', level: 1 });
        }
      });
    }

    return chapters.length > 0 ? chapters : [];
  }, [orderedChapters]);

  const projectHierarchy = useMemo(() => {
    const cards = projectData?.cards || [];
    const categories = projectData?.categories || [];
    const subcategories = projectData?.subcategories || [];

    return projectChapters.map(chapter => {
      const chapterCards = cards.filter(
        card => card.chapter && normalizeChapter(card.chapter) === normalizeChapter(chapter.name)
      );

      return {
        ...chapter,
        children: chapterCards.map(card => {
          const cardCategories = categories.filter(c => Number(c.card_id) === Number(card.id));
          return {
            id: `card_${card.id}`,
            name: card.title,
            type: 'card',
            level: 2,
            cardId: card.id,
            children: cardCategories.map(cat => {
              const catSubcats = subcategories.filter(
                s => Number(s.category_id) === Number(cat.id)
              );
              return {
                id: `cat_${cat.id}`,
                name: cat.title,
                type: 'category',
                level: 3,
                cardId: card.id,
                categoryId: cat.id,
                children: catSubcats.map(sub => ({
                  id: `sub_${sub.id}`,
                  name: sub.title,
                  type: 'subcategory',
                  level: 4,
                  cardId: card.id,
                  categoryId: cat.id,
                  children: [],
                })),
              };
            }),
          };
        }),
      };
    });
  }, [projectChapters, projectData]);

  return { projectChapters, projectHierarchy };
}
