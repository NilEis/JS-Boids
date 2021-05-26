import { math } from "../math/math";
import { entity } from "./boid";

export class spatial_hash_grid {
    private bounds: { width: number, height: number };
    private dimensions: { width: number, height: number };
    private cells: Map<string, Set<entity>>;

    constructor(bounds: { width: number, height: number }, dimensions: { width: number, height: number }) {
        this.bounds = bounds;
        this.dimensions = dimensions;
        this.cells = new Map<string, Set<entity>>();
    }

    new_client(client: entity) {
        client.indicies = null;

        this.insert(client);
    }

    private insert(cli: entity) {
        const X = cli.x;
        const Y = cli.y;
        const W = cli.size;
        const H = cli.size;

        const first_index = this.get_index([X - W / 2, Y - H / 2]);
        const last_index = this.get_index([X + W / 2, Y + H / 2]);

        cli.indicies = [[first_index[0], first_index[1]], [last_index[0], last_index[1]]];
        let k = "";
        for (let x = first_index[0]; x <= last_index[0]; x++) {
            for (let y = first_index[1]; y <= last_index[1]; y++) {
                k = this.get_key(x, y);
                if (!this.cells.has(k)) {
                    this.cells.set(k, new Set());
                }

                this.cells.get(k)?.add(cli);
            }
        }
    }

    private get_index(pos: number[]): number[] {
        const X = math.clamp(0.0, 1.0, ((pos[0]) / (this.bounds.width)));
        const Y = math.clamp(0.0, 1.0, ((pos[1]) / (this.bounds.height)));
        return [Math.floor(X * (this.dimensions.width - 1)), Math.floor(Y * (this.dimensions.height - 1))];
    }

    private get_key(x: number, y: number): string {
        return x + "." + y;
    }

    find_near(pos: { x: number, y: number }, dimension: { width: number, height: number }): Set<entity> {
        const X = pos.x;
        const Y = pos.y;
        const W = dimension.width;
        const H = dimension.height;

        const first_index = this.get_index([X - W / 2, Y - H / 2]);
        const last_index = this.get_index([X + W / 2, Y + H / 2]);

        const clients = new Set<entity>();
        let k = "";
        let cell: Set<entity>;
        for (let x = first_index[0]; x <= last_index[0]; x++) {
            for (let y = first_index[1]; y <= last_index[1]; y++) {
                k = this.get_key(x, y);
                if (this.cells.has(k)) {
                    cell = this.cells.get(k) || new Set<entity>();
                    for (const i of cell) {
                        clients.add(i);
                    }
                }
            }
        }
        return clients;
    }

    update_client(client: entity) {
        const X = client.x;
        const Y = client.y;
        const W = client.size;
        const H = client.size;

        const first_index = this.get_index([X - W / 2, Y - H / 2]);
        const last_index = this.get_index([X + W / 2, Y + H / 2]);

        if (client.indicies != null &&
            client.indicies[0][0] == first_index[0] &&
            client.indicies[0][1] == first_index[1] &&
            client.indicies[1][0] == last_index[0] &&
            client.indicies[1][1] == last_index[1]
        ) {
            return;
        }

        this.remove_client(client);
        this.insert(client);
    }

    remove_client(client: entity) {
        const first_index = (client.indicies == null) ? [0, 0] : client.indicies[0];
        const last_index = (client.indicies == null) ? [0, 0] : client.indicies[1];
        let k = "";
        for (let x = first_index[0]; x <= last_index[0]; x++) {
            for (let y = first_index[1]; y <= last_index[1]; y++) {
                k = this.get_key(x, y);
                this.cells.get(k)?.delete(client);
            }
        }
    }


}