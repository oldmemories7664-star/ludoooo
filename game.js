// Game Configuration
const COLORS = ['red', 'green', 'yellow', 'blue'];
const COLOR_HEX = {
    red: '#e74c3c',
    green: '#2ecc71',
    yellow: '#f1c40f',
    blue: '#3498db'
};

const BOARD_SIZE = 52; // Squares in main path
const HOME_SIZE = 4; // Pawns per player
const FINISH_SIZE = 6; // Finish line squares

// Game State
let gameState = {
    players: [],
    currentPlayerIndex: 0,
    gameActive: false,
    musicEnabled: true,
    diceRolled: false,
    lastDiceValue: 0,
    consecutiveSixes: 0,
    gameEnded: false,
    ranking: []
};

// Audio elements
const bgMusic = document.getElementById('gameMusic');
const diceSound = document.getElementById('diceSound');
const moveSound = document.getElementById('moveSound');
const captureSound = document.getElementById('captureSound');
const winSound = document.getElementById('winSound');

// Initialize game
window.addEventListener('load', () => {
    setTimeout(() => {
        showScreen('mainMenu');
        setupLoadingAnimation();
    }, 2000);
});

function setupLoadingAnimation() {
    let frame = 1;
    const interval = setInterval(() => {
        const loadingImg = document.getElementById('loadingImg');
        if (loadingImg) {
            loadingImg.src = `loading/${frame}.png`;
            frame++;
            if (frame > 24) frame = 1;
        }
    }, 50);
    
    setTimeout(() => clearInterval(interval), 2000);
}

// Screen Management
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenName).style.display = 'flex';
}

function startGameMenu() {
    showScreen('playerSelection');
}

function showCredits() {
    showScreen('rulesScreen');
}

function backToMenu() {
    showScreen('mainMenu');
    gameState.gameEnded = false;
}

function startGame(numPlayers) {
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.consecutiveSixes = 0;
    gameState.gameActive = true;
    gameState.gameEnded = false;
    gameState.ranking = [];
    
    for (let i = 0; i < numPlayers; i++) {
        gameState.players.push(createPlayer(i));
    }
    
    showScreen('gameScreen');
    initializeCanvas();
    playBgMusic();
    updatePlayerStats();
    drawBoard();
}

function createPlayer(index) {
    return {
        id: index,
        color: COLORS[index],
        pawns: [
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false }
        ],
        score: 0
    };
}

// Canvas Setup and Drawing
let canvas, ctx;

function initializeCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    drawBoard();
}

function drawBoard() {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cellSize = canvas.width / 15;
    
    // Draw main path (52 squares)
    drawMainPath(cellSize);
    
    // Draw home areas and finish areas
    drawHomeAndFinish(cellSize);
    
    // Draw pawns
    drawPawns(cellSize);
    
    // Draw safe squares
    drawSafeSquares(cellSize);
}

function drawMainPath(cellSize) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Draw grid for main path
    const boardPositions = getBoardPositions();
    
    for (let i = 0; i < boardPositions.length; i++) {
        const pos = boardPositions[i];
        const x = pos.x * cellSize + cellSize / 2;
        const y = pos.y * cellSize + cellSize / 2;
        
        ctx.strokeStyle = isSafeSquare(i) ? '#4CAF50' : '#999';
        ctx.lineWidth = isSafeSquare(i) ? 2 : 1;
        ctx.strokeRect(x - cellSize / 2 + 5, y - cellSize / 2 + 5, cellSize - 10, cellSize - 10);
        
        // Draw square number for debugging
        ctx.fillStyle = '#999';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, x, y);
    }
}

function getBoardPositions() {
    const positions = [];
    const cellSize = 600 / 15;
    
    // Right vertical line (bottom to top)
    for (let i = 0; i < 6; i++) {
        positions.push({ x: 8 + i % 2, y: 14 - i });
    }
    
    // Top horizontal line (right to left)
    for (let i = 6; i < 15; i++) {
        positions.push({ x: 14 - (i - 6), y: 8 - Math.floor((i - 6) / 2) });
    }
    
    // Left vertical line (top to bottom)
    for (let i = 15; i < 21; i++) {
        positions.push({ x: 7 - (i - 15) % 2, y: 1 + (i - 15) });
    }
    
    // Bottom horizontal line (left to right)
    for (let i = 21; i < 30; i++) {
        positions.push({ x: 1 + (i - 21), y: 7 + Math.floor((i - 21) / 2) });
    }
    
    // Right vertical line (bottom to top) - second half
    for (let i = 30; i < 39; i++) {
        positions.push({ x: 8 + (i - 30) % 2, y: 14 - (i - 30) });
    }
    
    // Top horizontal line (right to left) - second half
    for (let i = 39; i < 48; i++) {
        positions.push({ x: 14 - (i - 39), y: 8 - Math.floor((i - 39) / 2) });
    }
    
    // Left vertical line (top to bottom) - second half
    for (let i = 48; i < 52; i++) {
        positions.push({ x: 7 - (i - 48) % 2, y: 1 + (i - 48) });
    }
    
    return positions;
}

function isSafeSquare(index) {
    const safeSquares = [0, 9, 17, 26, 34, 43, 51];
    return safeSquares.includes(index);
}

function drawHomeAndFinish(cellSize) {
    const homeSize = cellSize * 3;
    
    // Home areas
    const corners = [
        { x: 0, y: 0, color: 'red' },
        { x: canvas.width - homeSize, y: 0, color: 'green' },
        { x: canvas.width - homeSize, y: canvas.height - homeSize, color: 'yellow' },
        { x: 0, y: canvas.height - homeSize, color: 'blue' }
    ];
    
    corners.forEach(corner => {
        ctx.fillStyle = COLOR_HEX[corner.color] + '30';
        ctx.fillRect(corner.x, corner.y, homeSize, homeSize);
        ctx.strokeStyle = COLOR_HEX[corner.color];
        ctx.lineWidth = 2;
        ctx.strokeRect(corner.x, corner.y, homeSize, homeSize);
    });
}

function drawPawns(cellSize) {
    gameState.players.forEach((player, playerIndex) => {
        const pawnRadius = cellSize / 4;
        
        player.pawns.forEach((pawn, pawnIndex) => {
            let x, y;
            
            if (pawn.position === -1) {
                // In home
                const homeX = playerIndex % 2 === 0 ? cellSize / 2 : canvas.width - cellSize / 2;
                const homeY = playerIndex < 2 ? cellSize / 2 : canvas.height - cellSize / 2;
                const offset = 40;
                const row = Math.floor(pawnIndex / 2);
                const col = pawnIndex % 2;
                x = homeX + (col - 0.5) * offset;
                y = homeY + (row - 0.5) * offset;
            } else {
                // On board
                const positions = getBoardPositions();
                if (pawn.position < positions.length) {
                    const pos = positions[pawn.position];
                    x = pos.x * cellSize + cellSize / 2;
                    y = pos.y * cellSize + cellSize / 2;
                }
            }
            
            // Draw pawn
            ctx.fillStyle = COLOR_HEX[player.color];
            ctx.beginPath();
            ctx.arc(x, y, pawnRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw pawn number
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pawnIndex + 1, x, y);
        });
    });
}

function drawSafeSquares(cellSize) {
    ctx.fillStyle = '#4CAF50';
    ctx.globalAlpha = 0.1;
    
    const boardPositions = getBoardPositions();
    const safeSquares = [0, 9, 17, 26, 34, 43, 51];
    
    safeSquares.forEach(safeIndex => {
        const pos = boardPositions[safeIndex];
        const x = pos.x * cellSize + cellSize / 2;
        const y = pos.y * cellSize + cellSize / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalAlpha = 1;
}

// Dice Rolling
function rollDice() {
    if (!gameState.gameActive || gameState.diceRolled) return;
    
    playSound(diceSound);
    
    const diceBtn = document.getElementById('diceBtn');
    diceBtn.disabled = true;
    
    // Animate dice
    let frame = 1;
    const diceInterval = setInterval(() => {
        document.getElementById('diceImg').src = `rotateobject/${frame}.png`;
        frame++;
        if (frame > 6) frame = 1;
    }, 50);
    
    setTimeout(() => {
        clearInterval(diceInterval);
        
        // Get final dice value
        gameState.lastDiceValue = Math.floor(Math.random() * 6) + 1;
        
        const diceImg = document.getElementById('diceImg');
        diceImg.src = `rotateobject/${gameState.lastDiceValue}.png`;
        
        document.getElementById('diceValue').textContent = `Dice: ${gameState.lastDiceValue}`;
        
        gameState.diceRolled = true;
        
        if (gameState.lastDiceValue === 6) {
            gameState.consecutiveSixes++;
        } else {
            gameState.consecutiveSixes = 0;
        }
        
        // Check if player can move
        handlePlayerTurn();
        
        diceBtn.disabled = false;
    }, 500);
}

function handlePlayerTurn() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Check if player has pawns to move
    const hasMovablePawns = currentPlayer.pawns.some(pawn => {
        if (pawn.finished) return false;
        if (gameState.lastDiceValue === 6 && pawn.position === -1) return true; // Can move out with 6
        if (pawn.position >= 0) return true; // Can move if already out
        return false;
    });
    
    if (!hasMovablePawns && gameState.lastDiceValue !== 6) {
        setTimeout(nextPlayer, 1500);
        return;
    }
    
    // If rolled 6, get another turn
    if (gameState.lastDiceValue === 6 && gameState.consecutiveSixes < 3) {
        setTimeout(() => {
            gameState.diceRolled = false;
            document.getElementById('diceBtn').disabled = false;
        }, 1000);
    } else {
        // Auto advance to next player after a delay
        setTimeout(() => {
            if (!gameState.diceRolled || gameState.consecutiveSixes >= 3) {
                nextPlayer();
            }
        }, 2000);
    }
}

function nextPlayer() {
    gameState.diceRolled = false;
    gameState.lastDiceValue = 0;
    document.getElementById('diceValue').textContent = 'Dice: 0';
    
    // Find next player who is not finished
    let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    let attempts = 0;
    
    while (gameState.players[nextIndex].pawns.every(p => p.finished) && attempts < gameState.players.length) {
        nextIndex = (nextIndex + 1) % gameState.players.length;
        attempts++;
    }
    
    gameState.currentPlayerIndex = nextIndex;
    gameState.consecutiveSixes = 0;
    
    updatePlayerInfo();
    document.getElementById('diceBtn').disabled = false;
    
    // Check for winner
    checkWinner();
}

function updatePlayerInfo() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const playerName = `${currentPlayer.color.charAt(0).toUpperCase() + currentPlayer.color.slice(1)}'s Turn`;
    document.getElementById('currentPlayer').textContent = playerName;
    
    drawBoard();
}

function updatePlayerStats() {
    const statsDiv = document.getElementById('playerStats');
    statsDiv.innerHTML = '';
    
    gameState.players.forEach(player => {
        const finishedCount = player.pawns.filter(p => p.finished).length;
        const stat = document.createElement('div');
        stat.className = `player-stat ${player.color}`;
        stat.innerHTML = `${player.color.toUpperCase()}: ${finishedCount}/4 Finished`;
        statsDiv.appendChild(stat);
    });
}

// Sound Management
function toggleMusic() {
    gameState.musicEnabled = !gameState.musicEnabled;
    const btn = document.getElementById('musicBtnText');
    
    if (gameState.musicEnabled) {
        btn.textContent = '🔊 Music ON';
        bgMusic.volume = 0.3;
        if (gameState.gameActive) {
            bgMusic.play();
        }
    } else {
        btn.textContent = '🔇 Music OFF';
        bgMusic.pause();
    }
}

function playBgMusic() {
    if (gameState.musicEnabled) {
        bgMusic.volume = 0.3;
        bgMusic.play();
    }
}

function playSound(audio) {
    if (gameState.musicEnabled) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Game Logic
function movePawn(pawnIndex, steps) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const pawn = currentPlayer.pawns[pawnIndex];
    
    if (pawn.finished) return false;
    
    // If pawn is at home, need to roll 6
    if (pawn.position === -1) {
        if (gameState.lastDiceValue !== 6) return false;
        pawn.position = 0;
        playSound(moveSound);
        return true;
    }
    
    // Move pawn
    const newPosition = pawn.position + steps;
    
    if (newPosition >= BOARD_SIZE) {
        // Move to finish area
        const finishPosition = newPosition - BOARD_SIZE;
        if (finishPosition >= FINISH_SIZE) return false;
        
        pawn.position = BOARD_SIZE + finishPosition;
        
        if (finishPosition === FINISH_SIZE - 1) {
            pawn.finished = true;
            currentPlayer.score++;
            playSound(winSound);
        } else {
            playSound(moveSound);
        }
    } else {
        pawn.position = newPosition;
        playSound(moveSound);
        
        // Check for captures
        checkCapture(newPosition);
    }
    
    return true;
}

function checkCapture(position) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const safeSquares = [0, 9, 17, 26, 34, 43, 51];
    
    if (safeSquares.includes(position)) return; // Safe squares can't be captured
    
    gameState.players.forEach((player, playerIndex) => {
        if (playerIndex === gameState.currentPlayerIndex) return;
        
        player.pawns.forEach(pawn => {
            if (pawn.position === position && !pawn.finished) {
                pawn.position = -1; // Send back home
                playSound(captureSound);
            }
        });
    });
}

function checkWinner() {
    let finishedPlayers = [];
    
    gameState.players.forEach((player, index) => {
        const allFinished = player.pawns.every(p => p.finished);
        if (allFinished && !gameState.ranking.includes(index)) {
            gameState.ranking.push(index);
            finishedPlayers.push(player);
        }
    });
    
    if (gameState.ranking.length === gameState.players.length - 1) {
        gameState.gameActive = false;
        showResults();
    }
}

function showResults() {
    bgMusic.pause();
    gameState.gameEnded = true;
    
    const rankingDiv = document.getElementById('resultRanking');
    rankingDiv.innerHTML = '';
    
    const winner = gameState.players[gameState.ranking[0]];
    document.getElementById('resultTitle').textContent = 
        `${winner.color.toUpperCase()} Player Won!`;
    
    gameState.ranking.forEach((playerIndex, rank) => {
        const player = gameState.players[playerIndex];
        const rankItem = document.createElement('div');
        rankItem.className = `rank-item`;
        rankItem.style.borderLeftColor = COLOR_HEX[player.color];
        rankItem.textContent = `${rank + 1}. ${player.color.toUpperCase()} Player`;
        rankingDiv.appendChild(rankItem);
    });
    
    showScreen('resultScreen');
}

function playAgain() {
    startGame(gameState.players.length);
}

function quitGame() {
    if (confirm('Are you sure you want to quit?')) {
        bgMusic.pause();
        gameState.gameActive = false;
        backToMenu();
    }
}

// Click handlers for pawn selection (future enhancement)
canvas?.addEventListener('click', (e) => {
    if (!gameState.gameActive || !gameState.diceRolled) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check which pawn was clicked
    const cellSize = canvas.width / 15;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const pawnRadius = cellSize / 4;
    
    currentPlayer.pawns.forEach((pawn, index) => {
        let pawnX, pawnY;
        
        if (pawn.position === -1) {
            const homeX = gameState.currentPlayerIndex % 2 === 0 ? cellSize / 2 : canvas.width - cellSize / 2;
            const homeY = gameState.currentPlayerIndex < 2 ? cellSize / 2 : canvas.height - cellSize / 2;
            const offset = 40;
            const row = Math.floor(index / 2);
            const col = index % 2;
            pawnX = homeX + (col - 0.5) * offset;
            pawnY = homeY + (row - 0.5) * offset;
        } else {
            const positions = getBoardPositions();
            const pos = positions[pawn.position % BOARD_SIZE];
            pawnX = pos.x * cellSize + cellSize / 2;
            pawnY = pos.y * cellSize + cellSize / 2;
        }
        
        const distance = Math.sqrt((x - pawnX) ** 2 + (y - pawnY) ** 2);
        if (distance < pawnRadius * 2) {
            movePawn(index, gameState.lastDiceValue);
            gameState.diceRolled = false;
            document.getElementById('diceBtn').disabled = false;
            updatePlayerStats();
            drawBoard();
            
            if (gameState.lastDiceValue !== 6 || gameState.consecutiveSixes >= 3) {
                setTimeout(nextPlayer, 500);
            }
        }
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePlayerStats();
});
