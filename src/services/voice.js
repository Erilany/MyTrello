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
    
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'fr-FR';

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[event.results.length - 1].isFinal) {
        this.processCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
      if (event.error !== 'no-speech') {
        this.stop();
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };
  }

  initializeCommands() {
    return {
      activation: ['écoute', 'hey mytrello', 'activer', 'écoute-moi', 'mytrello'],
      stop: ['stop', 'pause', 'arrêter', 'arrête', 'stop écoute'],
      cancel: ['annuler', 'annule', '取消'],
      help: ['aide', 'help', 'liste commandes', 'commandes'],
      repeat: ['répète', 'refaire', 'répète ça'],
      
      create: {
        card: ['crée une carte', 'nouvelle carte', 'ajoute une carte', 'créer carte', 'créer une carte'],
        category: ['crée une catégorie', 'nouvelle catégorie', 'ajoute une catégorie', 'créer catégorie', 'créer une catégorie'],
        subcategory: ['crée une sous catégorie', 'nouvelle sous catégorie', 'ajoute une sous catégorie']
      },
      
      navigation: {
        open: ['ouvre', 'ouvrir', 'afficher'],
        close: ['ferme', 'fermer', 'ferme la carte', 'ferme carte'],
        showBoard: ['affiche le tableau', 'voir le tableau', 'tableau']
      },
      
      actions: {
        tag: ['tag', 'taguer', 'étiquette', 'priorité'],
        assign: ['assigne à', 'assigner à', 'attribuer à'],
        dueDate: ['échéance', 'deadline', 'date limite', 'date d\'échéance'],
        archive: ['archive', 'archiver'],
        comment: ['ajoute un commentaire', 'commentaire', 'ajouter commentaire']
      },
      
      library: {
        save: ['sauvegarde comme modèle', 'sauvegarder modèle', 'enregistrer modèle'],
        use: ['utilise le modèle', 'applique le modèle', 'utiliser modèle'],
        open: ['ouvre la bibliothèque', 'bibliothèque']
      }
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
    for (const cmd of commandList) {
      const cmdNormalized = this.normalizeText(cmd);
      if (normalized.includes(cmdNormalized)) {
        return normalized.replace(cmdNormalized, '').trim();
      }
    }
    return text;
  }

  processCommand(text) {
    const normalized = this.normalizeText(text);
    let result = { action: 'unknown', params: {}, original: text };

    if (this.matchCommand(text, this.commands.activation)) {
      result = { action: 'activate', params: {}, original: text };
    } else if (this.matchCommand(text, this.commands.stop)) {
      result = { action: 'stop', params: {}, original: text };
    } else if (this.matchCommand(text, this.commands.cancel)) {
      result = { action: 'cancel', params: {}, original: text };
    } else if (this.matchCommand(text, this.commands.help)) {
      result = { action: 'help', params: {}, original: text };
    } else if (this.matchCommand(text, this.commands.repeat)) {
      result = { action: 'repeat', params: {}, original: text };
    } else if (this.matchCommand(text, this.commands.create.card)) {
      const param = this.extractParam(text, this.commands.create.card);
      result = { action: 'createCard', params: { title: param }, original: text };
    } else if (this.matchCommand(text, this.commands.create.category)) {
      const param = this.extractParam(text, this.commands.create.category);
      result = { action: 'createCategory', params: { title: param }, original: text };
    } else if (this.matchCommand(text, this.commands.create.subcategory)) {
      const param = this.extractParam(text, this.commands.create.subcategory);
      result = { action: 'createSubcategory', params: { title: param }, original: text };
    } else if (this.matchCommand(text, this.commands.navigation.open)) {
      const param = this.extractParam(text, this.commands.navigation.open);
      result = { action: 'openCard', params: { name: param }, original: text };
    } else if (this.matchCommand(text, this.commands.navigation.close)) {
      result = { action: 'closeCard', params: {}, original: text };
    } else if (this.matchCommand(text, this.commands.actions.tag)) {
      const param = this.extractParam(text, this.commands.actions.tag);
      result = { action: 'setPriority', params: { priority: param }, original: text };
    } else if (this.matchCommand(text, this.commands.actions.assign)) {
      const param = this.extractParam(text, this.commands.actions.assign);
      result = { action: 'setAssignee', params: { name: param }, original: text };
    } else if (this.matchCommand(text, this.commands.actions.archive)) {
      result = { action: 'archiveCard', params: {}, original: text };
    } else if (this.matchCommand(text, this.commands.actions.comment)) {
      const param = this.extractParam(text, this.commands.actions.comment);
      result = { action: 'addComment', params: { text: param }, original: text };
    } else if (this.matchCommand(text, this.commands.library.open)) {
      result = { action: 'openLibrary', params: {}, original: text };
    }

    this.lastCommand = result;
    if (this.onResult) {
      this.onResult(result);
    }

    this.resetTimeout();
  }

  start() {
    if (!this.recognition) {
      console.error('Speech recognition not initialized');
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      if (this.onListeningChange) {
        this.onListeningChange(true);
      }
      this.playBeep();
      this.resetTimeout();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
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
      console.log('Audio not available');
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
      console.log('Audio not available');
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
