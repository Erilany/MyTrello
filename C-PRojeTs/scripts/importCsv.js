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

const cp1252ToUnicode = {
  '\u0080': '\u20AC', // €
  '\u0081': '\u0081', // UNUSED
  '\u201A': '\u0082', // ‚
  '\u0192': '\u0083', // ƒ
  '\u201E': '\u0084', // „
  '\u2026': '\u0085', // …
  '\u2020': '\u0086', // †
  '\u2021': '\u0087', // ‡
  '\u02C6': '\u0088', // ˆ
  '\u2030': '\u0089', // ‰
  '\u0160': '\u008A', // Š
  '\u2039': '\u008B', // ‹
  '\u0152': '\u008C', // Œ
  '\u008D': '\u008D', // UNUSED
  '\u008E': '\u008E', // UNUSED
  '\u008F': '\u008F', // UNUSED
  '\u0090': '\u0090', // UNUSED
  '\u2018': '\u0091', // '
  '\u2019': '\u0092', // '
  '\u201C': '\u0093', // "
  '\u201D': '\u0094', // "
  '\u2022': '\u0095', // •
  '\u2013': '\u0096', // –
  '\u2014': '\u0097', // —
  '\u0098': '\u0098', // UNUSED
  '\u2122': '\u0099', // ™
  '\u0161': '\u009A', // š
  '\u203A': '\u009B', // ›
  '\u0153': '\u009C', // œ
  '\u009D': '\u009D', // UNUSED
  '\u009E': '\u009E', // UNUSED
  '\u0178': '\u009F', // Ÿ
  '\u00A0': '\u00A0', // NBSP
  '\u00A1': '\u00A1', // ¡
  '\u00A2': '\u00A2', // ¢
  '\u00A3': '\u00A3', // £
  '\u00A4': '\u00A4', // ¤
  '\u00A5': '\u00A5', // ¥
  '\u00A6': '\u00A6', // ¦
  '\u00A7': '\u00A7', // §
  '\u00A8': '\u00A8', // ¨
  '\u00A9': '\u00A9', // ©
  '\u00AA': '\u00AA', // ª
  '\u00AB': '\u00AB', // «
  '\u00AC': '\u00AC', // ¬
  '\u00AD': '\u00AD', // SHY
  '\u00AE': '\u00AE', // ®
  '\u00AF': '\u00AF', // ¯
};

function escapeForJS(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);
    if (code > 127) {
      const unicode = cp1252ToUnicode[char];
      if (unicode) {
        result += '\\u' + unicode.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase();
      } else {
        result += '\\u' + code.toString(16).padStart(4, '0').toUpperCase();
      }
    } else if (code === 92) {
      result += '\\\\';
    } else if (code === 96) {
      result += '\\`';
    } else if (code === 36) {
      result += '\\$';
    } else {
      result += char;
    }
  }
  return result;
}
const csvDataEscaped = escapeForJS(csvContent);
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

const csvData = \`${csvDataEscaped}\`;

const libraryTemplates = buildLibraryData(csvData);

export { libraryTemplates };
`;

fs.writeFileSync(outputPath, jsCode);
console.log('Fichier libraryData.js généré avec succès!');
console.log('Nombre de templates générés:', libraryTemplates.length);
