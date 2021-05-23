import { interpolate } from "../math/interpolate";
import game from "./game";

export class entity {
    x: number;
    y: number;
    v: number;
    size: number;
    _game: game;
    id: number;
    ctx: CanvasRenderingContext2D;
    d: { x: number, y: number };
    timer: Map<string, number>;
    force: Map<string, { x: number, y: number, strength: number }>;
    neighbours: Set<entity>;
    private detection_radius: number;

    constructor(_game: game, ctx: CanvasRenderingContext2D, options: { x?: number, y?: number, v?: number, size?: number, d?: { x: number, y: number } } = {}) {
        this._game = _game;
        this.x = options.x || _game.dimension.width * Math.random();
        this.y = options.y || _game.dimension.height * Math.random();
        this.v = options.v || 2+(0.5-Math.random());
        this.size = options.size || 1;
        this.d = { x: this.v - (Math.random() * (this.v * 2)), y: this.v - (Math.random() * (this.v * 2)) };
        this.ctx = ctx;
        this.timer = new Map<string, number>();
        this.timer.set("random_movement", 0);
        this.force = new Map<string, { x: number, y: number, strength: number }>();
        this.neighbours = new Set<entity>();
        this.id = this._game.next_id;
        this.detection_radius = 50;
    }


    update(time: number): void {
        for (let [key, value] of this.timer) {
            this.timer.set(key, value + 1);
        }
        const t = 1 - Math.pow(0.01, time);
        this.x = interpolate(this.x, this.x + (this.d.x * this.v), t);
        this.y = interpolate(this.y, this.y + (this.d.y * this.v), t);

        this.x = (this._game.dimension.width + this.x) % this._game.dimension.width;
        this.y = (this._game.dimension.height + this.y) % this._game.dimension.height;

        this.get_neighbors(this.detection_radius);

        if ((this.timer.get("random_movement") || 1) % Math.floor(Math.random() * 60) <= 0) {
            this.force.set("random_movement", {
                x: (0.5 - Math.random()),
                y: (0.5 - Math.random()),
                strength: 0.07
            });
        }

        this.force.set("separation_force", this.calculate_separation_force(0.045));

        this.force.set("alignment_force", this.calculate_alignment_force(0.05));

        this.force.set("center_force", this.calculate_center_force(0.04));

        for (let [key, value] of this.force) {
            this.d.x += value.x * value.strength;
            this.d.y += value.y * value.strength;
        }

        this.d.x *= 1 / (Math.sqrt(this.d.x * this.d.x + this.d.y * this.d.y));
        this.d.y *= 1 / (Math.sqrt(this.d.x * this.d.x + this.d.y * this.d.y));

        this.neighbours.clear();
    }

    draw(): void {
        const tmp_fillStyle = this.ctx.fillStyle;

        if (0) {
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.detection_radius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'rgba(200,200,200,0.3)';
            this.ctx.fill();
        }

        var n_x = 1;
        var n_y = -(this.d.x / this.d.y);
        const v_l = Math.sqrt(1 + n_y * n_y);
        n_x /= v_l;
        n_y /= v_l;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + (this.d.x * this.size * 10), this.y + (this.d.y * this.size * 10));
        this.ctx.lineTo(-this.d.x * (this.size * 2) + this.x + n_x * (this.size * 4), -this.d.y * (this.size * 2) + this.y + n_y * (this.size * 4));
        this.ctx.lineTo(this.x, this.y);
        this.ctx.lineTo(-this.d.x * (this.size * 2) + this.x - n_x * (this.size * 4), -this.d.y * (this.size * 2) + this.y - n_y * (this.size * 4));
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.fill();
        this.ctx.fillStyle = tmp_fillStyle;
    }

    private calculate_alignment_force(strength: number): { x: number, y: number, strength: number } {
        var force = { x: 0, y: 0, strength: strength };
        for (let neighbour of this.neighbours) {
            force.x += neighbour.d.x;
            force.y += neighbour.d.y;
        }
        if (this.neighbours.size == 0) {
            return force;
        }
        force.x /= this.neighbours.size;
        force.y /= this.neighbours.size;
        force.x *= 1 / ((Math.sqrt(force.x * force.x + force.y * force.y)));
        force.y *= 1 / ((Math.sqrt(force.x * force.x + force.y * force.y)));
        return force;
    }

    private calculate_center_force(strength: number): { x: number, y: number, strength: number } {
        var force = { x: 0, y: 0, strength: strength };
        for (let neighbour of this.neighbours) {
            force.x += neighbour.x;
            force.y += neighbour.y;
        }
        if (this.neighbours.size == 0) {
            return force;
        }
        force.x /= this.neighbours.size;
        force.y /= this.neighbours.size;
        force.x -= this.x;
        force.y -= this.y;
        force.x *= 1 / ((Math.sqrt(force.x * force.x + force.y * force.y)));
        force.y *= 1 / ((Math.sqrt(force.x * force.x + force.y * force.y)));
        return force;
    }

    private calculate_separation_force(strength: number): { x: number, y: number, strength: number } {
        var force = { x: 0, y: 0, strength: strength };
        for (let neighbour of this.neighbours) {
            force.x += (this.x - neighbour.x) / (Math.sqrt(neighbour.distance_to(this)));
            force.y += (this.y - neighbour.y) / (Math.sqrt(neighbour.distance_to(this)));
        }
        if (this.neighbours.size == 0) {
            return force;
        }
        force.x *= 1 / ((Math.sqrt(force.x * force.x + force.y * force.y)));
        force.y *= 1 / ((Math.sqrt(force.x * force.x + force.y * force.y)));
        return force;
    }
    private get_neighbors(detection_radius: number) {
        for (let i = 0; i < this._game.objects.length; i++) {
            if ((!this.neighbours.has(this._game.objects[i]) && this._game.objects[i].id != this.id) && this._game.objects[i].distance_to(this) < (detection_radius * detection_radius)) {
                this.neighbours.add(this._game.objects[i]);
                this._game.objects[i].neighbours.add(this);
            }
        }
    }

    distance_to(obj: entity): number {
        return Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2);
    }
}