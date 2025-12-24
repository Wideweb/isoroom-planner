import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NgxsModule } from "@ngxs/store";
import { AuthModule } from "../auth/auth.module";
import { AppCommonModule } from "../common/common.module";
import { UserProfileService } from "./services/user-profile.service";
import { UserProfileState } from "./state/user-profile.state";

@NgModule({
  declarations: [
  ],
  imports: [
    AppCommonModule.forChild(),
    AuthModule.forChild(),
    RouterModule,
    NgxsModule.forFeature([UserProfileState]),
  ],
  providers: [
    UserProfileService,
  ],
})
export class UserProfileModule { }
