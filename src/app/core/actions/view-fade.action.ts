import { lerp } from "../math.helper";
import BaseView from "../views/base.view";
import { ViewAction } from "./base.action";

export interface StageActionViewAlphaModel {
    time: number;
    from: number;
    to: number;
}

export class ViewActionFade extends ViewAction {
    public time: number;
    public from: number;
    public to: number;

    constructor(model: StageActionViewAlphaModel) {
      super();

      this.time = model.time;
      this.from = model.from;
      this.to = model.to;
    }

    update(deltaMS: number, view: BaseView): void {
      if (this.finished) {
          return;
      }

      if (!this.woken) {
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

      view.container.alpha = lerp(this.from, this.to, progress);
    }
}