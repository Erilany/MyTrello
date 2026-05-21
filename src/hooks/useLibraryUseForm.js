import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function findTreeNodeId(cardTitle, categoryTitle = null, subcategoryTitle = null) {
  try {
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (!treeRaw) return null;
    const treeData = JSON.parse(treeRaw);
    const nodes = treeData.children || treeData;
    let foundNodeId = null;

    const traverse = (node, currentCarte = '', currentCategorie = '') => {
      if (foundNodeId) return;
      const carte = node.type === 'carte' ? node.data?.carte || node.titre : currentCarte;
      const cat = node.type === 'categorie' ? node.data?.categorie || node.titre : currentCategorie;

      if (subcategoryTitle && node.type === 'souscategorie') {
        if (node.data?.sousCat1 === subcategoryTitle && carte === cardTitle) {
          if (!categoryTitle || cat === categoryTitle) {
            foundNodeId = node.id;
            return;
          }
        }
      } else if (!subcategoryTitle && categoryTitle && node.type === 'categorie') {
        if (cat === categoryTitle && carte === cardTitle) {
          foundNodeId = node.id;
          return;
        }
      } else if (!subcategoryTitle && !categoryTitle && node.type === 'carte') {
        if (carte === cardTitle) {
          foundNodeId = node.id;
          return;
        }
      }

      if (node.children) {
        node.children.forEach(child => traverse(child, carte, cat));
      }
    };

    nodes.forEach(node => traverse(node));
    return foundNodeId;
  } catch (e) {
    console.error('[findTreeNodeId] Error:', e);
    return null;
  }
}

function getSystemTagFromTree(treeNodeId) {
  if (!treeNodeId) return null;
  try {
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (!treeRaw) return null;
    const treeData = JSON.parse(treeRaw);
    let result = null;
    const find = nodes => {
      for (const node of nodes) {
        if (node.id === treeNodeId) { result = node.data?.systemTag || ''; return true; }
        if (node.children && find(node.children)) return true;
      }
      return false;
    };
    find(treeData.children || treeData);
    return result;
  } catch (e) {
    return null;
  }
}

function getSystemTagBySubcatTitle(subcatTitle) {
  try {
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (!treeRaw) return null;
    const treeData = JSON.parse(treeRaw);
    let result = null;
    const find = nodes => {
      for (const node of nodes) {
        if (node.type === 'souscategorie' && node.data?.sousCat1 === subcatTitle) {
          result = node.data?.systemTag || '';
          return true;
        }
        if (node.children && find(node.children)) return true;
      }
      return false;
    };
    find(treeData.children || treeData);
    return result;
  } catch (e) {
    return null;
  }
}

export function useLibraryUseForm() {
  const navigate = useNavigate();
  const { db, createCard, createCategory, createSubcategory, libraryItems, loadBoard } = useApp();

  const [showUseForm, setShowUseForm] = useState(false);
  const [useFormBoardId, setUseFormBoardId] = useState('');
  const [useFormColumnId, setUseFormColumnId] = useState('');
  const [useFormDestination, setUseFormDestination] = useState('board2');
  const [isUseFormLoading, setIsUseFormLoading] = useState(false);

  const handleMainViewConfirmUse = async (selectedCards, selectedCategories, selectedSubcategories) => {
    if (!useFormBoardId) {
      alert('Veuillez sélectionner un projet');
      return;
    }
    if (
      selectedCards.length === 0 &&
      selectedCategories.length === 0 &&
      selectedSubcategories.length === 0
    ) {
      alert('Veuillez sélectionner au moins un élément dans la bibliothèque');
      setIsUseFormLoading(false);
      return;
    }

    setIsUseFormLoading(true);

    const boardId = parseInt(useFormBoardId);
    const errors = [];
    let cardsAdded = 0;
    let categoriesAdded = 0;
    let subcategoriesAdded = 0;

    const boardCards = db.cards.filter(c => {
      const column = db.columns.find(col => Number(col.id) === Number(c.column_id));
      return column && Number(column.board_id) === boardId;
    });
    const boardCardIds = boardCards.map(c => c.id);

    const boardColumns = db.columns.filter(col => Number(col.board_id) === boardId);
    const firstColumnId = boardColumns.length > 0 ? boardColumns[0].id : null;

    for (const card of selectedCards) {
      try {
        const content = JSON.parse(card.content_json);
        const cardDuration = content.card?.duration_days ?? card.duration ?? 1;
        const cardTitle =
          content.card?.title ||
          content.category?.title ||
          content.subcategory?.title ||
          card.title;

        let cardId;
        let isNewCard = false;

        const existingCard = db.cards.find(c => {
          if (!c.title || c.title.toLowerCase() !== cardTitle.toLowerCase() || c.is_archived)
            return false;
          const col = db.columns.find(col => Number(col.id) === Number(c.column_id));
          return col && Number(col.board_id) === boardId;
        });

        if (existingCard) {
          cardId = existingCard.id;
        }

        if (!cardId && firstColumnId) {
          const tagsStr = card.tags || '';
          const tags = tagsStr.split(',');
          const chapter = tags[0] || null;
          const cardTreeNodeId = findTreeNodeId(cardTitle, null, null);

          cardId = await createCard(
            firstColumnId,
            cardTitle,
            content.card?.description || content.category?.description || content.subcategory?.description || '',
            content.card?.priority || 'normal',
            content.card?.due_date || null,
            content.card?.assignee || '',
            null,
            cardDuration,
            null,
            null,
            chapter,
            cardTreeNodeId,
            content.card?.skipAction || false
          );
          isNewCard = true;
        }

        if (cardId) {
          if (isNewCard) cardsAdded++;

          const totalSelectedSubcats = selectedSubcategories.filter(ss => ss.cardTitle === cardTitle);
          const isSingleTask = totalSelectedSubcats.length === 1;

          if (isSingleTask && totalSelectedSubcats.length > 0) {
            const subcat = totalSelectedSubcats[0];
            let defaultCat = db.categories.find(
              c => Number(c.card_id) === cardId && !c.parent_id && c.title === 'Tâches'
            );
            if (!defaultCat) {
              try {
                const newCatId = await createCategory(cardId, 'Tâches', '', 'normal', null, '', null, 1, null, null);
                defaultCat = { id: newCatId };
              } catch (e) {}
            }
            if (defaultCat) {
              try {
                const treeNodeId = findTreeNodeId(cardTitle, null, subcat.title);
                const systemTag = getSystemTagFromTree(treeNodeId);
                const subcatDuration = subcat.duration_days ?? 1;
                await createSubcategory(
                  defaultCat.id,
                  subcat.title,
                  subcat.description || '',
                  subcat.priority || 'normal',
                  subcat.due_date || null,
                  subcat.assignee || '',
                  null,
                  subcatDuration,
                  systemTag,
                  treeNodeId
                );
              } catch (e) {}
            }
            continue;
          }

          const cardCategories = content.categories || [];
          for (const cat of cardCategories) {
            const isCatSelected = selectedCategories.some(
              sc => sc.title === cat.title && sc.cardTitle === cardTitle
            );
            if (isCatSelected && cardId) {
              try {
                const categoryDuration = cat.duration_days ?? 1;
                const existingCatsForCard = db.categories.filter(
                  c => Number(c.card_id) === cardId && !c.parent_id
                );
                const existingCat = existingCatsForCard.find(
                  c => c.title && c.title.toLowerCase() === cat.title.toLowerCase()
                );

                if (existingCat) {
                  errors.push(`Catégorie "${cat.title}": existe déjà pour la carte "${cardTitle}"`);
                  const categoryId = existingCat.id;
                  for (const subcat of (cat.subcategories || [])) {
                    const isSubcatSelected = selectedSubcategories.some(
                      ss => ss.title === subcat.title && ss.categoryTitle === cat.title && ss.cardTitle === cardTitle
                    );
                    if (isSubcatSelected) {
                      try {
                        const existingSubcats = db.subcategories.filter(s => Number(s.category_id) === categoryId);
                        const existingSubcat = existingSubcats.find(s => s.title && s.title.toLowerCase() === subcat.title.toLowerCase());
                        if (existingSubcat) {
                          errors.push(`Sous-catégorie "${subcat.title}": existe déjà dans la catégorie "${cat.title}"`);
                        } else {
                          const subcatDuration = subcat.duration_days ?? 1;
                          const subcatTreeNodeId = findTreeNodeId(cardTitle, cat.title, subcat.title);
                          const systemTag = getSystemTagFromTree(subcatTreeNodeId) || getSystemTagBySubcatTitle(subcat.title);
                          await createSubcategory(categoryId, subcat.title, subcat.description || '', subcat.priority || 'normal', subcat.due_date || null, subcat.assignee || '', null, subcatDuration, systemTag, subcatTreeNodeId);
                          subcategoriesAdded++;
                        }
                      } catch (subcatErr) {
                        errors.push(`Sous-catégorie "${subcat.title}": ${subcatErr.message}`);
                      }
                    }
                  }
                } else {
                  const categoryTreeNodeId = findTreeNodeId(cardTitle, cat.title, null);
                  const categoryId = await createCategory(cardId, cat.title, cat.description || '', cat.priority || 'normal', cat.due_date || null, cat.assignee || '', null, categoryDuration, null, categoryTreeNodeId);
                  categoriesAdded++;

                  for (const subcat of (cat.subcategories || [])) {
                    const isSubcatSelected = selectedSubcategories.some(
                      ss => ss.title === subcat.title && ss.categoryTitle === cat.title && ss.cardTitle === cardTitle
                    );
                    if (isSubcatSelected) {
                      try {
                        const existingSubcats = db.subcategories.filter(s => Number(s.category_id) === categoryId);
                        const existingSubcat = existingSubcats.find(s => s.title && s.title.toLowerCase() === subcat.title.toLowerCase());
                        if (existingSubcat) {
                          errors.push(`Sous-catégorie "${subcat.title}": existe déjà dans la catégorie "${cat.title}"`);
                        } else {
                          const subcatDuration = subcat.duration_days ?? 1;
                          const subcatTreeNodeId = findTreeNodeId(cardTitle, cat.title, subcat.title);
                          const systemTag = getSystemTagFromTree(subcatTreeNodeId) || getSystemTagBySubcatTitle(subcat.title);
                          await createSubcategory(categoryId, subcat.title, subcat.description || '', subcat.priority || 'normal', subcat.due_date || null, subcat.assignee || '', null, subcatDuration, systemTag, subcatTreeNodeId);
                          subcategoriesAdded++;
                        }
                      } catch (subcatErr) {
                        errors.push(`Sous-catégorie "${subcat.title}": ${subcatErr.message}`);
                      }
                    }
                  }
                }
              } catch (catErr) {
                errors.push(`Catégorie "${cat.title}": ${catErr.message}`);
              }
            }
          }
        }
      } catch (cardErr) {
        errors.push(`Carte "${card.title}": ${cardErr.message}`);
      }
    }

    // Catégories standalone (non liées à une carte sélectionnée)
    for (const cat of selectedCategories.filter(
      cat => !selectedCards.some(
        sc => sc.title === cat.cardTitle ||
          (sc.content_json && JSON.parse(sc.content_json).card?.title === cat.cardTitle)
      )
    )) {
      try {
        const categoryDuration = cat.duration_days ?? 1;
        const existingCat = db.categories.find(
          c => c.title && c.title.toLowerCase() === cat.title.toLowerCase() && !c.parent_id && boardCardIds.includes(Number(c.card_id))
        );
        if (existingCat) {
          errors.push(`Catégorie "${cat.title}": existe déjà dans ce projet`);
          continue;
        }
        const categoryTreeNodeId = findTreeNodeId(cat.cardTitle, cat.title, null);
        const categoryId = await createCategory(null, cat.title, cat.description || '', cat.priority || 'normal', cat.due_date || null, cat.assignee || '', null, categoryDuration, null, categoryTreeNodeId);
        categoriesAdded++;

        for (const subcat of selectedSubcategories.filter(ss => ss.categoryTitle === cat.title && !ss.cardTitle)) {
          try {
            const existingSubcat = db.subcategories.find(s => s.title && s.title.toLowerCase() === subcat.title.toLowerCase() && Number(s.category_id) === categoryId);
            if (existingSubcat) {
              errors.push(`Sous-catégorie "${subcat.title}": existe déjà dans ce projet`);
              continue;
            }
            const subcatDuration = subcat.duration_days ?? 1;
            const treeNodeId = findTreeNodeId(cat.cardTitle || '', cat.title, subcat.title);
            const systemTag = getSystemTagFromTree(treeNodeId);
            await createSubcategory(categoryId, subcat.title, subcat.description || '', subcat.priority || 'normal', subcat.due_date || null, subcat.assignee || '', null, subcatDuration, systemTag, treeNodeId);
            subcategoriesAdded++;
          } catch (subcatErr) {
            errors.push(`Sous-catégorie "${subcat.title}": ${subcatErr.message}`);
          }
        }
      } catch (catErr) {
        errors.push(`Catégorie "${cat.title}": ${catErr.message}`);
      }
    }

    loadBoard(boardId, db);

    setTimeout(() => {
      if (useFormDestination === 'board2') {
        navigate('/board2');
      } else {
        navigate(`/board/${boardId}`);
      }
      setIsUseFormLoading(false);

      const hasNewCards = cardsAdded > 0;
      const hasNewCategories = categoriesAdded > 0;
      const hasNewSubcats = subcategoriesAdded > 0;

      let message = '';
      if (errors.length === 0) {
        if (hasNewCards || hasNewCategories || hasNewSubcats) {
          message = 'Opération terminée !';
          if (hasNewCards) message += `\n${cardsAdded} carte(s) créée(s)`;
          if (hasNewCategories) message += `\n${categoriesAdded} catégorie(s) créée(s)`;
          if (hasNewSubcats) message += `\n${subcategoriesAdded} sous-catégorie(s) ajoutée(s)`;
        } else {
          message = "Aucun élément ajouté :\n- Les éléments sélectionnés existent déjà dans le projet\n- Ou aucun élément n'a été sélectionné";
        }
      } else {
        message = 'Opération terminée avec avertissements :\n';
        if (hasNewCards) message += `\n${cardsAdded} carte(s) créée(s)`;
        if (hasNewCategories) message += `\n${categoriesAdded} catégorie(s) créée(s)`;
        if (hasNewSubcats) message += `\n${subcategoriesAdded} sous-catégorie(s) ajoutée(s)`;
        if (errors.length > 0) message += `\n\nÉléments non copiés (doublons) :\n${errors.join('\n')}`;
      }
      alert(message);
    }, 300);
  };

  return {
    showUseForm, setShowUseForm,
    useFormBoardId, setUseFormBoardId,
    useFormColumnId, setUseFormColumnId,
    useFormDestination, setUseFormDestination,
    isUseFormLoading,
    handleMainViewConfirmUse,
  };
}
