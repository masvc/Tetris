// キャンバスの設定
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece');
const nextCtx = nextPieceCanvas.getContext('2d');

// ゲームボードの設定
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// キャンバスのサイズ設定
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
nextPieceCanvas.width = 4 * BLOCK_SIZE;
nextPieceCanvas.height = 4 * BLOCK_SIZE;

// テトリミノの形状定義
const ANIMAL_SHAPES = [
    // 猫
    [
        [0, 1, 0],
        [1, 1, 1],
        [1, 0, 1]
    ],
    // 犬
    [
        [1, 1, 0],
        [1, 1, 1],
        [1, 0, 0]
    ],
    // うさぎ
    [
        [1, 1, 1],
        [0, 1, 0],
        [1, 0, 1]
    ],
    // パンダ
    [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1]
    ],
    // ペンギン
    [
        [1, 1, 1],
        [1, 1, 1],
        [0, 1, 0]
    ],
    // ゾウ
    [
        [1, 1, 1],
        [1, 0, 1],
        [0, 1, 0]
    ],
    // キリン
    [
        [1, 0, 0],
        [1, 1, 1],
        [1, 0, 1]
    ]
];

// 動物の色定義
const ANIMAL_COLORS = [
    '#FFB6C1', // 猫 - ピンク
    '#D2B48C', // 犬 - 茶色
    '#FFFFFF', // うさぎ - 白
    '#000000', // パンダ - 黒
    '#000000', // ペンギン - 黒
    '#808080', // ゾウ - グレー
    '#FFD700'  // キリン - ゴールド
];

// サウンドエフェクト
const sounds = {
    move: document.getElementById('moveSound'),
    rotate: document.getElementById('rotateSound'),
    drop: document.getElementById('dropSound'),
    clear: document.getElementById('clearSound'),
    gameOver: document.getElementById('gameOverSound')
};

// 設定の状態
let settings = {
    sound: true,
    animation: true
};

// 設定の初期化
function initSettings() {
    const soundSwitch = document.getElementById('sound-switch');
    const animationSwitch = document.getElementById('animation-switch');

    // ローカルストレージから設定を読み込む
    const savedSettings = localStorage.getItem('tetrisSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        soundSwitch.checked = settings.sound;
        animationSwitch.checked = settings.animation;
    }

    // イベントリスナーの設定
    soundSwitch.addEventListener('change', (e) => {
        settings.sound = e.target.checked;
        localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    });

    animationSwitch.addEventListener('change', (e) => {
        settings.animation = e.target.checked;
        localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    });
}

// サウンドを再生する関数
function playSound(sound) {
    if (!settings.sound) return;
    sound.currentTime = 0;
    sound.play().catch(e => console.log('音声の再生に失敗しました:', e));
}

// テトリミノクラス
class Tetromino {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.x = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
        this.y = 0;
    }

    // テトリミノの描画
    draw() {
        ctx.fillStyle = this.color;
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const blockX = (this.x + x) * BLOCK_SIZE;
                    const blockY = (this.y + y) * BLOCK_SIZE;
                    
                    // ブロックの描画
                    ctx.fillRect(
                        blockX,
                        blockY,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );

                    // ブロックのハイライト
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(
                        blockX + 2,
                        blockY + 2,
                        BLOCK_SIZE - 5,
                        BLOCK_SIZE - 5
                    );
                    ctx.fillStyle = this.color;
                }
            });
        });
    }

    // 衝突判定
    collision(x, y, shape = this.shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 0) continue;
                
                const newX = x + col;
                const newY = y + row;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                if (newY < 0) continue;

                if (board[newY][newX] !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    // 左に移動
    moveLeft() {
        if (!this.collision(this.x - 1, this.y)) {
            this.x--;
            playSound(sounds.move);
            return true;
        }
        return false;
    }

    // 右に移動
    moveRight() {
        if (!this.collision(this.x + 1, this.y)) {
            this.x++;
            playSound(sounds.move);
            return true;
        }
        return false;
    }

    // 下に移動
    moveDown() {
        if (!this.collision(this.x, this.y + 1)) {
            this.y++;
            return true;
        }
        return false;
    }

    // テトリミノを回転
    rotate() {
        const originalShape = this.shape;
        const rotated = this.shape[0].map((_, i) =>
            this.shape.map(row => row[i]).reverse()
        );

        if (!this.collision(this.x, this.y, rotated)) {
            this.shape = rotated;
            playSound(sounds.rotate);
            return true;
        }
        return false;
    }

    // テトリミノをボードに固定
    lock() {
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[this.y + y][this.x + x] = this.color;
                }
            });
        });
    }

    // ハードドロップ
    hardDrop() {
        let dropped = false;
        while (this.moveDown()) {
            dropped = true;
        }
        if (dropped) {
            playSound(sounds.drop);
        }
    }
}

// ゲームの状態
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let nextPiece = null;
let score = 0;
let dropCounter = 0;
let dropInterval = 1000; // ミリ秒
let lastTime = 0;

// 新しいテトリミノの生成
function createNewPiece() {
    const randomIndex = Math.floor(Math.random() * ANIMAL_SHAPES.length);
    return new Tetromino(ANIMAL_SHAPES[randomIndex], ANIMAL_COLORS[randomIndex]);
}

// ゲームの初期化
function init() {
    initSettings();
    currentPiece = createNewPiece();
    nextPiece = createNewPiece();
    drawNextPiece();
}

// ゲームボードの描画
function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ラインが揃っているかチェック
function checkLines() {
    let linesCleared = 0;
    let linesToClear = [];
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            linesToClear.push(y);
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        if (settings.animation) {
            // ライン消去のアニメーション
            linesToClear.forEach(y => {
                for (let x = 0; x < COLS; x++) {
                    const block = document.createElement('div');
                    block.className = 'line-clear';
                    block.style.position = 'absolute';
                    block.style.left = `${x * BLOCK_SIZE}px`;
                    block.style.top = `${y * BLOCK_SIZE}px`;
                    block.style.width = `${BLOCK_SIZE - 1}px`;
                    block.style.height = `${BLOCK_SIZE - 1}px`;
                    block.style.backgroundColor = board[y][x];
                    document.querySelector('.game-board').appendChild(block);
                    
                    setTimeout(() => {
                        block.remove();
                    }, 300);
                }
            });

            setTimeout(() => {
                removeLines(linesToClear);
            }, 300);
        } else {
            removeLines(linesToClear);
        }

        score += linesCleared * 100;
        const scoreElement = document.getElementById('score');
        scoreElement.textContent = score;
        if (settings.animation) {
            scoreElement.classList.add('pulse');
            setTimeout(() => scoreElement.classList.remove('pulse'), 300);
        }
        playSound(sounds.clear);
    }
}

// ラインを削除する関数
function removeLines(linesToClear) {
    linesToClear.forEach(y => {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
    });
}

// ゲームオーバー判定
function isGameOver() {
    return board[0].some(cell => cell !== 0);
}

// ネクストブロックの表示
function drawNextPiece() {
    // 背景をクリア
    nextCtx.fillStyle = '#f8f8f8';
    nextCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    // ネクストブロックを描画
    nextCtx.fillStyle = nextPiece.color;
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextCtx.fillRect(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

// ゲームオーバー処理
function showGameOver() {
    const gameOverElement = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'flex';
    
    restartButton.addEventListener('click', () => {
        gameOverElement.style.display = 'none';
        board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        score = 0;
        document.getElementById('score').textContent = score;
        currentPiece = createNewPiece();
        nextPiece = createNewPiece();
        drawNextPiece();
    });
}

// ゲームループ
function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        if (!currentPiece.moveDown()) {
            currentPiece.lock();
            checkLines();
            
            if (isGameOver()) {
                playSound(sounds.gameOver);
                showGameOver();
            } else {
                currentPiece = nextPiece;
                nextPiece = createNewPiece();
                drawNextPiece();
            }
        }
        dropCounter = 0;
    }

    drawBoard();
    // 固定されたブロックを描画
    board.forEach((row, y) => {
        row.forEach((color, x) => {
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );

                // ブロックのハイライト
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(
                    x * BLOCK_SIZE + 2,
                    y * BLOCK_SIZE + 2,
                    BLOCK_SIZE - 5,
                    BLOCK_SIZE - 5
                );
            }
        });
    });
    currentPiece.draw();
    requestAnimationFrame(gameLoop);
}

// イベントリスナーの設定
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        currentPiece.moveLeft();
    } else if (e.key === 'ArrowRight') {
        currentPiece.moveRight();
    } else if (e.key === 'ArrowDown') {
        currentPiece.moveDown();
    } else if (e.key === 'ArrowUp') {
        currentPiece.rotate();
    } else if (e.key === ' ') {
        currentPiece.hardDrop();
    }
});

// ゲーム開始
init();
gameLoop(); 