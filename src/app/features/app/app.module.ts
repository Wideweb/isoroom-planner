import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppInitService } from './services/app-init.service';
import { AppComponent } from './components/app/app.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgxsModule } from "@ngxs/store";
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { AppSpinnerComponent } from './components/spinner/spinner.component';
import { RouterModule } from '@angular/router';
import { routes } from './routes';
import { MenuScreenComponent } from './components/menu-screen/menu-screen.component';
import { LevelsScreenComponent } from './components/levels-screen/levels-screen.component';
import { GameDataService } from './services/game-data.service';
import { SpinnerService } from './services/spinner.service';
import { GameLevelState } from './states/game-level.state';
import { GameScreenComponent } from './components/game-screen/game-screen.component';
import { GameLevelComponent } from './components/game-screen/game-level/game-level.component';
import { AuthModule } from '../auth/auth.module';
import { LoginScreenComponent } from './components/login-screen/login-screen.component';
import { AuthInterceptor } from '../auth/interceptors/auth.interceptor';
import { ServerErrorInterceptor } from '../common/interceptors/server-error.interceptor';
import { SpinnerInterceptor } from '../common/interceptors/spinner.interceptor';
import { TimezoneInterceptor } from '../common/interceptors/timezone.interceptor';
import { GameProgressState } from './states/game-progress.state';
import { LevelsMapComponent } from './components/levels-screen/levels-map/levels-map.component';
import { FormsModule } from '@angular/forms';
import { AppCommonModule } from "src/app/features/common/common.module";
import { CommonModule } from '@angular/common';
import { ReplenishDeckDialogComponent } from './components/game-screen/replenish-deck-dialog/replenish-deck-dialog.component';

export function initializeAppFactory(appInitService: AppInitService) {
  return (): Promise<any> => {
    return appInitService.init();
  }
}

@NgModule({
  declarations: [
    AppComponent,
    AppSpinnerComponent,
    SplashScreenComponent,
    LoginScreenComponent,
    MenuScreenComponent,
    LevelsScreenComponent,
    LevelsMapComponent,
    GameScreenComponent,
    GameLevelComponent,
    ReplenishDeckDialogComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    NgxsModule.forRoot([GameProgressState, GameLevelState]),
    AuthModule.forRoot(),
    FormsModule,
    AppCommonModule,
    CommonModule
],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [AppInitService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ServerErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimezoneInterceptor,
      multi: true,
    },
    SpinnerService,
    GameDataService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
