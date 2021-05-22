import { entity } from "./boid";


var game_count = 0;
var games: Set<game> = new Set();
export default class game {
    canvas: HTMLCanvasElement;
    bounds: number[];
    dimension: { width: number, height: number };
    running: boolean;
    objects: Array<entity>;
    private ctx: CanvasRenderingContext2D;
    private color_a: string;
    private startingTime: number;
    private lastTime: number;
    private totalElapsedTime: number;

    /**
     * @param {Object} options? Optional options for the game
     * @param {HTMLCanvasElement} options.canvas?=undefined The canvas
     * @param {Array<number>} options.bounds?=[0,0,1,1] The Bounds as [LEFT, TOP, RIGHT, BOTTOM] ([0,0,1,1] || [-1,-1,1,1])
     * @param {Object} options.dimension?={width,height} The dimension of the canvas 
     * @param {number} options.dimension.width?=600 The width of the canvas 
     * @param {number} options.dimension.height?=400 The height of the canvas 
     * @param {string} options.color?="gray" The background color
     */
    constructor(options: { canvas?: HTMLCanvasElement, bounds?: number[], dimension?: { width?: number, height?: number }, color?: string } = { canvas: undefined, bounds: undefined, dimension: { width: undefined, height: undefined }, color: undefined }) {
        game_count++;
        this.canvas = options.canvas || (function () {
            const tmp = document.createElement("canvas");
            document.body.append(tmp);
            return tmp;
        })();

        this.canvas.setAttribute("id", "game_canvas_" + game_count);
        this.ctx = this.canvas.getContext("2d") || new CanvasRenderingContext2D();

        this.bounds = options.bounds || [0, 0, 1, 1];
        this.dimension = {
            width: 0,
            height: 0
        };
        options.dimension = options.dimension || { width: undefined, height: undefined };
        this.dimension.width = options.dimension.width || 600;
        this.dimension.height = options.dimension.height || 400;
        this.size = this.dimension;
        this.color_a = options.color || "gray";
        this.startingTime = 0;
        this.lastTime = 0;
        this.totalElapsedTime = 0;
        this.running = false;
        this.objects = new Array<entity>();
        this.draw();
    }

    start() {
        this.objects.push(new entity(this, this.ctx));
        this.startingTime = performance.now();
        this.lastTime = performance.now();
        this.totalElapsedTime = 0;
        this.running = true;
        if (!games.has(this)) {
            games.add(this);
        }
        console.log(this);
    }

    draw() {
        this.ctx.fillStyle = this.color_a;
        this.ctx.fillRect(0, 0, this.dimension.width, this.dimension.height);
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].draw();
        }
    }

    update(time: number) {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update(time);
        }
        return;
    }

    loop(frametime: number) {
        var elapsedTime = frametime - this.lastTime;
        this.totalElapsedTime += elapsedTime;
        this.lastTime = frametime;
        this.update(elapsedTime);
        this.draw();
    }

    /**
     * @param {Object} dimension
     * @param {number} dimension.width The width of the canvas
     * @param {number} dimension.height The height of the canvas
     */
    set size(dimension: { width: number, height: number }) {
        this.canvas.width = dimension.width;
        this.canvas.height = dimension.height;
        this.dimension.width = dimension.width;
        this.dimension.height = dimension.height;
    }

    /**
     * @param {string} color
     */
    set color(color: string) {
        this.color_a = color;
    }

}

function run(frametime: number) {
    games.forEach(function (i) {
        if (i.running) {
            i.loop(frametime);
        }
    });
    requestAnimationFrame(run);
}

requestAnimationFrame(run);