const STORAGE_KEY = 'later-tasks-v1';
const THEME_KEY = 'later-theme-v1';

const $ = (id) => document.getElementById(id);
const peek = $('peek');
const panel = $('panel');
const tasksEl = $('tasks');
const input = $('taskInput');

let tasks = loadTasks();
let theme = localStorage.getItem(THEME_KEY) || 'dark';
let currentEdge = 'right';
let peekDragging = false;
let dragPointerId = null;
let dragStartPointer = null;
let dragStartWindow = null;
let resizeFrame = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(task => task && typeof task.text === 'string') : [];
  }
  catch (_) { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function requestContentResize() {
  if (!panel.classList.contains('active')) return;
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    const tasksStyle = getComputedStyle(tasksEl);
    const taskPadding = parseFloat(tasksStyle.paddingTop) + parseFloat(tasksStyle.paddingBottom);
    const taskContentHeight = Array.from(tasksEl.children)
      .reduce((total, child) => total + child.getBoundingClientRect().height, 0);
    const chromeHeight = $('topbar').offsetHeight + $('composer').offsetHeight;
    const panelBorders = 2;
    window.laterAPI.setContentHeight(Math.ceil(chromeHeight + taskPadding + taskContentHeight + panelBorders));
  });
}
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  window.laterAPI.setTheme(theme);
}

function render() {
  tasksEl.innerHTML = '';
  if (!tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Nothing here yet. Add a task.';
    tasksEl.appendChild(empty);
    requestContentResize();
    return;
  }

  tasks.forEach((task) => {
    const row = document.createElement('div');
    row.className = 'task' + (task.done ? ' done' : '');

    const check = document.createElement('button');
    check.className = 'check';
    check.textContent = task.done ? '✓' : '';
    check.title = task.done ? 'Uncomplete' : 'Complete';
    check.addEventListener('click', () => {
      task.done = !task.done;
      saveTasks(); render();
    });

    const text = document.createElement('div');
    text.className = 'task-text';
    text.textContent = task.text;

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '×';
    del.title = 'Delete task';
    del.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks(); render();
    });

    row.append(check, text, del);
    tasksEl.appendChild(row);
  });
  requestContentResize();
}

function addTask() {
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: Date.now() + Math.random(), text, done: false });
  input.value = '';
  saveTasks(); render(); input.focus();
}

$('peekBtn').addEventListener('click', () => {
  if (!peekDragging) window.laterAPI.expand();
});

$('peekBtn').addEventListener('pointerdown', (e) => {
  peekDragging = false;
  dragPointerId = e.pointerId;
  dragStartPointer = { x: e.screenX, y: e.screenY };
  dragStartWindow = { x: window.screenX, y: window.screenY };
  $('peekBtn').setPointerCapture(e.pointerId);
});
$('peekBtn').addEventListener('pointermove', (e) => {
  if (dragPointerId !== e.pointerId) return;
  const movedX = e.screenX - dragStartPointer.x;
  const movedY = e.screenY - dragStartPointer.y;
  if (Math.abs(movedX) + Math.abs(movedY) > 6) peekDragging = true;
  if (!peekDragging) return;
  const x = dragStartWindow.x + movedX;
  const y = dragStartWindow.y + movedY;
  window.laterAPI.movePeek({ x, y });
});
function endPeekPointer(e) {
  if (dragPointerId === e.pointerId) {
    try { $('peekBtn').releasePointerCapture(e.pointerId); } catch (_) {}
    if (peekDragging) window.laterAPI.finishPeekMove();
    dragPointerId = null;
    dragStartPointer = null;
    dragStartWindow = null;
    setTimeout(() => { peekDragging = false; }, 0);
  }
}
$('peekBtn').addEventListener('pointerup', endPeekPointer);
$('peekBtn').addEventListener('pointercancel', endPeekPointer);
$('minusBtn').addEventListener('click', () => window.laterAPI.peek());
$('addBtn').addEventListener('click', addTask);
$('themeBtn').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  applyTheme();
});
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });

window.laterAPI.onInitialState((state) => {
  currentEdge = state.edge || 'right';
  document.documentElement.dataset.edge = currentEdge;
  if (state.theme) theme = state.theme;
  applyTheme();
  if (state.mode === 'peek') {
    peek.classList.add('active'); panel.classList.remove('active');
  } else {
    peek.classList.remove('active'); panel.classList.add('active');
    requestContentResize();
  }
});

window.laterAPI.onModeChanged((state) => {
  currentEdge = state.edge || currentEdge;
  document.documentElement.dataset.edge = currentEdge;
  if (state.mode === 'peek') {
    peek.classList.add('active'); panel.classList.remove('active');
  } else {
    peek.classList.remove('active'); panel.classList.add('active');
    requestContentResize();
  }
});

applyTheme();
render();
