const { app, BrowserWindow, Menu, shell, nativeImage } = require('electron');
const path = require('node:path');

// Set by `npm run electron:dev` so the window points at Vite's dev server
// instead of the built files in ./dist.
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const isDev = !!devServerUrl;

const rootDir = path.join(__dirname, '..');
const indexHtml = path.join(rootDir, 'dist', 'index.html');
const iconPath = path.join(rootDir, 'build', 'icon.png');

/** @type {BrowserWindow | null} */
let mainWindow = null;

const protocolOf = url =>
{
  try { return new URL(url).protocol; }
  catch { return ''; }
};

const openExternally = url =>
{
  if (protocolOf(url) === 'http:' || protocolOf(url) === 'https:') shell.openExternal(url);
};

const createWindow = () =>
{
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: '#ffffff',
    show: false,
    title: 'Periodic Table of Elements',
    icon: process.platform === 'linux' ? nativeImage.createFromPath(iconPath) : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Avoid the white flash while Vue mounts.
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  if (isDev)
  {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  else
  {
    mainWindow.loadFile(indexHtml);
  }

  mainWindow.webContents.on('did-fail-load', (_e, code, description, url) =>
  {
    console.error(`Failed to load ${url}: ${description} (${code})`);
  });

  // Anything that isn't the app itself belongs in the user's real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) =>
  {
    openExternally(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) =>
  {
    const isInternal = isDev ? url.startsWith(devServerUrl) : url.startsWith('file://');
    if (isInternal) return;

    event.preventDefault();
    openExternally(url);
  });
};

const buildMenu = () =>
{
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: isMac
        ? [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }]
        : [{ role: 'minimize' }, { role: 'close' }]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Project on GitHub',
          click: () => shell.openExternal('https://github.com/AustanBrown/PeriodicTableOfElements')
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// Second launch should focus the existing window rather than open a new one.
if (!app.requestSingleInstanceLock())
{
  app.quit();
}
else
{
  app.on('second-instance', () =>
  {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() =>
  {
    buildMenu();
    createWindow();

    // macOS keeps the app alive after the last window closes.
    app.on('activate', () =>
    {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () =>
  {
    if (process.platform !== 'darwin') app.quit();
  });

  // Defence in depth: never let the renderer spawn a webview or a new window
  // with elevated privileges.
  app.on('web-contents-created', (_event, contents) =>
  {
    contents.on('will-attach-webview', event => event.preventDefault());
  });
}
