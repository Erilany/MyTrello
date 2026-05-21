export function formatDuration(days) {
  const hours = days * 24;
  return `PT${hours}H0M0S`;
}

export function parsePTDuration(ptStr) {
  if (!ptStr) return 0;
  const match = ptStr.match(/PT(\d+)H/);
  return match ? parseInt(match[1]) / 24 : 0;
}

export function migrateLibraryTree(tree) {
  if (!tree || !tree.children) return tree;

  const migrateNode = node => {
    if (node.type === 'carte' && node.data && node.data.skipAction === undefined) {
      node.data.skipAction = false;
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(migrateNode);
    }
  };

  const newTree = { ...tree, children: [...(tree.children || [])] };
  newTree.children.forEach(migrateNode);
  return newTree;
}

export function convertLibraryDataToTree(libraryItems) {
  const tree = { id: 'root', type: 'root', children: [] };
  const chapters = {};

  libraryItems.forEach(item => {
    if (item.type === 'card') {
      try {
        const content = JSON.parse(item.content_json);
        const chapter = item.tags ? item.tags.split(',')[0].trim() : '';

        if (!chapters[chapter]) {
          chapters[chapter] = {
            id: `chapter_${chapter}`,
            type: 'chapitre',
            titre: chapter || 'Sans chapitre',
            expanded: true,
            data: { chapitre: chapter || 'Sans chapitre', temps: 0 },
            children: [],
          };
          tree.children.push(chapters[chapter]);
        }

        const cardNode = {
          id: `card_${item.id}`,
          type: 'carte',
          titre: item.title,
          expanded: true,
          data: {
            carte: item.title,
            temps: content.card?.duration_days || 0,
            skipAction: content.card?.skipAction || false,
            systemTag: '',
          },
          children: [],
        };

        if (content.categories) {
          content.categories.forEach(cat => {
            const catNode = {
              id: `cat_${item.id}_${cat.title}`,
              type: 'categorie',
              titre: cat.title,
              expanded: true,
              data: {
                categorie: cat.title,
                temps: cat.duration_days || 0,
                systemTag: cat.tag || '',
              },
              children: [],
            };

            if (cat.subcategories) {
              cat.subcategories.forEach(sub => {
                catNode.children.push({
                  id: `sub_${item.id}_${cat.title}_${sub.title}`,
                  type: 'souscategorie',
                  titre: sub.title,
                  data: {
                    sousCat1: sub.title,
                    temps: sub.duration_days || 0,
                    systemTag: sub.tag || '',
                  },
                  children: [],
                });
              });
            }

            cardNode.children.push(catNode);
          });
        }

        chapters[chapter].children.push(cardNode);
      } catch (e) {
        console.error('Error parsing library item:', e);
      }
    }
  });

  return tree;
}

export function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const items = [];
  const isOldFormat = lines[0]?.includes('Chapitre;Carte;Catégorie;Sous-catégorie 1');

  for (let i = isOldFormat ? 1 : 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length < 4) continue;

    const item = isOldFormat
      ? {
          chapitre: values[0] || '',
          carte: values[1] || '',
          categorie: values[2] || '',
          sousCat1: values[3] || '',
          sousCat2: '',
          sousCat3: '',
          temps: parsePTDuration(values[7] || '0'),
          systemTag: values[8] || '',
        }
      : {
          chapitre: values[0] || '',
          carte: values[1] || '',
          categorie: values[2] || '',
          sousCat1: values[3] || '',
          sousCat2: values[4] || '',
          sousCat3: values[5] || '',
          temps: parsePTDuration(values[5] || '0'),
          systemTag: values[6] || '',
        };

    if (isOldFormat) {
      item.skipAction = values.length > 7 ? values[7]?.toUpperCase() === 'OUI' : false;
    }

    items.push(item);
  }
  return items;
}

export function buildTree(items) {
  const root = [];
  const chapitreMap = new Map();
  const carteMap = new Map();

  items.forEach(item => {
    if (!item.chapitre) return;

    let chapitre = chapitreMap.get(item.chapitre);
    if (!chapitre) {
      chapitre = {
        id: `chap_${item.chapitre}`,
        type: 'chapitre',
        titre: item.chapitre,
        data: { ...item, carte: '', categorie: '', sousCat1: '', sousCat2: '', sousCat3: '' },
        children: [],
      };
      chapitreMap.set(item.chapitre, chapitre);
      root.push(chapitre);
    }

    if (item.carte) {
      let carte = carteMap.get(item.carte);
      if (!carte) {
        carte = {
          id: `carte_${item.carte}`,
          type: 'carte',
          titre: item.carte,
          data: { ...item, categorie: '', sousCat1: '', sousCat2: '', sousCat3: '' },
          children: [],
        };
        carteMap.set(item.carte, carte);
        chapitre.children.push(carte);
      }

      if (item.categorie) {
        const catId = `cat_${carte.id}_${item.categorie}`;
        let categorie = carte.children.find(c => c.id === catId);
        if (!categorie) {
          categorie = {
            id: catId,
            type: 'categorie',
            titre: item.categorie,
            data: { ...item, sousCat1: '', sousCat2: '', sousCat3: '' },
            children: [],
          };
          carte.children.push(categorie);
        }

        if (item.sousCat1) {
          categorie.children.push({
            id: `sub_${catId}_${item.sousCat1}`,
            type: 'souscategorie',
            titre: item.sousCat1,
            data: item,
            children: [],
          });
        }
      }
    }
  });

  return root;
}

export function treeToCSV(nodes, depth = 0) {
  let csv = '';

  nodes.forEach(node => {
    const indent = Array(depth + 1).join(';');

    if (node.type === 'chapitre') {
      csv += `${indent}${node.titre};;;;;;;\n`;
    } else if (node.type === 'carte') {
      const skipStr = node.data?.skipAction ? 'OUI' : 'NON';
      csv += `${indent}${node.titre};;;;;;${skipStr}\n`;
    } else if (node.type === 'categorie') {
      csv += `${indent}${node.titre};;;;;;\n`;
    } else if (node.type === 'souscategorie') {
      const data = node.data || {};
      const temps = formatDuration(data.temps || 0);
      csv += `${indent}${data.categorie || ''};${data.sousCat1 || ''};;;;${temps};${data.systemTag || ''}\n`;
    }

    if (node.children && node.children.length > 0) {
      csv += treeToCSV(node.children, depth + 1);
    }
  });

  return csv;
}

export function migrateLibraryTreeFull(tree) {
  if (!tree || !Array.isArray(tree)) return [];

  const newTree = JSON.parse(JSON.stringify(tree));

  function traverseNodes(nodes) {
    for (const node of nodes) {
      if (!node.data) node.data = {};

      if (node.type === 'chapitre') {
        node.data.chapitre = node.data.chapitre || node.titre || '';
        node.data.temps = node.data.temps || 0;
      } else if (node.type === 'carte') {
        node.data.carte = node.data.carte || node.titre || '';
        node.data.temps = node.data.temps || 0;
        if (node.data.skipAction === undefined) node.data.skipAction = false;
        if (node.data.systemTag === undefined) node.data.systemTag = '';
      } else if (node.type === 'categorie') {
        node.data.categorie = node.data.categorie || node.titre || '';
        node.data.temps = node.data.temps || 0;
        if (node.data.systemTag === undefined) node.data.systemTag = '';
      } else if (node.type === 'souscategorie') {
        node.data.sousCat1 = node.data.sousCat1 || node.titre || '';
        node.data.temps = node.data.temps || 0;
        if (node.data.systemTag === undefined) node.data.systemTag = '';
      }

      if (node.children && node.children.length > 0) {
        traverseNodes(node.children);
      }
    }
  }

  traverseNodes(newTree);
  return newTree;
}

export function convertTreeToLibraryItems(treeData) {
  const libraryItems = [];
  const cardMap = new Map();
  const categorySet = new Set();
  const subcategorySet = new Set();
  let itemId = 1;

  const processNode = (node, chapitre = '', carte = '', categorie = '') => {
    let currentChapitre = chapitre;
    let currentCarte = carte;
    let currentCategorie = categorie;

    if (node.type === 'chapitre') {
      currentChapitre = node.data.chapitre || node.titre;
    } else if (node.type === 'carte') {
      currentCarte = node.data.carte || node.titre;
    } else if (node.type === 'categorie') {
      currentCategorie = node.data.categorie || node.titre;
    }

    if (node.type === 'carte' || node.type === 'categorie' || node.type === 'souscategorie') {
      const tags = currentChapitre;
      let cardItem = cardMap.get(currentCarte);
      if (!cardItem) {
        cardItem = {
          id: itemId++,
          title: currentCarte,
          type: 'card',
          tags: tags,
          duration: node.data.temps || 0,
          content_json: JSON.stringify({
            card: {
              title: currentCarte,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
              skipAction: node.data.skipAction || false,
            },
            categories: [],
          }),
        };
        cardMap.set(currentCarte, cardItem);
        libraryItems.push(cardItem);
      } else {
        const content = JSON.parse(cardItem.content_json);
        if (node.data.skipAction !== undefined) {
          content.card.skipAction = node.data.skipAction;
          cardItem.content_json = JSON.stringify(content);
        }
      }

      if (node.type === 'categorie' || node.type === 'souscategorie') {
        const content = JSON.parse(cardItem.content_json);
        const catKey = `${currentCarte}_${currentCategorie}`;
        let category = content.categories.find(c => c.title === currentCategorie);
        if (!category) {
          category = {
            title: currentCategorie,
            description: '',
            priority: 'normal',
            duration_days: node.data.temps || 0,
            tag: node.data.systemTag || null,
            subcategories: [],
          };
          content.categories.push(category);
        } else if (node.data.systemTag) {
          category.tag = node.data.systemTag;
        }

        if (!categorySet.has(catKey)) {
          categorySet.add(catKey);
          libraryItems.push({
            id: itemId++,
            title: currentCategorie,
            type: 'category',
            tags: '',
            duration: node.data.temps || 0,
            content_json: JSON.stringify({
              category: {
                title: currentCategorie,
                description: '',
                priority: 'normal',
                duration_days: node.data.temps || 0,
                tag: null,
              },
            }),
          });
        }

        if (node.type === 'souscategorie' && node.data.sousCat1) {
          const subCatKey = `${catKey}_${node.data.sousCat1}`;
          if (!category.subcategories.find(s => s.title === node.data.sousCat1)) {
            category.subcategories.push({
              title: node.data.sousCat1,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
              tag: node.data.systemTag || null,
            });
          }

          if (!subcategorySet.has(subCatKey)) {
            subcategorySet.add(subCatKey);
            libraryItems.push({
              id: itemId++,
              title: node.data.sousCat1,
              type: 'subcategory',
              tags: tags,
              duration: node.data.temps || 0,
              content_json: JSON.stringify({
                subcategory: {
                  title: node.data.sousCat1,
                  description: '',
                  priority: 'normal',
                  duration_days: node.data.temps || 0,
                  tag: node.data.systemTag || null,
                },
              }),
            });
          }
        }

        cardItem.content_json = JSON.stringify(content);
      }
    }

    if (node.children) {
      node.children.forEach(child =>
        processNode(child, currentChapitre, currentCarte, currentCategorie)
      );
    }
  };

  treeData.forEach(node => processNode(node));
  return libraryItems;
}
