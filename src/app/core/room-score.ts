import { getFurnitureSize } from "./furniture-placement.helper";
import { Furniture, GridCellState, OrderedList, Placement, Room } from "./game.model";
import { Grid } from "./grid";
import { findAccessibleRefs } from "./pathfinder-iterative";
import { PalcementRuleBaseValidator } from "./placement-rule-validators/base.rule-validator";

export const getRoomScore = (
    furnitures:Furniture[],
    furnituresPlacementRules: PalcementRuleBaseValidator[][],
    furniturePlaced: OrderedList<number, Placement>,
    room: Room,
    grid: Grid,
    furnitureNotAccessible: number[] | null = null,
) => {
    let score = 0;

    furniturePlaced
        .getAll()
        .map(it => getFurnitureSize(furnitures[it.key]))
        .forEach(size => {
            score += size;
        });

    furniturePlaced.getAll().forEach(item => {
        furnituresPlacementRules[item.key].forEach(rule => {
            if (rule.validate(item.key, item.value, grid, furnitures, room)) {
                score += 5;
            }
        });
    });

    // score += furniturePlaced
    //     .getAll()
    //     .flatMap(it => furnituresPlacementRules[it.key])
    //     .filter(it => it.isValid)
    //     .length * 5;

    // accessibility
    if (room && room.entrance) {
        const refs = findAccessibleRefs(grid, room.entrance);
        const placed = furniturePlaced.getAll();

        score += refs.size * 5;
        score -= (placed.length  - refs.size) * 5;

        if (furnitureNotAccessible) {
            furnitureNotAccessible.length = 0;
            placed.filter(item => !refs.has(item.key)).forEach(item => furnitureNotAccessible.push(item.key));
        }
    }

    let busyCells = 0;
    let roomCells = 0;
    for (let i = 0; i < grid.height; i++) {
        for (let j = 0; j < grid.width; j++) {
            if (grid.cells[i][j].flags & GridCellState.Furniture) {
                busyCells++;
            }
            if (grid.cells[i][j].flags & GridCellState.Room) {
                roomCells++;
            }
        }
    }
    
    if (busyCells / roomCells > 0.7) {
        score += 10;
    }

    return score;
}