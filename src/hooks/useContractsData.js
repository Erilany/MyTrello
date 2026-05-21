import { useState, useEffect } from 'react';
import { CONTRACTS_STORAGE_KEY } from '../components/Settings/contractsUtils';

export function useContractsData() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (stored) {
      setContracts(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const saveContractData = data => {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(data));
  };

  const handleDelete = id => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) return;
    const updated = contracts.filter(c => c.id !== id);
    setContracts(updated);
    saveContractData(updated);
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Voulez-vous vraiment supprimer tous les contrats ?')) return;
    setContracts([]);
    saveContractData([]);
  };

  return {
    contracts,
    setContracts,
    isLoading,
    saveContractData,
    handleDelete,
    handleDeleteAll,
  };
}
