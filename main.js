const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // required for direct DOM/Web API access
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('./src/index.html')
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
