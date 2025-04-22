const { app, BrowserWindow, ipcMain } = require('electron/main');
const net = require('net');
const path = require('node:path');
const { spawn } = require('child_process');

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

const client = new net.Socket();

const pythonServer = spawn('python', [path.join(__dirname, 'server.py')], {
  stdio: ['pipe', 'pipe', 'pipe']
}).on('error', (err) => {
  console.error('Failed to start Python process:', err);
});

pythonServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Attempting to connect to Python server...');
  client.connect(9000, '127.0.0.1', () => {
    console.log('Successfully connected to Python Bluetooth backend');
    client.write('Hello world');
  });
});

pythonServer.stderr.on('data', (data) => {
  console.error(`Python server error: ${data}`);
});

pythonServer.on('close', (code) => {
  console.log(`Python server exited with code ${code}`);
});

client.on('data', (data) => {
  console.log('Received from Python:', data.toString());
});

client.on('error', (err) => {
  console.error('Connection connection closed:', err.code);
});

client.on('close', () => {
  console.log('Connection to Python server closed');
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
    pythonServer.kill();
  }
});
