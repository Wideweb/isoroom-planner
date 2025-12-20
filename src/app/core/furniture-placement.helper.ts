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
    for (let i = 0; i < footprint.length; i++) {
        for (let j = 0; j < footprint[i].length; j++) {
            if (footprint[i][j] == 1) {
                return {x: i, y: j};
            }
        }
    }
    return {x: 0, y: 0};
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