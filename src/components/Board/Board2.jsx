import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp, loadFromStorage } from '../../context/AppContext';
import { usePlanning } from '../../hooks/usePlanning';
import Exchange from '../Exchange/Exchange';
import { getOrderedChapters } from '../../data/ChaptersData';
import { PlanningView } from '../Planning';
import { PaiementsForm } from './forms/PaiementsForm';
import {
  normalizeChapter,
  normalizeString,
  getCardSkipAction,
  getCardTasks,
  getLibraryCardForProjectCard,
} from './boardUtils';
import { BoardInformations } from './BoardInformations';
import { BoardCommandes } from './BoardCommandes';

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
  PlusCircle,
  User,
  Building,
  Pencil,
  Link as LinkIcon,
  FolderOpen,
  Mail,
  Upload,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { GROUPES_MARCHANDISES, CATEGORY_KEYS } from '../../data/GroupesMarchandises';

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
  } = useApp();

  // =============================================================================
  // SECTION: STATE (useState hooks - 34 states)
  // =============================================================================

  const activeTab = contextActiveTab;
  const setActiveTab = contextSetActiveTab;
  const previousActiveTabRef = useRef('taches');
  const [isInitialized, setIsInitialized] = useState(false);

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

  const [links, setLinks] = useState([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'web', color: '#22C55E' });

  const [eotpLines, setEotpLines] = useState([]);
  const defaultInternalContacts = [
    { id: 1, title: 'Manager de projets' },
    { id: 2, title: 'Chargé(e) de Concertation' },
    { id: 3, title: "Chargé(e) d'Etudes LA" },
    { id: 4, title: "Chargé(e) d'Etudes LS" },
    { id: 5, title: "Chargé(e) d'Etudes Poste HT" },
    { id: 6, title: "Chargé(e) d'Etudes Poste BT et CC" },
    { id: 7, title: "Chargé(e) d'Etudes SPC" },
    { id: 8, title: 'Contrôleur Travaux' },
    { id: 9, title: 'Assistant(e) Etudes' },
  ];
  const [internalContacts, setInternalContacts] = useState(defaultInternalContacts);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [newInternalTitle, setNewInternalTitle] = useState('');
  const [externalContacts, setExternalContacts] = useState([]);
  const [entrepriseSuggestions, setEntrepriseSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState({});
  const [boardGMR, setBoardGMR] = useState('');
  const [boardPriority, setBoardPriority] = useState('');
  const [boardZone, setBoardZone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentBoardIdRef = useRef(null);

  useEffect(() => {
    if (currentBoard?.id) {
      currentBoardIdRef.current = currentBoard.id;
      loadBoard(currentBoard.id);
      contextSetSelectedCommande(null);
      setSelectedAvenant(null);
    }
  }, [currentBoard?.id, loadBoard]);

  const saveToStorage = (key, value) => {
    const boardId = currentBoardIdRef.current;
    if (boardId) {
      localStorage.setItem(`board-${boardId}-${key}`, value);
    } else {
    }
  };

  const fallbackToBat = folderPath => {
    const batContent = `@echo off\nstart explorer "${folderPath}"`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'open_folder.bat';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveLinks = () => saveToStorage('links', JSON.stringify(links));
  const saveCommandes = () => saveToStorage('commandes', JSON.stringify(commandes));
  const saveEotp = () => saveToStorage('eotp', JSON.stringify(eotpLines));
  const saveInternalContacts = () =>
    saveToStorage('internalContacts', JSON.stringify(internalContacts));
  const saveExternalContacts = () => {
    saveToStorage('externalContacts', JSON.stringify(externalContacts));

    const allCurrent = JSON.parse(localStorage.getItem('c-projets_entreprises') || '[]');
    const newContacts = externalContacts.filter(ec => ec.entreprise && ec.nom);
    const merged = [...allCurrent];
    newContacts.forEach(newC => {
      const key = `${(newC.entreprise || '').toLowerCase().trim()}-${(newC.nom || '').toLowerCase().trim()}-${(newC.prenom || '').toLowerCase().trim()}`;
      const exists = merged.find(
        m =>
          `${(m.entreprise || '').toLowerCase().trim()}-${(m.nom || '').toLowerCase().trim()}-${(m.prenom || '').toLowerCase().trim()}` ===
          key
      );
      if (!exists) {
        merged.push(newC);
      }
    });
    localStorage.setItem('c-projets_entreprises', JSON.stringify(merged));
  };

  const getFilteredSuggestions = query => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return entrepriseSuggestions
      .filter(ent => (ent.entreprise || '').toLowerCase().includes(q))
      .slice(0, 5);
  };

  const handleEntrepriseChange = (idx, value) => {
    const updated = [...externalContacts];
    updated[idx].entreprise = value;
    setExternalContacts(updated);
    setShowSuggestions(prev => ({ ...prev, [idx]: value.length >= 2 }));
  };

  const handleSelectSuggestion = (idx, suggestion) => {
    const updated = [...externalContacts];
    updated[idx] = {
      ...updated[idx],
      entreprise: suggestion.entreprise || '',
      fonction: suggestion.fonction || '',
      nom: suggestion.nom || '',
      prenom: suggestion.prenom || '',
      email: suggestion.email || '',
      telBureau: suggestion.telBureau || '',
      telPortable: suggestion.telPortable || '',
    };
    setExternalContacts(updated);
    setShowSuggestions(prev => ({ ...prev, [idx]: false }));
  };

  const updateExternalContact = (idx, field, value) => {
    setExternalContacts(prev =>
      prev.map((contact, i) => (i === idx ? { ...contact, [field]: value } : contact))
    );
  };

  const [commandes, setCommandes] = useState([]);
  const [selectedAvenant, setSelectedAvenant] = useState(null);
  const [showAddCommande, setShowAddCommande] = useState(false);
  const [newCommandeTitle, setNewCommandeTitle] = useState('');
  const [isLoadingCommande, setIsLoadingCommande] = useState(false);

  const [commandeDetail, setCommandeDetail] = useState({
    affectation: {
      numeroAffaire: '',
      dateReception: '',
      dateLimite: '',
      interlocuteur: '',
      designation: '',
      localisation: '',
      maitreOuvrage: '',
      typeIntervention: '',
      descriptionSommaire: '',
      surfaceVolume: '',
    },
    commande: {
      numeroCommande: '',
      dateCommande: '',
      redacteur: '',
      signataireFinal: '',
      marcheCadre: '',
      affaire: '',
      informations: '',
    },
    autresLignes: [],
    groupesMarchandises: {},
    otpIdentiqueChecked: false,
    dateReceptionUniqueChecked: false,
  });

  const [contracts, setContracts] = useState([]);
  const [marcheCadreSuggestions, setMarcheCadreSuggestions] = useState([]);

  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('c-projets_contracts');
    if (stored) {
      setContracts(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const search = commandeDetail.commande.marcheCadre?.toLowerCase() || '';
    if (search.length >= 1) {
      const filtered = contracts.filter(
        c =>
          c.numeroMarche?.toLowerCase().includes(search) ||
          c.fournisseur?.toLowerCase().includes(search)
      );
      setMarcheCadreSuggestions(filtered.slice(0, 10));
    } else {
      setMarcheCadreSuggestions([]);
    }
  }, [commandeDetail.commande.marcheCadre, contracts]);

  useEffect(() => {
    if (contextSelectedCommande && eotpLines.length > 0 && eotpLines[0].libelle && isInitialized) {
      setCommandeDetail(prev => {
        if (prev.commande.affaire === eotpLines[0].libelle) return prev;
        return {
          ...prev,
          commande: { ...prev.commande, affaire: eotpLines[0].libelle },
        };
      });
    }
  }, [eotpLines, contextSelectedCommande, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !contextSelectedCommande || !commandeDetail || !commandes) return;
    const currentCommande = commandes.find(c => c.id === contextSelectedCommande.id);
    if (!currentCommande) return;
    const previousDetail = currentCommande.detail ? JSON.stringify(currentCommande.detail) : null;
    const currentDetail = JSON.stringify(commandeDetail);
    if (previousDetail !== currentDetail && previousDetail !== null) {
      const updatedCommandes = commandes.map(c =>
        c.id === contextSelectedCommande.id ? { ...c, detail: commandeDetail } : c
      );
      setCommandes(updatedCommandes);
      localStorage.setItem('c-projets_commandes', JSON.stringify(updatedCommandes));
    }
  }, [commandeDetail, contextSelectedCommande, commandes, isInitialized]);

  const syncFromLigne010 = field => {
    setCommandeDetail(prev => {
      const ligne010 = prev.autresLignes?.find(l => l.numero === '010');
      if (!ligne010) return prev;
      const newLignes = prev.autresLignes?.map(ligne => {
        if (ligne.numero === '010') return ligne;
        return { ...ligne, [field]: ligne010?.[field] || '' };
      });
      return { ...prev, autresLignes: newLignes };
    });
  };

  const toggleMarchandiseCategory = categoryKey => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const initializeGroupesMarchandises = () => {
    const gm = {};
    CATEGORY_KEYS.forEach(key => {
      gm[key] = GROUPES_MARCHANDISES[key].items.map(item => ({
        label: item,
        checked: false,
      }));
    });
    return gm;
  };

  const getLevel2Eotp = () => {
    return eotpLines
      .flatMap(e => e.subEotp || [])
      .map(sub => ({
        id: sub.id,
        numero: sub.numero,
        libelle: sub.libelle,
      }));
  };

  const getLigne010 = () => {
    return commandeDetail.autresLignes?.find(l => l.numero === '010');
  };

  const getEotpLabelById = eotpId => {
    const eotp = getLevel2Eotp().find(e => e.id === eotpId);
    return eotp ? `${eotp.numero} - ${eotp.libelle}` : '';
  };

  const handleSelectCommande = cmd => {
    contextSetSelectedCommande(cmd);
    setSelectedAvenant(null);
    if (cmd.detail) {
      setCommandeDetail({
        ...cmd.detail,
        otpIdentiqueChecked: cmd.detail.otpIdentiqueChecked || false,
        dateReceptionUniqueChecked: cmd.detail.dateReceptionUniqueChecked || false,
      });
    } else {
      setCommandeDetail({
        affectation: {
          numeroAffaire: cmd.donnees?.numero || '',
          dateReception: cmd.donnees?.dateReception || '',
          dateLimite: cmd.donnees?.dateLimite || '',
          interlocuteur: cmd.donnees?.interlocuteur || '',
          designation: cmd.donnees?.designation || '',
          localisation: cmd.donnees?.localisation || '',
          maitreOuvrage: cmd.donnees?.maitreOuvrage || '',
          typeIntervention: cmd.donnees?.typeIntervention || '',
          descriptionSommaire: cmd.donnees?.descriptionSommaire || '',
          surfaceVolume: cmd.donnees?.surfaceVolume || '',
        },
        commande: {
          numeroCommande: cmd.donnees?.numero || '',
          dateCommande: cmd.donnees?.dateCommande || '',
          redacteur: cmd.donnees?.redacteur || '',
          signataireFinal: cmd.donnees?.signataireFinal || '',
          marcheCadre: cmd.donnees?.marcheCadre || '',
          affaire: cmd.donnees?.affaire || '',
          informations: '',
        },
        autresLignes: cmd.donnees?.autresLignes || [],
        groupesMarchandises: initializeGroupesMarchandises(),
        otpIdentiqueChecked: false,
        dateReceptionUniqueChecked: false,
      });
    }
  };

  useEffect(() => {
    if (isLoadingCommande) return;
    // Ne pas sélectionner automatiquement une commande au chargement
    // L'utilisateur doit explicitement sélectionner une commande
  }, [contextSelectedCommande, commandes]);

  const handleUpdateAffectation = (field, value) => {
    setCommandeDetail(prev => ({
      ...prev,
      affectation: { ...prev.affectation, [field]: value },
    }));
  };

  const handleUpdateCommande = (field, value) => {
    setCommandeDetail(prev => ({
      ...prev,
      commande: { ...prev.commande, [field]: value },
    }));
  };

  const handleUpdateAutresLigne = (index, field, value) => {
    setCommandeDetail(prev => {
      const newLignes = [...(prev.autresLignes || [])];
      if (field === 'montant') {
        newLignes[index] = { ...newLignes[index], [field]: value };
      } else if (field === 'quantite' || field === 'coutUnitaire') {
        const qteNum =
          field === 'quantite'
            ? value === ''
              ? 0
              : parseFloat(value) || 0
            : parseFloat(newLignes[index].quantite) || 0;
        const coutNum =
          field === 'coutUnitaire'
            ? value === ''
              ? 0
              : parseFloat(value) || 0
            : parseFloat(newLignes[index].coutUnitaire) || 0;
        newLignes[index] = {
          ...newLignes[index],
          quantite: field === 'quantite' ? (value === '' ? 0 : parseFloat(value) || 0) : qteNum,
          coutUnitaire:
            field === 'coutUnitaire' ? (value === '' ? 0 : parseFloat(value) || 0) : coutNum,
          montant: qteNum * coutNum,
        };
      } else {
        newLignes[index] = { ...newLignes[index], [field]: value };
      }
      return { ...prev, autresLignes: newLignes };
    });
  };

  const handleAddAutresLigne = () => {
    const currentLignes = commandeDetail.autresLignes || [];
    const nextNum = String((currentLignes.length + 1) * 10).padStart(3, '0');
    const avenantPrefix = selectedAvenant ? `AV${selectedAvenant.numero} ` : '';

    const inheritedEotpId =
      commandeDetail.otpIdentiqueChecked && currentLignes.length > 0 ? currentLignes[0].eotpId : '';
    const inheritedDateReception =
      commandeDetail.dateReceptionUniqueChecked && currentLignes.length > 0
        ? currentLignes[0].dateReception
        : '';

    setCommandeDetail(prev => ({
      ...prev,
      autresLignes: [
        ...(prev.autresLignes || []),
        {
          id: Date.now(),
          numero: nextNum,
          designation: avenantPrefix || '',
          eotpId: inheritedEotpId,
          dateReception: inheritedDateReception,
          quantite: '',
          coutUnitaire: '',
          montant: 0,
          paiements: [],
        },
      ],
    }));
  };

  const handleDeleteAutresLigne = index => {
    setCommandeDetail(prev => {
      const newLignes = (prev.autresLignes || []).filter((_, i) => i !== index);
      return {
        ...prev,
        autresLignes: newLignes.map((l, i) => ({
          ...l,
          numero: String((i + 1) * 10).padStart(3, '0'),
        })),
      };
    });
  };

  const getTotalMontantHT = () => {
    return (commandeDetail.autresLignes || []).reduce(
      (sum, ligne) => sum + (parseFloat(ligne.montant) || 0),
      0
    );
  };

  const handleToggleMarchandise = (categoryKey, itemLabel) => {
    setCommandeDetail(prev => ({
      ...prev,
      groupesMarchandises: {
        ...prev.groupesMarchandises,
        [categoryKey]: prev.groupesMarchandises[categoryKey].map(item =>
          item.label === itemLabel ? { ...item, checked: !item.checked } : item
        ),
      },
    }));
  };

  const handleUpdateMarchandiseLibre = (categoryKey, value) => {
    setCommandeDetail(prev => ({
      ...prev,
      groupesMarchandises: {
        ...prev.groupesMarchandises,
        [categoryKey]: prev.groupesMarchandises[categoryKey].map(item =>
          item.label === 'AUTRES (champ libre)' ? { ...item, libreValue: value } : item
        ),
      },
    }));
  };

  const handleSelectAllInCategory = categoryKey => {
    const currentItems = commandeDetail.groupesMarchandises?.[categoryKey] || [];
    const allChecked = currentItems.every(i => i.checked);
    setCommandeDetail(prev => ({
      ...prev,
      groupesMarchandises: {
        ...prev.groupesMarchandises,
        [categoryKey]: (prev.groupesMarchandises?.[categoryKey] || []).map(item => ({
          ...item,
          checked: !allChecked,
        })),
      },
    }));
  };

  const getCategoryCount = categoryKey => {
    const items = commandeDetail.groupesMarchandises?.[categoryKey] || [];
    const checked = items.filter(i => i.checked).length;
    const total = items.filter(i => i.label !== 'AUTRES (champ libre)').length;
    return { checked, total };
  };

  const saveCommandeDetail = useCallback(() => {
    if (!contextSelectedCommande) return;
    const updatedCommandes = commandes.map(c =>
      c.id === contextSelectedCommande.id ? { ...c, detail: commandeDetail } : c
    );
    setCommandes(updatedCommandes);
    localStorage.setItem('c-projets_commandes', JSON.stringify(updatedCommandes));
  }, [contextSelectedCommande, commandeDetail, commandes]);

  const handleImportFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        setImportData(data);
        setShowImportModal(true);
      } catch (error) {
        alert('Erreur lors de la lecture du fichier JSON');
      }
    };
    reader.readAsText(file);
  };

  const applyImportData = () => {
    if (!importData || !contextSelectedCommande) return;

    const newDetail = { ...commandeDetail };

    if (importData.commande) {
      if (importData.commande.date) {
        const [day, month, year] = importData.commande.date.split('/');
        newDetail.commande.dateCommande = `${year}-${month}-${day}`;
      }
      if (importData.commande.objet) {
        newDetail.commande.objet = importData.commande.objet;
      }
    }

    if (importData.demandeur) {
      newDetail.affectation.interlocuteur = importData.demandeur.responsable_projet || '';
    }

    if (importData.entreprise) {
      newDetail.affectation.maitreOuvrage = importData.entreprise.nom || '';
    }

    if (importData.marche_cadre) {
      newDetail.commande.numeroCommande = importData.marche_cadre.numero || '';
    }

    if (importData.groupes_marchandises) {
      Object.keys(importData.groupes_marchandises).forEach(catKey => {
        if (newDetail.groupesMarchandises[catKey]) {
          const importedItems = importData.groupes_marchandises[catKey];
          newDetail.groupesMarchandises[catKey] = newDetail.groupesMarchandises[catKey].map(
            item => {
              if (typeof item === 'string') {
                return { label: item, checked: importedItems.includes(item) };
              }
              const isInImport = importedItems.some(
                imp => (typeof imp === 'string' ? imp : imp.label) === item.label
              );
              return { ...item, checked: isInImport };
            }
          );
        }
      });
    }

    setCommandeDetail(newDetail);
    setShowImportModal(false);
    setImportData(null);
  };

  const handleGenerateEmail = () => {
    if (!commandeDetail) return;

    const { affectation, commande, autresLignes, groupesMarchandises } = commandeDetail;
    const checkedItems = [];
    CATEGORY_KEYS.forEach(key => {
      const items = groupesMarchandises[key] || [];
      items.filter(i => i.checked).forEach(i => checkedItems.push(i.label));
    });

    const getEotpLabel = eotpId => {
      const eotp = getLevel2Eotp().find(e => e.id === eotpId);
      return eotp ? `${eotp.numero} - ${eotp.libelle}` : 'Non renseigne';
    };

    const totalHT = autresLignes?.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0) || 0;

    const cellStyle = 'border: 1px solid black; padding: 8px;';
    const headerStyle =
      'border: 1px solid black; padding: 8px; background-color: #f0f0f0; font-weight: bold;';

    let htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; }
table { border-collapse: collapse; width: auto; }
</style>
</head>
<body>

<h3>DONNEES DE LA COMMANDE</h3>
<p>
N&#176; Commande: ${commande.numeroCommande || 'N/A'}<br>
Date: ${commande.dateCommande || 'N/A'}<br>
Redacteur: ${commande.redacteur || 'N/A'}<br>
Signataire final: ${commande.signataireFinal || 'N/A'}<br>
Marche cadre: ${commande.marcheCadre || 'N/A'}<br>
Affaire: ${commande.affaire || 'N/A'}
</p>`;

    if (checkedItems.length > 0) {
      htmlBody += `
<h3>GROUPES DE MARCHANDISES</h3>
<p>
  ${checkedItems.map(item => `&#8226; ${item}<br>`).join('\n  ')}
</p>`;
    }

    if (autresLignes && autresLignes.length > 0) {
      htmlBody += `
<h3>AUTRES</h3>
<table>
  <tr>
    <th style="${headerStyle}">Poste</th>
    <th style="${headerStyle}">Designation</th>
    <th style="${headerStyle}">EOTP</th>
    <th style="${headerStyle}">Date recept</th>
    <th style="${headerStyle}">Qte</th>
    <th style="${headerStyle}">PU HT</th>
    <th style="${headerStyle}">Montant</th>
  </tr>`;

      autresLignes.forEach(ligne => {
        const pu = ligne.coutUnitaire ? Number(ligne.coutUnitaire).toFixed(2) + ' EUR' : '-';
        const montant = ligne.montant ? Number(ligne.montant).toFixed(2) + ' EUR' : '-';
        htmlBody += `
  <tr>
    <td style="${cellStyle}">${ligne.numero}</td>
    <td style="${cellStyle}">${ligne.designation || '-'}</td>
    <td style="${cellStyle}">${getEotpLabel(ligne.eotpId)}</td>
    <td style="${cellStyle}">${ligne.dateReception || '-'}</td>
    <td style="${cellStyle}">${ligne.quantite || '-'}</td>
    <td style="${cellStyle}">${pu}</td>
    <td style="${cellStyle}">${montant}</td>
  </tr>`;
      });

      htmlBody += `
  <tr>
    <td colspan="6" style="${cellStyle}; text-align: right;"><strong>TOTAL</strong></td>
    <td style="${cellStyle}"><strong>${totalHT.toFixed(2)} EUR</strong></td>
  </tr>
</table>`;
    }

    htmlBody += `
<p>Cordialement</p>
</body>
</html>`;

    const dateStr = new Date().toISOString().split('T')[0];
    const numCmd = commande.numeroCommande || 'new';
    let fileName;
    if (selectedAvenant) {
      fileName = `Avenant N°${selectedAvenant.numero}_${numCmd}_${dateStr}.html`;
    } else {
      fileName = `Création commande_${numCmd}_${dateStr}.html`;
    }

    const blob = new Blob([htmlBody], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (currentBoard) {
      setIsInitialized(false);
      currentBoardIdRef.current = currentBoard.id;
      setLinks(JSON.parse(localStorage.getItem(`board-${currentBoard.id}-links`) || '[]'));
      setCommandes(JSON.parse(localStorage.getItem(`board-${currentBoard.id}-commandes`) || '[]'));
      setEotpLines(JSON.parse(localStorage.getItem(`board-${currentBoard.id}-eotp`) || '[]'));
      const savedInternal = localStorage.getItem(`board-${currentBoard.id}-internalContacts`);
      if (savedInternal) {
        const parsed = JSON.parse(savedInternal);
        setInternalContacts(parsed.length > 0 ? parsed : defaultInternalContacts);
      } else {
        setInternalContacts(defaultInternalContacts);
      }
      setExternalContacts(
        JSON.parse(localStorage.getItem(`board-${currentBoard.id}-externalContacts`) || '[]')
      );
      const savedEntreprises = localStorage.getItem('c-projets_entreprises');
      if (savedEntreprises) {
        setEntrepriseSuggestions(JSON.parse(savedEntreprises));
      }
      const gmr = localStorage.getItem(`board-${currentBoard.id}-gmr`) || '';
      const priority = localStorage.getItem(`board-${currentBoard.id}-priority`) || '';
      const zone = localStorage.getItem(`board-${currentBoard.id}-zone`) || '';
      setBoardGMR(gmr);
      setBoardPriority(priority);
      setBoardZone(zone);
      setIsInitialized(true);
    }
  }, [currentBoard?.id]);

  useEffect(() => {
    if (isInitialized) {
      saveLinks();
    }
  }, [links, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveCommandes();
    }
  }, [commandes, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveEotp();
    }
  }, [eotpLines, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveInternalContacts();
    }
  }, [internalContacts, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveExternalContacts();
    }
  }, [externalContacts, isInitialized]);

  const saveAllProjectData = () => {
    const boardId = currentBoardIdRef.current || currentBoard?.id;
    if (!boardId) {
      return;
    }

    const cleanInvalidAvenants = () => {
      const removedAvenants = [];

      const updatedCommandes = commandes.map(cmd => {
        if (!cmd.avenants || cmd.avenants.length === 0) {
          return cmd;
        }

        const validAvenants = cmd.avenants.filter(av => {
          const prefix = `AV${av.numero}`;
          const avenantLines = (commandeDetail?.autresLignes || []).filter(
            ligne => ligne.designation && ligne.designation.startsWith(prefix)
          );

          if (avenantLines.length === 0) {
            removedAvenants.push(av.title);
            return false;
          }

          const hasValidLine = avenantLines.some(ligne => {
            const designation = ligne.designation?.replace(/^AV\d+\s*/, '').trim();
            return designation && designation.length > 0;
          });

          if (!hasValidLine) {
            removedAvenants.push(av.title);
            return false;
          }

          return true;
        });

        if (validAvenants.length !== cmd.avenants.length) {
          return { ...cmd, avenants: validAvenants };
        }
        return cmd;
      });

      if (removedAvenants.length > 0) {
        alert(
          `Les avenants suivants ont été supprimés car leur ligne est vide : ${removedAvenants.join(', ')}`
        );
      }

      if (JSON.stringify(updatedCommandes) !== JSON.stringify(commandes)) {
        setCommandes(updatedCommandes);
      }
    };

    cleanInvalidAvenants();

    localStorage.setItem(`board-${boardId}-links`, JSON.stringify(links));
    localStorage.setItem(`board-${boardId}-commandes`, JSON.stringify(commandes));
    localStorage.setItem(`board-${boardId}-eotp`, JSON.stringify(eotpLines));
    localStorage.setItem(`board-${boardId}-internalContacts`, JSON.stringify(internalContacts));
    localStorage.setItem(`board-${boardId}-externalContacts`, JSON.stringify(externalContacts));
    localStorage.setItem(`board-${boardId}-gmr`, boardGMR);
    localStorage.setItem(`board-${boardId}-priority`, boardPriority);
    localStorage.setItem(`board-${boardId}-zone`, boardZone);
  };

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

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveAllProjectData();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveAllProjectData();
      }
    };
    const handlePageHide = () => {
      if (isInitialized) {
        saveAllProjectData();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    links,
    commandes,
    eotpLines,
    internalContacts,
    externalContacts,
    boardGMR,
    boardPriority,
    boardZone,
    isInitialized,
  ]);

  const toggleCardExpanded = cardId => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
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

      {/* ============================================================================= */}
      {/* SECTION: OUTILLET TÂCHES (lignes 1393-1910) */}
      {/* ============================================================================= */}

      {activeTab === 'taches' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-full">
            <div className="mb-4 flex flex-wrap gap-2">
              {(() => {
                const orderedChapters = getOrderedChapters();
                const isSpacer = item => typeof item === 'string' && item.startsWith('__spacer_');

                return orderedChapters.map((chapter, idx) => {
                  const spacer = isSpacer(chapter);

                  if (spacer) {
                    return <div key={chapter} className="w-12 h-8 flex-shrink-0" />;
                  }

                  const normalizedChapter = normalizeChapter(chapter);
                  const hasCards = cards.some(
                    card => card.chapter && normalizeChapter(card.chapter) === normalizedChapter
                  );
                  const hasCategories =
                    hasCards &&
                    categories.some(cat =>
                      cards.some(
                        c =>
                          c.chapter &&
                          normalizeChapter(c.chapter) === normalizedChapter &&
                          Number(c.id) === Number(cat.card_id)
                      )
                    );
                  const hasSubcategories =
                    hasCategories &&
                    subcategories.some(sub =>
                      categories.some(
                        cat =>
                          cat.card_id &&
                          cards.some(
                            c =>
                              c.chapter &&
                              normalizeChapter(c.chapter) === normalizedChapter &&
                              Number(c.id) === Number(cat.id) &&
                              Number(sub.category_id) === Number(cat.id)
                          )
                      )
                    );
                  const hasData = hasCards;
                  return (
                    <button
                      key={chapter}
                      onClick={() => setSelectedChapter(chapter)}
                      disabled={!hasData}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        selectedChapter === chapter
                          ? 'bg-accent text-white'
                          : !hasData
                            ? 'bg-card border border-std text-muted opacity-50 cursor-not-allowed'
                            : 'bg-card border border-std text-secondary hover:bg-card-hover'
                      }`}
                      title={chapter}
                    >
                      {chapter}
                    </button>
                  );
                });
              })()}
            </div>

            {selectedChapter ? (
              <div className="bg-card rounded-lg border border-std p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-primary">{selectedChapter}</h2>
                  <button
                    onClick={() => setSelectedChapter(null)}
                    className="text-sm text-secondary hover:text-primary"
                  >
                    Fermer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards &&
                    cards
                      .filter(
                        card =>
                          card.chapter &&
                          normalizeChapter(card.chapter) === normalizeChapter(selectedChapter)
                      )
                      .map(card => {
                        const cardCategories = categories.filter(c => c.card_id === card.id);
                        const categoriesWithSubcats = cardCategories.map(cat => {
                          const catSubcats = subcategories.filter(s => s.category_id === cat.id);
                          return {
                            ...cat,
                            subcats: catSubcats,
                            isSingleTask: catSubcats.length === 1,
                          };
                        });
                        const hasMultiTaskCategories = categoriesWithSubcats.some(
                          cat => !cat.isSingleTask
                        );
                        const hasSingleTaskCategories = categoriesWithSubcats.some(
                          cat => cat.isSingleTask
                        );
                        const skipAction = hasSingleTaskCategories && !hasMultiTaskCategories;
                        const totalSubcats = categoriesWithSubcats.reduce(
                          (acc, cat) => acc + cat.subcats.length,
                          0
                        );
                        const allCardSubcats = subcategories.filter(s =>
                          cardCategories.some(c => c.id === s.category_id)
                        );

                        return (
                          <div
                            key={card.id}
                            className={`bg-card-hover rounded-lg border-2 p-4 transition-all ${
                              skipAction
                                ? 'border-purple-400 hover:border-purple-500 hover:ring-2 hover:ring-purple-300/30'
                                : 'border-std hover:border-accent hover:ring-2 hover:ring-accent/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3
                                onClick={() => setSelectedCard(card)}
                                className="font-semibold text-primary cursor-pointer hover:text-accent flex items-center gap-2 flex-1"
                              >
                                {card.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const confirm1 = window.confirm(
                                      'Êtes-vous sûr de vouloir supprimer cette carte ? Cette action est irréversible.'
                                    );
                                    if (!confirm1) return;
                                    const confirm2 = window.confirm(
                                      'Confirmez-vous définitivement la suppression ?'
                                    );
                                    if (!confirm2) return;
                                    deleteCard(card.id);
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 rounded"
                                  title="Supprimer la carte"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {categoriesWithSubcats.length === 0 ? (
                                <p className="text-sm text-muted italic">Aucune tâche disponible</p>
                              ) : (
                                categoriesWithSubcats.map(cat =>
                                  cat.isSingleTask ? (
                                    cat.subcats.map(sub => (
                                      <div
                                        key={sub.id}
                                        className="pl-3 border-l-2 border-purple-400 cursor-pointer hover:bg-[var(--bg-card)] rounded p-2 transition-colors"
                                        onClick={() => setSelectedSubcategory(sub)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                              sub.status === 'done'
                                                ? 'bg-green-500'
                                                : sub.status === 'waiting'
                                                  ? 'bg-blue-500'
                                                  : sub.status === 'todo'
                                                    ? 'bg-red-500'
                                                    : sub.status === 'in_progress'
                                                      ? 'bg-yellow-500'
                                                      : sub.status === 'blocked'
                                                        ? 'bg-red-500'
                                                        : 'bg-gray-400'
                                            }`}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm text-[var(--txt-primary)] truncate">
                                              {sub.title}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[var(--txt-muted)]">
                                              {sub.assignee && (
                                                <span className="truncate">👤 {sub.assignee}</span>
                                              )}
                                              {sub.due_date && (
                                                <span className="whitespace-nowrap">
                                                  📅{' '}
                                                  {new Date(sub.due_date).toLocaleDateString(
                                                    'fr-FR'
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div
                                      key={cat.id}
                                      className="pl-3 border-l-2 border-accent relative"
                                      onMouseEnter={e => {
                                        if (hoverTimeoutRef.current)
                                          clearTimeout(hoverTimeoutRef.current);
                                        setHoveredCategoryData({
                                          card,
                                          category: cat,
                                          subcategories: cat.subcats,
                                          mouseX: e.clientX,
                                          mouseY: e.clientY,
                                        });
                                        hoverTimeoutRef.current = setTimeout(
                                          () => setHoverPanelVisible(true),
                                          100
                                        );
                                      }}
                                      onMouseLeave={() => {
                                        setHoverPanelVisible(false);
                                        hoverTimeoutRef.current = setTimeout(
                                          () => setHoveredCategoryData(null),
                                          300
                                        );
                                      }}
                                    >
                                      <div
                                        className="text-sm text-[var(--txt-primary)] font-medium cursor-pointer hover:text-accent"
                                        onClick={() =>
                                          setSelectedCategoryForTasks({
                                            card,
                                            category: cat,
                                            subcategories: cat.subcats,
                                          })
                                        }
                                      >
                                        {cat.title}{' '}
                                        <span className="ml-2 text-xs text-[var(--txt-muted)]">
                                          ({cat.subcats.length} tâches)
                                        </span>
                                      </div>
                                      {hoverPanelVisible &&
                                        hoveredCategoryData?.category?.id === cat.id &&
                                        cat.subcats.length > 0 && (
                                          <div
                                            className="absolute left-1/2 top-0 -translate-x-1/2 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl z-[60] overflow-hidden"
                                            onMouseEnter={() => {
                                              if (hoverTimeoutRef.current)
                                                clearTimeout(hoverTimeoutRef.current);
                                              setHoverPanelVisible(true);
                                            }}
                                            onMouseLeave={() => {
                                              setHoverPanelVisible(false);
                                              hoverTimeoutRef.current = setTimeout(
                                                () => setHoveredCategoryData(null),
                                                300
                                              );
                                            }}
                                          >
                                            <div className="max-h-48 overflow-auto p-1">
                                              {cat.subcats.map(sub => (
                                                <div
                                                  key={sub.id}
                                                  className="p-2 hover:bg-[var(--bg-card-hover)] rounded cursor-pointer"
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    setSelectedSubcategory(sub);
                                                    setHoverPanelVisible(false);
                                                    setHoveredCategoryData(null);
                                                  }}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <span
                                                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                        sub.status === 'done'
                                                          ? 'bg-green-500'
                                                          : sub.status === 'waiting'
                                                            ? 'bg-blue-500'
                                                            : sub.status === 'todo'
                                                              ? 'bg-red-500'
                                                              : sub.status === 'in_progress'
                                                                ? 'bg-yellow-500'
                                                                : sub.status === 'blocked'
                                                                  ? 'bg-red-500'
                                                                  : 'bg-gray-400'
                                                      }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                      <div className="text-xs text-[var(--txt-primary)] truncate">
                                                        {sub.title}
                                                      </div>
                                                      <div className="flex items-center gap-2 text-xs text-[var(--txt-muted)]">
                                                        {sub.assignee && (
                                                          <span className="truncate">
                                                            👤 {sub.assignee}
                                                          </span>
                                                        )}
                                                        {sub.due_date && (
                                                          <span className="whitespace-nowrap">
                                                            📅{' '}
                                                            {new Date(
                                                              sub.due_date
                                                            ).toLocaleDateString('fr-FR')}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  )
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                  {(!cards ||
                    cards.filter(
                      card => normalizeChapter(card.chapter) === normalizeChapter(selectedChapter)
                    ).length === 0) && (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-sm text-muted mb-4">Aucune carte pour ce chapitre</p>
                      <button
                        onClick={() => {
                          const title = prompt('Nom de la nouvelle carte :');
                          if (title && title.trim()) {
                            createCard({ title: title.trim(), chapter: selectedChapter });
                          }
                        }}
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors flex items-center"
                      >
                        <Plus size={16} className="mr-2" />
                        Créer une carte
                      </button>
                    </div>
                  )}
                </div>

                {selectedCategoryForTasks && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg border border-std max-w-lg w-full max-h-[80vh] overflow-auto">
                      <div className="p-4 border-b border-std flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-primary">
                            {selectedCategoryForTasks.category.title}
                          </h3>
                          <p className="text-sm text-muted">
                            {selectedCategoryForTasks.card.title}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedCategoryForTasks(null)}
                          className="p-2 hover:bg-card-hover rounded"
                        >
                          <X size={20} className="text-secondary" />
                        </button>
                      </div>
                      <div className="p-4 space-y-2">
                        {selectedCategoryForTasks.subcategories.length > 0 ? (
                          selectedCategoryForTasks.subcategories.map(subcat => {
                            const isNotStarted = !subcat.start_date && !subcat.due_date;
                            const status = isNotStarted ? 'not_started' : subcat.status || 'todo';
                            return (
                              <div
                                key={subcat.id}
                                onClick={() => setSelectedSubcategory(subcat)}
                                className={`p-3 rounded border cursor-pointer transition-all ${
                                  status === 'not_started'
                                    ? 'bg-gray-200 border-gray-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                    : status === 'todo'
                                      ? 'bg-orange-100 border-orange-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                      : status === 'in_progress'
                                        ? 'bg-yellow-100 border-yellow-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                        : status === 'waiting'
                                          ? 'bg-blue-100 border-blue-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                          : status === 'done'
                                            ? 'bg-green-100 border-green-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                            : 'bg-gray-200 border-gray-300 hover:ring-2 hover:ring-accent hover:ring-offset-1'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-secondary">{subcat.title}</h4>
                                  <button
                                    onClick={async e => {
                                      e.stopPropagation();
                                      if (confirm('Supprimer cette tâche ?')) {
                                        await deleteSubcategory(subcat.id);
                                        setSelectedCategoryForTasks({
                                          ...selectedCategoryForTasks,
                                          subcategories:
                                            selectedCategoryForTasks.subcategories.filter(
                                              s => s.id !== subcat.id
                                            ),
                                        });
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted pl-7">
                                  {subcat.assignee && (
                                    <span className="flex items-center gap-1">
                                      👤 {subcat.assignee}
                                    </span>
                                  )}
                                  {subcat.due_date && (
                                    <span className="flex items-center gap-1">
                                      📅 {new Date(subcat.due_date).toLocaleDateString('fr-FR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted mb-3">
                              Aucune tâche pour cette action
                            </p>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={async () => {
                                  const existingSub = selectedCategoryForTasks.subcategories.find(
                                    s =>
                                      s.title.toLowerCase() ===
                                      selectedCategoryForTasks.category.title.toLowerCase()
                                  );
                                  if (existingSub) {
                                    setSelectedSubcategory(existingSub);
                                    return;
                                  }
                                  try {
                                    const newSubId = await createSubcategory(
                                      selectedCategoryForTasks.category.id,
                                      selectedCategoryForTasks.category.title
                                    );
                                    setSelectedCategoryForTasks({
                                      ...selectedCategoryForTasks,
                                      subcategories: [
                                        ...selectedCategoryForTasks.subcategories,
                                        {
                                          id: newSubId,
                                          category_id: selectedCategoryForTasks.category.id,
                                          title: selectedCategoryForTasks.category.title,
                                        },
                                      ],
                                    });
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 text-sm"
                              >
                                + Créer une tâche "{selectedCategoryForTasks.category.title}"
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-std">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              placeholder="Nouvelle tâche..."
                              className="flex-1 px-3 py-2 bg-card-hover border border-std rounded text-secondary text-sm"
                              onKeyDown={async e => {
                                if (e.key === 'Enter' && newTaskTitle.trim()) {
                                  const newSub = await createSubcategory(
                                    selectedCategoryForTasks.category.id,
                                    newTaskTitle.trim()
                                  );
                                  setSelectedCategoryForTasks({
                                    ...selectedCategoryForTasks,
                                    subcategories: [
                                      ...selectedCategoryForTasks.subcategories,
                                      newSub,
                                    ],
                                  });
                                  setNewTaskTitle('');
                                }
                              }}
                            />
                            <button
                              onClick={async () => {
                                if (newTaskTitle.trim()) {
                                  const newSub = await createSubcategory(
                                    selectedCategoryForTasks.category.id,
                                    newTaskTitle.trim()
                                  );
                                  setSelectedCategoryForTasks({
                                    ...selectedCategoryForTasks,
                                    subcategories: [
                                      ...selectedCategoryForTasks.subcategories,
                                      newSub,
                                    ],
                                  });
                                  setNewTaskTitle('');
                                }
                              }}
                              className="px-3 py-2 bg-accent text-white rounded text-sm hover:opacity-90"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================================= */}
      {/* SECTION: OUTILET COMMANDES (lignes 1916-2960) */}
      {/* ============================================================================= */}

      {activeTab === 'commandes' && (
        <BoardCommandes
          commandes={commandes}
          setCommandes={setCommandes}
          selectedAvenant={selectedAvenant}
          setSelectedAvenant={setSelectedAvenant}
          commandeDetail={commandeDetail}
          setCommandeDetail={setCommandeDetail}
          contextSelectedCommande={contextSelectedCommande}
          contextSetSelectedCommande={contextSetSelectedCommande}
          contextActiveTabCommande={contextActiveTabCommande}
          contextSetActiveTabCommande={contextSetActiveTabCommande}
          handleSelectCommande={handleSelectCommande}
          handleUpdateAffectation={handleUpdateAffectation}
          handleUpdateCommande={handleUpdateCommande}
          handleAddAutresLigne={handleAddAutresLigne}
          handleDeleteAutresLigne={handleDeleteAutresLigne}
          getTotalMontantHT={getTotalMontantHT}
          getLigne010={getLigne010}
          setIsLoadingCommande={setIsLoadingCommande}
          eotpLines={eotpLines}
          getEotpLabelById={getEotpLabelById}
          contracts={contracts}
          selectedChapter={selectedChapter}
          selectedCategoryForTasks={selectedCategoryForTasks}
        />
      )}

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
          externalContacts={externalContacts}
          setExternalContacts={setExternalContacts}
          updateExternalContact={updateExternalContact}
          showAddInternal={showAddInternal}
          setShowAddInternal={setShowAddInternal}
          newInternalTitle={newInternalTitle}
          setNewInternalTitle={setNewInternalTitle}
        />
      )}

      {showImportModal && importData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-lg shadow-xl w-full max-w-lg border border-[var(--border)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--txt-primary)]">
                Aperçu des données à importer
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData(null);
                }}
                className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
              >
                <X size={20} className="text-[var(--txt-muted)]" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-4">
              {importData.commande && (
                <div className="p-3 bg-[var(--bg-input)] rounded">
                  <h3 className="font-semibold text-sm text-[var(--txt-primary)] mb-2">Commande</h3>
                  <p className="text-xs text-[var(--txt-secondary)]">
                    Date: {importData.commande.date || 'N/A'}
                  </p>
                  <p className="text-xs text-[var(--txt-secondary)]">
                    Objet: {importData.commande.objet || 'N/A'}
                  </p>
                </div>
              )}
              {importData.demandeur && (
                <div className="p-3 bg-[var(--bg-input)] rounded">
                  <h3 className="font-semibold text-sm text-[var(--txt-primary)] mb-2">
                    Demandeur
                  </h3>
                  <p className="text-xs text-[var(--txt-secondary)]">
                    Responsable: {importData.demandeur.responsable_projet || 'N/A'}
                  </p>
                </div>
              )}
              {importData.entreprise && (
                <div className="p-3 bg-[var(--bg-input)] rounded">
                  <h3 className="font-semibold text-sm text-[var(--txt-primary)] mb-2">
                    Entreprise
                  </h3>
                  <p className="text-xs text-[var(--txt-secondary)]">
                    Nom: {importData.entreprise.nom || 'N/A'}
                  </p>
                </div>
              )}
              {importData.groupes_marchandises && (
                <div className="p-3 bg-[var(--bg-input)] rounded">
                  <h3 className="font-semibold text-sm text-[var(--txt-primary)] mb-2">
                    Groupes de marchandises
                  </h3>
                  {CATEGORY_KEYS.map(key => {
                    const items = importData.groupes_marchandises[key] || [];
                    if (items.length === 0) return null;
                    const count = items.filter(i => (typeof i === 'string' ? i : i.checked)).length;
                    return (
                      <p key={key} className="text-xs text-[var(--txt-secondary)]">
                        {GROUPES_MARCHANDISES[key].label}: {count} élément(s)
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData(null);
                }}
                className="px-4 py-2 text-sm text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded"
              >
                Annuler
              </button>
              <button
                onClick={applyImportData}
                className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90"
              >
                Importer les données
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board2;
