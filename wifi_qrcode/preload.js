const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateWiFiQR: (ssid, password, security) =>
    ipcRenderer.invoke('generate-wifi-qr', ssid, password, security),
  refreshWiFi: () => ipcRenderer.invoke('refresh-wifi'),
  onWiFiDetected: (callback) => ipcRenderer.on('wifi-detected', (event, data) => callback(data))
});