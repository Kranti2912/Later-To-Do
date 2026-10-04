const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('laterAPI', {
  peek: () => ipcRenderer.send('peek'),
  expand: () => ipcRenderer.send('expand'),
  quit: () => ipcRenderer.send('quit'),
  setTheme: (theme) => ipcRenderer.send('theme', theme),
  setEdgeOffset: (payload) => ipcRenderer.send('set-edge-offset', payload),
  movePeek: (payload) => ipcRenderer.send('move-peek', payload),
  onModeChanged: (fn) => ipcRenderer.on('mode-changed', (_, data) => fn(data)),
  onInitialState: (fn) => ipcRenderer.once('initial-state', (_, data) => fn(data))
});
