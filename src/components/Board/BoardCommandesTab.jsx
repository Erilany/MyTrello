import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateFrench } from '../../utils/dateUtils';
import { formatUserName } from '../../utils/nameUtils';
import { PaiementsForm } from './forms/PaiementsForm';
import {
  Trash2,
  X,
  PlusCircle,
  Mail,
  Upload,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { GROUPES_MARCHANDISES, CATEGORY_KEYS } from '../../data/GroupesMarchandises';
import { useCommandeDetail } from '../../hooks/useCommandeDetail';
import { useCommandesList } from '../../hooks/useCommandesList';
import { useContracts } from '../../hooks/useContracts';

// =============================================================================
// BoardCommandesTab — onglet Commandes extrait de Board2.jsx
// Props :
//   eotpLines      : array  — état de l'onglet Informations
//   isInitialized  : bool   — évite les saves prématurées
//   internalContacts : array — contacts internes (géré par Board2 / Informations)
// =============================================================================

function BoardCommandesTab({ eotpLines, isInitialized, internalContacts }) {
  const {
    currentBoard,
    selectedCommande: contextSelectedCommande,
    setSelectedCommande: contextSetSelectedCommande,
    activeTabCommande: contextActiveTabCommande,
    setActiveTabCommande: contextSetActiveTabCommande,
  } = useApp();

  // ---------------------------------------------------------------------------
  // États
  // ---------------------------------------------------------------------------

  const {
    commandeDetail,
    setCommandeDetail,
    loadFromCommande,
    initializeGroupesMarchandises,
    syncFromLigne010,
    handleUpdateAffectation,
    handleUpdateCommande,
    handleUpdateAutresLigne,
    handleAddAutresLigne: addAutresLigne,
    handleDeleteAutresLigne,
    getTotalMontantHT,
    handleToggleMarchandise,
    handleUpdateMarchandiseLibre,
    handleSelectAllInCategory,
    getCategoryCount,
  } = useCommandeDetail();

  const {
    commandes,
    setCommandes,
    selectedAvenant,
    setSelectedAvenant,
    showAddCommande,
    setShowAddCommande,
    newCommandeTitle,
    setNewCommandeTitle,
    isLoadingCommande,
    setIsLoadingCommande,
    handleSelectCommande,
    saveCommandeDetail,
  } = useCommandesList({
    currentBoard,
    contextSelectedCommande,
    contextSetSelectedCommande,
    commandeDetail,
    isInitialized,
    loadFromCommande,
  });

  const { contracts, marcheCadreSuggestions } = useContracts(
    commandeDetail.commande.marcheCadre
  );

  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);

  // Sync eotpLines[0].libelle → commandeDetail.commande.affaire
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


  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

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
    const eotp = getLevel2Eotp().find(e => String(e.id) === String(eotpId));
    return eotp ? `${eotp.numero} - ${eotp.libelle}` : '';
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

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

  const handleAddAutresLigneWrapped = () => addAutresLigne(selectedAvenant);

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
    if (!commandeDetail || !currentBoard) return;

    const { affectation, commande, autresLignes, groupesMarchandises } = commandeDetail;
    const checkedItems = [];
    CATEGORY_KEYS.forEach(key => {
      const items = groupesMarchandises[key] || [];
      items.filter(i => i.checked).forEach(i => checkedItems.push(i.label));
    });

    const getEotpLabel = eotpId => {
      if (!eotpId) return '-';
      const eotp = getLevel2Eotp().find(e => String(e.id) === String(eotpId));
      return eotp ? `${eotp.numero} - ${eotp.libelle}` : 'Non renseigne';
    };

    const formatDateFr = dateStr => {
      if (!dateStr) return '-';
      return formatDateFrench(dateStr);
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
Date: ${formatDateFr(commande.dateCommande)}<br>
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
    <td style="${cellStyle}">${formatDateFr(ligne.dateReception)}</td>
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

    const dateStr = formatDateFrench(new Date().toISOString());
    const numCmd = commande.numeroCommande || 'new';
    let fileName;
    if (selectedAvenant) {
      fileName = `Avenant N°${selectedAvenant.numero}_${numCmd}_${dateStr}.html`;
    } else {
      fileName = `Création commande_${numCmd}_${dateStr}.html`;
    }

    const blob = new Blob([htmlBody], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar — liste des commandes */}
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
                      handleSelectCommande(cmd);
                      setSelectedAvenant(null);
                    }}
                    className={`flex-1 text-left p-2 rounded border text-sm ${
                      contextSelectedCommande?.id === cmd.id && !selectedAvenant
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
                          setCommandes(commandes.filter(c => c.id !== cmd.id));
                          if (contextSelectedCommande?.id === cmd.id) {
                            contextSetSelectedCommande(null);
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
                {cmd.avenants && cmd.avenants.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-2 mt-1">
                    {cmd.avenants.map(av => (
                      <span
                        key={av.id}
                        className="px-2 py-0.5 text-xs font-medium rounded bg-accent-soft text-accent border border-accent"
                      >
                        AV{av.numero}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsLoadingCommande(true);
                    const maxAvenantNumber =
                      cmd.avenants && cmd.avenants.length > 0
                        ? Math.max(...cmd.avenants.map(a => a.numero || 0))
                        : 0;
                    const avenantNumber = maxAvenantNumber + 1;
                    const avenantPrefix = `AV${avenantNumber} `;
                    const newAvenant = {
                      id: Date.now(),
                      title: `Avenant ${avenantNumber}`,
                      numero: avenantNumber,
                      donnees: { numero: '', date: '', objet: '', estimation: '' },
                    };
                    const updatedCommandes = commandes.map(c =>
                      c.id === cmd.id
                        ? { ...c, avenants: [...(c.avenants || []), newAvenant] }
                        : c
                    );
                    setCommandes(updatedCommandes);

                    const currentLignes = commandeDetail.autresLignes || [];
                    const inheritedEotpId =
                      commandeDetail.otpIdentiqueChecked && currentLignes.length > 0
                        ? currentLignes[0].eotpId
                        : '';
                    const inheritedDateReception =
                      commandeDetail.dateReceptionUniqueChecked && currentLignes.length > 0
                        ? currentLignes[0].dateReception
                        : '';

                    const updatedDetail = {
                      ...commandeDetail,
                      autresLignes: [
                        ...(commandeDetail.autresLignes || []),
                        {
                          id: Date.now(),
                          numero: String(
                            ((commandeDetail.autresLignes?.length || 0) + 1) * 10
                          ).padStart(3, '0'),
                          designation: avenantPrefix,
                          eotpId: inheritedEotpId,
                          dateReception: inheritedDateReception,
                          quantite: '',
                          coutUnitaire: '',
                          montant: 0,
                          paiements: [],
                        },
                      ],
                    };
                    setCommandeDetail(updatedDetail);
                    setSelectedAvenant(newAvenant);
                    setTimeout(() => setIsLoadingCommande(false), 100);
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
                    const newDetail = {
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
                        affaire: eotpLines[0]?.libelle || '',
                      },
                      groupesMarchandises: initializeGroupesMarchandises(),
                    };
                    const newCmd = {
                      id: Date.now(),
                      title: newCommandeTitle.trim(),
                      donnees: { numero: '', date: '', objet: '', estimation: '' },
                      detail: newDetail,
                    };
                    setCommandes([...commandes, newCmd]);
                    handleSelectCommande(newCmd);
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

      {/* Zone principale */}
      <div className="flex-1 overflow-y-auto p-4">
        {contextSelectedCommande ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">
                  {contextSelectedCommande.title}
                </h2>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => contextSetActiveTabCommande('affectation')}
                    className={`px-3 py-1 text-xs rounded ${
                      contextActiveTabCommande === 'affectation'
                        ? 'bg-accent text-white'
                        : 'border border-accent text-accent hover:bg-accent-soft'
                    }`}
                  >
                    Affectation
                  </button>
                  <button
                    onClick={() => contextSetActiveTabCommande('commande')}
                    className={`px-3 py-1 text-xs rounded ${
                      contextActiveTabCommande === 'commande'
                        ? 'bg-accent text-white'
                        : 'border border-accent text-accent hover:bg-accent-soft'
                    }`}
                  >
                    Commande
                  </button>
                  {(() => {
                    const bothSigned = commandeDetail.commande.signatureRTE && commandeDetail.commande.signatureTitulaire;
                    return (
                      <div className="relative group">
                        <button
                          onClick={() => bothSigned && contextSetActiveTabCommande('decompte')}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            !bothSigned
                              ? 'border border-gray-400 text-gray-400 cursor-not-allowed opacity-50'
                              : contextActiveTabCommande === 'decompte'
                                ? 'bg-accent text-white'
                                : 'border border-accent text-accent hover:bg-accent-soft'
                          }`}
                        >
                          Décompte
                        </button>
                        {!bothSigned && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-52 bg-gray-800 text-white text-[10px] rounded px-2 py-1.5 text-center shadow-lg pointer-events-none">
                            Requiert la signature RTE et du titulaire
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {contextActiveTabCommande === 'affectation' && (
              <div className="space-y-6">
                <div className="p-4 bg-card rounded-lg border border-std">
                  <h3 className="text-sm font-semibold text-primary mb-4">RENSEIGNEMENTS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-secondary mb-1">N° Affaire</label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.numeroAffaire}
                        onChange={e => handleUpdateAffectation('numeroAffaire', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">
                        Date de réception
                      </label>
                      <input
                        type="date"
                        value={commandeDetail.affectation.dateReception}
                        onChange={e => handleUpdateAffectation('dateReception', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Date limite</label>
                      <input
                        type="date"
                        value={commandeDetail.affectation.dateLimite}
                        onChange={e => handleUpdateAffectation('dateLimite', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Interlocuteur</label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.interlocuteur}
                        onChange={e => handleUpdateAffectation('interlocuteur', e.target.value)}
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
                        value={commandeDetail.affectation.designation}
                        onChange={e => handleUpdateAffectation('designation', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Localisation</label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.localisation}
                        onChange={e => handleUpdateAffectation('localisation', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">
                        Maître d'ouvrage
                      </label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.maitreOuvrage}
                        onChange={e => handleUpdateAffectation('maitreOuvrage', e.target.value)}
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
                        value={commandeDetail.affectation.typeIntervention}
                        onChange={e =>
                          handleUpdateAffectation('typeIntervention', e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">
                        Description sommaire
                      </label>
                      <textarea
                        rows={3}
                        value={commandeDetail.affectation.descriptionSommaire}
                        onChange={e =>
                          handleUpdateAffectation('descriptionSommaire', e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">
                        Surface / Volume
                      </label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.surfaceVolume}
                        onChange={e => handleUpdateAffectation('surfaceVolume', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {contextActiveTabCommande === 'commande' && (
              <div className="space-y-6">
                <div className="p-4 bg-card rounded-lg border border-std">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-primary">DONNÉES COMMANDE</h3>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 px-2 py-1 text-xs bg-accent text-white rounded cursor-pointer hover:opacity-90">
                        <Upload size={12} />
                        <span>Importer</span>
                        <input
                          type="file"
                          accept=".txt,.json"
                          className="hidden"
                          onChange={handleImportFile}
                        />
                      </label>
                      <button
                        onClick={handleGenerateEmail}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Mail size={12} />
                        <span>Email</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-secondary mb-1">N° Commande</label>
                      <input
                        type="text"
                        value={commandeDetail.commande.numeroCommande}
                        onChange={e => handleUpdateCommande('numeroCommande', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Date</label>
                      <input
                        type="date"
                        value={commandeDetail.commande.dateCommande}
                        onChange={e => handleUpdateCommande('dateCommande', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">
                        Nom du Rédacteur/Interlocuteur
                      </label>
                      <select
                        value={commandeDetail.commande.redacteur}
                        onChange={e => handleUpdateCommande('redacteur', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      >
                        <option value="">-- Sélectionner --</option>
                        {(internalContacts || []).map(contact => {
                          const displayName = formatUserName(contact.name || contact.title);
                          return (
                            <option key={contact.id} value={displayName}>
                              {displayName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">
                        Signataire final prévu
                      </label>
                      <input
                        type="text"
                        value={commandeDetail.commande.signataireFinal}
                        onChange={e => handleUpdateCommande('signataireFinal', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>

                    {/* Signatures */}
                    <div className="col-span-2">
                      <label className="block text-xs text-secondary mb-2 font-medium">Signatures</label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Signature RTE */}
                        <div className={`p-3 rounded-lg border-2 transition-colors ${commandeDetail.commande.signatureRTE ? 'border-green-500 bg-green-500/10' : 'border-std bg-card'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id="signatureRTE"
                              checked={commandeDetail.commande.signatureRTE}
                              onChange={e => handleUpdateCommande('signatureRTE', e.target.checked)}
                              className="w-4 h-4 accent-green-500"
                            />
                            <label htmlFor="signatureRTE" className="text-sm font-medium text-primary cursor-pointer flex items-center gap-1">
                              {commandeDetail.commande.signatureRTE
                                ? <CheckCircle2 size={14} className="text-green-500" />
                                : <Clock size={14} className="text-[var(--txt-muted)]" />}
                              Signé par RTE
                            </label>
                          </div>
                          <input
                            type="date"
                            value={commandeDetail.commande.dateSignatureRTE}
                            onChange={e => handleUpdateCommande('dateSignatureRTE', e.target.value)}
                            disabled={!commandeDetail.commande.signatureRTE}
                            className="w-full px-2 py-1 text-xs bg-input border border-std rounded disabled:opacity-40"
                          />
                        </div>

                        {/* Signature Titulaire */}
                        <div className={`p-3 rounded-lg border-2 transition-colors ${commandeDetail.commande.signatureTitulaire ? 'border-green-500 bg-green-500/10' : 'border-std bg-card'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id="signatureTitulaire"
                              checked={commandeDetail.commande.signatureTitulaire}
                              onChange={e => handleUpdateCommande('signatureTitulaire', e.target.checked)}
                              className="w-4 h-4 accent-green-500"
                            />
                            <label htmlFor="signatureTitulaire" className="text-sm font-medium text-primary cursor-pointer flex items-center gap-1">
                              {commandeDetail.commande.signatureTitulaire
                                ? <CheckCircle2 size={14} className="text-green-500" />
                                : <Clock size={14} className="text-[var(--txt-muted)]" />}
                              Signé par le titulaire
                            </label>
                          </div>
                          <input
                            type="date"
                            value={commandeDetail.commande.dateSignatureTitulaire}
                            onChange={e => handleUpdateCommande('dateSignatureTitulaire', e.target.value)}
                            disabled={!commandeDetail.commande.signatureTitulaire}
                            className="w-full px-2 py-1 text-xs bg-input border border-std rounded disabled:opacity-40"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-xs text-secondary mb-1">
                        Marché cadre N°
                      </label>
                      <input
                        type="text"
                        value={commandeDetail.commande.marcheCadre}
                        onChange={e => handleUpdateCommande('marcheCadre', e.target.value)}
                        placeholder="Tapez pour rechercher..."
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                        autoComplete="off"
                      />
                      {marcheCadreSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-card border border-std rounded shadow-lg max-h-48 overflow-y-auto">
                          {marcheCadreSuggestions.map(contract => (
                            <button
                              key={contract.id}
                              type="button"
                              onClick={() => {
                                const fullText = `${contract.numeroMarche} - ${contract.fournisseur}`;
                                handleUpdateCommande('marcheCadre', fullText);
                                setMarcheCadreSuggestions([]);
                              }}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-card-hover border-b border-std last:border-b-0"
                            >
                              <span className="font-medium text-primary">
                                {contract.numeroMarche}
                              </span>
                              <span className="text-muted ml-2">- {contract.fournisseur}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Affaire</label>
                      <input
                        type="text"
                        value={commandeDetail.commande.affaire}
                        disabled
                        className="w-full px-2 py-1 text-sm bg-std text-muted border border-std rounded cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Informations</label>
                      <textarea
                        value={commandeDetail.commande.informations || ''}
                        onChange={e => handleUpdateCommande('informations', e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded resize-none"
                        placeholder="Informations complémentaires..."
                      />
                    </div>
                  </div>
                </div>

                {/* AUTRES Section */}
                <div className="p-4 bg-card rounded-lg border border-std">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-primary">AUTRES</h3>
                    <div className="flex items-center gap-4">
                      {(() => {
                        const ligne010 = getLigne010();
                        const eotpSyncValue = ligne010 ? getEotpLabelById(ligne010.eotpId) : '';
                        return (
                          <label className="flex items-center gap-1 text-xs text-secondary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={commandeDetail.otpIdentiqueChecked}
                              onChange={e => {
                                setCommandeDetail(prev => ({
                                  ...prev,
                                  otpIdentiqueChecked: e.target.checked,
                                }));
                                if (e.target.checked) syncFromLigne010('eotpId');
                              }}
                            />
                            OTP identique pour chaque poste ({eotpSyncValue || '—'})
                          </label>
                        );
                      })()}
                      {(() => {
                        const ligne010 = getLigne010();
                        return (
                          <label className="flex items-center gap-1 text-xs text-secondary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={commandeDetail.dateReceptionUniqueChecked}
                              onChange={e => {
                                setCommandeDetail(prev => ({
                                  ...prev,
                                  dateReceptionUniqueChecked: e.target.checked,
                                }));
                                if (e.target.checked) syncFromLigne010('dateReception');
                              }}
                            />
                            Date réception unique (
                            {formatDateFrench(ligne010?.dateReception) || '—'})
                          </label>
                        );
                      })()}
                      <button
                        onClick={handleAddAutresLigneWrapped}
                        className="flex items-center px-2 py-1 text-xs text-accent hover:bg-card-hover rounded"
                      >
                        <PlusCircle size={12} className="mr-1" />
                        Ajouter une ligne
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(commandeDetail.autresLignes || []).map((ligne, idx) => {
                      const isAvenantLine = ligne.designation?.startsWith('AV');

                      const avPrefix = isAvenantLine ? ligne.designation.split(' ')[0] : '';
                      const avNumber = isAvenantLine ? parseInt(avPrefix.replace('AV', '')) : 0;
                      const designationWithoutPrefix =
                        ligne.designation?.replace(/^AV\d+\s*/, '') || '';

                      const allAvenantNumbers = (commandeDetail.autresLignes || [])
                        .filter(l => l.designation?.startsWith('AV'))
                        .map(l => {
                          const prefix = l.designation.split(' ')[0];
                          return parseInt(prefix.replace('AV', ''));
                        })
                        .filter(n => !isNaN(n));

                      const maxAvenantNumber =
                        allAvenantNumbers.length > 0 ? Math.max(...allAvenantNumbers) : 0;

                      const hasAnyAvenant = allAvenantNumbers.length > 0;
                      const isPreviousAvenant = isAvenantLine && avNumber < maxAvenantNumber;
                      const isCurrentAvenant = isAvenantLine && avNumber === maxAvenantNumber;
                      const isBaseCommandLine = !isAvenantLine;
                      const isBaseLocked = isBaseCommandLine && hasAnyAvenant;

                      return (
                        <div
                          key={ligne.id}
                          className="flex items-center gap-2 bg-card-hover p-2 rounded"
                        >
                          <span className="text-xs text-muted w-8 font-medium">
                            {ligne.numero}
                          </span>
                          {isAvenantLine && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-accent-soft text-accent rounded">
                              {avPrefix}
                            </span>
                          )}
                          <textarea
                            placeholder="Désignation"
                            value={designationWithoutPrefix}
                            onChange={e => {
                              const newDesignation = avPrefix
                                ? `${avPrefix} ${e.target.value}`
                                : e.target.value;
                              handleUpdateAutresLigne(idx, 'designation', newDesignation);
                            }}
                            disabled={isPreviousAvenant || isBaseLocked}
                            rows={2}
                            className={`flex-[2] px-2 py-1 text-sm border rounded resize-none ${
                              isPreviousAvenant || isBaseLocked
                                ? 'bg-std text-muted cursor-not-allowed'
                                : 'bg-input border-std'
                            }`}
                          />
                          <select
                            value={ligne.eotpId}
                            onChange={e => {
                              handleUpdateAutresLigne(idx, 'eotpId', e.target.value);
                            }}
                            disabled={
                              commandeDetail.otpIdentiqueChecked ||
                              isPreviousAvenant ||
                              isBaseLocked
                            }
                            className={`flex-1 px-2 py-1 text-sm border rounded ${
                              commandeDetail.otpIdentiqueChecked ||
                              isPreviousAvenant ||
                              isBaseLocked
                                ? 'bg-std text-muted cursor-not-allowed'
                                : 'bg-input border-std'
                            }`}
                          >
                            <option value="">-- EOTP --</option>
                            {getLevel2Eotp().map(eotp => (
                              <option key={eotp.id} value={eotp.id}>
                                {eotp.numero} - {eotp.libelle}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={ligne.dateReception}
                            onChange={e =>
                              handleUpdateAutresLigne(idx, 'dateReception', e.target.value)
                            }
                            disabled={commandeDetail.dateReceptionUniqueChecked}
                            className={`w-28 px-2 py-1 text-sm border rounded ${
                              commandeDetail.dateReceptionUniqueChecked
                                ? 'bg-std text-muted cursor-not-allowed'
                                : 'bg-input border-std'
                            }`}
                          />
                          <input
                            type="number"
                            placeholder="Qté"
                            value={ligne.quantite === 0 ? '' : ligne.quantite}
                            min="0"
                            onChange={e => {
                              const val = e.target.value;
                              handleUpdateAutresLigne(idx, 'quantite', val === '' ? '' : val);
                            }}
                            className="w-16 px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                          <input
                            type="number"
                            placeholder="PU HT"
                            value={ligne.coutUnitaire === 0 ? '' : ligne.coutUnitaire}
                            min="0"
                            onChange={e => {
                              const val = e.target.value;
                              handleUpdateAutresLigne(
                                idx,
                                'coutUnitaire',
                                val === '' ? '' : val
                              );
                            }}
                            className="w-20 px-2 py-1 text-sm bg-input border border-std rounded"
                          />
                          <span className="w-24 text-right text-sm font-medium text-primary">
                            {parseFloat(ligne.montant || 0).toFixed(2)} €
                          </span>
                          <button
                            onClick={() => handleDeleteAutresLigne(idx)}
                            className="text-muted hover:text-urgent p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                    {/* Total line */}
                    {(commandeDetail.autresLignes || []).length > 0 && (
                      <div className="flex items-center justify-end gap-4 pt-2 border-t border-std">
                        <span className="text-sm font-semibold text-primary">
                          Montant Total HT
                        </span>
                        <span className="w-24 text-right text-sm font-bold text-accent">
                          {getTotalMontantHT().toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-card rounded-lg border border-std">
                  <h3 className="text-sm font-semibold text-primary mb-4">
                    GROUPES DE MARCHANDISES
                  </h3>
                  <div className="space-y-3">
                    {CATEGORY_KEYS.map(categoryKey => {
                      const category = GROUPES_MARCHANDISES[categoryKey];
                      const isExpanded = expandedCategories.has(categoryKey);
                      const count = getCategoryCount(categoryKey);
                      const items = commandeDetail.groupesMarchandises[categoryKey] || [];

                      return (
                        <div
                          key={categoryKey}
                          className={`rounded-lg border ${category.bgColor} ${category.borderColor}`}
                        >
                          <button
                            onClick={() => toggleMarchandiseCategory(categoryKey)}
                            className={`w-full flex items-center justify-between p-3 ${category.textColor}`}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                              <span className="font-semibold">{category.label}</span>
                            </div>
                            <div className="flex items-center gap-[10px]">
                              <span className="text-xs font-medium">
                                {count.checked}/{count.total}
                              </span>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSelectAllInCategory(categoryKey);
                                }}
                                className={`text-xs px-2 py-0.5 rounded border ${category.textColor} border-current opacity-80 hover:opacity-100`}
                              >
                                {count.checked === count.total
                                  ? 'Tout désélectionner'
                                  : 'Tout sélectionner'}
                              </button>
                            </div>
                          </button>
                          {isExpanded ? (
                            <div className="px-3 pb-3 space-y-1">
                              {items.map((item, idx) => {
                                if (item.label === 'AUTRES (champ libre)') {
                                  return (
                                    <div key={idx} className="py-1">
                                      <textarea
                                        placeholder="Entrez du texte libre..."
                                        value={item.libreValue || ''}
                                        onChange={e =>
                                          handleUpdateMarchandiseLibre(
                                            categoryKey,
                                            e.target.value
                                          )
                                        }
                                        rows={2}
                                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded resize-none"
                                      />
                                    </div>
                                  );
                                }
                                return (
                                  <label
                                    key={idx}
                                    className="flex items-center gap-2 py-1 cursor-pointer hover:opacity-80"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.checked}
                                      onChange={() =>
                                        handleToggleMarchandise(categoryKey, item.label)
                                      }
                                      className="w-4 h-4 accent-current"
                                      style={{ accentColor: category.color }}
                                    />
                                    <span className="text-xs text-secondary">{item.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="px-3 pb-2">
                              {items.map((item, idx) => {
                                if (item.label === 'AUTRES (champ libre)') {
                                  if (item.libreValue) {
                                    return (
                                      <div
                                        key={idx}
                                        className="text-xs text-secondary italic truncate"
                                      >
                                        ✓ {item.libreValue}
                                      </div>
                                    );
                                  }
                                  return null;
                                }
                                if (item.checked) {
                                  return (
                                    <span
                                      key={idx}
                                      className="inline-block mr-2 text-xs text-secondary"
                                    >
                                      ✓ {item.label}
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {contextActiveTabCommande === 'decompte' && (
              <PaiementsForm
                autresLignes={commandeDetail.autresLignes}
                setCommandeDetail={setCommandeDetail}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted">
            <p>Sélectionnez une commande</p>
          </div>
        )}
      </div>

      {/* Modal import */}
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

export default BoardCommandesTab;
