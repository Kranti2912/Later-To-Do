const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const PEEK_W = 44;
const PEEK_H = 34;
const PEEK_SHADOW_PAD = 18;
const EXPANDED_W = 560;
const MIN_EXPANDED_W = 300;
const MIN_EXPANDED_H = 180;
const INITIAL_EXPANDED_H = 256;
const STATE_FILE = path.join(app.getPath('userData'), 'later-state.json');

let win = null;
let tray = null;
let screen = null;
let isQuitting = false;
let windowReady = false;
let automaticExpandedHeight = INITIAL_EXPANDED_H;
let expectedProgrammaticSize = null;
let resizeSaveTimer = null;
let state = {
  edge: 'right',
  offset: null,
  mode: 'expanded',
  theme: 'dark',
  appVersion: app.getVersion(),
  expandedWidth: EXPANDED_W,
  expandedHeight: INITIAL_EXPANDED_H,
  expandedSizeManual: false
};
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showWindow();
  });
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        const versionChanged = parsed.appVersion !== app.getVersion();
        state = {
          ...state,
          edge: ['left', 'right', 'top', 'bottom'].includes(parsed.edge) ? parsed.edge : state.edge,
          offset: parsed.offset !== null && parsed.offset !== undefined && Number.isFinite(Number(parsed.offset))
            ? Number(parsed.offset)
            : state.offset,
          mode: versionChanged || parsed.mode === 'expanded' ? 'expanded' : 'peek',
          theme: parsed.theme === 'light' ? 'light' : 'dark',
          appVersion: app.getVersion(),
          expandedWidth: Number.isFinite(Number(parsed.expandedWidth))
            ? Math.max(MIN_EXPANDED_W, Math.round(Number(parsed.expandedWidth))) : EXPANDED_W,
          expandedHeight: Number.isFinite(Number(parsed.expandedHeight))
            ? Math.max(MIN_EXPANDED_H, Math.round(Number(parsed.expandedHeight))) : INITIAL_EXPANDED_H,
          expandedSizeManual: parsed.expandedSizeManual === true
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
  if (win && !win.isDestroyed()) return screen.getDisplayMatching(win.getBounds()).workArea;
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function peekWindowSizeFor(edge) {
  if (edge === 'left' || edge === 'right') {
    return { width: PEEK_W + PEEK_SHADOW_PAD, height: PEEK_H + PEEK_SHADOW_PAD * 2 };
  }
  return { width: PEEK_W + PEEK_SHADOW_PAD * 2, height: PEEK_H + PEEK_SHADOW_PAD };
}

function expandedSizeFor(area) {
  const maxWidth = Math.max(MIN_EXPANDED_W, area.width - 24);
  const maxHeight = Math.max(MIN_EXPANDED_H, area.height - 24);
  return {
    width: Math.round(clamp(state.expandedSizeManual ? state.expandedWidth : EXPANDED_W, MIN_EXPANDED_W, maxWidth)),
    height: Math.round(clamp(state.expandedSizeManual ? state.expandedHeight : automaticExpandedHeight, MIN_EXPANDED_H, maxHeight))
  };
}

function boundsFor(edge, offset, mode) {
  const area = workArea();
  const expandedSize = expandedSizeFor(area);
  const peekSize = peekWindowSizeFor(edge);
  const w = mode === 'peek' ? peekSize.width : expandedSize.width;
  const h = mode === 'peek' ? peekSize.height : expandedSize.height;
  let x = area.x + Math.round((area.width - w) / 2);
  let y = area.y + Math.round((area.height - h) / 2);

  if (edge === 'left' || edge === 'right') {
    const maxOffset = Math.max(0, area.height - h);
    const requestedOffset = offset === null || offset === undefined || !Number.isFinite(Number(offset))
      ? Math.round(maxOffset * 0.88)
      : Math.round(Number(offset));
    y = Math.round(area.y + clamp(requestedOffset, 0, maxOffset));
    x = edge === 'left' ? area.x : area.x + area.width - w;
  } else {
    const maxOffset = Math.max(0, area.width - w);
    const requestedOffset = offset === null || offset === undefined || !Number.isFinite(Number(offset))
      ? Math.round(maxOffset * 0.5)
      : Math.round(Number(offset));
    x = Math.round(area.x + clamp(requestedOffset, 0, maxOffset));
    y = edge === 'top' ? area.y : area.y + area.height - h;
  }
  return { x, y, width: w, height: h };
}

function setMode(mode, edge = state.edge, offset = state.offset, persist = true) {
  if (!win || win.isDestroyed()) return;
  if (!['left', 'right', 'top', 'bottom'].includes(edge)) edge = 'right';
  if (mode !== 'expanded') mode = 'peek';
  state.mode = mode;
  state.edge = edge;
  state.offset = offset === null || offset === undefined
    ? null
    : Number.isFinite(Number(offset)) ? Math.round(Number(offset)) : 0;

  // Electron will clamp setSize() to the current minimum size. Temporarily
  // remove the expanded minimum before entering the compact peek state.
  win.setMinimumSize(1, 1);
  const b = boundsFor(state.edge, state.offset, mode);
  expectedProgrammaticSize = { width: b.width, height: b.height };
  win.setBounds(b, false);
  win.setResizable(mode === 'expanded');
  win.setAlwaysOnTop(true, 'floating');
  if (process.platform === 'win32' && typeof win.setBackgroundMaterial === 'function') {
    // Acrylic is a whole-window material. Keep it on the full panel, but turn
    // it off in peek mode so the transparent margins don't become a gray box.
    try { win.setBackgroundMaterial(mode === 'expanded' ? 'acrylic' : 'none'); } catch (_) {}
  }
  win.webContents.send('mode-changed', { mode, edge: state.edge, theme: state.theme });

  if (mode === 'expanded') {
    win.setMinimumSize(MIN_EXPANDED_W, MIN_EXPANDED_H);
  } else {
    win.setMinimumSize(1, 1);
  }
  if (persist) saveState();
}

function setProgrammaticBounds(bounds) {
  if (!win || win.isDestroyed()) return;
  expectedProgrammaticSize = { width: bounds.width, height: bounds.height };
  win.setBounds(bounds, false);
}

function rememberExpandedSize() {
  if (!win || win.isDestroyed() || state.mode !== 'expanded') return;
  const { width, height } = win.getBounds();
  if (expectedProgrammaticSize && width === expectedProgrammaticSize.width && height === expectedProgrammaticSize.height) return;
  expectedProgrammaticSize = { width, height };
  state.expandedWidth = Math.max(MIN_EXPANDED_W, width);
  state.expandedHeight = Math.max(MIN_EXPANDED_H, height);
  state.expandedSizeManual = true;
  if (resizeSaveTimer) clearTimeout(resizeSaveTimer);
  resizeSaveTimer = setTimeout(() => {
    resizeSaveTimer = null;
    saveState();
  }, 250);
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'later-tray.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Later™');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Later™', click: showWindow },
    { label: 'Peek', click: () => setMode('peek') },
    { label: 'Expand', click: () => setMode('expanded') },
    { type: 'separator' },
    { label: 'Quit Later™', click: () => { isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', showWindow);
}

function showWindow() {
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  win.focus();
}

function restoreWindowWithoutFocus() {
  if (isQuitting || !win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.showInactive();
}

function reanchorVisibleWindow() {
  if (!windowReady || !win || win.isDestroyed()) return;
  setMode(state.mode, state.edge, state.offset);
  restoreWindowWithoutFocus();
}

function createWindow() {
  const initialPeekSize = peekWindowSizeFor(state.edge);
  win = new BrowserWindow({
    width: initialPeekSize.width,
    height: initialPeekSize.height,
    minWidth: 1,
    minHeight: 1,
    frame: false,
    transparent: true,
    hasShadow: false,
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

  win.loadFile(path.join(__dirname, 'index.html')).catch((error) => {
    console.error('Later could not load its interface:', error);
    if (win && !win.isDestroyed()) {
      dialog.showErrorBox('Later could not open', error.message || String(error));
    }
  });

  win.once('ready-to-show', () => {
    windowReady = true;
    setMode(state.mode, state.edge, state.offset, false);
    win.webContents.send('initial-state', state);
    win.show();
  });

  win.on('resize', rememberExpandedSize);

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      showWindow();
    }
  });

  win.on('minimize', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    setImmediate(restoreWindowWithoutFocus);
  });

  win.on('hide', () => {
    // Windows can briefly hide topmost windows while opening the screenshot
    // overlay. Restore Later without activating it so the capture UI stays open.
    if (!isQuitting) setImmediate(restoreWindowWithoutFocus);
  });

  win.on('closed', () => { windowReady = false; win = null; });
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  // Electron only exposes the screen module after the app is ready.
  screen = require('electron').screen;
  screen.on('display-added', reanchorVisibleWindow);
  screen.on('display-removed', reanchorVisibleWindow);
  screen.on('display-metrics-changed', reanchorVisibleWindow);
  loadState();
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
  } else {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args: [app.getAppPath()] });
  }
  createWindow();
  createTray();
  globalShortcut.register('CommandOrControl+Shift+Space', showWindow);
}).catch((error) => {
  console.error('Later failed to start:', error);
  dialog.showErrorBox('Later failed to start', error.message || String(error));
});

ipcMain.on('peek', () => setMode('peek'));
ipcMain.on('expand', () => setMode('expanded'));
ipcMain.on('quit', () => {
  isQuitting = true;
  saveState();
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy();
    tray = null;
  }
  app.quit();
});
ipcMain.on('theme', (_, theme) => {
  if (theme !== 'dark' && theme !== 'light') return;
  state.theme = theme;
  saveState();
});
ipcMain.on('move-peek', (_, payload) => {
  if (!win || win.isDestroyed() || state.mode !== 'peek' || !payload) return;
  try {
    const area = screen.getDisplayMatching(win.getBounds()).workArea;
    const edge = state.edge;
    if (edge === 'left' || edge === 'right') {
      const requestedY = Number(payload.y);
      if (!Number.isFinite(requestedY)) return;
      const peekSize = peekWindowSizeFor(edge);
      const x = Math.round(edge === 'left' ? area.x : area.x + area.width - peekSize.width);
      const y = Math.round(clamp(requestedY, area.y, area.y + area.height - peekSize.height));
      win.setPosition(x, y, false);
      state.offset = y - area.y;
    } else {
      const requestedX = Number(payload.x);
      if (!Number.isFinite(requestedX)) return;
      const peekSize = peekWindowSizeFor(edge);
      const x = Math.round(clamp(requestedX, area.x, area.x + area.width - peekSize.width));
      const y = Math.round(edge === 'top' ? area.y : area.y + area.height - peekSize.height);
      win.setPosition(x, y, false);
      state.offset = x - area.x;
    }
  } catch (error) {
    console.error('Later could not move the peek tab:', error);
  }
});

ipcMain.on('finish-peek-move', () => saveState());

ipcMain.on('content-height', (_, value) => {
  if (!win || win.isDestroyed() || !Number.isFinite(Number(value))) return;
  const area = screen.getDisplayMatching(win.getBounds()).workArea;
  automaticExpandedHeight = Math.round(clamp(Number(value), MIN_EXPANDED_H, Math.max(MIN_EXPANDED_H, area.height - 24)));
  if (state.mode === 'expanded' && !state.expandedSizeManual) {
    setProgrammaticBounds(boundsFor(state.edge, state.offset, 'expanded'));
  }
});

ipcMain.on('set-edge-offset', (_, payload) => {
  if (!payload || !['left', 'right', 'top', 'bottom'].includes(payload.edge)) return;
  state.edge = payload.edge;
  state.offset = Number.isFinite(Number(payload.offset)) ? Math.max(0, Math.round(Number(payload.offset))) : 0;
  saveState();
});

app.on('before-quit', () => { isQuitting = true; saveState(); });
app.on('session-end', () => { isQuitting = true; saveState(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (event) => event.preventDefault());
app.on('activate', showWindow);
