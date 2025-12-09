
export type Rotation = 0 | 90 | 180 | 270;
export type Direction = 'N' | 'E' | 'S' | 'W';
export type Dictionary<K extends string, V> = Record<K, V>;

export interface Vector2 {
  x: number;
  y: number;
}

export interface FurnitureSprite {
  atlas: string;
  name: string;
  width: number;
  height: number;
  originX: number;
  originY: number;
}

export interface Furniture {
  id: number;
  name: string;
  //width: number; // in grid units
  //height: number; // in grid units
  //accessibleSides: Direction[]; // The sides that need to be clear and reachable
  requiresAccess: boolean;
  sprite: FurnitureSprite[];
  footprint: number[][][]
}

export interface PlacedFurniture extends Furniture {
  position: Vector2;
  rotation: Rotation;
}

export interface Cell {
  occupantId: number | null;
  isWalkable: boolean;
  isAccessibilityZoneFor: number | null;
  exists: boolean;
}