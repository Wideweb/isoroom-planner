import { GridCellState, Vector2, Rotation, Furniture } from "./game.model";
import { Grid } from "./grid";

export const isPlacementPossible = (grid: Grid, item: Furniture, position: Vector2, rotation: Rotation): boolean => {
    const footprint = getFootprint(item, position, rotation);

    for (const cell of footprint) {
        if (cell.x < 0 || cell.x >= grid.width || cell.y < 0 || cell.y >= grid.height) {
            return false;
        }
      
        const gridCell = grid.cells[cell.y][cell.x];
        if (!gridCell || !(gridCell.flags & (GridCellState.Room)) || (gridCell.flags & GridCellState.Furniture)) {
            return false;
        }
    }

    return true;
}

export const isPlacementValid = (grid: Grid, item: Furniture, position: Vector2, rotation: Rotation): boolean => {
    const footprint = getFootprint(item, position, rotation);
    const accessibilityCells = getAccessibilityCells(item, position, rotation);

    for (const cell of footprint) {
        if (cell.x < 0 || cell.x >= grid.width || cell.y < 0 || cell.y >= grid.height) {
            return false;
        }
      
        const gridCell = grid.cells[cell.y][cell.x];
        if (!gridCell || !(gridCell.flags & (GridCellState.Room))) {
            return false;
        }
        if (gridCell.flags & (GridCellState.RoomEntrance | GridCellState.Furniture | GridCellState.FurnitureAccessibilityCell)) {
            return false;
        }
    }
    
    for (const cell of accessibilityCells) {
        if (cell.x < 0 || cell.x >= grid.width || cell.y < 0 || cell.y >= grid.height) {
            return false;
        }

        const gridCell = grid.cells[cell.y][cell.x];
        if (!gridCell || !(gridCell.flags & (GridCellState.Room))) {
            return false;
        }
        if (gridCell.flags & GridCellState.Furniture) {
            return false;
        }
    }

    return true;
}

export const placeFurniture = (grid: Grid, item: Furniture, position: Vector2, rotation: Rotation): void => {
    const footprint = getFootprint(item, position, rotation);
    const accessibilityCells = getAccessibilityCells(item, position, rotation);

    grid.place(item.id, footprint);
    grid.addFlag(GridCellState.Furniture, footprint);

    grid.place(item.id, accessibilityCells);
    grid.addFlag(GridCellState.FurnitureAccessibilityCell, accessibilityCells);
}

export const getFootprint = (item: Furniture, position: Vector2, rotation: Rotation): Vector2[] => {
    const cells: Vector2[] = [];
    const footprint = item.footprint[rotation / 90];
    const footprintOrigin = getFootprintOrigin(item, rotation);

    for (let i = 0; i < footprint.length; i++) {
        for (let j = 0; j < footprint[i].length; j++) {
            const footprintCell =  footprint[i][j];
            if (footprintCell == 1 || footprintCell == 2) {
                const x = position.x + i - footprintOrigin.x;
                const y = position.y + j - footprintOrigin.y;

                cells.push({ x, y });
            }
        }
    }
    return cells;
}

export const getFootprintOrigin = (item: Furniture, rotation: Rotation): Vector2 => {
    const footprint = item.footprint[rotation / 90];
    const origin = new Vector2(9999, 9999);

    for (let i = 0; i < footprint.length; i++) {
        for (let j = 0; j < footprint[i].length; j++) {
            const footprintCell =  footprint[i][j];
            if (footprintCell == 1 || footprintCell == 2) {
                origin.x = Math.min(origin.x, i);
                origin.y = Math.min(origin.y, j);
            }
        }
    }

    return origin;
}

export const getFootprintCenter = (item: Furniture, position: Vector2, rotation: Rotation): Vector2 => {
    const footprint = getFootprint(item, position, rotation);

    const maxx = Math.max(...footprint.map(c => c.x));
    const maxy = Math.max(...footprint.map(c => c.y));
    const minx = Math.min(...footprint.map(c => c.x));
    const miny = Math.min(...footprint.map(c => c.y));
    
    return new Vector2(position.x + (maxx - minx) / 2, position.y + (maxy - miny) / 2);
}

export const getAccessibilityCells = (item: Furniture, position: Vector2, rotation: Rotation): Vector2[] => {
    if (!item.requiresAccess) return [];

    const cells: Vector2[] = [];
    const footprint = item.footprint[rotation / 90];
    const footprintOrigin = getFootprintOrigin(item, rotation);

    for (let i = 0; i < footprint.length; i++) {
        for (let j = 0; j < footprint[i].length; j++) {
            const footprintCell = footprint[i][j];
            if (footprintCell == 5) {
                const x = position.x + i - footprintOrigin.x;
                const y = position.y + j - footprintOrigin.y;

                cells.push({ x, y });
            }
        }
    }
    return cells;
}