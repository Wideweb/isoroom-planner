import * as PIXI from 'pixi.js';
import { ViewAction } from "../actions/base.action";
import { Observable, Subject } from 'rxjs';

export default abstract class BaseView {
    public view = new PIXI.Container();

    protected selectSubject = new Subject<BaseView>();
    public readonly select$: Observable<BaseView> = this.selectSubject.asObservable();
        
    protected actions: ViewAction[] = [];

    addAction(action: ViewAction): ViewAction {
        action.reset();
        this.actions.push(action);
        return action;
    }

    update(deltaMs: number) {
        this.actions.forEach(a => a.update(deltaMs, this.view));
    }

    draw(container: PIXI.Container) {
        container.addChild(this.view);
    }
}