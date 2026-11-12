const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const isDev = !app.isPackaged && process.env.ELECTRON_START_URL;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#000000',
    title: 'Star Crawler',
    icon: path.join(__dirname, '../Bilder/Icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    autoHideMenuBar: true,
  });

  // Menü minimal halten, aber DevTools per F12 erlauben
  Menu.setApplicationMenu(null);

  if (isDev) {
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    mainWindow.loadURL(startUrl);
    // DevTools optional: mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
    if ((input.control || input.meta) && input.key.toLowerCase() === 'r') {
      mainWindow.reload();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Sicherheit: keine neuen Fenster über window.open - im selben Fenster
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});
