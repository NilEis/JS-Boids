export class math {
    constructor() {

    }

    static clamp(min: number, max: number, val: number): number {
        return Math.min(Math.max(min, +val), max);
    }
}