export const libraryTemplates = [
  {
    id: 1,
    title: 'Jalons SIEPR',
    type: 'card',
    tags: 'jalons',
    duration: 10955,
    content_json: JSON.stringify({
      card: {
        title: 'Jalons SIEPR',
        description: 'Jalons SIEPR',
        priority: 'normal',
        duration_days: 10955,
      },
      categories: [
        { title: 'Jalons projet', description: '', priority: 'normal' },
        { title: 'Jalons OP poste', description: '', priority: 'normal' },
        { title: 'Jalons OP LA', description: '', priority: 'normal' },
        { title: 'Jalons OP LS', description: '', priority: 'normal' },
      ],
    }),
  },
  {
    id: 2,
    title: 'Processus DO',
    type: 'card',
    tags: 'processus,decisionnel',
    duration: 35,
    content_json: JSON.stringify({
      card: {
        title: 'Processus DO',
        description: 'Processus de décision obras',
        priority: 'normal',
        duration_days: 35,
      },
      categories: [
        { title: 'DO - Validation et signature de la DO', description: '', priority: 'normal' },
        { title: 'Nomination du manager de projet', description: '', priority: 'normal' },
      ],
    }),
  },
  {
    id: 3,
    title: 'Processus DCT',
    type: 'card',
    tags: 'processus,decisionnel',
    duration: 1022,
    content_json: JSON.stringify({
      card: {
        title: 'Processus DCT',
        description: 'Processus DCT',
        priority: 'normal',
        duration_days: 1022,
      },
      categories: [
        {
          title: 'Réalisation CTF',
          description: '',
          priority: 'normal',
          duration_days: 700,
          subcategories: [
            {
              title: 'Mise à jour du CCF',
              description: '',
              priority: 'normal',
              duration_days: 140,
            },
            { title: 'CTF partie Postes', description: '', priority: 'normal', duration_days: 280 },
            {
              title: 'CTF partie BT / telecom Postes et encadrants',
              description: '',
              priority: 'normal',
              duration_days: 280,
            },
            {
              title: 'CTF partie Liaisons aériennes',
              description: '',
              priority: 'normal',
              duration_days: 280,
            },
            {
              title: 'CTF partie Liaisons souterraines',
              description: '',
              priority: 'normal',
              duration_days: 280,
            },
            {
              title: 'CTF partie Concertation/autorisation',
              description: '',
              priority: 'normal',
              duration_days: 280,
            },
            {
              title: 'Finalisation CTF de synthèse',
              description: '',
              priority: 'normal',
              duration_days: 140,
            },
          ],
        },
        {
          title: 'Projet < 10 M€ (Facultative)',
          description: '',
          priority: 'normal',
          duration_days: 35,
        },
        { title: 'Projet < 20 M€', description: '', priority: 'normal', duration_days: 252 },
        { title: 'Projet > 20 M€', description: '', priority: 'normal', duration_days: 322 },
        { title: 'DCT - Validation et signature de la DCT', description: '', priority: 'normal' },
      ],
    }),
  },
  {
    id: 4,
    title: 'Processus DI',
    type: 'card',
    tags: 'processus,decisionnel',
    duration: 1414,
    content_json: JSON.stringify({
      card: {
        title: 'Processus DI',
        description: 'Processus DI',
        priority: 'normal',
        duration_days: 1414,
      },
      categories: [
        { title: 'APD', description: '', priority: 'normal', duration_days: 175 },
        { title: 'Projet < 10 M€', description: '', priority: 'normal', duration_days: 105 },
        { title: 'Projet < 20 M€', description: '', priority: 'normal', duration_days: 392 },
        { title: 'Projet > 20 M€', description: '', priority: 'normal', duration_days: 462 },
        { title: 'Projet > 30 M€', description: '', priority: 'normal', duration_days: 462 },
        { title: 'Projet > 50 M€', description: '', priority: 'normal', duration_days: 924 },
        { title: 'DI - Validation et signature de la DI', description: '', priority: 'normal' },
      ],
    }),
  },
  {
    id: 5,
    title: 'Rédaction NOS',
    type: 'card',
    tags: 'procedures,etudes',
    duration: 280,
    content_json: JSON.stringify({
      card: {
        title: 'Rédaction Note Organisation Stratégique',
        description: '',
        priority: 'normal',
        duration_days: 280,
      },
    }),
  },
  {
    id: 6,
    title: 'Concertation FERRACCI',
    type: 'card',
    tags: 'procedures,concertation',
    duration: 1309,
    content_json: JSON.stringify({
      card: {
        title: 'Concertation FERRACCI',
        description: '',
        priority: 'normal',
        duration_days: 1309,
      },
      categories: [
        {
          title: 'Projet simple (pas de DUP, LA<1km, LS<3km)',
          description: '',
          priority: 'normal',
          duration_days: 455,
        },
        { title: 'Projet intermédiaire', description: '', priority: 'normal', duration_days: 805 },
        {
          title: 'Projet important (400 kV, offshore, intercos)',
          description: '',
          priority: 'normal',
          duration_days: 1309,
        },
      ],
    }),
  },
  {
    id: 7,
    title: 'DUP et AE',
    type: 'card',
    tags: 'procedures,dup',
    duration: 3164,
    content_json: JSON.stringify({
      card: {
        title: 'DUP et AE',
        description: 'Déclaration Utilité Publique et Autorisation Environnementale',
        priority: 'normal',
        duration_days: 3164,
      },
      categories: [
        { title: 'Examen au cas par cas', description: '', priority: 'normal', duration_days: 840 },
        {
          title: 'DUP et AE synchronisé sans Etude Impact',
          description: '',
          priority: 'normal',
          duration_days: 588,
        },
        {
          title: 'DUP et AE synchronisé avec Etude Impact',
          description: '',
          priority: 'normal',
          duration_days: 2429,
        },
        {
          title: 'DUP puis AE désynchronisé sans Etude Impact',
          description: '',
          priority: 'normal',
          duration_days: 588,
        },
        {
          title: 'DUP puis AE désynchronisé avec Etude Impact',
          description: '',
          priority: 'normal',
          duration_days: 3164,
        },
        {
          title: 'AE puis DUP désynchronisé sans Etude Impact',
          description: '',
          priority: 'normal',
          duration_days: 693,
        },
        {
          title: 'AE puis DUP désynchronisé avec Etude Impact',
          description: '',
          priority: 'normal',
          duration_days: 3164,
        },
        { title: 'Obtention DUP', description: '', priority: 'normal' },
        { title: 'Obtention AE', description: '', priority: 'normal' },
      ],
    }),
  },
  {
    id: 8,
    title: 'Conventionnement LS',
    type: 'card',
    tags: 'procedures,ls',
    duration: 1169,
    content_json: JSON.stringify({
      card: {
        title: 'Conventionnement LS',
        description: '',
        priority: 'normal',
        duration_days: 1169,
      },
    }),
  },
  {
    id: 9,
    title: 'Conventionnement LA',
    type: 'card',
    tags: 'procedures,la',
    duration: 1540,
    content_json: JSON.stringify({
      card: {
        title: 'Conventionnement LA',
        description: '',
        priority: 'normal',
        duration_days: 1540,
      },
    }),
  },
  {
    id: 10,
    title: 'Mise en servitude',
    type: 'card',
    tags: 'risques,servitude',
    duration: 504,
    content_json: JSON.stringify({
      card: {
        title: 'RISQUE - mise en servitude',
        description: '',
        priority: 'normal',
        duration_days: 504,
      },
    }),
  },
  {
    id: 11,
    title: 'APO LA',
    type: 'card',
    tags: 'procedures,la,apo',
    duration: 665,
    content_json: JSON.stringify({
      card: {
        title: 'APO (Autorisation Projet Ouvrage) LA',
        description: '',
        priority: 'normal',
        duration_days: 665,
      },
    }),
  },
  {
    id: 12,
    title: 'Consultation des maire',
    type: 'card',
    tags: 'procedures',
    duration: 630,
    content_json: JSON.stringify({
      card: {
        title: 'Consultation des maire',
        description: 'Consultation des maire et gestionnaires',
        priority: 'normal',
        duration_days: 630,
      },
    }),
  },
  {
    id: 13,
    title: 'Permis de Construire',
    type: 'card',
    tags: 'procedures,poste',
    duration: 735,
    content_json: JSON.stringify({
      card: {
        title: 'PC (Permis de Construire) Postes',
        description: '',
        priority: 'normal',
        duration_days: 735,
      },
    }),
  },
  {
    id: 14,
    title: 'Études préliminaires',
    type: 'card',
    tags: 'etudes',
    duration: 280,
    content_json: JSON.stringify({
      card: {
        title: 'Études préliminaires',
        description: '',
        priority: 'normal',
        duration_days: 280,
      },
    }),
  },
  {
    id: 15,
    title: 'Études détaillées',
    type: 'card',
    tags: 'etudes',
    duration: 3003,
    content_json: JSON.stringify({
      card: {
        title: 'Études détaillées',
        description: '',
        priority: 'normal',
        duration_days: 3003,
      },
    }),
  },
];

export const thematicTags = [
  { id: 1, name: 'jalons', label: 'Jalons', color: '#3B82F6' },
  { id: 2, name: 'processus', label: 'Processus Décisionnel', color: '#8B5CF6' },
  { id: 3, name: 'decisionnel', label: 'Décisionnel', color: '#8B5CF6' },
  { id: 4, name: 'procedures', label: 'Procédures Administratives', color: '#F59E0B' },
  { id: 5, name: 'concertation', label: 'Concertation', color: '#F59E0B' },
  { id: 6, name: 'dup', label: 'DUP', color: '#F59E0B' },
  { id: 7, name: 'etudes', label: 'Études', color: '#10B981' },
  { id: 8, name: 'achats', label: 'Achats', color: '#EC4899' },
  { id: 9, name: 'travaux', label: 'Travaux', color: '#EF4444' },
  { id: 10, name: 'risques', label: 'Risques', color: '#F97316' },
  { id: 11, name: 'poste', label: 'Poste', color: '#6366F1' },
  { id: 12, name: 'la', label: 'Ligne Aérienne', color: '#6366F1' },
  { id: 13, name: 'ls', label: 'Ligne Souterraine', color: '#6366F1' },
  { id: 14, name: 'bt', label: 'BT', color: '#6366F1' },
  { id: 15, name: 'apo', label: 'APO', color: '#6366F1' },
  { id: 16, name: 'servitude', label: 'Servitude', color: '#F97316' },
];

export default libraryTemplates;
