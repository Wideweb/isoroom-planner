import { ModuleWithProviders, NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HasPermissionDirective } from "./directives/has-permission.directive";
import { NoPermissionDirective } from "./directives/no-permission.directive";
import { AuthGuard } from "./guards/auth.guard";
import { NotAuthGuard } from "./guards/not-auth.guard";
import { AuthService } from "./services/auth.service";
import { AuthState } from "./state/auth.state";
import { GoogleLoginProvider, GoogleSigninButtonModule, SocialAuthServiceConfig } from "@abacritt/angularx-social-login";
import { GOOGLE_OATH_CLIENT_ID } from "src/environments/environment";
import { UserLocalService } from "./services/user-local-storage.service";
import { AppCommonModule } from "../common/common.module";

@NgModule({
  declarations: [
    HasPermissionDirective,
    NoPermissionDirective,
  ],
  imports: [
    AppCommonModule.forChild(),
    NgxsModule.forFeature([AuthState]),
    GoogleSigninButtonModule
  ],
  exports: [
    HasPermissionDirective,
    NoPermissionDirective,
    GoogleSigninButtonModule
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(GOOGLE_OATH_CLIENT_ID, {
              oneTapEnabled: false
            }),
          },
        ],
      } as SocialAuthServiceConfig,
    },
  ],
})
export class AuthModule {
  static forRoot(): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
        AuthService,
        AuthGuard,
        NotAuthGuard,
        UserLocalService,
      ]
    };
  }

  static forChild(): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: []
    };
  }
}
