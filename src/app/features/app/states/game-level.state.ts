import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { patch } from '@ngxs/store/operators';
import { GameLevelData } from "src/app/core/game.model";
import { GameDataService } from "../services/game-data.service";
import { GameLevelLoadLevel } from "./game-level.actions";

export interface GameLevelStateModel {
  levelData: GameLevelData | null;
  loading: boolean;
  loaded: boolean;
  error: any;
}

const defaults = (): GameLevelStateModel => {
  return {
    levelData: null,
    loading: false,
    loaded: false,
    error: null,
  }
}

@State<GameLevelStateModel>({
  name: 'GameLevel',
  defaults: defaults()
})
@Injectable()
export class GameLevelState {

  @Selector()
  static levelData(state: GameLevelStateModel): GameLevelData | null {
    return state.levelData;
  }

  @Selector()
  static loaded(state: GameLevelStateModel): boolean {
    return state.loaded;
  }

  constructor(private service: GameDataService) {}

  @Action(GameLevelLoadLevel)
  async load(ctx: StateContext<GameLevelStateModel>, action: GameLevelLoadLevel) {
    ctx.patchState({
      loaded: false,
      loading: true,
    });

    try 
    {
      const levelData = await this.service.loadLevelData(action.level);
      ctx.setState(patch<GameLevelStateModel>({ levelData, error: null }));
    } 
    catch(error)
    {
      ctx.setState(patch<GameLevelStateModel>({ error }));
    }
    finally
    {
      ctx.patchState({ 
        loaded: true,
        loading: false,
      });
    }
  }

  // @Action([Logout, AuthUserChanged])
  // clear(ctx: StateContext<ModuleListStateModel>) {
  //   ctx.patchState(defaults());
  // }
}