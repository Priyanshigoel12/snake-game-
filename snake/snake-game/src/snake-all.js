// --- Beautiful, Larger Snake Game ---

// Configurable constants
const GRID_SIZE = 30;
const CELL_SIZE = 24;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

class Snake {
    constructor() {
        this.reset();
    }

    reset() {
        this.body = [
            { x: 10, y: 15 },
            { x: 9, y: 15 },
            { x: 8, y: 15 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
    }

    get head() {
        return this.body[0];
    }

    changeDirection(e) {
        const key = e.key;
        if (key === "ArrowUp" && this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
        else if (key === "ArrowDown" && this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
        else if (key === "ArrowLeft" && this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
        else if (key === "ArrowRight" && this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
    }

    move() {
        this.direction = this.nextDirection;
        const newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y
        };
        this.body.unshift(newHead);
        this.body.pop();
    }

    grow() {
        const tail = this.body[this.body.length - 1];
        this.body.push({ ...tail });
    }

    isCollidingWithSelf() {
        return this.body.slice(1).some(segment => segment.x === this.head.x && segment.y === this.head.y);
    }

    draw(ctx) {
        for (let i = 0; i < this.body.length; i++) {
            const segment = this.body[i];
            // Gradient for snake body
            const grad = ctx.createLinearGradient(
                segment.x * CELL_SIZE, segment.y * CELL_SIZE,
                (segment.x + 1) * CELL_SIZE, (segment.y + 1) * CELL_SIZE
            );
            grad.addColorStop(0, "#43e97b");
            grad.addColorStop(1, "#38f9d7");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE, 8);
            ctx.fill();
            ctx.closePath();
            // Border for visibility
            ctx.strokeStyle = "#222";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        // Draw eyes on the head
        const hx = this.head.x * CELL_SIZE;
        const hy = this.head.y * CELL_SIZE;
        ctx.save();
        ctx.fillStyle = "#222";
        let eyeOffsetX = this.direction.x === 0 ? 6 : (this.direction.x === 1 ? 12 : 4);
        let eyeOffsetY = this.direction.y === 0 ? 6 : (this.direction.y === 1 ? 12 : 4);
        ctx.beginPath();
        ctx.arc(hx + eyeOffsetX, hy + eyeOffsetY, 2.5, 0, 2 * Math.PI);
        ctx.arc(hx + CELL_SIZE - eyeOffsetX, hy + eyeOffsetY, 2.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

class Food {
    constructor() {
        this.position = { x: 5, y: 5 };
        this.pulseStart = Date.now();
    }

    randomize(snakeBody) {
        let newPos;
        do {
            newPos = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (snakeBody.some(segment => segment.x === newPos.x && segment.y === newPos.y));
        this.position = newPos;
    }

    draw(ctx) {
        // Pulsing effect
        const t = ((Date.now() - this.pulseStart) % 1000) / 1000;
        const pulse = 0.7 + 0.3 * Math.sin(t * 2 * Math.PI);
        ctx.save();
        ctx.globalAlpha = pulse;
        // Gradient for food
        const cx = this.position.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = this.position.y * CELL_SIZE + CELL_SIZE / 2;
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, CELL_SIZE / 2 - 2);
        grad.addColorStop(0, "#fff176");
        grad.addColorStop(1, "#f44336");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
        // Draw a small highlight
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 4, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

class Game {
    constructor(ctx) {
        this.ctx = ctx;
        this.snake = new Snake();
        this.food = new Food();
        this.score = 0;
        this.gameOver = false;
        this.lastMoveTime = 0;
        this.moveDelay = 90; // ms
        document.addEventListener('keydown', e => {
            if (this.gameOver && (e.key.startsWith("Arrow"))) {
                this.start();
            } else {
                this.snake.changeDirection(e);
            }
        });
    }

    start() {
        this.snake.reset();
        this.food.randomize(this.snake.body);
        this.score = 0;
        this.gameOver = false;
    }

    update(now) {
        if (this.gameOver) return;
        if (!this.lastMoveTime || now - this.lastMoveTime > this.moveDelay) {
            this.snake.move();
            this.lastMoveTime = now;

            // Check collision with food
            if (this.snake.head.x === this.food.position.x && this.snake.head.y === this.food.position.y) {
                this.snake.grow();
                this.food.randomize(this.snake.body);
                this.score++;
            }

            // Check collision with wall or self
            if (
                this.snake.head.x < 0 || this.snake.head.x >= GRID_SIZE ||
                this.snake.head.y < 0 || this.snake.head.y >= GRID_SIZE ||
                this.snake.isCollidingWithSelf()
            ) {
                this.gameOver = true;
            }
        }
    }

    draw() {
        // Background
        this.ctx.fillStyle = "#181825";
        this.ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw grid
        this.ctx.strokeStyle = "#23233a";
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * CELL_SIZE, 0);
            this.ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * CELL_SIZE);
            this.ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
            this.ctx.stroke();
        }

        // Draw snake and food
        this.snake.draw(this.ctx);
        this.food.draw(this.ctx);

        // Draw score
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "24px 'Segoe UI', Arial";
        this.ctx.fillText("Score: " + this.score, 20, CANVAS_SIZE - 20);

        // Draw game over
        if (this.gameOver) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = "#000";
            this.ctx.fillRect(0, CANVAS_SIZE / 2 - 70, CANVAS_SIZE, 100);
            this.ctx.restore();
            this.ctx.fillStyle = "#FF5252";
            this.ctx.font = "48px 'Segoe UI', Arial";
            this.ctx.fillText("Game Over", CANVAS_SIZE / 2 - 130, CANVAS_SIZE / 2);
            this.ctx.font = "22px 'Segoe UI', Arial";
            this.ctx.fillStyle = "#fff";
            this.ctx.fillText("Press any arrow key to restart", CANVAS_SIZE / 2 - 160, CANVAS_SIZE / 2 + 40);
        }
    }
}

// Main
window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    const game = new Game(ctx);

    function gameLoop(now) {
        game.update(now || 0);
        game.draw();
        requestAnimationFrame(gameLoop);
    }

    game.start();
    gameLoop();
};