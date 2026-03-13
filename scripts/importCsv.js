const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'Fichiers imports', 'Projet1_export (2).csv');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'libraryData.js');

function parsePTDuration(ptStr) {
  if (!ptStr || !ptStr.startsWith('PT')) return 0;
  const match = ptStr.match(/PT(\d+)H(\d+)M(\d+)S/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const days = Math.floor(hours / 24);
  return days;
}

function buildLibraryData(csv) {
  const libraryItems = [];
  const cardMap = new Map();
  let itemId = 1;

  const lines = csv.split('\n').filter(line => line.trim());
  const header = lines[0].split(';');
  const chapterIdx = header.indexOf('Chapitre');
  const cardIdx = header.indexOf('Carte');
  const categoryIdx = header.indexOf('Action');
  const subcategoryIdx = header.indexOf('Tâches');
  const durationIdx = header.indexOf('Temps repères');
  const tag1Idx = header.indexOf('Tag 1');
  const tag2Idx = header.indexOf('Tag 2');

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const chapter = (cols[chapterIdx] || '').trim();
    const cardTitle = (cols[cardIdx] || '').trim();
    const categoryTitle = (cols[categoryIdx] || '').trim();
    const subcategoryTitle = (cols[subcategoryIdx] || '').trim();
    const duration = parsePTDuration(cols[durationIdx] || '');
    const tag1 = (cols[tag1Idx] || '').trim();
    const tag2 = (cols[tag2Idx] || '').trim();

    if (!chapter || !cardTitle) continue;

    const tags = [chapter, tag1, tag2].filter(Boolean).join(',');

    let cardItem = cardMap.get(cardTitle);
    if (!cardItem) {
      cardItem = {
        id: itemId++,
        title: cardTitle,
        type: 'card',
        tags: tags,
        duration: duration,
        content_json: JSON.stringify({
          card: { title: cardTitle, description: '', priority: 'normal', duration_days: duration },
          categories: [],
        }),
      };
      cardMap.set(cardTitle, cardItem);
      libraryItems.push(cardItem);
    }

    if (categoryTitle) {
      const content = JSON.parse(cardItem.content_json);
      let category = content.categories.find(c => c.title === categoryTitle);
      if (!category) {
        category = {
          title: categoryTitle,
          description: '',
          priority: 'normal',
          duration_days: duration,
          subcategories: [],
        };
        content.categories.push(category);
      }

      if (subcategoryTitle) {
        if (!category.subcategories.find(s => s.title === subcategoryTitle)) {
          category.subcategories.push({
            title: subcategoryTitle,
            description: '',
            priority: 'normal',
            duration_days: duration,
          });
        }
      }

      cardItem.content_json = JSON.stringify(content);
    }
  }

  return libraryItems;
}

const csvContent = fs.readFileSync(csvPath, 'latin1').replace(/\r/g, '');
const libraryTemplates = buildLibraryData(csvContent);

const jsCode = `function parsePTDuration(ptStr) {
  if (!ptStr || !ptStr.startsWith('PT')) return 0;
  const match = ptStr.match(/PT(\\d+)H(\\d+)M(\\d+)S/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const days = Math.floor(hours / 24);
  return days;
}

function buildLibraryData(csv) {
  const libraryItems = [];
  const cardMap = new Map();
  let itemId = 1;

  const lines = csv.split('\\n').filter(line => line.trim());
  const header = lines[0].split(';');
  const chapterIdx = header.indexOf('Chapitre');
  const cardIdx = header.indexOf('Carte');
  const categoryIdx = header.indexOf('Action');
  const subcategoryIdx = header.indexOf('Tâches');
  const durationIdx = header.indexOf('Temps repères');
  const tag1Idx = header.indexOf('Tag 1');
  const tag2Idx = header.indexOf('Tag 2');

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const chapter = (cols[chapterIdx] || '').trim();
    const cardTitle = (cols[cardIdx] || '').trim();
    const categoryTitle = (cols[categoryIdx] || '').trim();
    const subcategoryTitle = (cols[subcategoryIdx] || '').trim();
    const duration = parsePTDuration(cols[durationIdx] || '');
    const tag1 = (cols[tag1Idx] || '').trim();
    const tag2 = (cols[tag2Idx] || '').trim();

    if (!chapter || !cardTitle) continue;

    const tags = [chapter, tag1, tag2].filter(Boolean).join(',');

    let cardItem = cardMap.get(cardTitle);
    if (!cardItem) {
      cardItem = {
        id: itemId++,
        title: cardTitle,
        type: 'card',
        tags: tags,
        duration: duration,
        content_json: JSON.stringify({
          card: { title: cardTitle, description: '', priority: 'normal', duration_days: duration },
          categories: [],
        }),
      };
      cardMap.set(cardTitle, cardItem);
      libraryItems.push(cardItem);
    }

    if (categoryTitle) {
      const content = JSON.parse(cardItem.content_json);
      let category = content.categories.find(c => c.title === categoryTitle);
      if (!category) {
        category = {
          title: categoryTitle,
          description: '',
          priority: 'normal',
          duration_days: duration,
          subcategories: [],
        };
        content.categories.push(category);
      }

      if (subcategoryTitle) {
        if (!category.subcategories.find(s => s.title === subcategoryTitle)) {
          category.subcategories.push({
            title: subcategoryTitle,
            description: '',
            priority: 'normal',
            duration_days: duration,
          });
        }
      }

      cardItem.content_json = JSON.stringify(content);
    }
  }

  return libraryItems;
}

const csvData = \`${csvContent}\`;

const libraryTemplates = buildLibraryData(csvData);

export { libraryTemplates };
`;

fs.writeFileSync(outputPath, jsCode);
console.log('Fichier libraryData.js généré avec succès!');
console.log('Nombre de templates générés:', libraryTemplates.length);
