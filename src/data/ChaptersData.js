const CHAPTERS_ORDER_KEY = 'd-projet_chapters_order';

export function loadChaptersOrder() {
  try {
    const stored = localStorage.getItem(CHAPTERS_ORDER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveChaptersOrder(order) {
  localStorage.setItem(CHAPTERS_ORDER_KEY, JSON.stringify(order));
}

function extractChaptersFromTree(nodes, chapters = []) {
  if (!nodes || !Array.isArray(nodes)) return chapters;

  for (const node of nodes) {
    if (node.type === 'chapitre') {
      const chapterName = node.titre || node.data?.chapitre || '';
      if (chapterName) {
        chapters.push(chapterName);
      }
    }
    if (node.children) {
      extractChaptersFromTree(node.children, chapters);
    }
  }
  return chapters;
}

export function extractChaptersFromLibrary() {
  try {
    const libraryRaw = localStorage.getItem('d-projet_library_editor');

    if (!libraryRaw) return [];

    const library = JSON.parse(libraryRaw);

    if (!Array.isArray(library)) return [];

    const chapters = [];

    for (const item of library) {
      if (item.type === 'chapitre') {
        const chapterName = item.titre || item.data?.chapitre || '';
        if (chapterName) {
          chapters.push(chapterName);
        }
      } else if (item.chapitre) {
        chapters.push(item.chapitre);
      } else if (
        item.type === 'carte' ||
        item.type === 'categorie' ||
        item.type === 'souscategorie'
      ) {
        extractChaptersFromTree([item], chapters);
      }
    }

    return [...new Set(chapters)];
  } catch {
    return [];
  }
}

export function getOrderedChapters() {
  const order = loadChaptersOrder();
  const chapters = extractChaptersFromLibrary();

  const isSpacer = item => typeof item === 'string' && item.startsWith('__spacer_');

  if (order.length === 0) return chapters;

  const orderedChapters = order.filter(c => chapters.includes(c) || isSpacer(c));
  const newChapters = chapters.filter(c => !order.includes(c));

  return [...orderedChapters, ...newChapters];
}
