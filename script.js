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
    // I型（縦長）
    [
        [1],
        [1],
        [1],
        [1]
    ],
    // O型（正方形）
    [
        [1, 1],
        [1, 1]
    ],
    // T型
    [
        [0, 1, 0],
        [1, 1, 1]
    ],
    // L型
    [
        [1, 0],
        [1, 0],
        [1, 1]
    ],
    // J型
    [
        [0, 1],
        [0, 1],
        [1, 1]
    ],
    // S型
    [
        [0, 1, 1],
        [1, 1, 0]
    ],
    // Z型
    [
        [1, 1, 0],
        [0, 1, 1]
    ],
    // 爆弾ブロック
    [
        [2]
    ]
];

// 動物の色定義
const ANIMAL_COLORS = [
    '#00FFFF', // I型 - シアン
    '#FFFF00', // O型 - イエロー
    '#800080', // T型 - パープル
    '#FFA500', // L型 - オレンジ
    '#0000FF', // J型 - ブルー
    '#00FF00', // S型 - グリーン
    '#FF0000', // Z型 - レッド
    '#FF00FF'  // 爆弾ブロック - マゼンタ
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
    const mobileSoundSwitch = document.getElementById('mobile-sound-switch');
    const mobileAnimationSwitch = document.getElementById('mobile-animation-switch');

    // ローカルストレージから設定を読み込む
    const savedSettings = localStorage.getItem('tetrisSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        soundSwitch.checked = settings.sound;
        animationSwitch.checked = settings.animation;
        mobileSoundSwitch.checked = settings.sound;
        mobileAnimationSwitch.checked = settings.animation;
    }

    // PC版の設定変更イベント
    soundSwitch.addEventListener('change', (e) => {
        settings.sound = e.target.checked;
        mobileSoundSwitch.checked = e.target.checked;
        localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    });

    animationSwitch.addEventListener('change', (e) => {
        settings.animation = e.target.checked;
        mobileAnimationSwitch.checked = e.target.checked;
        localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    });

    // スマホ版の設定変更イベント
    mobileSoundSwitch.addEventListener('change', (e) => {
        settings.sound = e.target.checked;
        soundSwitch.checked = e.target.checked;
        localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    });

    mobileAnimationSwitch.addEventListener('change', (e) => {
        settings.animation = e.target.checked;
        animationSwitch.checked = e.target.checked;
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
                    
                    if (value === 2) { // 爆弾ブロックの場合
                        // 爆弾ブロックの特別な描画
                        ctx.fillStyle = '#FF00FF';
                        ctx.fillRect(
                            blockX,
                            blockY,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                        
                        // 爆弾の本体を描画
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(blockX + BLOCK_SIZE/2, blockY + BLOCK_SIZE/2, BLOCK_SIZE/3, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 爆弾の上部を描画
                        ctx.fillStyle = '#FF0000';
                        ctx.beginPath();
                        ctx.arc(blockX + BLOCK_SIZE/2, blockY + BLOCK_SIZE/3, BLOCK_SIZE/4, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 導火線を描画
                        ctx.strokeStyle = '#FFA500';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(blockX + BLOCK_SIZE/2, blockY + BLOCK_SIZE/3);
                        ctx.lineTo(blockX + BLOCK_SIZE/2, blockY);
                        ctx.stroke();
                        
                        // 導火線の先端の炎を描画
                        ctx.fillStyle = '#FF4500';
                        ctx.beginPath();
                        ctx.arc(blockX + BLOCK_SIZE/2, blockY, 3, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // ブロックの描画
                        ctx.fillRect(
                            blockX,
                            blockY,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );

                        // 動物の特徴を描画
                        const animalIndex = ANIMAL_SHAPES.findIndex(shape => 
                            JSON.stringify(shape) === JSON.stringify(this.shape)
                        );

                        // 目を描画
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(blockX + BLOCK_SIZE/3, blockY + BLOCK_SIZE/3, 3, 0, Math.PI * 2);
                        ctx.arc(blockX + BLOCK_SIZE*2/3, blockY + BLOCK_SIZE/3, 3, 0, Math.PI * 2);
                        ctx.fill();

                        // 瞳を描画
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(blockX + BLOCK_SIZE/3, blockY + BLOCK_SIZE/3, 1.5, 0, Math.PI * 2);
                        ctx.arc(blockX + BLOCK_SIZE*2/3, blockY + BLOCK_SIZE/3, 1.5, 0, Math.PI * 2);
                        ctx.fill();

                        // 鼻と口を描画
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(blockX + BLOCK_SIZE/2, blockY + BLOCK_SIZE*2/3, 2, 0, Math.PI * 2);
                        ctx.fill();

                        // 動物ごとの特別な特徴を描画
                        switch(animalIndex) {
                            case 0: // I型
                                // I型の特徴を描画
                                break;
                            case 1: // O型
                                // O型の特徴を描画
                                break;
                            case 2: // T型
                                // T型の特徴を描画
                                break;
                            case 3: // L型
                                // L型の特徴を描画
                                break;
                            case 4: // J型
                                // J型の特徴を描画
                                break;
                            case 5: // S型
                                // S型の特徴を描画
                                break;
                            case 6: // Z型
                                // Z型の特徴を描画
                                break;
                        }

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
            return true;
        }
        return false;
    }

    // 右に移動
    moveRight() {
        if (!this.collision(this.x + 1, this.y)) {
            this.x++;
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
            return true;
        }
        return false;
    }

    // テトリミノをボードに固定
    lock() {
        if (this.applyBombEffect()) {
            // 爆弾効果が適用された場合は特別な処理
            drawBoard();
            return;
        }
        
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[this.y + y][this.x + x] = this.color;
                }
            });
        });
        
        // 次のピースを作成
        currentPiece = nextPiece;
        nextPiece = createNewPiece();
        
        // ライン消去チェック
        checkLines();
        
        // ゲームオーバーチェック
        if (isGameOver()) {
            showGameOver();
            return;
        }
        
        drawBoard();
        drawNextPiece();
    }

    // 爆弾効果を適用
    applyBombEffect() {
        if (this.shape[0][0] === 2) { // 爆弾ブロックの場合
            const x = this.x;
            const y = this.y;
            
            // 爆発エフェクトの描画
            ctx.fillStyle = '#FF00FF';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = BLOCK_SIZE * 1.5;
                const particleX = (x + 0.5) * BLOCK_SIZE + Math.cos(angle) * radius;
                const particleY = (y + 0.5) * BLOCK_SIZE + Math.sin(angle) * radius;
                
                ctx.beginPath();
                ctx.arc(particleX, particleY, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 周囲のブロックを消す
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    // ボードの範囲内かチェック
                    if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
                        board[newY][newX] = 0;
                    }
                }
            }
            
            // 爆発エフェクトのアニメーション
            setTimeout(() => {
                drawBoard();
            }, 300);
            
            return true;
        }
        return false;
    }

    // ハードドロップ
    hardDrop() {
        let dropped = false;
        while (this.moveDown()) {
            dropped = true;
        }
        if (dropped) {
            this.lock();
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
let level = 1; // レベルを追加

// レベルに応じた落下速度を計算する関数
function calculateDropInterval() {
    // レベルが上がるごとに落下速度が速くなる
    // レベル1: 1000ms, レベル2: 800ms, レベル3: 600ms, ...
    return Math.max(100, 1000 - (level - 1) * 200);
}

// スコアに応じてレベルを更新する関数
function updateLevel() {
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropInterval = calculateDropInterval();
    }
}

// 新しいテトリミノの生成
function createNewPiece() {
    const randomIndex = Math.floor(Math.random() * ANIMAL_SHAPES.length);
    return new Tetromino(ANIMAL_SHAPES[randomIndex], ANIMAL_COLORS[randomIndex]);
}

// ゲームの初期化
function init() {
    initSettings();
    initTouchControls();
    currentPiece = createNewPiece();
    nextPiece = createNewPiece();
    drawNextPiece();
    score = 0;
    level = 1;
    dropInterval = calculateDropInterval();
    document.getElementById('score').textContent = score;
    document.getElementById('mobile-score').textContent = score;
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

        // スコア計算（消したライン数に応じて）
        score += linesCleared * 100 * level;
        updateLevel();
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
    const nextPieceCanvas = document.getElementById('next-piece');
    const mobileNextPieceCanvas = document.getElementById('mobile-next-piece');
    const nextCtx = nextPieceCanvas.getContext('2d');
    const mobileNextCtx = mobileNextPieceCanvas.getContext('2d');

    // キャンバスのサイズ設定
    nextPieceCanvas.width = 4 * BLOCK_SIZE;
    nextPieceCanvas.height = 4 * BLOCK_SIZE;
    mobileNextPieceCanvas.width = 4 * BLOCK_SIZE;
    mobileNextPieceCanvas.height = 4 * BLOCK_SIZE;

    // 背景をクリア
    nextCtx.fillStyle = '#f8f8f8';
    nextCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    mobileNextCtx.fillStyle = '#f8f8f8';
    mobileNextCtx.fillRect(0, 0, mobileNextPieceCanvas.width, mobileNextPieceCanvas.height);
    
    // ネクストブロックを描画（PC版）
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

    // ネクストブロックを描画（スマホ版）
    mobileNextCtx.fillStyle = nextPiece.color;
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                mobileNextCtx.fillRect(
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

// ハンバーガーメニューの制御
const menuButton = document.getElementById('menu-button');
const menuPanel = document.getElementById('menu-panel');

menuButton.addEventListener('click', () => {
    menuButton.classList.toggle('active');
    menuPanel.classList.toggle('active');
});

// メニュー外クリックで閉じる
document.addEventListener('click', (e) => {
    if (!menuPanel.contains(e.target) && !menuButton.contains(e.target)) {
        menuButton.classList.remove('active');
        menuPanel.classList.remove('active');
    }
});

// タッチイベントの処理
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
});

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    
    // 右スワイプでメニューを開く
    if (swipeDistance > 50 && !menuPanel.classList.contains('active')) {
        menuButton.classList.add('active');
        menuPanel.classList.add('active');
    }
    
    // 左スワイプでメニューを閉じる
    if (swipeDistance < -50 && menuPanel.classList.contains('active')) {
        menuButton.classList.remove('active');
        menuPanel.classList.remove('active');
    }
}

// タッチ操作の処理
function initTouchControls() {
    const touchAreas = document.querySelectorAll('.touch-area');
    let touchStartTime = 0;
    let touchHoldInterval = null;

    touchAreas.forEach(area => {
        // タッチ開始時の処理
        area.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartTime = Date.now();
            const action = area.dataset.action;

            // 下方向の場合は長押しで高速落下
            if (action === 'down') {
                performAction(action);
                touchHoldInterval = setInterval(() => {
                    performAction(action);
                }, 50);
            } else {
                performAction(action);
            }
        });

        // タッチ終了時の処理
        area.addEventListener('touchend', () => {
            if (touchHoldInterval) {
                clearInterval(touchHoldInterval);
                touchHoldInterval = null;
            }
        });

        // タッチがキャンセルされた時の処理
        area.addEventListener('touchcancel', () => {
            if (touchHoldInterval) {
                clearInterval(touchHoldInterval);
                touchHoldInterval = null;
            }
        });
    });
}

// アクションの実行
function performAction(action) {
    switch (action) {
        case 'rotate':
            currentPiece.rotate();
            break;
        case 'left':
            currentPiece.moveLeft();
            break;
        case 'right':
            currentPiece.moveRight();
            break;
        case 'down':
            currentPiece.moveDown();
            break;
    }
}

// ゲーム開始
init();
gameLoop(); 