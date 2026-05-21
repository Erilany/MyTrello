import { useState, useEffect } from 'react';

export function useContracts(marcheCadreSearch) {
  const [contracts, setContracts] = useState([]);
  const [marcheCadreSuggestions, setMarcheCadreSuggestions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('c-projets_contracts');
    if (stored) setContracts(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const search = marcheCadreSearch?.toLowerCase() || '';
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
  }, [marcheCadreSearch, contracts]);

  return { contracts, marcheCadreSuggestions };
}
