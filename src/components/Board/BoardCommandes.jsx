import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { PaiementsForm } from './forms/PaiementsForm';

export function BoardCommandes({
  commandes,
  setCommandes,
  selectedAvenant,
  setSelectedAvenant,
  commandeDetail,
  setCommandeDetail,
  contextSelectedCommande,
  contextSetSelectedCommande,
  contextActiveTabCommande,
  contextSetActiveTabCommande,
  handleSelectCommande,
  handleUpdateAffectation,
  handleUpdateCommande,
  handleAddAutresLigne,
  handleDeleteAutresLigne,
  getTotalMontantHT,
  getLigne010,
  setIsLoadingCommande,
  eotpLines,
  getEotpLabelById,
  contracts,
  selectedChapter,
  selectedCategoryForTasks,
}) {
  const handleUpdateLigne = (idx, field, value) => {
    const currentLignes = commandeDetail.autresLignes || [];
    const newLignes = [...currentLignes];
    newLignes[idx] = { ...newLignes[idx], [field]: value };
    setCommandeDetail(prev => ({ ...prev, autresLignes: newLignes }));
  };

  const handleAddLigne = () => {
    const currentLignes = commandeDetail.autresLignes || [];
    const currentAvenant = selectedAvenant
      ? currentLignes.filter(l => l.numero.startsWith(`AV${selectedAvenant.numero}`))
      : currentLignes;
    const newLigne = {
      id: Date.now(),
      numero: `${selectedAvenant ? `AV${selectedAvenant.numero} ` : ''}${(currentAvenant.length + 1) * 10}`,
      designation: '',
      eotpId: '',
      montant: '',
    };
    setCommandeDetail(prev => ({
      ...prev,
      autresLignes: [...(prev.autresLignes || []), newLigne],
    }));
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ============================================================================= */}
      {/* SECTION: LISTE DES COMMANDES */}
      {/* ============================================================================= */}
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
                      <button
                        key={av.id}
                        onClick={() => {
                          setSelectedAvenant(av);
                          contextSetSelectedCommande(cmd);
                        }}
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${
                          selectedAvenant?.id === av.id
                            ? 'bg-accent text-white border-accent'
                            : 'bg-accent-soft text-accent border-accent hover:bg-accent/20'
                        }`}
                      >
                        AV{av.numero}
                      </button>
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
                        ? {
                            ...c,
                            avenants: [...(c.avenants || []), newAvenant],
                          }
                        : c
                    );
                    setCommandes(updatedCommandes);
                    const currentLignes = commandeDetail.autresLignes || [];
                    const updatedDetail = {
                      ...commandeDetail,
                      autresLignes: [
                        ...commandeDetail,
                        ...(commandeDetail.autresLignes || []),
                        {
                          id: Date.now(),
                          numero: `${avenantPrefix}010`,
                          designation: '',
                          eotpId:
                            commandeDetail.otpIdentiqueChecked && currentLignes.length > 0
                              ? currentLignes[0].eotpId
                              : '',
                          montant: '',
                          otpIdentiqueChecked: commandeDetail.otpIdentiqueChecked,
                          dateReceptionUniqueChecked: commandeDetail.dateReceptionUniqueChecked,
                        },
                      ],
                    };
                    setCommandeDetail(updatedDetail);
                    setSelectedAvenant(newAvenant);
                  }}
                  className="ml-2 mt-1 text-xs text-accent hover:underline"
                >
                  + Ajouter un avenant
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================================= */}
        {/* SECTION: AJOUTER COMMANDE */}
        {/* ============================================================================= */}
        <button
          onClick={() => {
            const newCmd = {
              id: Date.now(),
              title: `Commande ${commandes.length + 1}`,
              avenants: [],
              createdAt: new Date().toISOString(),
            };
            setCommandes([...commandes, newCmd]);
            handleSelectCommande(newCmd);
          }}
          className="w-full mt-4 p-2 text-sm text-accent border border-dashed border-accent rounded hover:bg-accent-soft flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Nouvelle commande
        </button>
      </div>

      {/* ============================================================================= */}
      {/* SECTION: DÉTAILS COMMANDE */}
      {/* ============================================================================= */}
      <div className="flex-1 overflow-y-auto p-4">
        {contextSelectedCommande ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">
                  {selectedAvenant
                    ? `${contextSelectedCommande.title} - Avenant ${selectedAvenant.numero}`
                    : contextSelectedCommande.title}
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
                  <button
                    onClick={() => contextSetActiveTabCommande('decompte')}
                    className={`px-3 py-1 text-xs rounded ${
                      contextActiveTabCommande === 'decompte'
                        ? 'bg-accent text-white'
                        : 'border border-accent text-accent hover:bg-accent-soft'
                    }`}
                  >
                    Décompte
                  </button>
                </div>
              </div>
              {selectedAvenant && (
                <button
                  onClick={() => setSelectedAvenant(null)}
                  className="text-sm text-muted hover:text-primary"
                >
                  ← Retour à la commande
                </button>
              )}
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
                      <label className="block text-xs text-secondary mb-1">Date de réception</label>
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
                  <h3 className="text-sm font-semibold text-primary mb-4">DÉSIGNATION</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-secondary mb-1">Désignation</label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.designation}
                        onChange={e => handleUpdateAffectation('designation', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
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
                      <label className="block text-xs text-secondary mb-1">Maître d'ouvrage</label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.maitreOuvrage}
                        onChange={e => handleUpdateAffectation('maitreOuvrage', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">
                        Type d'intervention
                      </label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.typeIntervention}
                        onChange={e => handleUpdateAffectation('typeIntervention', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Surface/Volume</label>
                      <input
                        type="text"
                        value={commandeDetail.affectation.surfaceVolume}
                        onChange={e => handleUpdateAffectation('surfaceVolume', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-secondary mb-1">
                        Description sommaire
                      </label>
                      <textarea
                        value={commandeDetail.affectation.descriptionSynopsis}
                        onChange={e =>
                          handleUpdateAffectation('descriptionSynopsis', e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {contextActiveTabCommande === 'commande' && (
              <div className="space-y-6">
                <div className="p-4 bg-card rounded-lg border border-std">
                  <h3 className="text-sm font-semibold text-primary mb-4">INFOS COMMANDE</h3>
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
                      <label className="block text-xs text-secondary mb-1">Date commande</label>
                      <input
                        type="date"
                        value={commandeDetail.commande.dateCommande}
                        onChange={e => handleUpdateCommande('dateCommande', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Rédacteur</label>
                      <input
                        type="text"
                        value={commandeDetail.commande.redacteur}
                        onChange={e => handleUpdateCommande('redacteur', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Signataire final</label>
                      <input
                        type="text"
                        value={commandeDetail.commande.signataireFinal}
                        onChange={e => handleUpdateCommande('signataireFinal', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Marché cadre</label>
                      <input
                        type="text"
                        value={commandeDetail.commande.marcheCadre}
                        onChange={e => handleUpdateCommande('marcheCadre', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Affaire</label>
                      <input
                        type="text"
                        value={commandeDetail.commande.affaire}
                        onChange={e => handleUpdateCommande('affaire', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-secondary mb-1">Informations</label>
                      <textarea
                        value={commandeDetail.commande.informations || ''}
                        onChange={e => handleUpdateCommande('informations', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-card rounded-lg border border-std">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-primary">OPTIONS</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={commandeDetail.otpIdentiqueChecked || false}
                        onChange={e =>
                          setCommandeDetail(prev => ({
                            ...prev,
                            otpIdentiqueChecked: e.target.checked,
                          }))
                        }
                        className="rounded border-std"
                      />
                      OTP identique pour toutes les lignes
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={commandeDetail.dateReceptionUniqueChecked || false}
                        onChange={e =>
                          setCommandeDetail(prev => ({
                            ...prev,
                            dateReceptionUniqueChecked: e.target.checked,
                          }))
                        }
                        className="rounded border-std"
                      />
                      Date de réception unique
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-card rounded-lg border border-std">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-primary">
                      AUTRES LIGNES - TOTAL: {getTotalMontantHT()} €
                    </h3>
                    <button
                      onClick={handleAddLigne}
                      className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/80"
                    >
                      + Ligne
                    </button>
                  </div>
                  {(commandeDetail.autresLignes || []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-std">
                            <th className="px-2 py-1 text-left text-secondary">N°</th>
                            <th className="px-2 py-1 text-left text-secondary">Désignation</th>
                            <th className="px-2 py-1 text-left text-secondary">EOTP</th>
                            <th className="px-2 py-1 text-left text-secondary">Montant HT</th>
                            <th className="px-2 py-1 text-left text-secondary"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(commandeDetail.autresLignes || []).map((ligne, idx) => (
                            <tr key={ligne.id || idx} className="border-b border-std">
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={ligne.numero}
                                  onChange={e => handleUpdateLigne(idx, 'numero', e.target.value)}
                                  className="w-20 px-1 py-1 text-sm bg-input border border-std rounded"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={ligne.designation}
                                  onChange={e =>
                                    handleUpdateLigne(idx, 'designation', e.target.value)
                                  }
                                  className="w-full px-1 py-1 text-sm bg-input border border-std rounded"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <select
                                  value={ligne.eotpId || ''}
                                  onChange={e => handleUpdateLigne(idx, 'eotpId', e.target.value)}
                                  className="w-32 px-1 py-1 text-sm bg-input border border-std rounded"
                                >
                                  <option value="">-- EOTP --</option>
                                  {eotpLines.map(eotp => (
                                    <option key={eotp.id} value={eotp.id}>
                                      {getEotpLabelById(eotp.id)}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  value={ligne.montant}
                                  onChange={e => handleUpdateLigne(idx, 'montant', e.target.value)}
                                  className="w-24 px-1 py-1 text-sm bg-input border border-std rounded"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <button
                                  onClick={() => {
                                    const newLignes = (commandeDetail.autresLignes || []).filter(
                                      (_, i) => i !== idx
                                    );
                                    setCommandeDetail(prev => ({
                                      ...prev,
                                      autresLignes: newLignes,
                                    }));
                                  }}
                                  className="p-1 text-muted hover:text-urgent"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Aucune ligne</p>
                  )}
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
    </div>
  );
}
