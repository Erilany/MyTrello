import { useState } from 'react';
import {
  REQUIRED_FIELDS,
  readFileAsText,
  parseCSVLine,
} from '../components/Settings/contractsUtils';

export function useCsvContractImport(contracts, setContracts, saveContractData) {
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvPreviewData, setCsvPreviewData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [pendingFileName, setPendingFileName] = useState('');
  const [csvContent, setCsvContent] = useState('');

  const handleFileSelect = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const inputRef = event.target;

    try {
      const content = await readFileAsText(file);

      if (!content || typeof content !== 'string') {
        alert(
          "Impossible de lire le contenu du fichier. Vérifiez que le fichier n'est pas corrompu."
        );
        inputRef.value = '';
        return;
      }

      const lines = content.split(/\r?\n/).filter(line => line.trim() && line.includes(';'));

      if (lines.length < 2) {
        alert("Le fichier CSV semble vide ou ne contient que l'en-tête");
        inputRef.value = '';
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const previewData = lines.slice(1, 6).map(line => parseCSVLine(line));

      setCsvHeaders(headers);
      setCsvPreviewData(previewData);
      setPendingFileName(file.name);
      setCsvContent(content);

      const initialMapping = {};
      REQUIRED_FIELDS.forEach(field => {
        const matchIdx = headers.findIndex(
          h =>
            h.toLowerCase().includes(field.label.toLowerCase()) ||
            h
              .toLowerCase()
              .replace(/[àâäéèêëïîôùûü]/g, 'a')
              .includes(field.key.toLowerCase())
        );
        if (matchIdx >= 0) {
          initialMapping[field.key] = matchIdx;
        }
      });
      setColumnMapping(initialMapping);

      setShowMappingModal(true);
      inputRef.value = '';
    } catch (error) {
      console.error('Erreur lecture fichier:', error);
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      alert('Erreur lors de la lecture du fichier: ' + errorMessage);
      inputRef.value = '';
    }
  };

  const handleImportWithMapping = () => {
    const requiredMapped = REQUIRED_FIELDS.filter(f => f.required).every(
      f => columnMapping[f.key] !== undefined
    );

    if (!requiredMapped) {
      alert(
        "Veuillez mapper toutes les colonnes requises (N° de Marché, Acheteur, Entité d'Achat, Type de marché, Fournisseur, Début de validité, Fin de validité, Segment d'achat)"
      );
      return;
    }

    if (!csvContent) {
      alert(
        "Le contenu du fichier CSV n'est plus disponible. Veuillez sélectionner le fichier à nouveau."
      );
      return;
    }

    try {
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim() && line.includes(';'));
      const importedContracts = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);

        const contract = {
          id: Date.now() + i,
          numeroMarche:
            columnMapping.numeroMarche !== undefined
              ? values[columnMapping.numeroMarche] || ''
              : '',
          acheteur:
            columnMapping.acheteur !== undefined ? values[columnMapping.acheteur] || '' : '',
          entiteAchat:
            columnMapping.entiteAchat !== undefined ? values[columnMapping.entiteAchat] || '' : '',
          typeMarche:
            columnMapping.typeMarche !== undefined ? values[columnMapping.typeMarche] || '' : '',
          fournisseur:
            columnMapping.fournisseur !== undefined ? values[columnMapping.fournisseur] || '' : '',
          dateDebut:
            columnMapping.dateDebut !== undefined ? values[columnMapping.dateDebut] || '' : '',
          dateFin: columnMapping.dateFin !== undefined ? values[columnMapping.dateFin] || '' : '',
          segment: columnMapping.segment !== undefined ? values[columnMapping.segment] || '' : '',
          lienDOKI:
            columnMapping.lienDOKI !== undefined ? values[columnMapping.lienDOKI] || '' : '',
        };

        if (contract.numeroMarche || contract.fournisseur) {
          importedContracts.push(contract);
        }
      }

      if (importedContracts.length === 0) {
        alert('Aucune donnée valide trouvée dans le fichier CSV');
        return;
      }

      const updatedContracts = [...contracts, ...importedContracts];
      setContracts(updatedContracts);
      saveContractData(updatedContracts);
      setShowMappingModal(false);
      alert(`${importedContracts.length} contrat(s) importé(s) avec succès`);
    } catch (error) {
      console.error('Erreur import:', error);
      alert("Erreur lors de l'import: " + error.message);
    }
  };

  return {
    showMappingModal,
    setShowMappingModal,
    csvHeaders,
    csvPreviewData,
    columnMapping,
    setColumnMapping,
    pendingFileName,
    handleFileSelect,
    handleImportWithMapping,
  };
}
