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

let connectedOnce = false;

pythonServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  if (!connectedOnce && output.includes("Python server is ready")) {
    console.log('Attempting to connect to Python server...');
    client.connect(9000, '127.0.0.1', () => {
      console.log('Successfully connected to Python Bluetooth backend');
      connectedOnce = true;
    });
  }
});

pythonServer.stderr.on('data', (data) => {
  console.error(`Python server error: ${data}`);
});

pythonServer.on('close', (code) => {
  console.log(`Python server exited with code ${code}`);
});

client.on('data', (data) => {
  const receivedData = data.toString();
  console.log('Received from Python:', receivedData);
  if (win) {
    win.webContents.send('python-data', receivedData);
  }
});

client.on('error', (err) => {
  console.error('Connection connection closed:', err.code);
});

client.on('close', () => {
  console.log('Connection to Python server closed');
});

let win;
const iconPath = path.join(__dirname, "src", "img/lightouch-logo.png");

const createWindow = () => {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: iconPath,
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

  ipcMain.on('send-to-python', (event, data) => {
    if (client && client.writable) {
      console.log('Sending to Python:', data);
      client.write(data);
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    pythonServer.kill();
  }
});
