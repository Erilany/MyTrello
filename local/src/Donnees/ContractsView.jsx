import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, ChevronUp, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'c-projets_contracts';

const COLUMNS = [
  { key: 'numeroMarche', label: 'N° Marché', width: 'w-[120px]' },
  { key: 'acheteur', label: 'Acheteur', width: 'w-[100px]' },
  { key: 'entiteAchat', label: 'Entité Achat', width: 'w-[120px]' },
  { key: 'typeMarche', label: 'Type Marché', width: 'w-[100px]' },
  { key: 'fournisseur', label: 'Fournisseur', width: 'w-[150px]' },
  { key: 'dateDebut', label: 'Début', width: 'w-[90px]' },
  { key: 'dateFin', label: 'Fin', width: 'w-[90px]' },
  { key: 'segment', label: 'Segment', width: 'w-[100px]' },
  { key: 'lienDOKI', label: 'Lien DOKI', width: 'w-[100px]' },
];

export default function ContractsView() {
  const [contracts, setContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('numeroMarche');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setContracts(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing contracts:', e);
          setContracts([]);
        }
      } else {
        setContracts([]);
      }
      setIsLoading(false);
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const filteredAndSortedContracts = useMemo(() => {
    let result = [...contracts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        Object.entries(c).some(([key, value]) => {
          if (key === 'id') return false;
          return String(value || '')
            .toLowerCase()
            .includes(term);
        })
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [contracts, searchTerm, sortField, sortDirection]);

  if (isLoading) {
    return <div className="p-4 text-muted">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-accent" />
          <h2 className="text-xl font-bold text-primary">Contrats</h2>
          <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
            {filteredAndSortedContracts.length} / {contracts.length} contrat(s)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 p-4 bg-card rounded-lg border border-std">
        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Rechercher dans tous les champs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 bg-input border border-std rounded text-sm text-primary"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-muted hover:text-primary">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-std overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full border-collapse">
            <thead className="bg-card-hover sticky top-0 z-10">
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std ${col.width}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label} <SortIcon field={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-std">
              {filteredAndSortedContracts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-muted">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucun contrat</p>
                    <p className="text-sm">Importez un fichier CSV depuis Paramètres Système</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedContracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-card-hover">
                    <td className="px-2 py-2 text-xs text-primary font-medium whitespace-nowrap border-std">
                      {contract.numeroMarche || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-secondary whitespace-nowrap border-std">
                      {contract.acheteur || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-secondary whitespace-nowrap border-std">
                      {contract.entiteAchat || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-secondary whitespace-nowrap border-std">
                      {contract.typeMarche || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-secondary whitespace-nowrap border-std">
                      {contract.fournisseur || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-secondary whitespace-nowrap border-std">
                      {contract.dateDebut || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-secondary whitespace-nowrap border-std">
                      {contract.dateFin || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-secondary whitespace-nowrap border-std">
                      {contract.segment || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-accent hover:underline border-std">
                      {contract.lienDOKI ? (
                        <a href={contract.lienDOKI} target="_blank" rel="noopener noreferrer">
                          Lien
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted mt-4">
        Données synchronisées depuis Paramètres Système → Contrats
      </p>
    </div>
  );
}
