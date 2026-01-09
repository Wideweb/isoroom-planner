import { getFootprint } from "../furniture-placement.helper";
import { Furniture, GridCellState, Placement, Vector2 } from "../game.model";
import { Grid } from "../grid";
import { PalcementRuleBaseValidator } from "./base.rule-validator";

export class IsAgainstTheWallRuleValidator extends PalcementRuleBaseValidator {

    constructor() {
        super();
        this.message = "is against the wall";
    }

    public validate(id: number, placement: Placement, grid: Grid, furnitures: Furniture[]): boolean {
        this.isValid = false;

        const footprint = getFootprint(furnitures[id], placement.position, placement.rotation);
        let backcells: Vector2[] = [];

        if (placement.rotation == 90) {
            const miny = Math.min(...footprint.map(cell => cell.y));
            backcells = footprint.filter(it => it.y == miny);
            backcells.forEach(it => it.y--);
        }
        else if (placement.rotation == 180) {
            const maxx = Math.max(...footprint.map(cell => cell.x));
            backcells = footprint.filter(it => it.x == maxx);
            backcells.forEach(it => it.x++);
        }
        else if (placement.rotation == 270) {
            const maxy = Math.max(...footprint.map(cell => cell.y));
            backcells = footprint.filter(it => it.y == maxy);
            backcells.forEach(it => it.y++);
        }
        else {
            const minx = Math.min(...footprint.map(cell => cell.x));
            backcells = footprint.filter(it => it.x == minx);
            backcells.forEach(it => it.x--);
        }

        this.isValid = backcells.every(it => (!grid.inBounds(it) || (grid.cells[it.y][it.x].flags & GridCellState.Room) == 0));
        
        return this.isValid;
    }

}