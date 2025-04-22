const { app, BrowserWindow, ipcMain } = require('electron/main');
const net = require('net');
const path = require('node:path');

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

const client = new net.Socket();

client.connect(9000, '127.0.0.1', () => {
  console.log('Connected to Python Bluetooth backend');

  client.write('helloworld');
});

client.on('data', (data) => {
  console.log('Received from Python:', data.toString());
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});

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

app.whenReady().then(async () => {
  ipcMain.handle('ping', () => 'pong');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
