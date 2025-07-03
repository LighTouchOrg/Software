const { contextBridge, ipcRenderer } = require("electron");
const { mouse, straightTo, Point, keyboard, Key, Button } = require("@nut-tree-fork/nut-js");

contextBridge.exposeInMainWorld("electronAPI", {
  onPythonData: (callback) => ipcRenderer.on('python-data', callback),
  sendToPython: (data) => ipcRenderer.send('send-to-python', data),
  moveMouse: async (x, y) => {
    if (typeof x === "string") x = parseFloat(x);
    if (typeof y === "string") y = parseFloat(y);

    if (typeof x !== "number" || isNaN(x)) {
      throw new Error(`Invalid x coordinate: ${x}`);
    }
    if (typeof y !== "number" || isNaN(y)) {
      throw new Error(`Invalid y coordinate: ${y}`);
    }

    mouse.config.mouseSpeed = 2000; // move speed
    await mouse.move(straightTo(new Point(x, y)));
  },
  pressMouse: async (x, y, btn="LEFT") => {
    // If x or y are not provided, press at the current position
    if (typeof x !== "undefined" && typeof y !== "undefined") {
      if (typeof x === "string") x = parseFloat(x);
      if (typeof y === "string") y = parseFloat(y);

      if (typeof x !== "number" || isNaN(x)) {
        throw new Error(`Invalid x coordinate: ${x}`);
      }
      if (typeof y !== "number" || isNaN(y)) {
        throw new Error(`Invalid y coordinate: ${y}`);
      }

      await mouse.move(straightTo(new Point(x, y)));
    }

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
    // If x or y are not provided, release at the current position
    if (typeof x !== "undefined" && typeof y !== "undefined") {
      if (typeof x === "string") x = parseFloat(x);
      if (typeof y === "string") y = parseFloat(y);

      if (typeof x !== "number" || isNaN(x)) {
        throw new Error(`Invalid x coordinate: ${x}`);
      }
      if (typeof y !== "number" || isNaN(y)) {
        throw new Error(`Invalid y coordinate: ${y}`);
      }

      await mouse.move(straightTo(new Point(x, y)));
    }

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

    if (key.startsWith("Arrow")) {
        switch (key) {
            case 'ArrowUp': nutKey = Key.Up; break;
            case 'ArrowDown': nutKey = Key.Down; break;
            case 'ArrowLeft': nutKey = Key.Left; break;
            case 'ArrowRight': nutKey = Key.Right; break;
        }
    } else {
        const upperKey = key.length === 1 ? key.toUpperCase() : key;
        nutKey = Key[upperKey];
    }

    if (!nutKey) {
        console.error(`Key "${key}" not recognized in nut.js Key map`);
        return;
    }

    await keyboard.pressKey(nutKey);
    await keyboard.releaseKey(nutKey);
  }
});

localStorage.setItem('deviceStatusString', "");
localStorage.setItem('deviceStatusColor', "");
