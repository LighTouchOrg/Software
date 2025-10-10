const { app, BrowserWindow, ipcMain } = require("electron/main");
const net = require("net");
const path = require("node:path");
const { spawn } = require("child_process");
const { generateWifiQRCode } = require('wifi-qr-code-generator');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
const iconPath = path.join(__dirname, "src", "img/lightouch-logo.png");

const createWindow = () => {
  win = new BrowserWindow({
    width: 1150,
    height: 875,
    autoHideMenuBar: true, // To open devtools, press Ctrl+Shift+I
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("./src/index.html");
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

  // WiFi QR Code functionality
  ipcMain.handle('generate-wifi-qr', async (event, ssid, password, security) => {
    try {
      console.log('Génération QR pour:', { ssid, hasPassword: !!password, security });
      
      const qrCode = await generateWifiQRCode({
        ssid: ssid,
        password: password || '',
        encryption: security === 'nopass' ? 'nopass' : security,
        hiddenSSID: false,
        outputFormat: { 
          type: 'image/png',
          width: 400,
          height: 400
        }
      });
      
      return { 
        success: true, 
        qrCode: qrCode 
      };
    } catch (error) {
      console.error('Erreur génération QR:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

  ipcMain.handle('refresh-wifi', async () => {
    return await getCompleteWiFiInfo();
  });

  createWindow();
});

// WiFi Helper Functions
async function getCurrentSSID() {
  try {
    const { stdout } = await execPromise('netsh wlan show interfaces', { 
      encoding: 'buffer'
    });
    
    const output = stdout.toString('latin1');
    
    const ssidMatch = output.match(/SSID\s*:\s*(.+)/i) || 
                      output.match(/Nom du réseau\s*:\s*(.+)/i);
    
    if (ssidMatch) {
      return ssidMatch[1].trim();
    }
    
    return null;
  } catch (error) {
    console.error('Erreur récupération SSID:', error);
    return null;
  }
}

async function getWiFiPassword(ssid) {
  if (!ssid) return null;
  
  try {
    const { stdout } = await execPromise(
      `chcp 65001 && netsh wlan show profile name="${ssid}" key=clear`,
      { 
        encoding: 'buffer',
        shell: 'cmd.exe'
      }
    );
    
    const output = stdout.toString('utf8');
    
    const passwordMatch = output.match(/Key Content\s*:\s*(.+)/i) || 
                         output.match(/Contenu de la clé\s*:\s*(.+)/i) ||
                         output.match(/Contenu de cl.\s*:\s*(.+)/i);
    
    if (passwordMatch) {
      return passwordMatch[1].trim();
    }
    
    return null;
  } catch (error) {
    console.error('Erreur récupération mot de passe:', error.message);
    return null;
  }
}

async function getWiFiSecurity(ssid) {
  if (!ssid) return 'WPA';
  
  try {
    const { stdout } = await execPromise(
      `netsh wlan show profile name="${ssid}"`,
      { 
        encoding: 'buffer',
        shell: 'cmd.exe'
      }
    );
    
    const output = stdout.toString('latin1');
    
    const authMatch = output.match(/Authentication\s*:\s*(.+)/i) ||
                     output.match(/Authentification\s*:\s*(.+)/i);
    
    if (authMatch) {
      const auth = authMatch[1].trim().toUpperCase();
      if (auth.includes('WPA2') || auth.includes('WPA')) {
        return 'WPA';
      } else if (auth.includes('WEP')) {
        return 'WEP';
      } else if (auth.includes('OPEN')) {
        return 'nopass';
      }
    }
    
    return 'WPA';
  } catch (error) {
    console.error('Erreur récupération sécurité:', error);
    return 'WPA';
  }
}

async function getWiFiSignal() {
  try {
    const { stdout } = await execPromise('netsh wlan show interfaces', {
      encoding: 'buffer'
    });
    
    const output = stdout.toString('latin1');
    
    const signalMatch = output.match(/Signal\s*:\s*(\d+)%/i) ||
                       output.match(/Signal\s*:\s*(\d+)\s*%/i);
    
    if (signalMatch) {
      return parseInt(signalMatch[1]);
    }
    
    return null;
  } catch (error) {
    console.error('Erreur récupération signal:', error);
    return null;
  }
}

async function getCompleteWiFiInfo() {
  try {
    console.log('Début détection WiFi...');
    
    const ssid = await getCurrentSSID();
    console.log('SSID détecté:', ssid);
    
    if (!ssid) {
      return {
        success: false,
        error: 'Aucune connexion WiFi active détectée'
      };
    }
    
    const password = await getWiFiPassword(ssid);
    console.log('Mot de passe récupéré:', password ? '✓' : '✗');
    
    const security = await getWiFiSecurity(ssid);
    console.log('Sécurité:', security);
    
    const signal = await getWiFiSignal();
    console.log('Signal:', signal);
    
    return {
      success: true,
      ssid: ssid,
      password: password,
      security: security,
      signal: signal
    };
  } catch (error) {
    console.error('Erreur complète:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    pythonServer.kill();
  }
});
