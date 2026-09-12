# Periodic Table of Elements.

A simple project showing the periodic table of elements. Built using [Tailwind CSS](https://tailwindcss.com/), [Vue.js](https://vuejs.org), [Vite.js](https://vitejs.dev/) and [Headless UI](https://headlessui.com/). The periodic table data is referenced from [Bowserinator](https://github.com/Bowserinator/Periodic-Table-JSON/blob/master/PeriodicTableJSON.json).

It runs both as a web app and as a desktop app. Both targets are built from the same Vue source — the desktop version is an [Electron](https://www.electronjs.org/) window wrapping the same built output.

## Installation
This project requires a stable version of Node.js and NPM. First clone the repository into your local environment:

```bash
git clone https://github.com/AustanBrown/PeriodicTableOfElements
```

Then install all the dependencies:
```bash
npm install
```

## Web

To run the project, execute the command ``` npm run dev ``` and point your browser to [localhost:5173](http://localhost:5173).

To build the web app into ``` dist/ ``` and preview that build:
```bash
npm run build
npm run preview
```

## Desktop

The desktop app is the same Vue app running inside an Electron window. Nothing about the web version changes — ``` npm run dev ``` and ``` npm run build ``` behave exactly as before.

### Running it

To run the desktop app in development, with hot module reload and devtools:
```bash
npm run electron:dev
```

This starts the Vite dev server and opens the Electron window against it. Edits to anything in ``` src/ ``` reload live, the same as in the browser. Changes to ``` electron/main.cjs ``` are not hot-reloaded — quit and re-run after editing the main process.

Extra flags are passed straight through to Electron:
```bash
npm run electron:dev -- --no-sandbox
```

To build the web assets and run the desktop app against them, which is how a packaged build behaves:
```bash
npm run electron:start
```

### Building distributables

Packaged output goes to ``` release/ ```, which is generated and git-ignored.

```bash
npm run electron:build         # current platform
npm run electron:build:linux   # AppImage + .deb
npm run electron:build:win     # NSIS installer
npm run electron:build:mac     # DMG + zip
```

Each produces:

| Command | Output in ``` release/ ``` |
| --- | --- |
| ``` electron:build:linux ``` | ``` periodic-table-elements-<version>-linux-x64.AppImage ``` and ``` periodic-table-elements-<version>-linux-x64.deb ``` |
| ``` electron:build:win ``` | ``` periodic-table-elements-<version>-win-x64.exe ``` plus an unpacked app in ``` win-unpacked/ ``` |
| ``` electron:build:mac ``` | ``` periodic-table-elements-<version>-mac-x64.dmg ``` and a matching ``` .zip ```, which the updater needs |

To target a specific architecture, pass the flag through:
```bash
npm run electron:build:linux -- --arm64
npm run electron:build:linux -- --x64 --arm64
```

### Building for a platform you are not on

Electron itself cross-compiles fine — the per-platform binaries are just downloaded. The limits come from the native tools each installer format needs:

| Building on | Linux targets | Windows targets | macOS targets |
| --- | --- | --- | --- |
| **Linux** | Yes | Unpacked ``` .exe ``` yes; NSIS installer needs Wine | No |
| **macOS** | Yes | Needs Wine | Yes |
| **Windows** | Needs WSL | Yes | No |

Two things to know:

- **Windows installers from Linux or macOS need Wine.** Without it the build gets as far as producing ``` release/win-unpacked/Periodic Table of Elements.exe ``` — a working app directory you can copy to a Windows machine — and then fails at the installer step with ``` spawn wine ENOENT ```. Install Wine (``` sudo apt install wine ``` on Debian/Ubuntu) and the NSIS step completes. Note that the failed run still leaves a ``` periodic-table-elements-1.0.0-win-x64.exe ``` behind, but at a few hundred KB it is only the installer stub without the app payload — delete it rather than shipping it.
- **macOS builds need macOS.** The DMG step shells out to ``` sips ``` and other Apple tools that only exist there, so building from Linux fails with ``` spawn sips ENOENT ```. There is no way around this; use a Mac or a macOS CI runner.

If you would rather not install Wine, the [electron-builder Docker image](https://www.electron.build/multi-platform-build#docker) bundles the Linux and Windows toolchains:
```bash
docker run --rm -ti -v ${PWD}:/project -w /project \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run electron:build:win"
```

### Installing the built app

**Linux, AppImage** — self-contained, no install needed:
```bash
chmod +x release/periodic-table-elements-1.0.0-linux-x64.AppImage
./release/periodic-table-elements-1.0.0-linux-x64.AppImage
```

**Linux, .deb** — installs to ``` /opt ``` and adds a desktop entry, so it shows up in your application menu:
```bash
sudo apt install ./release/periodic-table-elements-1.0.0-linux-x64.deb
```
Uninstall with ``` sudo apt remove periodic-table-elements ```.

**Windows** — run ``` periodic-table-elements-1.0.0-win-x64.exe ```. It is a per-user install that lets you choose the directory, so it needs no administrator rights.

**macOS** — open the ``` .dmg ``` and drag the app into Applications. The build is unsigned, so the first launch needs right-click → Open, or Gatekeeper will refuse it. The ``` .zip ``` beside it is not for manual installation; it is the artifact the updater reads.

### Releasing

Releases are published to [GitHub Releases](https://github.com/AustanBrown/PeriodicTableOfElements/releases), which is also the update feed the app checks.

Bump the version first. ``` npm version ``` writes ``` package.json ```, commits the change and creates a matching ``` vX.Y.Z ``` tag:
```bash
npm version 1.0.1
git push --follow-tags
```

Then build and publish, once per platform:
```bash
npx electron-builder --linux --publish always
npx electron-builder --win --publish always
npx electron-builder --mac --publish always
```

The same cross-platform limits as above apply — Windows builds need Windows, macOS builds need macOS — so in practice a GitHub Actions matrix over ``` ubuntu-latest ```, ``` windows-latest ``` and ``` macos-latest ```, all publishing to the same tag, is the only way to get all three in one release.

Three things to know:

- **Publishing needs a token.** Set ``` GH_TOKEN ``` to a personal access token with ``` repo ``` scope before running with ``` --publish ```. This is only for whoever publishes; the repository is public, so end users downloading updates need no token at all. In GitHub Actions use the built-in ``` GITHUB_TOKEN ``` with ``` permissions: contents: write ``` on the job.
- **Releases are created as drafts** (``` releaseType: draft ``` in ``` electron-builder.yml ```). electron-updater ignores drafts, so nobody is offered a half-uploaded build while the other platforms are still running. Publish the release by hand once every platform's assets are attached.
- **The update feed files must be in the release.** Alongside the binaries, electron-builder uploads ``` latest.yml ``` (Windows), ``` latest-linux.yml ``` and ``` latest-mac.yml ```. If one is missing, clients on that platform fail with ``` Cannot find latest.yml in the latest release artifacts ```.

### Updates

The app checks GitHub Releases on launch, and there is a **Check for Updates…** item in the Help menu to check on demand. When a newer version exists the app says so, downloads it only after you agree, and then offers to restart and install.

Self-updating works on Windows, via the NSIS installer, and on the Linux AppImage — for the AppImage the directory it sits in must be writable by the user running it.

It does not work everywhere:

- **The Linux .deb cannot self-update.** electron-updater's Linux support is built around the AppImage environment, which a ``` /opt ``` install does not provide.
- **macOS cannot self-update.** Squirrel.Mac only accepts signed, notarised builds, which needs a paid Apple Developer ID; these builds are unsigned.

On both of those the app still tells you an update is available and opens the releases page so you can download the new build yourself.

### Security notes

The renderer runs with context isolation on, node integration off and the sandbox on, so the app's pages get no access to Node. The only thing exposed to them is a read-only ``` window.desktop ``` object, which the web build does not have — handy if you ever want to branch on the target. External links, such as an element's Wikipedia source link, open in your real browser instead of inside the app window.

Before publishing a build, set a real ``` maintainer ``` address in ``` electron-builder.yml ``` — the current value is a placeholder, and the ``` .deb ``` target requires it.

## Project structure

| Path | Purpose |
| --- | --- |
| ``` src/ ``` | The Vue app, shared by both targets |
| ``` data/ ``` | The periodic table JSON, bundled at build time |
| ``` electron/main.cjs ``` | Electron main process: window, app menu, external links |
| ``` electron/preload.cjs ``` | Context-isolated preload exposing ``` window.desktop ``` |
| ``` scripts/electron-dev.mjs ``` | Starts Vite in-process, then launches Electron against it |
| ``` electron-builder.yml ``` | Packaging configuration |
| ``` build/ ``` | Icon assets |

## License

[MIT](https://choosealicense.com/licenses/mit/)
