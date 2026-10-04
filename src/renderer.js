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

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(task => task && typeof task.text === 'string') : [];
  }
  catch (_) { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
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
  if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) peekDragging = true;
  if (!peekDragging) return;
  const x = dragStartWindow.x + e.screenX - dragStartPointer.x;
  const y = dragStartWindow.y + e.screenY - dragStartPointer.y;
  window.laterAPI.movePeek({ x, y });
});
$('peekBtn').addEventListener('pointerup', (e) => {
  if (dragPointerId === e.pointerId) {
    try { $('peekBtn').releasePointerCapture(e.pointerId); } catch (_) {}
    dragPointerId = null;
    dragStartPointer = null;
    dragStartWindow = null;
    setTimeout(() => { peekDragging = false; }, 0);
  }
});
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
  }
});

window.laterAPI.onModeChanged((state) => {
  currentEdge = state.edge || currentEdge;
  document.documentElement.dataset.edge = currentEdge;
  if (state.mode === 'peek') {
    peek.classList.add('active'); panel.classList.remove('active');
  } else {
    peek.classList.remove('active'); panel.classList.add('active');
  }
});

applyTheme();
render();
