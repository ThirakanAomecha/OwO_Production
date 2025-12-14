document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // --- Firebase and User ---
    let db;
    let currentUser = null;
    try {
        db = firebase.firestore();
        firebase.auth().onAuthStateChanged(user => {
            currentUser = user;
            console.log("Current user:", currentUser ? currentUser.uid : "None");
        });
    } catch (e) {
        console.error("Firebase not initialized, score saving will be disabled.", e);
    }

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
        score: 0
    };

    const opponent = {
        x: gameWidth - paddleWidth - 10,
        y: gameHeight / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        score: 0
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
    document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
    document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

    // --- Game Logic ---
    function update() {
        if (keys.w && player.y > 0) player.y -= 7;
        if (keys.s && player.y < gameHeight - player.height) player.y += 7;
        if (keys.ArrowUp && opponent.y > 0) opponent.y -= 7;
        if (keys.ArrowDown && opponent.y < gameHeight - opponent.height) opponent.y += 7;

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
            saveScore(currentUser, player.score, opponent.score);
            resetBall();
        }
        if (ball.x > gameWidth) {
            player.score++;
            saveScore(currentUser, player.score, opponent.score);
            resetBall();
        }
    }

    function resetBall() {
        ball.x = gameWidth / 2;
        ball.y = gameHeight / 2;
        ball.dx *= -1;
    }
    
    async function saveScore(user, playerScore, opponentScore) {
        if (user && db) {
            try {
                await db.collection('scores').add({
                    userId: user.uid,
                    userName: user.displayName,
                    playerScore: playerScore,
                    opponentScore: opponentScore,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("Score saved successfully!");
            } catch (error) {
                console.error("Error saving score: ", error);
            }
        }
    }

    function draw() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);
        ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
        ctx.font = '40px "Orbitron", sans-serif';
        ctx.fillText(player.score, gameWidth / 4, 50);
        ctx.fillText(opponent.score, (gameWidth / 4) * 3, 50);
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(gameWidth / 2, 0);
        ctx.lineTo(gameWidth / 2, gameHeight);
        ctx.stroke();
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    });

    gameLoop();
});
