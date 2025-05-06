const { contextBridge, ipcRenderer } = require('electron');
const { mouse, straightTo, Point, keyboard, Key } = require("@nut-tree-fork/nut-js");

contextBridge.exposeInMainWorld('electronAPI', {
  onPythonData: (callback) => ipcRenderer.on('python-data', callback),
  sendToPython: (data) => ipcRenderer.send('send-to-python', data),
  moveMouse: async (x, y) => {
    await mouse.move(straightTo(new Point(x, y)));
  },
  pressKey: async (key) => {
    switch (key) {
      case 'ArrowUp':
        key = Key.ArrowUp;
        break;
      case 'ArrowDown':
        key = Key.ArrowDown;
        break;
      case 'ArrowLeft':
        key = Key.ArrowLeft;
        break;
      case 'ArrowRight':
        key = Key.ArrowRight;
        break;
      default:
        console.error(`Key ${key} not recognized`);
        return;
    }
    // Press the key using nut.js
    await keyboard.pressKey(key);
  },
});
