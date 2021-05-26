import { math } from "../math/math";
import { entity } from "./boid";
import { font } from "./font";
import { spatial_hash_grid } from "./spatial-hash-grid";


var game_count = 0;
var games: Set<game> = new Set();
export default class game {
    canvas: HTMLCanvasElement;
    dimension: { width: number, height: number };
    running: boolean;
    objects: Array<entity>;
    grid: spatial_hash_grid;
    mouse: { pressed: boolean, x: number, y: number };
    private ctx: CanvasRenderingContext2D;
    private color_a: string;
    private startingTime: number;
    private lastTime: number;
    private totalElapsedTime: number;
    private n_id: number;
    private steps: number;

    /**
     * @param {Object} options? Optional options for the game
     * @param {HTMLCanvasElement} options.canvas?=undefined The canvas
     * @param {Array<number>} options.bounds?=[0,0,1,1] The Bounds as [LEFT, TOP, RIGHT, BOTTOM] ([0,0,1,1] || [-1,-1,1,1])
     * @param {Object} options.dimension?={width,height} The dimension of the canvas 
     * @param {number} options.dimension.width?=600 The width of the canvas 
     * @param {number} options.dimension.height?=400 The height of the canvas 
     * @param {string} options.color?="gray" The background color
     */
    constructor(options: { canvas?: HTMLCanvasElement, dimension?: { width?: number, height?: number }, color?: string, steps?: number } = { canvas: undefined, dimension: { width: undefined, height: undefined }, color: undefined }) {
        game_count++;
        this.n_id = 0;
        this.canvas = options.canvas || (function () {
            const tmp = document.createElement("canvas");
            document.body.append(tmp);
            return tmp;
        })();

        this.canvas.setAttribute("id", "game_canvas_" + game_count);
        this.canvas.style.margin = "0px;";
        this.ctx = this.canvas.getContext("2d") || new CanvasRenderingContext2D();
        this.dimension = {
            width: 0,
            height: 0
        };
        options.dimension = options.dimension || { width: undefined, height: undefined };
        this.dimension.width = options.dimension.width || 600;
        this.dimension.height = options.dimension.height || 400;
        this.size = this.dimension;
        this.color_a = options.color || "gray";
        this.steps = options.steps || 1;
        this.startingTime = 0;
        this.lastTime = 0;
        this.totalElapsedTime = 0;
        this.running = false;
        this.objects = new Array<entity>();
        this.grid = new spatial_hash_grid(this.dimension, { width: 25, height: 25 });
        this.mouse = { pressed: false, x: 0, y: 0 };
        this.canvas.onmousedown = (e: MouseEvent) => { this.mouse.pressed = true; this.mouse.x = e.pageX; this.mouse.y = e.pageY };
        this.canvas.onmouseup = (e: MouseEvent) => { this.mouse.pressed = false; this.mouse.x = e.pageX; this.mouse.y = e.pageY };
        this.canvas.onmousemove = (e: MouseEvent) => { this.mouse.x = e.pageX; this.mouse.y = e.pageY };
        document.body.onkeypress = (e: KeyboardEvent) => { if (e.key == "a") { this.objects.push(new entity(this, this.ctx)); } else if (e.key == "r") { this.objects.pop(); } else if (e.key == "+") { this.steps++; } else if (e.key == "-") { this.steps--; } }
        this.draw();
    }

    start() {
        for (let i = 0; i < 250; i++) {
            this.objects.push(new entity(this, this.ctx));
        }
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
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].draw();
        }

        this.fillText(15, 15, "Boids (a,r): " + this.objects.length, 15);
        this.fillText(15, 35, "Speed (+,-): " + this.steps + "x", 15);
    }

    update(time: number) {
        this.steps = math.clamp(0,Infinity,this.steps);
        for (let i = 0; i < this.objects.length; i++) {
            for (let s = 0; s < this.steps; s++) {
                this.objects[i].update(time);
            }
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

    get next_id(): number {
        return this.n_id++;
    }

    fillText(x_c: number, y_c: number, string: string, size: number, color: string = "white") {
        const tile_width = size / font.width;
        const tile_height = size / font.height;
        var offset = 0;
        for (let i = 0; i < string.length; i++) {
            offset += (font[string.charAt(i - 1).toUpperCase()] != undefined && font[string.charAt(i - 1).toUpperCase()].offset != undefined) ? font[string.charAt(i - 1).toUpperCase()].offset : 0;
            const ch = string.charAt(i).toUpperCase();
            for (let y = 0; y < font.height; y++) {
                for (let x = 0; x < font.width; x++) {
                    const index = y * font.width + x;
                    const x_s = offset * tile_width + x_c + (i * tile_width * font.width) + x * tile_width;
                    const y_s = y_c + y * tile_height;
                    if (font[ch][index] == 1) {
                        this.ctx.fillStyle = "white";
                        this.ctx.fillRect(x_s, y_s, tile_width + 1, tile_height + 1);
                    }
                }
            }
        }
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