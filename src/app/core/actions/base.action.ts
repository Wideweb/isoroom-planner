import { Camera } from "../game.model";
import * as PIXI from 'pixi.js';

export enum StageActionType {
    RotateCamera,
    MoveCamera,
}

export class ActionModel {
    public type!: StageActionType;
}

export interface StageActionContext {
    camera: Camera;
}

export interface StageAction {
    update(delta: number, context: StageActionContext): void;
}

export abstract class ViewAction {
    protected elapsedTimeMS = 0;
    protected woken = false;
    public    finished = true;

    protected _promise = this.createAwaiter();
    protected _resolve?: () => void;

    abstract update(delta: number, view: PIXI.Container): void;

    get awaiter(): Promise<void> {
      return this._promise;
    }

    public reset() {
        this.elapsedTimeMS = 0;
        this.finished = false;
        this.woken = false;
        this._promise = this.createAwaiter();
    }

    protected finish() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        if (this._resolve) {
            this._resolve();
            this._resolve = undefined;
        }
    }

    protected createAwaiter(): Promise<void> {
        return new Promise<void>(resolve => {
            this._resolve = resolve;
        });
    }
}