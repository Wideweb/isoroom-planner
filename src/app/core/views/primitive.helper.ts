import * as PIXI from 'pixi.js';

export const createIsoQuadPath = (width: number, height: number): PIXI.PointData[] => {
    return [
        { x: 0, y: -height / 2 },          // верх
        { x: width / 2, y: 0 },            // правый
        { x: 0, y: height / 2 },           // низ
        { x: -width / 2, y: 0 },           // левый
    ];
}