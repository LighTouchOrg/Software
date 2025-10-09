// main.js - Processus principal Electron
const { app, BrowserWindow, ipcMain } = require('electron');
const { generateWifiQRCode } = require('wifi-qr-code-generator');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // Détecter le WiFi automatiquement au lancement
  mainWindow.webContents.on('did-finish-load', async () => {
    const wifiInfo = await getCompleteWiFiInfo();
    mainWindow.webContents.send('wifi-detected', wifiInfo);
  });
}

// Fonction pour obtenir le SSID actuel avec le bon encodage
async function getCurrentSSID() {
  try {
    const { stdout } = await execPromise('netsh wlan show interfaces', { 
      encoding: 'buffer'
    });
    
    // Décoder en utilisant le code page Windows (cp850 ou cp1252)
    const output = stdout.toString('latin1');
    
    // Chercher le SSID dans différentes langues
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

// Fonction pour obtenir le mot de passe avec le bon encodage
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
    
    // Décoder en UTF-8
    const output = stdout.toString('utf8');
    
    // Chercher le mot de passe dans différentes langues
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

// Fonction pour obtenir le type de sécurité
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
    
    // Chercher le type d'authentification
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

// Fonction pour obtenir la force du signal
async function getWiFiSignal() {
  try {
    const { stdout } = await execPromise('netsh wlan show interfaces', {
      encoding: 'buffer'
    });
    
    const output = stdout.toString('latin1');
    
    // Chercher le signal
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

// Fonction principale pour obtenir toutes les infos WiFi
async function getCompleteWiFiInfo() {
  try {
    console.log('Début détection WiFi...');
    
    // 1. Obtenir le SSID
    const ssid = await getCurrentSSID();
    console.log('SSID détecté:', ssid);
    
    if (!ssid) {
      return {
        success: false,
        error: 'Aucune connexion WiFi active détectée'
      };
    }
    
    // 2. Obtenir le mot de passe
    const password = await getWiFiPassword(ssid);
    console.log('Mot de passe récupéré:', password ? '✓' : '✗');
    
    // 3. Obtenir le type de sécurité
    const security = await getWiFiSecurity(ssid);
    console.log('Sécurité:', security);
    
    // 4. Obtenir le signal
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

// Générer le QR code
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

// Rafraîchir la détection WiFi
ipcMain.handle('refresh-wifi', async () => {
  return await getCompleteWiFiInfo();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});