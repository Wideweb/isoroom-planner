import { getFootprint } from "../furniture-placement.helper";
import { Furniture, GridCellState, Placement, Room } from "../game.model";
import { Grid } from "../grid";
import { PalcementRuleBaseValidator } from "./base.rule-validator";

export class IsHiddenFromTheEntraceRuleValidator extends PalcementRuleBaseValidator {

    constructor() {
        super();
        this.message = "hidden from the entrance";
    }

    public validate(id: number, placement: Placement, grid: Grid, furnitures: Furniture[], room: Room): boolean {
        this.isValid = false;

        const footprint = getFootprint(furnitures[id], placement.position, placement.rotation);
        const hidden = footprint.every(footprintCell => {
            const ray = grid.getCellsOnLine(footprintCell, room.entrance!);
            return ray.some(cell => !(cell.flags & GridCellState.Room) || cell.flags & GridCellState.Furniture);
        })

        this.isValid = hidden;
        return this.isValid;
    }

}