import { useState, useCallback } from 'react';
import { parseMSProjectXml } from '../utils/xmlParser';

export function useXmlImport(setTreeData, setHasChanges) {
  const [showXmlImportModal, setShowXmlImportModal] = useState(false);
  const [xmlItems, setXmlItems] = useState([]);
  const [selectedXmlItems, setSelectedXmlItems] = useState([]);

  const handleXmlFileSelect = useCallback(event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result;
        const items = parseMSProjectXml(content);
        setXmlItems(items);
        setSelectedXmlItems(items.map(i => i.id));
        setShowXmlImportModal(true);
      } catch (error) {
        alert(`Erreur lors du parsing XML: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const toggleXmlItem = useCallback(itemId => {
    setSelectedXmlItems(prev => {
      if (prev.includes(itemId)) return prev.filter(id => id !== itemId);
      return [...prev, itemId];
    });
  }, []);

  const selectAllXmlItems = useCallback(() => {
    setSelectedXmlItems(xmlItems.map(i => i.id));
  }, [xmlItems]);

  const deselectAllXmlItems = useCallback(() => {
    setSelectedXmlItems([]);
  }, []);

  const handleConfirmXmlImport = useCallback(() => {
    const selectedItems = xmlItems.filter(i => selectedXmlItems.includes(i.id));
    if (selectedItems.length === 0) {
      alert('Veuillez sélectionner au moins un élément à importer');
      return;
    }

    const roundToHalf = num => Math.round(num * 2) / 2;

    const convertXmlItemsToNodes = items => {
      const rootNodes = [];
      const stack = [];

      items.forEach(item => {
        while (stack.length > 0 && stack[stack.length - 1].outlineLevel >= item.outlineLevel) {
          stack.pop();
        }

        let chapitre = '';
        let carte = '';
        let categorie = '';

        if (item.outlineLevel === 1) {
          chapitre = item.name;
        } else if (item.outlineLevel === 2) {
          const parent = stack.find(p => p.outlineLevel === 1);
          chapitre = parent ? parent.name : '';
          carte = item.name;
        } else if (item.outlineLevel === 3) {
          const parentChap = stack.find(p => p.outlineLevel === 1);
          const parentCart = stack.find(p => p.outlineLevel === 2);
          chapitre = parentChap ? parentChap.name : '';
          carte = parentCart ? parentCart.name : '';
          categorie = item.name;
        } else {
          const parentChap = stack.find(p => p.outlineLevel === 1);
          const parentCart = stack.find(p => p.outlineLevel === 2);
          const parentCat = stack.find(p => p.outlineLevel === 3);
          chapitre = parentChap ? parentChap.name : '';
          carte = parentCart ? parentCart.name : '';
          categorie = parentCat ? parentCat.name : '';
        }

        const node = {
          id: crypto.randomUUID(),
          type:
            item.outlineLevel === 1
              ? 'chapitre'
              : item.outlineLevel === 2
                ? 'carte'
                : item.outlineLevel === 3
                  ? 'categorie'
                  : 'souscategorie',
          titre: item.name,
          expanded: true,
          children: [],
          data: {
            chapitre,
            carte,
            categorie,
            sousCat1: item.outlineLevel >= 4 ? item.name : '',
            temps: roundToHalf(item.duration),
            systemTag: '',
          },
        };

        if (stack.length === 0) {
          rootNodes.push(node);
        } else {
          const parent = stack[stack.length - 1];
          if (parent.node && parent.node.children !== undefined) {
            parent.node.children.push(node);
          }
        }

        stack.push({ ...item, node });
      });

      return rootNodes;
    };

    const newNodes = convertXmlItemsToNodes(selectedItems);

    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newNodes.forEach(newNode => {
        newData.push(JSON.parse(JSON.stringify(newNode)));
      });
      return newData;
    });

    setHasChanges(true);
    setShowXmlImportModal(false);
    setXmlItems([]);
    setSelectedXmlItems([]);
    alert(`${selectedItems.length} élément(s) importé(s) avec succès`);
  }, [xmlItems, selectedXmlItems, setTreeData, setHasChanges]);

  return {
    showXmlImportModal,
    setShowXmlImportModal,
    xmlItems,
    selectedXmlItems,
    handleXmlFileSelect,
    toggleXmlItem,
    selectAllXmlItems,
    deselectAllXmlItems,
    handleConfirmXmlImport,
  };
}
