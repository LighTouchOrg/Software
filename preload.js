const { contextBridge, ipcRenderer } = require("electron");
const { mouse, straightTo, Point, keyboard, Key, Button } = require("@nut-tree-fork/nut-js");

contextBridge.exposeInMainWorld("electronAPI", {
  onPythonData: (callback) => ipcRenderer.on('python-data', callback),
  sendToPython: (data) => ipcRenderer.send('send-to-python', data),
  moveMouse: async (x, y) => {
    await mouse.move(straightTo(new Point(x, y)));
  },
  pressMouse: async (x, y, btn="LEFT") => {
    await mouse.move(straightTo(new Point(x, y)));

    switch (btn) {
      case "LEFT":
        btn = Button.LEFT;
        break;
      case "RIGHT":
        btn = Button.RIGHT;
        break;
      case "MIDDLE":
        btn = Button.MIDDLE;
        break;
      default:
        console.error(`Button ${btn} not recognized`);
        return;
    }
    await mouse.pressButton(btn);
  },
  releaseMouse: async (x, y, btn="LEFT") => {
    await mouse.move(straightTo(new Point(x, y)));

    switch (btn) {
      case "LEFT":
        btn = Button.LEFT;
        break;
      case "RIGHT":
        btn = Button.RIGHT;
        break;
      case "MIDDLE":
        btn = Button.MIDDLE;
        break;
      default:
        console.error(`Button ${btn} not recognized`);
        return;
    }
    await mouse.releaseButton(btn);
  },
  pressKey: async (key) => {
    let nutKey;
    switch (key) {
      case 'ArrowUp':
        nutKey = Key.Up;
        break;
      case 'ArrowDown':
        nutKey = Key.Down;
        break;
      case 'ArrowLeft':
        nutKey = Key.Left;
        break;
      case 'ArrowRight':
        nutKey = Key.Right;
        break;
      default:
        console.error(`Key ${key} not recognized`);
        return;
    }

    await keyboard.pressKey(nutKey);
    await keyboard.releaseKey(nutKey);
  }
});
