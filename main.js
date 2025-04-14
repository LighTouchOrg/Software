const { app, BrowserWindow, ipcMain } = require('electron/main')
const { SerialPort } = require('serialport')
const path = require('node:path')

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('./src/index.html')
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  createWindow()

  const port = new SerialPort({
    path: process.platform === 'win32' ? 'COM3' : '/dev/rfcomm0',
    baudRate: 9600,
    autoOpen: true
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  port.on('open', () => {
    console.log('Serial port opened');
  });
  
  port.on('data', (data) => {
    const decoded = data.toString().trim();
    console.log('Received:', decoded);
  });
  
  port.on('error', (err) => {
    console.error('Serial port error:', err.message);
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
