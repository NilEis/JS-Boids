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
    detection_radius: number;
    indicies: number[][] | null;
    active: boolean;
    GC_OPTIMATION: { t: number; nx: number; ny: number, vl: number, force: { x: number, y: number, strength: number } };

    constructor(_game: game, ctx: CanvasRenderingContext2D, options: { x?: number, y?: number, v?: number, size?: number, d?: { x: number, y: number } } = {}) {
        this.GC_OPTIMATION = { t: 0, nx: 0, ny: 0, vl: 0, force: { x: 0, y: 0, strength: 0 } };
        this._game = _game;
        this.x = options.x || this._game.dimension.width * Math.random();
        this.y = options.y || this._game.dimension.height * Math.random();
        this.v = options.v || 2 + (0.5 - Math.random());
        this.size = options.size || 0.5;
        this.d = { x: this.v - (Math.random() * (this.v * 2)), y: this.v - (Math.random() * (this.v * 2)) };
        this.ctx = ctx;
        this.timer = new Map<string, number>();
        this.timer.set("random_movement", 0);
        this.force = new Map<string, { x: number, y: number, strength: number }>();
        this.neighbours = new Set<entity>();
        this.id = this._game.next_id;
        this.detection_radius = 45;
        this.indicies = null;
        this._game.grid.new_client(this);
        this.active = false;
        const a = Math.random() * 16 * Math.PI;
        this.force.set("random_movement", {
            x: Math.sin(a),
            y: Math.cos(a),
            strength: 0.07
        });
    }


    update(time: number): void {
        this.get_neighbors(this.detection_radius);
        for (let [key, value] of this.timer) {
            this.timer.set(key, value + 1);
        }
        this.GC_OPTIMATION.t = 1 - Math.pow(0.01, time);
        this.GC_OPTIMATION.nx = interpolate(this.x, this.x + (this.d.x * this.v), this.GC_OPTIMATION.t);
        this.GC_OPTIMATION.ny = interpolate(this.y, this.y + (this.d.y * this.v), this.GC_OPTIMATION.t);

        if (this.GC_OPTIMATION.nx < this._game.dimension.width && this.GC_OPTIMATION.nx > 0) {
            this.x = this.GC_OPTIMATION.nx;
        }
        else {
            this.d.x *= -0.4;
        }
        if (this.GC_OPTIMATION.ny < this._game.dimension.height && this.GC_OPTIMATION.ny > 0) {
            this.y = this.GC_OPTIMATION.ny;
        }
        else {
            this.d.y *= -0.4;
        }

        if ((this.timer.get("random_movement") || 1) % (40 + Math.floor(Math.random() * 20)) == 0) {
            const a = Math.random() * 16 * Math.PI;
            this.force.set("random_movement", {
                x: Math.sin(a),
                y: Math.cos(a),
                strength: 0.07
            });
        }

        this.force.set("separation_force", this.calculate_separation_force(0.062));

        this.force.set("alignment_force", this.calculate_alignment_force(0.089));

        this.force.set("center_force", this.calculate_center_force(0.125));

        this.force.set("mouse_force", this.calculate_mouse_force(0.081));

        for (let [key, value] of this.force) {
            this.d.x += value.x * value.strength;
            this.d.y += value.y * value.strength;
        }

        this.d.x = this.d.x || this.force.get("random_movement")!.x;
        this.d.y = this.d.y || this.force.get("random_movement")!.y;


        this.d.x *= 1 / (Math.sqrt(this.d.x * this.d.x + this.d.y * this.d.y));
        this.d.y *= 1 / (Math.sqrt(this.d.x * this.d.x + this.d.y * this.d.y));

        this._game.grid.update_client(this);

        if (!this.x || !this.y || !this.d.x || !this.d.y) {
            alert();
        }

    }

    draw(): void {
        const tmp_fillStyle = this.ctx.fillStyle;

        if (0) {
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.detection_radius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'rgba(200,200,200,0.3)';
            this.ctx.fill();
        }

        this.GC_OPTIMATION.nx = 1;
        this.GC_OPTIMATION.ny = -(this.d.x / this.d.y);
        this.GC_OPTIMATION.vl = Math.sqrt(1 + this.GC_OPTIMATION.ny * this.GC_OPTIMATION.ny);
        this.GC_OPTIMATION.nx /= this.GC_OPTIMATION.vl;
        this.GC_OPTIMATION.ny /= this.GC_OPTIMATION.vl;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + (this.d.x * this.size * 10), this.y + (this.d.y * this.size * 10));
        this.ctx.lineTo(-this.d.x * (this.size * 2) + this.x + this.GC_OPTIMATION.nx * (this.size * 4), -this.d.y * (this.size * 2) + this.y + this.GC_OPTIMATION.ny * (this.size * 4));
        this.ctx.lineTo(this.x, this.y);
        this.ctx.lineTo(-this.d.x * (this.size * 2) + this.x - this.GC_OPTIMATION.nx * (this.size * 4), -this.d.y * (this.size * 2) + this.y - this.GC_OPTIMATION.ny * (this.size * 4));
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.fill();
        this.ctx.fillStyle = tmp_fillStyle;
    }

    private calculate_alignment_force(strength: number): { x: number, y: number, strength: number } {
        if (this.neighbours.size == 0) {
            return { x: 0, y: 0, strength: 0 };
        }
        this.GC_OPTIMATION.force = { x: 0, y: 0, strength: strength };
        for (let neighbour of this.neighbours) {
            this.GC_OPTIMATION.force.x += neighbour.d.x || 0;
            this.GC_OPTIMATION.force.y += neighbour.d.y || 0;
        }
        this.GC_OPTIMATION.force.x /= this.neighbours.size;
        this.GC_OPTIMATION.force.y /= this.neighbours.size;
        this.GC_OPTIMATION.force.x *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        this.GC_OPTIMATION.force.y *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        return { x: this.GC_OPTIMATION.force.x, y: this.GC_OPTIMATION.force.y, strength: this.GC_OPTIMATION.force.strength };
    }

    private calculate_center_force(strength: number): { x: number, y: number, strength: number } {
        if (this.neighbours.size == 0) {
            return { x: 0, y: 0, strength: 0 };
        }
        this.GC_OPTIMATION.force = { x: 0, y: 0, strength: strength };
        for (let neighbour of this.neighbours) {
            this.GC_OPTIMATION.force.x += neighbour.x || 0;
            this.GC_OPTIMATION.force.y += neighbour.y || 0;
        }
        this.GC_OPTIMATION.force.x /= this.neighbours.size;
        this.GC_OPTIMATION.force.y /= this.neighbours.size;
        this.GC_OPTIMATION.force.x -= this.x;
        this.GC_OPTIMATION.force.y -= this.y;
        this.GC_OPTIMATION.force.x *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        this.GC_OPTIMATION.force.y *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        if (this.neighbours.size / (this._game.objects.length - 1) >= 0.35) {
            this.GC_OPTIMATION.force.x *= -1;
            this.GC_OPTIMATION.force.y *= -1;
        }
        return { x: this.GC_OPTIMATION.force.x, y: this.GC_OPTIMATION.force.y, strength: this.GC_OPTIMATION.force.strength };
    }

    private calculate_mouse_force(strength: number): { x: number, y: number, strength: number } {
        if (!this._game.mouse.pressed) {
            return { x: 0, y: 0, strength: 0 };
        }
        this.GC_OPTIMATION.force = { x: this._game.mouse.x, y: this._game.mouse.y, strength: strength };
        this.GC_OPTIMATION.force.x -= this.x;
        this.GC_OPTIMATION.force.y -= this.y;
        this.GC_OPTIMATION.force.x *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        this.GC_OPTIMATION.force.y *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        return { x: this.GC_OPTIMATION.force.x, y: this.GC_OPTIMATION.force.y, strength: this.GC_OPTIMATION.force.strength };
    }

    private calculate_separation_force(strength: number): { x: number, y: number, strength: number } {
        if (this.neighbours.size == 0) {
            return { x: 0, y: 0, strength: 0 };
        }
        this.GC_OPTIMATION.force = { x: 0, y: 0, strength: strength };
        for (let neighbour of this.neighbours) {
            this.GC_OPTIMATION.force.x += (this.x - neighbour.x) / (Math.sqrt(this.distance_to(neighbour))) || 0;
            this.GC_OPTIMATION.force.y += (this.y - neighbour.y) / (Math.sqrt(this.distance_to(neighbour))) || 0;
        }
        this.GC_OPTIMATION.force.x *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        this.GC_OPTIMATION.force.y *= 1 / ((Math.sqrt(this.GC_OPTIMATION.force.x * this.GC_OPTIMATION.force.x + this.GC_OPTIMATION.force.y * this.GC_OPTIMATION.force.y)));
        return { x: this.GC_OPTIMATION.force.x, y: this.GC_OPTIMATION.force.y, strength: this.GC_OPTIMATION.force.strength };
    }

    private get_neighbors(detection_radius: number) {
        this.neighbours = this._game.grid.find_near({ x: this.x, y: this.y }, { width: detection_radius, height: detection_radius });
        /**for (let i = 0; i < this._game.objects.length; i++) {
            if ((!this.neighbours.has(this._game.objects[i]) && this._game.objects[i].id != this.id) && this._game.objects[i].distance_to(this) < (detection_radius * detection_radius)) {
                this.neighbours.add(this._game.objects[i]);
                this._game.objects[i].neighbours.add(this);
            }
        }**/
    }

    distance_to(obj: entity): number {
        return Math.pow(this.x - obj.x, 2) + Math.pow(this.y - obj.y, 2);
    }
}