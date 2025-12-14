document.addEventListener('DOMContentLoaded', () => {
    // --- Game Configuration ---
    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;
    const PADDLE_WIDTH = 10;
    const PADDLE_HEIGHT = 100;
    const BALL_SIZE = 10;
    const PADDLE_SPEED = 7;
    const BALL_INITIAL_SPEED = 5;
    const POWER_UP_DURATION = 3000; // 3 seconds
    const PADDLE_GROWTH = 50; // How much paddle grows

    // --- Paddle Class ---
    class Paddle {
        constructor(x, y, width, height, speed) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.initialHeight = height;
            this.speed = speed;
            this.score = 0;
            this.powerUpActive = false;
            this.powerUpTimeout = null;
        }

        update(gameHeight) {
            // Paddle movement handled by input directly
            // Clamp paddle position
            if (this.y < 0) this.y = 0;
            if (this.y > gameHeight - this.height) this.y = gameHeight - this.height;
        }

        draw(ctx) {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        moveUp(delta) {
            this.y -= this.speed * delta;
        }

        moveDown(delta) {
            this.y += this.speed * delta;
        }

        activatePowerUp() {
            if (!this.powerUpActive) {
                this.height += PADDLE_GROWTH;
                this.powerUpActive = true;
                if (this.powerUpTimeout) clearTimeout(this.powerUpTimeout);
                this.powerUpTimeout = setTimeout(() => {
                    this.height = this.initialHeight;
                    this.powerUpActive = false;
                }, POWER_UP_DURATION);
            }
        }

        reset() {
            this.y = GAME_HEIGHT / 2 - this.initialHeight / 2;
            this.score = 0;
            if (this.powerUpActive) {
                clearTimeout(this.powerUpTimeout);
                this.height = this.initialHeight;
                this.powerUpActive = false;
            }
        }
    }

    // --- Ball Class ---
    class Ball {
        constructor(x, y, size, speed) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.initialSpeed = speed;
            this.speed = speed;
            this.dx = 0; // Initial state: not moving
            this.dy = 0; // Initial state: not moving
        }

        update() {
            this.x += this.dx;
            this.y += this.dy;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        reset(serve = false) {
            this.x = GAME_WIDTH / 2;
            this.y = GAME_HEIGHT / 2;
            this.dx = 0;
            this.dy = 0;
            if (serve) {
                this.dx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
                this.dy = (Math.random() > 0.5 ? 1 : -1) * this.speed;
            }
        }
    }

    // --- Game Class ---
    class PongGame {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = GAME_WIDTH;
            this.canvas.height = GAME_HEIGHT;

            this.playerPaddle = new Paddle(10, GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
            this.opponentPaddle = new Paddle(GAME_WIDTH - PADDLE_WIDTH - 10, GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
            this.ball = new Ball(GAME_WIDTH / 2, GAME_HEIGHT / 2, BALL_SIZE, BALL_INITIAL_SPEED);

            this.gamePaused = true;
            this.ballServed = false;

            this.p1JoystickY = 0;

            this.lastFrameTime = 0;

            this.initInputHandlers();
            this.initMobileControls();
            this.resetGame(); // Set initial state
            this.gameLoop();
        }

        initInputHandlers() {
            // Keyboard Input (for Player 1 desktop testing)
            const keys = { w: false, s: false };
            document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
            document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

            this.keys = keys; // Store keys state in game instance
        }

        initMobileControls() {
            // NippleJS Joystick Setup for Player 1
            const joystickP1 = nipplejs.create({
                zone: document.getElementById('joystick-container-p1'),
                mode: 'static',
                position: { left: '25%', top: '50%' },
                color: 'white'
            });

            joystickP1.on('move', (evt, data) => {
                if (data.angle.degree > 225 && data.angle.degree < 315) { // Up
                    this.p1JoystickY = -data.distance / 50; // Normalize and scale
                } else if (data.angle.degree > 45 && data.angle.degree < 135) { // Down
                    this.p1JoystickY = data.distance / 50; // Normalize and scale
                } else {
                    this.p1JoystickY = 0;
                }
            }).on('end', () => {
                this.p1JoystickY = 0;
            });

            // Action Buttons
            document.getElementById('btn-a').addEventListener('touchstart', (e) => { e.preventDefault(); this.togglePause(); });
            document.getElementById('btn-b').addEventListener('touchstart', (e) => { e.preventDefault(); this.resetGame(); });
            document.getElementById('btn-x').addEventListener('touchstart', (e) => { e.preventDefault(); this.playerPaddle.activatePowerUp(); });
            document.getElementById('btn-y').addEventListener('touchstart', (e) => { e.preventDefault(); this.opponentPaddle.activatePowerUp(); });

            // Fullscreen Button
            document.getElementById('fullscreen-btn').addEventListener('click', () => {
                const gameContainer = document.getElementById('game-and-controls-container');
                if (!document.fullscreenElement) {
                    gameContainer.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
                } else {
                    document.exitFullscreen();
                }
            });

            document.getElementById('version-display').textContent = 'v2.0'; // Updated version
        }

        togglePause() {
            this.gamePaused = !this.gamePaused;
            if (!this.gamePaused && !this.ballServed) {
                // If unpausing and ball hasn't been served yet (e.g., at game start or after a score)
                this.ball.reset(true); // Serve the ball
                this.ballServed = true;
            }
        }

        resetGame() {
            this.playerPaddle.reset();
            this.opponentPaddle.reset();
            this.ball.reset();
            this.gamePaused = true;
            this.ballServed = false;
            this.draw(); // Draw initial state immediately
        }

        update(deltaTime) {
            if (this.gamePaused) {
                return;
            }

            // Player 1 Movement (Keyboard OR Mobile Joystick)
            if (this.keys.w) {
                this.playerPaddle.moveUp(deltaTime);
            }
            if (this.keys.s) {
                this.playerPaddle.moveDown(deltaTime);
            }
            if (this.p1JoystickY < 0) {
                this.playerPaddle.moveUp(deltaTime * -this.p1JoystickY);
            }
            if (this.p1JoystickY > 0) {
                this.playerPaddle.moveDown(deltaTime * this.p1JoystickY);
            }
            this.playerPaddle.update(GAME_HEIGHT);

            // Opponent (Player 2) is stationary
            this.opponentPaddle.update(GAME_HEIGHT);

            this.ball.update();

            // Ball collision with top/bottom walls
            if (this.ball.y + this.ball.size / 2 > GAME_HEIGHT || this.ball.y - this.ball.size / 2 < 0) {
                this.ball.dy *= -1;
            }

            // Ball collision with paddles
            // Player Paddle
            if (
                this.ball.dx < 0 &&
                this.ball.x - this.ball.size / 2 < this.playerPaddle.x + this.playerPaddle.width &&
                this.ball.y + this.ball.size / 2 > this.playerPaddle.y &&
                this.ball.y - this.ball.size / 2 < this.playerPaddle.y + this.playerPaddle.height
            ) {
                this.ball.dx *= -1;
                // Add some randomness to reflect angle
                this.ball.dy = ((this.ball.y - (this.playerPaddle.y + this.playerPaddle.height / 2)) / (this.playerPaddle.height / 2)) * this.ball.speed;
            }
            // Opponent Paddle
            else if (
                this.ball.dx > 0 &&
                this.ball.x + this.ball.size / 2 > this.opponentPaddle.x &&
                this.ball.y + this.ball.size / 2 > this.opponentPaddle.y &&
                this.ball.y - this.ball.size / 2 < this.opponentPaddle.y + this.opponentPaddle.height
            ) {
                this.ball.dx *= -1;
                // Add some randomness to reflect angle
                this.ball.dy = ((this.ball.y - (this.opponentPaddle.y + this.opponentPaddle.height / 2)) / (this.opponentPaddle.height / 2)) * this.ball.speed;
            }

            // Scoring
            if (this.ball.x - this.ball.size / 2 < 0) { // Opponent scores
                this.opponentPaddle.score++;
                this.resetBallAfterScore();
            } else if (this.ball.x + this.ball.size / 2 > GAME_WIDTH) { // Player scores
                this.playerPaddle.score++;
                this.resetBallAfterScore();
            }
        }

        resetBallAfterScore() {
            this.ball.reset(false); // Reset ball position, but don't serve immediately
            this.gamePaused = true;
            this.ballServed = false;
            // Optionally, save score here
        }

        draw() {
            this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            this.ctx.fillStyle = '#f0f0f0';
            this.playerPaddle.draw(this.ctx);
            this.opponentPaddle.draw(this.ctx);
            this.ball.draw(this.ctx);

            this.ctx.font = '40px "Orbitron", sans-serif';
            this.ctx.fillText(this.playerPaddle.score, GAME_WIDTH / 4, 50);
            this.ctx.fillText(this.opponentPaddle.score, (GAME_WIDTH / 4) * 3, 50);

            // Draw dashed line
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(GAME_WIDTH / 2, 0);
            this.ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
            this.ctx.strokeStyle = '#f0f0f0';
            this.ctx.stroke();

            if (this.gamePaused) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                this.ctx.fillStyle = '#f0f0f0';
                this.ctx.font = '50px "Orbitron", sans-serif';
                this.ctx.textAlign = 'center';
                if (!this.ballServed) {
                    this.ctx.fillText('Press A to Start', GAME_WIDTH / 2, GAME_HEIGHT / 2);
                } else {
                    this.ctx.fillText('Paused', GAME_WIDTH / 2, GAME_HEIGHT / 2);
                }
                this.ctx.textAlign = 'start';
            }
        }

        gameLoop(currentTime) {
            const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
            this.lastFrameTime = currentTime;

            this.update(deltaTime);
            this.draw();

            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    // --- Initialize the Game ---
    const game = new PongGame('game-canvas');
});