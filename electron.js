const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  Tray,
  globalShortcut,
  shell,
} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const Store = require('electron-store');
const { initDatabase } = require('./src/services/database');

const store = new Store({
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production',
  defaults: {
    cardColors: {
      etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
      enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
      realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
      archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
    },
  },
});

let mainWindow = null;
let db = null;
let tray = null;

const isDev = process.env.NODE_ENV !== 'production' || true; // Force dev mode

app.commandLine.appendSwitch('enable-features', 'VoiceInteractionServices');
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-gpu-sandbox');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5175');
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline' https://fonts.googleapis.com; font-src * data: https:; img-src * data: https:; connect-src * http://localhost:* https://*; media-src *",
          ],
        },
      });
    });
    mainWindow.webContents.openDevTools();
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log('[RENDERER]', message);
    });
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.log('[RENDERER CRASH]', details);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', event => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  createMenu();
  createTray();
}

function createMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouveau tableau',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu:new-board'),
        },
        { type: 'separator' },
        {
          label: 'Exporter les données',
          click: () => mainWindow.webContents.send('menu:export'),
        },
        {
          label: 'Importer les données',
          click: () => mainWindow.webContents.send('menu:import'),
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rétablir', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Recharger', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forcer le rechargement', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Zoom avant', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Réinitialiser le zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Plein écran', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Outils de développement', accelerator: 'F12', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de D-ProjeT',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos de D-ProjeT',
              message: 'D-ProjeT v1.1',
              detail: 'Application de gestion de projets à 3 niveaux.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  const iconPath = isDev
    ? path.join(__dirname, 'assets', 'icon.png')
    : path.join(process.resourcesPath, 'assets', 'icon.png');

  try {
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Ouvrir D-ProjeT',
        click: () => {
          mainWindow.show();
        },
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('D-ProjeT');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      mainWindow.show();
    });
  } catch (e) {
    console.log('Tray icon not found, skipping...');
  }
}

function registerGlobalShortcuts() {
  globalShortcut.register('CmdOrCtrl+Shift+T', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

app.whenReady().then(async () => {
  try {
    db = await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    dialog.showErrorBox('Erreur de base de données', error.message);
    app.quit();
    return;
  }

  createWindow();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (db) {
    db.close();
  }
});

ipcMain.handle('db:query', async (event, { sql, params }) => {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const data = stmt.all(...(params || []));
      console.log('[DB QUERY]', sql, '-> rows:', data.length);
      if (sql.includes('library_items')) {
        console.log(
          '[DB] library_items columns:',
          data.length > 0 ? Object.keys(data[0]) : 'no rows'
        );
      }
      return { success: true, data };
    } else {
      const result = stmt.run(...(params || []));
      return { success: true, data: result };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:get', async (event, { sql, params }) => {
  try {
    const stmt = db.prepare(sql);
    return { success: true, data: stmt.get(...(params || [])) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:run', async (event, { sql, params }) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...(params || []));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('store:get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', async (event, key, value) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPath', (event, name) => {
  return app.getPath(name);
});

let speechProcess = null;
let speechCallback = null;

ipcMain.handle('speech:start', async (event, options) => {
  const lang = options.lang || 'fr-FR';
  console.log('[Electron] === STARTING SPEECH === lang:', lang);

  try {
    // First, test if System.Speech works
    const testScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    Add-Type -AssemblyName System.Speech
    $r = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $r.SetInputToDefaultAudioDevice()
    Write-Output "TEST:OK"
} catch {
    Write-Error "TEST:FAILED:$($_.Exception.Message)"
}
`;

    const testProc = require('child_process').spawnSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', testScript],
      { encoding: 'utf8' }
    );

    console.log('[Electron] Test stdout:', testProc.stdout);
    console.log('[Electron] Test stderr:', testProc.stderr);
    console.log('[Electron] Test status:', testProc.status);

    if (!testProc.stdout.includes('TEST:OK')) {
      console.error('[Electron] Speech test failed!');
      return { success: false, error: 'Speech recognition not available: ' + testProc.stderr };
    }

    // Now run the actual speech service
    const scriptPath = path.join(__dirname, 'speech-service.ps1');
    console.log('[Electron] Script path:', scriptPath);

    let speechProcess;
    try {
      speechProcess = require('child_process').spawn(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
          windowsHide: true,
        }
      );
    } catch (spawnErr) {
      console.error('[Electron] Spawn error:', spawnErr);
      return { success: false, error: spawnErr.message };
    }

    console.log('[Electron] PowerShell spawned, pid:', speechProcess.pid);

    speechProcess.stdout.on('data', data => {
      const output = data.toString();
      console.log('[Speech stdout]: >>>', output, '<<<');

      if (output.includes('READY') || output.includes('LISTENING')) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('speech:started');
        }
      }

      if (output.includes('RESULT:')) {
        const match = output.match(/RESULT:(.+)\|(\d+\.?\d*)/);
        if (match) {
          const transcript = match[1].trim();
          const confidence = parseFloat(match[2]);
          console.log('[Speech] Recognized:', transcript, 'confidence:', confidence);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('speech:result', { transcript, confidence });
          }
        }
      }
    });

    speechProcess.stderr.on('data', data => {
      const err = data.toString();
      console.log('[Speech stderr]: >>>', err, '<<<');
      if (err.includes('ERROR') || err.includes('Exception') || err.includes('not recognized')) {
        console.error('[Speech] PowerShell error detected!');
      }
    });

    speechProcess.on('close', code => {
      console.log('[Speech] Process closed with code:', code);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('speech:stopped');
      }
    });

    speechProcess.on('error', err => {
      console.error('[Speech] Process ERROR:', err);
    });

    speechProcess.on('error', err => {
      console.error('[Speech] Process error:', err);
    });

    return { success: true };
  } catch (error) {
    console.error('[Speech] Failed to start:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('speech:stop', async () => {
  console.log('[Electron] Stopping Windows Speech Recognition');

  if (speechProcess) {
    speechProcess.kill();
    speechProcess = null;
  }

  return { success: true };
});

ipcMain.handle('cardColors:get', async () => {
  console.log('[Electron] Getting card colors');
  return store.get('cardColors');
});

ipcMain.handle('cardColors:set', async (event, colors) => {
  console.log('[Electron] Setting card colors:', colors);
  store.set('cardColors', colors);
  return { success: true };
});

ipcMain.handle('cardColors:reset', async () => {
  console.log('[Electron] Resetting card colors to defaults');
  store.set(
    'cardColors',
    store.get('cardColors', {
      etudes: { gradient: ['#6366f1', '#3b82f6'], keywords: ['études', 'etudes'] },
      enCours: { gradient: ['#f59e0b', '#fbbf24'], keywords: ['cours', 'en cours'] },
      realise: { gradient: ['#22c55e', '#4ade80'], keywords: ['réalisé', 'realis', 'terminé'] },
      archive: { gradient: ['#475569', '#475569'], keywords: ['archiv'] },
    })
  );
  return { success: true, data: store.get('cardColors') };
});

ipcMain.handle('shell:openMsg', async (event, base64Data, filename) => {
  try {
    console.log('[Electron] Opening MSG file:', filename);

    const base64 = base64Data.replace(/^data:application\/vnd\.ms-outlook;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, filename);

    fs.writeFileSync(tempFilePath, buffer);
    console.log('[Electron] Temp file created at:', tempFilePath);

    return new Promise(resolve => {
      exec(`start "" "${tempFilePath}"`, error => {
        if (error) {
          console.error('[Electron] Error opening MSG file:', error);
          resolve({ success: false, error: error.message });
        } else {
          console.log('[Electron] MSG file opened successfully');
          resolve({ success: true });
        }
      });
    });
  } catch (error) {
    console.error('[Electron] Error opening MSG file:', error);
    return { success: false, error: error.message };
  }
});
