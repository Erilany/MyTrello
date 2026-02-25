const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, data) => {
    const allowedChannels = [
      'db:query',
      'db:get',
      'db:run',
      'store:get',
      'store:set',
      'dialog:openFile',
      'dialog:saveFile',
      'app:getVersion',
      'app:getPath',
      'speech:start',
      'speech:stop',
      'cardColors:get',
      'cardColors:set',
      'cardColors:reset',
    ];
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Canal IPC non autorisé : ${channel}`);
  },

  on: (channel, callback) => {
    const allowedChannels = [
      'menu:new-board',
      'menu:export',
      'menu:import',
      'speech:started',
      'speech:result',
      'speech:stopped',
    ];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
