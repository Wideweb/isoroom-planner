import { GameLevelSubmitResultDto } from "../models/game-progress.model";

export class GameProgressLoad {
    static readonly type = '[GameProgressLoad] Load';
    constructor(public relaod: boolean = false) {}
}

export class GameProgressLoadLevel {
    static readonly type = '[GameProgressLoad] Load Level';
    constructor(public id: number) {}
}

export class GameProgressLoadNextTask {
    static readonly type = '[GameProgressLoad] Load Next Level';
}

export class GameProgressSubmitLevel {
    static readonly type = '[ModuleProgress] Submit Level';
    constructor(public payload: GameLevelSubmitResultDto) {}
}

export class GameProgressUnselectCurrentTask {
    static readonly type = '[GameProgress] Unselect Current Task';
}