# Later

Later is a floating Windows to-do list. Its edge-docked peek button opens a compact task panel when needed.

## Install

Download `Later-Setup-1.0.3.exe` from the [GitHub Releases](https://github.com/Kranti2912/Later-To-Do/releases/latest) and double-click it. The installer creates desktop and Start menu shortcuts and launches Later. No Node.js or developer setup is needed to use the installer.

Later is built for Windows x64. Releases are unsigned; download installers from this repository's Releases page.

## Features

- Add, complete, and remove tasks
- Keep the task panel available as a floating window
- Switch between dark and light themes
- Save tasks and preferences locally between launches
- Move the compact peek button along a screen edge

## Controls

- **Ctrl + Shift + Space** — bring Later into view
- Click the eye button — open the task panel
- Click **−** — return to peek mode
- Drag the peek button along the screen edge — reposition it
- Drag the expanded title bar — move the panel; release it at a screen edge to dock it

## Privacy

Tasks and preferences are stored locally for the current Windows account. Later does not upload or sync the task list.

## Build from source

Requirements: Node.js LTS and npm.

```powershell
npm ci
npm start
npm run dist
```

The Windows installer is created in `dist/`. Do not commit generated installers, build output, or local task data.

## License

MIT. See [LICENSE](LICENSE).
