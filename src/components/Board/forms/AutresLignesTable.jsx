import React from 'react';
import { Trash2, PlusCircle } from 'lucide-react';

export function AutresLignesTable({
  autresLignes,
  setCommandeDetail,
  selectedAvenant,
  eotpLines,
  getEotpLabelById,
  getLigne010,
  syncFromLigne010,
  handleAddAutresLigne,
  handleDeleteAutresLigne,
}) {
  const ligne010 = getLigne010 ? getLigne010() : null;
  const eotpSyncValue = ligne010 ? getEotpLabelById(ligne010.eotpId) : '';

  const handleUpdateLigne = (index, field, value) => {
    setCommandeDetail(prev => {
      const newLignes = [...(prev.autresLignes || [])];
      newLignes[index] = { ...newLignes[index], [field]: value };
      return { ...prev, autresLignes: newLignes };
    });
  };

  return (
    <div className="p-4 bg-card rounded-lg border border-std">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-primary">AUTRES LIGNES</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1 text-xs text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={ligne010?.otpIdentiqueChecked || false}
              onChange={e => {
                setCommandeDetail(prev => ({
                  ...prev,
                  otpIdentiqueChecked: e.target.checked,
                }));
                if (e.target.checked && syncFromLigne010) syncFromLigne010('eotpId');
              }}
            />
            OTP identique pour chaque poste ({eotpSyncValue || '—'})
          </label>
          <label className="flex items-center gap-1 text-xs text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={ligne010?.dateReceptionUniqueChecked || false}
              onChange={e => {
                setCommandeDetail(prev => ({
                  ...prev,
                  dateReceptionUniqueChecked: e.target.checked,
                }));
                if (e.target.checked && syncFromLigne010) syncFromLigne010('dateReception');
              }}
            />
            Date réception unique ({ligne010?.dateReception || '—'})
          </label>
          <button
            onClick={handleAddAutresLigne}
            className="flex items-center px-2 py-1 text-xs text-accent hover:bg-card-hover rounded"
          >
            <PlusCircle size={12} className="mr-1" />
            Ajouter une ligne
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {(autresLignes || []).map((ligne, idx) => {
          const isAvenantLine = ligne.designation?.startsWith('AV');
          const avPrefix = isAvenantLine ? ligne.designation.split(' ')[0] : '';
          const avNumber = isAvenantLine ? parseInt(avPrefix.replace('AV', '')) : 0;
          const designationWithoutPrefix = ligne.designation?.replace(/^AV\d+\s*/, '') || '';

          const allAvenantNumbers = (autresLignes || [])
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

          if (selectedAvenant && !isAvenantLine) return null;
          if (!selectedAvenant && isAvenantLine) return null;

          return (
            <div
              key={ligne.id || idx}
              className={`p-3 bg-input rounded border ${
                isPreviousAvenant ? 'border-muted opacity-50' : 'border-std'
              }`}
            >
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-1">
                  <input
                    type="text"
                    value={ligne.numero}
                    onChange={e => handleUpdateLigne(idx, 'numero', e.target.value)}
                    className="w-full px-1 py-1 text-xs bg-card border border-std rounded"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    value={designationWithoutPrefix}
                    onChange={e => {
                      const prefix = isAvenantLine ? avPrefix + ' ' : '';
                      handleUpdateLigne(idx, 'designation', prefix + e.target.value);
                    }}
                    placeholder="Désignation"
                    className="w-full px-1 py-1 text-xs bg-card border border-std rounded"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={ligne.eotpId || ''}
                    onChange={e => handleUpdateLigne(idx, 'eotpId', e.target.value)}
                    className="w-full px-1 py-1 text-xs bg-card border border-std rounded"
                  >
                    <option value="">-- EOTP --</option>
                    {eotpLines.map(eotp => (
                      <option key={eotp.id} value={eotp.id}>
                        {getEotpLabelById(eotp.id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={ligne.dateReception || ''}
                    onChange={e => handleUpdateLigne(idx, 'dateReception', e.target.value)}
                    placeholder="Date"
                    className="w-full px-1 py-1 text-xs bg-card border border-std rounded"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    value={ligne.quantite || ''}
                    onChange={e =>
                      handleUpdateLigne(
                        idx,
                        'quantite',
                        e.target.value === '' ? '' : parseFloat(e.target.value)
                      )
                    }
                    placeholder="Qté"
                    className="w-full px-1 py-1 text-xs bg-card border border-std rounded"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    value={ligne.coutUnitaire || ''}
                    onChange={e =>
                      handleUpdateLigne(
                        idx,
                        'coutUnitaire',
                        e.target.value === '' ? '' : parseFloat(e.target.value)
                      )
                    }
                    placeholder="Prix U."
                    className="w-full px-1 py-1 text-xs bg-card border border-std rounded"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    value={ligne.montant || 0}
                    readOnly
                    className="w-full px-1 py-1 text-xs bg-card border border-std rounded text-right"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleDeleteAutresLigne(idx)}
                    className="p-1 text-muted hover:text-urgent"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
