import { useState, useMemo } from 'react';

export function useContractsFilter(contracts) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('numeroMarche');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedContracts = useMemo(() => {
    let result = [...contracts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        c =>
          c.numeroMarche?.toLowerCase().includes(term) ||
          c.acheteur?.toLowerCase().includes(term) ||
          c.fournisseur?.toLowerCase().includes(term)
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

  return {
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    filteredAndSortedContracts,
    handleSort,
  };
}
