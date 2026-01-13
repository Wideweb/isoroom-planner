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

export enum SelectedFurnitureState {
    None = 0,
    New = 1 << 0,
    PickedUp = 1 << 1,
    FirstClickHandled = 1 << 2,
    FurnitureMoved = 1 << 3
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
  offsetX: number;
  offsetY: number;
}

export interface Furniture {
  id: number;
  name: string;
  requiresAccess: boolean;
  sprite: SpriteSrc[];
  footprint: number[][];
  rules: number[];
  category: number;
}

export enum FurnitureCategory {
  LivingRoom = 0,
  Kitchen = 1,
  Bathroom = 2,
  Office = 3,
  Bedroom = 4,
  Decor = 5,
  Max = 6,
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
  scale: number = 1;
  version = 0;
}

export interface GameLevelData {
  room: Room;
  furnitures: Furniture[];
  assets: string[];
}

// export class SortedList<K, V> {
//     private items: { key: K; value: V }[] = [];
//     private indexByKey = new Map<K, number>();
//     private readonly compare: (a: V, b: V, key1: K, key2: K) => number;

//     constructor(compareFn: (a: V, b: V, key1: K, key2: K) => number) {
//         this.compare = compareFn;
//     }

//     private binarySearch(key: K, value: V): number {
//         let left = 0;
//         let right = this.items.length;

//         while (left < right) {
//             const mid = (left + right) >> 1;
//             const cmp = this.compare(value, this.items[mid].value, key, this.items[mid].key);

//             if (cmp > 0) left = mid + 1;
//             else right = mid;
//         }
//         return left;
//     }

//     add(key: K, value: V): void {
//         if (this.indexByKey.has(key)) {
//             this.remove(key);
//         }

//         const index = this.binarySearch(key, value);

//         this.items.splice(index, 0, { key, value });

//         for (let i = index; i < this.items.length; i++) {
//             this.indexByKey.set(this.items[i].key, i);
//         }
//     }

//     remove(key: K): boolean {
//         const index = this.indexByKey.get(key);
//         if (index === undefined) return false;

//         this.items.splice(index, 1);
//         this.indexByKey.delete(key);

//         for (let i = index; i < this.items.length; i++) {
//             this.indexByKey.set(this.items[i].key, i);
//         }

//         return true;
//     }

//     hasKey(key: K): boolean {
//       return this.indexByKey.get(key) !== undefined;
//     }

//     getValue(key: K): V | undefined {
//       const index = this.indexByKey.get(key)!;
//       if (index !== undefined) {
//         return this.items[index].value;
//       }
//       return undefined;
//     }

//     getAll(): { key: K; value: V }[] {
//         return this.items;
//     }
    
//     clear() {
//       this.items.splice(0, this.items.length);
//       this.indexByKey.clear();
//     }
// }


export class OrderedList<K, V> {
    private items: { key: K; value: V }[] = [];
    private indexByKey = new Map<K, number>();

    add(key: K, value: V): void {
        if (this.indexByKey.has(key)) {
            this.remove(key);
        }
        this.items.push({ key, value });
        this.indexByKey.set(key, this.items.length - 1);
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
        const index = this.indexByKey.get(key);
        return index !== undefined ? this.items[index].value : undefined;
    }

    getAll(): { key: K; value: V }[] {
        return this.items;
    }

    clear() {
        this.items.splice(0, this.items.length);
        this.indexByKey.clear();
    }

    sortTopologically(hasEdge: (a: {key: K; value: V}, b: {key: K; value: V}) => boolean): void {
        const sorted = topologicalSort(this.items, hasEdge);
        this.items = sorted;
        this.indexByKey.clear();
        this.items.forEach((item, i) => this.indexByKey.set(item.key, i));
    }
}

export function topologicalSort<T>(
  nodes: T[],
  hasEdge: (a: T, b: T) => boolean
): T[] {
  const result: T[] = [];
  const visited = new Set<T>();
  const temp = new Set<T>();

  const visit = (node: T) => {
    if (temp.has(node)) {
      throw new Error("cycle dependancie");
    }
    if (!visited.has(node)) {
      temp.add(node);
      for (const other of nodes) {
        if (node != other && hasEdge(node, other)) {
          visit(other);
        }
      }
      temp.delete(node);
      visited.add(node);
      result.push(node);
    }
  };

  for (const node of nodes) {
    if (!visited.has(node)) {
      visit(node);
    }
  }

  return result.reverse();
}

export class GroupCollection<T> {
  public groups: T[][];

  constructor(size: number) {
    this.groups = Array.from({ length: size }, () => []);
  }

  add(groupId: number, item: T): void {
    this.groups[groupId].push(item);
  }

  takeFromGroup(groupId: number, count: number): T[] {
    const group = this.groups[groupId];
    const taken = group.splice(0, count);
    return taken;
  }

  getSortedGroups(): {group: number, items: T[]}[] {
    return this.groups
      .map((items, idx) => ({group: idx, items}))
      .sort((a, b) => b.items.length - a.items.length);
  }
}
