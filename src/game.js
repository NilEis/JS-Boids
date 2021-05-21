var game_count = 0;
var games = new Set();
export default class game {
    /**
     * @param {Object} options Optional options for the game
     * @param {HTMLCanvasElement} options.canvas The canvas
     * @param {Array<number>} options.bounds=[0,0,1,1] The Bounds as [LEFT, TOP, RIGHT, BOTTOM] ([0,0,1,1] || [-1,-1,1,1])
     * @param {Object} options.dimension={width,height} The dimension of the canvas 
     * @param {number} options.dimension.width=600 The width of the canvas 
     * @param {number} options.dimension.height=400 The height of the canvas 
     * @param {string} options.color="gray" The background color
     */
    constructor(options = {}) {
        game_count++;
        this.canvas = options.canvas || (function () {
            const tmp = document.createElement("canvas");
            document.body.append(tmp);
            return tmp;
        })();

        this.canvas.setAttribute("id", "game_canvas_" + game_count);

        this.ctx = this.canvas.getContext("2d");

        this.bounds = options.bounds || [0, 0, 1, 1];
        this.dimension = {
            width: 0,
            height: 0
        };
        this.dimension.width = options.dimension.width || 600;
        this.dimension.height = options.dimension.height || 400;
        this.size = this.dimension;
        this.color_a = options.color || "gray";
        this.startingTime;
        this.lastTime;
        this.totalElapsedTime;
        this.draw();
        this.running = false;
    }

    start() {
        this.startingTime = performance.now();
        this.lastTime = performance.now();
        this.totalElapsedTime = 0;
        this.running = true;
        if (!games.has(this)) {
            games.add(this);
        }
    }

    draw() {
        this.ctx.fillStyle = this.color_a;
        this.ctx.fillRect(0, 0, this.dimension.width, this.dimension.height);
    }

    update() {
        return;
    }

    loop(frametime) {
        this.elapsedTime = frametime - this.lastTime;
        this.totalElapsedTime += this.elapsedTime;
        this.lastTime = frametime;
        this.update(this.elapsedTime);
        this.draw();
    }

    /**
     * @param {Object} dimension
     * @param {number} dimension.width The width of the canvas
     * @param {number} dimension.height The height of the canvas
     */
    set size(dimension) {
        this.canvas.width = dimension.width;
        this.canvas.height = dimension.height;
        this.dimension.width = dimension.width;
        this.dimension.height = dimension.height;
    }

    /**
     * @param {string} color
     */
    set color(color) {
        this.color_a = color;
    }

}

function run(frametime) {
    for (let i of games) {
        if (i.running) {
            i.loop(frametime);
        }
    }
    requestAnimationFrame(run);
}

requestAnimationFrame(run);