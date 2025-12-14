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

    joystickP1.on('move', (evt, data) => {
        if (data.angle.degree > 225 && data.angle.degree < 315) { // Up
            p1JoystickY = -data.distance / 50; // Normalize and scale
        } else if (data.angle.degree > 45 && data.angle.degree < 135) { // Down
            p1JoystickY = data.distance / 50; // Normalize and scale
        } else {
            p1JoystickY = 0;
        }
    }).on('end', () => {
        p1JoystickY = 0;
    });

    joystickP2.on('move', (evt, data) => {
        if (data.angle.degree > 225 && data.angle.degree < 315) { // Up
            p2JoystickY = -data.distance / 50; // Normalize and scale
        } else if (data.angle.degree > 45 && data.angle.degree < 135) { // Down
            p2JoystickY = data.distance / 50; // Normalize and scale
        } else {
            p2JoystickY = 0;
        }
    }).on('end', () => {
        p2JoystickY = 0;
    });


    // --- Game Logic ---
    function update() {
        // Player 1 Movement (Keyboard OR Mobile)
        if (keys.w || p1JoystickY < 0) {
            player.y += player.speed * (p1JoystickY || -1);
        }
        if (keys.s || p1JoystickY > 0) {
            player.y += player.speed * (p1JoystickY || 1);
        }

        // Clamp player position
        if (player.y < 0) player.y = 0;
        if (player.y > gameHeight - player.height) player.y = gameHeight - player.height;

        // Player 2 Movement (Keyboard OR Mobile)
        if (keys.ArrowUp || p2JoystickY < 0) {
            opponent.y += opponent.speed * (p2JoystickY || -1);
        }
        if (keys.ArrowDown || p2JoystickY > 0) {
            opponent.y += opponent.speed * (p2JoystickY || 1);
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
        }
        if (ball.x > gameWidth) {
            player.score++;
            // saveScore(currentUser, player.score, opponent.score);
            resetBall();
        }
    }

    function resetBall() {
        ball.x = gameWidth / 2;
        ball.y = gameHeight / 2;
        ball.dx *= -1;
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
