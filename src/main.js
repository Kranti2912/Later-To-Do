const { app, BrowserWindow, globalShortcut, Tray, Menu, screen, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const PEEK_W = 56;
const PEEK_H = 44;
const EXPANDED_W = 560;
const EXPANDED_H = 620;
const EDGE_SNAP = 28;
const DRAG_ARM_DISTANCE = 42;
const SNAP_SETTLE_MS = 180;
const STATE_FILE = path.join(app.getPath('userData'), 'later-state.json');

let win = null;
let tray = null;
let isQuitting = false;
let expandedAnchor = null;
let snapArmed = false;
let snapTimer = null;
let state = {
  edge: 'right',
  offset: null,
  mode: 'peek',
  theme: 'dark'
};
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win || win.isDestroyed()) return;
    if (!win.isVisible()) win.show();
    win.focus();
  });
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        state = {
          ...state,
          edge: ['left', 'right', 'top', 'bottom'].includes(parsed.edge) ? parsed.edge : state.edge,
          offset: parsed.offset !== null && parsed.offset !== undefined && Number.isFinite(Number(parsed.offset))
            ? Number(parsed.offset)
            : state.offset,
          mode: parsed.mode === 'expanded' ? 'expanded' : 'peek',
          theme: parsed.theme === 'light' ? 'light' : 'dark'
        };
      }
    }
  } catch (_) {}
}

function saveState() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (_) {}
}

function workArea() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function boundsFor(edge, offset, mode) {
  const area = workArea();
  const w = mode === 'peek' ? PEEK_W : EXPANDED_W;
  const h = mode === 'peek' ? PEEK_H : EXPANDED_H;
  let x = area.x + Math.round((area.width - w) / 2);
  let y = area.y + Math.round((area.height - h) / 2);

  if (edge === 'left' || edge === 'right') {
    const maxOffset = Math.max(0, area.height - h);
    const requestedOffset = offset === null || offset === undefined || !Number.isFinite(Number(offset))
      ? Math.round(maxOffset * 0.88)
      : Number(offset);
    y = area.y + clamp(requestedOffset, 0, maxOffset);
    x = edge === 'left' ? area.x : area.x + area.width - w;
  } else {
    const maxOffset = Math.max(0, area.width - w);
    const requestedOffset = offset === null || offset === undefined || !Number.isFinite(Number(offset))
      ? Math.round(maxOffset * 0.5)
      : Number(offset);
    x = area.x + clamp(requestedOffset, 0, maxOffset);
    y = edge === 'top' ? area.y : area.y + area.height - h;
  }
  return { x, y, width: w, height: h };
}

function setMode(mode, edge = state.edge, offset = state.offset, persist = true) {
  if (!win || win.isDestroyed()) return;
  if (snapTimer) {
    clearTimeout(snapTimer);
    snapTimer = null;
  }
  if (!['left', 'right', 'top', 'bottom'].includes(edge)) edge = 'right';
  if (mode !== 'expanded') mode = 'peek';
  state.mode = mode;
  state.edge = edge;
  state.offset = offset === null || offset === undefined
    ? null
    : Number.isFinite(Number(offset)) ? Math.round(Number(offset)) : 0;

  // Electron will clamp setSize() to the current minimum size. Temporarily
  // remove the expanded minimum before entering the 44×36 peek state.
  win.setMinimumSize(1, 1);
  const b = boundsFor(state.edge, state.offset, mode);
  win.setBounds(b, false);
  win.setResizable(false);
  win.setAlwaysOnTop(true, 'floating');
  win.webContents.send('mode-changed', { mode, edge: state.edge, theme: state.theme });

  if (mode === 'expanded') {
    win.setMinimumSize(300, 240);
    expandedAnchor = { x: b.x, y: b.y };
    snapArmed = false;
  } else {
    win.setMinimumSize(1, 1);
    expandedAnchor = null;
    snapArmed = false;
  }
  if (persist) saveState();
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'later-tray.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Later™');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show / Hide Later™', click: toggleWindow },
    { label: 'Peek', click: () => setMode('peek') },
    { label: 'Expand', click: () => setMode('expanded') },
    { type: 'separator' },
    { label: 'Quit Later™', click: () => { isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', toggleWindow);
}

function toggleWindow() {
  if (!win || win.isDestroyed()) return;
  if (win.isVisible()) win.hide();
  else { win.show(); win.focus(); }
}

function createWindow() {
  win = new BrowserWindow({
    width: PEEK_W,
    height: PEEK_H,
    minWidth: 1,
    minHeight: 1,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.once('ready-to-show', () => {
    setMode(state.mode, state.edge, state.offset, false);
    win.webContents.send('initial-state', state);
    win.show();
  });

  win.on('move', () => {
    if (state.mode !== 'expanded' || !win.isVisible() || !expandedAnchor) return;
    const moved = win.getBounds();
    if (Math.hypot(moved.x - expandedAnchor.x, moved.y - expandedAnchor.y) >= DRAG_ARM_DISTANCE) {
      snapArmed = true;
    }
    if (!snapArmed) return;

    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      snapTimer = null;
      if (!win || win.isDestroyed() || state.mode !== 'expanded' || !snapArmed) return;
      const b = win.getBounds();
      const area = screen.getDisplayMatching(b).workArea;
      const distances = {
        left: Math.abs(b.x - area.x),
        right: Math.abs((area.x + area.width) - (b.x + b.width)),
        top: Math.abs(b.y - area.y),
        bottom: Math.abs((area.y + area.height) - (b.y + b.height))
      };
      const [edge, distance] = Object.entries(distances).sort((a, b2) => a[1] - b2[1])[0];
      if (distance <= EDGE_SNAP) {
        const offset = (edge === 'left' || edge === 'right') ? (b.y - area.y) : (b.x - area.x);
        setMode('peek', edge, offset);
      } else {
        expandedAnchor = { x: b.x, y: b.y };
        snapArmed = false;
      }
    }, SNAP_SETTLE_MS);
  });

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  loadState();
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
  } else {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args: [app.getAppPath()] });
  }
  createWindow();
  createTray();
  globalShortcut.register('CommandOrControl+Shift+Space', toggleWindow);
});

ipcMain.on('peek', () => setMode('peek'));
ipcMain.on('expand', () => setMode('expanded'));
ipcMain.on('quit', () => { isQuitting = true; saveState(); app.quit(); });
ipcMain.on('theme', (_, theme) => {
  if (theme !== 'dark' && theme !== 'light') return;
  state.theme = theme;
  saveState();
});
ipcMain.on('move-peek', (_, payload) => {
  if (!win || win.isDestroyed() || state.mode !== 'peek' || !payload) return;
  const area = screen.getDisplayMatching(win.getBounds()).workArea;
  const edge = state.edge;
  if (edge === 'left' || edge === 'right') {
    const y = clamp(Number(payload.y) || 0, area.y, area.y + area.height - PEEK_H);
    win.setPosition(edge === 'left' ? area.x : area.x + area.width - PEEK_W, y, false);
    state.offset = y - area.y;
  } else {
    const x = clamp(Number(payload.x) || 0, area.x, area.x + area.width - PEEK_W);
    win.setPosition(x, edge === 'top' ? area.y : area.y + area.height - PEEK_H, false);
    state.offset = x - area.x;
  }
  saveState();
});

ipcMain.on('set-edge-offset', (_, payload) => {
  if (!payload || !['left', 'right', 'top', 'bottom'].includes(payload.edge)) return;
  state.edge = payload.edge;
  state.offset = Number.isFinite(Number(payload.offset)) ? Math.max(0, Number(payload.offset)) : 0;
  saveState();
});

app.on('before-quit', () => { isQuitting = true; saveState(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (event) => event.preventDefault());
app.on('activate', () => { if (win) win.show(); });
