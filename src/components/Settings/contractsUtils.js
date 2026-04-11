export const CONTRACTS_STORAGE_KEY = 'c-projets_contracts';

export const REQUIRED_FIELDS = [
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

export const readFileAsText = file => {
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

export const parseCSVLine = line => {
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
