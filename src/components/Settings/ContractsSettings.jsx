import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  FileText,
  X,
  Columns,
  Check,
  AlertCircle,
} from 'lucide-react';

const STORAGE_KEY = 'mytrello_contracts';

const REQUIRED_FIELDS = [
  { key: 'numeroMarche', label: 'N° de Marché', required: true },
  { key: 'acheteur', label: 'Acheteur', required: true },
  { key: 'entiteAchat', label: "Entité d'Achat", required: true },
  { key: 'typeMarche', label: 'Type de marché', required: true },
  { key: 'fournisseur', label: 'Fournisseur', required: true },
  { key: 'dateDebut', label: 'Début de validité', required: true },
  { key: 'dateFin', label: 'Fin de validité', required: true },
  { key: 'segment', label: "Segment d'achat", required: true },
  { key: 'lienDOKI', label: 'Lien Contrat(s) DOKI', required: false },
];

const readFileAsText = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const tryReadAsText = encoding => {
      return new Promise(resolve => {
        const r = new FileReader();
        r.onload = e => resolve({ content: e.target.result, encoding });
        r.onerror = () => resolve(null);
        r.readAsText(file, encoding);
      });
    };

    reader.onload = async e => {
      try {
        let content = e.target.result;

        if (content && typeof content === 'string' && content.includes('�')) {
          const utf8Result = await tryReadAsText('utf-8');
          if (utf8Result && !utf8Result.content.includes('�')) {
            content = utf8Result.content;
          } else {
            const winResult = await tryReadAsText('windows-1252');
            if (winResult) {
              content = winResult.content;
            }
          }
        }

        resolve(content);
      } catch (err) {
        reject(new Error('Erreur lors du décodage du fichier: ' + err.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Impossible de lire le fichier. Vérifiez les permissions.'));
    };

    reader.onabort = () => {
      reject(new Error('Lecture du fichier annulée'));
    };

    reader.readAsText(file, 'windows-1252');
  });
};

const parseCSVLine = line => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
};

export default function ContractsSettings() {
  const [contracts, setContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('numeroMarche');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);

  const [showMappingModal, setShowMappingModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvPreviewData, setCsvPreviewData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [pendingFileName, setPendingFileName] = useState('');
  const [csvContent, setCsvContent] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setContracts(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const saveToStorage = data => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

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
    const mappedCount = Object.keys(columnMapping).filter(
      k => columnMapping[k] !== undefined
    ).length;
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
      saveToStorage(updatedContracts);
      setShowMappingModal(false);
      alert(`${importedContracts.length} contrat(s) importé(s) avec succès`);
    } catch (error) {
      console.error('Erreur import:', error);
      alert("Erreur lors de l'import: " + error.message);
    }
  };

  const handleDelete = id => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) return;
    const updated = contracts.filter(c => c.id !== id);
    setContracts(updated);
    saveToStorage(updated);
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Voulez-vous vraiment supprimer tous les contrats ?')) return;
    setContracts([]);
    saveToStorage([]);
  };

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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (isLoading) {
    return <div className="p-4 text-muted">Chargement...</div>;
  }

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-accent" />
            <h2 className="text-xl font-bold text-primary">Contrats</h2>
            <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
              {contracts.length} contrat(s)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-accent text-white text-sm rounded cursor-pointer hover:bg-accent/80">
              <Upload size={14} />
              <span>Importer CSV</span>
              <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </label>
            {contracts.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                <Trash2 size={14} />
                <span>Tout supprimer</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 p-4 bg-card rounded-lg border border-std">
          <div className="flex items-center gap-2 flex-1 min-w-[250px]">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Rechercher (n° marché, acheteur, fournisseur)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 bg-input border border-std rounded text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-muted hover:text-primary">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-std overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            <table className="w-full border-collapse">
              <thead className="bg-card-hover sticky top-0 z-10">
                <tr>
                  <th
                    onClick={() => handleSort('numeroMarche')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[120px]"
                  >
                    <div className="flex items-center gap-1">
                      N° Marché <SortIcon field="numeroMarche" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('acheteur')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[100px]"
                  >
                    <div className="flex items-center gap-1">
                      Acheteur <SortIcon field="acheteur" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('entiteAchat')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[120px]"
                  >
                    <div className="flex items-center gap-1">
                      Entité Achat <SortIcon field="entiteAchat" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('typeMarche')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[100px]"
                  >
                    <div className="flex items-center gap-1">
                      Type Marché <SortIcon field="typeMarche" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('fournisseur')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[150px]"
                  >
                    <div className="flex items-center gap-1">
                      Fournisseur <SortIcon field="fournisseur" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dateDebut')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[90px]"
                  >
                    <div className="flex items-center gap-1">
                      Début <SortIcon field="dateDebut" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dateFin')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[90px]"
                  >
                    <div className="flex items-center gap-1">
                      Fin <SortIcon field="dateFin" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('segment')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[100px]"
                  >
                    <div className="flex items-center gap-1">
                      Segment <SortIcon field="segment" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('lienDOKI')}
                    className="px-2 py-2 text-left text-xs font-semibold text-secondary cursor-pointer hover:bg-std whitespace-nowrap border-b border-std w-[100px]"
                  >
                    <div className="flex items-center gap-1">
                      Lien DOKI <SortIcon field="lienDOKI" />
                    </div>
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-secondary border-b border-std w-[48px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-std">
                {filteredAndSortedContracts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-muted">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Aucun contrat</p>
                      <p className="text-sm">Importez un fichier CSV pour commencer</p>
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
                      <td className="px-2 py-2 text-right border-std">
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="p-1 text-muted hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted mt-4">
          Importez votre fichier CSV depuis Paramètres → Contrats
        </p>
      </div>

      {showMappingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-std max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-std flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Columns size={20} className="text-accent" />
                <h3 className="text-lg font-bold text-primary">Mapping des colonnes CSV</h3>
              </div>
              <button
                onClick={() => setShowMappingModal(false)}
                className="text-muted hover:text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-std bg-accent-soft">
              <p className="text-sm text-secondary">
                <span className="font-medium">Fichier:</span> {pendingFileName}
              </p>
              <p className="text-xs text-muted mt-1">
                Associez chaque champ requis à la colonne correspondante dans votre fichier CSV.
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <AlertCircle size={14} className="text-orange-500" />
                  Colonnes disponibles dans le fichier CSV
                </h4>
                <div className="flex flex-wrap gap-2 p-3 bg-input rounded border border-std">
                  {csvHeaders.map((header, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-card text-xs text-secondary rounded border border-std"
                    >
                      {idx}: {header}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-card-hover">
                      <th className="px-3 py-2 text-left font-semibold text-secondary border border-std w-[180px]">
                        Champ D-ProjeT
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-secondary border border-std">
                        Colonne CSV
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-secondary border border-std w-[80px]">
                        Obligatoire
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-secondary border border-std">
                        Aperçu (première ligne)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {REQUIRED_FIELDS.map(field => (
                      <tr key={field.key} className="hover:bg-card-hover">
                        <td className="px-3 py-2 border border-std">
                          <span
                            className={`font-medium ${field.required ? 'text-primary' : 'text-secondary'}`}
                          >
                            {field.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 border border-std">
                          <select
                            value={columnMapping[field.key] ?? ''}
                            onChange={e =>
                              setColumnMapping(prev => ({
                                ...prev,
                                [field.key]:
                                  e.target.value === '' ? undefined : parseInt(e.target.value),
                              }))
                            }
                            className={`w-full px-2 py-1 text-sm bg-input border rounded ${
                              columnMapping[field.key] !== undefined
                                ? 'border-accent'
                                : 'border-std'
                            }`}
                          >
                            <option value="">-- Sélectionner une colonne --</option>
                            {csvHeaders.map((header, idx) => (
                              <option key={idx} value={idx}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center border border-std">
                          {field.required ? (
                            columnMapping[field.key] !== undefined ? (
                              <Check size={16} className="inline text-green-500" />
                            ) : (
                              <span className="text-red-500 font-bold">*</span>
                            )
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 border border-std text-secondary">
                          {columnMapping[field.key] !== undefined && csvPreviewData[0] ? (
                            csvPreviewData[0][columnMapping[field.key]] || (
                              <span className="text-muted italic">vide</span>
                            )
                          ) : (
                            <span className="text-muted italic">Non défini</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {csvPreviewData.length > 1 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-primary mb-2">
                    Aperçu des données (5 premières lignes)
                  </h4>
                  <div className="overflow-x-auto border border-std rounded">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-card-hover">
                          {REQUIRED_FIELDS.map(field => (
                            <th
                              key={field.key}
                              className="px-2 py-1 text-left font-semibold text-secondary border-b border-std whitespace-nowrap"
                            >
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreviewData.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-card-hover">
                            {REQUIRED_FIELDS.map(field => (
                              <td
                                key={field.key}
                                className="px-2 py-1 border-b border-std text-secondary max-w-[150px] truncate"
                              >
                                {columnMapping[field.key] !== undefined
                                  ? row[columnMapping[field.key]] || '-'
                                  : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-std flex items-center justify-end gap-3">
              <button
                onClick={() => setShowMappingModal(false)}
                className="px-4 py-2 text-sm text-secondary hover:text-primary"
              >
                Annuler
              </button>
              <button
                onClick={handleImportWithMapping}
                className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent/80 flex items-center gap-2"
              >
                <Check size={16} />
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
