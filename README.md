# Later

**Later** is a lightweight floating to-do list for Windows. Keep a small peek button at the edge of your screen, then open the full task panel when you need it.

## Install or update

For normal use, download the latest **Later-Setup** installer from [GitHub Releases](https://github.com/Kranti2912/Later-To-Do/releases/latest) and double-click it. The one-click installer updates an existing copy, keeps saved tasks and the selected theme, creates Start menu and desktop shortcuts, and opens Later when installation finishes. No separate runtime or setup steps are needed.

Later is built for Windows x64. Installers are unsigned; download them from this repository's Releases page.

## Features

- Floating peek button that docks to and moves along a screen edge
- Expanded task panel with adjustable size and content-aware height
- Add, complete, and delete tasks
- Dark and light themes, with a higher-contrast translucent light theme
- Task list, theme, edge, and panel size saved between launches
- Start-at-login behavior and a system tray menu
- Keyboard shortcut: **Ctrl + Shift + Space** to bring Later into view
- Screenshot-friendly visibility recovery for the Windows snipping overlay

## Use Later

- Click the eye button to open the task panel.
- Click **−** to return to peek mode.
- Drag the peek button along an edge to reposition it.
- Drag the expanded title bar to move the panel, or drag its edges to resize it.
- Click **Quit** to exit Later. Your tasks remain saved for the next launch.

## Your data and privacy

Tasks and preferences are stored locally in Later's per-user Windows application data. Later does not upload or sync your task list. User data, installer binaries, build output, and dependency caches are excluded from the source repository. Uninstalling Later does not delete its local task data.

## Build from source

Requirements: Node.js LTS and npm.

```powershell
npm ci
npm start
npm run dist
```

The Windows installer is written to `dist/`. Pushing a version tag builds an installer and attaches it to a GitHub Release.

## Project layout

```text
src/                    Electron main process and UI
src/assets/             App assets
.github/workflows/      Windows build and release automation
installer.nsh           Installer upgrade behavior
```

See [CHANGELOG.md](CHANGELOG.md) for release notes. Available source snapshots are identified by Git tags, including `v1.0.3` and `v1.0.14`.
