const { contextBridge, ipcRenderer } = require('electron');
const { mouse, straightTo, Point } = require("@nut-tree-fork/nut-js");

contextBridge.exposeInMainWorld('electronAPI', {
  onPythonData: (callback) => ipcRenderer.on('python-data', callback),
  sendToPython: (data) => ipcRenderer.send('send-to-python', data),
  moveMouse: async (x, y) => {
    await mouse.move(straightTo(new Point(x, y)));
  }
});
