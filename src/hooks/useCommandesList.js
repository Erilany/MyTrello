import { useState, useEffect, useCallback } from 'react';

export function useCommandesList({
  currentBoard,
  contextSelectedCommande,
  contextSetSelectedCommande,
  commandeDetail,
  isInitialized,
  loadFromCommande,
}) {
  const [commandes, setCommandes] = useState([]);
  const [selectedAvenant, setSelectedAvenant] = useState(null);
  const [showAddCommande, setShowAddCommande] = useState(false);
  const [newCommandeTitle, setNewCommandeTitle] = useState('');
  const [isLoadingCommande, setIsLoadingCommande] = useState(false);

  useEffect(() => {
    if (currentBoard?.id) {
      setCommandes(
        JSON.parse(localStorage.getItem(`board-${currentBoard.id}-commandes`) || '[]')
      );
    }
  }, [currentBoard?.id]);

  useEffect(() => {
    if (currentBoard?.id) {
      contextSetSelectedCommande(null);
      setSelectedAvenant(null);
    }
  }, [currentBoard?.id]);

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

  useEffect(() => {
    if (isInitialized && currentBoard?.id) {
      localStorage.setItem(`board-${currentBoard.id}-commandes`, JSON.stringify(commandes));
    }
  }, [commandes, isInitialized, currentBoard?.id]);

  const handleSelectCommande = useCallback(
    cmd => {
      contextSetSelectedCommande(cmd);
      setSelectedAvenant(null);
      loadFromCommande(cmd);
    },
    [contextSetSelectedCommande, loadFromCommande]
  );

  const saveCommandeDetail = useCallback(() => {
    if (!contextSelectedCommande) return;
    const updatedCommandes = commandes.map(c =>
      c.id === contextSelectedCommande.id ? { ...c, detail: commandeDetail } : c
    );
    setCommandes(updatedCommandes);
    localStorage.setItem('c-projets_commandes', JSON.stringify(updatedCommandes));
  }, [contextSelectedCommande, commandeDetail, commandes]);

  return {
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
  };
}
