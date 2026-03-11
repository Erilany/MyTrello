import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useApp } from '../../context/AppContext';
import Column from '../Column/Column';
import Exchange from '../Exchange/Exchange';
import {
  Plus,
  GripVertical,
  Archive,
  ListTodo,
  Calendar,
  MessageSquare,
  ShoppingCart,
  Info,
  ExternalLink,
  FolderOpen,
  PlusCircle,
  Trash2,
  User,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

function Board() {
  const {
    currentBoard,
    columns,
    createColumn,
    createCard,
    createCategory,
    createSubcategory,
    moveColumn,
    archiveBoard,
    canArchiveBoard,
    moveCard,
    moveCategory,
    moveSubcategory,
    loadBoard,
    loading,
    cards,
    categories,
    subcategories,
    createOrder,
    updateOrder,
    deleteOrder,
    addAvenant,
    updateAvenant,
    deleteAvenant,
    getOrdersByBoard,
    getUnreadCount,
  } = useApp();
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('taches');

  const tabs = [
    { id: 'informations', label: 'Informations', icon: Info },
    { id: 'taches', label: 'Tâches', icon: ListTodo },
    { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'echanges', label: 'Échanges', icon: MessageSquare },
  ];

  const [links, setLinks] = useState([
    { id: 1, title: 'Site Web', url: '', type: 'web', color: '#3B82F6' },
    { id: 2, title: 'Dossier Projet', url: '', type: 'folder', color: '#F59E0B' },
  ]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'web', color: '#22C55E' });
  const [eotpLines, setEotpLines] = useState([{ id: 1, numero: '', ruo: '', libelle: '' }]);
  const [internalContacts, setInternalContacts] = useState([
    { id: 1, title: 'Manager de projets' },
    { id: 2, title: 'Chargé(e) de Concertation' },
    { id: 3, title: "Chargé(e) d'Etudes LA" },
    { id: 4, title: "Chargé(e) d'Etudes LS" },
    { id: 5, title: "Chargé(e) d'Etudes Poste HT" },
    { id: 6, title: "Chargé(e) d'Etudes Poste BT et CC" },
    { id: 7, title: "Chargé(e) d'Etudes SPC" },
    { id: 8, title: 'Contrôleur Travaux' },
    { id: 9, title: 'Assistant(e) Etudes' },
  ]);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [newInternalTitle, setNewInternalTitle] = useState('');
  const [externalContacts, setExternalContacts] = useState([]);
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [newExternal, setNewExternal] = useState({
    entreprise: '',
    fonction: '',
    nom: '',
    prenom: '',
    email: '',
    telBureau: '',
    telPortable: '',
    adresse: '',
  });

  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedAvenant, setSelectedAvenant] = useState(null);
  const [showAddCommande, setShowAddCommande] = useState(false);
  const [newCommandeTitle, setNewCommandeTitle] = useState('');
  const [activeTabCommande, setActiveTabCommande] = useState('commande');

  const groupesMarchandises = {
    etudes: [
      { label: 'ETUDE AVIFAUNE, FAUNE, FLORE', checked: false },
      { label: 'ETUDES ACOUSTIQUES', checked: false },
      { label: "ETUDES D'IMPACT", checked: false },
      { label: "ETUDES-ARCHITECTE ET MAÎTRISE D'OEUVRE", checked: false },
      { label: 'ETUDE TECHNIQUE - LIGNES AERIENNES', checked: false },
      { label: 'ETUDE TOPO/CARTOGRAPHIQUE-LIG AERIENNES', checked: false },
      { label: 'ETUDES GÉO-TECHNIQUES - LIGNES AÉRIENNES', checked: false },
      { label: 'ETUDES MATÉRIELS POUR LIGNES AÉRIENNES', checked: false },
      { label: 'ETUDE TECHNIQUE - POSTE', checked: false },
      { label: 'ETUDE TOPO/CARTOGRAPHIQUE - POSTE', checked: false },
      { label: 'ETUDES ESSAIS & QUALIF MATERIL CCL', checked: false },
      { label: 'ETUDES PO-ETUDES GÉO-TECHNIQUES - POSTES', checked: false },
      { label: 'ETUDE TOPO/CARTOGRAPHIQUE - LIG SOUTERR', checked: false },
      { label: 'ETUDES LS-ETUDE GEO - TECHNIQUE', checked: false },
      { label: 'ETUDES TECHNIQUES - LIGNES SOUTERRAINES', checked: false },
      { label: 'ETUDES TECHNIQUES LIGNES SOUS-MARINES', checked: false },
    ],
    travaux: [
      { label: 'SYSTÈME ÉLECTRIQUE INSULAIRE SUR MANDAT', checked: false },
      { label: 'LIAISONS HT ET THT-FOUR. PYLÔNES SPÉCIAUX', checked: false },
      { label: 'TRAVAUX LA-ELAGAGE', checked: false },
      { label: 'TRAVAUX LA-FONDATIONS SPÉCIALES ET GC LA', checked: false },
      { label: 'TRAVAUX LA-INSTALLATION, MAINTENANCE DE FO', checked: false },
      { label: 'TRAVAUX LA-TRAVAUX DE MONTAGE LA', checked: false },
      { label: 'TRAVAUX LA-TRAVAUX PEINTURE SUR PYLÔNES', checked: false },
      { label: 'DEPLOIEMENT ELECTRE PETIT D F+T', checked: false },
      { label: 'GROS OEUVRE BATIMENT INDUSTRIEL (INVEST)', checked: false },
      { label: 'MONTAGE, INSTALLATION DES APPAREILLAGES HTB', checked: false },
      { label: 'MONTAGE, INSTALLATION TRANSFORMATEURS ET MATÉRIELS BOBINÉS', checked: false },
      {
        label: 'POSTES HT ET THT-MONTAGE, INSTALLATION DES MATÉRIELS DE COMPENSATION',
        checked: false,
      },
      { label: 'SND OEUVRE BATIMENT INDUSTRIEL', checked: false },
      { label: "SND OEUVRE BATIMENTS D'HABITATION", checked: false },
      { label: 'TRAVAUX BÂTIMENTS HORS INSTALLATIONS IRT', checked: false },
      { label: 'TRAVAUX DE TERRASSEMENT', checked: false },
      { label: "TRAVAUX GENIE CIVIL -VRD- VOIES D'ACCES", checked: false },
      { label: 'TRAVAUX POSTES', checked: false },
      { label: 'FONÇAGES - FORAGES DIRIGÉS', checked: false },
      { label: 'TRAVAUX GÉNIE CIVIL LIGNES SOUTERRAINES ET DÉROULAGE', checked: false },
      { label: 'TRAVAUX LIAISON PROVISOIRE (CAB. SECS)', checked: false },
      { label: 'TRAVAUX LS', checked: false },
    ],
    fourniture_materiel: [
      { label: 'APPAREILS DE MANUTENTION / LEVAGE', checked: false },
      { label: 'APPAREILS DE MESURE', checked: false },
      { label: 'CONSOMMABLES BUREAUTIQUE ET INFORMATIQUE', checked: false },
      { label: 'FOURNITURE DE CÂBLES NUS', checked: false },
      { label: 'FOURNITURE DE TOURETS', checked: false },
      { label: 'OUTILLAGE ISOLÉ HTBT / TST', checked: false },
      { label: 'PETIT MATÉRIEL COURANT', checked: false },
      { label: 'MATÉRIELS DE LIGNES', checked: false },
      { label: 'FOURN, INSTAL DES SYSTÈMES DE PROTECTION DE POSTES', checked: false },
      { label: 'FOURNITURE DE MATÉRIELS DE CCN DES GRANDS POSTES', checked: false },
      { label: 'FOURNITURE DE MATÉRIELS DE CCN DES POSTES SOURCES', checked: false },
      { label: 'FOURNITURE DE MATÉRIELS DE COMPTAGE', checked: false },
      { label: 'FOURNITURE DE MATÉRIELS DE FILERIE', checked: false },
      { label: "FOURNITURE DE MATÉRIELS DE PROTECTION ET D'AUTOMATISME", checked: false },
      { label: 'FOURNITURE DE MATÉRIELS DE QUALIMÉTRIE', checked: false },
      { label: 'FOURNITURE DE MATÉRIELS DE TÉLÉCONDUITE', checked: false },
      { label: 'FOURNITURE DE MOBILIER', checked: false },
      { label: 'FOURNITURE DE PIÈCES DÉTACHÉES DE PSEM', checked: false },
      { label: 'FOURNITURE DE PIÈCES DÉTACHÉES ET SOUS ENSEMBLES DE DISJ HTB', checked: false },
      { label: 'FOURNITURE DE PIÈCES DÉTACHÉES ET SOUS ENSEMBLES DE SECT HTB', checked: false },
      { label: 'FOURNITURE DE POSTES INTÉRIEURS MODULAIRES (PIM)', checked: false },
      { label: 'FOURNITURE DE POSTES SOUS ENVELOPPE MÉTALLIQUE HTB (PSEM)', checked: false },
      { label: "FOURNITURE D'ÉQUIPEMENTS ET ACCESSOIRES DE TRANSFORMATEURS", checked: false },
      { label: "FOURNITURE D'ÉQUIPEMENTS STATIONS CONVERSION COURANT CONTINU", checked: false },
      { label: 'FOURNITURES DE BUREAU', checked: false },
      { label: 'PIECES DETACHEES POUR MATL DE CCN', checked: false },
    ],
    prestations: [
      { label: 'ANALYSES HUILES ET AUTRES LIQUIDES', checked: false },
      { label: 'ASSISTANCE MOA CONSTRUCT°/COORD SECURITE', checked: false },
      { label: 'DEMOLITION/EVACUATION OUVRAGE TRANSPORT', checked: false },
      { label: 'ENLEV/TRAIT DECHETS DANGEREUX AMIANT(DD)', checked: false },
      { label: 'ENLEV/TRAIT DECHETS DANGEREUX AUTRES(DD)', checked: false },
      { label: 'ENLEV/TRAIT DECHETS DANGEREUX PCB (DD)', checked: false },
      { label: 'ENLEV/TRAIT DECHETS DANGEREUX SF6 (DD)', checked: false },
      { label: 'ENLEV/TRAIT DECHETS NON DANGEREUX (DND)', checked: false },
      { label: 'GARDIENNAGE', checked: false },
      { label: 'PHOTOMONTAGE - SIMULATION 3D', checked: false },
      { label: 'PRESTATIONS DE DIAGNOSTICS SUR INSTALLATIONS ÉLECTRIQUES', checked: false },
      { label: 'SERVICES DE PRISE DE VUES AERIENNES', checked: false },
      { label: 'TRANSPORT LOURD', checked: false },
    ],
    maintenance: [
      { label: "MAINTENANCE DE MATÉRIELS D'ATELIERS D'ÉNERGIE", checked: false },
      { label: 'MAINTENANCE DE MATÉRIELS DE CCN', checked: false },
      { label: 'MAINTENANCE DE MATÉRIELS DE COMPTAGE', checked: false },
      { label: 'MAINTENANCE DE MATÉRIELS DE FILERIE', checked: false },
      { label: "MAINTENANCE DE MATÉRIELS DE PROTECTION ET D'AUTOMATISME", checked: false },
      { label: 'MAINTENANCE DE MATÉRIELS DE QUALIMÉTRIE', checked: false },
      { label: 'MAINTENANCE DE MATÉRIELS DE TÉLÉCONDUITE', checked: false },
      { label: 'MAINTENANCE DE STATIONS DE CONVERSION', checked: false },
      { label: 'MAINTENANCE DES APPAREILLAGES HTB', checked: false },
      { label: 'MAINTENANCE DES INSTALLATIONS DE PROTECTION DES POSTES', checked: false },
      { label: 'MAINTENANCE DES TRANSFORMATEURS ET DES MATÉRIELS BOBINÉS', checked: false },
      { label: 'MAINTENANCE ET CONTRÔLE RÉGLEMENTAIRE OUTILLAGE', checked: false },
      { label: 'POSTES HT ET THT-MAINTENANCE DES MATÉRIELS DE COMPENSATION', checked: false },
    ],
    autres: [{ label: 'AUTRES (champ libre)', checked: false }],
  };

  const [ficheAchat, setFicheAchat] = useState({
    expression_besoin: {
      libelle_affaire: '',
      otp_affaire: '',
      nom_emetteur: '',
      estimation_ht: '',
      description_prestation: '',
      date: '',
    },
    marche: {
      sur_marche_cadre: false,
      numero_marche: '',
      hors_marche_cadre: false,
      entreprises_a_consulter: [],
      regles_consultation: { '1_devis_si_<=6k': false, '3_devis_si_>6k_et_<40k': false },
      commentaires: '',
    },
    manager_projet: { nom: '', visa: false },
    consultation: {
      date_envoi_consultation: '',
      prix_objectif_ht: '',
      date_limite_reception_offres: '',
      date_ouverture_plis: '',
      date_validite_offres: '',
      variantes_possibles: false,
      entreprises_consultees: [],
    },
    attribution: {
      entreprise_retenue: '',
      montant_ht: '',
      moins_disant: false,
      mieux_disant: false,
      gre_a_gre: false,
      accord_cadre: false,
    },
  });

  useEffect(() => {
    setRefreshKey(k => k + 1);
  }, [columns]);

  useEffect(() => {
    const handleLibraryDrop = e => {
      const { columnId, boardId, data } = e.detail;
      const { itemType, content, title } = data;

      if (!columnId) return;
      if (!content) {
        console.error('No content in library drop');
        return;
      }

      try {
        const parsedContent = JSON.parse(content);

        if (itemType === 'card' && parsedContent.card) {
          createCard(
            columnId,
            parsedContent.card.title,
            parsedContent.card.description || '',
            parsedContent.card.priority || 'normal',
            parsedContent.card.due_date || null,
            parsedContent.card.assignee || ''
          ).then(cardId => {
            if (cardId && parsedContent.categories) {
              parsedContent.categories.forEach((cat, catIndex) => {
                createCategory(
                  cardId,
                  cat.title,
                  cat.description || '',
                  cat.priority || 'normal',
                  cat.due_date || null,
                  cat.assignee || ''
                ).then(categoryId => {
                  if (categoryId && cat.subcategories) {
                    cat.subcategories.forEach((subcat, subIndex) => {
                      createSubcategory(
                        categoryId,
                        subcat.title,
                        subcat.description || '',
                        subcat.priority || 'normal',
                        subcat.due_date || null,
                        subcat.assignee || ''
                      );
                    });
                  }
                });
              });
            }
            loadBoard(boardId);
          });
        } else if (itemType === 'category' && parsedContent.category) {
          createCard(
            columnId,
            parsedContent.category.title,
            parsedContent.category.description || '',
            parsedContent.category.priority || 'normal',
            parsedContent.category.due_date || null,
            parsedContent.category.assignee || ''
          ).then(cardId => {
            if (cardId && parsedContent.subcategories) {
              parsedContent.subcategories.forEach((subcat, subIndex) => {
                createSubcategory(
                  cardId,
                  subcat.title,
                  subcat.description || '',
                  subcat.priority || 'normal',
                  subcat.due_date || null,
                  subcat.assignee || ''
                );
              });
            }
            loadBoard(boardId);
          });
        } else if (itemType === 'subcategory' && parsedContent.subcategory) {
          const columnCards = cards.filter(c => Number(c.column_id) === Number(columnId));
          if (columnCards.length > 0) {
            createCategory(
              columnCards[0].id,
              parsedContent.subcategory.title,
              parsedContent.subcategory.description || '',
              parsedContent.subcategory.priority || 'normal',
              parsedContent.subcategory.due_date || null,
              parsedContent.subcategory.assignee || ''
            );
          }
          loadBoard(boardId);
        }
      } catch (error) {
        console.error('Error handling library drop:', error);
      }
    };

    window.addEventListener('library-drop', handleLibraryDrop);
    return () => window.removeEventListener('library-drop', handleLibraryDrop);
  }, [createCard, createCategory, createSubcategory, loadBoard, cards]);

  const handleCreateColumn = async e => {
    e.preventDefault();
    if (newColumnTitle.trim() && currentBoard) {
      const boardId = currentBoard.id;
      setNewColumnTitle('');
      setShowNewColumn(false);
      createColumn(boardId, newColumnTitle.trim());
    }
  };

  const handleDragEnd = result => {
    if (!result.destination) {
      return;
    }

    const { source, destination, draggableId, type } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (type === 'column') {
      moveColumn(Number(draggableId), destination.index);
      return;
    }

    if (type === 'card') {
      const cardId = Number(draggableId);
      const newColumnId = Number(destination.droppableId);
      const newPosition = destination.index;
      moveCard(cardId, newColumnId, newPosition);
      return;
    }

    if (type === 'category') {
      const categoryId = Number(draggableId.replace('category-', ''));
      const newCardId = Number(destination.droppableId.replace('card-', ''));
      const newPosition = destination.index;
      moveCategory(categoryId, newCardId, newPosition);
      return;
    }

    if (type === 'subcategory') {
      const subcategoryId = Number(draggableId.replace('subcategory-', ''));
      const newCategoryId = Number(destination.droppableId.replace('category-', ''));
      const newPosition = destination.index;
      moveSubcategory(subcategoryId, newCategoryId, newPosition);
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-secondary">Chargement...</div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-secondary mb-4">Aucun projet sélectionné</p>
          <p className="text-sm text-muted">Créez un nouveau projet depuis la barre latérale</p>
        </div>
      </div>
    );
  }

  const orderedColumns = [...columns].sort((a, b) => a.position - b.position);

  const handleArchiveBoard = () => {
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
    <div key={refreshKey} className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          {currentBoard.description && (
            <p className="text-sm text-secondary mb-2">{currentBoard.description}</p>
          )}
        </div>
        <button
          onClick={handleArchiveBoard}
          className="flex items-center px-3 py-1.5 text-sm bg-card hover:bg-card-hover border border-std rounded transition-std text-secondary"
          title="Archiver le projet (toutes les cartes doivent être dans la colonne Archiver)"
        >
          <Archive size={14} className="mr-2" />
          Archiver
        </button>
      </div>

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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="column" direction="horizontal">
            {provided => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex h-full min-h-[calc(100vh-180px)] space-x-[14px] pb-4 pt-1"
              >
                {orderedColumns.map((column, index) => (
                  <Draggable key={column.id} draggableId={String(column.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex-shrink-0 relative group"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 cursor-grab z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-muted hover:text-secondary"
                          title="Déplacer la colonne"
                        >
                          <GripVertical size={16} />
                        </div>
                        <Column column={column} index={index} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                <div className="flex-shrink-0 w-[310px]">
                  {showNewColumn ? (
                    <form
                      onSubmit={handleCreateColumn}
                      className="bg-column rounded-lg border border-std p-3"
                    >
                      <input
                        type="text"
                        value={newColumnTitle}
                        onChange={e => setNewColumnTitle(e.target.value)}
                        placeholder="Nom de la colonne..."
                        className="w-full px-3 py-2 text-sm bg-input border border-std rounded-md text-primary placeholder-muted focus:outline-none focus:border-accent"
                        autoFocus
                        onBlur={() => {
                          if (!newColumnTitle.trim()) setShowNewColumn(false);
                        }}
                      />
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-md hover:opacity-90 transition-std"
                        >
                          Ajouter
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewColumnTitle('');
                            setShowNewColumn(false);
                          }}
                          className="px-3 py-1.5 text-sm text-secondary hover:text-primary"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewColumn(true)}
                      className="w-full h-12 flex items-center justify-center bg-card/30 hover:bg-card rounded-lg border-2 border-dashed border-std text-secondary hover:text-primary transition-std"
                    >
                      <Plus size={20} className="mr-2" />
                      Ajouter une colonne
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {activeTab === 'commandes' && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-std p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-primary mb-4">Liste des commandes</h3>
            {commandes.length === 0 ? (
              <p className="text-sm text-muted">Aucune commande</p>
            ) : (
              <div className="space-y-2">
                {commandes.map(cmd => (
                  <div key={cmd.id}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCommande(cmd);
                          setSelectedAvenant(null);
                        }}
                        className={`flex-1 text-left p-2 rounded border text-sm ${
                          selectedCommande?.id === cmd.id && !selectedAvenant
                            ? 'border-accent bg-accent-soft'
                            : 'border-std bg-card hover:bg-card-hover'
                        }`}
                      >
                        {cmd.title}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Êtes-vous sûr de vouloir supprimer "${cmd.title}" ? Cette action est irréversible.`
                            )
                          ) {
                            if (
                              window.confirm(
                                `Confirmer définitivement la suppression de "${cmd.title}" et de tous ses avenants ?`
                              )
                            ) {
                              deleteOrder(cmd.id);
                              setCommandes(commandes.filter(c => c.id !== cmd.id));
                              if (selectedCommande?.id === cmd.id) {
                                setSelectedCommande(null);
                                setSelectedAvenant(null);
                              }
                            }
                          }
                        }}
                        className="p-1 text-muted hover:text-urgent"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {cmd.avenants?.map(av => (
                      <div key={av.id} className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedCommande(cmd);
                            setSelectedAvenant(av);
                          }}
                          className={`flex-1 text-left p-2 rounded border text-sm ${
                            selectedAvenant?.id === av.id
                              ? 'border-accent bg-accent-soft'
                              : 'border-std bg-card hover:bg-card-hover'
                          }`}
                        >
                          {av.title}
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(`Êtes-vous sûr de vouloir supprimer "${av.title}" ?`)
                            ) {
                              const updatedCommandes = commandes.map(c =>
                                c.id === cmd.id
                                  ? {
                                      ...c,
                                      avenants: c.avenants?.filter(a => a.id !== av.id) || [],
                                    }
                                  : c
                              );
                              setCommandes(updatedCommandes);
                              if (selectedAvenant?.id === av.id) {
                                setSelectedAvenant(null);
                              }
                            }
                          }}
                          className="p-1 text-muted hover:text-urgent"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const avenantNumber = (cmd.avenants?.length || 0) + 1;
                        const newAvenant = {
                          id: Date.now(),
                          title: `Avenant ${avenantNumber}`,
                          numero: avenantNumber,
                          donnees: { ...cmd.donnees },
                        };
                        const updatedCommandes = commandes.map(c =>
                          c.id === cmd.id
                            ? { ...c, avenants: [...(c.avenants || []), newAvenant] }
                            : c
                        );
                        setCommandes(updatedCommandes);
                        setSelectedAvenant(newAvenant);
                      }}
                      className="ml-8 mt-1 text-xs text-accent hover:underline"
                    >
                      + Créer un Avenant
                    </button>
                  </div>
                ))}
              </div>
            )}
            {showAddCommande ? (
              <div className="mt-4 p-3 bg-card rounded border border-std">
                <input
                  type="text"
                  placeholder="Nom de la commande"
                  value={newCommandeTitle}
                  onChange={e => setNewCommandeTitle(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-input border border-std rounded mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newCommandeTitle.trim()) {
                        const newCmd = {
                          id: Date.now(),
                          title: newCommandeTitle.trim(),
                          groupes: JSON.parse(JSON.stringify(groupesMarchandises)),
                          ficheAchat: JSON.parse(JSON.stringify(ficheAchat)),
                          donnees: { numero: '', date: '', objet: '', estimation: '' },
                        };
                        setCommandes([...commandes, newCmd]);
                        setSelectedCommande(newCmd);
                        setNewCommandeTitle('');
                        setShowAddCommande(false);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-accent text-white rounded"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCommande(false);
                      setNewCommandeTitle('');
                    }}
                    className="px-2 py-1 text-xs text-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCommande(true)}
                className="w-full mt-4 p-2 text-sm text-accent border border-dashed border-accent rounded hover:bg-accent-soft"
              >
                + Nouvelle commande
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedCommande ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-primary">{selectedCommande.title}</h2>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setActiveTabCommande('affectation')}
                        className={`px-3 py-1 text-xs rounded ${
                          activeTabCommande === 'affectation'
                            ? 'bg-accent text-white'
                            : 'border border-accent text-accent hover:bg-accent-soft'
                        }`}
                      >
                        Affectation
                      </button>
                      <button
                        onClick={() => setActiveTabCommande('commande')}
                        className={`px-3 py-1 text-xs rounded ${
                          activeTabCommande === 'commande'
                            ? 'bg-accent text-white'
                            : 'border border-accent text-accent hover:bg-accent-soft'
                        }`}
                      >
                        Commande
                      </button>
                    </div>
                  </div>
                  {activeTabCommande === 'commande' && (
                    <button className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent/90">
                      Envoyer
                    </button>
                  )}
                </div>

                {activeTabCommande === 'affectation' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">RENSEIGNEMENTS</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">N° Affaire</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Date de réception
                          </label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Date limite</label>
                          <input
                            type="date"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Interlocuteur</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">
                        GÉNÉRALITÉS SUR L'OUVRAGE
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">Désignation</label>
                          <textarea
                            rows={2}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Localisation</label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Maître d'ouvrage
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">
                        TYPOLOGIE ET DÉTAILS DE CONSISTANCE
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Type d'intervention
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Description sommaire
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Travaux prévus
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">CHIFFRAGE (k€)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Montant HT (k€)
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Montant TTC (k€)
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Honoraires (k€)
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Frais annexes (k€)
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">
                        VÉRIFICATION DU CHIFFRAGE ET DES DONNÉES D'ENTRÉES DU CCTP
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Hypothèses de calculs
                          </label>
                          <textarea
                            rows={2}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Base de prix utilisée
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Coefficients appliqués
                          </label>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm">CCTP vérifié et complet</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm">Données d'entrées cohérentes</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-lg border border-std">
                      <h3 className="text-sm font-semibold text-primary mb-4">SYNTHÈSE</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-secondary mb-1">Commentaires</label>
                          <textarea
                            rows={4}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Risques identifiés
                          </label>
                          <textarea
                            rows={2}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Validation</label>
                          <select className="w-full px-2 py-1 text-sm bg-input border border-std rounded">
                            <option value="">Sélectionner...</option>
                            <option value="valide">Validé</option>
                            <option value="en_attente">En attente</option>
                            <option value="rejeté">Rejeté</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTabCommande === 'commande' && (
                  <div className="p-4 bg-card rounded-lg border border-std">
                    <h3 className="text-sm font-semibold text-primary mb-4">Données commandes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-medium text-secondary uppercase border-b border-std pb-1">
                          Demandeur
                        </h4>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Nom rédacteur / Interlocuteur
                          </label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.nomRedacteur || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? {
                                      ...c,
                                      donnees: { ...c.donnees, nomRedacteur: e.target.value },
                                    }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Responsable Projet
                          </label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.responsableProjet || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? {
                                      ...c,
                                      donnees: { ...c.donnees, responsableProjet: e.target.value },
                                    }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Téléphone</label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.telephone || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? { ...c, donnees: { ...c.donnees, telephone: e.target.value } }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Service</label>
                          <select
                            value={selectedCommande.donnees?.service || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? { ...c, donnees: { ...c.donnees, service: e.target.value } }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="SLA">SLA</option>
                            <option value="SLS">SLS</option>
                            <option value="SPOCC 1">SPOCC 1</option>
                            <option value="SPOCC 2">SPOCC 2</option>
                            <option value="SPOCC 3">SPOCC 3</option>
                            <option value="SCET">SCET</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Signataire final prévu
                          </label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.signataireFinal || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? {
                                      ...c,
                                      donnees: { ...c.donnees, signataireFinal: e.target.value },
                                    }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Marché Cadre N°
                          </label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.numeroMarche || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? {
                                      ...c,
                                      donnees: { ...c.donnees, numeroMarche: e.target.value },
                                    }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-medium text-secondary uppercase border-b border-std pb-1">
                          Affaire
                        </h4>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Nom du projet</label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.nomProjet || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? { ...c, donnees: { ...c.donnees, nomProjet: e.target.value } }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Détail commande
                          </label>
                          <textarea
                            value={selectedCommande.donnees?.detailCommande || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? {
                                      ...c,
                                      donnees: { ...c.donnees, detailCommande: e.target.value },
                                    }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            rows={3}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-medium text-secondary uppercase border-b border-std pb-1">
                          Entreprise
                        </h4>
                        <div>
                          <label className="block text-xs text-secondary mb-1">
                            Nom de l'entreprise
                          </label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.nomEntreprise || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? {
                                      ...c,
                                      donnees: { ...c.donnees, nomEntreprise: e.target.value },
                                    }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">SIRET</label>
                          <input
                            type="text"
                            value={selectedCommande.donnees?.siret || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? { ...c, donnees: { ...c.donnees, siret: e.target.value } }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary mb-1">Adresse</label>
                          <textarea
                            value={selectedCommande.donnees?.adresseEntreprise || ''}
                            onChange={e => {
                              const updated = commandes.map(c =>
                                c.id === selectedCommande.id
                                  ? {
                                      ...c,
                                      donnees: { ...c.donnees, adresseEntreprise: e.target.value },
                                    }
                                  : c
                              );
                              setCommandes(updated);
                              setSelectedCommande(updated.find(c => c.id === selectedCommande.id));
                            }}
                            rows={3}
                            className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted">
                <p>Sélectionnez ou créez une commande</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="flex-1 flex items-center justify-center text-secondary">
          <div className="text-center">
            <Calendar size={48} className="mx-auto mb-4 text-muted" />
            <p>Page Planning à développer</p>
          </div>
        </div>
      )}

      {activeTab === 'echanges' && currentBoard && <Exchange boardId={currentBoard.id} />}

      {activeTab === 'informations' && (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
              <ExternalLink size={16} className="mr-2" />
              Liens
            </h3>
            <div className="flex flex-wrap gap-2">
              {links.map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    if (!link.url) {
                      const url = prompt("Entrez l'URL :", 'https://');
                      if (url) {
                        setLinks(links.map(l => (l.id === link.id ? { ...l, url } : l)));
                      }
                    } else {
                      window.open(link.url, '_blank');
                    }
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    const title = prompt('Nom du lien :', link.title);
                    if (title) {
                      setLinks(links.map(l => (l.id === link.id ? { ...l, title } : l)));
                    }
                  }}
                  className="flex items-center px-3 py-2 bg-card hover:bg-card-hover border border-std rounded text-sm text-primary transition-std"
                  style={{ borderLeftColor: link.color, borderLeftWidth: '3px' }}
                >
                  {link.type === 'web' ? (
                    <ExternalLink size={14} className="mr-2" style={{ color: link.color }} />
                  ) : (
                    <FolderOpen size={14} className="mr-2" style={{ color: link.color }} />
                  )}
                  {link.title}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const color = prompt('Couleur (hex) :', link.color);
                      if (color) {
                        setLinks(links.map(l => (l.id === link.id ? { ...l, color } : l)));
                      }
                    }}
                    className="ml-2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: link.color }}
                  />
                </button>
              ))}
              {showAddLink ? (
                <div className="flex items-center gap-2 p-2 bg-card border border-std rounded">
                  <select
                    value={newLink.type}
                    onChange={e => setNewLink({ ...newLink, type: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary"
                  >
                    <option value="web">Internet</option>
                    <option value="folder">Dossier</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newLink.title}
                    onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary w-32"
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={newLink.url}
                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary w-40"
                  />
                  <input
                    type="color"
                    value={newLink.color}
                    onChange={e => setNewLink({ ...newLink, color: e.target.value })}
                    className="w-8 h-8 cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      if (newLink.title.trim()) {
                        setLinks([...links, { ...newLink, id: Date.now() }]);
                        setNewLink({ title: '', url: '', type: 'web', color: '#22C55E' });
                        setShowAddLink(false);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-accent text-white rounded"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setShowAddLink(false)}
                    className="px-2 py-1 text-xs text-secondary"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddLink(true)}
                  className="flex items-center px-3 py-2 bg-card hover:bg-card-hover border border-dashed border-std rounded text-sm text-secondary transition-std"
                >
                  <PlusCircle size={14} className="mr-2" />
                  Ajouter
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-card rounded-lg border border-std">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">EOTP</h3>
              <button
                onClick={() =>
                  setEotpLines([...eotpLines, { id: Date.now(), numero: '', ruo: '', libelle: '' }])
                }
                className="flex items-center px-2 py-1 text-xs text-accent hover:bg-card-hover rounded"
              >
                <PlusCircle size={12} className="mr-1" />
                Ajouter une ligne
              </button>
            </div>
            <div className="space-y-3">
              {eotpLines.map((eotp, idx) => (
                <div key={eotp.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="N°EOTP"
                      value={eotp.numero}
                      onChange={e => {
                        const updated = eotpLines.map((l, i) =>
                          i === idx ? { ...l, numero: e.target.value } : l
                        );
                        setEotpLines(updated);
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="RUO"
                    value={eotp.ruo}
                    onChange={e => {
                      const updated = eotpLines.map((l, i) =>
                        i === idx ? { ...l, ruo: e.target.value } : l
                      );
                      setEotpLines(updated);
                    }}
                    className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Libellé opération"
                      value={eotp.libelle}
                      onChange={e => {
                        const updated = eotpLines.map((l, i) =>
                          i === idx ? { ...l, libelle: e.target.value } : l
                        );
                        setEotpLines(updated);
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    {eotpLines.length > 1 && (
                      <button
                        onClick={() => setEotpLines(eotpLines.filter((_, i) => i !== idx))}
                        className="text-muted hover:text-urgent"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
              <User size={16} className="mr-2" />
              Interlocuteurs internes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internalContacts.map(contact => (
                <div key={contact.id} className="p-3 bg-card rounded-lg border border-std">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{contact.title}</span>
                    <button
                      onClick={() =>
                        setInternalContacts(internalContacts.filter(c => c.id !== contact.id))
                      }
                      className="text-muted hover:text-urgent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nom et prénom"
                    value={contact.name || ''}
                    onChange={e => {
                      const updated = internalContacts.map(c =>
                        c.id === contact.id ? { ...c, name: e.target.value } : c
                      );
                      setInternalContacts(updated);
                    }}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                  />
                </div>
              ))}
              {showAddInternal ? (
                <div className="p-3 bg-card rounded-lg border border-std">
                  <input
                    type="text"
                    placeholder="Fonction"
                    value={newInternalTitle}
                    onChange={e => setNewInternalTitle(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary mb-2 focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newInternalTitle.trim()) {
                          setInternalContacts([
                            ...internalContacts,
                            { id: Date.now(), title: newInternalTitle.trim() },
                          ]);
                          setNewInternalTitle('');
                          setShowAddInternal(false);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-accent text-white rounded"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setShowAddInternal(false);
                        setNewInternalTitle('');
                      }}
                      className="px-2 py-1 text-xs text-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddInternal(true)}
                  className="p-3 bg-card/50 rounded-lg border border-dashed border-std text-secondary hover:text-primary hover:border-accent transition-std flex items-center justify-center"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Ajouter
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
              <Building size={16} className="mr-2" />
              Interlocuteurs externes
            </h3>
            <div className="space-y-3">
              {externalContacts.map((contact, idx) => (
                <div key={idx} className="p-4 bg-card rounded-lg border border-std">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-primary">
                      {contact.entreprise || 'Nouveau contact'}
                    </span>
                    <button
                      onClick={() =>
                        setExternalContacts(externalContacts.filter((_, i) => i !== idx))
                      }
                      className="text-muted hover:text-urgent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Entreprise"
                      value={contact.entreprise}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].entreprise = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Fonction"
                      value={contact.fonction}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].fonction = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={contact.nom}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].nom = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={contact.prenom}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].prenom = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={contact.email}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].email = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Tél. bureau"
                      value={contact.telBureau}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].telBureau = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Portable"
                      value={contact.telPortable}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].telPortable = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Adresse"
                      value={contact.adresse}
                      onChange={e => {
                        const updated = [...externalContacts];
                        updated[idx].adresse = e.target.value;
                        setExternalContacts(updated);
                      }}
                      className="px-2 py-1 text-sm bg-input border border-std rounded text-primary placeholder-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  setExternalContacts([
                    ...externalContacts,
                    {
                      entreprise: '',
                      fonction: '',
                      nom: '',
                      prenom: '',
                      email: '',
                      telBureau: '',
                      telPortable: '',
                      adresse: '',
                    },
                  ])
                }
                className="w-full p-3 bg-card/50 rounded-lg border border-dashed border-std text-secondary hover:text-primary hover:border-accent transition-std flex items-center justify-center"
              >
                <PlusCircle size={16} className="mr-2" />
                Ajouter un contact externe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board;
