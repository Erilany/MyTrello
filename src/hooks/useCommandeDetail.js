import { useState, useCallback } from 'react';
import { GROUPES_MARCHANDISES, CATEGORY_KEYS } from '../data/GroupesMarchandises';

const INITIAL_COMMANDE_DETAIL = {
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
    affaire: '',
    informations: '',
  },
  autresLignes: [],
  groupesMarchandises: {},
  otpIdentiqueChecked: false,
  dateReceptionUniqueChecked: false,
};

function initializeGroupesMarchandises() {
  const gm = {};
  CATEGORY_KEYS.forEach(key => {
    gm[key] = GROUPES_MARCHANDISES[key].items.map(item => ({
      label: item,
      checked: false,
    }));
  });
  return gm;
}

export function useCommandeDetail() {
  const [commandeDetail, setCommandeDetail] = useState(INITIAL_COMMANDE_DETAIL);

  const loadFromCommande = useCallback(cmd => {
    if (cmd.detail) {
      setCommandeDetail({
        ...cmd.detail,
        otpIdentiqueChecked: cmd.detail.otpIdentiqueChecked || false,
        dateReceptionUniqueChecked: cmd.detail.dateReceptionUniqueChecked || false,
      });
    } else {
      setCommandeDetail({
        affectation: {
          numeroAffaire: cmd.donnees?.numero || '',
          dateReception: cmd.donnees?.dateReception || '',
          dateLimite: cmd.donnees?.dateLimite || '',
          interlocuteur: cmd.donnees?.interlocuteur || '',
          designation: cmd.donnees?.designation || '',
          localisation: cmd.donnees?.localisation || '',
          maitreOuvrage: cmd.donnees?.maitreOuvrage || '',
          typeIntervention: cmd.donnees?.typeIntervention || '',
          descriptionSommaire: cmd.donnees?.descriptionSommaire || '',
          surfaceVolume: cmd.donnees?.surfaceVolume || '',
        },
        commande: {
          numeroCommande: cmd.donnees?.numero || '',
          dateCommande: cmd.donnees?.dateCommande || '',
          redacteur: cmd.donnees?.redacteur || '',
          signataireFinal: cmd.donnees?.signataireFinal || '',
          marcheCadre: cmd.donnees?.marcheCadre || '',
          affaire: cmd.donnees?.affaire || '',
          informations: '',
        },
        autresLignes: cmd.donnees?.autresLignes || [],
        groupesMarchandises: initializeGroupesMarchandises(),
        otpIdentiqueChecked: false,
        dateReceptionUniqueChecked: false,
      });
    }
  }, []);

  const syncFromLigne010 = useCallback(field => {
    setCommandeDetail(prev => {
      const ligne010 = prev.autresLignes?.find(l => l.numero === '010');
      if (!ligne010) return prev;
      const newLignes = prev.autresLignes?.map(ligne => {
        if (ligne.numero === '010') return ligne;
        return { ...ligne, [field]: ligne010?.[field] || '' };
      });
      return { ...prev, autresLignes: newLignes };
    });
  }, []);

  const handleUpdateAffectation = useCallback((field, value) => {
    setCommandeDetail(prev => ({
      ...prev,
      affectation: { ...prev.affectation, [field]: value },
    }));
  }, []);

  const handleUpdateCommande = useCallback((field, value) => {
    setCommandeDetail(prev => ({
      ...prev,
      commande: { ...prev.commande, [field]: value },
    }));
  }, []);

  const handleUpdateAutresLigne = useCallback((index, field, value) => {
    setCommandeDetail(prev => {
      const newLignes = [...(prev.autresLignes || [])];
      if (field === 'montant') {
        newLignes[index] = { ...newLignes[index], [field]: value };
      } else if (field === 'quantite' || field === 'coutUnitaire') {
        const qteNum =
          field === 'quantite'
            ? value === '' ? 0 : parseFloat(value) || 0
            : parseFloat(newLignes[index].quantite) || 0;
        const coutNum =
          field === 'coutUnitaire'
            ? value === '' ? 0 : parseFloat(value) || 0
            : parseFloat(newLignes[index].coutUnitaire) || 0;
        newLignes[index] = {
          ...newLignes[index],
          quantite: field === 'quantite' ? (value === '' ? 0 : parseFloat(value) || 0) : qteNum,
          coutUnitaire: field === 'coutUnitaire' ? (value === '' ? 0 : parseFloat(value) || 0) : coutNum,
          montant: qteNum * coutNum,
        };
      } else {
        newLignes[index] = { ...newLignes[index], [field]: value };
      }
      return { ...prev, autresLignes: newLignes };
    });
  }, []);

  const handleAddAutresLigne = useCallback(selectedAvenant => {
    setCommandeDetail(prev => {
      const currentLignes = prev.autresLignes || [];
      const nextNum = String((currentLignes.length + 1) * 10).padStart(3, '0');
      const avenantPrefix = selectedAvenant ? `AV${selectedAvenant.numero} ` : '';
      const inheritedEotpId =
        prev.otpIdentiqueChecked && currentLignes.length > 0 ? currentLignes[0].eotpId : '';
      const inheritedDateReception =
        prev.dateReceptionUniqueChecked && currentLignes.length > 0
          ? currentLignes[0].dateReception
          : '';
      return {
        ...prev,
        autresLignes: [
          ...currentLignes,
          {
            id: Date.now(),
            numero: nextNum,
            designation: avenantPrefix || '',
            eotpId: inheritedEotpId,
            dateReception: inheritedDateReception,
            quantite: '',
            coutUnitaire: '',
            montant: 0,
            paiements: [],
          },
        ],
      };
    });
  }, []);

  const handleDeleteAutresLigne = useCallback(index => {
    setCommandeDetail(prev => {
      const newLignes = (prev.autresLignes || []).filter((_, i) => i !== index);
      return {
        ...prev,
        autresLignes: newLignes.map((l, i) => ({
          ...l,
          numero: String((i + 1) * 10).padStart(3, '0'),
        })),
      };
    });
  }, []);

  const getTotalMontantHT = useCallback(() => {
    return (commandeDetail.autresLignes || []).reduce(
      (sum, ligne) => sum + (parseFloat(ligne.montant) || 0),
      0
    );
  }, [commandeDetail.autresLignes]);

  const handleToggleMarchandise = useCallback((categoryKey, itemLabel) => {
    setCommandeDetail(prev => ({
      ...prev,
      groupesMarchandises: {
        ...prev.groupesMarchandises,
        [categoryKey]: prev.groupesMarchandises[categoryKey].map(item =>
          item.label === itemLabel ? { ...item, checked: !item.checked } : item
        ),
      },
    }));
  }, []);

  const handleUpdateMarchandiseLibre = useCallback((categoryKey, value) => {
    setCommandeDetail(prev => ({
      ...prev,
      groupesMarchandises: {
        ...prev.groupesMarchandises,
        [categoryKey]: prev.groupesMarchandises[categoryKey].map(item =>
          item.label === 'AUTRES (champ libre)' ? { ...item, libreValue: value } : item
        ),
      },
    }));
  }, []);

  const handleSelectAllInCategory = useCallback(categoryKey => {
    setCommandeDetail(prev => {
      const currentItems = prev.groupesMarchandises?.[categoryKey] || [];
      const allChecked = currentItems.every(i => i.checked);
      return {
        ...prev,
        groupesMarchandises: {
          ...prev.groupesMarchandises,
          [categoryKey]: (prev.groupesMarchandises?.[categoryKey] || []).map(item => ({
            ...item,
            checked: !allChecked,
          })),
        },
      };
    });
  }, []);

  const getCategoryCount = useCallback(categoryKey => {
    const items = commandeDetail.groupesMarchandises?.[categoryKey] || [];
    const checked = items.filter(i => i.checked).length;
    const total = items.filter(i => i.label !== 'AUTRES (champ libre)').length;
    return { checked, total };
  }, [commandeDetail.groupesMarchandises]);

  return {
    commandeDetail,
    setCommandeDetail,
    loadFromCommande,
    initializeGroupesMarchandises,
    syncFromLigne010,
    handleUpdateAffectation,
    handleUpdateCommande,
    handleUpdateAutresLigne,
    handleAddAutresLigne,
    handleDeleteAutresLigne,
    getTotalMontantHT,
    handleToggleMarchandise,
    handleUpdateMarchandiseLibre,
    handleSelectAllInCategory,
    getCategoryCount,
  };
}
