
export type Rotation = 0 | 90 | 180 | 270;

export class Ref<T> { 
  constructor(public value: T) {} 
}

export enum GameLevelState {
    None = 0,
    Appearing = 1,
    FurniturePlacing = 2,
    Validating = 3,
    ShowResult = 4,
}

export enum GridCellState {
    None = 0,
    Room = 1 << 0,
    RoomEntrance = 1 << 1,
    Furniture = 1 << 2,
    FurnitureAccessibilityCell = 1 << 3,
    All = ~(~0 << 4)
}

export class Vector2 {
  constructor(public x = 0, public y = 0) {}
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

export class Placement {
  constructor(public position = new Vector2(), public rotation: Rotation = 0) {}

  equalTo(other: Placement | null) {
    if (!other) return false;

    if (other.rotation != this.rotation) return false;
    if (other.position.x != this.position.x) return false;
    if (other.position.y != this.position.y) return false;

    return true;
  }

  copyTo(dist: Placement | null) {
    if (!dist) return;

    dist.rotation = this.rotation;
    dist.position.x = this.position.x;
    dist.position.y = this.position.y;
  }
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

export class SortedList<K, V> {
    private items: { key: K; value: V }[] = [];
    private indexByKey = new Map<K, number>();
    private readonly compare: (a: V, b: V) => number;

    constructor(compareFn: (a: V, b: V) => number) {
        this.compare = compareFn;
    }

    private binarySearch(value: V): number {
        let left = 0;
        let right = this.items.length;

        while (left < right) {
            const mid = (left + right) >> 1;
            const cmp = this.compare(value, this.items[mid].value);

            if (cmp > 0) left = mid + 1;
            else right = mid;
        }
        return left;
    }

    add(key: K, value: V): void {
        if (this.indexByKey.has(key)) {
            this.remove(key);
        }

        const index = this.binarySearch(value);

        this.items.splice(index, 0, { key, value });

        for (let i = index; i < this.items.length; i++) {
            this.indexByKey.set(this.items[i].key, i);
        }
    }

    remove(key: K): boolean {
        const index = this.indexByKey.get(key);
        if (index === undefined) return false;

        this.items.splice(index, 1);
        this.indexByKey.delete(key);

        for (let i = index; i < this.items.length; i++) {
            this.indexByKey.set(this.items[i].key, i);
        }

        return true;
    }

    hasKey(key: K): boolean {
      return this.indexByKey.get(key) !== undefined;
    }

    getValue(key: K): V | undefined {
      const index = this.indexByKey.get(key)!;
      if (index !== undefined) {
        return this.items[index].value;
      }
      return undefined;
    }

    getAll(): { key: K; value: V }[] {
        return this.items;
    }
    
    clear() {
      this.items.splice(0, this.items.length);
      this.indexByKey.clear();
    }
}