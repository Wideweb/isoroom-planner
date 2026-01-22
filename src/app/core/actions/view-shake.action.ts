import { Vector2 } from "../game.model";
import BaseView from "../views/base.view";
import { ViewAction } from "./base.action";

export interface StageActionViewShakeModel {
    time: number;
    strength: Vector2;
}

export class ViewActionFade extends ViewAction {
    public time: number;
    public strength: Vector2;

    private initPos = new Vector2();

    constructor(model: StageActionViewShakeModel) {
      super();

      this.time = model.time;
      this.strength = model.strength;
    }

    update(deltaMS: number, view: BaseView): void {
      if (this.finished) {
          return;
      }

      if (!this.woken) {
        this.initPos.x = view.container.position.x;
        this.initPos.y = view.container.position.y;
        this.woken = true;
      }

      let progress = 0.0;

      this.elapsedTimeMS += deltaMS;
      if (this.elapsedTimeMS <= this.time) {
          progress = Math.min(1.0, this.elapsedTimeMS / this.time);
      } else {
          this.finish();
          progress = 1.0;
      }

      view.container.position.x = this.initPos.x + (Math.random() * 2.0 - 1.0) * this.strength.x * (1.0 - progress);
      view.container.position.y = this.initPos.y + (Math.random() * 2.0 - 1.0) * this.strength.y * (1.0 - progress);
    }
}