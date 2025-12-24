import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { AuthUserChanged, Logout } from "../../auth/state/auth.actions";
import { UserProfileLoadMe } from "../../user-profile/state/user-profile.actions";
import { CommonLoadUser, CommonLoadUserRating, CommonPremiumLockIssue, CommonTaskSubmited, CommonUserAccountUpdated } from "./common.actions";
import { patch } from "@ngxs/store/operators";
import { LocalService } from "../services/local-storage.service";

export interface CommonStateModel {
  premiumLockIssue: boolean;
}

const defaults = (): CommonStateModel => {
  return {
    premiumLockIssue: false,
  }
}

@State<CommonStateModel>({
  name: 'Common',
  defaults: defaults()
})
@Injectable()
export class CommonState {

  @Selector()
  static premiumLockIssue(state: CommonStateModel): boolean {
    return state.premiumLockIssue;
  }

  constructor(private store: Store, private storage: LocalService) {}

  @Action(CommonTaskSubmited)
  async taskSubmitted(ctx: StateContext<CommonStateModel>, action: CommonTaskSubmited) {
    if (action.accepted) {
      this.store.dispatch(new UserProfileLoadMe());
    }
  }

  @Action(CommonUserAccountUpdated)
  async userAccountUpdated(ctx: StateContext<CommonStateModel>) {
    this.store.dispatch(new UserProfileLoadMe());
  }

  @Action(CommonLoadUser)
  async updateUser(ctx: StateContext<CommonStateModel>) {
    this.store.dispatch(new UserProfileLoadMe());
  }

  @Action(CommonLoadUserRating)
  async updateUserRating(ctx: StateContext<CommonStateModel>) {
    this.store.dispatch(new UserProfileLoadMe());
  }

  @Action(CommonPremiumLockIssue)
  async premiumLockIssue(ctx: StateContext<CommonStateModel>) {
    // this.store.dispatch(new UserProfileLoadMe());
    ctx.setState(patch<CommonStateModel>({ premiumLockIssue: true  }));
    ctx.setState(patch<CommonStateModel>({ premiumLockIssue: false }));
  }

  @Action([Logout, AuthUserChanged])
  clear(ctx: StateContext<CommonStateModel>) {
    ctx.patchState(defaults());
  }
}