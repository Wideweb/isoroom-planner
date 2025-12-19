import { Camera, Placement, Vector2 } from "./game.model";

export const isoGridToWorld = (pos: Vector2, tileWidth: number, tileHeight: number): Vector2 => {
    const screenX = (pos.x - pos.y) * (tileWidth / 2);
    const screenY = (pos.x + pos.y) * (tileHeight / 2);
    return { x: screenX, y: screenY };
}

export const worldToIsoGrid = (pos: Vector2, tileWidth: number, tileHeight: number): Vector2 => {
    const tempX = (pos.x) / (tileWidth / 2);
    const tempY = (pos.y) / (tileHeight / 2);
    const gridX = Math.round((tempY + tempX) / 2);
    const gridY = Math.round((tempY - tempX) / 2);
    return { x: gridX, y: gridY };
}

export const viewToIsoGrid = (viewPos: Vector2, camera: Camera, tileWidth: number, tileHeight: number): Vector2 => {
    const wrldPos = { x: viewPos.x + camera.position.x, y: viewPos.y + camera.position.y };
    return worldToIsoGrid(wrldPos, tileWidth, tileHeight);
}

export const isoGridToView = (pos: Vector2, camera: Camera, tileWidth: number, tileHeight: number): Vector2 => {
    const x = (pos.x - pos.y) * (tileWidth / 2);
    const y = (pos.x + pos.y) * (tileHeight / 2);
    return { x: x - camera.position.x, y: y - camera.position.y };
}


export const gridPlacementCompare = (a: Placement, b: Placement): number => {
    const aPos = a.position.y * 1000 + a.position.x;
    const bPos = b.position.y * 1000 + b.position.x;
    return aPos - bPos;
}

export function lerp(from: number, to: number, t: number, clamp: boolean = false): number {
    const tt = clamp ? Math.min(1, Math.max(0, t)) : t;
    return from + (to - from) * tt;
}