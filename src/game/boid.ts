import { interpolate } from "../math/interpolate";
import game from "./game";

export class entity {
    x: number;
    y: number;
    v: number;
    a: number;
    _game: game;
    ctx: CanvasRenderingContext2D;

    constructor(_game: game, ctx: CanvasRenderingContext2D, options: { x?: number, y?: number, v?: number, a?: number } = {}) {
        this._game = _game;
        this.x = options.x || Math.abs(_game.bounds[2]) - (Math.abs(_game.bounds[0]) + Math.abs(_game.bounds[2]) / 2);
        this.y = options.y || Math.abs(_game.bounds[3]) - (Math.abs(_game.bounds[1]) + Math.abs(_game.bounds[3]) / 2);;
        this.v = options.v || 0.01;
        this.a = options.a || 1;
        this.ctx = ctx;
    }


    update(time: number): void {
        const t = 1 - Math.pow(0.01, time);
        console.log('t :>> ', t);
        const d = { x: Math.sin(this.a) * this.v, y: Math.cos(this.a) * this.v };
        const nx = interpolate(this.x, this.x + d.x, t);
        const ny = interpolate(this.y, this.y + d.y, t);

        if (this._game.bounds[0] < nx && nx < this._game.bounds[2]) {
            this.x = nx;
        }
        if (this._game.bounds[1] < ny && ny < this._game.bounds[3]) {
            this.y = ny;
        }
    }

    draw(): void {
        const tmp_fillStyle = this.ctx.fillStyle;
        this.ctx.fillStyle = "white";
        this.ctx.fillRect((this.x - 0.01) * this._game.dimension.width, (this.y - 0.01) * this._game.dimension.height, 0.02 * this._game.dimension.width, 0.02 * this._game.dimension.height);
        this.ctx.fillStyle = tmp_fillStyle;
    }
}