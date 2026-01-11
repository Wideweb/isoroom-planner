import { Furniture, Placement, Room } from "../game.model";
import { Grid } from "../grid";

export abstract class PalcementRuleBaseValidator {
    public isValid = false;

    public message: string = '';

    public abstract validate(id: number, placement: Placement, grid: Grid, furnitures: Furniture[], room: Room): boolean;
}