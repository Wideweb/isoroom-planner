import { getFootprint } from "./furniture-placement.helper";
import { Camera, Furniture, Placement, Rotation, Vector2 } from "./game.model";

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

export const worldToIsoGridFloating = (pos: Vector2, tileWidth: number, tileHeight: number): Vector2 => {
    const tempX = (pos.x) / (tileWidth / 2);
    const tempY = (pos.y) / (tileHeight / 2);
    const gridX = ((tempY + tempX) / 2);
    const gridY = ((tempY - tempX) / 2);
    return { x: gridX, y: gridY };
}

export const rotateCoordinates = (x: number, y: number, rotation: 0 | 90 | 180 | 270): Vector2 => {
    switch (rotation) {
        case 90: return  { x: +y, y: -x };
        case 180: return { x: -x, y: -y };
        case 270: return { x: -y, y: +x };
        default: return  { x, y }; 
    };
}

export const viewToIsoGrid = (viewPos: Vector2, camera: Camera, tileWidth: number, tileHeight: number): Vector2 => {
    const pos = { x: viewPos.x + camera.position.x, y: viewPos.y + camera.position.y };
    const wrldPos = rotateCoordinates(pos.x, pos.y, camera.rotation);
    const tileSize = getTileSize(tileWidth, tileHeight, camera.rotation);
    // TODO: WHY NOT INVERTED SCALE??
    return worldToIsoGrid(wrldPos, tileSize.w * camera.scale, tileSize.h * camera.scale);
}

export const viewToIsoGridFloating = (viewPos: Vector2, camera: Camera, tileWidth: number, tileHeight: number): Vector2 => {
    const pos = { x: viewPos.x + camera.position.x, y: viewPos.y + camera.position.y };
    const wrldPos = rotateCoordinates(pos.x, pos.y, camera.rotation);
    const tileSize = getTileSize(tileWidth, tileHeight, camera.rotation);
    // TODO: WHY NOT INVERTED SCALE??
    return worldToIsoGridFloating(wrldPos, tileSize.w * camera.scale, tileSize.h * camera.scale);
}

export const isoGridToView = (pos: Vector2, camera: Camera, tileWidth: number, tileHeight: number): Vector2 => {
    const tileSize = getTileSize(tileWidth * camera.scale, tileHeight * camera.scale, camera.rotation);

    const x = (pos.x - pos.y) * (tileSize.w / 2);
    const y = (pos.x + pos.y) * (tileSize.h / 2);

    const xy = rotateCoordinates(x, y, (360 - camera.rotation) as Rotation);

    return { x: xy.x - camera.position.x, y: xy.y - camera.position.y };
}

export const gridPlacementCompare = (camera: Camera, furnitures: Furniture[]) => (a: Placement, b: Placement, ai: number, bi: number): number => {
    const fa = furnitures[ai];    
    const afootprintView = getFootprint(fa, a.position, a.rotation);//.map(cell => rotateCoordinates(cell.x, cell.y, (360 - camera.rotation) as Rotation));
    const ay_max = Math.max(...afootprintView.map(c => c.y));
    const ax_max = Math.max(...afootprintView.map(c => c.x));
    const ay_min = Math.min(...afootprintView.map(c => c.y));
    const ax_min = Math.min(...afootprintView.map(c => c.x));

    const fb = furnitures[bi];
    const bfootprintView = getFootprint(fb, b.position, b.rotation);//.map(cell => rotateCoordinates(cell.x, cell.y, (360 - camera.rotation) as Rotation));
    const by_max = Math.max(...bfootprintView.map(c => c.y));
    const bx_max = Math.max(...bfootprintView.map(c => c.x));
    const by_min = Math.min(...bfootprintView.map(c => c.y));
    const bx_min = Math.min(...bfootprintView.map(c => c.x));

    const rotation = camera.rotation % 360;

    if (rotation == 0) {
       return 1;
    }

    if (rotation == 90) {
        if (ay_min < by_min) return 1;
        if (ay_min > by_min) return -1;
        if (ax_max > bx_max) return 1;
        if (ax_max < bx_max) return -1;
        return 0;
    }

    if (rotation == 180) {
        return (ax_min * 1000 + ay_min) - (bx_min * 1000 + by_min);
    }

    // rotation == 270
    return (ay_max * 1000 + ax_min) - (by_max * 1000 + bx_min);

    //console.log(aviewPos, bviewPos)

    // if (ax > bx) return 1;
    // if (ax < bx) return -1;
    
    // if (ay > by) return 1;
    // if (ay < by) return -1;

    return 0;


    //const aPos = a.position.y * 1000 + a.position.x;
    //const bPos = b.position.y * 1000 + b.position.x;
    //return (Math.abs(ax) * 1000 + ay) - (Math.abs(bx * 1000) + by);
}

export function lerp(from: number, to: number, t: number, clamp: boolean = false): number {
    const tt = clamp ? Math.min(1, Math.max(0, t)) : t;
    return from + (to - from) * tt;
}

export function getTileSize(
  tileWidth: number,
  tileHeight: number,
  rotation: 0 | 90 | 180 | 270
): { w: number; h: number } {
  switch (rotation) {
    case 90:
    case 270:
      return { w: tileHeight, h: tileWidth };
    case 180:
    case 0:
    default:
      return { w: tileWidth, h: tileHeight };
  }
}
