
import { Injectable, signal, computed } from '@angular/core';
import { Cell, Furniture, PlacedFurniture, Rotation, Vector2, Direction } from './game.model';

@Injectable({
  providedIn: 'root',
})
export class GameLogicService {
  gridWidth = signal(10);
  gridHeight = signal(12);
  entrance = computed(() => ({ x: Math.floor(this.gridWidth() / 2), y: this.gridHeight() - 1 }));

  grid = signal<Cell[][]>([]);
  placedFurniture = signal<PlacedFurniture[]>([]);

  constructor() {
    this.initializeGrid();
  }

  initializeGrid(): void {
    const newGrid: Cell[][] = Array.from({ length: this.gridHeight() }, () =>
      Array.from({ length: this.gridWidth() }, () => ({
        occupantId: null,
        isWalkable: true,
        isAccessibilityZoneFor: null,
        exists: true,
      }))
    );
    this.grid.set(newGrid);
    this.placedFurniture.set([]);
  }

  changeGridSize(width: number, height: number): void {
    this.gridWidth.set(width);
    this.gridHeight.set(height);
    this.initializeGrid();
  }
  
  toggleCell(pos: Vector2): void {
    const grid = this.grid();
    if (!grid[pos.y] || !grid[pos.y][pos.x]) {
      return; // out of bounds
    }

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const cell = newGrid[pos.y][pos.x];
    const entrance = this.entrance();

    if (pos.x === entrance.x && pos.y === entrance.y) {
      return; // Cannot remove entrance
    }

    if (cell.exists) { // Remove cell
      if (cell.occupantId !== null) return; // Cannot remove occupied cell
      cell.exists = false;
      cell.isWalkable = false;
    } else { // Add cell
      const isAdjacent = this.getRawNeighbors(pos).some(n => newGrid[n.y][n.x].exists);
      if (!isAdjacent) return; // Must be adjacent to existing cell
      cell.exists = true;
      cell.isWalkable = true;
    }

    this.grid.set(newGrid);
  }

  // getRotatedDimensions(item: Furniture, rotation: Rotation): { w: number; h: number } {
  //   return rotation === 90 || rotation === 270 ? { w: item.height, h: item.width } : { w: item.width, h: item.height };
  // }

  getFootprintOrigin(item: PlacedFurniture): Vector2 {
    const footprint = item.footprint[item.rotation / 90];
    for (let i = 0; i < footprint.length; i++) {
      for (let j = 0; j < footprint[i].length; j++) {
        if (footprint[i][j] == 1) {
          return {x: i, y: j};
        }
      }
    }
    return {x: 0, y: 0};
  }

  getFootprint(item: PlacedFurniture): Vector2[] {
    const cells: Vector2[] = [];
    const footprint = item.footprint[item.rotation / 90];
    const footprintOrigin = this.getFootprintOrigin(item);

    for (let i = 0; i < footprint.length; i++) {
      for (let j = 0; j < footprint[i].length; j++) {
        const footprintCell =  footprint[i][j];
        if (footprintCell == 1 || footprintCell == 2) {
          const x = item.position.x + i - footprintOrigin.x;
          const y = item.position.y + j - footprintOrigin.y;

          cells.push({ x, y });
        }
      }
    }

    return cells;
  }

  getAccessibilityCells(item: PlacedFurniture): Vector2[] {
    if (!item.requiresAccess) return [];

    //const { w, h } = this.getRotatedDimensions(item, item.rotation);
    const cells: Vector2[] = [];
    const footprint = item.footprint[item.rotation / 90];
    const footprintOrigin = this.getFootprintOrigin(item);

    for (let i = 0; i < footprint.length; i++) {
      for (let j = 0; j < footprint[i].length; j++) {
        const footprintCell =  footprint[i][j];
        if (footprintCell == 5) {
          const x = item.position.x + i - footprintOrigin.x;
          const y = item.position.y + j - footprintOrigin.y;

          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  isPlacementValid(item: Furniture, position: Vector2, rotation: Rotation): boolean {
    const tempPlacedItem: PlacedFurniture = { ...item, position, rotation };
    const footprint = this.getFootprint(tempPlacedItem);
    const accessibilityCells = this.getAccessibilityCells(tempPlacedItem);
    const currentGrid = this.grid();

    for (const cell of footprint) {
      if (cell.x < 0 || cell.x >= this.gridWidth() || cell.y < 0 || cell.y >= this.gridHeight()) return false;
      const gridCell = currentGrid[cell.y]?.[cell.x];
      if (!gridCell || !gridCell.exists || gridCell.occupantId !== null || gridCell.isAccessibilityZoneFor !== null) return false;
    }
    
    for (const cell of accessibilityCells) {
        if (cell.x < 0 || cell.x >= this.gridWidth() || cell.y < 0 || cell.y >= this.gridHeight()) return false;
        const gridCell = currentGrid[cell.y]?.[cell.x];
        if (!gridCell || !gridCell.exists || gridCell.occupantId !== null) return false;
    }

    return true;
  }

  placeFurniture(item: PlacedFurniture): void {
    const footprint = this.getFootprint(item);
    const accessibilityCells = this.getAccessibilityCells(item);

    const changes = new Map<string, Partial<Cell>>();
    footprint.forEach(pos => {
      changes.set(`${pos.x},${pos.y}`, { occupantId: item.id, isWalkable: false });
      console.log(pos);
    });

    accessibilityCells.forEach(pos => {
      const key = `${pos.x},${pos.y}`;
      changes.set(key, { ...changes.get(key), isAccessibilityZoneFor: item.id, isWalkable: true });
    });

    const newGrid = this.grid().map((row, y) =>
      row.map((cell, x) => {
        const key = `${x},${y}`;
        if (changes.has(key)) {
          return { ...cell, ...changes.get(key) };
        }
        return cell;
      })
    );
    
    this.grid.set(newGrid);
    this.placedFurniture.update(items => [...items, item]);
  }
  
  removeFurniture(itemId: number): void {
    const itemToRemove = this.placedFurniture().find(f => f.id === itemId);
    if (!itemToRemove) return;

    const footprint = this.getFootprint(itemToRemove);
    const accessibilityCells = this.getAccessibilityCells(itemToRemove);

    const cellsToClear = [...footprint, ...accessibilityCells];
    const changes = new Map<string, Partial<Cell>>();
    cellsToClear.forEach(pos => {
      changes.set(`${pos.x},${pos.y}`, { occupantId: null, isWalkable: true, isAccessibilityZoneFor: null });
    });

    const newGrid = this.grid().map((row, y) =>
      row.map((cell, x) => {
        const key = `${x},${y}`;
        if (changes.has(key)) {
          // only reset cells that belong to the item being removed
          if (cell.occupantId === itemId || cell.isAccessibilityZoneFor === itemId) {
             return { ...cell, ...changes.get(key) };
          }
        }
        return cell;
      })
    );
    
    this.grid.set(newGrid);
    this.placedFurniture.update(items => items.filter(f => f.id !== itemId));
  }

  checkWinCondition(): boolean {
    const itemsRequiringAccess = this.placedFurniture().filter(f => f.requiresAccess);
    if (itemsRequiringAccess.length === 0) return true;

    for (const item of itemsRequiringAccess) {
        const accessibilityCells = this.getAccessibilityCells(item);
        if (accessibilityCells.length === 0) continue;

        const isAnySideAccessible = accessibilityCells.some(cell => !!this.findPath(this.entrance(), cell));

        if (!isAnySideAccessible) {
            return false;
        }
    }
    return true;
  }
  
  checkAllAccessibility(): Set<number> {
    const inaccessibleIds = new Set<number>();
    const itemsRequiringAccess = this.placedFurniture().filter(f => f.requiresAccess);

    for (const item of itemsRequiringAccess) {
      const accessibilityCells = this.getAccessibilityCells(item);
      if (accessibilityCells.length === 0) continue;

      const isAnySideAccessible = accessibilityCells.some(cell => !!this.findPath(this.entrance(), cell));

      if (!isAnySideAccessible) {
        inaccessibleIds.add(item.id);
      }
    }
    return inaccessibleIds;
  }
  
  private findPath(start: Vector2, end: Vector2): Vector2[] | null {
    const openSet: any[] = [{ ...start, g: 0, h: this.heuristic(start, end), f: this.heuristic(start, end) }];
    const cameFrom = new Map<string, any>();
    const gScore = new Map<string, number>();
    const key = (pos: Vector2) => `${pos.x},${pos.y}`;
    gScore.set(key(start), 0);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(cameFrom, current);
      }
      
      this.getNeighbors(current).forEach(neighbor => {
        const tentativeGScore = (gScore.get(key(current)) || Infinity) + 1;
        if (tentativeGScore < (gScore.get(key(neighbor)) || Infinity)) {
          cameFrom.set(key(neighbor), current);
          gScore.set(key(neighbor), tentativeGScore);
          const fScore = tentativeGScore + this.heuristic(neighbor, end);
          if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
            openSet.push({ ...neighbor, g: tentativeGScore, h: this.heuristic(neighbor, end), f: fScore });
          }
        }
      });
    }
    return null; // No path found
  }

  private heuristic = (a: Vector2, b: Vector2) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  private getNeighbors(pos: Vector2): Vector2[] {
    const neighbors: Vector2[] = [];
    const grid = this.grid();
    const dirs = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
    for(const dir of dirs) {
        const next = { x: pos.x + dir.x, y: pos.y + dir.y };
        if(next.x >= 0 && next.x < this.gridWidth() && next.y >= 0 && next.y < this.gridHeight()) {
            const cell = grid[next.y][next.x];
            if (cell.exists && cell.isWalkable) {
                neighbors.push(next);
            }
        }
    }
    return neighbors;
  }
  
  private getRawNeighbors(pos: Vector2): Vector2[] {
    const neighbors: Vector2[] = [];
    const dirs = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
    for(const dir of dirs) {
        const next = { x: pos.x + dir.x, y: pos.y + dir.y };
        if(next.x >= 0 && next.x < this.gridWidth() && next.y >= 0 && next.y < this.gridHeight()) {
            neighbors.push(next);
        }
    }
    return neighbors;
  }

  private reconstructPath(cameFrom: Map<string, any>, current: Vector2): Vector2[] {
    const totalPath = [current];
    let currentKey = `${current.x},${current.y}`;
    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey);
      totalPath.unshift(current);
      currentKey = `${current.x},${current.y}`;
    }
    return totalPath;
  }
}