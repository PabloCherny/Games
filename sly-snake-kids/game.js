const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');

const gridSize = 20;
let tileCount = 20;
let tileSize;

let snake = [];
let food = {};
let dx = 0, dy = 0;
let score = 0;
let level = 1;
let gameSpeed = 150;
let gameLoop;
let isGameOver = false;
let walls = [];

function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = size;
    canvas.height = size;
    tileSize = canvas.width / tileCount;
    document.getElementById('game-container').style.width = size + 'px';
    document.getElementById('game-container').style.height = size + 'px';
}
window.addEventListener('resize', resizeCanvas);

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

window.addEventListener('touchend', e => {
    if (isGameOver) return;
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
});

function handleSwipe(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 30 && dx === 0) { dx = 1; dy = 0; }
        else if (diffX < -30 && dx === 0) { dx = -1; dy = 0; }
    } else {
        if (diffY > 30 && dy === 0) { dx = 0; dy = 1; }
        else if (diffY < -30 && dy === 0) { dx = 0; dy = -1; }
    }
}

window.addEventListener('keydown', e => {
    if (isGameOver) return;
    switch(e.key) {
        case 'ArrowUp': if (dy === 0) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (dy === 0) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (dx === 0) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx === 0) { dx = 1; dy = 0; } break;
    }
});

function initGame() {
    resizeCanvas();
    snake = [{x: 10, y: 10}];
    dx = 1; dy = 0;
    score = 0;
    level = 1;
    gameSpeed = 150;
    isGameOver = false;
    walls = [];
    generateFood();
    overlay.classList.add('hidden');
    clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    if (snake.some(segment => segment.x === food.x && segment.y === food.y) || 
        walls.some(wall => wall.x === food.x && wall.y === food.y)) {
        generateFood();
    }
}

function update() {
    if (isGameOver) return;
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return gameOver();
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) return gameOver();
    if (walls.some(wall => wall.x === head.x && wall.y === head.y)) return gameOver();

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        checkLevelUp();
        generateFood();
    } else {
        snake.pop();
    }
    draw();
}

function checkLevelUp() {
    if (score > 0 && score % 5 === 0) {
        level++;
        gameSpeed = Math.max(60, gameSpeed - 20);
        clearInterval(gameLoop);
        gameLoop = setInterval(update, gameSpeed);
        
        if (level === 3) {
            walls = [
                {x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7},
                {x: 15, y: 15}, {x: 15, y: 14}, {x: 15, y: 13}
            ];
        }
    }
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#555';
    walls.forEach(wall => {
        ctx.fillRect(wall.x * tileSize, wall.y * tileSize, tileSize - 2, tileSize - 2);
    });

    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.arc(food.x * tileSize + tileSize/2, food.y * tileSize + tileSize/2, tileSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4CAF50' : '#2E7D32';
        ctx.fillRect(segment.x * tileSize, segment.y * tileSize, tileSize - 2, tileSize - 2);
    });

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Счет: ${score}`, 10, 20);
    ctx.fillText(`Уровень: ${level}`, 10, 40);
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    overlay.classList.remove('hidden');
    overlayTitle.innerText = 'Игра Окончена!';
    overlayText.innerText = `Твой счет: ${score}. Достигнут уровень: ${level}`;
    startBtn.innerText = 'Играть снова';
}

startBtn.addEventListener('click', initGame);
resizeCanvas();
