import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { patch } from '@ngxs/store/operators';
import { firstValueFrom } from "rxjs";
import { GameLevelListDto } from "../models/game-level-list.model";
import { GameLevelsLoad } from "./game-levels.actions";
import { GameLevelService } from "../services/game-level.service";

export interface GameLevelsStateModel {
  list: GameLevelListDto[];
  loading: boolean;
  loaded: boolean;
  error: any;
}

const defaults = (): GameLevelsStateModel => {
  return {
    list: [],
    loading: false,
    loaded: false,
    error: null,
  }
}

@State<GameLevelsStateModel>({
  name: 'GameLevels',
  defaults: defaults()
})
@Injectable()
export class GameLevelsState {

  @Selector()
  static list(state: GameLevelsStateModel): GameLevelListDto[] {
    return state.list;
  }

  @Selector()
  static loaded(state: GameLevelsStateModel): boolean {
    return state.loaded;
  }

  constructor(private service: GameLevelService) {}

  @Action(GameLevelsLoad)
  async load(ctx: StateContext<GameLevelsStateModel>) {
    ctx.patchState({
      loaded: false,
      loading: true,
    });

    try 
    {
      const list = await firstValueFrom(this.service.loadLevelsList());
      ctx.setState(patch<GameLevelsStateModel>({ list, error: null }));
    } 
    catch(error)
    {
      ctx.setState(patch<GameLevelsStateModel>({ error }));
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