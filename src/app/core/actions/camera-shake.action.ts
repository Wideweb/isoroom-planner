import { Vector2 } from "../game.model";
import { StageAction, StageActionContext } from "./base.action";

export interface StageActionCameraShakeModel {
    time: number;
    strength: Vector2;
}

export class StageActionCameraShake implements StageAction {
    public time = 0.0;
    public strength = new Vector2();

    private elapsedTimeMS = 0;
    private initPos = new Vector2();
    private woken = false;
    public  finished = true;

  constructor(model: StageActionCameraShakeModel) {
    this.time = model.time;
    this.strength = model.strength;
  }

  reset() {
    this.elapsedTimeMS = 0;
    this.finished = false;
    this.woken = false;
  }

  update(deltaMS: number, context: StageActionContext): void {
    if (this.finished) {
        return;
    }

    if (!this.woken) {
        this.initPos.x = context.camera.position.x;
        this.initPos.y = context.camera.position.y;
        this.woken = true;
    }

    let progress = 0.0;

    this.elapsedTimeMS += deltaMS;
    if (this.elapsedTimeMS <= this.time) {
        progress = Math.min(1.0, this.elapsedTimeMS / this.time);
    } else {
        this.finished = true;
        progress = 1.0;
    }

    context.camera.position.x = this.initPos.x + (Math.random() * 2.0 - 1.0) * this.strength.x * (1.0 - progress);
    context.camera.position.y = this.initPos.y + (Math.random() * 2.0 - 1.0) * this.strength.y * (1.0 - progress);
  }
}