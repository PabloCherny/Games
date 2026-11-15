const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const pauseMenu = document.getElementById('pause-menu');

const btnResume = document.getElementById('btn-resume');
const btnRestart = document.getElementById('btn-restart');
const btnQuit = document.getElementById('btn-quit');
const resumeGameBtn = document.getElementById('resumeGameBtn'); // Новая кнопка на главном экране

const CELL = 24; 
let COLS = canvas.width / CELL;
let ROWS = canvas.height / CELL;

const STORAGE_KEY = 'snake_dmi3_stats_v1';
const LAST_PLAYER_KEY = 'snake_dmi3_last_player';

let snake, dir, nextDir, food, fakeFood;
let score, level, apples, speed;
let paused, gameOver, gameOverMsg, timer;
let currentPlayer = null;
let isTrainingMode = false; 

// Флаг, что игра была прервана (для кнопки "Продолжить")
let gameInterrupted = false; 

let particles = [];
let celebrationText = '';
let celebrationTimer = 0;
let nextCelebrationScore = 100; 

function createParticles() { /* ... код без изменений ... */ }
function updateParticles() { /* ... код без изменений ... */ }
function drawParticles() { /* ... код без изменений ... */ }
function resizeCanvas() { /* ... код без изменений ... */ }
// ... Статистика и рендер лидерборда без изменений ...

function showNameScreen() {
  const input = document.getElementById('playerInput');
  const startBtn = document.getElementById('startBtn');
  const trainBtn = document.getElementById('trainBtn');
  const screen = document.getElementById('nameScreen');

  const last = localStorage.getItem(LAST_PLAYER_KEY) || '';
  input.value = last;
  const disable = last.trim().length === 0;
  startBtn.disabled = disable;
  trainBtn.disabled = disable;

  renderLeaderboard(last);
  screen.classList.remove('hidden');
  
  pauseMenu.classList.add('hidden'); 
  pauseBtn.classList.add('hidden');
  restartBtn.classList.add('hidden');

  // Показываем кнопку "Продолжить", если игра была прервана, а не окончена
  if (gameInterrupted) {
      resumeGameBtn.classList.remove('hidden');
  } else {
      resumeGameBtn.classList.add('hidden');
  }
  
  setTimeout(() => input.focus(), 50);
}

function startWithPlayer(name, trainingMode = false) {
  name = name.trim();
  if (!name) return;
  currentPlayer = name;
  isTrainingMode = trainingMode; 
  localStorage.setItem(LAST_PLAYER_KEY, name);

  document.getElementById('playerDisplay').textContent = name + (isTrainingMode ? " (Трен.)" : "");
  document.getElementById('nameScreen').classList.add('hidden');
  
  gameInterrupted = false; // Сбрасываем флаг, начинаем новую

  const p = getPlayerStats(name);
  document.getElementById('bestScore').textContent = p.bestScore;
  init();
}

function init() {
  resizeCanvas();
  restartBtn.classList.add('hidden'); 
  pauseMenu.classList.add('hidden');
  pauseBtn.classList.remove('hidden'); 
  pauseBtn.textContent = '⏸';
  
  particles = []; celebrationTimer = 0; nextCelebrationScore = 100; 
  
  const startX = Math.floor(COLS / 2); const startY = Math.floor(ROWS / 2);
  snake = [{ x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY }];
  dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
  score = 0; level = 1; apples = 0;
  speed = isTrainingMode ? 200 : 150; 
  paused = false; gameOver = false; gameOverMsg = '';
  food = randomFreeCell(); fakeFood = null;
  
  gameInterrupted = false; // Сбрасываем флаг
  updateHUD(); draw();
  
  clearTimeout(timer);
  timer = setTimeout(loop, speed);
}

// ... loop, tick, endGame, randomFreeCell, draw, drawSnakeFace, drawCircleCell, overlay, updateHUD ...

// --- ОБРАБОТЧИКИ ---

function togglePause() {
    if (gameOver || !currentPlayer) return;
    paused = !paused;
    if (paused) {
        pauseMenu.classList.remove('hidden');
        pauseBtn.textContent = '▶';
    } else {
        pauseMenu.classList.add('hidden');
        pauseBtn.textContent = '⏸';
        loop(); 
    }
}

pauseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); });
pauseBtn.addEventListener('click', togglePause);

btnResume.addEventListener('click', togglePause);

btnRestart.addEventListener('click', () => {
    init();
});

btnQuit.addEventListener('click', () => {
    clearTimeout(timer); 
    paused = true; // Оставляем на паузе
    gameInterrupted = true; // ВАЖНО: отмечаем, что игра прервана, но не окончена
    
    pauseMenu.classList.add('hidden');
    pauseBtn.classList.add('hidden');
    restartBtn.classList.add('hidden');
    
    showNameScreen(); // Возвращаемся в меню
});

restartBtn.addEventListener('click', () => { if (currentPlayer) init(); });

// Кнопка "Продолжить прошлую игру"
resumeGameBtn.addEventListener('click', () => {
    if (gameInterrupted && currentPlayer) {
        document.getElementById('nameScreen').classList.add('hidden');
        pauseMenu.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        pauseBtn.textContent = '⏸';
        paused = false; // Снимаем с паузы
        gameInterrupted = false; // Сбрасываем флаг
        loop(); // Возобновляем игру
    }
});

(function setupNameScreen() {
  // ... код слушателей input и кнопок старта (без изменений) ...
})();

// Запуск
showNameScreen();