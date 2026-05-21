class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.timeoutId = null;
    this.onResult = null;
    this.onListeningChange = null;
    this.onError = null;
    this.lastCommand = null;
    this.commands = this.initializeCommands();
    this.useWindowsSpeech = true;

    this.setupElectronListeners();
    this.initWindowsSpeechRecognition();
  }

  setupElectronListeners() {
    if (window.electron && window.electron.on) {
      window.electron.on('speech:started', () => {
      });

      window.electron.on('speech:result', data => {
        if (data.transcript) {
          this.processCommand(data.transcript);
        }
      });

      window.electron.on('speech:stopped', () => {
        this.isListening = false;
        if (this.onListeningChange) {
          this.onListeningChange(false);
        }
      });
    }
  }

  initWindowsSpeechRecognition() {

    if (window.electron && window.electron.invoke) {
      this.useWindowsSpeech = true;
    } else {
      this.useWindowsSpeech = false;
      this.initWebSpeechRecognition();
    }
  }

  initWebSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[VoiceService] Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'fr-FR';

    this.recognition.onstart = () => {
    };

    this.recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[event.results.length - 1].isFinal) {
        this.processCommand(transcript);
      }
    };

    this.recognition.onerror = event => {
      console.error('[VoiceService] Web Speech error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('[VoiceService] Error restarting:', e);
        }
      }
    };
  }

  start() {
    if (this.isListening) return;


    const canUseWindowsSpeech = !!(window.electron && window.electron.invoke);

    if (canUseWindowsSpeech) {
      this.useWindowsSpeech = true;
      this.startWindowsSpeech();
    } else if (this.recognition) {
      try {
        this.recognition.start();
        this.isListening = true;
        if (this.onListeningChange) this.onListeningChange(true);
      } catch (e) {
        console.error('[VoiceService] Error starting web speech:', e);
      }
    } else {
      console.error('[VoiceService] Recognition not initialized');
    }
  }

  async startWindowsSpeech() {
    try {

      const result = await window.electron.invoke('speech:start', { lang: 'fr-FR' });

      if (result.success) {
        this.isListening = true;
        if (this.onListeningChange) this.onListeningChange(true);
      } else {
        console.error('[VoiceService] Windows Speech failed:', result.error);
        if (this.onError) this.onError(result.error);
      }
    } catch (e) {
      console.error('[VoiceService] Error starting Windows Speech:', e);
      if (this.onError) this.onError(e.message);
    }
  }

  stop() {
    this.isListening = false;
    if (this.onListeningChange) this.onListeningChange(false);

    if (this.useWindowsSpeech && window.electron) {
      window.electron.invoke('speech:stop').catch(console.error);
    } else if (this.recognition) {
      this.recognition.stop();
    }

    this.clearTimeout();
  }

  initializeCommands() {
    return {
      activation: ['écoute', 'hey c-projets', 'activer', 'écoute-moi', 'c-projets'],
      stop: ['stop', 'pause', 'arrêter', 'arrête', 'stop écoute'],
      cancel: ['annuler', 'annule', '取消'],
      help: ['aide', 'help', 'liste commandes', 'commandes'],
      repeat: ['répète', 'refaire', 'répète ça', 'répète ça'],

      create: {
        card: [
          'crée une carte',
          'nouvelle carte',
          'ajoute une carte',
          'créer carte',
          'créer une carte',
        ],
        category: [
          'crée une catégorie',
          'nouvelle catégorie',
          'ajoute une catégorie',
          'créer catégorie',
          'créer une catégorie',
        ],
        subcategory: [
          'crée une sous catégorie',
          'nouvelle sous catégorie',
          'ajoute une sous catégorie',
        ],
      },

      navigation: {
        open: ['ouvre', 'ouvrir', 'afficher'],
        close: ['ferme', 'fermer', 'ferme la carte', 'ferme carte', 'ferme'],
        showBoard: [
          'affiche le projet',
          'voir le projet',
          'projet',
          'ouvre le projet',
          'ouvre le board',
        ],
        dashboard: ['ouvre le dashboard', "va à l'accueil", 'dashboard', 'accueil'],
        planning: ['ouvre le planning', 'planning'],
        archives: ['ouvre les archives', 'archives'],
        settings: ['ouvre les paramètres', 'paramètres', 'ouvre paramètres', 'settings'],
        search: ['ouvre la recherche', 'recherche', 'panneau de recherche'],
      },

      actions: {
        tag: ['tag', 'taguer', 'étiquette', 'priorité'],
        assign: ['assigne à', 'assigner à', 'attribuer à'],
        dueDate: ['échéance', 'deadline', 'date limite', "date d'échéance"],
        archive: ['archive', 'archiver'],
        comment: ['ajoute un commentaire', 'commentaire', 'ajouter commentaire'],
        delete: ['supprime', 'supprimer', 'efface', 'effacer'],
        close: ['ferme', 'fermer'],
      },

      library: {
        save: ['sauvegarde comme modèle', 'sauvegarder modèle', 'enregistrer modèle'],
        use: ['utilise le modèle', 'applique le modèle', 'utiliser modèle'],
        open: ['ouvre la bibliothèque', 'bibliothèque'],
      },

      // Phase 3 - Planning
      planning: {
        semaine: ['planning semaine', 'vue semaine', 'semaine'],
        mois: ['planning mois', 'vue mois', 'mois'],
        today: ["va à aujourd'hui", "aujourd'hui", "aujourd'hui"],
        zoomIn: ['zoom avant', 'zoom plus'],
        zoomOut: ['zoom arrière', 'zoom moins', 'dézoom'],
      },

      // Phase 3 - Settings
      settings: {
        user: [
          'paramètres utilisateur',
          'paramètre utilisateur',
          'utilisateur',
          'settings utilisateur',
        ],
        color: ['paramètres couleurs', 'paramètre couleurs', 'couleurs', 'settings couleurs'],
        system: ['paramètres système', 'paramètre système', 'système', 'settings système'],
      },

      // Phase 3 - Dashboard
      dashboard: {
        jalons: ['dashboard jalons', 'afficher les jalons', 'jalons'],
        taches: ['dashboard tâches', 'afficher les tâches', 'tâches'],
        temps: ['dashboard temps', 'afficher le temps', 'temps passé'],
        all: ['dashboard tout', 'afficher tout', 'tout'],
      },

      // Phase 3 - Search
      search: {
        open: ['ouvre la recherche', 'ouvre recherche'],
        query: ['recherche', 'chercher', 'trouve'],
      },

      // Phase 3 - Delete target
      deleteTarget: {
        card: ['carte'],
        categorie: ['catégorie', 'categorie', 'catégorie'],
      },
    };
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  matchCommand(text, commandList) {
    const normalized = this.normalizeText(text);
    for (const cmd of commandList) {
      if (normalized.includes(this.normalizeText(cmd))) {
        return cmd;
      }
    }
    return null;
  }

  extractParam(text, commandList) {
    const normalized = this.normalizeText(text);
    // Trouver la commande la plus longue qui correspond (pour éviter les faux positifs)
    let bestMatch = null;
    let bestLength = 0;

    for (const cmd of commandList) {
      const cmdNormalized = this.normalizeText(cmd);
      if (normalized.includes(cmdNormalized)) {
        if (cmdNormalized.length > bestLength) {
          bestMatch = cmdNormalized;
          bestLength = cmdNormalized.length;
        }
      }
    }

    if (bestMatch) {
      const param = normalized.replace(bestMatch, '').trim();
      // Nettoyer le paramètre - supprimer les mots vides au début
      const cleaned = param.replace(/^(et|la|le|les|un|une|de|du|des|dans|sur)\s+/i, '').trim();
      return cleaned || '';
    }
    return '';
  }

  extractNameAfterKeyword(text, keywords) {
    const normalized = this.normalizeText(text);

    for (const keyword of keywords) {
      const keywordNorm = this.normalizeText(keyword);
      if (normalized.includes(keywordNorm)) {
        const after = normalized.split(keywordNorm)[1];
        if (after) {
          // Prendre jusqu'au prochain mot clé connu ou fin de chaîne
          const nextKeyword = [
            'crée',
            'va',
            'ouvre',
            'ferme',
            'archive',
            'supprime',
            'ajoute',
            'priorité',
            'assigne',
            'paramètres',
            'dashboard',
            'planning',
          ];
          let name = after.trim();

          // Couper si un mot clé suit
          for (const next of nextKeyword) {
            const idx = name.indexOf(next);
            if (idx > 0 && idx < name.length - 5) {
              name = name.substring(0, idx).trim();
            }
          }

          return name.replace(/^(et|la|le|les|un|une|de|du|des|dans|sur)\s+/i, '').trim();
        }
      }
    }
    return '';
  }

  processCommand(text) {
    let result = { action: 'unknown', params: {}, original: text };

    // Nettoyer le texte - prendre seulement la dernière commande clara
    // Séparer par . ou par "ouvre" répété
    const parts = text.split(/[.]/);
    let cleanText = parts[parts.length - 1].trim();

    // Si ça commence par une virgule ou est vide, prendre l'avant-dernier
    if (cleanText.startsWith(',') || cleanText.startsWith('ouvre') === false) {
      cleanText = parts[parts.length - 2]?.trim() || cleanText;
    }

    // Nettoyer les virgules au début
    cleanText = cleanText.replace(/^[,]\s*/, '').trim();

    const normalized = this.normalizeText(cleanText);
    const finalCleanText = normalized.replace(/\s+/g, ' ').trim();


    // === COMMANDES DE BASE (toujours en premier, plus précis) ===
    if (this.matchCommand(cleanText, this.commands.activation)) {
      result = { action: 'activate', params: {}, original: text };
    } else if (this.matchCommand(cleanText, this.commands.stop)) {
      result = { action: 'stop', params: {}, original: text };
    } else if (this.matchCommand(cleanText, this.commands.cancel)) {
      result = { action: 'cancel', params: {}, original: text };
    } else if (this.matchCommand(cleanText, this.commands.help)) {
      result = { action: 'help', params: {}, original: text };
    } else if (this.matchCommand(cleanText, this.commands.repeat)) {
      result = { action: 'repeat', params: {}, original: text };

      // === CRÉATION - Ordre important, plus spécifique d'abord ===
    } else if (
      this.matchCommand(cleanText, ['crée une carte', 'nouvelle carte', 'créer une carte'])
    ) {
      const title = this.extractNameAfterKeyword(text, [
        'crée une carte',
        'nouvelle carte',
        'créer une carte',
        'ajoute une carte',
      ]);

      let column = null;
      if (normalized.includes('colonne')) {
        const columnMatch = normalized.match(/colonne\s+(\w+)/);
        if (columnMatch) column = columnMatch[1];
      }
      result = { action: 'createCard', params: { title: title || '' }, original: text };
    } else if (this.matchCommand(cleanText, ['crée une catégorie', 'nouvelle catégorie'])) {
      const title = this.extractNameAfterKeyword(text, [
        'crée une catégorie',
        'nouvelle catégorie',
        'ajoute une catégorie',
      ]);
      result = { action: 'createCategory', params: { title: title || '' }, original: text };
    } else if (this.matchCommand(cleanText, ['crée une sous catégorie'])) {
      const title = this.extractNameAfterKeyword(text, [
        'crée une sous catégorie',
        'nouvelle sous catégorie',
      ]);
      result = { action: 'createSubcategory', params: { title: title || '' }, original: text };

      // === NAVIGATION DIRECTE AVEC ONGLET ===
    } else if (cleanText.startsWith('ouvre') || cleanText.startsWith('ouvre le')) {
      // Dashboard tabs
      if (cleanText.includes('temps')) {
        result = {
          action: 'navigate',
          params: { destination: 'dashboard', tab: 'time' },
          original: text,
        };
      } else if (cleanText.includes('mes') && cleanText.includes('tache')) {
        result = {
          action: 'navigate',
          params: { destination: 'dashboard', tab: 'tasks' },
          original: text,
        };
      } else if (
        cleanText.includes('revue') ||
        cleanText.includes('activite') ||
        cleanText.includes('activité')
      ) {
        result = {
          action: 'navigate',
          params: { destination: 'dashboard', tab: 'activity' },
          original: text,
        };
      }
      // Board tabs - toutes sans necessiter "projet"
      else if (cleanText.includes('information')) {
        result = {
          action: 'navigate',
          params: { destination: 'projet', tab: 'informations' },
          original: text,
        };
      } else if (cleanText.includes('tache') && !cleanText.includes('mes')) {
        result = {
          action: 'navigate',
          params: { destination: 'projet', tab: 'taches' },
          original: text,
        };
      } else if (cleanText.includes('commande')) {
        result = {
          action: 'navigate',
          params: { destination: 'projet', tab: 'commandes' },
          original: text,
        };
      } else if (cleanText.includes('planning')) {
        result = {
          action: 'navigate',
          params: { destination: 'projet', tab: 'planning' },
          original: text,
        };
      } else if (cleanText.includes('echanges') || cleanText.includes('échange')) {
        result = {
          action: 'navigate',
          params: { destination: 'projet', tab: 'echanges' },
          original: text,
        };
      }
      // Navigation generale - en dernier
      else if (cleanText.includes('dashboard') || cleanText.includes('accueil')) {
        result = { action: 'navigate', params: { destination: 'dashboard' }, original: text };
      } else if (cleanText.includes('projet') || cleanText.includes('board')) {
        result = { action: 'navigate', params: { destination: 'projet' }, original: text };
      } else if (cleanText.includes('bibliotheque')) {
        result = { action: 'openLibrary', params: {}, original: text };
      } else if (cleanText.includes('archive')) {
        result = { action: 'navigate', params: { destination: 'archives' }, original: text };
      } else if (cleanText.includes('parametre')) {
        result = { action: 'navigate', params: { destination: 'settings' }, original: text };
      }
      // Navigation simple - planning seul
    } else if (cleanText === 'planning') {
      result = {
        action: 'navigate',
        params: { destination: 'projet', tab: 'planning' },
        original: text,
      };
    } else if (
      cleanText.includes('ouvre le projet') ||
      cleanText.includes('projet') ||
      cleanText.includes('board')
    ) {
      result = { action: 'navigate', params: { destination: 'projet' }, original: text };
    } else if (this.matchCommand(cleanText, this.commands.navigation.open)) {
      const name = this.extractNameAfterKeyword(text, ['ouvre', 'ouvrir']);
      result = { action: 'openCard', params: { name: name || '' }, original: text };
    } else if (this.matchCommand(cleanText, ['ferme', 'fermer'])) {
      result = { action: 'close', params: {}, original: text };

      // === ACTIONS ===
    } else if (this.matchCommand(cleanText, ['priorite', 'priorité', 'tag', 'étiquette'])) {
      const priority = this.extractNameAfterKeyword(text, ['priorite', 'priorité', 'tag']);
      result = { action: 'setPriority', params: { priority: priority || '' }, original: text };
    } else if (
      cleanText.includes('assigne a') ||
      cleanText.includes('assigne à') ||
      normalized.includes('assigner')
    ) {
      const name = this.extractNameAfterKeyword(text, ['assigne a', 'assigne à', 'assigner']);
      result = { action: 'setAssignee', params: { name: name || '' }, original: text };
    } else if (this.matchCommand(cleanText, ['archive', 'archiver'])) {
      result = { action: 'archiveCard', params: {}, original: text };
    } else if (normalized.includes('commentaire') || normalized.includes('ajoute un commentaire')) {
      const textComment = this.extractNameAfterKeyword(text, [
        'ajoute un commentaire',
        'commentaire',
      ]);
      result = { action: 'addComment', params: { text: textComment || '' }, original: text };
    } else if (normalized.includes('supprime') || normalized.includes('supprimer')) {
      let target = 'card';
      if (normalized.includes('categorie') || normalized.includes('catégorie')) {
        target = 'categorie';
      }
      const name = this.extractNameAfterKeyword(text, ['supprime', 'supprimer']);
      result = { action: 'delete', params: { target, name: name || '' }, original: text };

      // === PHASE 3: PLANNING ===
    } else if (
      cleanText.includes('planning semaine') ||
      cleanText.includes('vue semaine') ||
      cleanText.includes('semaine')
    ) {
      result = { action: 'planningCommand', params: { action: 'semaine' }, original: text };
    } else if (
      cleanText.includes('planning mois') ||
      cleanText.includes('vue mois') ||
      cleanText.includes('mois')
    ) {
      result = { action: 'planningCommand', params: { action: 'mois' }, original: text };
    } else if (
      cleanText.includes("aujourd'hui") ||
      cleanText.includes('aujourdhui') ||
      cleanText.includes('aujourd hui')
    ) {
      result = { action: 'planningCommand', params: { action: "aujourd'hui" }, original: text };
    } else if (cleanText.includes('zoom avant') || cleanText.includes('zoom plus')) {
      result = { action: 'planningCommand', params: { action: 'zoom avant' }, original: text };
    } else if (
      cleanText.includes('zoom arriere') ||
      cleanText.includes('dézoom') ||
      cleanText.includes('zoom moins')
    ) {
      result = { action: 'planningCommand', params: { action: 'zoom arrière' }, original: text };

      // === PHASE 3: SETTINGS ===
    } else if (
      cleanText.includes('parametres utilisateur') ||
      cleanText.includes('parametre utilisateur')
    ) {
      result = { action: 'settingsCommand', params: { section: 'utilisateur' }, original: text };
    } else if (
      cleanText.includes('parametres couleurs') ||
      cleanText.includes('parametre couleurs')
    ) {
      result = { action: 'settingsCommand', params: { section: 'couleur' }, original: text };
    } else if (
      cleanText.includes('parametres systeme') ||
      cleanText.includes('parametre systeme')
    ) {
      result = { action: 'settingsCommand', params: { section: 'système' }, original: text };

      // === PHASE 3: DASHBOARD ===
    } else if (
      cleanText.includes('dashboard jalons') ||
      cleanText.includes('afficher les jalons')
    ) {
      result = { action: 'dashboardCommand', params: { filter: 'jalons' }, original: text };
    } else if (
      cleanText.includes('dashboard taches') ||
      cleanText.includes('afficher les taches')
    ) {
      result = { action: 'dashboardCommand', params: { filter: 'tâches' }, original: text };
    } else if (cleanText.includes('dashboard temps') || cleanText.includes('afficher le temps')) {
      result = { action: 'dashboardCommand', params: { filter: 'temps' }, original: text };
    } else if (cleanText.includes('dashboard tout') || cleanText.includes('afficher tout')) {
      result = { action: 'dashboardCommand', params: { filter: 'tout' }, original: text };

      // === PHASE 3: RECHERCHE ===
    } else if (
      normalized.includes('ouvre la recherche') ||
      normalized.includes('ouvre recherche')
    ) {
      result = { action: 'openSearch', params: {}, original: text };
    } else if (normalized.includes('recherche') || normalized.includes('chercher')) {
      const query = this.extractNameAfterKeyword(text, ['recherche', 'chercher']);
      result = { action: 'search', params: { query: query || '' }, original: text };

      // === BIBLIOTHÈQUE ===
    } else if (this.matchCommand(cleanText, ['ouvre la bibliotheque', 'bibliotheque'])) {
      result = { action: 'openLibrary', params: {}, original: text };
    }

    this.lastCommand = result;
    if (this.onResult) {
      this.onResult(result);
    }

    this.resetTimeout();
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
      if (this.onListeningChange) {
        this.onListeningChange(false);
      }
      this.clearTimeout();
    }
  }

  resetTimeout() {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      if (this.isListening) {
        this.stop();
      }
    }, 10000);
  }

  clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  playBeep() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
    }
  }

  playSuccessSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.frequency.value = 800;
      }, 100);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
    }
  }

  setOnResult(callback) {
    this.onResult = callback;
  }

  setOnListeningChange(callback) {
    this.onListeningChange = callback;
  }

  setOnError(callback) {
    this.onError = callback;
  }

  getLastCommand() {
    return this.lastCommand;
  }
}

export default VoiceService;
