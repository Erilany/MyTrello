const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  Tray,
  globalShortcut,
  nativeTheme,
} = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const Store = require('electron-store');
const { initDatabase, getDatabase } = require('./src/services/database');

const store = new Store({
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production',
});

let mainWindow = null;
let db = null;
let tray = null;

const isDev = process.env.NODE_ENV !== 'production' || true; // Force dev mode

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
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
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
          label: 'À propos de MyTrello',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos de MyTrello',
              message: 'MyTrello v0.1.0',
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
        label: 'Ouvrir MyTrello',
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

    tray.setToolTip('MyTrello');
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
