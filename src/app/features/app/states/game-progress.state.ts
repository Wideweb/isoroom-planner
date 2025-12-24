import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { patch, updateItem } from '@ngxs/store/operators';
import { firstValueFrom } from "rxjs";
import { AuthUserChanged, Logout } from "../../auth/state/auth.actions";
import { GameProgressService } from "../services/game-progress.service";
import { GameProgressLoad, GameProgressLoadLevel, GameProgressLoadNextTask, GameProgressSubmitLevel, GameProgressUnselectCurrentTask } from "./game-progress.actions";
import { CommonPremiumLockIssue, CommonTaskSubmited } from "../../common/state/common.actions";
import { UserLocalService } from "../../auth/services/user-local-storage.service";
import { GameLevelProgressDto, GameLevelSubmitResultDto, GameProgressDto } from "../models/game-progress.model";
import { GameLevelData } from "src/app/core/game.model";
import { GameDataService } from "../services/game-data.service";

export interface GameProgressStateModel {
  userProgress: GameProgressDto | null;
  currentLevelId: number,
  currentLevelData: GameLevelData | null,
  levelSubmitResult: GameLevelSubmitResultDto | null,
  levelLoaded: boolean;
  levelLoading: boolean;
  loading: boolean;
  loaded: boolean;
  finished: boolean;
  error: any;
}

const defaults = (): GameProgressStateModel => {
  return {
    userProgress: null,
    currentLevelId: -1,
    currentLevelData: null,
    levelSubmitResult: null,
    levelLoaded: false,
    levelLoading: false,
    loading: false,
    loaded: false,
    finished: false,
    error: null,
  }
}

@State<GameProgressStateModel>({
  name: 'GameProgress',
  defaults: defaults()
})
@Injectable()
export class GameProgressState {

  @Selector()
  static progress(state: GameProgressStateModel): GameProgressDto | null {
    return state.userProgress;
  }

  @Selector()
  static levels(state: GameProgressStateModel): GameLevelProgressDto[] | [] {
    return state.userProgress?.levels || [];
  }

  @Selector()
  static isNextLevelAvailable(state: GameProgressStateModel): boolean {
    if (state.currentLevelId < 0 || !state.userProgress) {
      return false;
    }

    const currentTaskIndex = state.userProgress.levels.findIndex(level => level.id === state.currentLevelId);
    if (currentTaskIndex < 0) {
      return false;
    }

    const isLast = currentTaskIndex == state.userProgress.levels.length - 1;
    if (isLast) {
      return false;
    }

    
    const nextTask = state.userProgress.levels[currentTaskIndex + 1];
    return !nextTask.locked;
  }

  @Selector()
  static isNextPremiumLock(state: GameProgressStateModel): boolean {
    if (state.currentLevelId < 0 || !state.userProgress) {
      return false;
    }

    const currentTaskIndex = state.userProgress.levels.findIndex(level => level.id === state.currentLevelId);
    if (currentTaskIndex < 0) {
      return false;
    }

    const isLast = currentTaskIndex == state.userProgress.levels.length - 1;
    if (isLast) {
      return false;
    }

    
    const nextTask = state.userProgress.levels[currentTaskIndex + 1];
    return nextTask.premiumLock;
  }

  @Selector()
  static isFirstTask(state: GameProgressStateModel): boolean {
    if (state.currentLevelId < 0 || !state.userProgress) {
      return false;
    }

    const currentTaskIndex = state.userProgress.levels.findIndex(level => level.id === state.currentLevelId);
    return currentTaskIndex === 0;
  }

  @Selector()
  static isLastTask(state: GameProgressStateModel): boolean {
    if (state.currentLevelId < 0 || !state.userProgress) {
      return false;
    }

    const index = state.userProgress.levels.findIndex(t => t.id === state.currentLevelId);

    return state.userProgress.levels.length === index + 1;
  }

  @Selector()
  static currentLevelId(state: GameProgressStateModel): number {
    return state.currentLevelId;
  }

  @Selector()
  static currentLevelOrder(state: GameProgressStateModel): number {
    if (!state.userProgress) return -1;
    if (state.currentLevelId < 0) return -1;

    const level = state.userProgress?.levels.find(it => it.id == state.currentLevelId);
    if (!level) return -1;

    return level.order;
  }

  @Selector()
  static currentLevelData(state: GameProgressStateModel): GameLevelData | null {
    return state.currentLevelData;
  }

  @Selector()
  static levelLoaded(state: GameProgressStateModel): boolean {
    return state.levelLoaded;
  }

  @Selector()
  static currentLevelAccepted(state: GameProgressStateModel): boolean {
    if (state.currentLevelId < 0 || !state.userProgress) {
      return false;
    }

    return state.userProgress.levels[state.currentLevelId].accepted;
  }

  @Selector()
  static hasProgress(state: GameProgressStateModel): boolean {
    return !!state.userProgress && state.userProgress.levels.some(it => it.accepted || it.rejected);
  }

  @Selector()
  static finished(state: GameProgressStateModel): boolean {
    return !!state.userProgress && state.finished;
  }

  @Selector()
  static loaded(state: GameProgressStateModel): boolean {
    return state.loaded;
  }

  constructor(
    private gameProgressService: GameProgressService,
    private gameDataService: GameDataService,
    private store: Store) {}

  @Action(GameProgressLoad)
  async load(ctx: StateContext<GameProgressStateModel>, action: GameProgressLoad) {
    if (ctx.getState().loading) {
      return;
    }

    if (ctx.getState().loaded && !action.relaod) {
      return;
    }

    ctx.setState(patch<GameProgressStateModel>({ loaded: false, loading: true }));

    try 
    {
      const userProgress = await firstValueFrom(this.gameProgressService.getUserProgress());
      const finished = !!userProgress && userProgress.levels.every(it => it.accepted);
      ctx.setState(patch<GameProgressStateModel>({
        userProgress,
        finished,
        error: null
      }));
      return module;
    } 
    catch (error)
    {
      ctx.setState(patch<GameProgressStateModel>({ error }));
      throw error;
    }
    finally
    {
      ctx.setState(patch<GameProgressStateModel>({ loaded: true, loading: false }));
    }
  }

  @Action(GameProgressLoadLevel)
  async loadLevel(ctx: StateContext<GameProgressStateModel>, action: GameProgressLoadLevel) {
    if (ctx.getState().levelLoading
     || ctx.getState().currentLevelId == action.id) {
      return;
    }

    ctx.setState(patch<GameProgressStateModel>({ levelLoaded: false, levelLoading: true }));

    try 
    {
      const levelData = await this.gameDataService.loadLevelData(action.id);

      ctx.setState(patch<GameProgressStateModel>({ 
        currentLevelId: action.id,
        currentLevelData: levelData,
        error: null,
        levelLoaded: true,
      }));
      return action.id;
    } 
    catch (error)
    {
      ctx.setState(patch<GameProgressStateModel>({ error }));
      throw error;
    }
    finally
    {
      ctx.setState(patch<GameProgressStateModel>({ levelLoading: false }));
    }
  }

  @Action(GameProgressLoadNextTask)
  async loadNextTask(ctx: StateContext<GameProgressStateModel>) {
    if (ctx.getState().levelLoading) {
      return;
    }

    ctx.setState(patch<GameProgressStateModel>({ levelLoaded: false, levelLoading: true }));

    const userProgress = ctx.getState().userProgress;
    if (!userProgress) {
      throw "App Error: no userProgress";
    }

    try 
    {
      const finished = userProgress.levels.every(it => it.accepted);
      if (finished) {
        ctx.setState(patch<GameProgressStateModel>({ levelLoaded: true, finished: true }));
        return ctx.getState().currentLevelId;
      }


      const curLevelId = ctx.getState().currentLevelId;
      const currLevel = userProgress.levels.find(it => it.id == curLevelId);
      const nextByOrder = currLevel ? userProgress.levels.find(it => it.order > currLevel.order) : null;
      const nextNotAccepted = userProgress.levels.find(it => !it.accepted);
      const nextTask = (nextByOrder && !nextByOrder.locked) ? nextByOrder : nextNotAccepted;

      if (!nextTask) {
        ctx.setState(patch<GameProgressStateModel>({ levelLoaded: true, finished: true }));
        return ctx.getState().currentLevelId;
      }

      if (nextTask.premiumLock) {
        ctx.setState(patch<GameProgressStateModel>({ levelLoaded: true }));
        this.store.dispatch(new CommonPremiumLockIssue());
        return ctx.getState().currentLevelId;
      }

      if (ctx.getState().currentLevelId == nextTask.id) {
        ctx.setState(patch<GameProgressStateModel>({ levelLoaded: true }));
        return ctx.getState().currentLevelId;
      }

      const levelData = await this.gameDataService.loadLevelData(nextTask.id);

      ctx.setState(patch<GameProgressStateModel>({ 
        currentLevelId: nextTask.id,
        currentLevelData: levelData,
        error: null,
        levelLoaded: true,
      }));


      return nextTask.id;
    } 
    catch (error)
    {
      ctx.setState(patch<GameProgressStateModel>({ error }));
      throw error;
    }
    finally
    {
      ctx.setState(patch<GameProgressStateModel>({ levelLoading: false }));
    }
  }

  @Action(GameProgressSubmitLevel)
  async submit(ctx: StateContext<GameProgressStateModel>, action: GameProgressSubmitLevel) {
    ctx.setState(patch<GameProgressStateModel>({ levelSubmitResult: action.payload }));

    const userProgress = ctx.getState().userProgress;
    if (!userProgress) {
      throw "App Error: no userProgress";
    }

    const currentLevelId = ctx.getState().currentLevelId;
    if (currentLevelId < 0) {
      throw "App Error: no currentLevelId";
    }

    const level = userProgress.levels.find(t => t.id == currentLevelId);
    if (!level) {
      throw "App Error: no level";
    }

    try 
    {
      await firstValueFrom(this.gameProgressService.submitLevel(action.payload));

      const accepted = action.payload.accepted;
      const rejected = action.payload.rejected;
      const score = action.payload.score;

      ctx.setState(patch<GameProgressStateModel>({
        userProgress: patch<GameProgressDto>({
          levels: updateItem(it => it?.id == currentLevelId, patch({ 
            accepted,
            rejected,
            score,
          })),
        }),
        levelSubmitResult: {...action.payload},
        error: null
      }));

      const curLevelId = ctx.getState().currentLevelId;
      const currLevel = userProgress.levels.find(it => it.id == curLevelId);
      const nextByOrder = currLevel ? userProgress.levels.find(it => it.order > currLevel.order) : null;

      if (accepted && nextByOrder && nextByOrder.id) {
        ctx.setState(patch<GameProgressStateModel>({
          userProgress: patch<GameProgressDto>({
            levels: updateItem(task => task?.id == nextByOrder?.id, patch({ 
              locked: false
            }))
          }),
        }));
      }

      const finished = !!userProgress && userProgress.levels.every(it => it.accepted);
      if (finished) {
        ctx.setState(patch<GameProgressStateModel>({ finished }));
      }

      this.store.dispatch(new CommonTaskSubmited(accepted));

      return;
    } 
    catch (error)
    {
      ctx.setState(patch<GameProgressStateModel>({ error }));
      throw error;
    }
  }

  @Action(GameProgressUnselectCurrentTask)
  async unselectCurrentTask(ctx: StateContext<GameProgressStateModel>) {
    ctx.setState(patch<GameProgressStateModel>({
      currentLevelId: -1,
      currentLevelData: null,
      error: null,
      levelLoaded: false,
      levelLoading: false,
    }));
  }

  
  // @Action([ModuleProgressSaveTaskChangesLocal])
  // saveTaskChangesLocal(ctx: StateContext<ModuleProgressStateModel>, action: ModuleProgressSaveTaskChangesLocal) {
  //   const localTask = this.findTaskInLocalStorage(action.payload.id);
  //   const isHlsl = action.payload.language == "hlsl";

  //   this.saveTaskInLocalStorage({
  //     id: action.payload.id,
      
  //     glslFragment: isHlsl ? (localTask?.glslFragment || '') : action.payload.fragmentShader,
  //     glslVertex: isHlsl ? (localTask?.glslVertex || '') : action.payload.vertexShader,
  //     glslPostProcess: isHlsl ? (localTask?.glslPostProcess || '') : action.payload.postProcessShader,

  //     hlslFragment: isHlsl ? action.payload.fragmentShader : (localTask?.hlslFragment || ''),
  //     hlslVertex: isHlsl ? action.payload.vertexShader : (localTask?.hlslVertex || ''),
  //     hlslPostProcess: isHlsl ? action.payload.postProcessShader : (localTask?.hlslPostProcess || ''),

  //     properties: action.payload.properties,
  //   })
  // }

  @Action([Logout, AuthUserChanged])
  clear(ctx: StateContext<GameProgressStateModel>) {
    ctx.patchState(defaults());
  }

  // private getUserShaderProgram(taskId: number, remoteTask: UserShaderProgram): UserShaderProgram {
  //   const localTask = this.findTaskInLocalStorage(taskId);

  //   if (remoteTask.language == "hlsl") {
  //     return {
  //       fragment: (localTask && localTask.hlslFragment) ? localTask.hlslFragment : remoteTask.fragment,
  //       vertex: (localTask && localTask.hlslVertex) ? localTask.hlslVertex : remoteTask.vertex,
  //       postProcess: (localTask && localTask.hlslPostProcess) ? localTask.hlslPostProcess : remoteTask.postProcess,
  //       properties: (localTask && localTask.properties) ? localTask.properties : remoteTask.properties,
  //       language: remoteTask.language,
  //       converterVersion: remoteTask.converterVersion,
  //       compile: remoteTask.compile,
  //     }
  //   }

  //   return {
  //     fragment: (localTask && localTask.glslFragment) ? localTask.glslFragment : remoteTask.fragment,
  //     vertex: (localTask && localTask.glslVertex) ? localTask.glslVertex : remoteTask.vertex,
  //     postProcess: (localTask && localTask.glslPostProcess) ? localTask.glslPostProcess : remoteTask.postProcess,
  //     properties: (localTask && localTask.properties) ? localTask.properties : remoteTask.properties,
  //     language: remoteTask.language,
  //     converterVersion: remoteTask.converterVersion,
  //     compile: remoteTask.compile,
  //   }
  // }

  // private findTaskInLocalStorage(taskId: number): LocalStorageTaskData | null {
  //   const userTasks = this.userLocalStorage.getData<{ [id: number]: LocalStorageTaskData }>('userTasks') || {};
  //   return userTasks[taskId];
  // }

  // private saveTaskInLocalStorage(task: LocalStorageTaskData): void {
  //   const userTasks = this.userLocalStorage.getData<{ [id: number]: LocalStorageTaskData }>('userTasks') || {};
  //   userTasks[task.id] = task;
  //   this.userLocalStorage.saveData('userTasks', userTasks);
  // }

  // private deleteTaskInLocalStorage(taskId: number): void {
  //   const userTasks = this.userLocalStorage.getData<{ [id: number]: LocalStorageTaskData }>('userTasks') || {};
  //   delete userTasks[taskId];
  //   this.userLocalStorage.saveData('userTasks', userTasks);
  // }
}