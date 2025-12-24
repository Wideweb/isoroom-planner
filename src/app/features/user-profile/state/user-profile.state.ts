import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { patch } from '@ngxs/store/operators';
import { firstValueFrom } from "rxjs";
import { AuthUserChanged, Logout } from "../../auth/state/auth.actions";
import { UserProfileDto } from "../models/user-profile.model";
import { UserProfileService } from "../services/user-profile.service";
import { UserProfileLoadMe } from "./user-profile.actions";

export interface UserProfileStateModel {
  me: UserProfileDto | null;
  loading: boolean;
  loaded: boolean;
  error: any;
}

const defaults = (): UserProfileStateModel => {
  return {
    me: null,
    loading: false,
    loaded: false,
    error: null,
  }
}

@State<UserProfileStateModel>({
  name: 'UserProfile',
  defaults: defaults()
})
@Injectable()
export class UserProfileState {

  @Selector()
  static me(state: UserProfileStateModel): UserProfileDto | null {
    return state.me;
  }

  @Selector()
  static meName(state: UserProfileStateModel): string {
    return state.me?.name || '';
  }

  @Selector()
  static mePremium(state: UserProfileStateModel): boolean {
    return !!state.me?.premium;
  }

  @Selector()
  static loaded(state: UserProfileStateModel): boolean {
    return state.loaded;
  }

  constructor(private service: UserProfileService, private store: Store) {}

  @Action(UserProfileLoadMe)
  async loadMe(ctx: StateContext<UserProfileStateModel>) {
    ctx.patchState({
      loaded: false,
      loading: true,
    });

    try 
    {
      const userProfile = await firstValueFrom(this.service.getProfileMe());

      ctx.setState(patch<UserProfileStateModel>({ me: userProfile, error: null }));
    } 
    catch(error)
    {
      ctx.setState(patch<UserProfileStateModel>({ error }));
    }
    finally
    {
      ctx.patchState({ 
        loaded: true,
        loading: false,
      });
    }
  }

  @Action([Logout, AuthUserChanged])
  clear(ctx: StateContext<UserProfileStateModel>) {
    ctx.patchState(defaults());
  }
}