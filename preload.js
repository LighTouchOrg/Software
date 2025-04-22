const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onPythonData: (callback) => ipcRenderer.on('python-data', callback),
  sendToPython: (data) => ipcRenderer.send('send-to-python', data)
});
