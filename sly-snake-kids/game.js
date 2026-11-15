const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restart-btn');

const CELL = 24; 
let COLS = canvas.width / CELL;
let ROWS = canvas.height / CELL;

const STORAGE_KEY = 'snake_dmi3_stats_v1';
const LAST_PLAYER_KEY = 'snake_dmi3_last_player';

let snake, dir, nextDir, food, fakeFood;
let score, level, apples, speed;
let paused, gameOver, gameOverMsg, timer;
let currentPlayer = null;

// --- АДАПТАЦИЯ ПОД МОБИЛКИ ---
function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.65);
    canvas.width = size;
    canvas.height = size;
    COLS = Math.floor(canvas.width / CELL);
    ROWS = Math.floor(canvas.height / CELL);
    if (snake) draw();
}
window.addEventListener('resize', resizeCanvas);

// --- УПРАВЛЕНИЕ СВАЙПАМИ ---
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

window.addEventListener('touchend', e => {
    if (paused || gameOver || !currentPlayer) return;
    
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;
    let newDir = null;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 30 && dir.x === 0) newDir = { x: 1, y: 0 };
        else if (diffX < -30 && dir.x === 0) newDir = { x: -1, y: 0 };
    } else {
        if (diffY > 30 && dir.y === 0) newDir = { x: 0, y: 1 };
        else if (diffY < -30 && dir.y === 0) newDir = { x: 0, y: -1 };
    }

    if (newDir) nextDir = newDir;
});

// --- СТАТИСТИКА ---
function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { players: {} };
    const data = JSON.parse(raw);
    if (!data.players) data.players = {};
    return data;
  } catch (e) { return { players: {} }; }
}

function saveStats(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

function getPlayerStats(name) {
  const stats = loadStats();
  return stats.players[name] || { bestScore: 0, bestLevel: 1, games: 0, totalApples: 0, lastPlayed: 0 };
}

function saveGameResult() {
  if (!currentPlayer) return { newRecord: false };
  const stats = loadStats();
  const p = stats.players[currentPlayer] || { bestScore: 0, bestLevel: 1, games: 0, totalApples: 0, lastPlayed: 0 };

  p.games++;
  p.totalApples += apples;
  const newRecord = score > p.bestScore;
  if (newRecord) p.bestScore = score;
  if (level > p.bestLevel) p.bestLevel = level;
  p.lastPlayed = Date.now();

  stats.players[currentPlayer] = p;
  saveStats(stats);
  return { newRecord };
}

function renderLeaderboard(highlightName) {
  const box = document.getElementById('leaderboard');
  const stats = loadStats();
  const list = Object.entries(stats.players).map(([name, p]) => ({ name, ...p }))
    .sort((a, b) => b.bestScore - a.bestScore).slice(0, 5);

  if (list.length === 0) {
    box.innerHTML = '<h3>Таблица лидеров</h3><div class="empty">Пока пусто. Стань первым!</div>';
    return;
  }

  let html = '<h3>Таблица лидеров</h3><table><tr><th>#</th><th>Имя</th><th>Рекорд</th><th>Игр</th></tr>';
  list.forEach((p, i) => {
    const cls = (p.name === highlightName) ? ' class="current"' : '';
    html += `<tr${cls}><td class="rank">${i + 1}</td><td class="name">${escapeHtml(p.name)}</td><td>${p.bestScore}</td><td>${p.games}</td></tr>`;
  });
  html += '</table>';
  box.innerHTML = html;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showNameScreen() {
  const input = document.getElementById('playerInput');
  const btn = document.getElementById('startBtn');
  const screen = document.getElementById('nameScreen');

  const last = localStorage.getItem(LAST_PLAYER_KEY) || '';
  input.value = last;
  btn.disabled = last.trim().length === 0;

  renderLeaderboard(last);
  screen.classList.remove('hidden');
  setTimeout(() => input.focus(), 50);
}

function startWithPlayer(name) {
  name = name.trim();
  if (!name) return;
  currentPlayer = name;
  localStorage.setItem(LAST_PLAYER_KEY, name);

  document.getElementById('playerDisplay').textContent = name;
  document.getElementById('nameScreen').classList.add('hidden');

  const p = getPlayerStats(name);
  document.getElementById('bestScore').textContent = p.bestScore;

  init();
}

// --- ИГРА ---
function init() {
  resizeCanvas();
  restartBtn.classList.add('hidden'); // Прячем кнопку при старте
  
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  level = 1;
  apples = 0;
  speed = 150;
  paused = false;
  gameOver = false;
  gameOverMsg = '';
  food = randomFreeCell();
  fakeFood = null;
  updateHUD();
  draw();
  clearTimeout(timer);
  loop();
}

function loop() {
  clearTimeout(timer);
  if (!paused && !gameOver) tick();
  timer = setTimeout(loop, speed);
}

function tick() {
  dir = nextDir;
  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    return endGame('Ты врезался в стену!');
  }
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    return endGame('Ты укусил себя!');
  }
  if (fakeFood && newHead.x === fakeFood.x && newHead.y === fakeFood.y) {
    return endGame('Хитрый змей съел поддельное яблоко!');
  }

  if (newHead.x === food.x && newHead.y === food.y) {
    snake.unshift(newHead);
    score += 10 * level;
    apples++;
    if (apples % 5 === 0) {
      level++;
      speed = Math.max(70, 150 - (level - 1) * 10);
      fakeFood = randomFreeCell();
    }
    food = randomFreeCell();
    updateHUD();
  } else {
    snake.unshift(newHead);
    snake.pop();
  }
  draw();
}

function endGame(msg) {
  gameOver = true;
  gameOverMsg = msg;
  const { newRecord } = saveGameResult();
  if (newRecord) gameOverMsg += '\n🏆 Новый рекорд: ' + score;
  
  const p = getPlayerStats(currentPlayer);
  document.getElementById('bestScore').textContent = p.bestScore;
  
  // Показываем кнопку
  restartBtn.classList.remove('hidden');
  
  // Рисуем финальный экран (без подсказок про клавиши)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Разбиваем текст на строки, если есть перенос
  const lines = gameOverMsg.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 - 20 + i * 32);
  });
}

function randomFreeCell() {
  for (let i = 0; i < 1000; i++) {
    const cell = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (snake.some(s => s.x === cell.x && s.y === cell.y)) continue;
    if (food && food.x === cell.x && food.y === cell.y) continue;
    if (fakeFood && fakeFood.x === cell.x && fakeFood.y === cell.y) continue;
    return cell;
  }
  return { x: 0, y: 0 };
}

// --- ОТРИСОВКА ---
function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
  }

  drawCircleCell(food.x, food.y, '#e74c3c');
  if (fakeFood) drawCircleCell(fakeFood.x, fakeFood.y, '#9b59b6', '?');

  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#2ecc71' : '#27ae60';
    ctx.fillRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4);
  });

  drawSnakeFace(snake[0], dir);

  if (paused) overlay('Пауза');
}

function drawSnakeFace(head, dir) {
  const cx = head.x * CELL + CELL / 2;
  const cy = head.y * CELL + CELL / 2;
  const off = 5, fwd = 5, eyeR = 3.5, pupilR = 1.8;

  let e1x, e1y, e2x, e2y;
  if (dir.x === 1)       { e1x = cx + fwd; e1y = cy - off; e2x = cx + fwd; e2y = cy + off; }
  else if (dir.x === -1) { e1x = cx - fwd; e1y = cy - off; e2x = cx - fwd; e2y = cy + off; }
  else if (dir.y === 1)  { e1x = cx - off; e1y = cy + fwd; e2x = cx + off; e2y = cy + fwd; }
  else                   { e1x = cx - off; e1y = cy - fwd; e2x = cx + off; e2y = cy - fwd; }

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(e1x, e1y, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2x, e2y, pupilR, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#ff3b6b';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  let tx, ty, dx = 0, dy = 0;
  if (dir.x === 1)       { tx = cx + 10; ty = cy; dx = 1;  dy = 0; }
  else if (dir.x === -1) { tx = cx - 10; ty = cy; dx = -1; dy = 0; }
  else if (dir.y === 1)  { tx = cx; ty = cy + 10; dx = 0;  dy = 1; }
  else                   { tx = cx; ty = cy - 10; dx = 0;  dy = -1; }

  const tLen = 5, tSpred = 3;
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + dx * tLen, ty + dy * tLen); ctx.stroke();
  const bx = tx + dx * tLen, by = ty + dy * tLen;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - dy * tSpred + dx * tSpred, by + dx * tSpred + dy * tSpred);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + dy * tSpred + dx * tSpred, by - dx * tSpred + dy * tSpred);
  ctx.stroke();
}

function drawCircleCell(x, y, color, text = '') {
  const px = x * CELL, py = y * CELL;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px + CELL / 2, py + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
  if (text) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, px + CELL / 2, py + CELL / 2);
  }
}

function overlay(text) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (i - (lines.length - 1) / 2) * 32);
  });
}

function updateHUD() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('apples').textContent = apples;
}

// --- СОБЫТИЯ ---
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'p') {
    clearTimeout(timer);
    gameOver = true; paused = true;
    restartBtn.classList.add('hidden');
    showNameScreen();
    return;
  }
  if (key === 'r') { if (currentPlayer) init(); return; }
  if (key === ' ') {
    e.preventDefault();
    if (!gameOver && currentPlayer) { paused = !paused; draw(); }
    return;
  }
  if (paused || gameOver || !currentPlayer) return;

  let newDir = null;
  if (key === 'arrowup' || key === 'w') newDir = { x: 0, y: -1 };
  if (key === 'arrowdown' || key === 's') newDir = { x: 0, y: 1 };
  if (key === 'arrowleft' || key === 'a') newDir = { x: -1, y: 0 };
  if (key === 'arrowright' || key === 'd') newDir = { x: 1, y: 0 };
  if (!newDir) return;

  if (newDir.x === -dir.x && newDir.y === -dir.y) return;
  nextDir = newDir;
});

// Обработчик кнопки "Играть снова"
restartBtn.addEventListener('click', () => {
    if (currentPlayer) init();
});

(function setupNameScreen() {
  const input = document.getElementById('playerInput');
  const btn = document.getElementById('startBtn');

  input.addEventListener('input', () => {
    btn.disabled = input.value.trim().length === 0;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btn.disabled) startWithPlayer(input.value);
  });
  btn.addEventListener('click', () => startWithPlayer(input.value));
})();

// Запуск
showNameScreen();