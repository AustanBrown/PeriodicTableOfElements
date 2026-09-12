// Update checking, alerting, and — where the platform allows it — self-updating.
//
// Checking is only an HTTPS request for a metadata file, so it is safe everywhere.
// What differs per platform is what we can do about an update that exists:
//
//   Windows (NSIS)    replaces itself, unsigned builds included
//   Linux AppImage    replaces itself, provided its directory is user-writable
//   Linux .deb        cannot: there is no AppImage for the updater to rewrite
//   macOS             cannot: an unsigned build is rejected by the OS
//
// The builds that can't self-update still tell the user, then send them to the
// releases page to download by hand.
const { app, dialog, shell } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

const RELEASES_URL = 'https://github.com/AustanBrown/PeriodicTableOfElements/releases/latest';

// A packaged app has no console, so updater diagnostics go to electron-log's file
// transport instead (~/.config/<app>/logs/main.log, and the platform equivalents).
autoUpdater.logger = log;
log.transports.file.level = 'info';

// Tell the user first; download only once they agree.
autoUpdater.autoDownload = false;
// If they decline the restart, install the update the next time the app quits.
autoUpdater.autoInstallOnAppQuit = true;

/** @type {() => (import('electron').BrowserWindow | null)} */
let getWindow = () => null;
let openExternally = url => shell.openExternal(url);

// Set false by the Help menu item: a check the user asked for reports its outcome
// either way, while the one on launch stays quiet unless there's an update.
let silent = true;
// Guards against stacking dialogs when the menu item is clicked repeatedly.
let checkInFlight = false;

// True only for a build that can actually replace itself in place.
const canSelfUpdate = () =>
{
  if (!app.isPackaged) return false;                                // unpackaged dev run
  if (process.platform === 'darwin') return false;                  // unsigned: macOS refuses
  if (process.platform === 'linux') return !!process.env.APPIMAGE;  // .deb has nothing to replace
  return true;                                                      // Windows NSIS
};

const alert = options =>
{
  const window = getWindow();
  return window ? dialog.showMessageBox(window, options) : dialog.showMessageBox(options);
};

autoUpdater.on('update-available', async info =>
{
  const selfUpdate = canSelfUpdate();

  const { response } = await alert({
    type: 'info',
    title: 'Update available',
    message: `Version ${info.version} is available.`,
    detail: selfUpdate
      ? `You have ${app.getVersion()}. Download it now?`
      : `You have ${app.getVersion()}. This build can't update itself, so the download page will open in your browser.`,
    buttons: selfUpdate ? ['Download', 'Later'] : ['Open Releases Page', 'Later'],
    defaultId: 0,
    cancelId: 1
  });

  if (response !== 0)
  {
    checkInFlight = false;
    return;
  }

  if (!selfUpdate)
  {
    openExternally(RELEASES_URL);
    checkInFlight = false;
    return;
  }

  autoUpdater.downloadUpdate().catch(error => log.error('Update download failed', error));
});

autoUpdater.on('update-not-available', () =>
{
  checkInFlight = false;
  if (silent) return;

  alert({
    type: 'info',
    title: 'No updates',
    message: `You're on the latest version (${app.getVersion()}).`,
    buttons: ['OK']
  });
});

// Progress on the taskbar/dock button, which costs one line and needs no IPC.
autoUpdater.on('download-progress', progress =>
{
  getWindow()?.setProgressBar(progress.percent / 100);
});

autoUpdater.on('update-downloaded', async info =>
{
  checkInFlight = false;
  getWindow()?.setProgressBar(-1);

  const { response } = await alert({
    type: 'info',
    title: 'Update ready',
    message: `Version ${info.version} is ready to install.`,
    detail: "The app needs to restart to finish installing. If you'd rather wait, it will install the next time you quit.",
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1
  });

  if (response !== 0) return;

  // Calling quitAndInstall straight out of the dialog callback is a known hang.
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
});

autoUpdater.on('error', async error =>
{
  checkInFlight = false;
  getWindow()?.setProgressBar(-1);
  log.error('Update check failed', error);

  if (silent) return;

  const { response } = await alert({
    type: 'error',
    title: 'Update check failed',
    message: "Couldn't check for updates.",
    detail: String(error?.message ?? error),
    buttons: ['Open Releases Page', 'Close'],
    defaultId: 1,
    cancelId: 1
  });

  if (response === 0) openExternally(RELEASES_URL);
});

/**
 * @param {object} [options]
 * @param {boolean} [options.silent] False reports the outcome even when there is no
 *   update, and surfaces errors. Used by the Help menu item.
 */
const checkForUpdates = ({ silent: quiet = true } = {}) =>
{
  if (checkInFlight) return;

  // An unpackaged build has no app-update.yml to read, so the updater would only
  // throw. autoUpdater.forceDevUpdateConfig is the documented opt-in for rehearsing
  // the flow against a local feed in development.
  if (!app.isPackaged && !autoUpdater.forceDevUpdateConfig)
  {
    log.info('Skipping update check: not a packaged build.');

    if (!quiet)
    {
      alert({
        type: 'info',
        title: 'Updates unavailable',
        message: 'Updates only apply to installed builds.',
        buttons: ['OK']
      });
    }

    return;
  }

  silent = quiet;
  checkInFlight = true;

  autoUpdater.checkForUpdates().catch(error =>
  {
    // The error event handles reporting; this catch stops an unhandled rejection.
    checkInFlight = false;
    log.error('Update check rejected', error);
  });
};

/**
 * @param {object} [options]
 * @param {() => (import('electron').BrowserWindow | null)} [options.getWindow] Parent
 *   for the dialogs, read lazily because the window is replaced on macOS re-activate.
 * @param {(url: string) => void} [options.openExternally] Reuses main.cjs's http/https
 *   gated opener rather than calling shell.openExternal from here.
 */
const initUpdater = (options = {}) =>
{
  if (options.getWindow) getWindow = options.getWindow;
  if (options.openExternally) openExternally = options.openExternally;
};

module.exports = { initUpdater, checkForUpdates };
