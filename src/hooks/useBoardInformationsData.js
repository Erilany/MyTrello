import { useState, useEffect, useRef, useCallback } from 'react';
import { loadFunctionsFromAllProjects } from '../data/FunctionsData';

export function useBoardInformationsData(currentBoard) {
  const allFunctions = loadFunctionsFromAllProjects();
  const defaultInternalContacts = allFunctions.map((func, idx) => ({
    id: idx + 1,
    title: func,
  }));

  const [links, setLinks] = useState([]);
  const [eotpLines, setEotpLines] = useState([]);
  const [internalContacts, setInternalContacts] = useState(defaultInternalContacts);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [newInternalTitle, setNewInternalTitle] = useState('');
  const [externalContacts, setExternalContacts] = useState([]);
  const [boardGMR, setBoardGMR] = useState('');
  const [boardPriority, setBoardPriority] = useState('');
  const [boardZone, setBoardZone] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  const currentBoardIdRef = useRef(null);

  const updateExternalContact = useCallback((idx, field, value) => {
    setExternalContacts(prev =>
      prev.map((contact, i) => (i === idx ? { ...contact, [field]: value } : contact))
    );
  }, []);

  const saveAllProjectData = useCallback(() => {
    const boardId = currentBoardIdRef.current || currentBoard?.id;
    if (!boardId) return;
    localStorage.setItem(`board-${boardId}-links`, JSON.stringify(links));
    localStorage.setItem(`board-${boardId}-eotp`, JSON.stringify(eotpLines));
    localStorage.setItem(`board-${boardId}-internalContacts`, JSON.stringify(internalContacts));
    localStorage.setItem(`board-${boardId}-externalContacts`, JSON.stringify(externalContacts));
    localStorage.setItem(`board-${boardId}-gmr`, boardGMR);
    localStorage.setItem(`board-${boardId}-priority`, boardPriority);
    localStorage.setItem(`board-${boardId}-zone`, boardZone);
  }, [currentBoard?.id, links, eotpLines, internalContacts, externalContacts, boardGMR, boardPriority, boardZone]);

  useEffect(() => {
    if (currentBoard) {
      setIsInitialized(false);
      currentBoardIdRef.current = currentBoard.id;
      setLinks(JSON.parse(localStorage.getItem(`board-${currentBoard.id}-links`) || '[]'));
      setEotpLines(JSON.parse(localStorage.getItem(`board-${currentBoard.id}-eotp`) || '[]'));
      const savedInternal = localStorage.getItem(`board-${currentBoard.id}-internalContacts`);
      if (savedInternal) {
        const parsed = JSON.parse(savedInternal);
        setInternalContacts(parsed.length > 0 ? parsed : defaultInternalContacts);
      } else {
        setInternalContacts(defaultInternalContacts);
      }
      setExternalContacts(
        JSON.parse(localStorage.getItem(`board-${currentBoard.id}-externalContacts`) || '[]')
      );
      setBoardGMR(localStorage.getItem(`board-${currentBoard.id}-gmr`) || '');
      setBoardPriority(localStorage.getItem(`board-${currentBoard.id}-priority`) || '');
      setBoardZone(localStorage.getItem(`board-${currentBoard.id}-zone`) || '');
      setIsInitialized(true);
    }
  }, [currentBoard?.id]);

  useEffect(() => {
    if (isInitialized) {
      const boardId = currentBoardIdRef.current;
      if (boardId) localStorage.setItem(`board-${boardId}-links`, JSON.stringify(links));
    }
  }, [links, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      const boardId = currentBoardIdRef.current;
      if (boardId) localStorage.setItem(`board-${boardId}-eotp`, JSON.stringify(eotpLines));
    }
  }, [eotpLines, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      const boardId = currentBoardIdRef.current;
      if (boardId)
        localStorage.setItem(`board-${boardId}-internalContacts`, JSON.stringify(internalContacts));
    }
  }, [internalContacts, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      const boardId = currentBoardIdRef.current;
      if (boardId) {
        localStorage.setItem(
          `board-${boardId}-externalContacts`,
          JSON.stringify(externalContacts)
        );
        const allCurrent = JSON.parse(localStorage.getItem('c-projets_entreprises') || '[]');
        const newContacts = externalContacts.filter(ec => ec.entreprise && ec.nom);
        const merged = [...allCurrent];
        newContacts.forEach(newC => {
          const key = `${(newC.entreprise || '').toLowerCase().trim()}-${(newC.nom || '').toLowerCase().trim()}-${(newC.prenom || '').toLowerCase().trim()}`;
          const exists = merged.find(
            m =>
              `${(m.entreprise || '').toLowerCase().trim()}-${(m.nom || '').toLowerCase().trim()}-${(m.prenom || '').toLowerCase().trim()}` ===
              key
          );
          if (!exists) merged.push(newC);
        });
        localStorage.setItem('c-projets_entreprises', JSON.stringify(merged));
      }
    }
  }, [externalContacts, isInitialized]);

  useEffect(() => {
    const handleBeforeUnload = () => saveAllProjectData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveAllProjectData();
    };
    const handlePageHide = () => {
      if (isInitialized) saveAllProjectData();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveAllProjectData, isInitialized]);

  return {
    allFunctions,
    links,
    setLinks,
    eotpLines,
    setEotpLines,
    internalContacts,
    setInternalContacts,
    showAddInternal,
    setShowAddInternal,
    newInternalTitle,
    setNewInternalTitle,
    externalContacts,
    setExternalContacts,
    boardGMR,
    setBoardGMR,
    boardPriority,
    setBoardPriority,
    boardZone,
    setBoardZone,
    isInitialized,
    updateExternalContact,
    saveAllProjectData,
  };
}
