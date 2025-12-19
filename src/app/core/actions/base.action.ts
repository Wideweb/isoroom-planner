import { Camera } from "../game.model";

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