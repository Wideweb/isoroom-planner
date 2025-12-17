
export type Rotation = 0 | 90 | 180 | 270;

export class Ref<T> { 
  constructor(public value: T) {} 
}

export enum GridCellState {
    None = 0,
    Room = 1 << 0,
    RoomEntrance = 1 << 1,
    Furniture = 1 << 2,
    FurnitureAccessibilityCell = 1 << 3,
    All = ~(~0 << 4)
}

export interface Vector2 {
  x: number;
  y: number;
}

export const ZERO_VECTOR = (): Vector2 => {
  return {x: 0, y: 0};
}

export interface SpriteSrc {
  name: string;
  width: number;
  height: number;
  originX: number;
  originY: number;
}

export interface Furniture {
  id: number;
  name: string;
  requiresAccess: boolean;
  sprite: SpriteSrc[];
  footprint: number[][][]
}

export interface Room {
  cells: Vector2[];
  entrance: Vector2 | null;
}

export interface Placement {
  position: Vector2;
  rotation: Rotation;
}

export const ZERO_PLACEMENT = (): Placement => {
  return {
    position: ZERO_VECTOR(),
    rotation: 0,
  };
}

export interface Cell {
  occupantId: number | null;
  isWalkable: boolean;
  isAccessibilityZoneFor: number | null;
  exists: boolean;
}

export class Camera {
  position: Vector2 = { x: 0, y: 0 };
  rotation: Rotation = 0;
}

export interface GameLevelData {
  room: Room;
  furnitures: Furniture[];
  assets: string[];
}