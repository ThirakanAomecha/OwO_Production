document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('version-display').textContent = 'v1.2';

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // --- Firebase and User ---
    let db;
    let currentUser = null;
    // try {
    //     db = firebase.firestore();
    //     firebase.auth().onAuthStateChanged(user => {
    //         currentUser = user;
    //         console.log("Current user:", currentUser ? currentUser.uid : "None");
    //     });
    // } catch (e) {
    //     console.error("Firebase not initialized, score saving will be disabled.", e);
    // }

    // --- Canvas and Game Setup ---
    const gameWidth = 800;
    const gameHeight = 600;
    canvas.width = gameWidth;
    canvas.height = gameHeight;

    // --- Game Objects ---
    const paddleWidth = 10;
    const paddleHeight = 100;
    const ballSize = 10;

    const player = {
        x: 10,
        y: gameHeight / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        score: 0,
        speed: 7
    };

    const opponent = {
        x: gameWidth - paddleWidth - 10,
        y: gameHeight / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        score: 0,
        speed: 7
    };

    const ball = {
        x: gameWidth / 2,
        y: gameHeight / 2,
        size: ballSize,
        speed: 5,
        dx: 5,
        dy: 5
    };

    // --- Input Handling ---
    const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };
    const mobileControlsState = { p1Up: false, p1Down: false, p2Up: false, p2Down: false };

    document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
    document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

    // --- NippleJS Joystick Setup ---
    const joystickP1 = nipplejs.create({
        zone: document.getElementById('joystick-container-p1'),
        mode: 'static',
        position: { left: '25%', top: '50%' },
        color: 'white'
    });

    const joystickP2 = nipplejs.create({
        zone: document.getElementById('joystick-container-p2'),
        mode: 'static',
        position: { right: '25%', top: '50%' },
        color: 'white'
    });

    let p1JoystickY = 0;
    let p2JoystickY = 0;

    // Game state
    let gamePaused = false;
    let ballServed = false;
    let gameInterval; // To control game loop

    // Button elements
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');
    const btnX = document.getElementById('btn-x');
    const btnY = document.getElementById('btn-y');

    // Power-up settings
    const POWER_UP_DURATION = 3000; // 3 seconds
    const PADDLE_GROWTH = 50; // How much paddle grows

    let p1PowerUpActive = false;
    let p2PowerUpActive = false;
    let p1PowerUpTimeout;
    let p2PowerUpTimeout;

    // Event listeners for action buttons
    btnA.addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); });
    btnB.addEventListener('touchstart', (e) => { e.preventDefault(); resetGame(); });
    btnX.addEventListener('touchstart', (e) => { e.preventDefault(); activatePowerUp(player); });
    btnY.addEventListener('touchstart', (e) => { e.preventDefault(); activatePowerUp(opponent); });

    function togglePause() {
        gamePaused = !gamePaused;
    }

    function resetGame() {
        player.score = 0;
        opponent.score = 0;
        player.y = gameHeight / 2 - paddleHeight / 2;
        opponent.y = gameHeight / 2 - paddleHeight / 2;
        resetBall();
        gamePaused = true; // Pause game until 'A' is pressed to start
        ballServed = false;

        // Clear any active power-ups
        if (p1PowerUpActive) {
            clearTimeout(p1PowerUpTimeout);
            player.height = paddleHeight;
            p1PowerUpActive = false;
        }
        if (p2PowerUpActive) {
            clearTimeout(p2PowerUpTimeout);
            opponent.height = paddleHeight;
            p2PowerUpActive = false;
        }
        draw(); // Redraw immediately after reset
    }

    function activatePowerUp(targetPaddle) {
        if (targetPaddle === player && !p1PowerUpActive) {
            player.height += PADDLE_GROWTH;
            p1PowerUpActive = true;
            p1PowerUpTimeout = setTimeout(() => {
                player.height = paddleHeight;
                p1PowerUpActive = false;
            }, POWER_UP_DURATION);
        } else if (targetPaddle === opponent && !p2PowerUpActive) {
            opponent.height += PADDLE_GROWTH;
            p2PowerUpActive = true;
            p2PowerUpTimeout = setTimeout(() => {
                opponent.height = paddleHeight;
                p2PowerUpActive = false;
            }, POWER_UP_DURATION);
        }
    }

    // --- Game Logic ---
    function update() {
        if (!gamePaused) {
            // Serve ball if not served yet (only after a score or game start)
            if (!ballServed) {
                ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
                ball.dy = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
                ballServed = true;
            }

            // Player 1 Movement (Keyboard OR Mobile)
            if (keys.w && player.y > 0) {
                player.y -= player.speed;
            }
            if (keys.s && player.y < gameHeight - player.height) {
                player.y += player.speed;
            }
            if (p1JoystickY < 0 && player.y > 0) {
                player.y += player.speed * p1JoystickY;
            }
            if (p1JoystickY > 0 && player.y < gameHeight - player.height) {
                player.y += player.speed * p1JoystickY;
            }

            // Clamp player position
            if (player.y < 0) player.y = 0;
            if (player.y > gameHeight - player.height) player.y = gameHeight - player.height;

            // Player 2 Movement (Keyboard OR Mobile)
            if (keys.ArrowUp && opponent.y > 0) {
                opponent.y -= opponent.speed;
            }
            if (keys.ArrowDown && opponent.y < gameHeight - opponent.height) {
                opponent.y += opponent.speed;
            }
            if (p2JoystickY < 0 && opponent.y > 0) {
                opponent.y += opponent.speed * p2JoystickY;
            }
            if (p2JoystickY > 0 && opponent.y < gameHeight - opponent.height) {
                opponent.y += opponent.speed * p2JoystickY;
            }

            // Clamp opponent position
            if (opponent.y < 0) opponent.y = 0;
            if (opponent.y > gameHeight - opponent.height) opponent.y = gameHeight - opponent.height;


            ball.x += ball.dx;
            ball.y += ball.dy;

            if (ball.y + ball.size > gameHeight || ball.y < 0) ball.dy *= -1;

            if (
                (ball.dx < 0 && ball.x < player.x + player.width && ball.y > player.y && ball.y < player.y + player.height) ||
                (ball.dx > 0 && ball.x + ball.size > opponent.x && ball.y > opponent.y && ball.y < opponent.y + opponent.height)
            ) {
                ball.dx *= -1;
            }

            if (ball.x + ball.size < 0) {
                opponent.score++;
                // saveScore(currentUser, player.score, opponent.score);
                resetBall();
                gamePaused = true; // Pause after score
                ballServed = false;
            }
            if (ball.x > gameWidth) {
                player.score++;
                // saveScore(currentUser, player.score, opponent.score);
                resetBall();
                gamePaused = true; // Pause after score
                ballServed = false;
            }
        }
    }

    function resetBall() {
        ball.x = gameWidth / 2;
        ball.y = gameHeight / 2;
        ball.dx = 0; // Stop ball until served
        ball.dy = 0; // Stop ball until served
    }

    // async function saveScore(user, playerScore, opponentScore) {
    //     if (user && db) {
    //         try {
    //             await db.collection('scores').add({
    //                 userId: user.uid,
    //                 userName: user.displayName,
    //                 playerScore: playerScore,
    //                 opponentScore: opponentScore,
    //                 timestamp: firebase.firestore.FieldValue.serverTimestamp()
    //             });
    //             console.log("Score saved successfully!");
    //         } catch (error) {
    //             console.error("Error saving score: ", error);
    //         }
    //     }
    // }

    function draw() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '40px "Orbitron", sans-serif';
        ctx.fillText(player.score, gameWidth / 4, 50);
        ctx.fillText(opponent.score, (gameWidth / 4) * 3, 50);
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(gameWidth / 2, 0);
        ctx.lineTo(gameWidth / 2, gameHeight);
        ctx.strokeStyle = '#f0f0f0';
        ctx.stroke();
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    fullscreenBtn.addEventListener('click', () => {
        const gameContainer = document.getElementById('game-and-controls-container');
        if (!document.fullscreenElement) {
            gameContainer.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    });

    // Initial draw
    draw();
    // Start game loop
    gameLoop();
});
