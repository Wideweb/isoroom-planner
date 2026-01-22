import { getAccessibilityCells, getFootprint, getFurnitureSize, isPlacementPossible } from "./furniture-placement.helper";
import { Furniture, GridCellState, OrderedList, Placement, Room, Rotation, Vector2 } from "./game.model";
import { Grid } from "./grid";
import { randomRotation, shuffle } from "./math.helper";
import { findAccessibleRefs } from "./pathfinder-iterative";
import { PalcementRuleBaseValidator } from "./placement-rule-validators/base.rule-validator";
import { createPlacementRuleValidator } from "./placement-rule-validators/rule-validator.factory";
import { getRoomScore } from "./room-score";


export interface FurnituresPackResult {
    room: Room;
    furnitures: number[];
    furniturePlacements: Placement[];
    score: number;
}

export class GreedyFurnituresPacker {

    grid: Grid;

    furnituresPlacementRules: PalcementRuleBaseValidator[][] = [];
    furniturePlaced = new OrderedList<number, Placement>();

    nextGridPos = new Vector2(0, 0);

    constructor(
        private furnitures: Furniture[],
        private rotations: Rotation[],
        private order: number[],
        private room: Room
    ) {

        furnitures.forEach(model => {
            this.furnituresPlacementRules.push(
                model.rules.map(ruleId => createPlacementRuleValidator(ruleId)!)
            );
        });

        this.grid = new Grid(
            Math.max(...room.cells.map(c => c.x)) + 1,
            Math.max(...room.cells.map(c => c.y)) + 1
        );

        this.placeRoom(this.room);
    }

    private placeRoom(room: Room) {
        this.grid.addFlag(GridCellState.Room, room.cells);
        if (room.entrance) {
            this.grid.addFlag(GridCellState.RoomEntrance, [room.entrance]);
        }
    }

    public pack(): FurnituresPackResult {
        for (let i = 0; i < this.order.length; i++) {
            this.nextGridPos.x = 0;
            this.nextGridPos.y = 0;
            this.findFurniturePlacement(this.order[i], this.rotations[this.order[i]], this.nextGridPos);
        }

        const placed = this.furniturePlaced.getAll()

        return {
            room: this.room,
            furnitures: placed.map(it => it.key),
            furniturePlacements: placed.map(it => it.value),
            score: getRoomScore(this.furnitures, this.furnituresPlacementRules, this.furniturePlaced, this.room, this.grid)
        }
    }

    private findFurniturePlacement(index: number, rotation: Rotation, gridPosStart: Vector2) {
        let gridX = gridPosStart.x;
        let gridY = gridPosStart.y;
        let placed = false;

        const position = new Vector2();

        while (gridY < this.grid.height && !placed) {
            while (gridX < this.grid.width && !placed) {

                position.x = gridX;
                position.y = gridY;
                
                placed = this.tryPlaceSelectedFurniture(index, position, rotation);

                gridX++;
            }
            gridX = 0;
            gridY++;
        }

        if (placed) {
            this.nextGridPos.x = gridX;
            this.nextGridPos.y = gridY;
        }
    }

    private tryPlaceSelectedFurniture(index: number, position: Vector2, rotation: Rotation) {
        const isValid = isPlacementPossible(this.grid, this.furnitures[index], position, rotation);
        if (!isValid) {
            return false;
        }

        this.placeFurniture(index, position, rotation);

        const refs = findAccessibleRefs(this.grid, this.room.entrance!);
        const placed = this.furniturePlaced.getAll().map(it => it.key);

        if (placed.some(it => !refs.has(it))) {
            this.removeFurniture(index);
            return false;
        }

        return true;
    }

    private placeFurniture(index: number, position: Vector2, rotation: Rotation): void {
        const furniture = this.furnitures[index];

        const footprint = getFootprint(furniture, position, rotation);
        const accessibilityCells = getAccessibilityCells(furniture, position, rotation);

        this.grid.place(index, footprint);
        this.grid.addFlag(GridCellState.Furniture, footprint);

        this.grid.place(index, accessibilityCells);
        this.grid.addFlag(GridCellState.FurnitureAccessibilityCell, accessibilityCells);

        const placement = new Placement(position, rotation);
        this.furniturePlaced.add(index, placement);
    }

    private removeFurniture(index: number) {
        const furniture = this.furnitures[index];
        const placement = this.furniturePlaced.getValue(index);

        if (!placement) return;

        const footprint = getFootprint(furniture, placement.position, placement.rotation);
        const accessibilityCells = getAccessibilityCells(furniture, placement.position, placement.rotation);

        this.grid.remove(index, footprint);
        this.grid.removeFlag(GridCellState.Furniture, footprint);

        this.grid.remove(index, accessibilityCells);
        this.grid.removeFlag(GridCellState.FurnitureAccessibilityCell, accessibilityCells);

        this.furniturePlaced.remove(index);
    }
}

interface Individual {
    order: number[];
    rotations: Rotation[];
    fitness: number;
    furniturePlaced: number[];
    furniturePlacements: Placement[];
}

export class GeneticFurnituresPacker {

    constructor(
        private furnitures: Furniture[],
        private room: Room) {
    }

    private randomIndividual(): Individual {
        const sizes = this.furnitures.map((it, index) => ({ index, size: getFurnitureSize(it) }));
        const order = shuffle(this.furnitures.map((it, index) => index)); // sizes.sort((a, b) => b.size - a.size).map(it => it.index);
        const rotations = order.map(_ => randomRotation());

        const packer = new GreedyFurnituresPacker(this.furnitures, rotations, order, this.room);
        const packResult = packer.pack();

        return {
            order,
            rotations,
            fitness: packResult.score,
            furniturePlaced: packResult.furnitures,
            furniturePlacements: packResult.furniturePlacements,
        };
    }

    private evolve(generations: number, popSize: number): Individual {
        let population: Individual[] = Array.from({ length: popSize }, () => this.randomIndividual());

        for (let gen = 0; gen < generations; gen++) {
            population.sort((a, b) => b.fitness - a.fitness);
            const next: Individual[] = population.slice(0, 2); // элитизм

            while (next.length < popSize) {
                const parent = population[Math.floor(Math.random() * popSize)];

                // мутация: случайный поворот
                const rotations = parent.rotations.map(old => Math.random() < 0.2 ? randomRotation() : old);

                // мутация: очередь
                const order = this.mutateWithProbability(parent.order);

                const packer = new GreedyFurnituresPacker(this.furnitures, rotations, order, this.room);
                const packResult = packer.pack();

                next.push({
                    order: order,
                    rotations,
                    fitness: packResult.score,
                    furniturePlaced: packResult.furnitures,
                    furniturePlacements: packResult.furniturePlacements,
                });
            }

            population = next;
        }

        population.sort((a, b) => b.fitness - a.fitness);
        return population[0];
    }

    public pack(): FurnituresPackResult {
        const best = this.evolve(100, 10);

        return {
            room: this.room,
            furnitures: best.furniturePlaced,
            furniturePlacements: best.furniturePlacements,
            score: best.fitness,
        }
    }

    private swapMutation(arr: number[]): number[] {
        const result = [...arr];
        const i = Math.floor(Math.random() * result.length);
        const j = Math.floor(Math.random() * result.length);
        [result[i], result[j]] = [result[j], result[i]];
        return result;
    }

    private mutateWithProbability(arr: number[], mutationRate = 0.05): number[] {
        const result = [...arr];
        for (let i = 0; i < result.length; i++) {
            if (Math.random() < mutationRate) {
                const j = Math.floor(Math.random() * result.length);
                [result[i], result[j]] = [result[j], result[i]];
            }
        }
        return result;
    }

}