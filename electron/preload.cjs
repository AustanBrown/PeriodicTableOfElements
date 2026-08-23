const { contextBridge } = require('electron');

// The web build has no `window.desktop`, so the Vue app can feature-detect the
// desktop shell with `if (window.desktop)` and stay identical in both targets.
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
  versions: {
    app: process.env.npm_package_version ?? null,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});
