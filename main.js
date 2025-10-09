const { app, BrowserWindow, ipcMain } = require("electron/main");
const net = require("net");
const path = require("node:path");
const { spawn } = require("child_process");

let appInitialized = false;

app.commandLine.appendSwitch("enable-experimental-web-platform-features");

const client = new net.Socket();

const pythonServer = spawn(
  "python",
  [
    path.join(
      app.isPackaged ? process.resourcesPath : "resources",
      "server",
      "server.py"
    ),
  ],
  {
    stdio: ["pipe", "pipe", "pipe"],
  }
).on("error", (err) => {
  console.error("Failed to start Python process:", err);
});

let connectedOnce = false;

pythonServer.stdout.on("data", (data) => {
  const output = data.toString();
  console.log(output);

  if (!connectedOnce && output.includes("Python server is ready")) {
    console.log("Attempting to connect to Python server...");
    client.connect(9000, "127.0.0.1", () => {
      console.log("Successfully connected to Python Bluetooth backend");
      connectedOnce = true;
    });
  }
});

pythonServer.stderr.on("data", (data) => {
  console.error(`Python server error: ${data}`);
});

pythonServer.on("close", (code) => {
  console.log(`Python server exited with code ${code}`);
});

client.on("data", (data) => {
  const receivedData = data.toString();
  console.log("Received from Python:", receivedData);
  if (win) {
    win.webContents.send("python-data", receivedData);
  }
});

client.on("error", (err) => {
  console.error("Connection connection closed:", err.code);
});

client.on("close", () => {
  console.log("Connection to Python server closed");
});

let win;
let splash;
const iconPath = path.join(__dirname, "src", "img/lightouch-logo.png");

const createWindow = () => {
  // Splash window (simple, fast-loading)
  splash = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    icon: iconPath,
    backgroundColor: "#121212",
  });
  splash.loadFile(path.join(__dirname, "src", "splash.html"));

  // Main window (hidden until ready)
  win = new BrowserWindow({
    width: 1150,
    height: 875,
    autoHideMenuBar: true, // To open devtools, press Ctrl+Shift+I
    icon: iconPath,
    show: false,
    backgroundColor: "#121212", // Match your app's theme color
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Use absolute path to avoid any resolution delay
  win.loadFile(path.join(__dirname, "src", "index.html"));

  // Reveal main window only when it's ready; close splash
  win.once("ready-to-show", () => {
    if (splash && !splash.isDestroyed()) {
      splash.close();
      splash = null;
    }
    win.show();
  });

  // Fallback: if load fails, still close splash and show window
  win.webContents.on("did-fail-load", () => {
    if (splash && !splash.isDestroyed()) {
      splash.close();
      splash = null;
    }
    win.show();
  });
};

app.whenReady().then(async () => {
  ipcMain.handle("ping", () => "pong");

  ipcMain.handle("check-app-initialized", () => {
    if (!appInitialized) {
      appInitialized = true; // Set the flag to true
      return true; // Indicate that this is the first load
    }
    return false; // Indicate that the app has already been initialized
  });

  ipcMain.on("send-to-python", (event, data) => {
    if (client && client.writable) {
      console.log("Sending to Python:", data);
      client.write(data);
    }
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    pythonServer.kill();
  }
});
