import { Vector2 } from "../game.model";
import { Grid } from "../grid";
import { findPathIterative, PathfinderIterationState } from "../pathfinder-iterative";
import BaseView from "../views/base.view";
import PathView from "../views/path.view";
import { ViewAction } from "./base.action";

export interface ViewActionPathTracingModel {
    time: number;
    grid: Grid;
    from: Vector2;
}

export class ViewActionPathTracing extends ViewAction {
    public time: number;
    public grid: Grid;
    public from: Vector2;
    public reached: number[] = [];

    private pathGenerator: Generator<PathfinderIterationState> | null = null;

    constructor(model: ViewActionPathTracingModel) {
        super();

        this.time = model.time;
        this.grid = model.grid;
        this.from = model.from;
    }

    override reset() {
        super.reset();
        this.reached.splice(0, this.reached.length);
    }

    update(deltaMS: number, view: BaseView): void {
        if (this.finished || !this.active) {
            return;
        }

        const pathView = (view as PathView);

        if (!this.woken) {
            this.woken = true;
            this.pathGenerator = findPathIterative(this.grid, this.from);
            pathView.cells.splice(0, pathView.cells.length);
            pathView.isDirty = true;
        }

        this.elapsedTimeMS += deltaMS;
        if (this.elapsedTimeMS < this.time) {
            return;
        }

        const step = this.pathGenerator!.next();
        if (step.done) {
            this.finish();
        } else if (step.value.current != null) {
            this.reached.push(...step.value.current.refs);
            pathView.cells.push(step.value.current);
            pathView.isDirty = true;
        }

        this.elapsedTimeMS = this.elapsedTimeMS % this.time;
    }
}