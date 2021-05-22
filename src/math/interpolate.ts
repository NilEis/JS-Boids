export function interpolate(s: number, e: number, t: number): number {
    return s * (1 - t) + e * t;
}

export function cosine_interpolate(s: number, e: number, t: number): number {
    var ft = t * Math.PI;
    var f = (1 - Math.cos(ft)) * 0.5;
    return s * (1 - f) + e * f;
}

