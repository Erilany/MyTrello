import React from 'react';
import { Trash2 } from 'lucide-react';

export function PaiementsForm({ autresLignes, setCommandeDetail }) {
  const allLignes = autresLignes || [];
  const totalCommande = allLignes.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0);
  const totalPaye = allLignes.reduce((sum, ligne) => {
    const paiements = ligne.paiements || [];
    return sum + paiements.reduce((s, p) => s + (parseFloat(p.montant) || 0), 0);
  }, 0);
  const percentage = totalCommande > 0 ? (totalPaye / totalCommande) * 100 : 0;

  const addPaiement = idx => {
    const ligne = allLignes[idx];
    const paiements = ligne.paiements || [];
    const newPaiement = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      montant: '',
      pourcentage: '',
    };
    const newLignes = [...allLignes];
    newLignes[idx] = {
      ...newLignes[idx],
      paiements: [...paiements, newPaiement],
    };
    setCommandeDetail(prev => ({
      ...prev,
      autresLignes: newLignes,
    }));
  };

  const updatePaiementDate = (ligneIdx, paiementIdx, date) => {
    const newLignes = [...allLignes];
    newLignes[ligneIdx].paiements[paiementIdx].date = date;
    setCommandeDetail(prev => ({
      ...prev,
      autresLignes: newLignes,
    }));
  };

  const updatePaiementMontant = (ligneIdx, paiementIdx, montant, ligneMontant) => {
    const newLignes = [...allLignes];
    const newMontant = montant;
    const pct =
      ligneMontant > 0 ? (((parseFloat(newMontant) || 0) / ligneMontant) * 100).toFixed(2) : '';
    newLignes[ligneIdx].paiements[paiementIdx] = {
      ...newLignes[ligneIdx].paiements[paiementIdx],
      montant: newMontant,
      pourcentage: pct,
    };
    setCommandeDetail(prev => ({
      ...prev,
      autresLignes: newLignes,
    }));
  };

  const updatePaiementPourcentage = (ligneIdx, paiementIdx, pourcentage, ligneMontant) => {
    const newLignes = [...allLignes];
    const newPct = pourcentage;
    const calcMontant = (ligneMontant * (parseFloat(newPct) || 0)) / 100;
    newLignes[ligneIdx].paiements[paiementIdx] = {
      ...newLignes[ligneIdx].paiements[paiementIdx],
      pourcentage: newPct,
      montant: calcMontant > 0 ? calcMontant.toFixed(2) : '',
    };
    setCommandeDetail(prev => ({
      ...prev,
      autresLignes: newLignes,
    }));
  };

  const deletePaiement = (ligneIdx, paiementIdx) => {
    const newLignes = [...allLignes];
    newLignes[ligneIdx].paiements = newLignes[ligneIdx].paiements.filter(
      (_, i) => i !== paiementIdx
    );
    setCommandeDetail(prev => ({
      ...prev,
      autresLignes: newLignes,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-card rounded-lg border border-std">
        <h3 className="text-sm font-semibold text-primary mb-4">SUIVI DES PAIEMENTS</h3>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-secondary">Montant total</span>
            <span className="font-semibold text-primary">{totalCommande.toFixed(2)} €</span>
          </div>
          <div className="h-4 bg-std rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted">Payé: {totalPaye.toFixed(2)} €</span>
            <span className="text-muted">{percentage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-4">
          {allLignes.map((ligne, idx) => {
            const paiements = ligne.paiements || [];
            const ligneMontant = parseFloat(ligne.montant) || 0;
            const totalPayeLigne = paiements.reduce(
              (sum, p) => sum + (parseFloat(p.montant) || 0),
              0
            );
            const percentageLigne = ligneMontant > 0 ? (totalPayeLigne / ligneMontant) * 100 : 0;

            return (
              <div key={idx} className="p-3 bg-card-hover rounded-lg border border-std">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-muted mr-2">
                      {String(ligne.numero || '').padStart(3, '0')}.
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {ligne.designation || `Ligne ${ligne.numero}`}
                    </span>
                    <span className="ml-2 text-sm text-accent">{ligneMontant.toFixed(2)} €</span>
                  </div>
                  <button
                    onClick={() => addPaiement(idx)}
                    className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/80"
                  >
                    + Paiement
                  </button>
                </div>

                <div className="h-2 bg-std rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.min(percentageLigne, 100)}%` }}
                  />
                </div>

                <div className="text-xs text-muted mb-2">
                  Payé: {totalPayeLigne.toFixed(2)} € ({percentageLigne.toFixed(1)}%)
                </div>

                {paiements.length > 0 && (
                  <div className="space-y-2 mt-3 border-t border-std pt-2">
                    {paiements.map((paiement, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <input
                          type="date"
                          value={paiement.date || ''}
                          onChange={e => updatePaiementDate(idx, pIdx, e.target.value)}
                          className="px-2 py-1 text-xs bg-input border border-std rounded"
                        />
                        <input
                          type="number"
                          placeholder="Montant"
                          value={paiement.montant || ''}
                          onChange={e =>
                            updatePaiementMontant(idx, pIdx, e.target.value, ligneMontant)
                          }
                          className="px-2 py-1 text-xs bg-input border border-std rounded w-24"
                        />
                        <input
                          type="number"
                          placeholder="%"
                          value={paiement.pourcentage || ''}
                          onChange={e =>
                            updatePaiementPourcentage(idx, pIdx, e.target.value, ligneMontant)
                          }
                          className="px-2 py-1 text-xs bg-input border border-std rounded w-16"
                        />
                        <span className="text-xs text-muted">
                          {ligneMontant > 0 && (parseFloat(paiement.pourcentage) || 0) > 0
                            ? (
                                ((parseFloat(paiement.pourcentage) || 0) * ligneMontant) /
                                100
                              ).toFixed(2) + ' €'
                            : ''}
                        </span>
                        <button
                          onClick={() => deletePaiement(idx, pIdx)}
                          className="text-muted hover:text-urgent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PaiementsForm;
