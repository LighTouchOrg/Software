const { app, BrowserWindow, ipcMain } = require('electron/main');
const { SerialPort } = require('serialport');
const serialport = require('serialport');
const path = require('node:path');

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('./src/index.html');
};

const findActiveBluetoothPort = async () => {
  const ports = await serialport.SerialPort.list();
  for (const port of ports) {
    const desc = port.manufacturer ? port.manufacturer.toLowerCase() : '';
    const hwid = port.pnpId ? port.pnpId.toLowerCase() : '';

    // Heuristic: skip "empty" ports, pick the one with a MAC-like ID
    if (hwid.includes('bthenum') && !hwid.includes('000000000000')) {
      console.log(`Found active Bluetooth port: ${port.path} (${desc})`);
      return port.path;
    }
  }
  return null;
};

app.whenReady().then(async () => {
  ipcMain.handle('ping', () => 'pong');
  createWindow();

  const portPath = await findActiveBluetoothPort();

  if (!portPath) {
    console.log("Could not find an active Bluetooth serial port.");
    return;
  }

  console.log(`Connecting to ${portPath}...`);
  const port = new SerialPort({
    path: portPath,
    baudRate: 9600,
    autoOpen: true,
  });

  port.on('open', () => {
    console.log('Serial port opened');
    port.write('helloworldProut\n');
  });

  port.on('data', (data) => {
    const decoded = data.toString().trim();
    if (decoded) {
      console.log('Received:', decoded);
    }
  });

  port.on('error', (err) => {
    console.error('Serial port error:', err.message);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});