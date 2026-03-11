export const libraryTemplates = [
  {
    id: 1,
    title: 'Jalons SIEPR',
    type: 'card',
    tags: 'projet',
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
    title: 'Processus décisionnels',
    type: 'card',
    tags: 'projet,processus',
    duration: 5474,
    content_json: JSON.stringify({
      card: {
        title: 'Processus décisionnels',
        description: 'Processus décisionnels',
        priority: 'normal',
        duration_days: 5474,
      },
      categories: [
        { title: 'Processus DO', description: '', priority: 'normal', duration_days: 35 },
        { title: 'Processus DCT', description: '', priority: 'normal', duration_days: 1022 },
        { title: 'Processus DI', description: '', priority: 'normal', duration_days: 1414 },
      ],
    }),
  },
  {
    id: 3,
    title: 'Procédures administratives',
    type: 'card',
    tags: 'procedures',
    duration: 5999,
    content_json: JSON.stringify({
      card: {
        title: 'Procédures administratives',
        description: 'Procédures administratives',
        priority: 'normal',
        duration_days: 5999,
      },
      categories: [
        {
          title: 'Rédaction Note Organisation Stratégique',
          description: '',
          priority: 'normal',
          duration_days: 280,
        },
        {
          title: 'Concertation FERRACCI',
          description: '',
          priority: 'normal',
          duration_days: 1309,
        },
        { title: 'DUP et AE', description: '', priority: 'normal', duration_days: 3164 },
        { title: 'Conventionnement LS', description: '', priority: 'normal', duration_days: 1169 },
        { title: 'Conventionnement LA', description: '', priority: 'normal', duration_days: 1540 },
      ],
    }),
  },
  {
    id: 4,
    title: 'Études',
    type: 'card',
    tags: 'etudes',
    duration: 4025,
    content_json: JSON.stringify({
      card: { title: 'Études', description: 'Études', priority: 'normal', duration_days: 4025 },
      categories: [
        { title: 'Études préliminaires', description: '', priority: 'normal', duration_days: 280 },
        { title: 'Études détaillées', description: '', priority: 'normal', duration_days: 3003 },
      ],
    }),
  },
  {
    id: 5,
    title: 'Travaux',
    type: 'card',
    tags: 'travaux',
    duration: 0,
    content_json: JSON.stringify({
      card: { title: 'Travaux', description: 'Travaux', priority: 'normal', duration_days: 0 },
    }),
  },
  {
    id: 6,
    title: 'Risques',
    type: 'card',
    tags: 'risques',
    duration: 0,
    content_json: JSON.stringify({
      card: { title: 'Risques', description: 'Risques', priority: 'normal', duration_days: 0 },
    }),
  },
  {
    id: 7,
    title: 'Processus DO - Validation et signature',
    type: 'category',
    tags: 'processus,projet',
    duration: 0,
    content_json: JSON.stringify({
      category: {
        title: 'DO - Validation et signature de la DO',
        description: '',
        priority: 'normal',
        duration_days: 0,
      },
    }),
  },
  {
    id: 8,
    title: 'Processus DCT',
    type: 'category',
    tags: 'processus',
    duration: 1022,
    content_json: JSON.stringify({
      category: {
        title: 'Processus DCT (Supprimer les lignes non nécessaires)',
        description: '',
        priority: 'normal',
        duration_days: 1022,
      },
      subcategories: [
        { title: 'Réalisation CTF', description: '', priority: 'normal', duration_days: 700 },
        {
          title: 'Projet < 10 M€ (Facultative)',
          description: '',
          priority: 'normal',
          duration_days: 35,
        },
        { title: 'Projet < 20 M€', description: '', priority: 'normal', duration_days: 252 },
        { title: 'Projet > 20 M€', description: '', priority: 'normal', duration_days: 322 },
      ],
    }),
  },
  {
    id: 9,
    title: 'Processus DI',
    type: 'category',
    tags: 'processus',
    duration: 1414,
    content_json: JSON.stringify({
      category: {
        title: 'Processus DI (Supprimer les lignes non nécessaires)',
        description: '',
        priority: 'normal',
        duration_days: 1414,
      },
      subcategories: [
        { title: 'APD', description: '', priority: 'normal', duration_days: 175 },
        { title: 'Projet < 10 M€', description: '', priority: 'normal', duration_days: 105 },
        { title: 'Projet < 20 M€', description: '', priority: 'normal', duration_days: 392 },
        { title: 'Projet > 20 M€', description: '', priority: 'normal', duration_days: 462 },
        { title: 'Projet > 30 M€', description: '', priority: 'normal', duration_days: 462 },
        { title: 'Projet > 50 M€', description: '', priority: 'normal', duration_days: 924 },
      ],
    }),
  },
  {
    id: 10,
    title: 'Concertation FERRACCI',
    type: 'category',
    tags: 'procedures,concertation',
    duration: 1309,
    content_json: JSON.stringify({
      category: {
        title: 'Concertation FERRACCI',
        description: '',
        priority: 'normal',
        duration_days: 1309,
      },
      subcategories: [
        {
          title: 'Projet simple (pas de DUP, LA<1km, LS<3km)',
          description: '',
          priority: 'normal',
          duration_days: 455,
        },
        {
          title: 'Projet intermédiaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP)',
          description: '',
          priority: 'normal',
          duration_days: 805,
        },
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
    id: 11,
    title: 'DUP et AE',
    type: 'category',
    tags: 'procedures,dup',
    duration: 3164,
    content_json: JSON.stringify({
      category: {
        title: 'DUP (Déclaration Utilité Publique) et AE (Autorisation Environnementale)',
        description: '',
        priority: 'normal',
        duration_days: 3164,
      },
      subcategories: [
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
          title: 'AE puis DUP désynchronisé sans Etude impact',
          description: '',
          priority: 'normal',
          duration_days: 693,
        },
        {
          title: 'AE puis DUP désynchronisé avec Etude impact',
          description: '',
          priority: 'normal',
          duration_days: 3164,
        },
      ],
    }),
  },
  {
    id: 12,
    title: 'Études préliminaires',
    type: 'category',
    tags: 'etudes',
    duration: 280,
    content_json: JSON.stringify({
      category: {
        title: 'Études préliminaires',
        description: '',
        priority: 'normal',
        duration_days: 280,
      },
      subcategories: [
        {
          title: 'Rédaction Note Organisation Projet et stratégie achats',
          description: '',
          priority: 'normal',
          duration_days: 280,
        },
        {
          title: 'Études sur la consistance de la solution retenue',
          description: '',
          priority: 'normal',
          duration_days: 280,
        },
      ],
    }),
  },
  {
    id: 13,
    title: 'Études détaillées',
    type: 'category',
    tags: 'etudes',
    duration: 3003,
    content_json: JSON.stringify({
      category: {
        title: 'Études détaillées',
        description: '',
        priority: 'normal',
        duration_days: 3003,
      },
    }),
  },
  {
    id: 14,
    title: 'Conventionnement LS',
    type: 'category',
    tags: 'procedures,ls',
    duration: 1169,
    content_json: JSON.stringify({
      category: {
        title: 'Conventionnement LS',
        description: '',
        priority: 'normal',
        duration_days: 1169,
      },
    }),
  },
  {
    id: 15,
    title: 'Conventionnement LA',
    type: 'category',
    tags: 'procedures,la',
    duration: 1540,
    content_json: JSON.stringify({
      category: {
        title: 'Conventionnement LA',
        description: '',
        priority: 'normal',
        duration_days: 1540,
      },
    }),
  },
  {
    id: 16,
    title: 'PC (Permis de Construire) Postes',
    type: 'category',
    tags: 'procedures,poste',
    duration: 735,
    content_json: JSON.stringify({
      category: {
        title: 'PC (Permis de Construire) (Postes)',
        description: '',
        priority: 'normal',
        duration_days: 735,
      },
    }),
  },
  {
    id: 17,
    title: 'APO (Autorisation Projet Ouvrage) LA',
    type: 'category',
    tags: 'procedures,la',
    duration: 665,
    content_json: JSON.stringify({
      category: {
        title: 'APO (Autorisation du Projet Ouvrage) (LA uniquement)',
        description: '',
        priority: 'normal',
        duration_days: 665,
      },
    }),
  },
  {
    id: 18,
    title: 'Mise en servitude',
    type: 'category',
    tags: 'risques,servitude',
    duration: 504,
    content_json: JSON.stringify({
      category: {
        title: 'RISQUE - mise en servitude',
        description: '',
        priority: 'normal',
        duration_days: 504,
      },
    }),
  },
];

export const thematicTags = [
  { id: 1, name: 'projet', label: 'Projet', color: '#3B82F6' },
  { id: 2, name: 'processus', label: 'Processus Décisionnel', color: '#8B5CF6' },
  { id: 3, name: 'procedures', label: 'Procédures Administratives', color: '#F59E0B' },
  { id: 4, name: 'etudes', label: 'Études', color: '#10B981' },
  { id: 5, name: 'achats', label: 'Achats', color: '#EC4899' },
  { id: 6, name: 'consignations', label: 'Consignations', color: '#6366F1' },
  { id: 7, name: 'travaux', label: 'Travaux', color: '#EF4444' },
  { id: 8, name: 'risques', label: 'Risques', color: '#F97316' },
];

export default libraryTemplates;
