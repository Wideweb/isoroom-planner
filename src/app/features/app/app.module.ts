import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppInitService } from './services/app-init.service';
import { AppComponent } from './components/app/app.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgxsModule } from "@ngxs/store";
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { AppSpinnerComponent } from './components/spinner/spinner.component';
import { RouterModule } from '@angular/router';
import { routes } from './routes';
import { GameLevelsState } from './states/game-levels.state';
import { MenuScreenComponent } from './components/menu-screen/menu-screen.component';
import { LevelsScreenComponent } from './components/levels-screen/levels-screen.component';
import { GameLevelService } from './services/game-level.service';
import { SpinnerService } from './services/spinner.service';
import { GameLevelState } from './states/game-level.state';
import { GameScreenComponent } from './components/game-screen/game-screen.component';
import { GameLevelComponent } from './components/game-screen/game-level/game-level.component';

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
    MenuScreenComponent,
    LevelsScreenComponent,
    GameScreenComponent,
    GameLevelComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    NgxsModule.forRoot([GameLevelsState, GameLevelState]),
    MatDialogModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [AppInitService],
      multi: true
    },
    SpinnerService,
    GameLevelService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
