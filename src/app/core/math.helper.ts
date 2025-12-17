import { Camera, Vector2 } from "./game.model";

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