import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp, loadFromStorage } from '../../context/AppContext';
import { usePlanning } from '../../hooks/usePlanning';
import Exchange from '../Exchange/Exchange';
import { getOrderedChapters } from '../../data/ChaptersData';
import { formatDateFrench } from '../../utils/dateUtils';
import { PlanningView } from '../Planning';
import { useBoardInformationsData } from '../../hooks/useBoardInformationsData';
import {
  normalizeChapter,
  normalizeString,
  isSpacer,
  fallbackToBat,
  getCardSkipAction,
  getCardTasks,
  getLibraryCardForProjectCard,
} from './boardUtils';
import { BoardInformations } from './BoardInformations';
import BoardCommandesTab from './BoardCommandesTab';
import BoardTachesTab from './BoardTachesTab';

// =============================================================================
// SECTION: IMPORTS
// =============================================================================

import {
  Plus,
  ListTodo,
  Calendar,
  MessageSquare,
  ShoppingCart,
  Info,
  Trash2,
  X,
  ExternalLink,
  User,
  Building,
  Pencil,
  Link as LinkIcon,
  FolderOpen,
  Mail,
} from 'lucide-react';
import { getSubcategoryTagFromLibrary } from '../Settings/favoritesUtils';

// =============================================================================
// SECTION: DÉFINITION DU COMPOSANT PRINCIPAL
// =============================================================================

function Board2() {
  const {
    currentBoard,
    archiveBoard,
    canArchiveBoard,
    getUnreadCount,
    cards,
    categories,
    subcategories,
    columns,
    setSelectedCard,
    setSelectedSubcategory,
    createSubcategory,
    deleteSubcategory,
    deleteCard,
    createCard,
    createCategory,
    loadBoard,
    libraryItems,
    activeTab: contextActiveTab,
    setActiveTab: contextSetActiveTab,
    selectedCommande: contextSelectedCommande,
    setSelectedCommande: contextSetSelectedCommande,
    activeTabCommande: contextActiveTabCommande,
    setActiveTabCommande: contextSetActiveTabCommande,
    getEmailsForSubcategory,
  } = useApp();

  // =============================================================================
  // SECTION: STATE (useState hooks - 34 states)
  // =============================================================================

  const activeTab = contextActiveTab;
  const setActiveTab = contextSetActiveTab;
  const previousActiveTabRef = useRef('taches');

  const {
    allFunctions,
    links,
    setLinks,
    eotpLines,
    setEotpLines,
    internalContacts,
    setInternalContacts,
    showAddInternal,
    setShowAddInternal,
    newInternalTitle,
    setNewInternalTitle,
    externalContacts,
    setExternalContacts,
    boardGMR,
    setBoardGMR,
    boardPriority,
    setBoardPriority,
    boardZone,
    setBoardZone,
    isInitialized,
    updateExternalContact,
    saveAllProjectData,
  } = useBoardInformationsData(currentBoard);

  // --- États pour Tâches ---
  useEffect(() => {
    const openTab = localStorage.getItem('c-projets_open_tab');
    if (openTab === 'planning') {
      setActiveTab('planning');
      localStorage.removeItem('c-projets_open_tab');
    }
  }, []);

  useEffect(() => {
    if (previousActiveTabRef.current !== activeTab) {
      if (isInitialized) {
        saveAllProjectData();
      }
      previousActiveTabRef.current = activeTab;
    }
  }, [activeTab, isInitialized]);

  useEffect(() => {
    if (selectedCategoryForTasks && subcategories) {
      const updatedSubcats = subcategories.filter(
        s => s.category_id === selectedCategoryForTasks.category.id
      );
      if (
        JSON.stringify(updatedSubcats) !== JSON.stringify(selectedCategoryForTasks.subcategories)
      ) {
        setSelectedCategoryForTasks(prev => ({
          ...prev,
          subcategories: updatedSubcats,
        }));
      }
    }
  }, [subcategories]);

  const [libraryUpdateTrigger, setLibraryUpdateTrigger] = useState(0);

  useEffect(() => {
    setLibraryUpdateTrigger(prev => prev + 1);
  }, [libraryItems]);

  useEffect(() => {
    const handleLibraryUpdate = () => {
      setLibraryUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('library-updated', handleLibraryUpdate);
    return () => window.removeEventListener('library-updated', handleLibraryUpdate);
  }, []);

  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedCategoryForTasks, setSelectedCategoryForTasks] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [hoveredCategoryData, setHoveredCategoryData] = useState(null);
  const [hoverPanelVisible, setHoverPanelVisible] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const {
    planningSelectedTasks,
    expandedPlanningChapters,
    expandedPlanningCards,
    expandedPlanningCategories,
    planningSortOrder,
    setPlanningSortOrder,
    ganttZoom,
    setGanttZoom,
    ganttStartDate,
    setGanttStartDate,
    ganttStartDateInput,
    setGanttStartDateInput,
    togglePlanningTask,
    selectAllTasks,
    deselectAllTasks,
    toggleChapter,
    toggleCard,
    toggleCategory,
    centerGanttOnTask,
  } = usePlanning(currentBoard, subcategories);

  const getProjectTasks = useCallback(() => {
    return subcategories.map(sub => {
      const category = categories.find(c => Number(c.id) === Number(sub.category_id));
      const card = category ? cards.find(c => Number(c.id) === Number(category.card_id)) : null;
      return { ...sub, category, card };
    });
  }, [subcategories, categories, cards]);

  const projectTasks = useMemo(() => {
    return getProjectTasks();
  }, [getProjectTasks]);

  const getSelectedTasks = () => {
    const allTasks = getProjectTasks();
    if (planningSelectedTasks.length === 0) return allTasks;
    return allTasks.filter(t => planningSelectedTasks.includes(t.id));
  };

  const [showTaskSelector, setShowTaskSelector] = useState(false);

  const tabs = [
    { id: 'informations', label: 'Informations', icon: Info },
    { id: 'taches', label: 'Tâches', icon: ListTodo },
    { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'echanges', label: 'Échanges', icon: MessageSquare },
  ];

  useEffect(() => {
    if (currentBoard?.id) {
      loadBoard(currentBoard.id);
      contextSetSelectedCommande(null);
    }
  }, [currentBoard?.id, loadBoard]);




  const [importing, setImporting] = useState(false);

  const handleImportPlanning = async result => {
    const { items, createFullChains } = result;

    if (!currentBoard) {
      alert('Aucun projet sélectionné');
      return;
    }

    const storageData = loadFromStorage();
    const boardColumns = storageData.columns.filter(
      c => Number(c.board_id) === Number(currentBoard.id)
    );
    const firstColumn = boardColumns.length > 0 ? boardColumns[0] : null;

    if (!firstColumn) {
      alert('Aucune colonne disponible dans ce projet');
      return;
    }

    setImporting(true);
    let cardsCreated = 0;
    let catsCreated = 0;
    let subcatsCreated = 0;

    let currentCardId = null;
    let currentCatId = null;
    let currentChapter = null;
    const createdCategories = [];

    for (const item of items) {
      const level = item.outlineLevel || 2;

      if (level === 2) {
        currentChapter = item.assignedChapter || currentChapter || 'Sans chapitre';
        try {
          const cardId = await createCard(
            firstColumn.id,
            item.name,
            '',
            'normal',
            item.finish || null,
            '',
            item.start || null,
            item.duration || 1,
            null,
            null,
            currentChapter
          );
          currentCardId = cardId;
          currentCatId = null;
          cardsCreated++;
          if (createFullChains && cardId) {
            const catId = await createCategory(
              cardId,
              item.name,
              '',
              'normal',
              item.finish || null,
              '',
              null,
              item.duration || 1,
              null
            );
            currentCatId = catId;
            createdCategories.push({
              id: catId,
              name: item.name,
              start: item.start,
              finish: item.finish,
              duration: item.duration || 1,
            });
            catsCreated++;
            const subId = await createSubcategory(
              catId,
              item.name,
              '',
              'normal',
              item.finish || null,
              '',
              item.start || null,
              item.duration || 1
            );
            subcatsCreated++;
          }
        } catch (error) {
          console.error('[Import] Error creating card:', error);
        }
      } else if (level === 3 && currentCardId) {
        try {
          const catId = await createCategory(
            currentCardId,
            item.name,
            '',
            'normal',
            item.finish || null,
            '',
            null,
            item.duration || 1,
            null,
            null
          );
          currentCatId = catId;
          createdCategories.push({
            id: catId,
            name: item.name,
            start: item.start,
            finish: item.finish,
            duration: item.duration || 1,
          });
          catsCreated++;
          if (createFullChains && catId) {
            const subId = await createSubcategory(
              catId,
              item.name,
              '',
              'normal',
              item.finish || null,
              '',
              item.start || null,
              item.duration || 1
            );
            subcatsCreated++;
          }
        } catch (error) {
          console.error('[Import] Error creating category:', error);
        }
      } else if (level >= 4 && currentCatId) {
        try {
          await createSubcategory(
            currentCatId,
            item.name,
            '',
            'normal',
            item.finish || null,
            '',
            item.start || null,
            item.duration || 1
          );
          subcatsCreated++;
        } catch (error) {
          console.error('[Import] Error creating subcategory:', error);
        }
      } else if (level === 3 && !currentCardId) {
      } else if (level >= 4 && !currentCatId) {
      }
    }

    const catsWithSubcats = new Set();
    for (const item of items) {
      if (item.outlineLevel === 3 && item.hasChildren) {
        const catIndex = items.indexOf(item);
        let hasChild = false;
        for (let i = catIndex + 1; i < items.length; i++) {
          if (items[i].outlineLevel > 3) {
            hasChild = true;
            break;
          } else if (items[i].outlineLevel <= 3) {
            break;
          }
        }
        if (hasChild) {
          let catIdToMark = null;
          for (const cat of createdCategories) {
            if (cat.name === item.name) {
              catIdToMark = cat.id;
              break;
            }
          }
          if (catIdToMark) {
            catsWithSubcats.add(catIdToMark);
          }
        }
      }
    }

    if (!createFullChains) {
      const catsWithoutSubcats = createdCategories.filter(cat => !catsWithSubcats.has(cat.id));
      for (const cat of catsWithoutSubcats) {
        try {
          await createSubcategory(
            cat.id,
            cat.name,
            '',
            'normal',
            cat.finish || null,
            '',
            cat.start || null,
            cat.duration || 1
          );
          subcatsCreated++;
        } catch (error) {
          console.error('[Import] Error creating task for empty category:', error);
        }
      }
    } else {
    }

    setImporting(false);

    if (currentBoard) {
      loadBoard(currentBoard.id);
    }

    setTimeout(() => {
      alert(
        `Import terminé: ${cardsCreated} carte(s), ${catsCreated} action(s), ${subcatsCreated} tâche(s)`
      );
    }, 100);
  };


  const handleArchiveBoard = () => {
    if (!currentBoard) return;
    const { canArchive, reason } = canArchiveBoard(currentBoard.id);
    if (!canArchive) {
      alert(reason);
      return;
    }
    if (window.confirm(`Voulez-vous archiver le projet "${currentBoard.title}" ?`)) {
      archiveBoard(currentBoard.id);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          {currentBoard?.description && (
            <p className="text-sm text-secondary mb-2">{currentBoard.description}</p>
          )}
        </div>
      </div>

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[...links]
            .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
            .map(link => (
              <button
                key={link.id}
                onClick={() => {
                  if (link.url) {
                    if (link.type === 'folder') {
                      const folderPath = link.url;
                      if (window.electron && window.electron.invoke) {
                        window.electron
                          .invoke('shell:openFolder', folderPath)
                          .then(result => {
                            if (!result.success) {
                              console.error('Erreur ouverture dossier:', result.error);
                              alert("Impossible d'ouvrir le dossier: " + result.error);
                            }
                          })
                          .catch(err => {
                            console.error('Erreur IPC:', err);
                            fallbackToBat(folderPath);
                          });
                      } else {
                        fallbackToBat(folderPath);
                      }
                    } else {
                      window.open(link.url, '_blank');
                    }
                  } else {
                    const url = prompt(
                      "Entrez l'URL/dossier :",
                      link.type === 'folder' ? 'C:\\' : 'https://'
                    );
                    if (url) {
                      setLinks(links.map(l => (l.id === link.id ? { ...l, url } : l)));
                    }
                  }
                }}
                className="flex items-center px-3 py-1.5 bg-card hover:bg-card-hover border border-std rounded text-sm text-primary transition-std"
                style={{ borderLeftColor: link.color, borderLeftWidth: '3px' }}
              >
                {link.type === 'web' ? (
                  <ExternalLink size={14} className="mr-2" style={{ color: link.color }} />
                ) : (
                  <FolderOpen size={14} className="mr-2" style={{ color: link.color }} />
                )}
                {link.title}
              </button>
            ))}
        </div>
      )}

      <div className="flex border-b border-std mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const unreadCount =
            tab.id === 'echanges' && currentBoard ? getUnreadCount(currentBoard.id) : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-std ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary hover:border-std'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {tab.label}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-urgent text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'taches' && (
        <BoardTachesTab
          selectedChapter={selectedChapter}
          setSelectedChapter={setSelectedChapter}
          selectedCategoryForTasks={selectedCategoryForTasks}
          setSelectedCategoryForTasks={setSelectedCategoryForTasks}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          hoveredCategoryData={hoveredCategoryData}
          setHoveredCategoryData={setHoveredCategoryData}
          hoverPanelVisible={hoverPanelVisible}
          setHoverPanelVisible={setHoverPanelVisible}
          hoverTimeoutRef={hoverTimeoutRef}
        />
      )}


      {/* ============================================================================= */}
      {/* SECTION: OUTILET COMMANDES */}
      {/* ============================================================================= */}

      {activeTab === 'commandes' && <BoardCommandesTab eotpLines={eotpLines} isInitialized={isInitialized} internalContacts={internalContacts} />}

      {activeTab === 'planning' && (
        <PlanningView
          currentBoard={currentBoard}
          tasks={projectTasks}
          cards={cards}
          categories={categories}
          selectedTaskIds={planningSelectedTasks}
          onToggleTask={togglePlanningTask}
          onSelectAll={ids => selectAllTasks(ids)}
          onDeselectAll={deselectAllTasks}
          showTaskSelector={showTaskSelector}
          setShowTaskSelector={setShowTaskSelector}
          expandedChapters={expandedPlanningChapters}
          expandedCards={expandedPlanningCards}
          expandedCategories={expandedPlanningCategories}
          onToggleChapter={toggleChapter}
          onToggleCard={toggleCard}
          onToggleCategory={toggleCategory}
          onExpandAll={(chapters, cards, cats) => {
            setExpandedPlanningChapters(chapters);
            setExpandedPlanningCards(cards);
            setExpandedPlanningCategories(cats);
          }}
          onCenterTask={centerGanttOnTask}
          onEditTask={task => setSelectedSubcategory(task)}
          sortOrder={planningSortOrder}
          setSortOrder={setPlanningSortOrder}
          zoom={ganttZoom}
          setZoom={setGanttZoom}
          ganttStartDate={ganttStartDate}
          orderedChapters={getOrderedChapters()}
          onImportPlanning={handleImportPlanning}
          importing={importing}
        />
      )}

      {/* ============================================================================= */}
      {/* SECTION: OUTILET ÉCHANGES (ligne 3001) */}
      {/* ============================================================================= */}

      {activeTab === 'echanges' && currentBoard && <Exchange boardId={currentBoard.id} />}

      {/* ============================================================================= */}
      {/* SECTION: OUTILET INFORMATIONS (lignes 3003-3850) */}
      {/* ============================================================================= */}

      {activeTab === 'informations' && (
        <BoardInformations
          boardGMR={boardGMR}
          setBoardGMR={setBoardGMR}
          boardPriority={boardPriority}
          setBoardPriority={setBoardPriority}
          boardZone={boardZone}
          setBoardZone={setBoardZone}
          links={links}
          setLinks={setLinks}
          fallbackToBat={fallbackToBat}
          internalContacts={internalContacts}
          setInternalContacts={setInternalContacts}
          allFunctions={allFunctions}
          externalContacts={externalContacts}
          setExternalContacts={setExternalContacts}
          updateExternalContact={updateExternalContact}
          showAddInternal={showAddInternal}
          setShowAddInternal={setShowAddInternal}
          newInternalTitle={newInternalTitle}
          setNewInternalTitle={setNewInternalTitle}
          eotpLines={eotpLines}
          setEotpLines={setEotpLines}
        />
      )}

    </div>
  );
}

export default Board2;
